document.getElementById('show-register').addEventListener('click', function() {
    document.querySelector('.form.login').classList.remove('active');
    document.querySelector('.form.register').classList.add('active');
});

document.getElementById('show-login').addEventListener('click', function() {
    document.querySelector('.form.register').classList.remove('active');
    document.querySelector('.form.login').classList.add('active');
});
