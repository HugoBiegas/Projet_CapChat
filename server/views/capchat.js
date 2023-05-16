window.onload = function() {
    var urlUsage = window.location.pathname.split("/").pop();
  
    fetch('/api/capchat/' + urlUsage)
      .then(response => response.json())
      .then(data => {
        document.getElementById('question').textContent = data.imageSinguliere.Question;
  
        var imageContainer = document.getElementById('imageContainer');
        data.imagesNeutres.forEach(function(image) {
          var img = document.createElement('img');
          img.src = image.Image;
          imageContainer.appendChild(img);
        });
  
        var singularImg = document.createElement('img');
        singularImg.src = data.imageSinguliere.Image;
        imageContainer.appendChild(singularImg);
      })
      .catch((error) => {
        console.error('Erreur:', error);
      });
  }
  