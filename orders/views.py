from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Order, PushSubscription
from .serializers import OrderSerializer, PushSubscriptionSerializer

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

