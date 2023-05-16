// userRoutes.js
const express = require('express');
const connection = require('../dbConfig');

const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile('C:/Users/anime/OneDrive/Documents/GitHub/Projet_CapChat/server/views/index.html');
});

router.post('/inscription', (req, res) => {
  // Code de gestion de l'inscription
});

router.post('/connexion', (req, res) => {
  // Code de gestion de la connexion
});

module.exports = router;
