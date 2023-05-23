let imageSetID;
function isValidImageFile(file) {
  // Vérifiez si le fichier existe et a une extension valide
  if (!file || !file.name) {
    return false;
  }

  const allowedExtensions = ['.png', '.jpg'];

  // Vérifiez l'extension du fichier
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
  console.log(urlUsage);
  imageThumbnail.src = `/views/image/${question ? 'singuliers' : 'neutres'}/${urlUsage}/${imagePath}`;
  imageThumbnail.alt = imagePath;
  imageThumbnail.classList.add("image-thumbnail");
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
  modifyButton.addEventListener("click", () => {
    openModal(imagePath, question || "");
  });
  actionsCell.appendChild(modifyButton);

  // Ajouter une barre oblique entre les boutons
  const slash = document.createTextNode(" / ");
  actionsCell.appendChild(slash);

  // Ajouter un bouton de suppression
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Supprimer";
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
    fetch(`/api/deleteimage/${imagePath}`, { method: 'DELETE' })
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

// Ouvrir la fenêtre modale pour ajouter une image
document.getElementById("addImageButton").addEventListener("click", function () {
  document.getElementById("addImageModal").style.display = "block";
});

// Fermer la fenêtre modale pour ajouter une image
document.getElementById("addCancelButton").addEventListener("click", function () {
  document.getElementById("addImageModal").style.display = "none";
});

// Envoyer les données de la nouvelle image au serveur
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
    alert("veuiller rentrer un nom pour l'image");
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
      console.error('Erreur:', error);
    });
});