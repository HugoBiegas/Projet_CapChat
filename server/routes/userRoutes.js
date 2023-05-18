// userRoutes.js
const express = require('express');
const connection = require('../dbConfig');
const path = require('path');  
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcrypt');

const router = express.Router();

router.use(cors());

router.use('/views/image/neutres', express.static(path.join(__dirname, '..', 'views', 'image', 'neutres')));
router.use('/views/image/singuliers', express.static(path.join(__dirname, '..', 'views', 'image', 'singuliers')));


router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

router.get('/inscription', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'inscription.html'));
});
  
  router.get('/connexion', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'connexion.html'));
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
        connection.query(`SELECT FilePath FROM Images WHERE ImageSetID = ? AND IsSingular = FALSE ORDER BY RAND() LIMIT 7`, [capchat.ID], function (error, results, fields) {
            if (error) {
                return res.status(500).send(error);
            }
            const imagesNeutres = results;
            connection.query(`SELECT FilePath,Question FROM Images WHERE ImageSetID = ? AND IsSingular = TRUE ORDER BY RAND() LIMIT 1`, [capchat.ID], function (error, results, fields) {
                if (error) {
                    return res.status(500).send(error);
                }
                const imageSinguliere = results;
                res.json({imagesNeutres, imageSinguliere});
            });
        });
    });
});

router.get('/api/urlusage', (req, res) => {
    connection.query(`SELECT URLUsage FROM ImageSets`, function (error, results, fields) {
        if (error) {
            return res.status(500).send(error);
        }
        // Extraire l'URLUsage de chaque ligne de résultats
        const urlUsages = results.map(result => result.URLUsage);
        // Répondre avec les URLUsage en JSON
        res.json(urlUsages);
    });
});



router.get('*/capchat/:urlUsage', (req, res) => {
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



  
router.post('/inscription', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const username = req.body.username;
        const NameArtiste = req.body.NameArtiste;
        let query;
        let values;

        if (NameArtiste) {
            query = 'SELECT * FROM Users WHERE Username = ? OR NameArtiste = ?';
            values = [username, NameArtiste];
        } else {
            query = 'SELECT * FROM Users WHERE Username = ?';
            values = [username];
        }

        connection.query(query, values, function (error, results, fields) {
            if (error) {
                console.error(error);
                res.json({message: 'Erreur interne'});
            } else if (results.length > 0) {
                let message = results[0].Username === username ? "Nom d'utilisateur déjà pris" : "Nom d'artiste déjà pris";
                res.json({message: message});
            } else {
                connection.query('INSERT INTO Users (Username, Password, NameArtiste) VALUES (?, ?, ?)', [username, hashedPassword, NameArtiste], function (error, results, fields) {
                    if (error) {
                        console.error(error);
                        res.json({message: 'Erreur interne'});
                    } else {
                        res.json({message: 'Inscription réussie'});
                    }
                });
            }
        });

    } catch (error) {
        console.error(error);
        res.json({message: 'Erreur interne'});
    }
});




router.post('/connexion', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    connection.query('SELECT Password FROM Users WHERE Username = ?', [username], async function (error, results, fields) {
        if (error) {
            console.error(error);
            res.redirect('/connexion');
        } else {
            if (results.length > 0) {
                const comparison = await bcrypt.compare(password, results[0].Password)
                if (comparison) {
                    // l'utilisateur est connecté avec succès
                    res.redirect('/welcome'); // ou toute autre route
                } else {
                    res.redirect('/connexion');
                }
            } else {
                res.redirect('/connexion');
            }
        }
    });
});


router.get('*', (req, res) => {
    res.redirect('/');
  });
  

module.exports = router;
