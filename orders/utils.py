"""
Utility functions for business day logic
"""
from datetime import timedelta, time
from django.utils import timezone
import pytz


def get_vendor_business_day_range(outlet):
    """
    Calculate the current business day range for a vendor.
    
    A business day is a 24-hour period starting at the vendor's configured
    business_day_start_hour, which may span across calendar midnight.
    
    Args:
        outlet: Outlet instance
        
    Returns:
        tuple: (start_utc, end_utc) - Business day range in UTC
        
    Example:
        If business day starts at 4 AM and current time is 2 AM,
        the business day is from yesterday 4 AM to today 4 AM.
    """
    # Get vendor config or use defaults
    try:
        config = outlet.config
        start_time = config.business_day_start_hour
        tz_name = config.timezone
    except:
        # Fallback to defaults if no config
        start_time = time(4, 0)  # 4 AM
        tz_name = 'Asia/Kolkata'
    
    # Get vendor's timezone
    tz = pytz.timezone(tz_name)
    
    # Get current time in vendor's timezone
    now_utc = timezone.now()
    now_local = now_utc.astimezone(tz)
    
    # Build today's start time in local timezone
    today_start_local = now_local.replace(
        hour=start_time.hour,
        minute=start_time.minute,
        second=start_time.second,
        microsecond=0
    )
    
    # CRITICAL: If current time is BEFORE start time,
    # the business day actually started YESTERDAY
    if now_local.time() < start_time:
        today_start_local -= timedelta(days=1)
    
    # Business day ends 24 hours later
    today_end_local = today_start_local + timedelta(days=1)
    
    # Convert to UTC for database queries
    start_utc = today_start_local.astimezone(pytz.UTC)
    end_utc = today_end_local.astimezone(pytz.UTC)
    
    return start_utc, end_utc


def reset_counters_if_new_business_day(outlet):
    """
    Check if this is the first order of a new business day and reset counters if needed.
    
    This function should be called before creating a new order to ensure counters
    are reset at the start of each business day.
    
    Args:
        outlet: Outlet instance
        
    Returns:
        bool: True if counters were reset, False otherwise
    """
    from .models import Order, VendorConfig
    
    # Get or create vendor config
    config, created = VendorConfig.objects.get_or_create(
        outlet=outlet,
        defaults={
            'business_day_start_hour': time(4, 0),
            'timezone': 'Asia/Kolkata',
            'continuous_booking_counter': 0
        }
    )
    
    # Get current business day range
    start_utc, end_utc = get_vendor_business_day_range(outlet)
    
    # Check if any orders exist in current business day
    orders_today = Order.objects.filter(
        outlet=outlet,
        created_at__gte=start_utc,
        created_at__lt=end_utc
    ).exists()
    
    if not orders_today:
        # First order of the day → reset counters
        config.continuous_booking_counter = 0
        config.save()
        return True
    
    return False


def assign_counter_number(outlet, order):
    """
    Assign an auto-incremented counter number to an order.
    
    This function increments the vendor's continuous_booking_counter and
    assigns it to the order. Should be called after creating a new order.
    
    Args:
        outlet: Outlet instance
        order: Order instance to assign counter number to
        
    Returns:
        int: The assigned counter number
    """
    from .models import VendorConfig
    
    # Get or create vendor config
    config, created = VendorConfig.objects.get_or_create(
        outlet=outlet,
        defaults={
            'business_day_start_hour': time(4, 0),
            'timezone': 'Asia/Kolkata',
            'continuous_booking_counter': 0
        }
    )
    
    # Increment counter
    config.continuous_booking_counter += 1
    counter_num = config.continuous_booking_counter
    config.save()
    
    # Assign to order
    order.counter_number = counter_num
    order.save()
    
    return counter_num


