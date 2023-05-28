const mysql = require('mysql');

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: ""
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");

  con.query("DROP DATABASE IF EXISTS CapChat", function (err, result) {
    if (err) throw err;
    console.log("Database dropped");

    con.query("CREATE DATABASE CapChat", function (err, result) {
      if (err) throw err;
      console.log("Database created");

      con.changeUser({ database: 'CapChat' }, function (err) {
        if (err) throw err;

        const tables = [
          `CREATE TABLE Users (
            ID INT AUTO_INCREMENT,
            Username VARCHAR(255) NOT NULL,
            Email VARCHAR(255) NOT NULL,
            Password VARCHAR(255) NOT NULL,
            NameArtiste VARCHAR(255) DEFAULT NULL,
            PRIMARY KEY (ID)
          );`,
          `CREATE TABLE Token (
            ID INT AUTO_INCREMENT,
            UserID INT,
            PaswordToken boolean DEFAULT false,
            TokenValue VARCHAR(255) NOT NULL,
            Expired DATE,
            PRIMARY KEY (ID),
            FOREIGN KEY (UserID) REFERENCES Users(ID)
          );`,
          `CREATE TABLE Themes (
            ID INT AUTO_INCREMENT,
            Name VARCHAR(255) NOT NULL,
            PRIMARY KEY (ID)
          );`,
          `CREATE TABLE ImageSets (
            ID INT AUTO_INCREMENT,
            UserID INT,
            ThemeID INT,
            URLUsage VARCHAR(255),
            PRIMARY KEY (ID),
            FOREIGN KEY (UserID) REFERENCES Users(ID),
            FOREIGN KEY (ThemeID) REFERENCES Themes(ID)
          );`,
          `CREATE TABLE Images (
            ID INT AUTO_INCREMENT,
            ImageSetID INT,
            FilePath VARCHAR(255) NOT NULL,
            Question VARCHAR(255) DEFAULT NULL,
            PRIMARY KEY (ID),
            FOREIGN KEY (ImageSetID) REFERENCES ImageSets(ID)
          );`
        ];

        tables.forEach(function (query) {
          con.query(query, function (err, result) {
            if (err) throw err;
            console.log("Table created");
          });
        });

        con.end(function (err) {
          if (err) throw err;
          console.log('Connection ended');
        });
      });
    });
  });
});
