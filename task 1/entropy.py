import math

def calculate_entropy(password: str) -> float:
    """
    Calculate password entropy in bits.
    Higher = stronger = more guesses needed to crack.
    """
    if not password:
        return 0.0
    
    charset_size = 0
    has_lower = any(c.islower() for c in password)
    has_upper = any(c.isupper() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_symbol = any(not c.isalnum() for c in password)
    
    if has_lower:
        charset_size += 26
    if has_upper:
        charset_size += 26
    if has_digit:
        charset_size += 10
    if has_symbol:
        charset_size += 32  # Common symbols: !@#$%^&*()_+-=[]{}|;:,.<>?~
    
    if charset_size == 0:
        return 0.0
    
    entropy = len(password) * math.log2(charset_size)
    return round(entropy, 2)