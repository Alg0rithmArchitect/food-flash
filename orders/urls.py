from django.urls import path
from . import views

urlpatterns = [
    path('', views.create_order, name='create_order'),
    path('<int:pk>/status/', views.update_order_status, name='update_order_status'),
    path('<int:pk>/call/', views.call_order, name='call_order'),
    path('track/', views.track_order, name='track_order'),
    path('track-page/', views.track_order_page, name='track_order_page'),
]
