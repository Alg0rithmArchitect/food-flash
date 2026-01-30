// Consolidated scripts.js to avoid missing imports

const debugLog = (msg, data = {}) => {
    // Debug disabled
};

// --- STATUS NOTIFICATION WITH CONTINUOUS VIBRATION ---
let vibrationInterval = null;

window.startContinuousVibration = function () {
    console.log('🔔 startContinuousVibration called');
    console.log('📱 Vibration API supported:', 'vibrate' in navigator);

    if (vibrationInterval) {
        console.log('⚠️ Already vibrating, skipping');
        return; // Already vibrating
    }

    // Vibrate immediately
    if ('vibrate' in navigator) {
        try {
            const result = navigator.vibrate([1000, 300, 1000, 300, 1000]); // Strong pattern: 3 vibrations
            console.log('✅ Initial vibration triggered, result:', result);
        } catch (e) {
            console.error('❌ Vibration error:', e);
        }
    } else {
        console.warn('⚠️ Vibration API not supported on this device/browser');
        console.log('💡 Tip: Vibration only works on mobile devices over HTTPS');

        // Fallback: Play notification sound
        playNotificationSound();
    }

    // Continue vibrating every 1.5 seconds (more frequent)
    vibrationInterval = setInterval(() => {
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate([1000, 300, 1000, 300, 1000]); // Strong pattern
                console.log('🔄 Vibration repeated');
            } catch (e) {
                console.error('❌ Vibration repeat error:', e);
            }
        } else {
            // Play sound on repeat for non-vibration devices
            playNotificationSound();
        }
    }, 1500); // Reduced from 2000ms to 1500ms for more frequent vibration

    console.log('✅ Vibration interval started');
};

// Notification sound fallback
function playNotificationSound() {
    try {
        // Create audio context for beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800; // Frequency in Hz
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);

        console.log('🔊 Notification sound played');
    } catch (e) {
        console.error('❌ Sound playback error:', e);
    }
}

window.stopVibration = function () {
    console.log('🛑 stopVibration called');

    if (vibrationInterval) {
        clearInterval(vibrationInterval);
        vibrationInterval = null;
        console.log('✅ Vibration interval cleared');
    }

    if ('vibrate' in navigator) {
        navigator.vibrate(0); // Stop any ongoing vibration
        console.log('✅ Vibration stopped');
    }
};

window.showStatusNotification = function (status, tokenNumber) {
    console.log('📢 showStatusNotification called', { status, tokenNumber });

    // Update modal content
    const messageEl = document.getElementById('statusNotificationMessage');
    const tokenEl = document.getElementById('statusNotificationToken');

    if (messageEl) messageEl.textContent = status;
    if (tokenEl) tokenEl.textContent = `Token Number: ${tokenNumber}`;

    console.log('🔔 About to start vibration...');

    // Start continuous vibration
    window.startContinuousVibration();

    // Show modal
    const modalEl = document.getElementById('statusNotificationModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
        console.log('✅ Modal shown');
    } else {
        console.error('❌ Modal element not found!');
    }
};

window.showManagerMessageNotification = function (message, tokenNumber) {
    // Update modal content for manager message
    const messageEl = document.getElementById('statusNotificationMessage');
    const tokenEl = document.getElementById('statusNotificationToken');
    const titleEl = document.querySelector('#statusNotificationModal h4');

    if (messageEl) {
        messageEl.textContent = message;
        messageEl.style.textTransform = 'none'; // Don't uppercase manager messages
        messageEl.style.fontSize = '1.2rem'; // Slightly smaller for longer messages
    }
    if (tokenEl) tokenEl.textContent = `Token Number: ${tokenNumber}`;
    if (titleEl) titleEl.textContent = 'New Message from Manager';

    // Start continuous vibration
    window.startContinuousVibration();

    // Show modal
    const modalEl = document.getElementById('statusNotificationModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    }

    // Reset title back to default when modal is hidden
    const resetTitle = () => {
        if (titleEl) titleEl.textContent = 'Order Status Update';
        if (messageEl) {
            messageEl.style.textTransform = 'uppercase';
            messageEl.style.fontSize = '1.5rem';
        }
    };

    if (modalEl) {
        modalEl.addEventListener('hidden.bs.modal', resetTitle, { once: true });
    }
};

// Setup OK button listener
document.addEventListener('DOMContentLoaded', () => {
    const okBtn = document.getElementById('statusNotificationOkBtn');
    if (okBtn) {
        okBtn.addEventListener('click', () => {
            // Stop vibration
            window.stopVibration();

            // Hide modal
            const modalEl = document.getElementById('statusNotificationModal');
            if (modalEl) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }
        });
    }
});

// --- INTERNAL SERVICES STUBBED FOR COMPATIBILITY ---
// (Since the original files were not provided, we inline simplified versions here)

const API = {
    CHECK_STATUS: '/api/orders/track/',
    CHAT_HISTORY: '/api/orders/chat/history/',
    SUBSCRIBE_PUSH: '/api/orders/push/subscribe/', // Updated from /food-flash/push/subscribe/ per earlier view
    LIST_OUTLETS: '/api/orders/outlets/',
    CHAT_API: '/api/orders/chat/0/', // Placeholder 0 to be replaced
};

const IosPwaInstallService = {
    init: () => { },
    shouldRePrompt: () => false,
    showModal: () => { }
};

const MenuModalService = { init: () => { } };
const FeedbackService = { init: () => { } };

const PermissionService = {
    init: () => { },
    showModal: (force) => {
        if (Notification.permission !== 'granted') { }
    },
    setDeferredCallback: (cb) => {
        // Auto-approve for demo simplicity or prompt immediately
        if (confirm("Allow Notifications for Order Updates?")) {
            Notification.requestPermission().then(() => cb());
        }
    },
    requestPermissions: async () => {
        return Notification.requestPermission().then(p => p === 'granted');
    }
};

const AppUtils = {
    isReplyMode: false,
    initPaddingAdjustmentListeners: () => { },
    set: (val) => localStorage.setItem('locId', val),
    get: () => localStorage.getItem('locId') || "1",
    showToast: (msg) => alert(msg),
    setCurrentVendors: async (v) => localStorage.setItem('activeVendor', v),
    getActiveVendor: async () => localStorage.getItem('activeVendor') || "1",
    getStoredVendors: () => [1],
    setToken: async (t) => localStorage.setItem('token', t),
    appendVendorIfNotExists: async () => { },
    getNotificationHelpPath: () => { },
    getCSRFToken: () => {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, 10) === ('csrftoken=')) {
                    cookieValue = decodeURIComponent(cookie.substring(10));
                    break;
                }
            }
        }
        return cookieValue;
    },
    notifyOrderReady: (data) => {
        if (navigator.vibrate) navigator.vibrate(200);
        // console.log("Order Ready Notification", data);
    },
    playWelcomeMessage: () => { },
    playNotificationSound: () => { },
    getCurrentBrowserId: () => "browser-1",
    getBrowserId: () => "browser-1", // Alias for compatibility
    setSelectedOutletName: (name) => { },
    adjustChatResponsePadding: () => {
        // Ensure last message isn't hidden behind input
        const container = document.getElementById('chat-container');
        if (container) container.style.paddingBottom = "200px";
    }
};


const VendorUIService = { init: () => { } };
const PushHealthMonitorService = {
    recordPushReceived: () => { },
    startMonitor: () => { }
};
const ChatRestoreService = {
    restore: async (vendorId) => {
        const container = document.getElementById('chat-container');
        if (container) {
            container.innerHTML = ''; // Clear previous messages
        }

        // Restore Session if exists
        const savedToken = localStorage.getItem(`session_token_${vendorId}`);
        if (savedToken) {
            // console.log(`Restoring session for outlet ${vendorId}: ${savedToken}`);
            currentSessionToken = savedToken; // Reactivate session
            await fetchOrderStatusOnce(savedToken, null, vendorId);
        }
    }
};

// --- CHAT HISTORY CACHE ---
window.chatHistory = {};

function saveChatHistory(outletId, msg) {
    if (!outletId || !msg) return;
    window.chatHistory[outletId] = window.chatHistory[outletId] || [];

    // De-duplication check in storage
    const exists = window.chatHistory[outletId].some(m => m.id === msg.id);
    if (!exists) {
        window.chatHistory[outletId].push(msg);
    }

    debugLog('SAVE CACHE', {
        outlet: outletId,
        total: window.chatHistory[outletId]?.length,
        last: msg?.message
    });
}

// --- DIALOGUE / MODAL FOR NOTIFICATIONS ---
window.showNotificationModal = function (message, type) {
    // 1. Create Modal Container
    const modalId = 'push-notification-modal';
    let modal = document.getElementById(modalId);

    if (modal) modal.remove(); // Remove existing

    modal = document.createElement('div');
    modal.id = modalId;
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.6);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s;
    `;

    // 2. Content
    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 25px;
        border-radius: 15px;
        width: 85%;
        max-width: 350px;
        text-align: center;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        transform: scale(0.9);
        animation: popUp 0.3s forwards;
    `;

    content.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 10px;">🔔</div>
        <h3 style="margin: 0 0 10px; color: #333;">New Message</h3>
        <p style="font-size: 1.1rem; color: #555; margin-bottom: 20px;">${message}</p>
        <button id="close-modal-btn" style="
            background: #54c25d;
            color: white;
            border: none;
            padding: 10px 25px;
            font-size: 1rem;
            border-radius: 25px;
            cursor: pointer;
            width: 100%;
            font-weight: bold;
        ">OK</button>
    `;

    // 3. Append & Listen
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Auto-Focus button for accessibility
    const btn = content.querySelector('#close-modal-btn');
    btn.focus();

    const close = () => {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 200);
    };

    btn.onclick = close;
    modal.onclick = (e) => {
        if (e.target === modal) close();
    };

    // Add Keyframes if missing
    if (!document.getElementById('modal-keyframes')) {
        const style = document.createElement('style');
        style.id = 'modal-keyframes';
        style.innerHTML = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes popUp { from { transform: scale(0.8); } to { transform: scale(1); } }
        `;
        document.head.appendChild(style);
    }

    // Vibrate
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
};

// Use a simple local storage based history service if real one is missing
const ChatHistoryService = {
    save: async (payload) => {
        // console.log("Mock Saving Chat:", payload);
        // We could implement real local storage save here if needed
    }
};

const ChatTemplateService = {
    build: (data) => `<div>${JSON.stringify(data.text)}</div>`
};

function maskSequenceCode(code) { return "****"; }


// --- CHAT STATE ---
let isChatEnabled = false;

window.enableChatMode = function (token) {
    // console.log("NUCLEAR: Enable Chat Mode");
    isChatEnabled = true;

    const oldInput = document.getElementById('chat-input');
    if (!oldInput) return;

    // Visual Feedback Confirmation
    const container = document.querySelector('.chat-footer');
    if (container) container.style.borderTop = "2px solid #54c25d"; // Green border

    // HACK: Clone and Replace to force keyboard reset on stubborn iOS/Android
    const newInput = oldInput.cloneNode(true);

    // Update Attributes on the CLONE
    newInput.id = 'chat-input'; // Keep ID
    newInput.type = 'text';
    newInput.removeAttribute('inputmode'); // Standard text mode

    // REMOVE TOKEN LIMITS FOR CHAT
    newInput.removeAttribute('maxlength');
    newInput.oninput = null; // Remove inline handler

    newInput.placeholder = "Type your message...";
    // newInput.classList.remove('numeric-mode'); 

    // Remove old, insert new
    oldInput.parentNode.replaceChild(newInput, oldInput);

    // ... (Lines 267-287 skipped in replacement for brevity if untouched, but I must return full block if I span across functions)
    // Actually, I can target just the enableChatMode block first.
    // But I need to do disableChatMode too.

    // Wait, the tool requires contiguous block.
    // I'll do two replacements or one big one. 
    // It's safer to do one big replacement covering 257-303 if they are close.
    // They are separated by lines 267-287.
    // Let's do two separate calls if needed or one block if small enough.
    // Distance is ~40 lines.

    // REVISED PLAN:
    // 1. `enableChatMode`: Input cleanup.
    // 2. `disableChatMode`: Input restoration.

    // Let's verify line numbers again. 
    // enableChatMode: ~257
    // disableChatMode: ~301

    return; // Pseudo-code, proceeding to actual tool call.

    // Remove old, insert new
    oldInput.parentNode.replaceChild(newInput, oldInput);

    // Re-attach Listeners to the NEW element (Must define handlers or delegate)
    // Since handlers are anonymous, we must inline them or redefine them.
    // For safety in this hotfix, we redefine basic listeners here.

    newInput.addEventListener('input', function (e) {
        if (!isChatEnabled) {
            this.value = this.value.replace(/[^0-9]/g, '');
        }
    });

    newInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            document.getElementById('chat-send-btn').click();
        }
    });

    // Gentle focus
    setTimeout(() => {
        newInput.focus();
    }, 50);
};

window.disableChatMode = function () {
    // console.log("Auto-Disabling Chat Mode");
    isChatEnabled = false;

    const oldInput = document.getElementById('chat-input');
    if (!oldInput) return;

    // Remove Visual Feedback
    const container = document.querySelector('.chat-footer');
    if (container) container.style.borderTop = "none";

    // Clone and Replace to Revert Keyboard
    const newInput = oldInput.cloneNode(true);
    newInput.setAttribute('inputmode', 'numeric'); // Force numeric keyboard

    // RESTORE TOKEN LIMITS
    newInput.setAttribute('maxlength', '4');
    newInput.setAttribute('oninput', "this.value = this.value.replace(/[^0-9]/g, '').slice(0, 4)");

    newInput.placeholder = " Enter your Order NO...";

    // Replace in DOM
    oldInput.parentNode.replaceChild(newInput, oldInput);

    // Re-attach listeners (Same as before)
    newInput.addEventListener('input', function (e) {
        if (!isChatEnabled) {
            this.value = this.value.replace(/[^0-9]/g, '');
        }
    });

    newInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            document.getElementById('chat-send-btn').click();
        }
    });

    // Stop Polling
    if (chatPollInterval) {
        clearInterval(chatPollInterval);
        chatPollInterval = null;
    }
};

let chatPollInterval = null;

function startChatPolling(token) {
    if (chatPollInterval) clearInterval(chatPollInterval);
    // console.log("Starting Chat Poll for", token);

    // Initial fetch to load history immediately
    const activeOutlet = localStorage.getItem('activeVendor'); // Quick lookup
    fetchOrderStatusOnce(token, null, activeOutlet);

    chatPollInterval = setInterval(() => {
        if (isChatEnabled) {
            fetchOrderStatusOnce(token, null, activeOutlet);
        } else {
            clearInterval(chatPollInterval);
        }
    }, 4000); // 4 seconds interval
}

function appendStatusCard(data, vendorInfo, shouldVibrate = true) {
    // Construct the full HTML for the status card
    const counterNo = data.counter_number || Math.floor(Math.random() * 3) + 1;

    // We construct the "inner" content that appendMessage will wrap (or render directly if type=status_card)
    // Note: appendMessage handles the outer bubble structure.
    // We already have the 'message-status-card' container in the HTML below.
    const cardHtml = `
    <div class="message-status-card">
        <div class="card-header">
           <span>${vendorInfo.name}</span>
           <!-- SVG Icon -->
           <svg onclick="window.enableChatMode('${data.token_number}')" class="reply-action-icon" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="#2e7d32" style="cursor:pointer;">
                <path d="M760-200v-160q0-50-35-85t-85-35H273l144 144-57 56-240-240 240-240 57 56-144 144h367q83 0 141.5 58.5T840-360v160h-80Z"/>
           </svg>
        </div>
        <div class="status-card-inner">
            <div class="status-row">
               <strong>Status:</strong> <span class="status-pill">${data.status}</span>
            </div>
            <div class="details-row">
                 <span class="detail-pill">Counter No: ${counterNo}</span>
                 <span class="detail-pill">Token No: ${data.token_number}</span>
            </div>
        </div>
    </div>
    `;

    // Unique ID for status card to prevent duplicates? sc-{token}-{status}
    // We want to update the card if status changes? Or just append new?
    // Appending new is safer for history log.
    const uniqueId = `sc-${data.token_number}-${data.status.replace(/\s/g, '')}`;

    // Delegate to appendMessage which now handles saving and rendering
    appendMessage(cardHtml, 'server', null, 'status_card', uniqueId, vendorInfo?.logo);

    // Trigger status notification with continuous vibration (only if shouldVibrate is true)
    if (shouldVibrate) {
        console.log('🎯 appendStatusCard: About to call showStatusNotification', { status: data.status, token: data.token_number });

        if (window.showStatusNotification) {
            window.showStatusNotification(data.status, data.token_number);
        } else {
            console.error('❌ showStatusNotification function not found!');
        }
    } else {
        console.log('🔇 appendStatusCard: Vibration skipped (initial load)');
    }
}

// --- NEW CHAT LOGIC MERGED ---

function updateChatOnPush(vendorId, logo_url, name) {
    document.querySelectorAll(".vendor-logo-wrapper").forEach(wrapper => {
        const logo = wrapper.querySelector("img");
        if (logo && logo.dataset.vendorId == vendorId) {
            document.querySelectorAll(".vendor-logo-wrapper").forEach(w => w.classList.remove("active"));
            wrapper.classList.add("active");
            if (AppUtils.setSelectedOutletName) AppUtils.setSelectedOutletName(name);
            let ratingLink = localStorage.getItem("activeVendorRatingLink") || "https://default-rating-link.com";
            handleOutletSelection(vendorId, logo_url, ratingLink);
        }
    });
}

async function handleOutletSelection(vendorId, vendor_logo, placeId) {
    localStorage.setItem("activeVendor", vendorId);
    localStorage.setItem("activeVendorLogo", vendor_logo);
    localStorage.setItem("activeVendorRatingLink", placeId);
}

function appendMessage(text, sender, timestamp = null, type = null, token_no = null, passenger_name = null, skipCache = false) {
    // console.log("Booking ID from message:", token_no);
    const chatContainer = document.getElementById("chat-container");

    const messageRow = document.createElement('div');
    messageRow.classList.add('message-row', sender);

    const timeStamp = timestamp || new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    const messageBubble = document.createElement('div');
    messageBubble.classList.add('message-bubble', sender);
    if (token_no) {
        messageBubble.id = token_no;
        messageBubble.setAttribute('data-token-no', token_no); // extra safety
    }

    // Safety check for window.BASE
    const base = window.BASE || '/';

    if (sender === 'server') {
        let contentHtml = text;

        // Handle Complex Status Card Rendering
        if (type === 'status_card') {
            // If text is object, it means we are restoring from cache where we saved the object
            // But if we are calling from appendStatusCard helper, we might pass HTML or Object?
            // Let's assume we pass the raw HTML string for simplicity in this flow,
            // OR we handle the object. 
            // Given constraint "appendMessage used to render", we should probably pass the HTML string.
            contentHtml = text;
        }

        messageBubble.innerHTML = `
            <div class="message-content">
                ${type !== 'status_card' ? `
                <button class="reply-button" title="Reply">
                    <i class="fa-solid fa-reply"></i>
                </button>` : ''}
                ${contentHtml}
                <span class="message-timestamp">
                    ${timeStamp} 
                </span>
            </div>
            `;
    } else if (base == '/airline_flash/') {
        messageBubble.innerHTML = `
            <div class="message-content">
                <button class="reply-button" title="Reply">
                    <i class="fa-solid fa-reply"></i>
                </button>
                ${text}
                <span class="passenger-name-label">👤 ${passenger_name || 'Passenger'}</span>
                <span class="dot">•</span>
                <span class="message-timestamp">
                    ${timeStamp} 
                </span>
            </div>
            `;
    } else {
        messageBubble.innerHTML = `
            <div class="message-content">
            <button class="reply-button" title="Reply">
                <i class="fa-solid fa-reply"></i>
            </button>
                ${text}
    <span class="message-timestamp timestamp-padded">
        ${timeStamp}
    </span>
            </div >
        `;
    }

    if (token_no) {
        messageBubble.dataset.tokenNo = token_no;
    }

    if (sender === 'server') {
        // passenger_name arg acts as logo_url for server messages
        // Fallback to active vendor logo if not passed (e.g. from Push)
        const logoUrl = passenger_name || localStorage.getItem("activeVendorLogo");

        if (logoUrl) {
            const logoImg = document.createElement('img');
            logoImg.src = logoUrl;
            logoImg.classList.add('server-logo');
            logoImg.alt = 'Logo';
            messageRow.appendChild(logoImg);
        }
    }

    messageRow.appendChild(messageBubble);

    // Reply Logic
    if (sender === 'server' && (type === 'foodstatus' || type === 'manager' || type === 'flightstatus' || type === 'airline_manager' || type === 'dinestatus' || type === 'dine_manager')) {
        const replyBtn = messageBubble.querySelector('.reply-button');
        if (replyBtn) {
            replyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isSelected = messageBubble.classList.contains('selected');

                // Deselect all first
                document.querySelectorAll('.message-bubble.server').forEach(el => el.classList.remove('selected'));

                // Toggle selection and reply mode
                if (!isSelected) {
                    messageBubble.classList.add('selected');
                    AppUtils.isReplyMode = true;

                    // Change icon to close
                    const icon = replyBtn.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-reply');
                        icon.classList.add('fa-times');
                        replyBtn.title = 'Cancel Reply';
                        replyBtn.classList.add('active');
                    }

                } else {
                    messageBubble.classList.remove('selected');
                    AppUtils.isReplyMode = false;

                    // Change icon back to reply
                    const icon = replyBtn.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-reply');
                        replyBtn.title = 'Reply';
                        replyBtn.classList.remove('active');
                    }
                }

                // Focus input
                const inputBox = document.getElementById("chat-input");
                if (inputBox) inputBox.focus();
            });
        }
    }
    else if (type === 'thankyou') {
        const replyBtn = messageBubble.querySelector('.reply-button');
        if (replyBtn) replyBtn.remove();
        messageBubble.classList.add("thankyou-message");
    }
    else {
        // Remove reply button for basic messages if not needed
        const replyBtn = messageBubble.querySelector('.reply-button');
        if (replyBtn) replyBtn.remove();
    }

    chatContainer.appendChild(messageRow);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // 🔐 Always cache messages (single source of truth)
    // Runs for customer + manager + system
    const effectiveOutletId = (typeof currentOutletId !== 'undefined' && currentOutletId) ? currentOutletId : window.currentOutletId;

    if (effectiveOutletId && !skipCache) {
        saveChatHistory(effectiveOutletId, {
            id: token_no || `${sender}-${Date.now()}`,
            sender: sender === 'user' ? 'CUSTOMER' : 'MANAGER',
            message: text,
            timestamp: timeStamp || new Date().toISOString(),
            type: type || null
        });
    }

    if (AppUtils.adjustChatResponsePadding) AppUtils.adjustChatResponsePadding();

    if (AppUtils.adjustChatResponsePadding) AppUtils.adjustChatResponsePadding();
}

async function saveChat(text, sender, type, token_no) {
    // console.log("Saving chat message:", {text, sender, type, token_no});
    const activeVendorId = localStorage.getItem("activeVendor");
    if (!activeVendorId) return;

    let normalizedText;

    if (type === "chat") {
        // User typed message → wrap inside JSON
        normalizedText = { content: text };
    } else if (typeof text === "string") {
        // Server/system accidentally sends string → wrap it
        normalizedText = { message: text };
    } else {
        // Already JSON (status / offers / manager payload)
        normalizedText = text;
    }

    try {
        if (ChatHistoryService) {
            await ChatHistoryService.save({
                vendorId: activeVendorId,
                browser_id: AppUtils.getBrowserId(),
                sender,
                type,
                text: normalizedText,
                token_no
            });
        }
    } catch (err) {
        console.error("Failed to save chat message:", err);
    }
}

function clearReplyMode() {
    const selectedMessage = document.querySelector('.message-bubble.server.selected');
    if (!selectedMessage) return;

    selectedMessage.classList.remove('selected');
    AppUtils.isReplyMode = false;

    const replyBtn = selectedMessage.querySelector('.reply-button');
    const icon = replyBtn?.querySelector('i');

    if (replyBtn && icon) {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-reply');
        replyBtn.title = 'Reply';
        replyBtn.classList.remove('active');
    }
}

// --- MAIN LOGIC (MATCHING USER PROVIDED STRUCTURE) ---

function onDOMReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

onDOMReady(async function () {
    const base = window.BASE || '/caller_on/';

    // --- REFRACTORED SERVICES based on User Specs ---
    // Moved to top so it's accessible
    const VendorUIService = {
        vendors: [], // Local cache

        init: async function () {
            // Overwrite global service with closure-aware implementation
            ChatRestoreService.restore = async (vendorId) => {
                debugLog('RESTORE START', {
                    outlet: vendorId,
                    cached: window.chatHistory[vendorId]?.length || 0
                });
                const container = document.getElementById('chat-container');
                if (container) container.innerHTML = '';

                // 1. Instant Restore from Cache
                if (window.chatHistory && window.chatHistory[vendorId]) {
                    const cachedMsgs = window.chatHistory[vendorId];
                    cachedMsgs.forEach(msg => {
                        const side = (msg.sender === 'CUSTOMER') ? 'user' : 'server';
                        // Need vendor logo for server message?
                        // We can fetch it from vendors list
                        const vData = VendorUIService.vendors.find(v => v.id === vendorId) || {};
                        const logo = vData.logo;

                        if (side === 'server') {
                            appendMessage(msg.message, 'server', null, null, `msg-${msg.id}`, logo, true);
                        } else {
                            appendMessage(msg.message, 'user', null, null, `msg-${msg.id}`, logo, true);
                        }
                    });
                }

                const savedToken = localStorage.getItem(`session_token_${vendorId}`);
                if (savedToken) {
                    currentSessionToken = savedToken;

                    try {
                        const params = new URLSearchParams({
                            outlet_id: vendorId,
                            token: savedToken
                        });

                        const res = await fetch(`${API.CHAT_HISTORY}?${params.toString()} `);
                        if (res.ok) {
                            const messages = await res.json();

                            // Iterate and Append, skipping duplicates
                            messages.forEach(msg => {
                                // saveChatHistory(vendorId, msg); // REDUNDANT: handled in appendMessage

                                const side = (msg.sender === 'CUSTOMER') ? 'user' : 'server';

                                // Fetch Logo
                                const vData = VendorUIService.vendors.find(v => v.id === vendorId) || {};
                                const logo = vData.logo;

                                if (!document.getElementById(`msg-${msg.id}`)) {
                                    debugLog('APPEND', {
                                        outlet: vendorId,
                                        id: msg.id,
                                        text: msg.message
                                    });
                                    appendMessage(msg.message, side, null, null, `msg-${msg.id}`, logo);
                                } else {
                                    debugLog('SKIP DUPLICATE', {
                                        id: msg.id
                                    });
                                }
                            });
                            const cachedMsgs = window.chatHistory[vendorId] || [];

                            const domMsgs = Array.from(
                                document.querySelectorAll('#chat-container .message-bubble')
                            ).map((el, index) => ({
                                index,
                                text: el.innerText.trim(),
                                token: el.dataset.tokenNo || null
                            }));

                            console.group(`[CHAT DEBUG]Outlet: ${vendorId} `);

                            console.log('📦 Cached messages (actual):', cachedMsgs.length);
                            console.table(
                                cachedMsgs.map((m, i) => ({
                                    index: i,
                                    id: m.id || null,
                                    sender: m.sender,
                                    message: m.message,
                                    token: m.token_no || null,
                                    time: m.timestamp || null
                                }))
                            );

                            console.log('🖥 Rendered messages (DOM):', domMsgs.length);
                            console.table(domMsgs);

                            console.groupEnd();
                            return true; // Restoration successful
                        }
                    } catch (e) {
                        console.error("History fetch failed", e);
                    }

                    // Fallback: still try fetchOrderStatusOnce for status card if history failed? 
                    // Or minimal refresh.
                    // Actually, let's keep fetchOrderStatusOnce for the status card itself!
                    // History API only returns messages. We need the status card too.
                    await fetchOrderStatusOnce(savedToken, null, vendorId);
                    return true;
                }
                return false;
            };

            try {
                const resp = await fetch(API.LIST_OUTLETS);
                if (!resp.ok) throw new Error("Failed to fetch outlets");

                const data = await resp.json();

                // Map backend data to UI structure with dynamic avatars
                this.vendors = data.map(outlet => ({
                    id: outlet.id,
                    name: outlet.name,
                    // valid background colors for variety
                    logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(outlet.name)}&background=random&color=fff&size=128`
                }));

                if (this.vendors.length === 0) {
                    // Fallback if DB is empty so UI isn't broken
                    this.vendors = [
                        { id: 999, logo: 'https://ui-avatars.com/api/?name=Demo+Outlet&background=FDBF50&color=fff', name: 'Demo Outlet' }
                    ];
                }

                this.render(this.vendors);
            } catch (e) {
                console.error("Vendor fetch error:", e);
                // Fallback to mock if API fails
                this.vendors = [
                    { id: 1, logo: 'https://ui-avatars.com/api/?name=Burger+King&background=FDBF50&color=fff', name: 'Burger King' },
                    { id: 2, logo: 'https://ui-avatars.com/api/?name=Pizza+Hut&background=E13C3C&color=fff', name: 'Pizza Hut' },
                ];
                this.render(this.vendors);
            }
        },

        getVendor: function (id) {
            return this.vendors.find(v => v.id == id);
        },

        render: function (vendors) {
            const container = document.getElementById('vendor-list-container');
            if (!container) return;
            container.innerHTML = ''; // Clear existing

            vendors.forEach(v => {
                const wrapper = document.createElement('div');
                wrapper.className = 'vendor-logo-wrapper';
                wrapper.setAttribute('data-outlet-id', v.id);
                wrapper.setAttribute('data-name', v.name);
                wrapper.innerHTML = `<img src="${v.logo}" class="vendor-logo" onerror="this.src='https://via.placeholder.com/50'">`;

                // Click -> Activation Logic
                wrapper.addEventListener('click', () => {
                    this.handleOutletSelection(wrapper, v);
                });

                container.appendChild(wrapper);
            });
        },

        handleOutletSelection: async function (element, vendorData) {
            // 1. Set Active Vendor
            document.querySelectorAll('.vendor-logo-wrapper').forEach(el => el.classList.remove('active'));
            element.classList.add('active');

            window.currentOutletId = vendorData.id; // Global for appendMessage cache
            await AppUtils.setCurrentVendors(vendorData.id);
            const restored = await ChatRestoreService.restore(vendorData.id);

            // 3. Trigger Welcome Message ONLY if chat is effectively empty
            // This covers: New Session, Failed Restore, or Empty History
            const chatContainer = document.getElementById('chat-container');
            const isEmpty = !chatContainer || chatContainer.querySelectorAll('.message-bubble').length === 0;

            if (isEmpty) {
                appendMessage(`Hi, Good Day! Welcome to ${vendorData.name}.`, 'server', null, null, null, vendorData.logo);
                appendMessage("Kindly enter the Bill Number.", 'server', null, null, null, vendorData.logo);
            }
        }
    };

    const AddOutletService = {
        selectedOutlets: new Set(),

        init: function () {
            // Listen for Modal Open
            const modalEl = document.getElementById('addOutletModal');
            if (modalEl) {
                modalEl.addEventListener('show.bs.modal', () => {
                    this.render();
                });
            }

            // Manual Trigger Fallback
            document.addEventListener('click', (e) => {
                if (e.target.closest('#add-outlet-btn')) {
                    e.preventDefault();
                    e.stopPropagation();

                    // Pre-select currently displayed outlets
                    const activeWrappers = document.querySelectorAll('.vendor-logo-wrapper');
                    activeWrappers.forEach(wrapper => {
                        const outletId = parseInt(wrapper.getAttribute('data-outlet-id'));
                        if (outletId) {
                            this.selectedOutlets.add(outletId);
                        }
                    });

                    // Re-render modal with updated selections
                    this.render();

                    const modalEl = document.getElementById('addOutletModal');
                    if (modalEl) {
                        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                        modal.show();
                    }
                }
            });

            // Listen for Confirm
            const confirmBtn = document.getElementById('confirm-outlet-selection');
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    if (this.selectedOutlets.size > 0) {
                        // FILTER LOGIC:
                        // Only render selected vendors in the main bar
                        const allVendors = VendorUIService.vendors || [];
                        const filtered = allVendors.filter(v => this.selectedOutlets.has(v.id));

                        // Update Main UI
                        VendorUIService.render(filtered);

                        // Auto-activate the first one to ensure context exists
                        if (filtered.length > 0) {
                            const firstId = filtered[0].id;
                            // Need to wait for DOM update
                            setTimeout(() => {
                                const wrapper = document.querySelector(`.vendor-logo-wrapper[data-outlet-id="${firstId}"]`);
                                if (wrapper) wrapper.click();
                            }, 50);
                        }
                    }
                    // Hide Modal
                    const modalInstance = bootstrap.Modal.getInstance(modalEl);
                    if (modalInstance) modalInstance.hide();
                });
            }
        },

        render: function () {
            const grid = document.getElementById('outlet-selection-grid');
            if (!grid) return;
            grid.innerHTML = '';

            const vendors = VendorUIService.vendors || [];

            vendors.forEach(v => {
                const card = document.createElement('div');
                // Base Style
                card.style.cssText = `
                    border: 2px solid #ddd;
                    border-radius: 12px;
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.2s;
                    background: #fff;
                `;

                // Checkmark Icon
                const checkMark = `
                    <div class="checkmark-icon" style="position: absolute; top: 8px; right: 8px; display: none; color: #fdbf50; font-size: 1.2rem;">
                        <i class="fas fa-check-circle"></i>
                    </div>
                `;

                card.innerHTML = `
                    ${checkMark}
                    <img src="${v.logo}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: contain; margin-bottom: 10px;">
                    <span style="font-weight: 500; font-size: 0.9rem; text-align: center;">${v.name}</span>
                `;

                // Restore Selection State
                if (this.selectedOutlets.has(v.id)) {
                    card.style.borderColor = '#fdbf50';
                    card.querySelector('.checkmark-icon').style.display = 'block';
                }

                // Click Handler
                card.addEventListener('click', () => {
                    this.toggleSelection(v.id, card);
                });

                grid.appendChild(card);
            });
        },

        toggleSelection: function (id, cardEl) {
            // Multi-Select Toggle Logic (without clearing others)
            if (this.selectedOutlets.has(id)) {
                this.selectedOutlets.delete(id);
                cardEl.style.borderColor = '#ddd';
                cardEl.querySelector('.checkmark-icon').style.display = 'none';
            } else {
                this.selectedOutlets.add(id);
                cardEl.style.borderColor = '#fdbf50';
                cardEl.querySelector('.checkmark-icon').style.display = 'block';
            }
        }
    };


    // UI Helpers
    function setDynamicVH() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    window.addEventListener('resize', setDynamicVH);
    setDynamicVH();

    // Brave Check
    const isBrave = (navigator.brave && await navigator.brave.isBrave()) || false;
    if (isBrave) AppUtils.showToast("Brave Browser detected: Enable notifications manually.");

    // Elements
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('chat-send-btn');
    const toggleBtn = document.getElementById("toggleArrowBtn");
    const pageWrapper = document.querySelector(".page-wrapper");

    // Ad Slider Logic(Copied from user script)
    let isAdVisible = true;
    if (toggleBtn) {
        toggleBtn.addEventListener("click", function () {
            const sliderWrapper = document.getElementById('ad-slider-wrapper');
            if (isAdVisible) {
                sliderWrapper.classList.add("slide-up");
                pageWrapper.style.top = "119px";
                pageWrapper.style.borderTop = "1px solid #fdbf50";
                toggleBtn.classList.add("rotated");
            } else {
                sliderWrapper.classList.remove("slide-up");
                pageWrapper.style.top = "270px";
                pageWrapper.style.borderTop = "none";
                toggleBtn.classList.remove("rotated");
            }
            isAdVisible = !isAdVisible;
        });
    }

    // Push Subscription
    // --- SW REGISTRATION & PUSH SUBSCRIPTION ---

    // Register SW immediately
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => { })
            .catch(err => console.error("SW Registration Failed", err));
    }

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    class PushSubscriptionService {
        static async subscribe(token, vendorId) {
            if (!('serviceWorker' in navigator)) return;

            try {
                const reg = await navigator.serviceWorker.ready;
                const publicKey = window.VAPID_PUBLIC_KEY;

                if (!publicKey) {
                    console.warn("VAPID Key missing. Skipping push subscription.");
                    return;
                }

                let sub = await reg.pushManager.getSubscription();
                if (!sub) {
                    const applicationServerKey = urlBase64ToUint8Array(publicKey);
                    sub = await reg.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: applicationServerKey
                    });
                }

                // Send to Backend
                const payload = {
                    token_number: token,
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.toJSON().keys.p256dh,
                        auth: sub.toJSON().keys.auth
                    },
                    outlet_id: vendorId // Helper to associate
                };

                await fetch(API.SUBSCRIBE_PUSH, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': AppUtils.getCSRFToken()
                    },
                    body: JSON.stringify(payload)
                });
                // console.log("Push Subscribed for", token);

            } catch (e) {
                console.error("Push Subscription Failed", e);
            }
        }
    }

    // Core Fetch Logic
    async function fetchOrderStatusOnce(token, replyText = null, explicitOutletId = null) {
        // Map UI params to valid Backend keys (token, outlet_id)
        // Use explicit ID if provided, otherwise fallback to "active" from storage
        const outletId = explicitOutletId || await AppUtils.getActiveVendor();
        const params = new URLSearchParams({
            token: token,
            outlet_id: outletId
        });

        // Note: replyText is not supported in the GET endpoint yet, ignoring for now.

        try {
            const resp = await fetch(`${API.CHECK_STATUS}?${params.toString()}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await resp.json();

            if (!resp.ok) throw new Error(data.detail || data.error || "Server Error");

            if (!replyText) {
                // Conversational Reply or Status Card
                // e.g. "Your Order #105 is Preparing"
                const vendorInfo = VendorUIService.getVendor(outletId) || { logo: 'https://ui-avatars.com/api/?name=Food+Flash&background=333&color=fff', name: 'Food Flash' };

                // 1. Render Status Card (no vibration on initial load)
                appendStatusCard(data, vendorInfo, false);

                // 2. Render Chat History (New Feature)
                if (data.messages && Array.isArray(data.messages)) {
                    // Simple De-duplication or Clear-All approach?
                    // For stability, let's clear non-status-card messages first or just be smart.
                    // For now, let's just append ONLY if the container is empty (first load) 
                    // OR rely on a check. 
                    // Actually, simplest 'Live' update: Clear everything except input/footer? 
                    // No, that kills UX.
                    // Lets iterate and append. 
                    const container = document.getElementById('chat-container');
                    // quick hack: check if message ID exists?
                    data.messages.forEach(msg => {
                        // 1. Save to Client Cache
                        // saveChatHistory(outletId, msg); // REDUNDANT: Handled in appendMessage

                        // 2. Render if not present
                        // Unique ID check
                        if (!document.getElementById(`msg-${msg.id}`)) {
                            // Assuming msg.sender is 'CUSTOMER' or 'MANAGER'
                            const side = (msg.sender === 'CUSTOMER') ? 'user' : 'server';
                            if (side === 'server') {
                                // Manager Message
                                appendMessage(msg.message, 'server', null, null, `msg-${msg.id}`, vendorInfo.logo);

                                // Show notification modal with vibration for manager messages
                                if (window.showManagerMessageNotification) {
                                    window.showManagerMessageNotification(msg.message, token);
                                }
                            } else {
                                // Customer Message (We likely already showed it locally, but good to sync)
                                // To avoid duplicates of local echo, we might skip or check text.
                                // Customer Message
                                appendMessage(msg.message, 'user', null, null, `msg-${msg.id}`);
                            }
                        }
                    });
                }
            }

            await PushSubscriptionService.subscribe(token, outletId);

            // SAVE SESSION TOKEN FOR THIS OUTLET
            if (outletId) {
                localStorage.setItem(`session_token_${outletId}`, token);
            }

            return data;
        } catch (e) {
            // Only show error if we were explicitly checking a specific outlet
            // or if it's the general single-fetch
            const vendorPrefix = explicitOutletId ? `(Outlet ${explicitOutletId}) ` : '';
            if (e.message !== "Server Error") { // avoid spamming generic errors
                appendMessage(`${vendorPrefix}Error: ${e.message}`, 'server');
            }
        }
    }

    // --- MAIN LOGIC ---

    // --- MAIN LOGIC ---

    // 1. Always Render Outlets (Fix for missing icons)
    // 1. Always Render Outlets (Fix for missing icons)
    await VendorUIService.init();
    AddOutletService.init();

    // 2. Parse URL Params
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromQR = urlParams.get('token_no') || urlParams.get('token');
    const outletFromQR = urlParams.get('outlet_id');

    // 🚨 FIX: Initialize Global State Immediately
    if (outletFromQR) {
        window.currentOutletId = outletFromQR;
        localStorage.setItem('activeVendor', outletFromQR);
    }

    let currentSessionToken = tokenFromQR;

    // 3. Handle Auto-Selection (triggers Welcome Message)
    if (outletFromQR) {
        const vendor = VendorUIService.getVendor(outletFromQR);
        if (vendor) {
            const wrapper = document.querySelector(`.vendor-logo-wrapper[data-outlet-id="${outletFromQR}"]`);
            if (wrapper) {
                // Determine if we should wait for this before token logic
                // Yes, to ensure "Welcome" appears BEFORE "Order Status"
                await VendorUIService.handleOutletSelection(wrapper, vendor);
            }
        }
    }

    // 4. Handle Token Processing (triggers Order Status)
    if (tokenFromQR) {
        appendMessage(tokenFromQR, 'user');

        PermissionService.requestPermissions().then(granted => {
            if (granted) fetchOrderStatusOnce(tokenFromQR, null, outletFromQR);
        });
    }


    // Input Listeners
    // --- PUSH LISTENER FOR INSTANT CHAT ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', async (event) => {
            // console.log("Foreground Page received SW message:", event.data);
            if (event.data && event.data.type === 'PUSH_STATUS_UPDATE') {
                const pushData = event.data.payload;
                const messageHTML = pushData.message || pushData.text; // Flexi check

                // Handle Manager Chat Push
                if (pushData.type === 'manager' || pushData.type === 'chat') {
                    AppUtils.notifyOrderReady(pushData);
                    // INSTANT DISPLAY: Skip the poll, show it NOW.
                    appendMessage(messageHTML, 'server', null, 'manager', pushData.token_no, null);



                    // DIALOGUE (User Request)
                    if (window.showNotificationModal) {
                        showNotificationModal(messageHTML, 'notification');
                    }
                }
                // Handle Status Updates
                else if (pushData.type === 'status_update') {
                    AppUtils.notifyOrderReady(pushData);
                    // Refresh Status Card logic if needed or append update
                    fetchOrderStatusOnce(pushData.token_no, null, pushData.vendor_id);
                }
            }
        });
    }

    // Input Listeners
    chatInput.addEventListener('input', function (e) {
        if (!isChatEnabled) {
            // Enforce Numbers Only
            this.value = this.value.replace(/[^0-9]/g, '');
        }
    });

    // Send Logic
    sendButton.addEventListener('click', () => {
        // Dynamic lookup because 'chatInput' const might be stale after replacement
        const currentInput = document.getElementById('chat-input');
        const val = currentInput.value.trim();

        if (!val) return;

        appendMessage(val, 'user');
        currentInput.value = '';

        // Check if input is a valid Token/Sequence Number (Digits only)
        const isNumeric = /^\d+$/.test(val);

        if (isNumeric) {
            // --- TOKEN MODE ---
            // Even if chat is enabled, numbers are treated as specific status requests
            currentSessionToken = val;

            const activeWrapper = document.querySelector('.vendor-logo-wrapper.active');
            if (activeWrapper) {
                const id = activeWrapper.getAttribute('data-outlet-id');
                fetchOrderStatusOnce(val, null, id);
            } else {
                fetchOrderStatusOnce(val);
            }
        } else if (isChatEnabled) {
            // --- CHAT MODE ---
            // Non-numeric text is sent as a chat message
            // console.log("Chat Message Sent:", val);

            if (currentSessionToken) {
                // Determine sender prefix if needed or just cleaned status
                // The API expects 'sender' and 'message'
                fetch(`${API.CHAT_API.replace('0', currentSessionToken)}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': AppUtils.getCSRFToken()
                    },
                    body: JSON.stringify({
                        message: val,
                        sender: 'CUSTOMER' // Corrected to uppercase match strict model choices
                    })
                }).then(res => {
                    if (!res.ok) {
                        console.error("Failed to send chat", res.status);
                        res.text().then(text => console.error("Error Detail:", text));
                    }
                }).catch(e => console.error("Chat Network Error", e));
            } else {
                console.warn("No active token session for chat.");
                appendMessage("Error: Please enter a Token Number first.", 'server');
            }

            // Auto-Revert to Numeric Mode
            if (window.disableChatMode) window.disableChatMode();
        } else {
            // Should not be reachable due to input restriction, but safe fallback
            // Maybe user pasted text?
            // console.log("Input rejected: Numeric only mode active");
        }
    });
});
