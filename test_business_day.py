"""
Test script for business day logic
"""
import os
import django
from datetime import datetime, time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'foodflash.settings')
django.setup()

from orders.models import Outlet, VendorConfig, Order
from orders.utils import get_vendor_business_day_range
from django.utils import timezone
import pytz

def test_business_day_logic():
    print("=== BUSINESS DAY LOGIC TEST ===\n")
    
    # Get or create test outlet
    outlet, created = Outlet.objects.get_or_create(
        name="Test Restaurant",
        defaults={'restaurant_name': 'Test Restaurant'}
    )
    
    # Create or update vendor config
    config, created = VendorConfig.objects.get_or_create(
        outlet=outlet,
        defaults={
            'business_day_start_hour': time(4, 0),  # 4 AM
            'timezone': 'Asia/Kolkata'
        }
    )
    
    print(f"Outlet: {outlet.name}")
    print(f"Business Day Starts: {config.business_day_start_hour}")
    print(f"Timezone: {config.timezone}\n")
    
    # Get current business day range
    start_utc, end_utc = get_vendor_business_day_range(outlet)
    
    # Convert to local time for display
    tz = pytz.timezone(config.timezone)
    start_local = start_utc.astimezone(tz)
    end_local = end_utc.astimezone(tz)
    
    print(f"Current Time (Local): {timezone.now().astimezone(tz)}")
    print(f"\nCurrent Business Day Range:")
    print(f"  Start (Local): {start_local}")
    print(f"  End (Local):   {end_local}")
    print(f"\n  Start (UTC): {start_utc}")
    print(f"  End (UTC):   {end_utc}")
    
    # Test order filtering
    print(f"\n=== TESTING ORDER FILTERING ===")
    
    # Count orders in current business day
    orders_today = Order.objects.filter(
        outlet=outlet,
        created_at__gte=start_utc,
        created_at__lt=end_utc
    )
    
    print(f"Orders in current business day: {orders_today.count()}")
    
    if orders_today.exists():
        print("\nOrders:")
        for order in orders_today:
            order_time_local = order.created_at.astimezone(tz)
            print(f"  Token {order.token_number}: {order.status} (Created: {order_time_local})")
    
    print("\n=== TEST COMPLETE ===")

if __name__ == '__main__':
    test_business_day_logic()
