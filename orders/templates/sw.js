// Force SW Update
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('push', async function (event) {
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

    const options = {
        body: message,
        icon: 'https://cdn-icons-png.flaticon.com/512/7541/7541700.png',
        vibrate: [200, 100, 200], // User Requested Pattern
        tag: 'food-flash-urgent-v2', // NEW TAG forces new channel creation on Android
        renotify: true,
        silent: false,
        timestamp: Date.now(),
        requireInteraction: true,
        data: data
    };

    event.waitUntil(
        Promise.all([
            self.registration.showNotification(title, options),
            // SEND TO OPEN CLIENTS
            self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'PUSH_STATUS_UPDATE',
                        payload: data
                    });
                });
            })
        ])
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            // Check if there is already a window for this app open and focus it
            for (let client of windowClients) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
