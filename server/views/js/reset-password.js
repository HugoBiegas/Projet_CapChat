document.getElementById('reset-password-form').addEventListener('submit', function (event) {
    event.preventDefault();

    var newPassword = document.getElementById('new-password').value;
    var confirmPassword = document.getElementById('confirm-password').value;

    // Vérifier si les mots de passe correspondent
    if (newPassword !== confirmPassword) {
        alert('Les mots de passe ne correspondent pas. Veuillez réessayer.');
        return;
    }

    // Envoyer la requête de réinitialisation du mot de passe au serveur
    fetch('/api/reset-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            newPassword: newPassword,
            confirmPassword: confirmPassword
        })
    })
        .then(function (response) {
            if (response.ok) {
                alert('Votre mot de passe a été réinitialisé avec succès.');
                window.location.href = '/login'; // Rediriger vers la page de connexion
            } else {
                alert('Une erreur s\'est produite lors de la réinitialisation du mot de passe. Veuillez réessayer.');
            }
        })
        .catch(function (error) {
            console.error('Erreur:', error);
            alert('Une erreur s\'est produite lors de la réinitialisation du mot de passe. Veuillez réessayer.');
        });
});
