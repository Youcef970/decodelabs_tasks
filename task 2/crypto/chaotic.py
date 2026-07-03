"""
Chaotic Key Generation Module
Logistic Map & SHA-256 seeding for post-quantum entropy
"""

import hashlib
import math


def seed_from_password(password: str) -> float:
    """
    Convert any password into a chaotic seed in (0,1)
    using SHA-256 to ensure uniform distribution.
    """
    digest = hashlib.sha256(password.encode('utf-8')).digest()
    # Take first 8 bytes as a 64-bit integer and normalise
    seed_int = int.from_bytes(digest[:8], 'big')
    return (seed_int % (2**32 - 1)) / (2**32)


def logistic_map(seed: float, r: float = 3.99, iterations: int = 512) -> list:
    """
    Generate a chaotic sequence using the logistic map.
    r = 3.99 produces strong chaos.
    Returns the last 'iterations' values.
    """
    x = seed
    # Burn first 100 iterations to avoid transient effects
    for _ in range(100):
        x = r * x * (1.0 - x)
    
    seq = []
    for _ in range(iterations):
        x = r * x * (1.0 - x)
        seq.append(x)
    return seq


def chaotic_round_keys(seed: float, rounds: int = 8, key_len: int = 16) -> list:
    """
    Generate round keys for each encryption round.
    Each key is a list of 16 bytes (128 bits).
    """
    # Generate enough chaos for rounds * key_len bytes
    total_needed = rounds * key_len
    chaos = logistic_map(seed, iterations=total_needed + 100)
    # Use only the needed part
    chaos = chaos[-total_needed:]
    
    round_keys = []
    for r in range(rounds):
        start = r * key_len
        end = start + key_len
        key_bytes = [int(v * 256) % 256 for v in chaos[start:end]]
        round_keys.append(key_bytes)
    return round_keys