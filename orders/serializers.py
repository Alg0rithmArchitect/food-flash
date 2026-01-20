from rest_framework import serializers
from .models import Order, PushSubscription

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'

class PushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushSubscription
        fields = ['token_number', 'endpoint', 'p256dh', 'auth']
