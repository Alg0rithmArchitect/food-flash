from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Order, PushSubscription
from .models import Order, PushSubscription
from .serializers import OrderSerializer, PushSubscriptionSerializer
from pywebpush import webpush, WebPushException
import os
import json

@api_view(['GET'])
def track_order(request):
    token = request.query_params.get('token')
    
    if not token:
        return Response(
            {"detail": "Token parameter is required."}, 
            status=status.HTTP_400_BAD_REQUEST
        )
        
    try:
        order = get_object_or_404(Order, token_number=token)
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    except ValueError:
        return Response(
            {"detail": "Invalid token format."}, 
            status=status.HTTP_400_BAD_REQUEST
        )

def track_order_page(request):
    from django.shortcuts import render
    return render(request, 'orders/track_order.html')

def service_worker(request):
    from django.shortcuts import render
    return render(request, 'sw.js', content_type='application/javascript')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    serializer = OrderSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_order_status(request, pk):
    order = get_object_or_404(Order, pk=pk)
    serializer = OrderSerializer(order, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        serializer.save()
        
        # Send Web Push Notification
        try:
            subscriptions = PushSubscription.objects.filter(token_number=order.token_number)
            payload = json.dumps({
                "title": "Order Update",
                "body": f"Your order status is now {order.status}"
            })
            
            vapid_private_key = os.getenv("VAPID_PRIVATE_KEY")
            vapid_claims = {"sub": f"mailto:{os.getenv('VAPID_ADMIN_EMAIL')}"}
            
            # If keys are not set, we skip (or you could log a warning)
            if vapid_private_key:
                for sub in subscriptions:
                    try:
                        webpush(
                            subscription_info={
                                "endpoint": sub.endpoint,
                                "keys": {
                                    "p256dh": sub.p256dh,
                                    "auth": sub.auth
                                }
                            },
                            data=payload,
                            vapid_private_key=vapid_private_key,
                            vapid_claims=vapid_claims
                        )
                    except WebPushException as e:
                        # Log error but continue
                        print(f"Push failed: {e}")
        except Exception as e:
             print(f"Notification error: {e}")

        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def call_order(request, pk):
    order = get_object_or_404(Order, pk=pk)
    order.is_called = True
    order.save()
    serializer = OrderSerializer(order)
    return Response(serializer.data)

@api_view(['POST'])
def subscribe(request):
    data = request.data.copy()
    
    # Handle nested keys if present, otherwise assume flat structure
    # Request body: token_number, endpoint, keys: {p256dh, auth}
    keys = data.get('keys', {})
    if keys:
        data['p256dh'] = keys.get('p256dh')
        data['auth'] = keys.get('auth')
    
    serializer = PushSubscriptionSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

