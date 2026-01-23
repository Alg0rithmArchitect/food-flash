self.addEventListener('push', function (event) {
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            console.error('Error parsing push data:', e);
        }
    }

    const title = data.title || 'Food Flash Update';
    const message = data.message || 'Your order status has updated.';

    event.waitUntil(
        self.registration.showNotification(title, {
            body: message,
            icon: '/static/icon.png', // Fallback icon if you have one
            vibrate: [200, 100, 200, 100, 200],
            requireInteraction: true
        })
    );
});
