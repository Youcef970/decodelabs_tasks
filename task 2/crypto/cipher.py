"""
8-round Feistel Network with Chaotic S-Box and Key Schedule
Fixed: Correct Inverse Round for Decryption
Fixed: Bytes support for metrics
"""

from .chaotic import seed_from_password, logistic_map
from .sbox import generate_sbox, inverse_sbox

BLOCK_SIZE = 16
ROUNDS = 8


def _pad(data: bytes) -> bytes:
    pad_len = BLOCK_SIZE - (len(data) % BLOCK_SIZE)
    return data + bytes([pad_len] * pad_len)


def _unpad(data: bytes) -> bytes:
    if not data:
        return data
    pad_len = data[-1]
    if pad_len < 1 or pad_len > BLOCK_SIZE:
        raise ValueError("Invalid padding")
    # Verify padding (optional but good practice)
    for i in range(1, pad_len + 1):
        if data[-i] != pad_len:
            raise ValueError("Invalid padding")
    return data[:-pad_len]


def _feistel_f(right: bytes, sbox: list, round_key: bytes) -> bytes:
    # SubBytes
    subbed = bytes([sbox[b] for b in right])
    # Permutation (rotate left by 3 for diffusion)
    permuted = subbed[3:] + subbed[:3]
    # XOR with round key
    return bytes([permuted[i] ^ round_key[i] for i in range(len(round_key))])


def _feistel_round_encrypt(left: bytes, right: bytes, sbox: list, round_key: bytes) -> tuple:
    """Standard Feistel round: (L, R) -> (R, L XOR F(R))"""
    f_out = _feistel_f(right, sbox, round_key)
    new_left = bytes([left[i] ^ f_out[i] for i in range(8)])
    return right, new_left


def _feistel_round_decrypt(left: bytes, right: bytes, sbox: list, round_key: bytes) -> tuple:
    """
    Inverse Feistel round: (L, R) -> (R XOR F(L), L)
    This correctly reverses the encryption round.
    """
    f_out = _feistel_f(left, sbox, round_key)
    new_left = bytes([right[i] ^ f_out[i] for i in range(8)])
    return new_left, left


def _encrypt_block(block: bytes, sbox: list, round_keys: list) -> bytes:
    left = block[:8]
    right = block[8:]
    for i in range(ROUNDS):
        left, right = _feistel_round_encrypt(left, right, sbox, round_keys[i])
    return left + right


def _decrypt_block(block: bytes, sbox: list, round_keys: list) -> bytes:
    left = block[:8]
    right = block[8:]
    # Use reverse key order AND the inverse round function
    for i in range(ROUNDS - 1, -1, -1):
        left, right = _feistel_round_decrypt(left, right, sbox, round_keys[i])
    return left + right


def _generate_crypto_material(password: str):
    """Helper to generate S-Box and Round Keys from password"""
    seed = seed_from_password(password)
    total_chaos = 256 + ROUNDS * 8
    chaos = logistic_map(seed, iterations=total_chaos + 100)
    chaos = chaos[-total_chaos:]

    sbox = generate_sbox(chaos[:256])
    round_keys = []
    for r in range(ROUNDS):
        start = 256 + r * 8
        key_bytes = bytes([int(v * 256) % 256 for v in chaos[start:start + 8]])
        round_keys.append(key_bytes)
    return sbox, round_keys


# --- Public Byte-level API (Used for Metrics) ---
def encrypt_bytes(data: bytes, password: str) -> bytes:
    """Encrypt raw bytes directly."""
    sbox, round_keys = _generate_crypto_material(password)
    padded = _pad(data)
    ciphertext = b''
    for i in range(0, len(padded), BLOCK_SIZE):
        block = padded[i:i + BLOCK_SIZE]
        ciphertext += _encrypt_block(block, sbox, round_keys)
    return ciphertext


def decrypt_bytes(data: bytes, password: str) -> bytes:
    """Decrypt raw bytes directly."""
    sbox, round_keys = _generate_crypto_material(password)
    plaintext_padded = b''
    for i in range(0, len(data), BLOCK_SIZE):
        block = data[i:i + BLOCK_SIZE]
        plaintext_padded += _decrypt_block(block, sbox, round_keys)
    return _unpad(plaintext_padded)


# --- Public String-level API (Used for Web UI) ---
def encrypt(plaintext: str, password: str) -> tuple:
    """Encrypt string, returns (hex, sbox, round_keys)"""
    sbox, round_keys = _generate_crypto_material(password)
    data = plaintext.encode('utf-8')
    ciphertext = encrypt_bytes(data, password)  # Reuses the bytes function
    return ciphertext.hex(), sbox, round_keys


def decrypt(ciphertext_hex: str, password: str) -> str:
    """Decrypt hex string, returns plaintext string"""
    ciphertext = bytes.fromhex(ciphertext_hex)
    plaintext_bytes = decrypt_bytes(ciphertext, password)
    return plaintext_bytes.decode('utf-8')