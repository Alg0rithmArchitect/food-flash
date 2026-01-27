import os
import django
import sys

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'foodflash.settings')
django.setup()

from django.contrib.auth import get_user_model
from orders.models import Outlet, OutletManager

User = get_user_model()

def setup():
    print("--- Food Flash Multi-Outlet Setup ---")
    
    # 1. Create Outlets
    outlet1, created = Outlet.objects.get_or_create(
        name="Main Kitchen",
        defaults={
            "restaurant_name": "Food Flash HQ", 
            "android_tv_device_id": os.getenv("ANDROID_TV_DEVICE_ID", "TV_DEFAULT")
        }
    )
    if created:
        print(f"✅ Created Outlet: {outlet1.name}")
    else:
        print(f"ℹ️  Outlet exists: {outlet1.name}")

    outlet2, created = Outlet.objects.get_or_create(
        name="Coffee Bar",
        defaults={"restaurant_name": "Food Flash Café"}
    )
    if created:
        print(f"✅ Created Outlet: {outlet2.name}")

    # 2. Assign Superuser to Main Kitchen
    admins = User.objects.filter(is_superuser=True)
    if admins.exists():
        admin = admins.first()
        om, created = OutletManager.objects.get_or_create(user=admin, defaults={'outlet': outlet1})
        if created:
            print(f"✅ Assigned Admin '{admin.username}' to '{outlet1.name}'")
        else:
            if om.outlet != outlet1:
                om.outlet = outlet1
                om.save()
                print(f"✅ Re-assigned Admin '{admin.username}' to '{outlet1.name}'")
            else:
                print(f"ℹ️  Admin '{admin.username}' already assigned to '{outlet1.name}'")
    else:
        print("⚠️  No Superuser found. Please create one with 'python manage.py createsuperuser'")

    print("\n--- Setup Complete ---")
    print("You can now log in as the admin!")

if __name__ == "__main__":
    setup()
