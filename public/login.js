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
    debugLog('🔐 Login form submitted');
    debugLog(`📋 Event: type=${event.type}, trusted=${event.isTrusted}`);
    
    event.preventDefault();
    
    var formData = new FormData(this);
    var object = {};
    formData.forEach(function(value, key){
        object[key] = value;
        debugLog(`📝 ${key}: ${value ? '[FILLED]' : '[EMPTY]'}`);
    });
    var json = JSON.stringify(object);
    
    debugLog('🌐 Sending login request...');
    
    // Show loading overlay for PWA
    showLoadingOverlay('Logging in...');

    fetch('/users/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: json,
    })
    .then(response => {
        debugLog(`📡 Response: ${response.status} ${response.statusText}`);
        return response.json();
    })
    .then(data => {
        debugLog(`📋 Data: error=${!!data.error}, redirect=${!!data.redirect}`);
        
        hideLoadingOverlay();
        
        if (data.error) {
            debugLog(`❌ Login failed: ${data.message}`);
            alert(data.message);
        } else if (data.redirect) {
            debugLog(`✅ Login successful, redirecting...`);
            showLoadingOverlay('Login successful! Redirecting...');
            
            // Small delay to show success message
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 1000);
        }
    })
    .catch(error => {
        debugLog(`💥 Error: ${error.message}`);
        hideLoadingOverlay();
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

// Make overlay functions globally available
window.showLoadingOverlay = showLoadingOverlay;
window.hideLoadingOverlay = hideLoadingOverlay;

// Debug display for PWA (since we can't see console on phone)
function createDebugDisplay() {
    const isPWA = window.navigator.standalone === true || 
                  window.matchMedia('(display-mode: standalone)').matches;
    
    if (!isPWA) return; // Only for PWA users
    
    const debugHTML = `
        <div id="debugDisplay" style="
            position: fixed;
            bottom: 10px;
            left: 10px;
            right: 10px;
            background: rgba(17, 34, 64, 0.95);
            border: 1px solid #33d9ff;
            border-radius: 8px;
            padding: 10px;
            font-family: monospace;
            font-size: 11px;
            color: #CCD6F6;
            max-height: 150px;
            overflow-y: auto;
            z-index: 50000;
            display: none;
        ">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="color: #33d9ff; font-weight: bold;">🐛 DEBUG</span>
                <button id="clearDebugBtn" style="
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 9px;
                ">Clear</button>
            </div>
            <div id="debugContent"></div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', debugHTML);
    
    document.getElementById('clearDebugBtn').onclick = () => {
        document.getElementById('debugContent').innerHTML = '';
        window.debugLogs = [];
    };
}

// Debug logging function that shows on screen for PWA
window.debugLogs = [];
function debugLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `${timestamp}: ${message}`;
    
    console.log(logEntry); // Still log to console
    
    const isPWA = window.navigator.standalone === true || 
                  window.matchMedia('(display-mode: standalone)').matches;
    
    if (isPWA) {
        window.debugLogs.push(logEntry);
        
        // Keep only last 10 logs
        if (window.debugLogs.length > 10) {
            window.debugLogs.shift();
        }
        
        // Update debug display
        const debugContent = document.getElementById('debugContent');
        const debugDisplay = document.getElementById('debugDisplay');
        
        if (debugContent && debugDisplay) {
            debugDisplay.style.display = 'block';
            debugContent.innerHTML = window.debugLogs.map(log => 
                `<div style="margin-bottom: 2px; font-size: 10px;">${log}</div>`
            ).join('');
            
            // Auto-scroll to bottom
            debugContent.scrollTop = debugContent.scrollHeight;
        }
    }
}

// Make debug functions available
window.debugLog = debugLog;
window.createDebugDisplay = createDebugDisplay;

// Call this when the page loads
addNotificationToggleToPage('notificationToggleContainer');

// Check for install prompt flag on page load
document.addEventListener('DOMContentLoaded', function() {
    // Create debug display for PWA users
    createDebugDisplay();
    
    const urlParams = new URLSearchParams(window.location.search);
    const showInstall = urlParams.get('showInstall');
    
    if (showInstall === 'true') {
        // Small delay to let page load
        setTimeout(() => {
            showInstallPrompt();
        }, 500);
    }
    
    debugLog('📱 Login page loaded');
});