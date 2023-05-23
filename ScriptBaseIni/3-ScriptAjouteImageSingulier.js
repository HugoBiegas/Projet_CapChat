const mysql = require('mysql');
const fs = require('fs');
const path = require('path');

// Créer une connexion à la base de données
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'CapChat'
});

connection.connect((err) => {
  if (err) throw err;
  console.log('Connecté à la base de données MySQL!');
});

const directoryPath = path.join(__dirname, '..', 'server', 'views', 'image', 'singuliers', 'general'); // Le répertoire des images

const questions = [];

// Fonction utilitaire pour lire un fichier de manière asynchrone
function readFileAsync(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

// Fonction utilitaire pour insérer une image dans la base de données de manière asynchrone
function insertImageAsync(imagePath, question) {
  return new Promise((resolve, reject) => {
    fs.readFile(imagePath, (err, data) => {
      if (err) reject(err);
      else {
        const imageBase64 = data.toString('base64');
        const sql = `INSERT INTO Images (ImageSetID, FilePath, Question) VALUES (1, ?, ?)`;
        connection.query(sql, [path.basename(imagePath), question], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      }
    });
  });
}


// Fonction principale asynchrone pour insérer les images dans l'ordre
async function insertImagesInOrder() {
  try {
    // Lire le fichier Indice
    const indiceFilePath = path.join(__dirname, '..', 'server', 'views', 'image', 'Indices_singuliers.txt');
    const indiceContent = await readFileAsync(indiceFilePath);
    const lines = indiceContent.split('\n');
    lines.forEach(line => {
      if (line.trim() !== '') {
        questions.push(line.trim());
      }
    });

    // Lire les fichiers dans le répertoire des images
    const files = await fs.promises.readdir(directoryPath);

    // Trier les fichiers par ordre numérique
    files.sort((a, b) => {
      const fileNumberA = parseInt(a.split('-')[0]);
      const fileNumberB = parseInt(b.split('-')[0]);
      return fileNumberA - fileNumberB;
    });

    // Insérer les images dans l'ordre
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(directoryPath, file);
      const question = questions[i % questions.length];
      await insertImageAsync(filePath, question);
      console.log(`Image "${file}" insérée avec succès!`);
    }
    // Fermer la connexion à la base de données
    connection.end();
  } catch (err) {
    console.error(err);
    connection.end();
  }
}

// Appeler la fonction principale pour insérer les images dans l'ordre
insertImagesInOrder();
