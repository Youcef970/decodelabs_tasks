import base64
import io
from typing import Dict, Any
from PIL import Image
import numpy as np
import logging

logger = logging.getLogger(__name__)


class VisualMatcher:
    """Visual Detection Engine - matches website screenshots to brand fingerprints.

    Note: real brand-logo matching requires a trained reference hash database
    captured from genuine brand pages. This implementation provides the
    pipeline (decode -> perceptual hash -> Hamming distance) with a small
    illustrative fingerprint set; swap in real captured hashes for production use.
    """

    def __init__(self):
        self.brand_fingerprints: Dict[str, Dict[str, Any]] = {}
        self.similarity_threshold = 0.85
        self._load_brands()

    def _load_brands(self):
        # Illustrative placeholder hashes. In production these would be
        # generated from real screenshots of each brand's legitimate login page.
        self.brand_fingerprints = {
            "netflix": {"hash": "0f1e2d3c4b5a6978", "domains": ["netflix.com"]},
            "paypal": {"hash": "a1b2c3d4e5f60789", "domains": ["paypal.com"]},
            "microsoft": {"hash": "9a8b7c6d5e4f3021", "domains": ["microsoft.com", "azure.com"]},
        }

    def is_ready(self) -> bool:
        return True

    def analyze(self, screenshot_base64: str) -> Dict[str, Any]:
        results: Dict[str, Any] = {"score": 0.0, "matched_brand": None, "details": {}}

        if not screenshot_base64:
            return results

        try:
            # Strip data URL prefix if present
            if "," in screenshot_base64 and screenshot_base64.strip().startswith("data:"):
                screenshot_base64 = screenshot_base64.split(",", 1)[1]

            image_bytes = base64.b64decode(screenshot_base64)
            image = Image.open(io.BytesIO(image_bytes))
            image_hash = self.generate_phash(image)
            results["details"]["computed_hash"] = image_hash

            best_brand = None
            best_similarity = 0.0
            for brand, data in self.brand_fingerprints.items():
                similarity = self.calculate_similarity(image_hash, data["hash"])
                results["details"][brand] = round(similarity, 3)
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_brand = brand

            if best_similarity >= self.similarity_threshold:
                results["score"] = 0.95
                results["matched_brand"] = best_brand
            else:
                # Partial visual similarity still nudges risk score upward
                results["score"] = round(max(best_similarity - 0.5, 0) * 0.6, 3)

        except Exception as e:
            logger.warning("Error processing screenshot: %s", e)
            results["details"]["error"] = "Could not process image"

        return results

    def generate_phash(self, image: Image.Image) -> str:
        """Generate a simple perceptual hash via 2D FFT low-frequency thresholding."""
        image = image.convert("L").resize((32, 32))
        pixels = np.array(image, dtype=np.float32)

        dct = np.fft.fft2(pixels)
        dct = np.abs(dct)
        low_freq = dct[:8, :8]

        median = np.median(low_freq)
        hash_bits = (low_freq > median).flatten()
        bit_string = "".join("1" if b else "0" for b in hash_bits)
        hash_hex = hex(int(bit_string, 2))[2:].zfill(16)

        return hash_hex

    def calculate_similarity(self, hash1: str, hash2: str) -> float:
        """Calculate similarity via normalized Hamming distance between two hex hashes."""
        if not hash1 or not hash2:
            return 0.0

        bin1 = bin(int(hash1, 16))[2:].zfill(64)
        bin2 = bin(int(hash2, 16))[2:].zfill(64)

        distance = sum(1 for a, b in zip(bin1, bin2) if a != b)
        return 1 - (distance / 64)
