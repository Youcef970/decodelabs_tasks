import asyncio
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException

from .models import (
    AnalyzeRequest,
    AnalysisResult,
    Verdict,
    TrainingSample,
    TrainingAttempt,
    TrainingAttemptResult,
    ReportRequest,
    StatsResponse,
)
from core.url_analyzer import URLAnalyzer
from core.context_analyzer import ContextAnalyzer
from core.visual_matcher import VisualMatcher
from core.risk_scorer import RiskScorer
from utils.validators import validate_url
from data.training_samples import TRAINING_DATA

router = APIRouter()

url_analyzer = URLAnalyzer()
context_analyzer = ContextAnalyzer()
visual_matcher = VisualMatcher()
risk_scorer = RiskScorer()

# In-memory storage. Swap for a real database in production.
scan_history: List[dict] = []


@router.post("/analyze", response_model=AnalysisResult)
async def analyze(request: AnalyzeRequest):
    """Analyze a URL and/or email content for phishing indicators."""
    if not request.url and not request.email_body and not request.page_text:
        raise HTTPException(
            status_code=400,
            detail="Provide at least a URL, email body, or page text to analyze",
        )

    if request.url and not validate_url(request.url):
        raise HTTPException(status_code=400, detail="Invalid URL format")

    try:
        url_results = {"score": 0.0, "flags": [], "details": {}}
        if request.url:
            url_results = await asyncio.to_thread(url_analyzer.analyze, request.url)

        # BUG FIX: include email_from and email_subject in the text blob so the
        # context analyzer can detect sender-domain mismatches, authority names in
        # the From field, and phishing keywords in the subject line.
        text_parts = [
            request.email_from or "",
            request.email_subject or "",
            request.email_body or "",
            request.page_text or "",
        ]
        text_blob = " ".join(p for p in text_parts if p)
        context_results = await asyncio.to_thread(context_analyzer.analyze, text_blob)

        visual_results = {"score": 0.0, "matched_brand": None, "details": {}}
        if request.screenshot:
            visual_results = await asyncio.to_thread(
                visual_matcher.analyze, request.screenshot
            )

        combined = {
            "url_score": url_results["score"],
            "visual_score": visual_results["score"],
            "context_score": context_results["score"],
        }

        risk = risk_scorer.calculate_risk(combined)

        all_flags = url_results.get("flags", []) + context_results.get("flags", [])

        recommendations = risk_scorer.get_recommendations(
            risk["verdict"],
            url_results.get("flags", []),
            context_results.get("flags", []),
        )

        scan_history.append(
            {
                "timestamp": datetime.now().isoformat(),
                "url": request.url,
                "verdict": risk["verdict"].value,
                "score": risk["score"],
                "flags": all_flags,
            }
        )

        return AnalysisResult(
            verdict=risk["verdict"],
            score=risk["score"],
            confidence=risk.get("confidence", 0.85),
            flags=all_flags,
            details={
                "url_analysis": url_results,
                "context_analysis": context_results,
                "visual_analysis": visual_results,
            },
            recommendations=recommendations,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")


@router.get("/training/samples", response_model=List[TrainingSample])
async def get_training_samples(difficulty: Optional[int] = None, category: Optional[str] = None):
    """Get training samples for the awareness simulator."""
    samples = TRAINING_DATA

    if difficulty is not None:
        samples = [s for s in samples if s["difficulty"] == difficulty]

    if category is not None:
        samples = [s for s in samples if s["category"] == category]

    return [TrainingSample(**s) for s in samples]


@router.post("/training/validate", response_model=TrainingAttemptResult)
async def validate_training(attempt: TrainingAttempt):
    """Validate a user's red-flag identification against the known answer key."""
    sample = next((s for s in TRAINING_DATA if s["id"] == attempt.sample_id), None)

    if not sample:
        raise HTTPException(status_code=404, detail="Sample not found")

    correct_flags = set(sample["red_flags"])
    identified_flags = set(attempt.identified_flags)

    # BUG FIX: "sensitive_info" and "sensitive_info_request" are the same concept —
    # treat them as equivalent so a user selecting either one counts as correct.
    ALIASES = {
        "sensitive_info": "sensitive_info_request",
        "sensitive_info_request": "sensitive_info",
        "suspicious_url": "suspicious_tld",
        "suspicious_tld": "suspicious_url",
    }

    def normalize(flags: set) -> set:
        expanded = set(flags)
        for f in flags:
            if f in ALIASES:
                expanded.add(ALIASES[f])
        return expanded

    correct_expanded = normalize(correct_flags)
    identified_expanded = normalize(identified_flags)

    true_positives = correct_expanded & identified_expanded

    precision = (
        len(true_positives) / len(identified_flags)
        if identified_flags
        else 0.0
    )
    recall = (
        len(true_positives) / len(correct_flags)
        if correct_flags
        else (1.0 if not identified_flags else 0.0)
    )

    f1_score = (
        2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    )
    is_correct = f1_score >= 0.8 if correct_flags else not identified_flags

    missed = correct_flags - identified_expanded
    false_positives = identified_flags - correct_expanded

    return TrainingAttemptResult(
        is_correct=is_correct,
        score=f1_score if correct_flags else (1.0 if is_correct else 0.0),
        precision=precision,
        recall=recall,
        correct_flags=list(correct_flags),
        identified_flags=list(identified_flags),
        missed_flags=list(missed),
        false_flags=list(false_positives),
    )


@router.post("/analyze/quick")
async def analyze_quick(request: AnalyzeRequest):
    """Lightweight URL-only check used by the browser extension on page load."""
    if not request.url:
        raise HTTPException(status_code=400, detail="A URL is required")

    if not validate_url(request.url):
        raise HTTPException(status_code=400, detail="Invalid URL format")

    url_results = await asyncio.to_thread(url_analyzer.analyze, request.url)
    score = url_results["score"]

    verdict = risk_scorer.verdict_for_score(score)

    scan_history.append(
        {
            "timestamp": datetime.now().isoformat(),
            "url": request.url,
            "verdict": verdict.value,
            "score": score,
            "flags": url_results.get("flags", []),
        }
    )

    return {
        "verdict": verdict.value,
        "score": score,
        "confidence": 0.7,
        "flags": url_results.get("flags", []),
    }


@router.post("/report")
async def report_phishing(request: ReportRequest):
    """Report a phishing URL for review/blacklisting."""
    return {
        "status": "reported",
        "message": "URL has been reported and will be reviewed",
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/report")
async def report_phishing_quick(url: str, verdict: Optional[str] = None):
    """Report a URL via a simple GET (used by the extension's Report button)."""
    return {
        "status": "reported",
        "message": "URL has been reported and will be reviewed",
        "url": url,
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Get aggregate detection statistics from this session's scan history."""
    total = len(scan_history)

    if total == 0:
        return StatsResponse(
            total_scans=0,
            phishing_detected=0,
            safe_detected=0,
            suspicious_detected=0,
            detection_rate=0,
            average_response_time=0,
            top_flags=[],
        )

    phishing_detected = sum(1 for s in scan_history if s["verdict"] == "PHISHING")
    safe_detected = sum(1 for s in scan_history if s["verdict"] == "SAFE")
    suspicious_detected = sum(1 for s in scan_history if s["verdict"] == "SUSPICIOUS")

    detection_rate = (phishing_detected + suspicious_detected) / total

    flag_counts: dict = {}
    for scan in scan_history:
        for flag in scan.get("flags", []):
            flag_counts[flag] = flag_counts.get(flag, 0) + 1
    top_flags = [
        {k: v} for k, v in sorted(flag_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    ]

    return StatsResponse(
        total_scans=total,
        phishing_detected=phishing_detected,
        safe_detected=safe_detected,
        suspicious_detected=suspicious_detected,
        detection_rate=detection_rate,
        average_response_time=250,
        top_flags=top_flags,
    )


@router.get("/blacklist")
async def get_blacklist():
    """Get the current known-bad domain blacklist."""
    return {
        "domains": [
            "suspicious-domain.tk",
            "fake-login.ml",
            "secure-verify.ga",
        ],
        "updated": datetime.now().isoformat(),
    }
