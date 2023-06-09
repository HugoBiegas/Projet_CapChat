// userRoutes.js
const express = require('express');
const connection = require('../dbConfig');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const util = require('util');
const multer = require('multer');
const nodemailer = require('nodemailer');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'views', 'image', 'temp')); // Spécifiez le répertoire de destination des fichiers
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
router.use('/node_modules', express.static(path.join(__dirname, '..', '..', 'node_modules')));
router.use('/css', express.static(path.join(__dirname, '..', 'views', 'css')));
router.use('/js', express.static(path.join(__dirname, '..', 'views', 'js')));

router.get('/api/capchat/:urlUsage', async (req, res) => {
  console.log('sa commence');
  try {
    const urlUsage = req.params.urlUsage;

    console.log(`URL Usage: ${urlUsage}`);  // Ajoutez cela

    const imageSetsQuery = `SELECT * FROM ImageSets WHERE URLUsage = ?`;
    const imageSets = await query(imageSetsQuery, [urlUsage]);

    console.log(`Image Sets: ${JSON.stringify(imageSets)}`);  // Ajoutez cela

    if (imageSets.length === 0) {
      console.log('Image sets length is 0, redirecting to error page.');  // Ajoutez cela
      return res.redirect(req.originalUrl + `/erreur/404?message=${encodeURIComponent('CapChat non trouvé')}`);
    }

    const imagesNeutresQuery = `SELECT Images.FilePath, ImageSets.URLUsage FROM Images 
    JOIN ImageSets ON Images.ImageSetID = ImageSets.ID
    WHERE ImageSets.URLUsage = ? AND Images.Question = ''
    ORDER BY RAND()
    LIMIT 7`;
    const imagesNeutres = await query(imagesNeutresQuery, [urlUsage]);

    console.log(`Images Neutres: ${JSON.stringify(imagesNeutres)}`);  // Ajoutez cela

    const imageSinguliereQuery = `SELECT ImageSets.URLUsage, Images.FilePath, Images.Question FROM ImageSets 
      LEFT JOIN Images ON Images.ImageSetID = ImageSets.ID
      WHERE ImageSets.URLUsage = ? AND Images.Question != ''
      ORDER BY RAND()
      LIMIT 1`;
    const imageSinguliere = await query(imageSinguliereQuery, [urlUsage]);

    console.log(`Image Singuliere: ${JSON.stringify(imageSinguliere)}`);  // Ajoutez cela

    res.json({ imagesNeutres, imageSinguliere });
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);  // Ajoutez cela
    return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur de base de données')}`);
  }
});

router.get('/api/capChatTheme/:name', async (req, res) => {
  try {
    const themeName = req.params.name;
    const themeQuery = `SELECT ImageSets.ID, ImageSets.URLUsage FROM ImageSets LEFT JOIN Themes ON ImageSets.ThemeID = Themes.ID WHERE Themes.Name = ?`;
    const imageSets = await query(themeQuery, [themeName]);

    if (imageSets.length === 0) {
      return res.redirect(req.originalUrl + `/erreur/404?message=${encodeURIComponent('Thème non trouvé')}`);
    }

    const imageSetIDs = imageSets.map(imageSet => imageSet.ID);
    const imagesNeutresQuery = `
    SELECT Images.FilePath, ImageSets.URLUsage FROM Images 
    JOIN ImageSets ON Images.ImageSetID = ImageSets.ID
    WHERE Images.ImageSetID IN (?)
    AND Images.Question = ''
    ORDER BY RAND()
    LIMIT 7
    `;
    const imagesNeutres = await query(imagesNeutresQuery, [imageSetIDs]);

    const imageSinguliereQuery = `
    SELECT ImageSets.URLUsage, Images.FilePath, Images.Question FROM ImageSets 
    LEFT JOIN Images ON Images.ImageSetID = ImageSets.ID 
    WHERE ImageSets.ThemeID IN (SELECT ID FROM Themes WHERE Themes.Name = ?) 
    AND Images.Question != '' 
    ORDER BY RAND() 
    LIMIT 1`;
    const imageSinguliere = await query(imageSinguliereQuery, [themeName]);

    res.json({ imagesNeutres, imageSinguliere });
  } catch (error) {
    return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur de base de données')}`);
  }
});


router.get(['*/capchatTheme/:name', '*/capchat/:urlUsage'], (req, res) => {
  const urlUsage = req.params.urlUsage;
  const name = req.params.name;

  if (name) {
    connection.query(`SELECT ID FROM Themes WHERE Name = ?`, [name], function (error, results, fields) {
      if (error) {
        return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur Base de Données non accessible')}`);
      }
      if (results.length === 0) {
        return res.redirect(req.originalUrl + `/erreur/404?message=${encodeURIComponent('Thème non trouvé')}`);
      }

      // Si le thème existe, renvoyez le fichier HTML
      res.sendFile(path.join(__dirname, '../views', 'capchat.html'));
    });
  } else {
    connection.query(`SELECT ID FROM ImageSets WHERE URLUsage = ?`, [urlUsage], function (error, results, fields) {
      if (error) {
        return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur Base de Données non accessible')}`);
      }
      if (results.length === 0) {
        return res.redirect(req.originalUrl + `/erreur/404?message=${encodeURIComponent('CapChat non trouvé')}`);
      }

      // Si le CapChat existe, renvoyez le fichier HTML
      res.sendFile(path.join(__dirname, '../views', 'capchat.html'));
    });
  }
});


router.get('/', ConnexionAutomatique, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'connexion.html'));
});

router.get('/creationCapChat', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'creationCapChat.html'));
});

router.get('/information', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'information.html'));
});

router.get('/inscription', ConnexionAutomatique, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'inscription.html'));
});
router.get('/Profile', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'profil.html'));
});


router.get('/connexion', ConnexionAutomatique, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'connexion.html'));
});

router.get('/deconnexion', authenticateToken, (req, res) => {
  // Supprimez le token de la base de données
  connection.query('DELETE FROM Token WHERE UserID = ? AND TokenValue = ?', [req.user.id, req.token], (error, results, fields) => {
    if (error) {
      console.error(error);
      return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur interne')}`);
    }

    // Supprimez le cookie authToken
    res.clearCookie('authToken');

    // Redirigez l'utilisateur vers '/'
    res.redirect('/connexion');
  });
});


router.get('/api/urlusage', authenticateToken, (req, res) => {
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

    const imagesNeutres = await query("SELECT FilePath,ImageSetID FROM Images WHERE ImageSetID = ? AND Question ='' ", [capchat[0].ID]);
    const imageSinguliere = await query("SELECT FilePath,ImageSetID,Question FROM Images WHERE ImageSetID = ? AND Question != ''", [capchat[0].ID]);

    res.json({ imagesNeutres, imageSinguliere });
  } catch (error) {
    console.error(error);
    return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('error Base de Donnée non accésible')}`);
  }
});


// Route pour mettre à jour une image dans la base de données
router.post('/api/updateimage/:imagePath', authenticateToken, upload.single('imageFile', 1), async (req, res) => {
  try {
    const { imagePath } = req.params;
    let { newImagePath, newQuestion } = req.body;
    const imageFile = req.file;

    const imageData = await query('SELECT ID, Question,ImageSetID FROM Images WHERE FilePath = ?', [imagePath]);
    if (imageData.length === 0) {
      return res.redirect(req.originalUrl + `/erreur/404?message=${encodeURIComponent('Image non trouvée')}`);
    }

    const imageID = imageData[0].ID;
    const oldQuestion = imageData[0].Question;
    const imageSetID = imageData[0].ImageSetID;

    if (!imageFile && newImagePath && newImagePath !== imagePath) {
      const existingImage = await query('SELECT ID FROM Images WHERE FilePath = ?', [newImagePath]);
      if (existingImage.length > 0) {
        return res.redirect(req.originalUrl + `/erreur/400?message=${encodeURIComponent('Le nom de l image est déjà utilisé')}`);
      }
    }
    let ext = '.png';
    if (imageFile) {
      ext = path.extname(imageFile.originalname).toLowerCase(); // Récupère l'extension de l'image actuelle
    }
    //verifications du nom et mise en place .png et .jpg
    let newExt = path.extname(newImagePath).toLowerCase(); // Récupère l'extension de la nouvelle image
    console.log(ext + " : " + newExt);
    // Vérifie si l'extension de la nouvelle image est .png ou .jpg
    if (newExt !== '.png' && newExt !== '.jpg') {
      newImagePath += ext; // Si l'extension n'est pas .png ou .jpg, ajoute l'extension de l'image actuelle
    } else if (ext !== newExt) {
      // Si l'extension de l'image actuelle est différente de celle de la nouvelle image, modifie l'extension de la nouvelle image pour qu'elle corresponde à celle de l'image actuelle
      newImagePath = path.basename(newImagePath, newExt) + ext;
    }

    const oldFolder = oldQuestion ? "singuliers" : "neutres";
    const newFolder = newQuestion ? "singuliers" : "neutres";
    const nomImageSetResult = await query('SELECT URLUsage FROM imagesets WHERE ID = ?', [imageSetID]);
    const nomImageSet = nomImageSetResult[0].URLUsage;

    //mettre la métode pour déplacer l'image si l'utilisateur a ajouter une iamge
    if (imageFile) {
      const newFolderPath = path.join(__dirname, '..', 'views', 'image', newFolder, nomImageSet);
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
      const oldFolderPath = path.join(__dirname, '..', 'views', 'image', oldFolder, nomImageSet, imagePath);
      const newFolderPath = path.join(__dirname, '..', 'views', 'image', newFolder, nomImageSet, newImagePath);
      //si il n'y a pas de nouvelle image on déplace l'image si non on la suprime
      if (!imageFile) {
        fs.renameSync(oldFolderPath, newFolderPath, function (err) {
          if (err) {
            console.log(err)
            return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur lors du déplacement du fichier')}`);
          }
        });
      } else {
        fs.unlinkSync(oldFolderPath, function (err) {
          if (err) {
            console.log(err)
            return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur lors de la suppression de l\'image précédente')}`);
          }
        });
      }
    }
    else if (!imageFile && newImagePath && newImagePath !== imagePath) {
      const oldFilePath = path.join(__dirname, '..', 'views', 'image', oldFolder, nomImageSet, imagePath);
      const newFilePath = path.join(__dirname, '..', 'views', 'image', oldFolder, nomImageSet, newImagePath);
      fs.renameSync(oldFilePath, newFilePath, function (err) {
        if (err) {
          console.log(err)
          return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur lors du renommage du fichier')}`);
        }
      });
    }
    if (newQuestion === null || newQuestion === undefined)
      newQuestion = '';

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
    const { username, password, NameArtiste, email } = req.body;

    // Vérification des champs
    if (!username || !password || !email) {
      return res.json({ message: "Veuillez remplir tous les champs obligatoires." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let queryStr;
    let values;

    queryStr = 'SELECT Username, Email FROM Users WHERE Username = ? OR Email = ?';
    values = [username, email];

    query(queryStr, values)
      .then((results) => {
        if (results.length > 0) {
          let message;
          if (results[0].Username === username) {
            message = "Nom d'utilisateur déjà pris";
          } else {
            message = "Email déjà utilisé";
          }
          return res.json({ message: message });
        } else {
          query('INSERT INTO Users (Username, Password, NameArtiste, Email) VALUES (?, ?, ?, ?)', [username, hashedPassword, NameArtiste, email])
            .then(() => {
              return res.json({ message: 'Inscription réussie' });
            })
            .catch((error) => {
              console.error(error);
              return res.json({ message: 'Erreur interne' });
            });
        }
      })
      .catch((error) => {
        console.error(error);
        return res.json({ message: 'Erreur interne' });
      });

  } catch (error) {
    console.error(error);
    return res.json({ message: 'Erreur interne' });
  }
});




function generateAccessToken(userId) {
  return jwt.sign({ id: userId }, jwtSecret, { expiresIn: '1d' });
}

function authenticateTokenAdmin(req, res, next) {
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
    connection.query('SELECT ID, TypeToken FROM Token WHERE UserID = ? AND TokenValue = ? AND Expired > NOW()', [decoded.id, token], (error, results, fields) => {
      if (error) {
        console.error(error);
        return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur interne')}`);
      }

      if (results.length === 0) {
        // Supprimer le cookie du navigateur
        res.clearCookie('authToken');
        return res.redirect(req.originalUrl + `/erreur/401?message=${encodeURIComponent('Authentification invalide. Veuillez vous reconnecter')}`);
      }

      if (results[0].TypeToken !== 1) {
        return res.redirect('/');
      }

      next();
    });
  });
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
    connection.query('SELECT ID,TypeToken FROM Token WHERE UserID = ? AND TokenValue = ? AND Expired > NOW()', [decoded.id, token], (error, results, fields) => {
      if (error) {
        console.error(error);
        return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur interne')}`);
      }
      if (results[0].TypeToken === 2)
        return res.redirect(req.originalUrl + `/erreur/401?message=${encodeURIComponent('Authentification invalide. Vous ne pouvez pas vous connecter avec un token de réinitialisations de passeword')}`);


      if (results.length === 0) {
        connection.query('SELECT ID FROM Token WHERE UserID = ? AND TokenValue = ? AND Expired < NOW()', [decoded.id, token], (error, results, fields) => {
          if (error) {
            console.error(error);
            return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur interne')}`);
          }

          if (results.length > 0) {
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

function ConnexionAutomatique(req, res, next) {
  // Récupérer le token du cookie
  const token = req.cookies['authToken'];
  if (!token)
    return next();


  jwt.verify(token, jwtSecret, (error, decoded) => {
    if (error)
      return next();

    req.token = token;
    req.user = decoded;

    // Vérifier que le token existe et n'est pas expiré dans la base de données
    connection.query('SELECT ID,TypeToken FROM Token WHERE UserID = ? AND TokenValue = ? AND Expired > NOW()', [decoded.id, token], (error, results, fields) => {
      if (error) {
        console.error(error);
        return next();
      }
      if (results.length >= 1 && results[0].TypeToken == 0) {
        return res.redirect(req.originalUrl + `accueil`);

      } else if (results.length >= 1 && results[0].TypeToken === 1) {
        return res.redirect(req.originalUrl + `accueil-admin`);
      }

      else if (results.length === 0) {
        connection.query('SELECT ID FROM Token WHERE UserID = ? AND TokenValue = ? AND Expired < NOW()', [decoded.id, token], (error, results, fields) => {
          if (error) {
            console.error(error);
            return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur interne')}`);
          }

          if (results.length > 0) {
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

    const users = await query('SELECT ID, Password, Role FROM users WHERE Username = ?', [username]);
    if (users.length === 0) {
      return res.redirect(req.originalUrl + `?message=${encodeURIComponent('Nom d\'utilisateur invalide')}`);
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.Password);

    if (!passwordMatch) {
      return res.redirect(req.originalUrl + `?message=${encodeURIComponent('Mot de passe invalide')}`);
    }

    const tokens = await query('SELECT ID FROM Token WHERE UserID = ?', [user.ID]);
    if (tokens.length > 0) {
      await query('DELETE FROM Token WHERE UserID = ?', [user.ID]);
    }

    const token = generateAccessToken(user.ID); // Appel à generateAccessToken

    // Mettre TypeToken à 1 si l'utilisateur est un administrateur
    const typeToken = user.Role === 1 ? 1 : 0;

    await query('INSERT INTO Token (UserID, TokenValue, Expired, TypeToken) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY), ?)', [user.ID, token, typeToken]);

    // Stocker le token dans un cookie
    res.cookie('authToken', token, { httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000 }); // 1 jour

    // Rediriger en fonction du rôle de l'utilisateur
    if (user.Role === 0) {
      res.redirect('/accueil-Admin');
    } else if (user.Role === 1) {
      res.redirect('/accueil-Admin');
    } else {
      res.redirect('/accueil');
    }
  } catch (error) {
    console.error(error);
    return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur connexion à la BD')}`);
  }
});
// Récupérer les utilisateurs avec un rôle de 2
router.get('/api/users', authenticateTokenAdmin, async (req, res) => {
  try {
    const users = await query('SELECT ID, Username, NameArtiste FROM Users WHERE Role = 2');
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des utilisateurs.' });
  }
});

// Supprimer un utilisateur
router.delete('/api/users/:userId', authenticateTokenAdmin, async (req, res) => {
  const userId = req.params.userId;

  const capchats = await query('SELECT ID, URLUsage FROM ImageSets WHERE UserID = ?', [userId]);

  try {
    await query('DELETE FROM Users WHERE ID = ?', [userId]);
    await query('DELETE FROM Token WHERE UserID = ?', [userId]);

    for (let i = 0; i < capchats.length; i++) {
      const capchatID = capchats[i].ID;
      const capchatURL = capchats[i].URLUsage;

      // Supprimer le CapChat de la base de données
      await query('DELETE FROM Images WHERE ImageSetID = ?', [capchatID]);
      await query('DELETE FROM ImageSets WHERE ID = ?', [capchatID]);

      // Supprimer tous les fichiers d'images du CapChat
      const neutresPath = path.join(__dirname, '..', 'views', 'image', 'neutres', capchatURL);
      const singuliersPath = path.join(__dirname, '..', 'views', 'image', 'singuliers', capchatURL);

      if (fs.existsSync(neutresPath)) {
        fs.readdirSync(neutresPath).forEach(file => {
          const filePath = path.join(neutresPath, file);
          fs.unlinkSync(filePath);
        });
        fs.rmdirSync(neutresPath);
      }

      if (fs.existsSync(singuliersPath)) {
        fs.readdirSync(singuliersPath).forEach(file => {
          const filePath = path.join(singuliersPath, file);
          fs.unlinkSync(filePath);
        });
        fs.rmdirSync(singuliersPath);
      }
    }

    res.status(200).json({ success: true, message: 'Utilisateur supprimé avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression de l\'utilisateur.' });
  }
});

router.get('/accueil-Admin', authenticateTokenAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'acceuilAdmin.html'));
});

router.get('/accueil', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'acceuilArtiste.html'));
});

// Récupérer les informations de l'utilisateur à partir du token
router.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const userQuery = 'SELECT Username, NameArtiste, Email FROM Users WHERE ID = ?';
    const results = await query(userQuery, [userId]);

    if (results.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const { Username, NameArtiste, Email } = results[0];
    res.json({ username: Username, artistName: NameArtiste, email: Email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur de serveur' });
  }
});

// Récupérer les CapChats créés par l'utilisateur
router.get('/api/capchats', authenticateToken, async (req, res) => {
  try {
    const capchats = await query('SELECT COUNT(Images.ID) as nombreImage, ImageSets.URLUsage FROM ImageSets LEFT JOIN Images ON Images.ImageSetID = ImageSets.ID WHERE ImageSets.UserID = ? GROUP BY ImageSets.ID', [req.user.id]);
    res.json(capchats);
  } catch (error) {
    console.error(error);
    return res.redirect(req.originalUrl + `/erreur/500?message=${encodeURIComponent('Erreur de serveur')}`);
  }
});

router.delete('/api/deleteimage/:imagePath/:urlUsage', authenticateToken, async (req, res) => {
  try {
    const { imagePath, urlUsage } = req.params;

    // Vérifier si l'image existe dans la base de données
    const image = await query('SELECT * FROM Images WHERE FilePath = ?', [imagePath]);
    if (image.length === 0) {
      return res.status(404).json({ message: 'Image introuvable' });
    }

    // Obtenez l'ID du ImageSet associé à l'URLUsage
    const imageSet = await query('SELECT * FROM ImageSets WHERE URLUsage = ?', [urlUsage]);
    if (imageSet.length === 0) {
      return res.status(404).json({ message: 'ImageSet introuvable' });
    }

    // Vérifier si l'image a une question
    const hasQuestion = image[0].Question == null;

    if (hasQuestion) {
      // Vérifier combien d'images singulières restent pour ce ImageSet
      const singularImages = await query('SELECT ID,ImageSetID FROM Images WHERE Question != "" AND ImageSetID = ?', [imageSet[0].ID]);
      if (singularImages.length <= 1) {
        return res.status(400).json({ message: 'Vous devez conserver au moins une image singulière pour le CapChat' });
      }
    } else {
      // Vérifier combien d'images neutres restent pour ce ImageSet
      const neutralImages = await query('SELECT ID,ImageSetID FROM Images WHERE Question = "" AND ImageSetID = ?', [imageSet[0].ID]);
      if (neutralImages.length <= 7) {
        return res.status(400).json({ message: 'Vous devez avoir au moins 7 images neutres pour le CapChat' });
      }
    }

    // Déterminer le dossier où se trouve l'image en fonction de la présence ou non d'une question
    const imageFolder = hasQuestion ? 'singuliers' : 'neutres';
    // Supprimer l'image du système de fichiers (assurez-vous d'adapter le chemin d'accès selon votre configuration)
    const filePath = path.join(__dirname, '..', 'views', 'image', imageFolder, urlUsage, imagePath);
    fs.unlinkSync(filePath);

    // Supprimer l'image de la base de données
    await query('DELETE FROM Images WHERE FilePath = ?', [imagePath]);

    return res.status(200).json({ message: 'Image supprimée avec succès' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur lors de la suppression de l\'image' });
  }
});


router.post('/api/ajoute/:imageName/:imageSetID', authenticateToken, upload.single('imageFile'), async (req, res) => {
  console.log('début de l ajoute');
  try {
    let imageName = req.params.imageName;
    const question = req.body.question;
    const imageSetID = req.params.imageSetID;

    // Vérifiez le type d'image
    if (!isValidImageFile(req.file)) {
      return res.status(400).json({ message: 'Veuillez sélectionner un fichier d\'image au format .png, .jpg ou .jpeg' });
    }

    // Vérifiez et mettez à jour l'extension de l'image
    let ext = path.extname(req.file.originalname).toLowerCase();
    let newExt = path.extname(imageName).toLowerCase();
    console.log(ext + " : " + newExt);

    // Ajoutez plus d'extensions d'image à vérifier
    if (newExt !== '.png' && newExt !== '.jpg' && newExt !== '.jpeg') {
      imageName += ext;
    } else if (ext !== newExt) {
      imageName = path.basename(imageName, newExt) + ext;
    }

    console.log(imageName);
    // Vérifiez si le nom d'image est déjà utilisé
    const existingImage = await query('SELECT * FROM Images WHERE FilePath = ? AND ImageSetID = ? ', [imageName, imageSetID]);
    if (existingImage.length > 0) {
      return res.status(400).json({ message: 'Le nom de l\'image est déjà utilisé' });
    }
    // Déplacez l'image téléchargée vers le bon dossier en fonction de la présence de la question
    const destinationDir = question ? 'singuliers' : 'neutres';
    const oldFilePath = req.file.path;
    const nomImageSet = (await query('SELECT URLUsage FROM imagesets WHERE ID = ?', [imageSetID]))[0].URLUsage;

    const newFilePath = path.join(__dirname, '..', 'views', 'image', destinationDir, nomImageSet, imageName);
    console.log(newFilePath);
    fs.renameSync(oldFilePath, newFilePath);

    // Insérer la nouvelle image dans la base de données
    const insertQuery = 'INSERT INTO Images (ImageSetID, FilePath, Question) VALUES (?, ?, ?)';
    connection.query(insertQuery, [imageSetID, imageName, question], function (error, results, fields) {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erreur lors de l\'insertion de l\'image dans la base de données' });
      }

      // Succès
      res.status(200).json({ message: 'Image ajoutée avec succès' });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur de serveur' });
  }
});

function isValidImageFile(file) {
  // Vérifiez si le fichier existe et a une extension valide
  if (!file || !file.originalname) {
    return false;
  }

  const allowedExtensions = ['.png', '.jpg'];

  // Vérifiez l'extension du fichier
  const fileExtension = path.extname(file.originalname).toLowerCase();
  return allowedExtensions.includes(fileExtension);
}


// API pour récupérer tous les thèmes
router.get('/api/capChatThemes', async (req, res) => {
  try {
    const themes = await query('SELECT Themes.Name AS nomTheme, COUNT(Images.ID) AS nombreImages, Themes.Name AS urlUsageTheme FROM Themes LEFT JOIN ImageSets ON ImageSets.ThemeID = Themes.ID LEFT JOIN Images ON Images.ImageSetID = ImageSets.ID GROUP BY Themes.ID');
    res.json(themes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur de serveur' });
  }
});
router.put('/api/capchat-update', async (req, res) => {
  try {
    const { themeId, name, NameCapChat } = req.body;
    console.log(themeId + " : " + name + " : " + NameCapChat);
    const updateQuery = 'UPDATE ImageSets SET ThemeID = ?, URLUsage = ? WHERE URLUsage = ?';
    await query(updateQuery, [themeId, name, NameCapChat]);

    res.json({ message: 'ImageSet updated successfully' });
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    res.status(500).json({ message: 'Database error' });
  }
});


router.get('/api/themes', async (req, res) => {
  try {
    const themesQuery = 'SELECT * FROM Themes';
    const themes = await query(themesQuery);
    res.json(themes);
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    res.status(500).json({ message: 'Database error' });
  }
});

router.get('/api/themes-users/:urlUsage', async (req, res, next) => {
  try {
    const urlUsage = req.params.urlUsage;
    const themeQuery = 'SELECT * FROM Themes';
    const userThemeQuery = `SELECT ThemeID FROM ImageSets WHERE URLUsage = '${urlUsage}' LIMIT 1`;

    const themes = await query(themeQuery);
    const userTheme = await query(userThemeQuery);

    if (userTheme.length > 0) {
      const response = {
        themes: themes,
        currentTheme: userTheme[0]
      };
      res.json(response);
    } else {
      res.status(404).json({ message: 'No user found with this URL usage' });
    }
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    next(error);
  }
});

router.post('/api/adcapchat', upload.array('images'), async (req, res) => {
  const { images } = req.body;

  const moveFile = util.promisify(fs.rename);
  const imageQueries = images.map(async (image, index) => {
    const tempPath = req.files[index].path;
    let newPath;

    const nomImageSet = await query('SELECT URLUsage FROM imagesets WHERE ID = ?', [imageSetID]);

    if (image.question) {
      newPath = path.join(__dirname, 'singular', nomImageSet, `${image.fileName}.jpg`);
    } else {
      newPath = path.join(__dirname, 'neutral', nomImageSet, `${image.fileName}.jpg`);
    }

    await moveFile(tempPath, newPath);

    return connection.query('INSERT INTO Images (ImageSetID, FilePath, Question) VALUES (?, ?, ?)', [imageSetID, newPath, image.question]);
  });

  await Promise.all(imageQueries);

  res.json({ success: true });
});



// API pour récupérer tous les CapChat existants
router.get('/api/allcapChat', async (req, res) => {
  try {
    const capChats = await query('SELECT ImageSets.URLUsage AS urlUsage, COUNT(Images.ID) AS nombreImages, Themes.Name AS nomCapChat FROM ImageSets LEFT JOIN Images ON Images.ImageSetID = ImageSets.ID LEFT JOIN Themes ON ImageSets.ThemeID = Themes.ID GROUP BY ImageSets.ID');
    res.json(capChats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur de serveur' });
  }
});


router.post('/api/newCapChat', authenticateToken, upload.array('images'), async (req, res) => {
  try {
    const { capchatName, theme, nouveauTheme } = req.body;
    const userID = req.user.id;
    const imagesData = JSON.parse(req.body.imagesData);
    let imageFiles = req.files; // Si vous téléchargez un seul fichier

    const nomValideCapChat = await query('SELECT ID FROM imagesets WHERE URLUsage = ?', [capchatName]);
    if (nomValideCapChat.length >= 1)
      return res.status(400).json({ error: 'le nom de capChat est dejat utiliser' });

    // Vérifier si le thème est nouveau
    let themeID;
    if (theme === 'nouveau') {
      // Créer le nouveau thème
      const insertThemeQuery = 'INSERT INTO Themes (Name) VALUES (?)';
      const result = await query(insertThemeQuery, [nouveauTheme]);

      themeID = result.insertId;
    } else {
      themeID = theme;
    }

    // Créer le capChat
    const insertCapChatQuery = 'INSERT INTO ImageSets (UserID, ThemeID, URLUsage) VALUES (?, ?, ?)';
    const capChatResult = await query(insertCapChatQuery, [userID, themeID, capchatName]);
    const imageSetID = capChatResult.insertId;

    const nomImageSet = (await query('SELECT URLUsage FROM imagesets WHERE ID = ?', [imageSetID]))[0].URLUsage;

    // Créer le dossier dans 'neutres' et 'singuliers' si il n'existe pas déjà
    const neutresPath = path.join(__dirname, '..', 'views', 'image', 'neutres', nomImageSet);
    const singuliersPath = path.join(__dirname, '..', 'views', 'image', 'singuliers', nomImageSet);

    if (!fs.existsSync(neutresPath) && !fs.existsSync(singuliersPath)) {
      fs.mkdirSync(neutresPath, { recursive: true });
      fs.mkdirSync(singuliersPath, { recursive: true });
    } else {
      return res.status(400).json({ error: 'le nom de capChat est dejat utiliser' });
    }



    // Parcourir les données des images et les enregistrer dans la base de données
    for (let i = 0; i < imagesData.length; i++) {
      const { name, question } = imagesData[i];

      // Vérifier si l'image a une question
      const isQuestionImage = !!question;

      // Déterminer le dossier de destination en fonction de la présence d'une question
      const destinationFolder = isQuestionImage ? 'singuliers' : 'neutres';
      // Vérifier l'extension du fichier

      let newFileName = name;
      const imageFile = imageFiles[i]; // Obtenez le fichier correspondant
      const extension = path.extname(newFileName);
      if (!extension || (extension !== '.png' && extension !== '.jpg')) {
        const originalExtension = path.extname(imageFile.originalname);
        if (originalExtension === '.png' || originalExtension === '.jpg') {
          newFileName = newFileName + originalExtension;
        } else {
          return res.status(400).json({ error: 'Le fichier doit être une image PNG ou JPG' });
        }
      }

      // Déplacer le fichier vers le dossier de destination
      const sourcePath = path.join(__dirname, '..', 'views', 'image', 'temp', name);
      const destinationPath = path.join(__dirname, '..', 'views', 'image', destinationFolder, nomImageSet, newFileName);
      fs.renameSync(sourcePath, destinationPath);

      // Insérer les informations de l'image dans la base de données
      const insertImageQuery = 'INSERT INTO Images (ImageSetID, FilePath, Question) VALUES (?, ?, ?)';
      await query(insertImageQuery, [imageSetID, newFileName, question]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur de serveur' });
  }
});


function createPasswordResetToken(userID, tokenValue, expiredDate) {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO Token (UserID, TypeToken, TokenValue, Expired) VALUES (?, ?, ?, ?)';
    const TypeToken = 2; // Valeur de TypeToken à 1

    connection.query(query, [userID, TypeToken, tokenValue, expiredDate], (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}
// Route pour la demande de réinitialisation du mot de passe
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Vérifier si l'e-mail existe dans la base de données
    const query = 'SELECT ID, Email FROM Users WHERE Email = ?';
    connection.query(query, [email], async (error, results, fields) => {
      if (error) {
        console.error(error);
        return res.json({ success: false });
      }

      if (results.length === 0) {
        return res.json({ success: false });
      }

      const userID = results[0].ID;
      const userEmail = results[0].Email;

      // Générer le jeton de réinitialisation du mot de passe
      const tokenValue = jwt.sign({ id: userID }, jwtSecret, { expiresIn: '1h' });

      // Date d'expiration du jeton
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() + 1); // Le jeton expire dans 1 heure

      // Enregistrer le jeton dans la base de données
      await createPasswordResetToken(userID, tokenValue, expiredDate);

      // Construire l'URL de réinitialisation du mot de passe avec le jeton
      const resetURL = `http://localhost:3000/reset-password/${tokenValue}`;

      // Configurer le transporteur de Nodemailer pour ProtonMail
      const transporter = nodemailer.createTransport({
        host: 'smtp.protonmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'CapChat.support@proton.me',
          pass: 'eGe7Pos6o9QEp$&Y'
        }
      });

      const mailOptions = {
        from: 'CapChat.support@proton.me',
        to: userEmail,
        subject: 'Demande de réinitialisation du mot de passe',
        text: `Bonjour,\n\nVous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien suivant pour créer un nouveau mot de passe : ${resetURL}\n\nSi vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet e-mail.\n\nCordialement,`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          return res.json({ success: false });
        }
        console.log('E-mail envoyé :', info.response);
        return res.json({ success: true });
      });
    });
  } catch (error) {
    console.error(error);
    return res.json({ success: false });
  }
});

// Récupérer les informations de profil de l'utilisateur connecté
router.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const userQuery = 'SELECT Username, NameArtiste, Email FROM Users WHERE ID = ?';
    connection.query(userQuery, [userId], (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erreur de serveur' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      const { Username, NameArtiste, Email } = results[0];
      res.json({ username: Username, artistName: NameArtiste, email: Email });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur de serveur' });
  }
});

// Mettre à jour le profil de l'utilisateur connecté
router.post('/api/updateProfile', authenticateToken, async (req, res) => {
  try {
    const { username, artistName, email, password } = req.body;
    const userID = req.user.id;

    // Vérifier si le nom d'utilisateur existe déjà pour un autre utilisateur
    const existingUsername = await query('SELECT ID FROM Users WHERE Username = ? AND ID != ?', [username, userID]);
    if (existingUsername.length > 0) {
      return res.status(400).json({ message: 'Le nom d\'utilisateur est déjà utilisé' });
    }

    // Vérifier si l'adresse e-mail existe déjà pour un autre utilisateur
    const existingEmail = await query('SELECT ID FROM Users WHERE Email = ? AND ID != ?', [email, userID]);
    if (existingEmail.length > 0) {
      return res.status(400).json({ message: 'L\'adresse e-mail est déjà utilisée' });
    }

    // Mettre à jour les informations de profil dans la base de données
    const updateQuery = 'UPDATE Users SET Username = ?, NameArtiste = ?, Email = ? WHERE ID = ?';
    const updateValues = [username, artistName, email, userID];

    // Mettre à jour le mot de passe si un nouveau mot de passe est fourni
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', Password = ?';
      updateValues.push(hashedPassword);
    }

    await query(updateQuery, updateValues);

    res.status(200).json({ message: 'Profil mis à jour avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur de serveur' });
  }
});


// Route pour la réinitialisation du mot de passe avec le jeton
router.get('/reset-password/:token', (req, res) => {
  const token = req.params.token;

  try {
    const decoded = jwt.verify(token, jwtSecret);

    // Vérifier si le jeton existe et n'est pas expiré dans la base de données
    connection.query('SELECT UserID, Expired FROM Token WHERE TokenValue = ? AND Expired > NOW() AND TypeToken = 2', [token], (error, results, fields) => {
      if (error) {
        console.error(error);
        return res.redirect('/erreur/500?message=' + encodeURIComponent('Erreur interne'));
      }

      if (results.length === 0) {
        return res.redirect('/erreur/403?message=' + encodeURIComponent('Jeton de réinitialisation de mot de passe invalide ou expiré'));
      }

      const userID = results[0].UserID;

      // Enregistrer l'ID utilisateur dans un cookie pour la réinitialisation du mot de passe
      res.cookie('resetUserID', userID, { httpOnly: true });

      res.sendFile(path.join(__dirname, '../views', 'reset-password.html'));
    });
  } catch (error) {
    console.error(error);
    return res.redirect('/erreur/403?message=' + encodeURIComponent('Jeton de réinitialisation de mot de passe invalide'));
  }
});


router.delete('/api/capchats-supr/:capchatURL', authenticateToken, async (req, res) => {
  const capchatURL = req.params.capchatURL;

  try {
    console.log('Suppression du CapChat :', capchatURL);

    // Récupérer l'ID du CapChat à partir de l'URL
    const capchat = await query('SELECT ID FROM ImageSets WHERE URLUsage = ?', [capchatURL]);

    if (capchat.length === 0) {
      console.log('CapChat non trouvé');
      return res.status(404).json({ success: false, message: 'CapChat non trouvé.' });
    }

    const capchatID = capchat[0].ID;
    // Supprimer le CapChat de la base de données
    await query('DELETE FROM Images WHERE ImageSetID = ?', [capchatID]);

    // Supprimer le CapChat de la base de données
    await query('DELETE FROM ImageSets WHERE ID = ?', [capchatID]);

    // Supprimer tous les fichiers d'images du CapChat
    const neutresPath = path.join(__dirname, '..', 'views', 'image', 'neutres', capchatURL);
    const singuliersPath = path.join(__dirname, '..', 'views', 'image', 'singuliers', capchatURL);

    if (fs.existsSync(neutresPath)) {
      fs.readdirSync(neutresPath).forEach(file => {
        const filePath = path.join(neutresPath, file);
        fs.unlinkSync(filePath);
      });
      fs.rmdirSync(neutresPath);
    }

    if (fs.existsSync(singuliersPath)) {
      fs.readdirSync(singuliersPath).forEach(file => {
        const filePath = path.join(singuliersPath, file);
        fs.unlinkSync(filePath);
      });
      fs.rmdirSync(singuliersPath);
    }

    console.log('CapChat supprimé avec succès');
    res.json({ success: true, message: 'CapChat supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la suppression du CapChat :', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression du CapChat.', error: error.message });
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
