from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class Verdict(str, Enum):
    SAFE = "SAFE"
    SUSPICIOUS = "SUSPICIOUS"
    PHISHING = "PHISHING"


class AnalyzeRequest(BaseModel):
    url: Optional[str] = Field(None, description="URL to analyze")
    page_text: Optional[str] = Field(None, description="Page text content")
    screenshot: Optional[str] = Field(None, description="Base64 encoded screenshot")
    email_from: Optional[str] = Field(None, description="Email sender")
    email_subject: Optional[str] = Field(None, description="Email subject")
    email_body: Optional[str] = Field(None, description="Email body")


class AnalysisResult(BaseModel):
    verdict: Verdict
    score: float = Field(..., ge=0, le=1)
    confidence: float = Field(..., ge=0, le=1)
    flags: List[str] = []
    details: Dict[str, Any] = {}
    recommendations: List[str] = []
    timestamp: datetime = Field(default_factory=datetime.now)


class TrainingSample(BaseModel):
    id: int
    category: str  # 'phishing' or 'legitimate'
    sender: str
    subject: str
    body: str
    url: Optional[str] = None
    red_flags: List[str] = []
    explanation: str
    difficulty: int = Field(..., ge=1, le=5)


class TrainingAttempt(BaseModel):
    sample_id: int
    identified_flags: List[str]


class TrainingAttemptResult(BaseModel):
    is_correct: bool
    score: float
    precision: float
    recall: float
    correct_flags: List[str]
    identified_flags: List[str]
    missed_flags: List[str]
    false_flags: List[str]


class ReportRequest(BaseModel):
    url: str
    verdict: Verdict
    reason: str
    user_id: Optional[str] = None


class StatsResponse(BaseModel):
    total_scans: int
    phishing_detected: int
    safe_detected: int
    suspicious_detected: int
    detection_rate: float
    average_response_time: float
    top_flags: List[Dict[str, int]]
