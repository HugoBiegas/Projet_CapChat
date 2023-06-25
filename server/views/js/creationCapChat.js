// Attends que le DOM soit chargé avant d'exécuter le code
document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/themes') // Appel à l'API pour obtenir les thèmes
    .then(response => response.json()) // Convertit la réponse en JSON
    .then(data => {
      const themeSelect = document.getElementById('theme'); // Sélectionne l'élément de sélection du thème
      data.forEach(theme => {
        const option = document.createElement('option'); // Crée un nouvel élément d'option
        option.value = theme.ID; // Définit la valeur de l'option sur l'ID du thème
        option.textContent = theme.Name; // Définit le texte de l'option sur le nom du thème
        themeSelect.appendChild(option); // Ajoute l'option à la liste de sélection des thèmes
      });
      const option = document.createElement('option'); // Crée un nouvel élément d'option pour le thème "nouveau"
      option.value = 'nouveau'; // Définit la valeur de l'option sur 'nouveau'
      option.textContent = 'nouveaux théme'; // Définit le texte de l'option sur 'nouveaux théme'
      themeSelect.appendChild(option); // Ajoute l'option à la liste de sélection des thèmes
    })
    .catch(error => console.error(error)); // Gère les erreurs de la requête

});

// Sélection des éléments
let dropzone = document.querySelector('.dropzone-wrapper'); // Sélectionne la zone de dépôt
let input = document.getElementById('images'); // Sélectionne l'élément d'entrée de fichiers

// Ajout des événements de glisser-déposer à la zone de dépôt
dropzone.addEventListener('dragover', function (e) {
  e.preventDefault();
  this.style.backgroundColor = '#999';  // Changement de la couleur de fond lors du survol
});

dropzone.addEventListener('dragleave', function () {
  this.style.backgroundColor = 'transparent';  // Rétablissement de la couleur de fond d'origine lorsque l'élément est déplacé en dehors
});

dropzone.addEventListener('drop', function (e) {
  e.preventDefault();
  this.style.backgroundColor = 'transparent';  // Rétablissement de la couleur de fond d'origine lorsque les fichiers sont déposés

  let files = e.dataTransfer.files;  // Récupération des fichiers déposés
  input.files = files;  // Affectation des fichiers déposés à l'élément input
  console.log(files);
  // Déclenchement manuel de l'événement change sur l'élément input
  let event = new Event('change', { bubbles: true });
  input.dispatchEvent(event);
});

// Ouverture du sélecteur de fichiers lors du clic sur la zone
dropzone.addEventListener('click', function () {
  input.click();
});


// Handle new theme display
const themeSelect = document.getElementById('theme'); // Sélectionne l'élément de sélection du thème
const nouveauThemeContainer = document.getElementById('nouveauThemeContainer'); // Sélectionne le conteneur du nouveau thème
const modal = document.getElementById('modal'); // Sélectionne la modal

function showModal() {
  modal.style.display = "block"; // Affiche la modal en définissant son style sur "block"
}

function hideModal() {
  modal.style.display = "none"; // Masque la modal en définissant son style sur "none"
}

// Écouteur d'événement pour le changement de sélection de thème
themeSelect.addEventListener('change', () => {
  if (themeSelect.value === 'nouveau') { // Si la valeur sélectionnée est 'nouveau'
    nouveauThemeContainer.style.display = 'block'; // Affiche le conteneur du nouveau thème en définissant son style sur "block"
  } else {
    nouveauThemeContainer.style.display = 'none'; // Masque le conteneur du nouveau thème en définissant son style sur "none"
  }
});

const imagesInput = document.getElementById('images'); // Sélectionne l'élément d'entrée des images
const imagesTable = document.getElementById('imagesTable'); // Sélectionne le tableau des images
const imagesTableBody = imagesTable.querySelector('tbody'); // Sélectionne le corps du tableau des images

let selectedFiles = {}; // Objet pour stocker les fichiers sélectionnés

// Écouteur d'événement pour le changement de valeur de l'élément d'entrée des images
imagesInput.addEventListener('change', event => {
  showModal(); // Afficher le spinner

  const files = event.target.files; // Récupère les fichiers sélectionnés
  const fileArray = Array.from(files); // Convertit les fichiers en tableau
  let imagePromises = []; // Tableau de promesses pour le chargement des images

  fileArray.forEach((file, index) => {

    if (file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
      let zipPromise = JSZip.loadAsync(file).then(zip => { // Charge le fichier ZIP
        const zipPromises = []; // Tableau de promesses pour le traitement des fichiers ZIP

        zip.forEach((relativePath, zipEntry) => {
          if (!zipEntry.dir && ['.png', '.jpg', '.jpeg'].includes(relativePath.slice(-4))) {
            const imagePromise = zipEntry.async('blob').then(zipFile => { // Charge les images du fichier ZIP
              const fileName = relativePath.split('/').pop(); // Obtient le nom du fichier
              const fileType = getFileType(fileName); // Obtient le type de fichier
              if (fileType.startsWith('image/png') || fileType.startsWith('image/jpeg')) {
                const file = new File([zipFile], fileName, { type: fileType }); // Crée un nouvel objet File

                // Crée un nouvel ID de fichier pour cette image à partir du ZIP
                const newFileId = `${Date.now()}-${relativePath}`;

                // Ajoute l'image au tableau et à selectedFiles
                addImageToTable(file, fileName, newFileId);
                selectedFiles[newFileId] = { file: file, question: '' };
              }
            });

            zipPromises.push(imagePromise);
          }
        });

        return Promise.all(zipPromises)
          .catch(error => {
            console.error('Error while adding images from ZIP:', error);
          });
      })
        .catch(error => {
          console.error('Error while loading ZIP:', error);
        });

      imagePromises.push(zipPromise);
    } else if (['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      let imagePromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          // Crée un nouvel ID de fichier pour cette image
          const newFileId = `${Date.now()}-${index}`;
          addImageToTable(file, file.name, newFileId);
          resolve();
        }, 1000);
      });

      imagePromises.push(imagePromise);
    }
  });

  Promise.all(imagePromises).then(() => {
    hideModal(); // Masque le spinner une fois que toutes les images ont été chargées
    imagesTable.style.display = 'table'; // Affiche le tableau des images en définissant son style sur "table"
  });
});

// Fonction pour obtenir le type de fichier à partir du nom de fichier
function getFileType(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  if (extension === 'png') {
    return 'image/png';
  } else if (extension === 'jpg' || extension === 'jpeg') {
    return 'image/jpeg';
  } else {
    return '';
  }
}

// Fonction pour obtenir l'extension du nom de fichier
function getExtension(fileName) {
  return fileName.split('.').pop();
}

// Fonction pour ajouter une image au tableau
function addImageToTable(file, fileName, fileId) {
  const reader = new FileReader();
  reader.onload = () => {
    const imagePreview = document.createElement('img'); // Crée un nouvel élément d'image
    imagePreview.src = URL.createObjectURL(file); // Définit la source de l'image à partir du fichier
    imagePreview.width = 100;
    imagePreview.height = 100;

    const nameInput = document.createElement('input'); // Crée un nouvel élément d'entrée de texte pour le nom du fichier
    nameInput.type = 'text';
    nameInput.name = `image_name_${fileId}`;
    nameInput.value = fileName;
    // Ajoute un écouteur d'événement pour changer le nom du fichier dans selectedFiles
    nameInput.addEventListener('change', () => {
      // Crée une nouvelle instance File avec le nouveau nom et le même contenu
      selectedFiles[fileId].file = new File([selectedFiles[fileId].file], nameInput.value, { type: selectedFiles[fileId].file.type });
    });

    const questionInput = document.createElement('input'); // Crée un nouvel élément d'entrée de texte pour la question de l'image
    questionInput.type = 'text';
    questionInput.name = `image_question_${fileId}`;
    questionInput.addEventListener('change', () => {
      selectedFiles[fileId].question = questionInput.value;
    });

    const deleteButton = document.createElement('button'); // Crée un nouvel élément de bouton pour supprimer l'image
    deleteButton.type = 'button';
    deleteButton.textContent = 'Supprimer';
    deleteButton.setAttribute('data-file-id', fileId);
    deleteButton.addEventListener('click', () => {
      deleteImageFromTable(deleteButton);
    });

    const row = document.createElement('tr'); // Crée une nouvelle ligne dans le tableau
    const imageCell = document.createElement('td'); // Crée une nouvelle cellule pour l'image
    const nameCell = document.createElement('td'); // Crée une nouvelle cellule pour le nom du fichier
    const questionCell = document.createElement('td'); // Crée une nouvelle cellule pour la question de l'image
    const deleteCell = document.createElement('td'); // Crée une nouvelle cellule pour le bouton de suppression
    imageCell.appendChild(imagePreview); // Ajoute l'image à la cellule
    nameCell.appendChild(nameInput); // Ajoute l'entrée de texte pour le nom du fichier à la cellule
    questionCell.appendChild(questionInput); // Ajoute l'entrée de texte pour la question de l'image à la cellule
    deleteCell.appendChild(deleteButton); // Ajoute le bouton de suppression à la cellule
    row.appendChild(imageCell); // Ajoute la cellule de l'image à la ligne
    row.appendChild(nameCell); // Ajoute la cellule du nom du fichier à la ligne
    row.appendChild(questionCell); // Ajoute la cellule de la question de l'image à la ligne
    row.appendChild(deleteCell); // Ajoute la cellule du bouton de suppression à la ligne
    imagesTableBody.appendChild(row); // Ajoute la ligne au corps du tableau

    // Ajoute l'image au tableau selectedFiles avec les informations nécessaires
    selectedFiles[fileId] = {
      file: file,
      question: questionInput.value // Utilise questionInput.val() pour obtenir la valeur de la question
    };
  };
  reader.readAsDataURL(file); // Lit le contenu du fichier en tant qu'URL de données
}

// Fonction pour supprimer une image du tableau
function deleteImageFromTable(deleteButton) {
  const row = deleteButton.closest('tr'); // Obtient la ligne parente du bouton de suppression
  const fileId = deleteButton.getAttribute('data-file-id'); // Obtient l'ID du fichier à supprimer

  row.remove(); // Supprime la ligne du tableau

  delete selectedFiles[fileId]; // Supprime le fichier du tableau selectedFiles

  const remainingRows = Array.from(imagesTableBody.querySelectorAll('tr')); // Sélectionne toutes les lignes restantes dans le tableau
  remainingRows.forEach((row, i) => {
    const deleteButton = row.querySelector('button'); // Sélectionne le bouton de suppression dans chaque ligne
    deleteButton.setAttribute('data-file-id', i); // Met à jour l'ID du fichier dans l'attribut data-file-id
  });
}

// Écouteur d'événement pour la soumission du formulaire de création
document.getElementById('creationForm').addEventListener('submit', event => {
  event.preventDefault(); // Empêche la soumission par défaut du formulaire
  console.log('selectedFiles avant le traitement :', selectedFiles);

  const formData = new FormData(event.target); // Crée un nouvel objet FormData à partir du formulaire
  const fileNameSet = new Set();  // Set pour stocker les noms de fichier uniques
  const imagesData = []; // Tableau pour stocker les données des images
  const fileNameList = [];  // Liste pour stocker les noms de fichier

  for (const [fileId, file] of Object.entries(selectedFiles)) {
    let fileName = file.file.name; // Si file.name est undefined, fileName sera 'default.png'
    console.log(file.file.name);
    // Vérifie si le nom du fichier a déjà une extension .png ou .jpg
    if (!fileName.endsWith('.png') && !fileName.endsWith('.jpg')) {
      // Ajoute l'extension appropriée en fonction du type MIME de l'image
      if (file.file.type === 'image/png') {
        fileName += '.png';
      } else if (file.file.type === 'image/jpeg' || file.file.type === 'image/jpg') {
        fileName += '.jpg';
      }
    }

    fileNameList.push(fileName);

    const newFile = new File([file.file], fileName, { type: file.file.type }); // Crée un nouvel objet File avec le nouveau nom

    formData.append('images', newFile); // Ajoute le fichier à l'objet FormData

    if (file.question) {
      imagesData.push({ name: fileName, question: file.question }); // Ajoute les données de l'image au tableau
    } else {
      imagesData.push({ name: fileName, question: "" });
    }
  }
  // Ajoute tous les noms de fichiers à l'ensemble (ce qui élimine les doublons)
  fileNameList.forEach(fileName => fileNameSet.add(fileName));
  if (fileNameList.length !== fileNameSet.size) {
    alert("Tous les noms de fichiers doivent être uniques!"); // Affiche une alerte si les noms de fichiers ne sont pas uniques
    return;
  }


  console.log('selectedFiles après le traitement :', selectedFiles);

  const imagesWithoutQuestions = Object.values(selectedFiles).filter(file => file.question === "").length;
  const imagesWithQuestions = Object.values(selectedFiles).filter(file => file.question !== "").length;
  console.log('images sans questions :', imagesWithoutQuestions);
  console.log('images avec questions :', imagesWithQuestions);
  if (imagesWithoutQuestions < 7 || imagesWithQuestions < 1) {
    alert("Vous devez avoir au moins 7 images sans question et 1 image avec question avant de soumettre."); // Affiche une alerte si les conditions ne sont pas remplies
    return;
  }

  formData.append('imagesData', JSON.stringify(imagesData)); // Ajoute les données des images à l'objet FormData

  showModal(); // Affiche le spinner lors de l'envoi de la demande

  fetch('/api/newCapChat', {
    method: 'POST',
    body: formData, // Envoie l'objet FormData avec les données du formulaire
  })
    .then(response => response.json()) // Convertit la réponse en JSON
    .then(data => {
      console.log(data);
      alert("votre capChat a bien êter enregistrer !"); // Affiche une alerte lorsque la demande est réussie
      window.location.replace("/"); // Redirige l'utilisateur vers une autre page
    })
    .catch(error => {
      console.error('Erreur:', error); // Gère les erreurs de la requête
    })
    .finally(() => {
      hideModal(); // Masque le spinner une fois que la réponse est reçue
    });
});
