// userRoutes.js
const express = require('express');
const connection = require('../dbConfig');
const path = require('path');  
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const router = express.Router();
const jwtSecret = 'Be6a3AxqecEym!J6?h5KXnFC7TS$zsyexEGY7EcQ';

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
        connection.query(`SELECT FilePath FROM Images WHERE ImageSetID = ? AND Question IS NULL ORDER BY RAND() LIMIT 7`, [capchat.ID], function (error, results, fields) {
            if (error) {
                return res.status(500).send(error);
            }
            const imagesNeutres = results;
            connection.query(`SELECT FilePath, Question FROM Images WHERE ImageSetID = ? AND Question IS NOT NULL ORDER BY RAND() LIMIT 1`, [capchat.ID], function (error, results, fields) {
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
        const { username, password, NameArtiste } = req.body;

        // Vérification des champs
        if (!username || !password) {
            return res.json({ message: "Veuillez remplir tous les champs obligatoires." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let query;
        let values;

        if (NameArtiste) {
            query = 'SELECT Username FROM Users WHERE Username = ? OR NameArtiste = ?';
            values = [username, NameArtiste];
        } else {
            query = 'SELECT Username FROM Users WHERE Username = ?';
            values = [username];
        }

        connection.query(query, values, function (error, results, fields) {
            if (error) {
                console.error(error);
                return res.json({message: 'Erreur interne'});
            } else if (results.length > 0) {
                let message = results[0].Username === username ? "Nom d'utilisateur déjà pris" : "Nom d'artiste déjà pris";
                return res.json({message: message});
            } else {
                connection.query('INSERT INTO Users (Username, Password, NameArtiste) VALUES (?, ?, ?)', [username, hashedPassword, NameArtiste], function (error, results, fields) {
                    if (error) {
                        console.error(error);
                        return res.json({message: 'Erreur interne'});
                    } else {
                        return res.json({message: 'Inscription réussie'});
                    }
                });
            }
        });

    } catch (error) {
        console.error(error);
        return res.json({message: 'Erreur interne'});
    }
});





function generateAccessToken(userId) {
    return jwt.sign({ id: userId }, jwtSecret, { expiresIn: '1d' });
  }
  
  function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ message: 'Jetons d\'authentification manquants' });
    }
  
    jwt.verify(token, jwtSecret, (error, decoded) => {
      if (error) {
        console.error(error);
        return res.status(403).json({ message: 'Échec de l\'authentification du jeton' });
      }
  
      req.token = token;
      req.user = decoded;
  
      // Vérifier que le token existe et n'est pas expiré dans la base de données
      connection.query('SELECT id FROM Token WHERE UserID = ? AND TokenValue = ? AND Expired > NOW()', [decoded.id, token], (error, results, fields) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ message: 'Erreur interne' });
        }
  
        if (results.length === 0) {
          return res.status(401).json({ message: 'Authentification invalide' });
        }
  
        next();
      });
    });
  }
  
  router.post('/connexion', async (req, res) => {
    try {
      const { username, password } = req.body;

      connection.query('SELECT id,Password FROM users WHERE Username = ?', [username], async (error, results, fields) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ message: 'Erreur connextion a la BD' });
        }

        if (results.length === 0) {
          return res.status(401).json({ message: 'Nom d utilisateur invalide ${results}'  });
        }
  
        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.Password);
  
        if (!passwordMatch) {
          return res.status(401).json({ message: 'mot de passe invalide' });
        }
  
        const token = generateAccessToken(user.ID); // Appel à generateAccessToken
  
        connection.query('INSERT INTO Token (UserID, TokenValue, Expired) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY))', [user.ID, token], (error, results, fields) => {
          if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erreur connextion a la BD' });
          }
  
          res.json({ token });
        });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur connextion a la BD' });
    }
  });

  router.get('/accueil', authenticateToken, (req, res) => {
    res.send('Bienvenue sur la page d\'accueil des artistes');
  });

router.get('*', (req, res) => {
    res.redirect('/');
  });
  

module.exports = router;
