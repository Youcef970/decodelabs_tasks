import secrets
import string

def generate_strong_password(length: int = 16) -> str:
    """
    Generate a cryptographically secure password.
    Uses secrets module (not random) — this is critical for security.
    """
    if length < 12:
        length = 12
    
    # Allowed characters
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    symbols = "!@#$%^&*"
    
    # Ensure at least one of each type
    password_chars = [
        secrets.choice(lowercase),
        secrets.choice(uppercase),
        secrets.choice(digits),
        secrets.choice(symbols),
    ]
    
    # Fill the rest randomly from all character sets
    all_chars = lowercase + uppercase + digits + symbols
    password_chars.extend(secrets.choice(all_chars) for _ in range(length - 4))
    
    # Shuffle to avoid predictable pattern (first 4 chars are the guaranteed ones)
    for i in range(len(password_chars) - 1, 0, -1):
        j = secrets.randbelow(i + 1)
        password_chars[i], password_chars[j] = password_chars[j], password_chars[i]
    
    return ''.join(password_chars)