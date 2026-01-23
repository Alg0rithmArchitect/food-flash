"""
URL configuration for foodflash project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from orders import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/orders/', include('orders.urls')),
    path('', RedirectView.as_view(url='/food-flash/', permanent=False)),
    
    # Customer Main Entry
    path('food-flash/', views.customer_landing, name='landing'),
    path('food-flash/track/', views.track_order_page, name='track_order'),
    
    # Manager Authentication
    path('food-flash/manager/login/', views.manager_login, name='manager_login'),
    path('food-flash/manager/logout/', views.manager_logout, name='manager_logout'),
    
    # Manager Flow
    path('food-flash/manager/', views.manager_menu, name='manager_home'), # Redirects to menu if logged in
    path('food-flash/manager/dashboard/', views.manager_menu, name='manager_menu'),
    
    # Manager Features
    path('food-flash/manager/create/', views.manager_create_order, name='manager_create'),
    path('food-flash/manager/update/', views.manager_update_status, name='manager_update'),
    path('food-flash/manager/call/', views.manager_call_token, name='manager_call'),
    
    # Existing SW
    path('sw.js', views.service_worker),
]

