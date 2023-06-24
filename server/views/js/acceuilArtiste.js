// JavaScript pour acceuilArtiste.html

// Utilisation de la bibliothèque Fetch pour interagir avec l'API

document.addEventListener("DOMContentLoaded", function () {
    fetch('/api/user')
        .then(response => response.json())
        .then(data => {
            const usernameElement = document.querySelector("#username");
            usernameElement.textContent = data.username;

            const artistNameElement = document.querySelector("#artistName");
            artistNameElement.textContent = data.artistName;
        })
        .catch(error => {
            console.error('Erreur:', error);
        });

    fetch('/api/capchats')
        .then(response => response.json())
        .then(data => {
            const capchatsTable = document.querySelector("#capchatsTable");
            // Vider le tableau s'il n'y a pas de CapChats créés par l'utilisateur
            if (data.length === 0) {
                const emptyRow = document.createElement("tr");
                const emptyCell = document.createElement("td");
                emptyCell.setAttribute("colspan", "6");
                emptyCell.textContent = "Vous n'avez pas créé de CapChats.";
                emptyCell.style.textAlign = "center"; // Centrer le texte
                emptyCell.style.fontSize = "20px"; // Taille du texte plus grande
                emptyCell.style.fontWeight = "bold"; // Texte en gras
                emptyRow.appendChild(emptyCell);
                capchatsTable.appendChild(emptyRow);
                return;
            }

            // Créer une nouvelle ligne pour chaque CapChat
            data.forEach(capchat => {
                const row = document.createElement("tr");

                const capchatNameCell = document.createElement("td");
                capchatNameCell.textContent = capchat.URLUsage;
                row.appendChild(capchatNameCell);

                const imagesCountCell = document.createElement("td");
                imagesCountCell.textContent = capchat.nombreImage;
                row.appendChild(imagesCountCell);

                const capchatUrlCell = document.createElement("td");
                capchatUrlCell.textContent = `/capchat/${capchat.URLUsage}`;
                row.appendChild(capchatUrlCell);

                const testerCell = document.createElement("td");
                const testerButton = document.createElement("button");
                testerButton.textContent = "Tester";
                testerButton.onclick = function () {
                    window.location.href = window.location.href + `/capchat/${capchat.URLUsage}`;
                }
                testerCell.appendChild(testerButton);
                row.appendChild(testerCell);

                const modificationCell = document.createElement("td");
                const modificationButton = document.createElement("button");
                modificationButton.textContent = "Modifier";
                modificationButton.onclick = function () {
                    window.location.href = window.location.href + `/modification/${capchat.URLUsage}`;
                }
                modificationCell.appendChild(modificationButton);
                row.appendChild(modificationCell);

                const deleteCell = document.createElement("td");
                const deleteButton = document.createElement("button");
                deleteButton.textContent = "Supprimer";
                deleteButton.onclick = function () {
                    deleteCapChat(capchat.URLUsage);
                }
                deleteCell.appendChild(deleteButton);
                row.appendChild(deleteCell);

                capchatsTable.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Erreur:', error);
        });
});

function deleteCapChat(capchatUrl) {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce CapChat ?")) {
        fetch(`/api/capchats-supr/${capchatUrl}`, {
            method: 'DELETE',
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('CapChat supprimé avec succès.');
                    window.location.reload();
                } else {
                    alert('Erreur lors de la suppression du CapChat.');
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
            });
    }
}
