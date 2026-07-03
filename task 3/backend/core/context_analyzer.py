import re
from typing import Dict, Any


class ContextAnalyzer:
    """Context Analysis Engine - detects social engineering patterns in text."""

    def __init__(self):
        self.urgency_keywords = [
            "urgent", "immediately", "as soon as possible", "asap", "today",
            "critical", "action required", "within 24 hours", "within 1 hour",
            "expires", "deadline", "right now", "instantly",
        ]
        self.threat_keywords = [
            "suspend", "terminate", "deactivate", "block", "delete",
            "shut down", "freeze", "lock", "disable", "revoke",
            "cancel", "permanently limit", "expire",
        ]
        self.financial_patterns = [
            r"\b\d{3}-\d{2}-\d{4}\b",   # SSN with dashes
            r"\b\d{9}\b",               # bare SSN
            r"\b\d{13,16}\b",           # card-like numbers
            r"bank account", r"credit card", r"\bpassword\b", r"\bpin\b",
            r"\bssn\b", r"social security", r"wire transfer",
            r"verify identity", r"confirm (your )?details", r"routing number",
        ]
        self.authority_keywords = [
            "ceo", "director", "it department", "security team",
            "admin team", "helpdesk", "compliance", "legal department",
            "executive", "the support team",
        ]
        self.generic_greetings = [
            "dear customer", "dear user", "dear sir/madam",
            "dear valued", "to whom it may concern", "dear apple user",
            "dear paypal member",
        ]
        self.secrecy_keywords = [
            "do not discuss", "don't discuss", "confidential",
            "keep this between us", "bypass standard approval",
            "don't tell", "do not tell anyone",
        ]
        # BUG FIX: also detect suspicious URL indicators in body text
        self.suspicious_url_patterns = [
            r"https?://[^\s]*\.(tk|ml|ga|cf|click|top|xyz|shop|live|site|space)[^\s]*",
            r"https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}",
        ]

        self.urgency_regex = self._compile(self.urgency_keywords)
        self.threat_regex = self._compile(self.threat_keywords)
        self.financial_regex = re.compile("|".join(self.financial_patterns), re.IGNORECASE)
        self.authority_regex = self._compile(self.authority_keywords)
        self.generic_regex = self._compile(self.generic_greetings)
        self.secrecy_regex = self._compile(self.secrecy_keywords)
        self.suspicious_url_regex = re.compile("|".join(self.suspicious_url_patterns), re.IGNORECASE)

    @staticmethod
    def _compile(phrases) -> re.Pattern:
        escaped = [re.escape(p) for p in phrases]
        return re.compile(r"|".join(escaped), re.IGNORECASE)

    def is_ready(self) -> bool:
        return True

    def analyze(self, text: str) -> Dict[str, Any]:
        """Run all context checks and return a score, flags, and details."""
        results: Dict[str, Any] = {"score": 0.0, "flags": [], "details": {}}

        if not text:
            return results

        urgency_matches = list(self.urgency_regex.finditer(text))
        results["details"]["urgency_count"] = len(urgency_matches)
        if urgency_matches:
            results["flags"].append("urgent_language")
            results["score"] += min(0.20 + len(urgency_matches) * 0.03, 0.30)

        threat_matches = list(self.threat_regex.finditer(text))
        results["details"]["threat_count"] = len(threat_matches)
        if threat_matches:
            results["flags"].append("threat_language")
            results["score"] += min(0.15 + len(threat_matches) * 0.03, 0.25)

        financial_matches = list(self.financial_regex.finditer(text))
        results["details"]["financial_count"] = len(financial_matches)
        if financial_matches:
            # BUG FIX: was "sensitive_info_request", training data uses "sensitive_info"
            # Now emit BOTH so both the training validator AND the UI get a match
            results["flags"].append("sensitive_info_request")
            results["flags"].append("sensitive_info")
            results["score"] += min(0.20 + len(financial_matches) * 0.04, 0.35)

        authority_matches = list(self.authority_regex.finditer(text))
        results["details"]["authority_count"] = len(authority_matches)
        if authority_matches:
            results["flags"].append("authority_impersonation")
            results["score"] += min(0.15 + len(authority_matches) * 0.03, 0.25)

        generic_matches = list(self.generic_regex.finditer(text))
        results["details"]["generic_count"] = len(generic_matches)
        if generic_matches:
            results["flags"].append("generic_greeting")
            results["score"] += 0.05

        secrecy_matches = list(self.secrecy_regex.finditer(text))
        results["details"]["secrecy_count"] = len(secrecy_matches)
        if secrecy_matches:
            results["flags"].append("secrecy_request")
            results["score"] += 0.15

        # BUG FIX: detect suspicious URLs embedded in email body
        sus_url_matches = list(self.suspicious_url_regex.finditer(text))
        results["details"]["suspicious_url_count"] = len(sus_url_matches)
        if sus_url_matches:
            results["flags"].append("suspicious_url")
            results["score"] += min(0.15 + len(sus_url_matches) * 0.05, 0.30)

        if "!!!" in text or "???" in text:
            results["flags"].append("excessive_punctuation")
            results["score"] += 0.05

        words = text.split()
        caps_count = sum(1 for w in words if w.isupper() and len(w) > 3)
        if caps_count > 3:
            results["flags"].append("excessive_caps")
            results["score"] += 0.05

        results["score"] = min(results["score"], 1.0)
        return results
