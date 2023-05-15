const fs = require('fs');
const mysql = require('mysql');

// Créer une connexion à la base de données
const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'capChat'
});

// Chemin du dossier contenant les images singulières
const cheminDossier = 'C:\\Users\\Hugo\\Documents\\GitHub\\Projet_CapChat\\CapChat\\singuliers';

// Lire le fichier "indices.txt"
fs.readFile('C:\\Users\\Hugo\\Documents\\GitHub\\Projet_CapChat\\CapChat\\Indices_singuliers.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Erreur lors de la lecture du fichier "indices.txt" :', err);
    return;
  }

  // Extraire les indices en les séparant par des retours à la ligne
  const indices = data.trim().split('\n');

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

      // Vérifier si le nombre d'images correspond au nombre d'indices
      if (files.length !== indices.length) {
        console.error('Le nombre d\'images ne correspond pas au nombre d\'indices.');
        conn.end();
        return;
      }

      // Insérer chaque image avec son indice correspondant
      files.forEach((filename, index) => {
        const cheminImage = `${cheminDossier}/${filename}`;

        // Vérifier si le chemin correspond à un fichier
        if (fs.statSync(cheminImage).isFile()) {
          const image = fs.readFileSync(cheminImage);
          const indice = indices[index].trim();

          // Insérer les données de l'image dans la table Image_singulières
          const query = 'INSERT INTO Image_singulières (image, indice) VALUES (?, ?)';
          conn.query(query, [image, indice], (err, results) => {
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
});
