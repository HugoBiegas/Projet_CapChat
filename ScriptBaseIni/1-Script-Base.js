var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: ""
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");

  con.query("DROP DATABASE IF EXISTS CapChat", function (err, result) {
    if (err) throw err;
    console.log("Database dropped");

    con.query("CREATE DATABASE CapChat", function (err, result) {
      if (err) throw err;
      console.log("Database created");

      con.changeUser({database : 'CapChat'}, function(err) {
        if (err) throw err; 

        var tables = [
          `CREATE TABLE Users (
              ID INT AUTO_INCREMENT,
              Username VARCHAR(255) NOT NULL,
              Password VARCHAR(255) NOT NULL,
              Token VARCHAR(255),
              PRIMARY KEY (ID)
            );`,
          `CREATE TABLE Artists (
              ID INT AUTO_INCREMENT,
              UserID INT,
              Name VARCHAR(255) NOT NULL,
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
              ArtistID INT,
              ThemeID INT,
              Name VARCHAR(255) NOT NULL,
              URLUsage VARCHAR(255),
              PRIMARY KEY (ID),
              FOREIGN KEY (ArtistID) REFERENCES Artists(ID),
              FOREIGN KEY (ThemeID) REFERENCES Themes(ID)
            );`,
          `CREATE TABLE Images (
              ID INT AUTO_INCREMENT,
              ImageSetID INT,
              IsSingular BOOLEAN NOT NULL,
              Image LONGBLOB NOT NULL,
              Question VARCHAR(255) DEFAULT NULL,
              PRIMARY KEY (ID),
              FOREIGN KEY (ImageSetID) REFERENCES ImageSets(ID)
            )`
        ];

        tables.forEach(function(query) {
          con.query(query, function (err, result) {
            if (err) throw err;
            console.log("Table created");
          });
        });

        con.end(function(err) {
          if (err) throw err;
          console.log('Connection ended');
        });
      });
    });
  });
});
