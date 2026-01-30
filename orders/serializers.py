from rest_framework import serializers
from .models import Order, ChatMessage, PushSubscription, Outlet

class OutletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Outlet
        fields = ['id', 'name', 'restaurant_name']

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'order', 'sender', 'message', 'timestamp']
        read_only_fields = ['id', 'timestamp', 'order']

class OrderSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'token_number', 'status', 'is_called', 'created_at', 'messages']

class PushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushSubscription
        fields = ['id', 'token_number', 'endpoint', 'p256dh', 'auth', 'created_at']
