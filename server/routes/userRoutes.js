// userRoutes.js
const express = require('express');
const connection = require('../dbConfig');
const path = require('path');  // Ajoutez ceci en haut de votre fichier

const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile('C:/Users/anime/OneDrive/Documents/GitHub/Projet_CapChat/server/views/index.html');
});

router.get('/inscription', (req, res) => {
    res.sendFile('C:/Users/anime/OneDrive/Documents/GitHub/Projet_CapChat/server/views/inscription.html');
});
  
  router.get('/connexion', (req, res) => {
    res.sendFile('C:/Users/anime/OneDrive/Documents/GitHub/Projet_CapChat/server/views/connexion.html');
});

router.get('/api/capchat/:urlUsage', (req, res) => {
    const urlUsage = req.params.urlUsage;
    connection.query(`SELECT * FROM ImageSets WHERE URLUsage = ?`, [urlUsage], function (error, results, fields) {
        if (error) {
            return res.status(500).send(error);
        }
        if (results.length === 0) {
            return res.status(404).send('CapChat non trouvé');
        }
        const capchat = results[0];
        connection.query(`SELECT FilePath FROM Images WHERE ImageSetID = ? AND IsSingular = FALSE`, [capchat.ID], function (error, results, fields) {
            if (error) {
                return res.status(500).send(error);
            }
            const imagesNeutres = results;
            connection.query(`SELECT FilePath,Question FROM Images WHERE ImageSetID = ? AND IsSingular = TRUE`, [capchat.ID], function (error, results, fields) {
                if (error) {
                    return res.status(500).send(error);
                }
                const imageSinguliere = results[0];
                res.json({capchat, imagesNeutres, imageSinguliere});
            });
        });
    });
});


router.get('/capchat/:urlUsage', (req, res) => {
    const urlUsage = req.params.urlUsage;
    connection.query(`SELECT * FROM ImageSets WHERE URLUsage = ?`, [urlUsage], function (error, results, fields) {
        if (error) {
            return res.status(500).send(error);
        }
        if (results.length === 0) {
            return res.status(404).send('CapChat non trouvé');
        }
        // Si l'URLUsage existe, redirigez vers le fichier HTML
        res.sendFile(path.join(__dirname, '../views', 'capchat.html'));
    });
});



  
router.post('/inscription', (req, res) => {
  // Code de gestion de l'inscription
});

router.post('/connexion', (req, res) => {
  // Code de gestion de la connexion
});

module.exports = router;
