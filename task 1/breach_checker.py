import requests
import hashlib

def check_if_breached(password: str) -> bool:
    """
    Check if password appears in known data breaches.
    Uses Have I Been Pwned API with k-Anonymity.
    Your password NEVER leaves your computer — only first 5 chars of hash.
    """
    if not password:
        return False
    
    # Create SHA-1 hash of the password
    sha1_hash = hashlib.sha1(password.encode()).hexdigest().upper()
    prefix = sha1_hash[:5]   # First 5 chars (k-Anonymity)
    suffix = sha1_hash[5:]   # The rest to match locally
    
    try:
        # Query HIBP API
        url = f"https://api.pwnedpasswords.com/range/{prefix}"
        response = requests.get(url, timeout=5)
        
        if response.status_code != 200:
            return False  # API error, assume not breached (fail safe)
        
        # Check if our suffix appears in response
        hashes = [line.split(':')[0] for line in response.text.splitlines()]
        return suffix in hashes
    
    except:
        # Network error — return False (fail safe, don't block user)
        return False