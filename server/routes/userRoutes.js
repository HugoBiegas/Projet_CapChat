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
router.use('/views/erreur', express.static(path.join(__dirname, '..', 'views', 'erreur')));


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
          return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('error Base de Donnée non accésible')}`);
        }
        if (results.length === 0) {
            return res.redirect(req.originalUrl + `/erreur/404?message=${encodeURIComponent('CapChat non trouvé')}`);
        }
        const capchat = results[0];
        connection.query(`SELECT FilePath FROM Images WHERE ImageSetID = ? AND Question IS NULL ORDER BY RAND() LIMIT 7`, [capchat.ID], function (error, results, fields) {
            if (error) {
              return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('error Base de Donnée non accésible')}`);
            }
            const imagesNeutres = results;
            connection.query(`SELECT FilePath, Question FROM Images WHERE ImageSetID = ? AND Question IS NOT NULL ORDER BY RAND() LIMIT 1`, [capchat.ID], function (error, results, fields) {
                if (error) {
                  return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('error Base de Donnée non accésible')}`);
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
          return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('error Base de Donnée non accésible')}`);
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
          return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('error Base de Donnée non accésible')}`);
        }
        if (results.length === 0) {
          return res.redirect(req.originalUrl + `/erreur/404?message=${encodeURIComponent('CapChat non trouvé')}`);
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
        return res.redirect(req.originalUrl + `/erreur/404?message=${encodeURIComponent('CapChat non trouvé')}`);
      }

      const capChat = capChats[0];

      // Vérifier si l'utilisateur est le créateur de ce CapChat
      if (capChat.UserID !== req.user.id) {
        return res.redirect(req.originalUrl + `/erreur/403?message=${encodeURIComponent('Accès refusé')}`);
      }
      res.sendFile(path.join(__dirname, '..', 'views', 'modificationsCapChat.html'));
  } catch (error) {
      console.error(error);
      return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('error Base de Donnée non accésible')}`);
    }
});


router.get('/api/capchatall/:urlUsage', authenticateToken, async (req, res) => {
  try {
      const urlUsage = req.params.urlUsage;

      // Vérifier si le CapChat appartient à l'utilisateur
      const imageSet = await query('SELECT UserID FROM ImageSets WHERE URLUsage = ?', [urlUsage]);
      if (imageSet.length === 0 || imageSet[0].UserID !== req.user.id) {
        return res.redirect(req.originalUrl + `/erreur/403?message=${encodeURIComponent('Vous ne pouvez pas resevoir ces informations')}`);
      }

      const capchat = await query('SELECT ID FROM ImageSets WHERE URLUsage = ?', [urlUsage]);
      if (capchat.length === 0) {
        return res.redirect(req.originalUrl + `/erreur/404?message=${encodeURIComponent('CapChat non trouvé')}`);
      }

      const imagesNeutres = await query('SELECT FilePath FROM Images WHERE ImageSetID = ? AND Question IS NULL', [capchat[0].ID]);
      const imageSinguliere = await query('SELECT FilePath, Question FROM Images WHERE ImageSetID = ? AND Question IS NOT NULL', [capchat[0].ID]);

      res.json({ imagesNeutres, imageSinguliere });
  } catch (error) {
      console.error(error);
      return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('error Base de Donnée non accésible')}`);
  }
});


// Route pour mettre à jour une image dans la base de données
router.post('/api/updateimage/:imagePath', authenticateToken, upload.single('imageFile'), async (req, res) => {
  try {
    const { imagePath } = req.params;
    let { newImagePath, newQuestion } = req.body;
    const imageFile = req.file;

    const imageData = await query('SELECT ID, Question FROM Images WHERE FilePath = ?', [imagePath]);
    if (imageData.length === 0) {
      return res.redirect(req.originalUrl + `/erreur/404?message=${encodeURIComponent('Image non trouvée')}`);
    }

    const imageID = imageData[0].ID;
    const oldQuestion = imageData[0].Question;

    if (!imageFile && newImagePath && newImagePath !== imagePath) {
      const existingImage = await query('SELECT ID FROM Images WHERE FilePath = ?', [newImagePath]);
      if (existingImage.length > 0) {
        return res.redirect(req.originalUrl + `/erreur/400?message=${encodeURIComponent('Le nom de l image est déjà utilisé')}`);
      }
    }
    //verifications du nom et mise en place .png et .jpg
    let ext = path.extname(imageFile.originalname).toLowerCase(); // Récupère l'extension de l'image actuelle
    let newExt = path.extname(newImagePath).toLowerCase(); // Récupère l'extension de la nouvelle image
    console.log(ext + " : "+ newExt);
    // Vérifie si l'extension de la nouvelle image est .png ou .jpg
    if (newExt !== '.png' && newExt !== '.jpg') {
      newImagePath += ext; // Si l'extension n'est pas .png ou .jpg, ajoute l'extension de l'image actuelle
    } else if (ext !== newExt) {
      // Si l'extension de l'image actuelle est différente de celle de la nouvelle image, modifie l'extension de la nouvelle image pour qu'elle corresponde à celle de l'image actuelle
      newImagePath = path.basename(newImagePath, newExt) + ext;
    }

    const oldFolder = oldQuestion ? "singuliers" : "neutres";
    const newFolder = newQuestion ? "singuliers" : "neutres";

    //mettre la métode pour déplacer l'image si l'utilisateur a ajouter une iamge
    if (imageFile) {
      const newFolderPath = path.join(__dirname, '..', 'views', 'image', newFolder);
      const newFilePath = path.join(newFolderPath, newImagePath);

      fs.rename(imageFile.path, newFilePath, function (err) {
        if (err) {
          console.log(err);
          return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur lors du déplacement du fichier')}`);
        }

        imageFile.path = newFilePath;
      });
    }

    //si l'ancier fichier est différenet du nouveaux
    if (oldFolder !== newFolder) {
      const oldFolderPath = path.join(__dirname, '..', 'views', 'image', oldFolder, imagePath);
      const newFolderPath = path.join(__dirname, '..', 'views', 'image', newFolder, newImagePath);
      //si il n'y a pas de nouvelle image on déplace l'image si non on la suprime
      if(!imageFile){
        fs.renameSync(oldFolderPath, newFolderPath, function(err) {
          if (err) {
            console.log(err)
            return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur lors du déplacement du fichier')}`);
          }
        });
      }else{
        fs.unlinkSync(oldFolderPath, function(err) {
          if (err) {
            console.log(err)
            return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur lors de la suppression de l\'image précédente')}`);
          }
        });
      }
    }
    else if (!imageFile && newImagePath && newImagePath !== imagePath) {
      const oldFilePath = path.join(__dirname, '..', 'views', 'image', oldFolder, imagePath);
      const newFilePath = path.join(__dirname, '..', 'views', 'image', oldFolder, newImagePath);
      fs.renameSync(oldFilePath, newFilePath, function(err) {
        if (err) {
          console.log(err)
          return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur lors du renommage du fichier')}`);
        }
      });
    }

    if(newQuestion ==='')
      newQuestion = null;
    
    let updateQuery = 'UPDATE Images SET FilePath = ?, Question = ? WHERE ID = ?';
    let values = [newImagePath, newQuestion, imageID];
    await query(updateQuery, values);

    res.json({ message: 'Image mise à jour avec succès' });
  } catch (error) {
    console.error(error);
    return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur de serveur')}`);
  }
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
    // Récupérer le token du cookie
    const token = req.cookies['authToken'];
  
    if (!token) {
      return res.redirect(req.originalUrl + `/erreur/401?message=${encodeURIComponent('Jetons d\'authentification manquants')}`);
    }
  
    jwt.verify(token, jwtSecret, (error, decoded) => {
      if (error) {
        console.error(error);
        return res.redirect(req.originalUrl + `/erreur/403?message=${encodeURIComponent('Échec de l\'authentification du jeton')}`);
      }
  
      req.token = token;
      req.user = decoded;
  
      // Vérifier que le token existe et n'est pas expiré dans la base de données
      connection.query('SELECT ID FROM Token WHERE UserID = ? AND TokenValue = ? AND Expired > NOW()', [decoded.id, token], (error, results, fields) => {
        if (error) {
          console.error(error);
          return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur interne')}`);
        }
  
        if (results.length === 0) {
          connection.query('SELECT ID FROM Token WHERE UserID = ? AND TokenValue = ? AND Expired < NOW()', [decoded.id, token], (error, results, fields) => {
            if (error) {
              console.error(error);
              return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur interne')}`);
            }
      
            if (results.length >0) {
              connection.query('DELETE FROM Token WHERE UserID = ? AND TokenValue = ?', [decoded.id, token], (error, results, fields) => {
                if (error) {
                  console.error(error);
                  return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur interne')}`);
                }
              });
            }
          });
          // Supprimer le cookie du navigateur
          res.clearCookie('authToken');
          return res.redirect(req.originalUrl + `/erreur/401?message=${encodeURIComponent('Authentification invalide. Veuillez vous reconnecter')}`);
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
        return res.redirect(req.originalUrl + `?message=${encodeURIComponent('Nom d utilisateur invalide')}`);
      }
  
      const user = users[0];
      const passwordMatch = await bcrypt.compare(password, user.Password);
  
      if (!passwordMatch) {
        return res.redirect(req.originalUrl + `?message=${encodeURIComponent('mot de passe invalide')}`);
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
      return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur connextion a la BD')}`);
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
        return res.redirect(req.originalUrl + `/erreur/404?message=${encodeURIComponent('Aucun CapChat trouvé')}`);
      }

      res.json(capchats);
  } catch (error) {
      console.error(error);
      return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur de serveur')}`);
  }
});

router.get('*/erreur/:idErreur', (req, res) => {
  const idErreur = req.params.idErreur;
  const message = req.query.message || 'Erreur inconnue';

  // Utilisez l'ID d'erreur pour charger le fichier HTML approprié
  const filePath = path.join(__dirname, '..', 'views', 'erreur', `${idErreur}.html`);

  // Renvoyer le fichier HTML avec le message d'erreur
  res.sendFile(filePath, { message });
});

router.get('*', (req, res) => {
  res.redirect(req.originalUrl + `/erreur/404?message=${encodeURIComponent('La page existe pas')}`);
});
  

module.exports = router;
