// Switch between login and registration forms
document.getElementById('show-register').addEventListener('click', function() {
    console.log('Clicked on Register link');
    document.querySelector('.form.login').classList.remove('active');
    document.querySelector('.form.register').classList.add('active');
    console.log('Login form class:', document.querySelector('.form.login').className);
    console.log('Register form class:', document.querySelector('.form.register').className);
});

document.getElementById('show-login').addEventListener('click', function() {
    console.log('Clicked on Login link');
    document.querySelector('.form.register').classList.remove('active');
    document.querySelector('.form.login').classList.add('active');
    console.log('Register form class:', document.querySelector('.form.register').className);
    console.log('Login form class:', document.querySelector('.form.login').className);
});

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    var formData = new FormData(this);
    var object = {};
    formData.forEach(function(value, key){
        object[key] = value;
    });
    var json = JSON.stringify(object);

    fetch('/users/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: json,
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.message); // Show error message
        } else if (data.redirect) {
            // LOGIN SUCCESS - Show notification prompt before redirect
            console.log('Login successful, checking for notification prompt...');
            
            // Detect platform for proper timing
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isPWA = window.navigator.standalone === true;
            const delay = (isIOS && isPWA) ? 1000 : 500;
            
            console.log('Platform detection:', { isIOS, isPWA, delay });
            
            if (window.showNotificationPrompt) {
                console.log('Showing notification prompt...');
                
                setTimeout(() => {
                    window.showNotificationPrompt(() => {
                        // This callback is called when the notification prompt is complete
                        console.log('Notification prompt completed, redirecting...');
                        window.location.href = data.redirect;
                    });
                }, delay);
                
                // Fallback redirect in case something goes wrong with the notification prompt
                // This ensures the user isn't stuck on the login page
                setTimeout(() => {
                    // Only redirect if we haven't already
                    if (window.location.pathname.includes('login') || window.location.pathname === '/') {
                        console.log('Fallback redirect triggered');
                        window.location.href = data.redirect;
                    }
                }, 8000); // 8 second fallback
                
            } else {
                console.log('showNotificationPrompt not available');
                // If notification prompt not available, redirect immediately
                window.location.href = data.redirect;
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred during the login process. Please try again.');
    });
});

// Handle registration form submission
document.getElementById('registration-form').addEventListener('submit', function(event) {
    event.preventDefault();
    var formData = new FormData(this);
    let object = {};
    formData.forEach((value, key) => object[key] = value);
    let json = JSON.stringify(object);

    fetch('/users/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: json,
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.message); // Show error message from the server
        } else {
            alert(data.message); // Success message
            document.querySelector('.form.register').classList.remove('active'); // Hide registration form
            document.querySelector('.form.login').classList.add('active'); // Show login form
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred during the registration process. Please try again.');
    });
});

// Add debugging function to help troubleshoot notification issues
function debugNotifications() {
    console.log('=== NOTIFICATION DEBUG INFO ===');
    console.log('Notification support:', 'Notification' in window);
    console.log('Service Worker support:', 'serviceWorker' in navigator);
    console.log('Current permission:', Notification.permission);
    console.log('Is iOS:', /iPad|iPhone|iPod/.test(navigator.userAgent));
    console.log('Is PWA (standalone):', window.navigator.standalone);
    console.log('Is in browser:', !window.navigator.standalone);
    console.log('User Agent:', navigator.userAgent);
    console.log('showNotificationPrompt available:', typeof window.showNotificationPrompt);
    
    // Check if OneSignal is loaded
    if (typeof OneSignal !== 'undefined') {
        console.log('OneSignal loaded:', true);
        OneSignal.User.PushSubscription.optedIn.then(isSubscribed => {
            console.log('OneSignal subscription status:', isSubscribed);
        }).catch(err => {
            console.log('Error checking OneSignal subscription:', err);
        });
    } else {
        console.log('OneSignal loaded:', false);
    }
    console.log('===============================');
}

// Make debug function available globally for troubleshooting
window.debugNotifications = debugNotifications;

// Optional: Run debug on page load to help troubleshooting
document.addEventListener('DOMContentLoaded', function() {
    // Uncomment the line below if you want to see debug info on every page load
    // debugNotifications();
});

// Notification Toggle Function
function createNotificationToggle() {
    // Check if we're in PWA mode
    const isPWA = window.navigator.standalone === true || 
                  window.matchMedia('(display-mode: standalone)').matches;
    
    // Get current notification status
    const currentPermission = 'Notification' in window ? Notification.permission : 'unsupported';
    const isEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    
    console.log('Toggle - PWA mode:', isPWA, 'Permission:', currentPermission, 'Enabled:', isEnabled);
    
    // Create toggle HTML
    const toggleHTML = `
        <div id="notificationToggle" style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px 20px;
            background: #112240;
            border: 1px solid #33d9ff;
            border-radius: 10px;
            margin: 10px 0;
            color: #CCD6F6;
        ">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">🔔</span>
                <div>
                    <div style="font-weight: bold;">Notifications</div>
                    <div style="font-size: 12px; color: #8892b0;" id="toggleStatus">
                        ${getStatusText(isPWA, currentPermission, isEnabled)}
                    </div>
                </div>
            </div>
            <button id="notificationToggleBtn" style="
                background: ${isEnabled ? '#10b981' : '#374151'};
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
            ">
                ${isEnabled ? 'ON' : 'OFF'}
            </button>
        </div>
    `;
    
    return toggleHTML;
}

function getStatusText(isPWA, permission, isEnabled) {
    if (!isPWA) {
        return 'Install app to enable notifications';
    } else if (permission === 'denied') {
        return 'Blocked - check device settings';
    } else if (permission === 'granted' && isEnabled) {
        return 'Active - you\'ll receive updates';
    } else {
        return 'Tap to enable push notifications';
    }
}

function handleNotificationToggle() {
    const isPWA = window.navigator.standalone === true || 
                  window.matchMedia('(display-mode: standalone)').matches;
    
    if (!isPWA) {
        // Show install prompt for browser users
        showInstallPrompt();
    } else {
        // Handle PWA notification toggle
        handlePWANotificationToggle();
    }
}

function showInstallPrompt() {
    const installHTML = `
        <div id="installPrompt" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
            box-sizing: border-box;
        ">
            <div style="
                background: linear-gradient(135deg, #112240 0%, #233554 100%);
                color: #CCD6F6;
                padding: 30px;
                border-radius: 15px;
                max-width: 350px;
                width: 100%;
                text-align: center;
                border: 2px solid #33d9ff;
                animation: slideUp 0.3s ease-out;
            ">
                <div style="font-size: 50px; margin-bottom: 20px;">📱</div>
                <div style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #33d9ff;">
                    Install Pick 6 App
                </div>
                <div style="font-size: 16px; margin-bottom: 25px; line-height: 1.5; color: #8892b0;">
                    To receive notifications, install Pick 6 to your home screen:
                </div>
                <div style="text-align: left; margin-bottom: 20px; font-size: 14px; color: #CCD6F6;">
                    <div style="margin-bottom: 10px;">📱 <strong>On iPhone:</strong></div>
                    <div style="margin-left: 20px; margin-bottom: 15px; color: #8892b0;">
                        1. Tap the Share button (⬆️)<br>
                        2. Scroll down and tap "Add to Home Screen"<br>
                        3. Tap "Add"
                    </div>
                    <div style="margin-bottom: 10px;">🤖 <strong>On Android:</strong></div>
                    <div style="margin-left: 20px; color: #8892b0;">
                        1. Tap the menu (⋮)<br>
                        2. Tap "Add to Home screen"<br>
                        3. Tap "Add"
                    </div>
                </div>
                <button id="closeInstallPrompt" style="
                    background: #33d9ff;
                    color: #0A192F;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                    width: 100%;
                ">Got It</button>
            </div>
        </div>
        <style>
            @keyframes slideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', installHTML);
    
    document.getElementById('closeInstallPrompt').onclick = () => {
        document.getElementById('installPrompt').remove();
    };
}

async function handlePWANotificationToggle() {
    const currentPermission = Notification.permission;
    const isCurrentlyEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    
    if (isCurrentlyEnabled) {
        // Turn OFF notifications
        try {
            // Opt out of OneSignal if available
            if (typeof OneSignal !== 'undefined') {
                await OneSignal.User.PushSubscription.optOut();
            }
            
            localStorage.setItem('notificationsEnabled', 'false');
            updateToggleUI(false);
            showNotificationMessage('🔕 Notifications turned off', 'success');
            
        } catch (error) {
            console.error('Error turning off notifications:', error);
            localStorage.setItem('notificationsEnabled', 'false');
            updateToggleUI(false);
            showNotificationMessage('🔕 Notifications disabled', 'success');
        }
        
    } else {
        // Turn ON notifications
        if (currentPermission === 'denied') {
            showNotificationMessage('Notifications are blocked. Go to Settings > Pick 6 > Notifications to enable them.', 'error');
            return;
        }
        
        if (currentPermission === 'default') {
            // Request permission
            try {
                const permission = await Notification.requestPermission();
                
                if (permission === 'granted') {
                    // Subscribe to OneSignal if available
                    if (typeof OneSignal !== 'undefined') {
                        await OneSignal.User.PushSubscription.optIn();
                    }
                    
                    localStorage.setItem('notificationsEnabled', 'true');
                    updateToggleUI(true);
                    showNotificationMessage('🔔 Notifications enabled!', 'success');
                    
                } else {
                    showNotificationMessage('Notifications were denied. Check your browser settings.', 'error');
                }
                
            } catch (error) {
                console.error('Error requesting permission:', error);
                showNotificationMessage('Unable to enable notifications. Please try again.', 'error');
            }
            
        } else if (currentPermission === 'granted') {
            // Permission already granted, just subscribe
            try {
                if (typeof OneSignal !== 'undefined') {
                    await OneSignal.User.PushSubscription.optIn();
                }
                
                localStorage.setItem('notificationsEnabled', 'true');
                updateToggleUI(true);
                showNotificationMessage('🔔 Notifications enabled!', 'success');
                
            } catch (error) {
                console.error('Error enabling notifications:', error);
                localStorage.setItem('notificationsEnabled', 'true');
                updateToggleUI(true);
                showNotificationMessage('🔔 Notifications enabled!', 'success');
            }
        }
    }
}

function updateToggleUI(isEnabled) {
    const toggleBtn = document.getElementById('notificationToggleBtn');
    const toggleStatus = document.getElementById('toggleStatus');
    
    if (toggleBtn) {
        toggleBtn.textContent = isEnabled ? 'ON' : 'OFF';
        toggleBtn.style.background = isEnabled ? '#10b981' : '#374151';
    }
    
    if (toggleStatus) {
        const isPWA = window.navigator.standalone === true || 
                      window.matchMedia('(display-mode: standalone)').matches;
        const permission = Notification.permission;
        toggleStatus.textContent = getStatusText(isPWA, permission, isEnabled);
    }
}

function showNotificationMessage(message, type = 'info') {
    const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
    
    const messageHTML = `
        <div id="notificationMessage" style="
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${bgColor};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 10001;
            max-width: 90%;
            text-align: center;
            font-size: 14px;
            line-height: 1.4;
            animation: slideDown 0.3s ease-out;
        ">
            ${message}
        </div>
        <style>
            @keyframes slideDown {
                from { transform: translateX(-50%) translateY(-100%); }
                to { transform: translateX(-50%) translateY(0); }
            }
        </style>
    `;
    
    // Remove existing message if any
    const existing = document.getElementById('notificationMessage');
    if (existing) existing.remove();
    
    document.body.insertAdjacentHTML('beforeend', messageHTML);
    
    setTimeout(() => {
        const messageEl = document.getElementById('notificationMessage');
        if (messageEl) messageEl.remove();
    }, 4000);
}

// Function to add toggle to page
function addNotificationToggleToPage(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = createNotificationToggle();
        
        // Add click handler
        document.getElementById('notificationToggleBtn').onclick = handleNotificationToggle;
    }
}

// Make functions globally available
window.createNotificationToggle = createNotificationToggle;
window.handleNotificationToggle = handleNotificationToggle;
window.addNotificationToggleToPage = addNotificationToggleToPage;
// Call this when the page loads
addNotificationToggleToPage('notificationToggleContainer');