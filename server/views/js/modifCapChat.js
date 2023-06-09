let imageSetID;
const button = document.createElement('button');
button.className = 'addButton';

function isValidImageFile(file) {
  if (!file || !file.name) {
    return false;
  }

  const allowedExtensions = ['.png', '.jpg'];
  const fileExtension = file.name.toLowerCase();
  return allowedExtensions.some(ext => fileExtension.endsWith(ext));
}

document.addEventListener("DOMContentLoaded", function () {
  const urlUsage = window.location.pathname.split("/").pop();
  const capchatNameElement = document.querySelector("#capchatName");
  capchatNameElement.textContent = urlUsage;

  fetch(`/api/capchatall/${urlUsage}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      imageSetID = data.imagesNeutres[0].ImageSetID;
      const imagesTable = document.querySelector("#imagesTable");
      data.imagesNeutres.forEach(image => {
        const row = createTableRow(image.FilePath, image.Question, urlUsage);
        imagesTable.appendChild(row);
      });
      data.imageSinguliere.forEach(image => {
        const row = createTableRow(image.FilePath, image.Question, urlUsage);
        imagesTable.appendChild(row);
      });
    })
    .catch(error => {
      console.error('Erreur:', error);
    });
});

function createTableRow(imagePath, question, urlUsage) {
  const row = document.createElement("tr");

  const imageCell = document.createElement("td");
  const imageThumbnail = document.createElement("img");
  imageThumbnail.style.width = "100px";  // Ajoutez cette ligne
  imageThumbnail.style.objectFit = "contain"; // Ajoutez cette ligne pour préserver les proportions de l'image

  console.log(urlUsage);
  imageThumbnail.src = `/views/image/${question ? 'singuliers' : 'neutres'}/${urlUsage}/${imagePath}`;
  imageThumbnail.alt = imagePath;
  imageThumbnail.classList.add("img-thumbnail"); // Bootstrap class for thumbnail image
  imageCell.appendChild(imageThumbnail);
  row.appendChild(imageCell);

  const imageNameCell = document.createElement("td");
  imageNameCell.textContent = imagePath;
  row.appendChild(imageNameCell);

  const questionCell = document.createElement("td");
  questionCell.textContent = question || "";
  row.appendChild(questionCell);

  const actionsCell = document.createElement("td");

  const modifyButton = document.createElement("button");
  modifyButton.textContent = "Modifier";
  modifyButton.classList.add("btn", "btn-warning", "mr-2"); // Bootstrap classes for Modify button
  modifyButton.addEventListener("click", () => {
    openModal(imagePath, question || "");
  });
  actionsCell.appendChild(modifyButton);

  // Ajouter un bouton de suppression
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Supprimer";
  deleteButton.classList.add("btn", "btn-danger"); // Bootstrap classes for Delete button
  deleteButton.addEventListener("click", () => {
    deleteImage(imagePath);
  });
  actionsCell.appendChild(deleteButton);

  row.appendChild(actionsCell);

  return row;
}

function deleteImage(imagePath) {
  const confirmation = confirm("Voulez-vous vraiment supprimer cette image ?");

  if (confirmation) {
    const urlUsage = window.location.pathname.split("/").pop();
    fetch(`/api/deleteimage/${imagePath}/${urlUsage}`, { method: 'DELETE' })
      .then(response => response.json())
      .then(data => {
        if (data.message) {
          // Afficher le message d'erreur sur la page
          alert(data.message);
          location.reload(true);
        } else {
          // Image supprimée avec succès, effectuer d'autres actions si nécessaire
          console.log('Image supprimée avec succès');
        }
      })
      .catch(error => {
        console.error('Erreur:', error);
      });

  }
}

function openModal(imagePath, question) {
  const modal = document.getElementById("myModal");
  const imageFileInput = document.getElementById("imageFileInput");
  const imageNameInput = document.getElementById("imageNameInput");
  const questionInput = document.getElementById("questionInput");
  const validateButton = document.getElementById("validateButton");
  const cancelButton = document.getElementById("cancelButton");

  // Remplir les champs avec les valeurs actuelles de l'image
  imageNameInput.value = imagePath;
  questionInput.value = question;

  // Afficher la fenêtre modale
  modal.style.display = "block";

  // Gérer les actions des boutons de la fenêtre modale
  validateButton.addEventListener("click", () => {
    const newImagePath = imageNameInput.value;
    const newQuestion = questionInput.value;

    // Vérifier si une image a été sélectionnée
    if (imageFileInput.files.length === 0 && !newImagePath) {
      alert("Veuillez sélectionner une image ou saisir un nouveau nom d'image.");
      return;
    }

    // Récupérer le fichier d'image s'il a été sélectionné
    const imageFile = imageFileInput.files[0];

    // Vérifier le type de fichier (seulement .png et .jpg autorisés)
    if (imageFile && !isValidImageFile(imageFile)) {
      alert("Veuillez sélectionner un fichier d'image au format .png ou .jpg.");
      return;
    }

    // Effectuer les opérations d'ajout de l'image
    updateImage(imagePath, newImagePath, newQuestion, imageFile); // Utilise la fonction updateImage() ici

    // Fermer la fenêtre modale
    modal.style.display = "none";
  });

  cancelButton.addEventListener("click", () => {
    // Fermer la fenêtre modale
    modal.style.display = "none";
  });
}

function updateImage(imagePath, newImagePath, newQuestion, imageFile) {
  const formData = new FormData();
  formData.append("newImagePath", newImagePath);
  formData.append("newQuestion", newQuestion);
  if (imageFile) {
    formData.append("imageFile", imageFile);
  }

  axios.post(`/api/updateimage/${imagePath}`, formData)
    .then(response => {
      if (response.status !== 200) {
        throw new Error('Server response was not ok');
      }

      console.log(response.data.message);
      location.reload(true);

    })
    .catch(error => {
      console.error('Erreur:', error);
    });
}

// Modification du thème
document.getElementById("modifyThemeButton").addEventListener("click", function () {
  const urlUsage = window.location.pathname.split("/").pop();
  fetch(`/api/themes-users/${urlUsage}`)
    .then(response => response.json())
    .then(data => {
      var themes = data.themes;
      var selectOptions = '';
      for (var i = 0; i < themes.length; i++) {
        selectOptions += '<option value="' + themes[i].ID + '">' + themes[i].Name + '</option>';
      }
      document.getElementById('themeNameSelect').innerHTML = selectOptions;

      // Récupérer le nom du capchat actuel et l'insérer dans le champ du nom
      var currentCapchatName = document.getElementById("capchatName").textContent;
      document.getElementById('NameCapChatInput').value = currentCapchatName;

      // Définir le thème actuel du selecteur sur l'ID du thème actuel renvoyé par l'API
      var currentThemeId = data.currentTheme.ThemeID;
      document.getElementById('themeNameSelect').value = currentThemeId;

      document.getElementById("modifyThemeModal").style.display = "block";
    })
    .catch(error => {
      console.log(error);
    });
});
document.getElementById('modifyThemeValidateButton').addEventListener('click', function () {
  var selectedThemeId = document.getElementById('themeNameSelect').value;
  var newName = document.getElementById('NameCapChatInput').value;
  const urlUsage = window.location.pathname.split("/").pop();

  fetch('/api/capchat-update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      themeId: selectedThemeId,
      name: newName,
      NameCapChat: urlUsage,
    })
  })
    .then(response => {
      if (response.ok) {
        document.getElementById('capchatName').textContent = newName;
        document.getElementById('modifyThemeModal').style.display = 'none';

        // Modifier l'URL sans recharger la page
        const newUrl = window.location.pathname.replace(urlUsage, newName);
        window.location.href = newUrl;

      } else {
        throw new Error('Une erreur s\'est produite lors de la modification du CapChat.');
      }
    })
    .catch(error => {
      console.log(error);
    });
});

// Ajout d'image
document.getElementById("addImageButton").addEventListener("click", function () {
  document.getElementById("addImageModal").style.display = "block";
});

document.getElementById("addCancelButton").addEventListener("click", function () {
  document.getElementById("addImageModal").style.display = "none";
});
document.getElementById("modifyThemeCancelButton").addEventListener("click", function () {
  document.getElementById("modifyThemeModal").style.display = "none";
});

document.getElementById("addValidateButton").addEventListener("click", function () {
  const imageName = document.getElementById("addImageNameInput").value;
  const question = document.getElementById("addQuestionInput").value;
  const imageFileInput = document.getElementById("addImageFileInput");
  if (imageFileInput.files.length === 0) {
    alert("Veuillez sélectionner une image.");
    return;
  }

  // Récupérer le fichier d'image s'il a été sélectionné
  const imageFile = imageFileInput.files[0];

  // Vérifier le type de fichier (seulement .png et .jpg autorisés)
  if (!isValidImageFile(imageFile)) {
    alert("Veuillez sélectionner un fichier d'image au format .png ou .jpg.");
    return;
  }

  if (imageName.length === 0) {
    alert("Veuillez rentrer un nom pour l'image");
    return;
  }

  // Créer un nouvel objet FormData pour envoyer les données de l'image
  const formData = new FormData();
  formData.append("imageName", imageName);
  formData.append("question", question);
  formData.append("imageFile", imageFile);
  formData.append("imageSetID", imageSetID);

  // Envoyer les données de l'image au serveur
  axios.post(`/api/ajoute/${imageName}/${imageSetID}`, formData)
    .then(response => {
      if (response.status !== 200) {
        throw new Error('Server response was not ok');
      }
      console.log(response.data.message);
      document.getElementById("addImageModal").style.display = "none";

      location.reload(true);
    })
    .catch(error => {
      alert(error.response.data.message);
      console.error('Erreur:', error);
    });
});
