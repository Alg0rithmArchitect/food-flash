
import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'foodflash.settings')
django.setup()

from orders.models import PushSubscription

count = PushSubscription.objects.count()
print(f"Total Subscriptions in DB: {count}")

for sub in PushSubscription.objects.all():
    print(f"- Token: {sub.token_number} | Endpoint: {sub.endpoint[:50]}...")
