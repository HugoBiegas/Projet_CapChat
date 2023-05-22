const passwordInput = document.getElementById('password');
const lengthCriteria = document.getElementById('length');
const lowercaseCriteria = document.getElementById('lowercase');
const uppercaseCriteria = document.getElementById('uppercase');
const numberCriteria = document.getElementById('number');

passwordInput.addEventListener('input', function (e) {
    const value = e.target.value;
    const criteriaHeader = document.getElementById('password-criteria-header');
    const criteriaList = document.getElementById('password-criteria');

    if (value.length > 0) {
        criteriaHeader.classList.remove('hidden');
        criteriaList.classList.remove('hidden');
    } else {
        criteriaHeader.classList.add('hidden');
        criteriaList.classList.add('hidden');
    }

    if (value.length >= 8) {
        lengthCriteria.style.color = 'green';
    } else {
        lengthCriteria.style.color = 'red';
    }

    if (/[a-z]/.test(value)) {
        lowercaseCriteria.style.color = 'green';
    } else {
        lowercaseCriteria.style.color = 'red';
    }

    if (/[A-Z]/.test(value)) {
        uppercaseCriteria.style.color = 'green';
    } else {
        uppercaseCriteria.style.color = 'red';
    }

    if (/\d/.test(value)) {
        numberCriteria.style.color = 'green';
    } else {
        numberCriteria.style.color = 'red';
    }
});
document.getElementById('inscriptionForm').addEventListener('submit', function (event) {
    event.preventDefault();

    fetch('/inscription', {
        method: 'POST',
        body: JSON.stringify({
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            NameArtiste: document.getElementById('NameArtiste').value
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => response.json())
        .then(data => {
            if (data.message === 'Inscription réussie') {
                window.location.href = '/connexion';
            } else {
                alert(data.message);
            }
        })
        .catch(error => console.error('Erreur:', error)); // Gestion des erreurs
});
