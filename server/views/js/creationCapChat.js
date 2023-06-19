document.addEventListener('DOMContentLoaded', () => {
  // Fetch themes from API
  fetch('/api/themes')
    .then(response => response.json())
    .then(data => {
      const themeSelect = document.getElementById('theme');
      data.themes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme.ID;
        option.textContent = theme.Name;
        themeSelect.appendChild(option);
      });
      const option = document.createElement('option');
      option.value = 'nouveau';
      option.textContent = 'nouveaux théme';
      themeSelect.appendChild(option);
    })
    .catch(error => console.error(error));
});

// Handle new theme display
const themeSelect = document.getElementById('theme');
const nouveauThemeContainer = document.getElementById('nouveauThemeContainer');
const modal = document.getElementById('modal');

function showModal() {
  modal.style.display = "block";
}

function hideModal() {
  modal.style.display = "none";
}

themeSelect.addEventListener('change', () => {
  if (themeSelect.value === 'nouveau') {
    nouveauThemeContainer.style.display = 'block';
  } else {
    nouveauThemeContainer.style.display = 'none';
  }
});

const imagesInput = document.getElementById('images');
const imagesTable = document.getElementById('imagesTable');
const imagesTableBody = imagesTable.querySelector('tbody');

let selectedFiles = {};

imagesInput.addEventListener('change', event => {
  showModal(); // Afficher le spinner

  const files = event.target.files;
  const fileArray = Array.from(files);
  let imagePromises = [];

  fileArray.forEach((file, index) => {

    if (file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
      let zipPromise = JSZip.loadAsync(file).then(zip => {
        const zipPromises = [];

        zip.forEach((relativePath, zipEntry) => {
          if (!zipEntry.dir && ['.png', '.jpg', '.jpeg'].includes(relativePath.slice(-4))) {
            const imagePromise = zipEntry.async('blob').then(zipFile => {
              const fileName = relativePath.split('/').pop();
              const fileType = getFileType(fileName);
              if (fileType.startsWith('image/png') || fileType.startsWith('image/jpeg')) {
                const file = new File([zipFile], fileName, { type: fileType });

                // Créez un nouvel ID de fichier pour cette image à partir du zip
                const newFileId = `${Date.now()}-${relativePath}`;

                // Ajouter l'image à la table et à selectedFiles
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
          // Créez un nouvel ID de fichier pour cette image à partir du zip
          const newFileId = `${Date.now()}-${index}`;
          addImageToTable(file, file.name, newFileId);
          resolve();
        }, 1000);
      });

      imagePromises.push(imagePromise);
    }
  });

  Promise.all(imagePromises).then(() => {
    hideModal(); // Cacher le spinner une fois que toutes les images ont été chargées
    imagesTable.style.display = 'table';
  });
});

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

function getExtension(fileName) {
  return fileName.split('.').pop();
}

function addImageToTable(file, fileName, fileId) {
  const reader = new FileReader();
  reader.onload = () => {
    const imagePreview = document.createElement('img');
    imagePreview.src = URL.createObjectURL(file);
    imagePreview.width = 100;
    imagePreview.height = 100;

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.name = `image_name_${fileId}`;
    nameInput.value = fileName;
    // Ajouter un écouteur d'événement pour changer le nom du fichier dans selectedFiles
    nameInput.addEventListener('change', () => {
      // Créer une nouvelle instance File avec le nouveau nom et le même contenu
      selectedFiles[fileId].file = new File([selectedFiles[fileId].file], nameInput.value, { type: selectedFiles[fileId].file.type });
    });

    const questionInput = document.createElement('input');
    questionInput.type = 'text';
    questionInput.name = `image_question_${fileId}`;
    questionInput.addEventListener('change', () => {
      selectedFiles[fileId].question = questionInput.value;
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Supprimer';
    deleteButton.setAttribute('data-file-id', fileId);
    deleteButton.addEventListener('click', () => {
      deleteImageFromTable(deleteButton);
    });

    const row = document.createElement('tr');
    const imageCell = document.createElement('td');
    const nameCell = document.createElement('td');
    const questionCell = document.createElement('td');
    const deleteCell = document.createElement('td');
    imageCell.appendChild(imagePreview);
    nameCell.appendChild(nameInput);
    questionCell.appendChild(questionInput);
    deleteCell.appendChild(deleteButton);
    row.appendChild(imageCell);
    row.appendChild(nameCell);
    row.appendChild(questionCell);
    row.appendChild(deleteCell);
    imagesTableBody.appendChild(row);

    // Ajouter l'image au tableau selectedFiles avec les informations nécessaires
    selectedFiles[fileId] = {
      file: file,
      question: questionInput.value // Utiliser questionInput.val() pour obtenir la valeur de la question
    };
  };
  reader.readAsDataURL(file);
}

function deleteImageFromTable(deleteButton) {
  const row = deleteButton.closest('tr');
  const fileId = deleteButton.getAttribute('data-file-id');

  row.remove();

  delete selectedFiles[fileId];

  const remainingRows = Array.from(imagesTableBody.querySelectorAll('tr'));
  remainingRows.forEach((row, i) => {
    const deleteButton = row.querySelector('button');
    deleteButton.setAttribute('data-file-id', i);
  });
}

document.getElementById('creationForm').addEventListener('submit', event => {
  event.preventDefault();
  console.log('selectedFiles avant le traitement :', selectedFiles);

  const formData = new FormData(event.target);
  const fileNameSet = new Set();  // Set pour stocker les noms de fichier uniques
  const imagesData = [];
  const fileNameList = [];  // Liste pour stocker les noms de fichier

  for (const [fileId, file] of Object.entries(selectedFiles)) {
    let fileName = file.file.name; // Si file.name est undefined, fileName sera 'default.png'
    console.log(file.file.name);
    // Vérifiez si le nom du fichier a déjà une extension .png ou .jpg
    if (!fileName.endsWith('.png') && !fileName.endsWith('.jpg')) {
      // Ajoutez l'extension appropriée en fonction du type MIME de l'image
      if (file.file.type === 'image/png') {
        fileName += '.png';
      } else if (file.file.type === 'image/jpeg' || file.file.type === 'image/jpg') {
        fileName += '.jpg';
      }
    }

    fileNameList.push(fileName);

    const newFile = new File([file.file], fileName, { type: file.file.type });

    formData.append('images', newFile);

    if (file.question) {
      imagesData.push({ name: fileName, question: file.question });
    } else {
      imagesData.push({ name: fileName, question: "" });
    }
  }
  // Ajouter tous les noms de fichiers à l'ensemble (ce qui élimine les doublons)
  fileNameList.forEach(fileName => fileNameSet.add(fileName));
  if (fileNameList.length !== fileNameSet.size) {
    alert("Tous les noms de fichiers doivent être uniques!");
    return;
  }


  console.log('selectedFiles après le traitement :', selectedFiles);

  const imagesWithoutQuestions = Object.values(selectedFiles).filter(file => file.question === "").length;
  const imagesWithQuestions = Object.values(selectedFiles).filter(file => file.question !== "").length;
  console.log('images sans questions :', imagesWithoutQuestions);
  console.log('images avec questions :', imagesWithQuestions);
  if (imagesWithoutQuestions < 7 || imagesWithQuestions < 1) {
    alert("Vous devez avoir au moins 7 images sans question et 1 image avec question avant de soumettre.");
    return;
  }

  formData.append('imagesData', JSON.stringify(imagesData));


  showModal(); // Afficher le spinner lors de l'envoi de la demande

  fetch('/api/newCapChat', {
    method: 'POST',
    body: formData,
  })
    .then(response => response.json())
    .then(data => {
      console.log(data);
    })
    .catch(error => {
      console.error('Erreur:', error);
    })
    .finally(() => {
      hideModal(); // Cacher le spinner une fois que la réponse est reçue
    });
});
