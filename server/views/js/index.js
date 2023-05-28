document.addEventListener("DOMContentLoaded", function () {

    const connectButton = document.getElementById('connect-button');
    connectButton.addEventListener('click', function () {
        localStorage.clear();
        window.location.href = '/connexion';
    });

    const registerButton = document.getElementById('register-button');
    registerButton.addEventListener('click', function () {
        window.location.href = '/inscription';
    });
});
