/*// Switch between login and registration forms
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
            alert(data.message);
        } else if (data.redirect) {
            // Check URL parameters for redirect flow
            const urlParams = new URLSearchParams(window.location.search);
            const showInstall = urlParams.get('showInstall');
            const returnTo = urlParams.get('returnTo');
            
            if (showInstall === 'true') {
                // Show install prompt after login
                setTimeout(() => {
                    showInstallPrompt();
                }, 500);
                
                if (returnTo) {
                    // Redirect back after install prompt
                    setTimeout(() => {
                        window.location.href = decodeURIComponent(returnTo);
                    }, 3000); // Give user time to see install prompt
                } else {
                    // No return URL, use normal redirect after install prompt
                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 3000);
                }
            } else if (returnTo) {
                // Direct redirect back without install prompt
                window.location.href = decodeURIComponent(returnTo);
            } else {
                // Normal login flow
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

// Install prompt function (keep for browser users)
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
                        1. Tap the Share button (⬆️) on the bottom of your screen below the URL<br>
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

// Make install prompt globally available
window.showInstallPrompt = showInstallPrompt;

// Create download app section for browser users (replaces notification toggle)
function createDownloadAppSection() {
    // Check if we're in PWA mode
    const isPWA = window.navigator.standalone === true || 
                  window.matchMedia('(display-mode: standalone)').matches;
    
    if (isPWA) {
        // Don't show anything for PWA users on login page
        return '';
    }
    
    // Show download prompt for browser users
    const downloadHTML = `
        <div id="downloadAppSection" style="
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
                <span style="font-size: 20px;">📱</span>
                <div>
                    <div style="font-weight: bold;">Download Pick 6 App</div>
                    <div style="font-size: 12px; color: #8892b0;">
                        Install to your home screen for notifications
                    </div>
                </div>
            </div>
            <button id="downloadAppBtn" style="
                background: #33d9ff;
                color: #0A192F;
                border: none;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
            ">
                Get App
            </button>
        </div>
    `;
    
    return downloadHTML;
}

// Function to add download section to page
function addNotificationToggleToPage(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = createDownloadAppSection();
        
        // Add click handler for download button
        const downloadBtn = document.getElementById('downloadAppBtn');
        if (downloadBtn) {
            downloadBtn.onclick = showInstallPrompt;
        }
    }
}

// Make functions globally available
window.createDownloadAppSection = createDownloadAppSection;
window.addNotificationToggleToPage = addNotificationToggleToPage;

// Loading overlay functions for PWA
function showLoadingOverlay(message = 'Loading...') {
    // Check if we're in PWA mode
    const isPWA = window.navigator.standalone === true || 
                  window.matchMedia('(display-mode: standalone)').matches;
    
    if (!isPWA) return; // Only show for PWA users
    
    const overlayHTML = `
        <div id="loadingOverlay" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(17, 34, 64, 0.95);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            color: #CCD6F6;
            backdrop-filter: blur(10px);
        ">
            <div style="
                background: #112240;
                border: 2px solid #33d9ff;
                border-radius: 15px;
                padding: 30px;
                text-align: center;
                max-width: 300px;
                box-shadow: 0 8px 32px rgba(51, 217, 255, 0.3);
            ">
                <div class="spinner" style="
                    width: 40px;
                    height: 40px;
                    border: 3px solid #233554;
                    border-top: 3px solid #33d9ff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px auto;
                "></div>
                <div style="
                    font-size: 16px;
                    font-weight: bold;
                    color: #33d9ff;
                ">${message}</div>
            </div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    // Remove existing overlay if present
    const existing = document.getElementById('loadingOverlay');
    if (existing) existing.remove();
    
    document.body.insertAdjacentHTML('beforeend', overlayHTML);
    console.log('📱 Loading overlay shown:', message);
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
        console.log('📱 Loading overlay hidden');
    }
}

// Make functions globally available
window.createDownloadAppSection = createDownloadAppSection;
window.addNotificationToggleToPage = addNotificationToggleToPage;

// Call this when the page loads
addNotificationToggleToPage('notificationToggleContainer');


// Call this when the page loads
addNotificationToggleToPage('notificationToggleContainer');

// Check for install prompt flag on page load
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const showInstall = urlParams.get('showInstall');
    
    if (showInstall === 'true') {
        console.log("YOOOO")
        // Small delay to let page load
        setTimeout(() => {
            showInstallPrompt();
        }, 500);
    }
});*/


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
// Add debug overlay to PWA for iPhone testing
// Add debug overlay to PWA for iPhone testing
// Add debug overlay to PWA for iPhone testing
// Add debug overlay to PWA for iPhone testing
function createDebugOverlay() {
    const debugHTML = `
        <div id="debugOverlay" style="
            position: fixed;
            top: 80px;
            right: 10px;
            background: rgba(0,0,0,0.9);
            color: #00ff00;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 10px;
            max-width: 200px;
            z-index: 99999;
            max-height: 300px;
            overflow-y: auto;
        ">
            <div style="font-weight: bold; color: #ffff00; margin-bottom: 5px;">🐛 DEBUG</div>
            <div id="debugContent">Loading...</div>
            <button id="clearDebug" style="
                background: #ff4444;
                color: white;
                border: none;
                padding: 2px 5px;
                margin-top: 5px;
                font-size: 9px;
                border-radius: 3px;
            ">Clear</button>
            <button id="testNotification" style="
                background: #00ff00;
                color: black;
                border: none;
                padding: 2px 5px;
                margin-top: 2px;
                font-size: 9px;
                border-radius: 3px;
            ">Test</button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', debugHTML);
    
    document.getElementById('clearDebug').onclick = () => {
        document.getElementById('debugContent').innerHTML = '';
        window.debugLogs = [];
    };
    
    document.getElementById('testNotification').onclick = () => {
        testNotification();
    };
    
    updateDebugInfo();
}

// Test notification function
function testNotification() {
    debugLog('🧪 Testing notification');
    
    const isEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    const permission = Notification.permission;
    
    debugLog(`Enabled: ${isEnabled}, Permission: ${permission}`);
    
    if (!isEnabled) {
        debugLog('❌ Notifications not enabled - turn on toggle first');
        return;
    }
    
    if (permission !== 'granted') {
        debugLog('❌ Permission not granted');
        return;
    }
    
    try {
        debugLog('📤 Sending test notification');
        
        const notification = new Notification('🎯 Pick 6 Test!', {
            body: 'This is a test notification from your PWA!',
            icon: '/aiP6.png',
            badge: '/favicon.png',
            tag: 'test-notification',
            requireInteraction: false,
            data: {
                type: 'test',
                url: '/dashboard.html'
            }
        });
        
        debugLog('✅ Test notification sent');
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            notification.close();
            debugLog('🔕 Test notification closed');
        }, 5000);
        
        // Handle click
        notification.onclick = function() {
            debugLog('👆 Test notification clicked');
            window.focus();
            notification.close();
        };
        
    } catch (error) {
        debugLog(`❌ Notification failed: ${error.message}`);
    }
}

// Store debug logs
window.debugLogs = [];

function debugLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `${timestamp}: ${message}`;
    
    console.log(logEntry);
    window.debugLogs.push(logEntry);
    
    // Keep only last 20 logs
    if (window.debugLogs.length > 20) {
        window.debugLogs.shift();
    }
    
    updateDebugInfo();
}

function updateDebugInfo() {
    const debugContent = document.getElementById('debugContent');
    if (!debugContent) return;
    
    const isPWA = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    const permission = 'Notification' in window ? Notification.permission : 'unsupported';
    const isEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    const oneSignalLoaded = typeof OneSignal !== 'undefined';
    
    let content = `
        <div style="color: #00ffff;">PLATFORM:</div>
        PWA: ${isPWA}<br>
        iOS: ${/iPad|iPhone|iPod/.test(navigator.userAgent)}<br>
        Standalone: ${window.navigator.standalone}<br>
        <br>
        <div style="color: #00ffff;">NOTIFICATIONS:</div>
        Permission: ${permission}<br>
        Enabled: ${isEnabled}<br>
        OneSignal: ${oneSignalLoaded}<br>
        <br>
        <div style="color: #00ffff;">LOGS:</div>
    `;
    
    // Add recent logs
    window.debugLogs.slice(-10).forEach(log => {
        content += `<div style="font-size: 8px; color: #cccccc;">${log}</div>`;
    });
    
    debugContent.innerHTML = content;
}

// Enhanced notification toggle with debugging
async function handleNotificationToggleDebug() {
    debugLog('🔔 Toggle clicked');
    
    const isPWA = window.navigator.standalone === true || 
                  window.matchMedia('(display-mode: standalone)').matches;
    
    debugLog(`PWA mode: ${isPWA}`);
    
    if (!isPWA) {
        debugLog('Not PWA - showing install prompt');
        showInstallPrompt();
        return;
    }
    
    const currentPermission = Notification.permission;
    const isCurrentlyEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    
    debugLog(`Current permission: ${currentPermission}`);
    debugLog(`Currently enabled: ${isCurrentlyEnabled}`);
    
    if (isCurrentlyEnabled) {
        debugLog('Turning OFF notifications');
        
        // Just disable the toggle - don't worry about OneSignal opt-out
        localStorage.setItem('notificationsEnabled', 'false');
        updateToggleUI(false);
        debugLog('Notifications turned OFF');
        showNotificationMessage('🔕 Notifications turned off', 'success');
        
        // Try OneSignal opt-out in background (don't wait for it)
        if (typeof OneSignal !== 'undefined') {
            debugLog('Attempting OneSignal opt-out in background');
            OneSignal.User.PushSubscription.optOut().then(() => {
                debugLog('Background OneSignal opt-out successful');
            }).catch((error) => {
                debugLog(`Background OneSignal opt-out failed: ${error.message}`);
                debugLog('Toggle still disabled - user preference saved');
            });
        }
        
    } else {
        debugLog('Turning ON notifications');
        
        if (currentPermission === 'denied') {
            debugLog('Permission denied');
            showNotificationMessage('Notifications are blocked. Go to Settings > Pick 6 > Notifications to enable them.', 'error');
            return;
        }
        
        if (currentPermission === 'default') {
            debugLog('Requesting permission...');
            try {
                const permission = await Notification.requestPermission();
                debugLog(`Permission result: ${permission}`);
                
                if (permission === 'granted') {
                    debugLog('Permission granted - subscribing');
                    
                    if (typeof OneSignal !== 'undefined') {
                        debugLog('OneSignal available - opting in');
                        try {
                            await OneSignal.User.PushSubscription.optIn();
                            debugLog('OneSignal opt-in successful');
                        } catch (optInError) {
                            debugLog(`OneSignal opt-in failed: ${optInError.message}`);
                            debugLog(`Error details: ${JSON.stringify(optInError)}`);
                        }
                    } else {
                        debugLog('OneSignal not available');
                    }
                    
                    localStorage.setItem('notificationsEnabled', 'true');
                    updateToggleUI(true);
                    debugLog('Notifications enabled successfully');
                    showNotificationMessage('🔔 Notifications enabled!', 'success');
                    
                } else {
                    debugLog('Permission denied by user');
                    showNotificationMessage('Notifications were denied. Check your browser settings.', 'error');
                }
                
            } catch (error) {
                debugLog(`Error requesting permission: ${error.message}`);
                showNotificationMessage('Unable to enable notifications. Please try again.', 'error');
            }
            
        } else if (currentPermission === 'granted') {
            debugLog('Permission already granted - enabling notifications');
            
            // Don't wait for OneSignal - just enable the toggle
            localStorage.setItem('notificationsEnabled', 'true');
            updateToggleUI(true);
            debugLog('Toggle enabled - notifications should work');
            showNotificationMessage('🔔 Notifications enabled!', 'success');
            
            // Try OneSignal in background (don't wait for it)
            if (typeof OneSignal !== 'undefined') {
                debugLog('Attempting OneSignal subscription in background');
                OneSignal.User.PushSubscription.optIn().then(() => {
                    debugLog('Background OneSignal subscription successful');
                }).catch((error) => {
                    debugLog(`Background OneSignal failed: ${error.message}`);
                    debugLog('Notifications will still work via browser');
                });
            }
        }
    }
    
    updateDebugInfo();
}

// Add debug overlay when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Only show debug overlay in PWA mode for testing
    const isPWA = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    if (isPWA) {
        createDebugOverlay();
        debugLog('Debug overlay loaded');
        
        // Force reconnect the toggle button with debug handler
        setTimeout(() => {
            const toggleBtn = document.getElementById('notificationToggleBtn');
            if (toggleBtn) {
                debugLog('Found toggle button - connecting debug handler');
                toggleBtn.onclick = handleNotificationToggleDebug;
                debugLog('Debug handler connected');
            } else {
                debugLog('Toggle button not found!');
            }
        }, 1000);
    }
});

// Replace the normal toggle handler with debug version
window.handleNotificationToggle = handleNotificationToggleDebug;

// Also override the original function to ensure debug version is used
setTimeout(() => {
    if (window.addNotificationToggleToPage) {
        const originalAdd = window.addNotificationToggleToPage;
        window.addNotificationToggleToPage = function(containerId) {
            originalAdd(containerId);
            // Reconnect with debug handler
            setTimeout(() => {
                const toggleBtn = document.getElementById('notificationToggleBtn');
                if (toggleBtn) {
                    debugLog('Reconnecting toggle with debug handler');
                    toggleBtn.onclick = handleNotificationToggleDebug;
                }
            }, 100);
        };
    }
}, 2000);

// Add this function to sync frontend toggle with backend
async function syncNotificationSettingWithBackend(username, enabled) {
    try {
        const response = await fetch(`/users/notifications/toggle/${username}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ enabled })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('Backend notification setting updated:', result.message);
        } else {
            console.error('Failed to update backend:', result.error);
        }
        
        return result.success;
    } catch (error) {
        console.error('Error syncing with backend:', error);
        return false;
    }
}

// Get username from URL (your existing pattern)
function getCurrentUsername() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('username');
}

// Updated notification toggle function that syncs with backend
async function handleNotificationToggleWithBackend() {
    const isPWA = window.navigator.standalone === true || 
                  window.matchMedia('(display-mode: standalone)').matches;
    
    if (!isPWA) {
        showInstallPrompt();
        return;
    }
    
    const currentPermission = Notification.permission;
    const isCurrentlyEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    const username = getCurrentUsername();
    
    if (!username) {
        showNotificationMessage('Error: Username not found', 'error');
        return;
    }
    
    if (isCurrentlyEnabled) {
        // Turn OFF notifications
        localStorage.setItem('notificationsEnabled', 'false');
        updateToggleUI(false);
        
        // Sync with backend
        const backendSuccess = await syncNotificationSettingWithBackend(username, false);
        
        if (backendSuccess) {
            showNotificationMessage('🔕 Notifications turned off', 'success');
        } else {
            showNotificationMessage('🔕 Notifications disabled (local only)', 'success');
        }
        
        // Try OneSignal opt-out in background
        if (typeof OneSignal !== 'undefined') {
            OneSignal.User.PushSubscription.optOut().catch(console.error);
        }
        
    } else {
        // Turn ON notifications
        if (currentPermission === 'denied') {
            showNotificationMessage('Notifications are blocked. Go to Settings > Pick 6 > Notifications to enable them.', 'error');
            return;
        }
        
        if (currentPermission === 'default') {
            // Request permission first
            try {
                const permission = await Notification.requestPermission();
                
                if (permission !== 'granted') {
                    showNotificationMessage('Notifications were denied. Check your browser settings.', 'error');
                    return;
                }
            } catch (error) {
                showNotificationMessage('Unable to enable notifications. Please try again.', 'error');
                return;
            }
        }
        
        // Permission granted - enable notifications
        localStorage.setItem('notificationsEnabled', 'true');
        updateToggleUI(true);
        
        // Sync with backend
        const backendSuccess = await syncNotificationSettingWithBackend(username, true);
        
        if (backendSuccess) {
            showNotificationMessage('🔔 Notifications enabled!', 'success');
        } else {
            showNotificationMessage('🔔 Notifications enabled (local only)', 'success');
        }
        
        // Try OneSignal opt-in in background
        if (typeof OneSignal !== 'undefined') {
            OneSignal.User.PushSubscription.optIn().catch(console.error);
        }
    }
}

// Load user's notification preference from backend on page load
async function loadNotificationSettingFromBackend() {
    const username = getCurrentUsername();
    if (!username) return;
    
    try {
        const response = await fetch(`/users/notifications/status/${username}`);
        const result = await response.json();
        
        if (result.success) {
            // Update localStorage to match backend
            localStorage.setItem('notificationsEnabled', result.notificationsEnabled.toString());
            
            // Update UI if toggle exists
            updateToggleUI(result.notificationsEnabled);
            
            console.log('Loaded notification setting from backend:', result.notificationsEnabled);
        }
    } catch (error) {
        console.error('Error loading notification setting from backend:', error);
    }
}

// Update your existing toggle creation to use the new handler
function addNotificationToggleToPageWithBackend(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = createNotificationToggle();
        
        // Use the new handler that syncs with backend
        document.getElementById('notificationToggleBtn').onclick = handleNotificationToggleWithBackend;
        
        // Load setting from backend
        loadNotificationSettingFromBackend();
    }
}

// Make functions globally available
window.addNotificationToggleToPageWithBackend = addNotificationToggleToPageWithBackend;
window.syncNotificationSettingWithBackend = syncNotificationSettingWithBackend;

// Enhanced debug overlay with push subscription debugging
function createEnhancedDebugOverlay() {
    const debugHTML = `
        <div id="debugOverlay" style="
            position: fixed;
            top: 80px;
            right: 10px;
            background: rgba(0,0,0,0.95);
            color: #00ff00;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 9px;
            max-width: 280px;
            z-index: 99999;
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #00ff00;
        ">
            <div style="font-weight: bold; color: #ffff00; margin-bottom: 5px;">🐛 ENHANCED DEBUG</div>
            <div id="debugContent">Loading...</div>
            <div style="margin-top: 5px; display: flex; gap: 3px; flex-wrap: wrap;">
                <button id="clearDebug" style="
                    background: #ff4444;
                    color: white;
                    border: none;
                    padding: 2px 4px;
                    font-size: 8px;
                    border-radius: 3px;
                ">Clear</button>
                <button id="testNotification" style="
                    background: #00ff00;
                    color: black;
                    border: none;
                    padding: 2px 4px;
                    font-size: 8px;
                    border-radius: 3px;
                ">Test</button>
                <button id="checkSubscriptions" style="
                    background: #0088ff;
                    color: white;
                    border: none;
                    padding: 2px 4px;
                    font-size: 8px;
                    border-radius: 3px;
                ">Check Subs</button>
                <button id="createSubscription" style="
                    background: #9900ff;
                    color: white;
                    border: none;
                    padding: 2px 4px;
                    font-size: 8px;
                    border-radius: 3px;
                ">Create Sub</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', debugHTML);
    
    document.getElementById('clearDebug').onclick = () => {
        document.getElementById('debugContent').innerHTML = '';
        window.debugLogs = [];
    };
    
    document.getElementById('testNotification').onclick = () => {
        testNotification();
    };
    
    document.getElementById('checkSubscriptions').onclick = () => {
        comparePushSubscriptions();
    };
    
    document.getElementById('createSubscription').onclick = () => {
        createPushSubscription();
    };
    
    updateDebugInfo();
}

// Store debug logs
window.debugLogs = [];

function debugLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `${timestamp}: ${message}`;
    
    console.log(logEntry);
    window.debugLogs.push(logEntry);
    
    // Keep only last 30 logs
    if (window.debugLogs.length > 30) {
        window.debugLogs.shift();
    }
    
    updateDebugInfo();
}

function updateDebugInfo() {
    const debugContent = document.getElementById('debugContent');
    if (!debugContent) return;
    
    const isPWA = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    const permission = 'Notification' in window ? Notification.permission : 'unsupported';
    const isEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    const oneSignalLoaded = typeof OneSignal !== 'undefined';
    
    let content = `
        <div style="color: #00ffff; font-weight: bold;">PLATFORM:</div>
        PWA: ${isPWA}<br>
        iOS: ${/iPad|iPhone|iPod/.test(navigator.userAgent)}<br>
        Standalone: ${window.navigator.standalone}<br>
        <br>
        <div style="color: #00ffff; font-weight: bold;">NOTIFICATIONS:</div>
        Permission: ${permission}<br>
        Enabled: ${isEnabled}<br>
        OneSignal: ${oneSignalLoaded}<br>
        <br>
        <div style="color: #00ffff; font-weight: bold;">LOGS:</div>
    `;
    
    // Add recent logs
    window.debugLogs.slice(-15).forEach(log => {
        content += `<div style="font-size: 7px; color: #cccccc; margin: 1px 0;">${log}</div>`;
    });
    
    debugContent.innerHTML = content;
}

// Compare OneSignal vs Browser push subscriptions
async function comparePushSubscriptions() {
    debugLog('🔍 Comparing push subscriptions...');
    
    try {
        // Check if OneSignal is loaded
        if (typeof OneSignal === 'undefined') {
            debugLog('❌ OneSignal not loaded');
            return;
        }
        
        // Check browser's native push subscription
        debugLog('📱 Checking browser push...');
        const registration = await navigator.serviceWorker.ready;
        const browserSub = await registration.pushManager.getSubscription();
        
        if (browserSub) {
            debugLog('✅ Browser has push subscription');
            debugLog(`🔗 Browser endpoint: ${browserSub.endpoint.substring(0, 50)}...`);
        } else {
            debugLog('❌ No browser push subscription');
        }
        
        // Check OneSignal with simpler methods
        debugLog('🔔 Checking OneSignal (simple)...');
        
        // Just try to get basic OneSignal info
        let oneSignalInfo = 'none';
        try {
            // Try the most basic OneSignal check
            if (OneSignal && OneSignal.initialized) {
                oneSignalInfo = 'initialized';
            } else if (OneSignal) {
                oneSignalInfo = 'loaded but not initialized';
            }
        } catch (e) {
            oneSignalInfo = 'error accessing OneSignal';
        }
        debugLog(`OneSignal status: ${oneSignalInfo}`);
        
        // Check service worker
        debugLog('📋 Checking service worker...');
        debugLog(`SW scope: ${registration.scope}`);
        debugLog(`SW active: ${!!registration.active}`);
        
    } catch (error) {
        debugLog(`❌ Error checking subscriptions: ${error.message}`);
    }
}

// Create proper push subscription with OneSignal VAPID key
async function createPushSubscription() {
    debugLog('🔧 Creating push subscription...');
    
    try {
        // Step 1: Check browser permission
        const permission = Notification.permission;
        debugLog(`Current permission: ${permission}`);
        
        if (permission === 'denied') {
            debugLog('❌ Permission denied - check iOS settings');
            return;
        }
        
        if (permission === 'default') {
            debugLog('🔐 Requesting permission...');
            const newPermission = await Notification.requestPermission();
            debugLog(`New permission: ${newPermission}`);
            
            if (newPermission !== 'granted') {
                debugLog('❌ Permission not granted');
                return;
            }
        }
        
        // Step 2: Get service worker registration
        debugLog('📋 Getting service worker...');
        const registration = await navigator.serviceWorker.ready;
        debugLog('✅ Service worker ready');
        
        // Step 3: Use OneSignal's built-in subscription method instead of manual
        debugLog('🔔 Using OneSignal to create subscription...');
        
        if (typeof OneSignal === 'undefined') {
            debugLog('❌ OneSignal not loaded');
            return;
        }
        
        // Let OneSignal handle the subscription creation with its own VAPID key
        try {
            // This should trigger OneSignal's subscription flow
            await OneSignal.showNativePrompt();
            debugLog('✅ OneSignal native prompt triggered');
        } catch (e) {
            debugLog(`OneSignal native prompt failed: ${e.message}`);
            
            // Try alternative OneSignal method
            try {
                await OneSignal.registerForPushNotifications();
                debugLog('✅ OneSignal registration attempted');
            } catch (e2) {
                debugLog(`OneSignal registration failed: ${e2.message}`);
                
                // Try the most basic method - just enabling notifications
                try {
                    await OneSignal.setSubscription(true);
                    debugLog('✅ OneSignal setSubscription attempted');
                } catch (e3) {
                    debugLog(`All OneSignal methods failed: ${e3.message}`);
                    return;
                }
            }
        }
        
        // Step 4: Wait for OneSignal to process
        debugLog('⏰ Waiting for OneSignal processing...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Step 5: Check if we now have a push subscription
        const newBrowserSub = await registration.pushManager.getSubscription();
        if (newBrowserSub) {
            debugLog('🎉 SUCCESS! Browser now has push subscription');
            debugLog(`🔗 New endpoint: ${newBrowserSub.endpoint.substring(0, 50)}...`);
        } else {
            debugLog('❌ Still no browser push subscription');
        }
        
        // Step 6: Check final status
        setTimeout(() => {
            comparePushSubscriptions();
        }, 2000);
        
    } catch (error) {
        debugLog(`❌ Error creating subscription: ${error.message}`);
    }
}
async function forceOneSignalReregistration() {
    debugLog('🔄 Forcing OneSignal re-registration...');
    
    try {
        if (typeof OneSignal === 'undefined') {
            debugLog('❌ OneSignal not loaded');
            return;
        }
        
        // Step 1: Completely opt out
        debugLog('1️⃣ Opting out of OneSignal...');
        await OneSignal.User.PushSubscription.optOut();
        debugLog('✅ Opted out');
        
        // Step 2: Wait
        debugLog('2️⃣ Waiting 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Step 3: Re-register service worker
        debugLog('3️⃣ Re-registering service worker...');
        await navigator.serviceWorker.register('/sw.js');
        debugLog('✅ Service worker re-registered');
        
        // Step 4: Wait a bit more
        debugLog('4️⃣ Waiting 2 more seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Step 5: Opt back into OneSignal
        debugLog('5️⃣ Opting back into OneSignal...');
        await OneSignal.User.PushSubscription.optIn();
        debugLog('✅ OneSignal opted back in');
        
        // Step 6: Get new details
        debugLog('6️⃣ Getting new subscription details...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const newId = await OneSignal.User.getOnesignalId();
        const newOptedIn = await OneSignal.User.PushSubscription.optedIn;
        
        if (newId && newOptedIn) {
            debugLog(`🎉 SUCCESS! New player ID: ${newId.substring(0, 8)}...`);
            debugLog('📋 Copy full ID from console:');
            console.log('🆔 NEW ONESIGNAL PLAYER ID:', newId);
        } else {
            debugLog('❌ Re-registration failed');
        }
        
        // Step 7: Test the fix
        debugLog('7️⃣ Testing new subscription...');
        setTimeout(() => {
            comparePushSubscriptions();
        }, 1000);
        
    } catch (error) {
        debugLog(`❌ Error during re-registration: ${error.message}`);
    }
}

// Test notification function
function testNotification() {
    debugLog('🧪 Testing browser notification');
    
    const isEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    const permission = Notification.permission;
    
    debugLog(`Enabled: ${isEnabled}, Permission: ${permission}`);
    
    if (!isEnabled) {
        debugLog('❌ Notifications not enabled - turn on toggle first');
        return;
    }
    
    if (permission !== 'granted') {
        debugLog('❌ Permission not granted');
        return;
    }
    
    try {
        debugLog('📤 Sending browser test notification');
        
        const notification = new Notification('🎯 Pick 6 Browser Test!', {
            body: 'This is a browser notification (not OneSignal)',
            icon: '/aiP6.png',
            badge: '/favicon.png',
            tag: 'test-notification',
            requireInteraction: false
        });
        
        debugLog('✅ Browser test notification sent');
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            notification.close();
            debugLog('🔕 Browser test notification closed');
        }, 5000);
        
        // Handle click
        notification.onclick = function() {
            debugLog('👆 Browser test notification clicked');
            window.focus();
            notification.close();
        };
        
    } catch (error) {
        debugLog(`❌ Browser notification failed: ${error.message}`);
    }
}

// Auto-update debug info every 5 seconds
setInterval(updateDebugInfo, 5000);

// Initialize enhanced debug overlay
document.addEventListener('DOMContentLoaded', function() {
    const isPWA = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    if (isPWA) {
        createEnhancedDebugOverlay();
        debugLog('Enhanced debug overlay loaded');
    }
});