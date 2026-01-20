from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from .models import Order, PushSubscription
from unittest.mock import patch

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

class UpdateOrderStatusTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='manager', password='password')
        self.order = Order.objects.create(token_number=202, status='PREPARING')
        self.url = reverse('update_order_status', args=[self.order.pk])

    def test_update_status_authenticated(self):
        self.client.force_authenticate(user=self.user)
        data = {'status': 'READY'}
        response = self.client.patch(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'READY')
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'READY')

    def test_update_status_invalid_value(self):
        self.client.force_authenticate(user=self.user)
        data = {'status': 'INVALID_STATUS'}
        response = self.client.patch(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'PREPARING')

    def test_update_status_unauthenticated(self):
        data = {'status': 'READY'}
        response = self.client.patch(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'PREPARING')


class CallOrderTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='manager', password='password')
        self.order = Order.objects.create(token_number=303, status='READY')
        self.url = reverse('call_order', args=[self.order.pk])

    def test_call_order_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_called'])
        self.order.refresh_from_db()
        self.assertTrue(self.order.is_called)

    def test_call_order_unauthenticated(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.order.refresh_from_db()
        self.assertFalse(self.order.is_called)

class PushSubscriptionTests(APITestCase):
    def setUp(self):
        self.url = reverse('push_subscribe')
        self.data = {
            'token_number': 505,
            'endpoint': 'https://fcm.googleapis.com/fcm/send/eR5...',
            'keys': {
                'p256dh': 'BNabc123...',
                'auth': 'AuthSecret123'
            }
        }

    def test_subscribe_valid(self):
        # No authentication required
        response = self.client.post(self.url, self.data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PushSubscription.objects.count(), 1)
        sub = PushSubscription.objects.get()
        self.assertEqual(sub.token_number, 505)
        self.assertEqual(sub.p256dh, 'BNabc123...')

    def test_subscribe_missing_fields(self):
        data = {'token_number': 505} # Missing keys/endpoint
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class NotificationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='manager', password='password')
        self.order = Order.objects.create(token_number=707, status='PREPARING')
        PushSubscription.objects.create(
            token_number=707,
            endpoint='https://example.com/push',
            p256dh='key',
            auth='secret'
        )
        self.url = reverse('update_order_status', args=[self.order.pk])

    @patch('orders.views.webpush')
    @patch('os.getenv')
    def test_send_notification_on_update(self, mock_getenv, mock_webpush):
        # Setup mocks
        mock_getenv.side_effect = lambda k: 'mock_key' if k == 'VAPID_PRIVATE_KEY' else 'admin@example.com'
        
        self.client.force_authenticate(user=self.user)
        data = {'status': 'READY'}
        
        response = self.client.patch(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify webpush was called
        self.assertTrue(mock_webpush.called)
        # Verify payload contains status
        call_args = mock_webpush.call_args[1]
        self.assertIn('READY', call_args['data'])


