// Récupérer le bouton du CapChat
const capchatBtn = document.getElementById('capchat-btn');
// Récupérer le bouton de connexion
const submitBtn = document.getElementById('submit-btn');
// Récupérer les champs de saisie
const usernameInput = document.querySelector('input[name="username"]');
const passwordInput = document.querySelector('input[name="password"]');

// Récupérer le lien "Mot de passe oublié"
const forgotPasswordLink = document.getElementById('forgot-password-link');
// Récupérer la fenêtre modale
const modal = document.getElementById('modal');
// Récupérer le bouton pour fermer la fenêtre modale
const closeBtn = document.getElementsByClassName('close')[0];
// Récupérer le formulaire de réinitialisation du mot de passe
const resetPasswordForm = document.getElementById('reset-password-form');
// Récupérer le champ de saisie de l'adresse e-mail pour la réinitialisation
const resetEmailInput = document.getElementById('reset-email-input');

// Fonction pour ouvrir la fenêtre modale
function openModal() {
  modal.style.display = 'block';
}

// Fonction pour fermer la fenêtre modale
function closeModal() {
  modal.style.display = 'none';
  window.location.href = '/connexion';

}


// Ajouter un événement au clic sur le bouton du CapChat
capchatBtn.addEventListener('click', () => {
  // Stocker les valeurs saisies dans le localStorage
  localStorage.setItem('storedUsername', usernameInput.value);
  localStorage.setItem('storedPassword', passwordInput.value);
  // Rediriger vers /capchat/general en ajoutant cette partie à l'URL actuelle
  window.location.href += '/capchat/general';
});

// Vérifier si le CapChat a été réalisé
function checkCapChat(submitBtnConnexion) {
  const capchatSuccess = localStorage.getItem('capchatSuccess');
  if (capchatSuccess === 'true') {
    enableSubmitBtn();
  } else {
    submitBtn.disabled = true;
    submitBtn.classList.remove('success'); // Retirer la classe 'success' pour le style vert
    if (submitBtnConnexion === true) {
      alert("Veuillez compléter le CapChat pour vous connecter.");
    }
  }

  usernameInput.value = localStorage.getItem('storedUsername');
  passwordInput.value = localStorage.getItem('storedPassword');
}
function enableSubmitBtn() {
  submitBtn.disabled = false;
  submitBtn.classList.add('success'); // Ajouter la classe 'success' pour le style vert
}

// Appeler la vérification du CapChat lors de la soumission du formulaire
document.querySelector('form').addEventListener('submit', (event) => {
  event.preventDefault(); // Empêcher la soumission du formulaire par défaut
  submitBtnConnexion = true;
  checkCapChat(true);
  localStorage.clear();
  localStorage.removeItem('storedUsername'); // Supprimer la valeur du champ "Nom d'utilisateur" du localStorage
  localStorage.removeItem('storedPassword'); // Supprimer la valeur du champ "Mot de passe" du localStorage
  if (!submitBtn.disabled) {
    event.target.submit(); // Soumettre le formulaire si le CapChat est réalisé correctement
  }
});

// Vérifier le CapChat lors du chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  checkCapChat(false);

  // Récupérer les paramètres de l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const errorMessage = urlParams.get('message');

  // Afficher le message d'erreur s'il est présent
  if (errorMessage) {
    alert(decodeURIComponent(errorMessage));

    window.location.href = '/connexion';

  }
});

// Ajouter un événement au clic sur le lien "Mot de passe oublié"
forgotPasswordLink.addEventListener('click', () => {
  openModal();
});

// Ajouter un événement au clic sur le bouton pour fermer la fenêtre modale
closeBtn.addEventListener('click', () => {
  closeModal();
});

// Ajouter un événement à la soumission du formulaire de réinitialisation du mot de passe
resetPasswordForm.addEventListener('submit', (event) => {
  event.preventDefault(); // Empêcher la soumission du formulaire par défaut

  const resetEmail = resetEmailInput.value;

  // Effectuer une requête HTTP pour envoyer l'e-mail de réinitialisation du mot de passe
  fetch('/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email: resetEmail }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Un e-mail de réinitialisation du mot de passe a été envoyé à votre adresse.');
        closeModal();
      } else {
        alert('Une erreur s\'est produite lors de l\'envoi de l\'e-mail. Veuillez réessayer.');
      }
    })
    .catch(error => {
      console.error('Erreur:', error);
      alert('Une erreur s\'est produite lors de l\'envoi de l\'e-mail. Veuillez réessayer.');
    });

  resetPasswordForm.reset(); // Réinitialiser le formulaire
  closeModal();
});
