import os
from pywebpush import Vapid
from pathlib import Path

# Path to private key
KEY_PATH = Path('private_key.pem')

if KEY_PATH.exists():
    try:
        vapid = Vapid.from_pem(KEY_PATH.read_bytes())
        print(f"Type PK: {type(vapid.public_key)}")
        # Try to access string rep?
        try:
             # This is a method in some versions or property
             print(f"PEM: {vapid.public_pem}") 
        except:
             pass
             
        # Helper to get raw bytes from cryptography object
        try:
            from cryptography.hazmat.primitives import serialization
            public_bytes = vapid.public_key.public_bytes(
                encoding=serialization.Encoding.X962,
                format=serialization.PublicFormat.UncompressedPoint
            )
            import base64
            b64 = base64.urlsafe_b64encode(public_bytes).decode('utf-8').strip('=')
            print(f"GENERATED_KEY={b64}")
            
            # Write to .env
            env_line = f"\nVAPID_PUBLIC_KEY={b64}\n"
            with open(".env", "a") as f:
                f.write(env_line)
            print("UPDATED_ENV")
            
        except Exception as inner:
            print(f"INNER ERROR: {inner}")
            
    except Exception as e:
        print(f"ERROR: {e}")
else:
    print("NO_KEY_FILE")
