// Récupérer le message d'erreur passé en tant que paramètre dans l'URL
const errorMessage = new URLSearchParams(window.location.search).get('message');
const errorMessageElement = document.getElementById('errorMessage');

// Afficher le message d'erreur dans le paragraphe correspondant
errorMessageElement.textContent = errorMessage;