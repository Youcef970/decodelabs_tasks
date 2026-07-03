"""
Dynamic S-Box Generation from Chaotic Sequence
"""


def generate_sbox(chaos_sequence: list) -> list:
    """
    Convert a chaotic sequence (floats 0-1) into a 256-byte permutation.
    """
    # Map floats to 0-255 integers
    raw = [int(v * 256) % 256 for v in chaos_sequence]
    
    # Build a permutation without duplicates
    seen = set()
    sbox = []
    for val in raw:
        if val not in seen:
            seen.add(val)
            sbox.append(val)
        if len(sbox) == 256:
            break
    
    # Fill missing values (should not happen if sequence is long enough)
    for i in range(256):
        if i not in seen:
            sbox.append(i)
    return sbox[:256]


def inverse_sbox(sbox: list) -> list:
    """Compute the inverse permutation of the S-Box."""
    inv = [0] * 256
    for i, val in enumerate(sbox):
        inv[val] = i
    return inv