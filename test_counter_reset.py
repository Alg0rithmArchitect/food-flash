"""
Test script for counter reset logic
"""
import os
import django
from datetime import datetime, time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'foodflash.settings')
django.setup()

from orders.models import Outlet, VendorConfig, Order
from orders.utils import get_vendor_business_day_range, reset_counters_if_new_business_day
from django.utils import timezone
import pytz

def test_counter_reset():
    print("=== COUNTER RESET LOGIC TEST ===\n")
    
    # Get or create test outlet
    outlet, created = Outlet.objects.get_or_create(
        name="Test Restaurant",
        defaults={'restaurant_name': 'Test Restaurant'}
    )
    
    # Get or create vendor config
    config, created = VendorConfig.objects.get_or_create(
        outlet=outlet,
        defaults={
            'business_day_start_hour': time(4, 0),
            'timezone': 'Asia/Kolkata',
            'continuous_booking_counter': 0
        }
    )
    
    print(f"Outlet: {outlet.name}")
    print(f"Current Counter Value: {config.continuous_booking_counter}\n")
    
    # Get current business day range
    start_utc, end_utc = get_vendor_business_day_range(outlet)
    
    # Convert to local time for display
    tz = pytz.timezone(config.timezone)
    start_local = start_utc.astimezone(tz)
    end_local = end_utc.astimezone(tz)
    
    print(f"Current Business Day Range:")
    print(f"  Start: {start_local}")
    print(f"  End:   {end_local}\n")
    
    # Check if there are orders today
    orders_today = Order.objects.filter(
        outlet=outlet,
        created_at__gte=start_utc,
        created_at__lt=end_utc
    )
    
    print(f"Orders in current business day: {orders_today.count()}")
    
    # Test counter reset
    print(f"\n=== TESTING COUNTER RESET ===")
    was_reset = reset_counters_if_new_business_day(outlet)
    
    if was_reset:
        print("✅ Counter was RESET (first order of business day)")
    else:
        print("ℹ️  Counter NOT reset (orders already exist today)")
    
    # Refresh config to get updated value
    config.refresh_from_db()
    print(f"Counter Value After Check: {config.continuous_booking_counter}")
    
    # Simulate incrementing counter
    print(f"\n=== SIMULATING COUNTER INCREMENT ===")
    config.continuous_booking_counter += 1
    config.save()
    print(f"Counter Value After Increment: {config.continuous_booking_counter}")
    
    print("\n=== TEST COMPLETE ===")

if __name__ == '__main__':
    test_counter_reset()
