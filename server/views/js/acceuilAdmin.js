document.addEventListener('DOMContentLoaded', () => {
    const getUsers = () => {
        fetch('/api/users')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des utilisateurs.');
                }
                return response.json();
            })
            .then((data) => {
                const tableBody = document.querySelector('#usersTable tbody');
                tableBody.innerHTML = '';

                data.forEach((user) => {
                    const row = `
              <tr>
                <td>${user.Username}</td>
                <td>${user.NameArtiste}</td>
                <td>
                  <button class="btn btn-danger delete-btn" data-user-id="${user.ID}">Supprimer</button>
                </td>
              </tr>
            `;
                    tableBody.innerHTML += row;
                });
            })
            .catch((error) => {
                console.error('Erreur lors de la récupération des utilisateurs:', error);
            });
    };

    getUsers();

    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const userId = event.target.dataset.userId;
            if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
                fetch(`/api/users/${userId}`, { method: 'DELETE' })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error('Erreur lors de la suppression de l\'utilisateur.');
                        }
                        return response.json();
                    })
                    .then((data) => {
                        if (data.success) {
                            alert('Utilisateur supprimé avec succès.');
                            getUsers();
                        } else {
                            alert('Erreur lors de la suppression de l\'utilisateur.');
                        }
                    })
                    .catch((error) => {
                        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
                    });
            }
        }
    });
});
