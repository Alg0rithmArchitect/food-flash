
import os
from pathlib import Path
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

def check_key():
    base_dir = Path("/home/silpc-010/files_archa/food_flash/food-flash")
    key_path = base_dir / "private_key.pem"
    
    print(f"Checking key at: {key_path}")
    
    if not key_path.exists():
        print("ERROR: File does not exist!")
        return

    try:
        with open(key_path, "rb") as f:
            key_bytes = f.read()
            
        print(f"Read {len(key_bytes)} bytes.")
        first_line = key_bytes.split(b'\n')[0]
        print(f"First line: {first_line}")
        
        # Try loading as PEM Private Key
        try:
            private_key = serialization.load_pem_private_key(
                key_bytes,
                password=None,
                backend=default_backend()
            )
            print("SUCCESS: Key loaded successfully with cryptography!")
            
            # Check curve
            from cryptography.hazmat.primitives.asymmetric import ec
            if isinstance(private_key, ec.EllipticCurvePrivateKey):
                print(f"Curve: {private_key.curve.name}")
            else:
                print("WARNING: Not an Elliptic Curve key!")
                
        except Exception as e:
            print(f"FAIL: serialization.load_pem_private_key failed: {e}")
            
    except Exception as e:
        print(f"General Error: {e}")

if __name__ == "__main__":
    check_key()
