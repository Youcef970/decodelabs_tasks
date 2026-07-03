import re
import math
from typing import Dict, Any
from urllib.parse import urlparse


class URLAnalyzer:
    """URL Forensics Engine - analyzes URL structure for phishing indicators."""

    def __init__(self):
        self.suspicious_tlds = {
            ".tk", ".ml", ".ga", ".cf", ".click", ".top",
            ".xyz", ".club", ".online", ".site", ".space",
            ".world", ".shop", ".tech", ".live",
        }
        self.brand_domains = {
            "netflix.com", "paypal.com", "microsoft.com",
            "google.com", "facebook.com", "amazon.com",
            "apple.com", "bankofamerica.com", "chase.com",
            "linkedin.com",
        }
        self.brand_names = [
            "netflix", "paypal", "microsoft", "google",
            "facebook", "amazon", "apple", "bankofamerica",
            "chase", "linkedin",
        ]
        # Matches non-ASCII characters, a simple proxy for IDN homograph attacks
        self.idn_pattern = re.compile(r"[^\x00-\x7F]")
        # Redirect-style query params, matched as whole param names (not substrings)
        self.redirect_param_pattern = re.compile(
            r"[?&](redirect|url|link|goto|next|return)=", re.IGNORECASE
        )
        self.ip_pattern = re.compile(r"^(\d{1,3}\.){3}\d{1,3}$")

    def is_ready(self) -> bool:
        return True

    def analyze(self, url: str) -> Dict[str, Any]:
        """Run all URL forensic checks and return a score, flags, and details."""
        results: Dict[str, Any] = {"score": 0.0, "flags": [], "details": {}}

        if not url:
            return results

        parsed = urlparse(url)
        domain = parsed.netloc.split(":")[0]  # strip port
        path = parsed.path or ""

        results["details"]["idn_homograph"] = self.detect_idn_homograph(domain)
        if results["details"]["idn_homograph"]:
            results["flags"].append("idn_homograph")
            results["score"] += 0.30

        entropy = self.calculate_entropy(domain)
        results["details"]["entropy"] = round(entropy, 2)
        if entropy > 4.0:
            results["flags"].append("high_entropy")
            results["score"] += 0.25

        results["details"]["suspicious_tld"] = self.check_suspicious_tld(domain)
        if results["details"]["suspicious_tld"]:
            results["flags"].append("suspicious_tld")
            results["score"] += 0.20

        results["details"]["is_ip"] = self.is_ip_address(domain)
        if results["details"]["is_ip"]:
            results["flags"].append("ip_address")
            results["score"] += 0.35

        results["details"]["brand_in_subdomain"] = self.check_subdomain_abuse(domain)
        if results["details"]["brand_in_subdomain"]:
            results["flags"].append("brand_impersonation")
            results["score"] += 0.30

        results["details"]["path_length"] = len(path)
        if len(path) > 100:
            results["flags"].append("excessive_path_length")
            results["score"] += 0.15

        results["details"]["has_redirect"] = self.check_redirects(url)
        if results["details"]["has_redirect"]:
            results["flags"].append("redirect_chain")
            results["score"] += 0.20

        results["details"]["uses_https"] = parsed.scheme == "https"
        if parsed.scheme != "https" and parsed.scheme:
            results["flags"].append("insecure_protocol")
            results["score"] += 0.10

        results["score"] = min(results["score"], 1.0)
        return results

    def detect_idn_homograph(self, domain: str) -> bool:
        """Detect non-ASCII characters that could indicate a homograph attack."""
        return bool(self.idn_pattern.search(domain))

    def calculate_entropy(self, domain: str) -> float:
        """Calculate Shannon entropy of the domain name (excluding the TLD)."""
        if not domain:
            return 0.0

        parts = domain.split(".")
        domain_name = ".".join(parts[:-1]) if len(parts) >= 2 else domain
        if not domain_name:
            return 0.0

        freq: Dict[str, int] = {}
        for char in domain_name:
            freq[char] = freq.get(char, 0) + 1

        length = len(domain_name)
        entropy = 0.0
        for count in freq.values():
            probability = count / length
            entropy -= probability * math.log2(probability)

        return entropy

    def check_suspicious_tld(self, domain: str) -> bool:
        return any(domain.endswith(tld) for tld in self.suspicious_tlds)

    def is_ip_address(self, domain: str) -> bool:
        return bool(self.ip_pattern.match(domain))

    def check_subdomain_abuse(self, domain: str) -> bool:
        """Detect a brand name embedded in a domain that isn't the brand's real domain."""
        normalized = domain.replace("-", "").replace("_", "").lower()
        is_official = any(domain.endswith(d) for d in self.brand_domains)
        if is_official:
            return False
        return any(brand in normalized for brand in self.brand_names)

    def check_redirects(self, url: str) -> bool:
        """Check for open-redirect-style query parameters."""
        return bool(self.redirect_param_pattern.search(url))
