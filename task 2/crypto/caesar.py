"""
Classic Caesar Cipher – Core Fundamentals
Shift-based substitution cipher with brute-force demonstration.
"""

def caesar_encrypt(text: str, shift: int) -> str:
    """
    Encrypt plaintext using Caesar cipher with given shift.
    Preserves case, ignores non-alphabetic characters.
    """
    result = []
    for char in text:
        if char.isupper():
            # Shift within A-Z (ASCII 65-90)
            result.append(chr((ord(char) - 65 + shift) % 26 + 65))
        elif char.islower():
            # Shift within a-z (ASCII 97-122)
            result.append(chr((ord(char) - 97 + shift) % 26 + 97))
        else:
            result.append(char)  # Keep spaces, punctuation
    return ''.join(result)


def caesar_decrypt(text: str, shift: int) -> str:
    """Decrypt by shifting in reverse."""
    return caesar_encrypt(text, -shift)


def brute_force_caesar(ciphertext: str) -> list:
    """
    Try all 25 possible shifts and return all results.
    Demonstrates why Caesar is insecure.
    """
    results = []
    for shift in range(1, 26):
        decrypted = caesar_decrypt(ciphertext, shift)
        results.append({
            "shift": shift,
            "text": decrypted
        })
    return results


def caesar_shift_demo(plaintext: str, shift: int) -> dict:
    """
    Show the step-by-step transformation for educational purposes.
    """
    steps = []
    for char in plaintext:
        if char.isupper():
            original_ascii = ord(char)
            shifted_ascii = (original_ascii - 65 + shift) % 26 + 65
            steps.append({
                "char": char,
                "ascii": original_ascii,
                "shifted_ascii": shifted_ascii,
                "result": chr(shifted_ascii),
                "formula": f"({original_ascii} - 65 + {shift}) % 26 + 65 = {shifted_ascii}"
            })
        elif char.islower():
            original_ascii = ord(char)
            shifted_ascii = (original_ascii - 97 + shift) % 26 + 97
            steps.append({
                "char": char,
                "ascii": original_ascii,
                "shifted_ascii": shifted_ascii,
                "result": chr(shifted_ascii),
                "formula": f"({original_ascii} - 97 + {shift}) % 26 + 97 = {shifted_ascii}"
            })
        else:
            steps.append({
                "char": char,
                "ascii": ord(char) if char else 0,
                "shifted_ascii": ord(char) if char else 0,
                "result": char,
                "formula": "unchanged (non-alphabetic)"
            })
    return {"steps": steps, "result": caesar_encrypt(plaintext, shift)}