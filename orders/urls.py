from django.urls import path
from . import views

urlpatterns = [
    path('', views.create_order, name='create_order'),
    path('<int:pk>/status/', views.update_order_status, name='update_order_status'),
    path('<int:pk>/call/', views.call_order, name='call_order'),
    path('push/subscribe/', views.subscribe, name='push_subscribe'),
    path('push/test/', views.test_push, name='test_push'),
    path('track/', views.track_order, name='track_order'),
    path('track-page/', views.track_order_page, name='track_order_page'),
    path('chat/<int:token>/', views.ChatMessageListCreate.as_view(), name='chat_api'),
    path('chat/history/', views.get_chat_history, name='get_chat_history'),
    path('manager/chat/', views.ManagerDashboardView.as_view(), name='manager_dashboard'),
    path('outlets/', views.get_outlets, name='list_outlets'),
]
