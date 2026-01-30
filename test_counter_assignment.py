"""
Test script for automatic counter assignment
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'foodflash.settings')
django.setup()

from orders.models import Outlet, VendorConfig, Order
from orders.utils import assign_counter_number, reset_counters_if_new_business_day
from django.utils import timezone

def test_counter_assignment():
    print("=== AUTOMATIC COUNTER ASSIGNMENT TEST ===\n")
    
    # Get or create test outlet
    outlet, created = Outlet.objects.get_or_create(
        name="Test Restaurant",
        defaults={'restaurant_name': 'Test Restaurant'}
    )
    
    print(f"Outlet: {outlet.name}\n")
    
    # Reset counters for clean test
    reset_counters_if_new_business_day(outlet)
    
    # Create 3 test orders with auto-assigned counters
    print("Creating 3 orders with auto-assigned counter numbers...\n")
    
    for i in range(1, 4):
        order = Order.objects.create(
            token_number=100 + i,
            outlet=outlet,
            status='PREPARING'
        )
        
        # Assign counter number
        counter_num = assign_counter_number(outlet, order)
        
        print(f"Order {i}:")
        print(f"  Token Number: {order.token_number}")
        print(f"  Counter Number: {order.counter_number}")
        print(f"  Status: {order.status}\n")
    
    # Verify counter state
    config = VendorConfig.objects.get(outlet=outlet)
    print(f"Final Counter Value: {config.continuous_booking_counter}")
    
    print("\n=== TEST COMPLETE ===")

if __name__ == '__main__':
    test_counter_assignment()
