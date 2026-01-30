from django.conf import settings
from django.db import models

class Outlet(models.Model):
    name = models.CharField(max_length=100)
    restaurant_name = models.CharField(max_length=100, blank=True, null=True)
    android_tv_device_id = models.CharField(max_length=100, blank=True, null=True, help_text="Azure IoT Device ID for this outlet's TV")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class VendorConfig(models.Model):
    """Configuration for vendor business day logic"""
    outlet = models.OneToOneField(Outlet, on_delete=models.CASCADE, related_name='config')
    business_day_start_hour = models.TimeField(
        default='04:00:00',
        help_text="Time when business day starts (e.g., 04:00 for 4 AM)"
    )
    timezone = models.CharField(
        max_length=50,
        default='Asia/Kolkata',
        help_text="Vendor's timezone (e.g., Asia/Kolkata, America/New_York)"
    )
    continuous_booking_counter = models.IntegerField(
        default=0,
        help_text="Counter for booking numbers, resets at start of each business day"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Config for {self.outlet.name}"

class OutletManager(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    outlet = models.ForeignKey(Outlet, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.user.username} - {self.outlet.name}"

class Order(models.Model):
    STATUS_CHOICES = [
        ('PREPARING', 'Preparing'),
        ('READY', 'Ready'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
    ]

    outlet = models.ForeignKey(Outlet, on_delete=models.CASCADE, null=True, blank=True, related_name='orders')
    token_number = models.PositiveIntegerField()
    counter_number = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Auto-incremented counter number, resets daily per business day"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PREPARING')
    is_called = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        outlet_name = self.outlet.name if self.outlet else "No Outlet"
        return f"Order {self.token_number} - {self.status} ({outlet_name})"

class PushSubscription(models.Model):
    token_number = models.PositiveIntegerField()
    endpoint = models.TextField()
    p256dh = models.TextField()
    auth = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Subscription for Token {self.token_number}"

class ChatMessage(models.Model):
    SENDER_CHOICES = [
        ('CUSTOMER', 'Customer'),
        ('MANAGER', 'Manager'),
    ]
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender} (Order {self.order.token_number}): {self.message[:20]}"
