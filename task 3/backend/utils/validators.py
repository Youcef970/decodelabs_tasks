import re
from urllib.parse import urlparse

_URL_PATTERN = re.compile(
    r"^https?://"
    r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,24}\.?"  # domain
    r"|localhost"
    r"|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"  # IPv4
    r"(?::\d+)?"
    r"(?:[/?]\S*)?$",
    re.IGNORECASE,
)


def validate_url(url: str) -> bool:
    """Validate a URL has a sane http(s) structure."""
    if not url or not isinstance(url, str):
        return False
    return bool(_URL_PATTERN.match(url.strip()))


def extract_domain(url: str) -> str:
    parsed = urlparse(url)
    return parsed.netloc


def normalize_url(url: str) -> str:
    return url.strip().rstrip("/").lower()
