// dbConfig.js
const mysql = require('mysql');

// Configuration de la connexion à la base de données MySQL
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'CapChat'
};

// Création de la connexion à la base de données MySQL
const connection = mysql.createConnection(dbConfig);

module.exports = connection;
