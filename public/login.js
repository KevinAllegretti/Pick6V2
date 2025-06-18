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