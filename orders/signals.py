from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Order, PushSubscription
from pywebpush import webpush, WebPushException
import json
import os

@receiver(pre_save, sender=Order)
def track_order_status_change(sender, instance, **kwargs):
    """
    Capture the original status before saving updates.
    This allows us to detect if the status actually changed.
    """
    if instance.pk:
        try:
            original_order = Order.objects.get(pk=instance.pk)
            instance._original_status = original_order.status
        except Order.DoesNotExist:
            instance._original_status = None
    else:
        instance._original_status = None

@receiver(post_save, sender=Order)
def send_order_status_notification(sender, instance, created, **kwargs):
    """
    Trigger a push notification when the order status changes.
    """
    if created:
        return  # Don't send notification on creation

    # Check if status changed
    original_status = getattr(instance, '_original_status', None)
    
    if original_status == instance.status:
        return  # Status didn't change, do nothing

    # Define messages for each status
    status_messages = {
        'PREPARING': "Your order is being prepared",
        'READY': "Your order is ready for pickup!",
        'DELIVERED': "Thank you for ordering with Food Flash",
        'CANCELLED': "Your order has been cancelled"
    }

    message_text = status_messages.get(instance.status)

    if not message_text:
        return  # Status not in our notification list

    # Fetch valid subscriptions
    subscriptions = PushSubscription.objects.filter(token_number=instance.token_number)
    
    if not subscriptions.exists():
        print(f"No subscriptions found for Order {instance.token_number}")
        return

    payload = json.dumps({
        "title": f"Order {instance.token_number} Update",
        "message": message_text
    })

    vapid_private_key = os.getenv("VAPID_PRIVATE_KEY")
    vapid_claims = {
        "sub": f"mailto:{os.getenv('VAPID_ADMIN_EMAIL')}"
    }

    print(f"DEBUG: sending status push for Order {instance.token_number} ({instance.status})")

    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {
                        "p256dh": sub.p256dh,
                        "auth": sub.auth,
                    },
                },
                data=payload,
                vapid_private_key=vapid_private_key,
                vapid_claims=vapid_claims,
            )
        except WebPushException as e:
            # Automatic cleanup logic
            if any(code in str(e) for code in ["410", "404", "403"]):
                print(f"Removing invalid subscription for token {instance.token_number}")
                sub.delete()
            else:
                print(f"Push failed for {sub.id}: {e}")
