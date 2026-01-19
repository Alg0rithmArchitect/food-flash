from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Order
from .serializers import OrderSerializer

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
