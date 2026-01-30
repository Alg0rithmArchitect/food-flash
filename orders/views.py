from rest_framework.decorators import api_view, permission_classes, authentication_classes
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Order, PushSubscription
from .models import Order, PushSubscription
from .serializers import OrderSerializer, PushSubscriptionSerializer, OutletSerializer
from pywebpush import webpush, WebPushException, Vapid
import os
import json
from django.conf import settings
from pathlib import Path
from .models import Outlet

@api_view(['GET'])
@authentication_classes([]) # Public access needed for landing page
def get_outlets(request):
    outlets = Outlet.objects.all()
    serializer = OutletSerializer(outlets, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def track_order(request):
    token = request.query_params.get('token')
    
    outlet_id = request.query_params.get('outlet_id')
    
    if not token:
        return Response(
            {"detail": "Token parameter is required."}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        order = None
        if outlet_id:
            order = Order.objects.filter(token_number=token, outlet_id=outlet_id).first()
        else:
            # Only fallback if NO outlet was specified at all
            order = Order.objects.filter(token_number=token).order_by('-created_at').first()
            
        if not order:
            return Response(
                {"detail": "Order not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    except ValueError:
        return Response(
            {"detail": "Invalid token format."}, 
            status=status.HTTP_400_BAD_REQUEST
        )

from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt

def customer_landing(request):
    return render(request, 'orders/landing.html')

def manager_login(request):
    if request.method == 'POST':
        # Simple Login Logic (replace with standard auth form if needed)
        # Assuming using django admin users
        from django.contrib.auth.forms import AuthenticationForm
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            login(request, form.get_user())
            return redirect('manager_menu')
    else:
        from django.contrib.auth.forms import AuthenticationForm
        form = AuthenticationForm()
    return render(request, 'orders/manager_login.html', {'form': form})

def manager_logout(request):
    logout(request)
    return redirect('manager_login')

@login_required(login_url='manager_login')
def manager_menu(request):
    return render(request, 'orders/manager_menu.html')

@login_required(login_url='manager_login')
def manager_create_order(request):
    outlet = get_manager_outlet(request.user)
    server_ip = get_local_ip()
    
    # Check for automated SSH Public URL
    public_url = getattr(settings, 'PUBLIC_TUNNEL_URL', None)
    
    context = {
        'outlet_id': outlet.id if outlet else None,
        'server_ip': server_ip,
        'public_url': public_url
    }
    return render(request, 'orders/manager_create.html', context)

def get_local_ip():
    import socket
    try:
        # Create a dummy socket connection to Google DNS to find the local IP used for routing
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

@login_required(login_url='manager_login')
def manager_update_status(request):
    outlet = get_manager_outlet(request.user)
    context = {'outlet_id': outlet.id if outlet else None}
    return render(request, 'orders/manager_update.html', context)

@login_required(login_url='manager_login')
def manager_call_token(request):
    outlet = get_manager_outlet(request.user)
    context = {'outlet_id': outlet.id if outlet else None}
    return render(request, 'orders/manager_call.html', context)

# Deprecated/Renamed
def manager_dashboard(request):
    return redirect('manager_menu')

def track_order_page(request):
    vapid_key_obj = None
    vapid_public_key = None

    try:
        vapid_private_key_path = os.getenv("VAPID_PRIVATE_KEY")
        if vapid_private_key_path:
            # Clean path
            vapid_private_key_path = vapid_private_key_path.strip().replace('"', '').replace("'", "")
            
            # Resolve absolute path
            if os.path.isabs(vapid_private_key_path):
                key_path = Path(vapid_private_key_path)
            else:
                key_path = settings.BASE_DIR / vapid_private_key_path

            if key_path.exists():
                vapid_key_obj = Vapid.from_pem(key_path.read_bytes())
                # Extract Public Key (Uncompressed format for JS)
                # pywebpush Vapid object has .public_key property which is an EC point
                # We need the string representation or bytes
                # Actually, Vapid.from_pem returns an object that handles signing. 
                # To get the public key string for the frontend (Application Server Key):
                # We can access the public key bytes and base64 encode it, OR usually library helpers do this.
                # Looking at pywebpush docs/usage:
                # vapid.public_key is the public key (EllipticCurvePublicNumbers)
                # We need to serialize it.
                # However, simpler way if using pre-generated keys strings. 
                # Since we are using PEM, let's grab it from the library if strictly available.
                # Checking `pywebpush` source... `vapid.public_key` is a property. 
                # But to start simple: 
                # Let's assume the user might have VAPID_PUBLIC_KEY in env for simplicity if deriving fails?
                # No, user didn't have it.
                # Let's derive it.
                public_key_raw = vapid_key_obj.public_key
                # Serialize to Uncompressed Point format (0x04 + x + y) and b64url encode?
                # Actually, for context, let's just pass `vapid_key_obj.public_key` if it returns the string. 
                # If confusing, let's hardcode the derivation or catch error.
                pass

        # FAILSAFE: Use a hardcoded key if derivation fails (only for dev) OR rely on previous finding.
        # Wait, I don't want to break it. 
        # Better approach: Read VAPID_PUBLIC_KEY from Env if exists, else derive.
        # Since I can't easily execute python to check pywebpush behavior here,
        # I will start by just trying to read the PEM and use a helper. 
        # Or, just pass the env var if I ask user to add it. 
        # But deriving is better.
        # Let's try `vapid.public_key` which usually returns the key in valid format.
        if vapid_key_obj:
             # Vapid.public_key in pywebpush usually returns the public key object (cryptography lib).
             # We need to convert it to URL-safe Base64.
             # This is complex in one shot without knowing the lib version.
             # ALTERNATIVE: just pass the key if available.
             pass
             
    except Exception as e:
        print(f"Error loading VAPID key: {e}")

    # SIMPLIFICATION:
    # I will ask the user to add VAPID_PUBLIC_KEY to env or just read it if present.
    # Deriving it in view is risky if I get the encoding wrong blindly.
    # Wait, the user has `private_key.pem`. 
    # Let's try to assume VAPID_PUBLIC_KEY is set in settings. 
    # I will modify the Plan: Update scripts.js to fetch the key from a simple API endpoint? No.
    
    # REVISED PLAN: 
    # 1. Just render the template.
    # 2. Add `VAPID_PUBLIC_KEY` in .env (I'll output it via a command).
    # 3. Pass that string to the template.
    
    context = {
        'vapid_public_key': os.getenv('VAPID_PUBLIC_KEY', '') # Pass env var directly
    }
    return render(request, 'orders/index.html', context)

def service_worker(request):
    from django.shortcuts import render
    return render(request, 'sw.js', content_type='application/javascript')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    outlet = get_manager_outlet(request.user)
    if not outlet:
        return Response({"detail": "Manager not assigned to an outlet."}, status=status.HTTP_403_FORBIDDEN)

    serializer = OrderSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(outlet=outlet)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_order_status(request, pk):
    outlet = get_manager_outlet(request.user)
    if not outlet:
        return Response({"detail": "Manager not assigned to an outlet."}, status=status.HTTP_403_FORBIDDEN)

    order = get_object_or_404(Order, pk=pk, outlet=outlet)
    serializer = OrderSerializer(order, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from datetime import datetime
import threading

# Azure IoT Import (Try/Except to avoid crashing if package issues)
try:
    from azure.iot.hub import IoTHubRegistryManager
except ImportError:
    IoTHubRegistryManager = None

def get_manager_outlet(user):
    """Helper to get the outlet for a logged-in manager."""
    if not user.is_authenticated:
        return None
    try:
        return user.outletmanager.outlet
    except Exception:
        return None

def send_iot_message(order):
    """
    Sends a C2D message to the registered Android TV device for the specific outlet.
    """
    if not order.outlet or not order.outlet.android_tv_device_id:
        print(f"Skipping IoT: No outlet or device ID for Order {order.id}")
        return

    connection_string = os.getenv("IOTHUB_CONNECTION_STRING")
    device_id = order.outlet.android_tv_device_id

    if not connection_string or not IoTHubRegistryManager:
        print("Azure IoT Hub not configured or package missing.")
        return

    try:
        registry_manager = IoTHubRegistryManager(connection_string)
        
        payload = json.dumps({
            "token": order.token_number,
            "timestamp": datetime.now().isoformat()
        })
        
        # Send to specific device defined in the Outlet
        registry_manager.send_c2d_message(device_id, payload)
        print(f"IoT Message sent to {device_id}: {payload}")
        
    except Exception as e:
        print(f"Failed to send IoT Message: {e}")


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def call_order(request, pk):
    # Scope to manager's outlet
    outlet = get_manager_outlet(request.user)
    if not outlet:
         return Response({"detail": "Manager not assigned to an outlet."}, status=status.HTTP_403_FORBIDDEN)

    order = get_object_or_404(Order, pk=pk, outlet=outlet)
    order.is_called = True
    order.save()
    
    # Trigger IoT Message Async
    threading.Thread(target=send_iot_message, args=(order,)).start()
    
    serializer = OrderSerializer(order)
    return Response(serializer.data)

@api_view(['POST'])
@authentication_classes([])
@csrf_exempt
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


# @api_view(['POST'])
# @authentication_classes([])
# @csrf_exempt
# def test_push(request):
#     token_number = request.data.get('token_number')
#     if not token_number:
#         return Response({"detail": "Token number required"}, status=status.HTTP_400_BAD_REQUEST)

#     try:
#         subscriptions = PushSubscription.objects.filter(token_number=token_number)
#         if not subscriptions.exists():
#              return Response({"detail": "No subscription found for this token"}, status=status.HTTP_404_NOT_FOUND)

#         payload = json.dumps({
#             "title": "Food Flash",
#             "message": "Your order update is working!"
#         })
        
#         vapid_private_key_path = os.getenv("VAPID_PRIVATE_KEY")
#         if vapid_private_key_path:
#             vapid_private_key_path = vapid_private_key_path.strip().replace('"', '').replace("'", "")
            
#             # Check if path is already absolute, otherwise use BASE_DIR
#             if os.path.isabs(vapid_private_key_path):
#                 key_path = Path(vapid_private_key_path)
#             else:
#                 key_path = settings.BASE_DIR / vapid_private_key_path
            
#             if key_path.exists():
#                  # Read as bytes for correct PEM parsing
#                  with open(str(key_path), "rb") as f:
#                      vapid_private_key_bytes = f.read()
                 
#                  # Explicitly parse as PEM to avoid fuzzy string guessing
#                  try:
#                      vapid_key_obj = Vapid.from_pem(vapid_private_key_bytes)
#                  except Exception as ex:
#                      print(f"Failed to parse PEM: {ex}")
#                      # Fallback (unlikely to work if PEM failed, but safe)
#                      vapid_key_obj = vapid_private_key_bytes
#             else:
#                  vapid_key_obj = None
#         else:
#             vapid_key_obj = None
        
#         vapid_claims = {"sub": f"mailto:{os.getenv('VAPID_ADMIN_EMAIL')}"}
        
#         success_count = 0
#         if vapid_key_obj:
#             for sub in subscriptions:
#                 try:
#                     webpush(
#                         subscription_info={
#                             "endpoint": sub.endpoint,
#                             "keys": {
#                                 "p256dh": sub.p256dh,
#                                 "auth": sub.auth
#                             }
#                         },
#                         data=payload,
#                         vapid_private_key=vapid_key_obj,
#                         vapid_claims=vapid_claims
#                     )
#                     success_count += 1
#                 except WebPushException as e:
#                     print(f"Test Push failed: {e}")
#                     return Response({"detail": f"Push failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
#         return Response({"detail": f"Test notification sent to {success_count} devices."}, status=status.HTTP_200_OK)

#     except Exception as e:
#         import traceback
#         debug_info = {
#             "error": str(e),
#             "traceback": traceback.format_exc(),
#             "env_var_raw": os.getenv("VAPID_PRIVATE_KEY"),
#             "resolved_path": str(key_path) if 'key_path' in locals() else "N/A",
#             "path_exists": key_path.exists() if 'key_path' in locals() and isinstance(key_path, Path) else "N/A",
#             "key_obj_type": str(type(vapid_key_obj)) if 'vapid_key_obj' in locals() else "N/A"
#         }
#         print(f"Test Notification error: {e}")
#         return Response(debug_info, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# from pywebpush import webpush, WebPushException
# from rest_framework.decorators import api_view, authentication_classes
# from rest_framework.response import Response
# from rest_framework import status
# from django.conf import settings
# import json
# import os

@api_view(['POST'])
@authentication_classes([])
def test_push(request):
    print(f"DEBUG INPUT: Content-Type: {request.content_type}")
    print(f"DEBUG INPUT: Raw Body: {request.body}")
    print(f"DEBUG INPUT: Parsed Data: {request.data}")

    token_number = request.data.get("token_number")
    
    if not token_number:
        return Response({
            "detail": "Token number required",
            "received_data": request.data,
            "content_type": request.content_type
        }, status=400)

    subscriptions = PushSubscription.objects.filter(token_number=token_number)
    print(f"DEBUG: Found {subscriptions.count()} subscriptions for {token_number}")

    if not subscriptions.exists():
        return Response({"detail": "No subscription found"}, status=404)

    payload = json.dumps({
        "title": "Food Flash",
        "message": "Your order update is working!"
    })

    vapid_private_key = os.getenv("VAPID_PRIVATE_KEY")
    vapid_claims = {
        "sub": f"mailto:{os.getenv('VAPID_ADMIN_EMAIL')}"
    }

    success_count = 0
    failure_count = 0
    
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
            success_count += 1
        except WebPushException as e:
            # Check for 410 Gone (Expired), 404 Not Found, or 403 Forbidden (Key Mismatch)
            if any(code in str(e) for code in ["410", "404", "403"]):
                print(f"Removing invalid subscription for token {token_number} (Error: {e})")
                sub.delete()
            else:
                print(f"Push failed for {sub.id}: {e}")
            failure_count += 1

    return Response({
        "detail": f"Test push finished. Success: {success_count}, Failed/Removed: {failure_count}"
    }, status=200)

from rest_framework import generics
from rest_framework import serializers
from .serializers import ChatMessageSerializer
from .models import ChatMessage

class ChatMessageListCreate(generics.ListCreateAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [] # Open for now, or use IsAuthenticated if login required
    authentication_classes = [] 

    def get_queryset(self):
        token = self.kwargs['token']
        return ChatMessage.objects.filter(order__token_number=token)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        token = self.kwargs['token']
        order = Order.objects.filter(token_number=token).last() # Get latest order for token
        if order:
            instance = serializer.save(order=order)
            
            # --- PUSH TRIGGER FOR MANAGER MESSAGES ---
            # If manager sends a message, push it to customer
            if instance.sender == 'MANAGER':
                self.send_push_notification(token, instance.message)
        else:
            raise serializers.ValidationError("Order not found")

    def send_push_notification(self, token_number, message_text):
        try:
            subscriptions = PushSubscription.objects.filter(token_number=token_number)
            if not subscriptions.exists():
                return

            payload = json.dumps({
                 "title": "Food Flash Manager",
                 "message": message_text,
                 "type": "manager", # Critical for Frontend Listener
                 "token_no": token_number
            })
            
            vapid_private_key = os.getenv("VAPID_PRIVATE_KEY")
            vapid_claims = {"sub": f"mailto:{os.getenv('VAPID_ADMIN_EMAIL')}"}
            
            for sub in subscriptions:
                try:
                    webpush(
                        subscription_info={
                            "endpoint": sub.endpoint,
                            "keys": {"p256dh": sub.p256dh, "auth": sub.auth}
                        },
                        data=payload,
                        vapid_private_key=vapid_private_key,
                        vapid_claims=vapid_claims
                    )
                    pass
                except WebPushException as e:
                    if "410" in str(e) or "404" in str(e):
                        sub.delete()
        except Exception as e:
            pass

from django.views.generic import TemplateView

class ManagerDashboardView(TemplateView):
    template_name = "orders/manager_chat.html"
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Get all active orders (not delivered/cancelled) for the list
        outlet = get_manager_outlet(self.request.user)
        if outlet:
            context['active_orders'] = Order.objects.filter(outlet=outlet, status__in=['PREPARING', 'READY']).order_by('-created_at')
        else:
            context['active_orders'] = []
        return context




