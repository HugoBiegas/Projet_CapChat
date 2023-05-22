// Récupérer le bouton du CapChat
const capchatBtn = document.getElementById('capchat-btn');
// Récupérer le bouton de connexion
const submitBtn = document.getElementById('submit-btn');
// Récupérer les champs de saisie
const usernameInput = document.querySelector('input[name="username"]');
const passwordInput = document.querySelector('input[name="password"]');

// Vérifier si les valeurs des champs existent dans le localStorage
const storedUsername = localStorage.getItem('storedUsername');
const storedPassword = localStorage.getItem('storedPassword');
// Récupérer le message d'erreur de la requête dans l'URL
const urlParams = new URLSearchParams(window.location.search);
const errorMessage = urlParams.get('message');

// Vérifier si un message d'erreur existe
if (errorMessage) {
  // Afficher le message d'erreur dans une alerte
  alert(errorMessage);
  // Supprimer le message d'erreur de l'URL
  history.replaceState(null, '', window.location.pathname);

}

if (storedUsername) {
  usernameInput.value = storedUsername; // Restaurer la valeur du champ "Nom d'utilisateur"
}
if (storedPassword) {
  passwordInput.value = storedPassword; // Restaurer la valeur du champ "Mot de passe"
}
// Ajouter un événement au clic sur le bouton du CapChat
capchatBtn.addEventListener('click', () => {

  // Stocker les valeurs saisies dans le localStorage
  localStorage.setItem('storedUsername', usernameInput.value);
  localStorage.setItem('storedPassword', passwordInput.value);
  // Rediriger vers /capchat/general en ajoutant cette partie à l'URL actuelle
  window.location.href += '/capchat/general';
});

// Fonction pour activer le bouton de connexion
function enableSubmitBtn() {
  submitBtn.disabled = false;
  submitBtn.classList.add('success'); // Ajouter la classe 'success' pour le style vert
}

// Vérifier si le CapChat a été réalisé
function checkCapChat(submitBtnConnexion) {
  const capchatSuccess = localStorage.getItem('capchatSuccess');
  console.log(capchatSuccess);
  if (capchatSuccess === 'true') {
    console.log("je passe par la ");
    enableSubmitBtn();
  } else {
    submitBtn.disabled = true;
    submitBtn.classList.remove('success'); // Retirer la classe 'success' pour le style vert
    if (submitBtnConnexion === true)
      alert("Veuillez compléter le CapChat pour vous connecter.");
  }
}

// Appeler la vérification du CapChat lors de la soumission du formulaire
document.querySelector('form').addEventListener('submit', (event) => {
  event.preventDefault(); // Empêcher la soumission du formulaire par défaut
  submitBtnConnexion = true;
  checkCapChat(true);
  localStorage.clear();
  localStorage.removeItem('storedUsername'); // Supprimer la valeur du champ "Nom d'utilisateur" du localStorage
  localStorage.removeItem('storedPassword'); // Supprimer la valeur du champ "Mot de passe" du localStorage
  if (!submitBtn.disabled)
    event.target.submit(); // Soumettre le formulaire si le CapChat est réalisé correctement
});

// Vérifier le CapChat lors du chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  checkCapChat(false);
});
