from typing import Dict, Any, List
from enum import Enum


class Verdict(str, Enum):
    SAFE = "SAFE"
    SUSPICIOUS = "SUSPICIOUS"
    PHISHING = "PHISHING"


class RiskScorer:
    """Risk Scoring Engine - combines detection scores into a final verdict."""

    def __init__(self):
        self.full_weights = {
            "url_score": 0.40,
            "visual_score": 0.35,
            "context_score": 0.25,
        }
        self.thresholds = {
            "safe": 0.3,
            "suspicious": 0.65,
        }

    def verdict_for_score(self, score: float) -> Verdict:
        """Map a single 0-1 score directly to a verdict."""
        if score < self.thresholds["safe"]:
            return Verdict.SAFE
        elif score < self.thresholds["suspicious"]:
            return Verdict.SUSPICIOUS
        return Verdict.PHISHING

    def calculate_risk(self, scores: Dict[str, float]) -> Dict[str, Any]:
        url_score = scores.get("url_score", 0.0)
        visual_score = scores.get("visual_score", 0.0)
        context_score = scores.get("context_score", 0.0)

        # BUG FIX: When some engines produce 0 (no input provided), redistribute
        # their weight across the engines that DID receive input so the score
        # isn't artificially diluted.  Example: email-only analysis (no URL, no
        # screenshot) was capped at 25% of its true signal because the URL/visual
        # weights (75%) were multiplied by 0.
        has_url = url_score > 0
        has_visual = visual_score > 0
        has_context = context_score > 0

        active = []
        if has_url:
            active.append(("url_score", url_score, self.full_weights["url_score"]))
        if has_visual:
            active.append(("visual_score", visual_score, self.full_weights["visual_score"]))
        if has_context:
            active.append(("context_score", context_score, self.full_weights["context_score"]))

        if not active:
            final_score = 0.0
        else:
            total_weight = sum(w for _, _, w in active)
            final_score = sum(s * w for _, s, w in active) / total_weight

        if visual_score > 0.8:
            final_score = min(final_score + 0.15, 1.0)

        if final_score < self.thresholds["safe"]:
            verdict = Verdict.SAFE
        elif final_score < self.thresholds["suspicious"]:
            verdict = Verdict.SUSPICIOUS
        else:
            verdict = Verdict.PHISHING

        confidence = self.calculate_confidence(scores)

        return {
            "score": round(final_score, 4),
            "verdict": verdict,
            "confidence": round(confidence, 4),
            "components": {
                "url": url_score,
                "visual": visual_score,
                "context": context_score,
            },
        }

    def calculate_confidence(self, scores: Dict[str, float]) -> float:
        """Confidence is higher when the engines agree (low variance)."""
        active_scores = [v for v in scores.values() if v > 0]
        if not active_scores:
            return 0.5
        if len(active_scores) == 1:
            # Only one engine fired — medium confidence
            return 0.70

        avg = sum(active_scores) / len(active_scores)
        variance = sum((s - avg) ** 2 for s in active_scores) / len(active_scores)
        return max(1 - min(variance * 3, 1), 0)

    def get_recommendations(
        self, verdict: Verdict, url_flags: List[str], context_flags: List[str]
    ) -> List[str]:
        recommendations: List[str] = []

        if verdict == Verdict.SAFE:
            recommendations.append("This appears to be a legitimate URL")
            recommendations.append("Continue with normal usage")

        elif verdict == Verdict.SUSPICIOUS:
            recommendations.append("Exercise caution when interacting with this content")
            recommendations.append("Verify the sender's identity through alternative channels")
            recommendations.append("Avoid entering any personal or financial information")
            if url_flags:
                recommendations.append(f"Detected: {', '.join(url_flags[:3])}")

        elif verdict == Verdict.PHISHING:
            recommendations.append("Do not interact with this URL or provide any information")
            recommendations.append("Report this to your security team immediately")
            recommendations.append("Delete the suspicious email if applicable")
            recommendations.append("Do not forward the suspicious content")
            if url_flags:
                recommendations.append(f"Critical flags: {', '.join(url_flags)}")
            if context_flags:
                # deduplicate duplicate flag names (sensitive_info / sensitive_info_request)
                unique = list(dict.fromkeys(context_flags))
                recommendations.append(f"Context flags: {', '.join(unique)}")

        return recommendations
