const fs = require('fs');
const mysql = require('mysql');

// Créer une connexion à la base de données
const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'capChat'
});

// Chemin du dossier contenant les images neutres
const cheminDossier = 'C:\\Users\\Hugo\\Documents\\GitHub\\Projet_CapChat\\CapChat\\neutres';

// Établir la connexion à la base de données
conn.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err);
    return;
  }

  console.log('Connecté à la base de données MySQL');

  // Parcourir tous les fichiers du dossier
  fs.readdir(cheminDossier, (err, files) => {
    if (err) {
      console.error('Erreur lors de la lecture du dossier :', err);
      conn.end();
      return;
    }

    // Insérer chaque image dans la table Image_neutres
    files.forEach((filename) => {
      const cheminImage = `${cheminDossier}/${filename}`;

      // Vérifier si le chemin correspond à un fichier
      if (fs.statSync(cheminImage).isFile()) {
        const image = fs.readFileSync(cheminImage);

        // Insérer les données de l'image dans la table Image_neutres
        const query = 'INSERT INTO Image_neutres (image) VALUES (?)';
        conn.query(query, [image], (err, results) => {
          if (err) {
            console.error('Erreur lors de l\'insertion de l\'image :', err);
          } else {
            console.log(`Image insérée avec succès. ID : ${results.insertId}`);
          }
        });
      }
    });

    // Fermer la connexion à la base de données
    conn.end();
  });
});
