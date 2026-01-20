from django.contrib import admin
from .models import Order, PushSubscription

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('token_number', 'status', 'is_called', 'created_at', 'updated_at')
    list_filter = ('status', 'is_called', 'created_at')
    search_fields = ('token_number',)

@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('token_number', 'created_at')
    search_fields = ('token_number',)
