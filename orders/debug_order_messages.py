import os
import django
import json
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'foodflash.settings')
django.setup()

from orders.models import Order, ChatMessage, Outlet
from orders.serializers import OrderSerializer

def run():
    print("--- DEBUGGING ORDER MESSAGES ---")
    
    # 1. Create Dummy Data
    outlet, _ = Outlet.objects.get_or_create(name="DebugOutlet")
    token = 9999
    order, _ = Order.objects.get_or_create(token_number=token, outlet=outlet, defaults={'status': 'PREPARING'})
    
    # Clean old messages
    ChatMessage.objects.filter(order=order).delete()
    
    # Add Manager Message
    ChatMessage.objects.create(order=order, sender='MANAGER', message="Manager says Hello")
    
    # Add Customer Message
    ChatMessage.objects.create(order=order, sender='CUSTOMER', message="Customer says Hi")
    
    print(f"Created Order {order} with 2 messages.")
    
    # 2. Serialize
    serializer = OrderSerializer(order)
    data = serializer.data
    
    print("\n--- SERIALIZED DATA ---")
    messages = data.get('messages', [])
    print(f"Message Count: {len(messages)}")
    
    for msg in messages:
        print(f"[{msg['sender']}] {msg['message']}")
        
    # 3. Cleanup
    # order.delete()
    # outlet.delete()

if __name__ == '__main__':
    run()
