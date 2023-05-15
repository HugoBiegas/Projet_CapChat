/*
CREATE DATABASE capChat;

USE capChat;

-- Table "users"
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL
);

-- Table "Image_neutres"
CREATE TABLE Image_neutres (
  id INT PRIMARY KEY AUTO_INCREMENT,
  image LONGBLOB NOT NULL
);

-- Table "Image_singulières"
CREATE TABLE Image_singulières (
  id INT PRIMARY KEY AUTO_INCREMENT,
  image LONGBLOB NOT NULL,
  indice VARCHAR(255) NOT NULL
);
*/
const mysql = require('mysql');

// Créer une connexion à la base de données
const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
});

// Requêtes SQL pour créer la base de données et les tables
const createDatabaseQuery = 'CREATE DATABASE IF NOT EXISTS capChat';
const useDatabaseQuery = 'USE capChat';
const createUsersTableQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
  )
`;
const createImageNeutresTableQuery = `
  CREATE TABLE IF NOT EXISTS Image_neutres (
    id INT PRIMARY KEY AUTO_INCREMENT,
    image LONGBLOB NOT NULL
  )
`;
const createImageSingulieresTableQuery = `
  CREATE TABLE IF NOT EXISTS Image_singulières (
    id INT PRIMARY KEY AUTO_INCREMENT,
    image LONGBLOB NOT NULL,
    indice VARCHAR(255) NOT NULL
  )
`;

// Exécuter les requêtes SQL
conn.query(createDatabaseQuery, (err) => {
  if (err) {
    console.error('Erreur lors de la création de la base de données :', err);
    conn.end();
    return;
  }

  conn.query(useDatabaseQuery, (err) => {
    if (err) {
      console.error('Erreur lors de la sélection de la base de données :', err);
      conn.end();
      return;
    }

    conn.query(createUsersTableQuery, (err) => {
      if (err) {
        console.error('Erreur lors de la création de la table "users" :', err);
        conn.end();
        return;
      }

      conn.query(createImageNeutresTableQuery, (err) => {
        if (err) {
          console.error('Erreur lors de la création de la table "Image_neutres" :', err);
          conn.end();
          return;
        }

        conn.query(createImageSingulieresTableQuery, (err) => {
          if (err) {
            console.error('Erreur lors de la création de la table "Image_singulières" :', err);
          } else {
            console.log('Tables créées avec succès');
          }

          // Fermer la connexion à la base de données
          conn.end();
        });
      });
    });
  });
});
