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
  
    fileArray.forEach(file => {
      const fileId = Date.now() + Math.random().toString(36).substr(2, 9);
      selectedFiles[fileId] = file;
  
      if (file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
        let zipPromise = JSZip.loadAsync(file).then(zip => {
          const zipPromises = [];
  
          zip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir && ['.png', '.jpg', '.jpeg'].includes(relativePath.slice(-4))) {
              const imagePromise = zipEntry.async('blob').then(zipFile => {
                const fileName = relativePath.split('/').pop();
                addImageToTable(zipFile, fileName, fileId);
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
            addImageToTable(file, file.name, fileId);
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
  
  function addImageToTable(file, fileName, fileId) {
    const reader = new FileReader();
    reader.onload = () => {
      const imagePreview = document.createElement('img');
      imagePreview.src = reader.result;
      imagePreview.width = 100;
      imagePreview.height = 100;
  
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.name = `image_name_${fileId}`;
      nameInput.value = fileName;
  
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
      deleteButton.setAttribute('data-index', i);
    });
  }
  
  document.getElementById('creationForm').addEventListener('submit', event => {
    event.preventDefault();
  
    const formData = new FormData(event.target);
  
    const imagesData = [];
  
    for (const [fileId, file] of Object.entries(selectedFiles)) {
      formData.append('images', file);
      if (file.question) {
        imagesData.push({ name: file.name, question: file.question });
      } else {
        imagesData.push({ name: file.name, question: "" });
      }
    }
  
    const imagesWithoutQuestions = Object.values(selectedFiles).filter(file => !file.question).length;
    const imagesWithQuestions = Object.values(selectedFiles).filter(file => file.question).length;
  
    //if (imagesWithoutQuestions < 7 || imagesWithQuestions < 1) {
    //  alert("Vous devez avoir au moins 7 images sans question et 1 image avec question avant de soumettre.");
    //  return;
    //}
  
    formData.append('imagesData', JSON.stringify(imagesData));
        // Afficher toutes les paires clé/valeur dans formData
    for (let pair of formData.entries()) {
      console.log(pair[0]+ ', '+ pair[1]); 
    }
  
  
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
  
  