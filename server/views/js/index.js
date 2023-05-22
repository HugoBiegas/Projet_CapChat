document.addEventListener("DOMContentLoaded", function () {
    const selectElement = document.getElementById('url-usage-select');
    const testButton = document.getElementById('test-capchat-button');

    // Fetch les URLUsage de la base de données
    fetch('http://localhost:3000/api/urlusage')
        .then(response => response.json())
        .then(data => {
            // Crée une nouvelle option pour chaque URLUsage et l'ajoute au menu déroulant
            data.forEach(urlUsage => {
                const option = document.createElement('option');
                option.value = urlUsage;
                option.text = urlUsage;
                selectElement.appendChild(option);
            });
        })
        .catch(error => console.error('Erreur:', error));

    testButton.addEventListener('click', function () {
        const selectedURLUsage = selectElement.value;
        window.location.href = '/capchat/' + selectedURLUsage;
    });

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
