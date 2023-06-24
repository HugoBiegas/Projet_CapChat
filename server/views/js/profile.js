document.addEventListener('DOMContentLoaded', function () {
    // Appel à l'API pour récupérer les informations de l'utilisateur connecté
    fetch('/api/user')
        .then(response => response.json())
        .then(data => {
            // Remplir les champs avec les informations récupérées
            document.getElementById('username').value = data.username;
            document.getElementById('artistName').value = data.artistName;
            document.getElementById('email').value = data.email;
        })
        .catch(error => {
            console.error(error);
            // Afficher un message d'erreur si la récupération des informations échoue
            alert('Erreur lors de la récupération des informations du profil');
        });

    // Gestionnaire d'événement pour le formulaire de profil
    document.getElementById('profileForm').addEventListener('submit', function (event) {
        event.preventDefault();

        // Récupérer les valeurs des champs
        const username = document.getElementById('username').value;
        const artistName = document.getElementById('artistName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Vérifier si un mot de passe est saisi et s'il correspond à la confirmation
        if (password !== '' && password !== confirmPassword) {
            alert('Les mots de passe ne correspondent pas');
            return;
        }

        // Créer l'objet de données à envoyer à l'API
        const data = {
            username: username,
            artistName: artistName,
            email: email
        };

        // Ajouter le mot de passe à l'objet de données si un mot de passe est saisi
        if (password !== '') {
            data.password = password;
        }

        // Envoyer les données à l'API pour mettre à jour le profil
        fetch('/api/updateProfile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => {
                if (response.ok) {
                    alert('Profil mis à jour avec succès');
                    location.reload();
                } else {
                    throw new Error('Erreur lors de la mise à jour du profil');
                }
            })
            .catch(error => {
                console.error(error);
                alert('Erreur lors de la mise à jour du profil');
            });
    });
});
