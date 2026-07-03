import re
from entropy import calculate_entropy
from breach_checker import check_if_breached

def analyze_password(password: str) -> dict:
    """
    Complete password strength analysis.
    Returns a detailed dictionary with score, feedback, and metadata.
    """
    if not password:
        return {
            "strength_label": "No Password",
            "strength_score": 0,
            "entropy_bits": 0,
            "breached": False,
            "length": 0,
            "feedback": ["Please enter a password to analyze."]
        }
    
    # Basic checks
    length = len(password)
    has_upper = bool(re.search(r'[A-Z]', password))
    has_lower = bool(re.search(r'[a-z]', password))
    has_digit = bool(re.search(r'\d', password))
    has_symbol = bool(re.search(r'[^A-Za-z0-9]', password))
    
    # Advanced checks
    entropy = calculate_entropy(password)
    is_breached = check_if_breached(password)
    
    # Pattern detection
    weak_patterns = ['123', 'abc', 'qwerty', 'admin', 'password', 'letmein', 'welcome']
    has_weak_pattern = any(pattern in password.lower() for pattern in weak_patterns)
    
    # Repeated characters (more than 3 in a row)
    has_repeated = bool(re.search(r'(.)\1{3,}', password))
    
    # Scoring system (0-100)
    score = 0
    
    # Length score
    if length >= 16:
        score += 35
    elif length >= 12:
        score += 25
    elif length >= 8:
        score += 15
    elif length >= 6:
        score += 5
    
    # Character variety score
    variety_score = 0
    if has_upper:
        variety_score += 10
    if has_lower:
        variety_score += 10
    if has_digit:
        variety_score += 10
    if has_symbol:
        variety_score += 15
    score += variety_score
    
    # Entropy bonus
    if entropy >= 80:
        score += 20
    elif entropy >= 60:
        score += 15
    elif entropy >= 40:
        score += 10
    elif entropy >= 20:
        score += 5
    
    # Penalties
    if is_breached:
        score = 0  # Zero if breached in known database
    if has_weak_pattern:
        score = max(0, score - 25)
    if has_repeated:
        score = max(0, score - 15)
    
    # Normalize to 0-100
    score = min(100, max(0, score))
    
    # Strength label
    if score >= 80:
        strength = "Very Strong"
    elif score >= 65:
        strength = "Strong"
    elif score >= 45:
        strength = "Medium"
    elif score >= 25:
        strength = "Weak"
    else:
        strength = "Very Weak"
    
    # Generate feedback messages
    feedback = []
    
    if is_breached:
        feedback.append("🔴 CRITICAL: This password appears in known data breaches!")
        feedback.append("🔴 Change it immediately and never reuse it.")
    
    if length < 12:
        feedback.append("⚠️ Make password at least 12 characters long.")
    
    if not has_upper:
        feedback.append("⚠️ Add uppercase letters (A-Z).")
    if not has_lower:
        feedback.append("⚠️ Add lowercase letters (a-z).")
    if not has_digit:
        feedback.append("⚠️ Add digits (0-9).")
    if not has_symbol:
        feedback.append("⚠️ Add symbols (!@#$%^&*).")
    
    if has_weak_pattern:
        feedback.append("⚠️ Avoid common patterns like '123', 'password', or 'qwerty'.")
    
    if has_repeated:
        feedback.append("⚠️ Avoid repeated characters like 'aaaa'.")
    
    if entropy < 50 and not is_breached:
        feedback.append("⚠️ Too predictable. Avoid dictionary words and names.")
    
    if not feedback or (len(feedback) == 1 and feedback[0].startswith("🔴")):
        if not is_breached:
            feedback.append("✅ Excellent password! Strong entropy and good variety.")
            feedback.append("✅ Keep it safe, don't reuse it elsewhere.")
    
    return {
        "strength_label": strength,
        "strength_score": score,
        "entropy_bits": entropy,
        "breached": is_breached,
        "length": length,
        "has_upper": has_upper,
        "has_lower": has_lower,
        "has_digit": has_digit,
        "has_symbol": has_symbol,
        "has_weak_pattern": has_weak_pattern,
        "feedback": feedback[:6]  # Limit to 6 feedback items
    }