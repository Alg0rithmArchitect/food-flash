from django.db import models

class Order(models.Model):
    STATUS_CHOICES = [
        ('PREPARING', 'Preparing'),
        ('READY', 'Ready'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
    ]

    token_number = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PREPARING')
    is_called = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order {self.token_number} - {self.status}"

class PushSubscription(models.Model):
    token_number = models.PositiveIntegerField()
    endpoint = models.TextField()
    p256dh = models.TextField()
    auth = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Subscription for Token {self.token_number}"
