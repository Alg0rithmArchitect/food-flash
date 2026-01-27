
import os
import django
import sys
import json
from datetime import datetime

# Setup Django Environment
sys.path.append('/home/silpc-010/files_archa/food_flash/food-flash')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'foodflash.settings')
django.setup()

from orders.views import send_iot_message
from orders.models import Order, Outlet

def test_integration():
    print("📺 Testing Android TV Integration...")
    
    # 1. Check Configuration
    conn_str = os.getenv("IOTHUB_CONNECTION_STRING")
    if not conn_str:
        print("❌ FAILED: IOTHUB_CONNECTION_STRING not found in .env")
        return

    print("✅ Configuration found.")

    # 2. Mock Data
    # Create a temporary dummy outlet and order if needed, or use existing
    # For safety, let's just create a Mock object that looks like an Order
    class MockOutlet:
        android_tv_device_id = "TEST_DEVICE_ID" # We will use a fake ID to test connection
        
    class MockOrder:
        token_number = 999
        id = 999
        outlet = MockOutlet()

    print(f"📡 Attempting to send test message to device: {MockOrder.outlet.android_tv_device_id}")
    
    try:
        from azure.iot.hub import IoTHubRegistryManager
    except ImportError:
        print("❌ FAILED: azure-iot-hub library not installed.")
        return

    try:
        # We expect this to fail if the device ID doesn't exist in Azure, 
        # BUT if it fails with "NotFound" it means we successfully connected to Azure!
        # If it fails with "Unauthorized", creds are wrong.
        send_iot_message(MockOrder())
        print("\n✅ SUCCESS: Message sent (or at least attempted). Check your server logs above.")
        print("If you see an error about 'Device Not Found', that is GOOD! It means the connection to Azure works.")
    except Exception as e:
        print(f"\n❌ FAILED: {e}")

if __name__ == "__main__":
    test_integration()
