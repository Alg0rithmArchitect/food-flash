// Consolidated scripts.js to avoid missing imports

// --- INTERNAL SERVICES STUBBED FOR COMPATIBILITY ---
// (Since the original files were not provided, we inline simplified versions here)

const API = {
    CHECK_STATUS: '/api/orders/track/',
    SUBSCRIBE_PUSH: '/food-flash/push/subscribe/',
    LIST_OUTLETS: '/api/orders/outlets/',
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
        if (Notification.permission !== 'granted') console.log("Show Permission Modal");
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
    getCSRFToken: () => 'csrftoken-mock',
    notifyOrderReady: (data) => {
        if (navigator.vibrate) navigator.vibrate(200);
        console.log("Order Ready Notification", data);
    },
    playWelcomeMessage: () => console.log("Playing welcome..."),
    playNotificationSound: () => { },
    getCurrentBrowserId: () => "browser-1"
};

const VendorUIService = { init: () => { } };
const PushHealthMonitorService = {
    recordPushReceived: () => { },
    startMonitor: () => { }
};
const ChatRestoreService = { restore: async () => { } };

const ChatTemplateService = {
    build: (data) => `<div>${JSON.stringify(data.text)}</div>`
};

function maskSequenceCode(code) { return "****"; }
function updateChatOnPush() { }

// --- CHAT STATE ---
let isChatEnabled = false;

window.enableChatMode = function (token) {
    console.log("NUCLEAR: Enable Chat Mode");
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
    newInput.placeholder = "Type your message...";
    // newInput.classList.remove('numeric-mode'); 

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
            document.getElementById('send-button').click();
        }
    });

    // Gentle focus
    setTimeout(() => {
        newInput.focus();
    }, 50);
};

window.disableChatMode = function () {
    console.log("Auto-Disabling Chat Mode");
    isChatEnabled = false;

    const oldInput = document.getElementById('chat-input');
    if (!oldInput) return;

    // Remove Visual Feedback
    const container = document.querySelector('.chat-footer');
    if (container) container.style.borderTop = "none";

    // Clone and Replace to Revert Keyboard
    const newInput = oldInput.cloneNode(true);
    newInput.setAttribute('inputmode', 'numeric'); // Force numeric keyboard
    newInput.placeholder = "Enter Token Number";

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
            document.getElementById('send-button').click();
        }
    });
};

function appendStatusCard(data, vendorInfo) {
    const container = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = `message-row server`;

    const logo = vendorInfo.logo || 'https://ui-avatars.com/api/?name=Food+Flash&background=333&color=fff';
    const avatarHtml = `<img src="${logo}" class="server-logo">`;

    // Mock Counter if missing
    const counterNo = data.counter_number || Math.floor(Math.random() * 3) + 1;

    const cardHtml = `
    <div class="message-status-card">
        <div class="card-header">
           <span>${vendorInfo.name}</span>
           <!-- SVG Icon to guarantee visibility -->
           <svg onclick="window.enableChatMode('${data.token_number}')" class="reply-action-icon" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="#2e7d32" style="cursor:pointer;">
                <path d="M760-200v-160q0-50-35-85t-85-35H273l144 144-57 56-240-240 240-240 57 56-144 144h367q83 0 141.5 58.5T840-360v160h-80Z"/>
           </svg>
        </div>
        <div class="status-row">
           <strong>Status:</strong> <span class="status-pill">${data.status}</span>
        </div>
        <div class="details-row">
             <span class="detail-pill">Counter No: ${counterNo}</span>
             <span class="detail-pill">Token No: ${data.token_number}</span>
        </div>
        <div class="card-timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
    `;

    div.innerHTML = `${avatarHtml}<div class="message-bubble server" style="background:transparent; padding:0; box-shadow:none;">${cardHtml}</div>`;

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function appendMessage(text, sender, p1, p2, p3, avatarUrl = null) {
    const container = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = `message-row ${sender}`;

    let avatarHtml = '';
    // Only add avatar for server messages
    if (sender === 'server') {
        // Use provided avatar or default
        const logo = avatarUrl || 'https://ui-avatars.com/api/?name=Food+Flash&background=333&color=fff';
        avatarHtml = `<img src="${logo}" class="server-logo">`;

        // Server message structure: Avatar + Bubble
        div.innerHTML = `${avatarHtml}<div class="message-bubble ${sender}"><div class="message-content">${text}</div></div>`;
    } else {
        // User message structure: Just Bubble (Right Aligned)
        div.innerHTML = `<div class="message-bubble ${sender}"><div class="message-content">${text}</div></div>`;
    }

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}
async function clearReplyMode() { }
async function saveChat() { }

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

            await AppUtils.setCurrentVendors(vendorData.id);
            await ChatRestoreService.restore(vendorData.id);

            // 3. Trigger Welcome Message
            appendMessage(`Hi, Good Day! Welcome to ${vendorData.name}.`, 'server', null, null, null, vendorData.logo);
            appendMessage("Kindly enter the Bill Number.", 'server', null, null, null, vendorData.logo);
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
    const sendButton = document.getElementById('send-button');
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
    class PushSubscriptionService {
        static async subscribe(token, vendorId) {
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.ready;
                // Mock subscription
                console.log("Subscribed for", token);
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

            // Handle Django DRF error format (data.detail) or generic errors
            if (!resp.ok) throw new Error(data.detail || data.error || "Server Error");

            if (!replyText) {
                // Conversational Reply or Status Card
                // e.g. "Your Order #105 is Preparing"
                const vendorInfo = VendorUIService.getVendor(outletId) || { logo: 'https://ui-avatars.com/api/?name=Food+Flash&background=333&color=fff', name: 'Food Flash' };

                // Use Rich Status Card instead of plain text
                appendStatusCard(data, vendorInfo);
            }

            await PushSubscriptionService.subscribe(token, outletId);
            return data;
        } catch (e) {
            // Only show error if we were explicitly checking a specific outlet
            // or if it's the general single-fetch
            const vendorPrefix = explicitOutletId ? `(Outlet ${explicitOutletId}) ` : '';
            appendMessage(`${vendorPrefix}Error: ${e.message}`, 'server');
        }
    }

    // --- MAIN LOGIC ---

    // --- MAIN LOGIC ---

    // 1. Always Render Outlets (Fix for missing icons)
    VendorUIService.init();
    AddOutletService.init();

    // 2. Parse URL Params
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromQR = urlParams.get('token_no') || urlParams.get('token');
    const outletFromQR = urlParams.get('outlet_id');

    let currentSessionToken = tokenFromQR;

    // 3. Handle Auto-Selection (triggers Welcome Message)
    if (outletFromQR) {
        setTimeout(() => {
            const wrapper = document.querySelector(`.vendor-logo-wrapper[data-outlet-id="${outletFromQR}"]`);
            if (wrapper) {
                wrapper.click(); // Triggers handleOutletSelection -> Welcome Message
            }
        }, 100);
    }

    // 4. Handle Token Processing (triggers Order Status)
    if (tokenFromQR) {
        // Wait slightly for the Welcome Message to appear first (if auto-selected)
        setTimeout(() => {
            appendMessage(tokenFromQR, 'user');

            PermissionService.requestPermissions().then(granted => {
                if (granted) fetchOrderStatusOnce(tokenFromQR, null, outletFromQR);
            });
        }, 800);
    }

    // Input Listeners
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
            console.log("Chat Message Sent:", val);
            // Logic to push message to backend would go here

            // Auto-Revert to Numeric Mode
            if (window.disableChatMode) window.disableChatMode();
        } else {
            // Should not be reachable due to input restriction, but safe fallback
            // Maybe user pasted text?
            console.log("Input rejected: Numeric only mode active");
        }
    });
});
