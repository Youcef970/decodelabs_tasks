"""
Security Metrics: Avalanche Effect, Entropy, Histogram, Key Sensitivity
FIXED: Histogram always returns 256 counts.
FIXED: Avalanche only flips bits in original data (not padding).
"""

import math
import numpy as np
from .cipher import encrypt_bytes, decrypt_bytes, BLOCK_SIZE
from .sbox import generate_sbox
from .chaotic import logistic_map, seed_from_password


def hamming_distance(b1: bytes, b2: bytes) -> int:
    """Compute the Hamming distance (bit difference) between two byte strings."""
    min_len = min(len(b1), len(b2))
    dist = 0
    for i in range(min_len):
        dist += bin(b1[i] ^ b2[i]).count('1')
    # Remaining bytes are considered all differing bits
    if len(b1) > min_len:
        for b in b1[min_len:]:
            dist += bin(b).count('1')
    if len(b2) > min_len:
        for b in b2[min_len:]:
            dist += bin(b).count('1')
    return dist


def avalanche_effect(plaintext: str, password: str, num_tests: int = 15) -> dict:
    """
    Test avalanche effect by flipping one bit in the plaintext bytes.
    FIXED: Only flips bits within the original text length (ignores padding).
    """
    plaintext_bytes = plaintext.encode('utf-8')
    original_len = len(plaintext_bytes)
    
    # If text is empty, make it 16 bytes of zeros for the test
    if original_len == 0:
        plaintext_bytes = b'\x00' * 16
        original_len = 16

    # Encrypt original (using bytes directly)
    enc_orig = encrypt_bytes(plaintext_bytes, password)
    orig_len = len(enc_orig)

    total_changes = 0
    valid_tests = 0

    for _ in range(num_tests):
        # CRITICAL FIX: Only flip bits in the ORIGINAL data, not the padding
        byte_idx = np.random.randint(0, original_len)
        bit_idx = np.random.randint(0, 8)
        
        modified = bytearray(plaintext_bytes)
        modified[byte_idx] ^= (1 << bit_idx)

        try:
            enc_mod = encrypt_bytes(bytes(modified), password)
            # Ensure same length by truncating or padding
            if len(enc_mod) < orig_len:
                enc_mod = enc_mod + b'\x00' * (orig_len - len(enc_mod))
            elif len(enc_mod) > orig_len:
                enc_mod = enc_mod[:orig_len]

            dist = hamming_distance(enc_orig, enc_mod)
            total_changes += dist
            valid_tests += 1
        except Exception:
            continue

    if valid_tests == 0:
        return {"avg_bit_changes": 0, "total_bits": orig_len * 8, "percent": 0, "ideal": 50.0}

    total_bits = orig_len * 8
    avg_changes = total_changes / valid_tests
    avg_percent = (avg_changes / total_bits) * 100 if total_bits > 0 else 0

    return {
        "avg_bit_changes": round(avg_changes, 2),
        "total_bits": total_bits,
        "percent": round(avg_percent, 2),
        "ideal": 50.0
    }


def shannon_entropy(data: bytes) -> float:
    """Compute the Shannon entropy of a byte sequence."""
    if not data:
        return 0.0
    counts = np.bincount(list(data))
    probabilities = counts / len(data)
    probs = probabilities[probabilities > 0]
    entropy = -np.sum(probs * np.log2(probs))
    return round(entropy, 4)


def histogram_data(ciphertext_hex: str) -> dict:
    """
    Return frequency of each byte value (0-255) for the histogram.
    FIXED: Always returns exactly 256 counts, even for empty ciphertext.
    """
    if not ciphertext_hex:
        return {"counts": [0] * 256, "length": 0}
    
    try:
        data = bytes.fromhex(ciphertext_hex)
    except ValueError:
        return {"counts": [0] * 256, "length": 0}
    
    if not data:
        return {"counts": [0] * 256, "length": 0}
    
    counts = np.bincount(list(data))
    # CRITICAL FIX: Ensure we always have exactly 256 elements
    if len(counts) < 256:
        counts = np.pad(counts, (0, 256 - len(counts)), 'constant')
    else:
        counts = counts[:256]
    
    return {"counts": counts.tolist(), "length": len(data)}


def key_sensitivity_test(plaintext: str, password1: str, password2: str) -> dict:
    """
    Test key sensitivity: encrypt same plaintext with two different keys,
    compute bit difference between ciphertexts.
    """
    plaintext_bytes = plaintext.encode('utf-8')
    if len(plaintext_bytes) < 16:
        plaintext_bytes = plaintext_bytes + b'\x00' * (16 - len(plaintext_bytes))

    enc1 = encrypt_bytes(plaintext_bytes, password1)
    enc2 = encrypt_bytes(plaintext_bytes, password2)

    # Pad shorter
    max_len = max(len(enc1), len(enc2))
    if len(enc1) < max_len:
        enc1 += b'\x00' * (max_len - len(enc1))
    if len(enc2) < max_len:
        enc2 += b'\x00' * (max_len - len(enc2))

    dist = hamming_distance(enc1, enc2)
    total_bits = max_len * 8
    percent = (dist / total_bits) * 100 if total_bits > 0 else 0

    return {
        "differing_bits": dist,
        "total_bits": total_bits,
        "percent": round(percent, 2),
        "ideal": 50.0
    }