
from cryptography.hazmat.primitives import serialization
from py_vapid import Vapid
from pathlib import Path
import base64

# Load Private Key
key_path = Path("/home/silpc-010/files_archa/food_flash/food-flash/private_key.pem")
with open(key_path, "rb") as f:
    private_key = Vapid.from_pem(f.read())

# Get Public Key
raw_pubFn = private_key.public_key
# The library stores it as raw bytes or similar. Let's see how py-vapid exposes it.
# Actually, Vapid object has .public_key property which is often the bytes?

# Serialize to uncompressed point
pub_bytes = private_key.public_key.public_bytes(
    encoding=serialization.Encoding.X962,
    format=serialization.PublicFormat.UncompressedPoint
)
pub_b64 = base64.urlsafe_b64encode(pub_bytes).decode('utf-8').strip('=')

print(f"Derived Public Key: {pub_b64}")
