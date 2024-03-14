document.getElementById('show-register').addEventListener('click', function() {
    document.querySelector('.form.login').classList.remove('active');
    document.querySelector('.form.register').classList.add('active');
});

document.getElementById('show-login').addEventListener('click', function() {
    document.querySelector('.form.register').classList.remove('active');
    document.querySelector('.form.login').classList.add('active');
});

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

/*
document.getElementById('registration-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    fetch('/users/register', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        if (data.startsWith('User Already Exist')) {
            alert(data);
        } else if (data.startsWith('User created successfully')) {
            alert(data);
        } else {
            alert('An error occurred during the registration process. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred during the registration process. Please try again.');
    });
});*/
