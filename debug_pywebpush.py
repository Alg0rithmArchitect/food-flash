
from pywebpush import webpush, Vapid
from cryptography.hazmat.primitives.asymmetric import ec
import os

print("Imported pywebpush and cryptography successfully.")

try:
    # 1. Test Key Generation (uses cryptography)
    private_key = ec.generate_private_key(ec.SECP256R1())
    print("SUCCESS: Generated SECP256R1 key with cryptography.")

    # 2. Test Vapid instantiation (uses cryptography + pywebpush)
    # create a dummy private key in PEM format
    from cryptography.hazmat.primitives import serialization
    pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    vapid = Vapid.from_pem(pem)
    print("SUCCESS: Instantiated Vapid object from generated PEM.")
    
    # 3. Test dummy push (will fail connection but test arg validation)
    try:
        webpush(
            subscription_info={
                "endpoint": "https://example.com",
                "keys": {"p256dh": "foo", "auth": "bar"}
            },
            data="test",
            vapid_private_key=vapid,
            vapid_claims={"sub": "mailto:admin@example.com"}
        )
    except Exception as e:
        # We expect a connection error or value error, but NOT a TypeError about curves
        print(f"Webpush Attempt Result: {e}")
        if "curve must be an EllipticCurve" in str(e):
             print("FAIL: The incompatibility persists!!")
        else:
             print("SUCCESS: Webpush arguments accepted (connection error expected).")

except Exception as e:
    print(f"CRITICAL FAIL: {e}")
