// userRoutes.js
const express = require('express');
const connection = require('../dbConfig');
const path = require('path');  
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const util = require('util');
const multer  = require('multer');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'views', 'image')); // Spécifiez le répertoire de destination des fichiers
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Utilisez le nom d'origine du fichier
  }
});

const upload = multer({ storage: storage });

var cookieParser = require('cookie-parser');


const query = util.promisify(connection.query).bind(connection);


const router = express.Router();
const jwtSecret = 'Be6a3AxqecEym!J6?h5KXnFC7TS$zsyexEGY7EcQ';
router.use(cookieParser());

router.use(cors());

router.use('/views/image/neutres', express.static(path.join(__dirname, '..', 'views', 'image', 'neutres')));
router.use('/views/image/singuliers', express.static(path.join(__dirname, '..', 'views', 'image', 'singuliers')));
router.use('/views/image', express.static(path.join(__dirname, '..', 'views', 'image')));


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
    connection.query(`SELECT id FROM ImageSets WHERE URLUsage = ?`, [urlUsage], function (error, results, fields) {
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
router.get('*/modification/:urlUsage', authenticateToken, async (req, res) => {
  try {
      const { urlUsage } = req.params;
      
      // Obtenir le capChat correspondant à l'URLUsage
      const capChats = await query('SELECT UserID FROM ImageSets WHERE URLUsage = ?', [urlUsage]);
      if (capChats.length === 0) {
          return res.status(404).json({ message: "CapChat non trouvé" });
      }

      const capChat = capChats[0];

      // Vérifier si l'utilisateur est le créateur de ce CapChat
      if (capChat.UserID !== req.user.id) {
          return res.status(403).json({ message: "Accès refusé" });
      }
      res.sendFile(path.join(__dirname, '..', 'views', 'modificationsCapChat.html'));
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur interne' });
  }
});


router.get('/api/capchatall/:urlUsage', authenticateToken, async (req, res) => {
  try {
      const urlUsage = req.params.urlUsage;

      // Vérifier si le CapChat appartient à l'utilisateur
      const imageSet = await query('SELECT UserID FROM ImageSets WHERE URLUsage = ?', [urlUsage]);
      if (imageSet.length === 0 || imageSet[0].UserID !== req.user.id) {
          return res.status(403).json({ message: "Vous ne pouvez pas resevoir ces informations" });
      }

      const capchat = await query('SELECT ID FROM ImageSets WHERE URLUsage = ?', [urlUsage]);
      if (capchat.length === 0) {
          return res.status(404).json({ message: "CapChat non trouvé" });
      }

      const imagesNeutres = await query('SELECT FilePath FROM Images WHERE ImageSetID = ? AND Question IS NULL', [capchat[0].ID]);
      const imageSinguliere = await query('SELECT FilePath, Question FROM Images WHERE ImageSetID = ? AND Question IS NOT NULL', [capchat[0].ID]);

      res.json({ imagesNeutres, imageSinguliere });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur de serveur' });
  }
});

/* A modifier pour faire fonctionner la modifications
// Middleware pour déplacer le fichier téléchargé vers le dossier approprié
const moveUploadedFile = function (req, res, next) {
  const imageFile = req.file;
  const newFolderPath = determineDestinationFolder(req.body); // Déterminez le dossier de destination en fonction de certaines conditions

  if (!newFolderPath) {
    // Si le dossier de destination n'est pas déterminé, passez au middleware suivant
    return next();
  }

  const newFilePath = path.join(newFolderPath, imageFile.originalname);

  fs.rename(imageFile.path, newFilePath, function (err) {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: 'Erreur lors du déplacement du fichier' });
    }

    // Mettez à jour le chemin du fichier dans req.file pour refléter le déplacement
    req.file.path = newFilePath;
    next();
  });
};

function determineDestinationFolder(newQuestion) {
  // Si newQuestion est vide ou non défini, retourner "neutres"
  if (!newQuestion) {
    return 'views\\image\\neutres';
  }
  
  // Sinon, retourner "singuliers"
  return 'views\\image\\singuliers';
}


// Route pour mettre à jour une image dans la base de données
router.post('/api/updateimage/:imagePath', authenticateToken, upload.single('imageFile'),moveUploadedFile, async (req, res) => {
  try {
    const { imagePath } = req.params; // Chemin de l'image à mettre à jour
    const { newImagePath, newQuestion } = req.body; // Nouveau chemin et nouvelle question de l'image
    const imageFile = req.file; // Fichier de l'image téléchargée

    // Récupérer les informations de l'image à partir de la base de données en utilisant l'ancien chemin
    const imageData = await query('SELECT ID, Question FROM Images WHERE FilePath = ?', [imagePath]);
    if (imageData.length === 0) {
      return res.status(404).json({ message: "Image non trouvée" });
    }
    const imageID = imageData[0].ID; // ID de l'image
    const holdQuestion = imageData[0].Question; // Ancienne question de l'image

    // Vérifier si le nouveau chemin est différent de l'ancien chemin et s'il est déjà utilisé par une autre image
    if (!imageFile && newImagePath && newImagePath !== imagePath) {
      const existingImage = await query('SELECT ID FROM Images WHERE FilePath = ?', [newImagePath]);
      if (existingImage.length > 0) {
        return res.status(400).json({ message: "Le nom de l'image est déjà utilisé" });
      }
    }

    const currentFolder = holdQuestion ? "singuliers" : "neutres"; // Dossier actuel de l'image
    const newFolder = newQuestion ? "singuliers" : "neutres"; // Nouveau dossier de l'image

    // Si le dossier actuel est différent du nouveau dossier
    if (currentFolder !== newFolder) {
      const currentFolderPath = path.join(__dirname, '..', 'views', 'image', currentFolder, imagePath); // Chemin complet du dossier actuel
      const newFolderPath = path.join(__dirname, '..', 'views', 'image', newFolder, newImagePath); // Chemin complet du nouveau dossier
      //si il n'y a pas d'image on déplace le fichier
      if(!imageFile){
        // Renommer le fichier en déplaçant l'image vers le nouveau dossier
        fs.renameSync(currentFolderPath, newFolderPath, function(err) {
          if (err) {
            console.log(err)
            res.status(500).json({ message: 'Erreur lors du déplacement du fichier' });
            return;
          }
        });

      }else{
        fs.unlinkSync(currentFolderPath, function(err) {
          if (err) {
            console.log(err)
            res.status(500).json({ message: 'Erreur lors de la suppression de l\'image précédente' });
            return;
          }
        });
      }
    }
    // Si le dossier actuel est le même que le nouveau dossier et le nouveau chemin est différent de l'ancien chemin
    else if (!imageFile && newImagePath && newImagePath !== imagePath) {
      const currentFilePath = path.join(__dirname, '..', 'views', 'image', currentFolder, imagePath); // Chemin complet du fichier actuel
      const newFilePath = path.join(__dirname, '..', 'views', 'image', currentFolder, newImagePath); // Chemin complet du nouveau fichier
      fs.renameSync(currentFilePath, newFilePath, function(err) {
        if (err) {
          console.log(err)
          res.status(500).json({ message: 'Erreur lors du renommage du fichier' });
          return;
        }
      });
    }
    
    let updateQuery = 'UPDATE Images SET FilePath = ?, Question = ? WHERE ID = ?'; // Requête SQL pour mettre à jour l'image
    let values = [newImagePath, newQuestion, imageID]; // Valeurs pour la requête SQL
    await query(updateQuery, values); // Exécution de la requête SQL pour mettre à jour les informations de l'image

    res.json({ message: 'Image mise à jour avec succès' }); // Réponse JSON avec un message de succès
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur de serveur' });
  }
});
*/




  
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
    // Récupérer le token du cookie
    const token = req.cookies['authToken'];
  
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
      connection.query('SELECT ID FROM Token WHERE UserID = ? AND TokenValue = ? AND Expired > NOW()', [decoded.id, token], (error, results, fields) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ message: 'Erreur interne' });
        }
  
        if (results.length === 0) {
          connection.query('SELECT ID FROM Token WHERE UserID = ? AND TokenValue = ? AND Expired < NOW()', [decoded.id, token], (error, results, fields) => {
            if (error) {
              console.error(error);
              return res.status(500).json({ message: 'Erreur interne' });
            }
      
            if (results.length >0) {
              connection.query('DELETE FROM Token WHERE UserID = ? AND TokenValue = ?', [decoded.id, token], (error, results, fields) => {
                if (error) {
                  console.error(error);
                  return res.status(500).json({ message: 'Erreur interne' });
                }
              });
            }
          });
          // Supprimer le cookie du navigateur
          res.clearCookie('authToken');
          return res.status(401).json({ message: 'Authentification invalide. Veuillez vous reconnecter.' });
        }
        next();
      });
    });
  }
  
  
  router.post('/connexion', async (req, res) => {
    try {
      const { username, password } = req.body;
  
      const users = await query('SELECT ID,Password FROM users WHERE Username = ?', [username]);
      if (users.length === 0) {
        return res.status(401).json({ message: 'Nom d utilisateur invalide'  });
      }
  
      const user = users[0];
      const passwordMatch = await bcrypt.compare(password, user.Password);
  
      if (!passwordMatch) {
        return res.status(401).json({ message: 'mot de passe invalide' });
      }
  
      const tokens = await query('SELECT ID FROM Token WHERE UserID = ?', [user.ID]);
      if(tokens.length > 0){
        await query('DELETE FROM Token WHERE UserID = ?', [user.ID]);
      }
  
      const token = generateAccessToken(user.ID); // Appel à generateAccessToken
  
      await query('INSERT INTO Token (UserID, TokenValue, Expired) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY))', [user.ID, token]);
  
      // Stocker le token dans un cookie
      res.cookie('authToken', token, { httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000 }); // 1 jour
  
      // Rediriger vers l'accueil
      res.redirect('/accueil');
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur connextion a la BD' });
    }
  });
  

  router.get('/accueil', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'acceuilArtiste.html'));
  });

  // Récupérer les informations de l'utilisateur à partir du token
router.get('/api/user', authenticateToken, async (req, res) => {
  try {
      const user = await query('SELECT * FROM Users WHERE ID = ?', [req.user.id]);
      if (user.length === 0) {
          return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      res.json({ username: user[0].Username, artistName: user[0].NameArtiste });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur de serveur' });
  }
});

// Récupérer les CapChats créés par l'utilisateur
router.get('/api/capchats', authenticateToken, async (req, res) => {
  try {
      const capchats = await query('SELECT COUNT(Images.ID) as nombreImage, ImageSets.URLUsage FROM ImageSets LEFT JOIN Images ON Images.ImageSetID = ImageSets.ID WHERE ImageSets.UserID = ? GROUP BY ImageSets.ID', [req.user.id]);
      if (capchats.length === 0) {
          return res.status(404).json({ message: "Aucun CapChat trouvé" });
      }

      res.json(capchats);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur de serveur' });
  }
});


router.get('*', (req, res) => {
    res.redirect('/');
  });
  

module.exports = router;
