from django.contrib import admin
from .models import Order, PushSubscription, Outlet, OutletManager

@admin.register(Outlet)
class OutletAdmin(admin.ModelAdmin):
    list_display = ('name', 'restaurant_name', 'android_tv_device_id')

@admin.register(OutletManager)
class OutletManagerAdmin(admin.ModelAdmin):
    list_display = ('user', 'outlet')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('outlet', 'token_number', 'status', 'is_called', 'created_at', 'updated_at')
    list_filter = ('outlet', 'status', 'is_called', 'created_at')
    search_fields = ('token_number', 'outlet__name')

@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('token_number', 'created_at')
    search_fields = ('token_number',)
