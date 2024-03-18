document.getElementById('show-register').addEventListener('click', function() {
    console.log('Clicked on Register link'); // to check if the click is detected
    document.querySelector('.form.login').classList.remove('active');
    document.querySelector('.form.register').classList.add('active');

    // Check if the classes are toggled correctly
    console.log('Login form class:', document.querySelector('.form.login').className);
    console.log('Register form class:', document.querySelector('.form.register').className);
});

document.getElementById('show-login').addEventListener('click', function() {
    console.log('Clicked on Login link'); // to check if the click is detected
    document.querySelector('.form.register').classList.remove('active');
    document.querySelector('.form.login').classList.add('active');

    // Check if the classes are toggled correctly
    console.log('Register form class:', document.querySelector('.form.register').className);
    console.log('Login form class:', document.querySelector('.form.login').className);
});

// The rest of your login.js code...

document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission behavior

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
            // Perform redirection
            window.location.href = data.redirect;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred during the login process. Please try again.');
    });
});
// Handle registration form submission
document.getElementById('registration-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the form from submitting the default way
    var formData = new FormData(this);

    // Convert formData to a plain object
    let object = {};
    formData.forEach((value, key) => object[key] = value);
    let json = JSON.stringify(object);

    fetch('/users/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', // Indicate that the request body is JSON
        },
        body: json, // Send the JSON payload
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.message); // Show error message from the server
        } else {
            alert(data.message); // Success message
            // Optionally switch to the login form display
            document.querySelector('.form.register').classList.remove('active'); // Hide registration form
            document.querySelector('.form.login').classList.add('active'); // Show login form
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred during the registration process. Please try again.');
    });
});

window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const isVerified = urlParams.get('verified');

    if (isVerified === 'true') {
        alert('Account verified successfully! Please log in.');
    } else if (isVerified === 'false') {
        alert('Verification failed or link expired.');
    } else if (isVerified === 'error') {
        alert('An error occurred during verification.');
    }
});

// After the DOM is fully loaded
document.addEventListener('DOMContentLoaded', (event) => {
    const urlParams = new URLSearchParams(window.location.search);
    const isVerified = urlParams.get('verified');

    if (isVerified) {
        alert('Your account has been successfully verified. Please log in.');
    }
});
