from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from .models import Order

class CreateOrderTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='manager', password='password')
        self.url = reverse('create_order')
        self.data = {'token_number': 101}

    def test_create_order_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, self.data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['token_number'], 101)
        self.assertEqual(response.data['status'], 'PREPARING')
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(Order.objects.get().status, 'PREPARING')

    def test_create_order_unauthenticated(self):
        response = self.client.post(self.url, self.data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Order.objects.count(), 0)
