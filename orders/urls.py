from django.urls import path
from . import views

urlpatterns = [
    path('track/', views.track_order, name='track_order'),
    path('track-page/', views.track_order_page, name='track_order_page'),
]
