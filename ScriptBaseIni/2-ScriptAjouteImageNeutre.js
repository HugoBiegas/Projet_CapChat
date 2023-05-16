var mysql = require('mysql');
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var fs = require('fs').promises;
var path = require('path');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "CapChat"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");

  var username = 'root';
  var password = 'root';
  var artistName = 'Hugo';
  var themeName = 'Général';
  var setName = 'Général';
  var folderPath = 'C:\\Users\\anime\\OneDrive\\Documents\\GitHub\\Projet_CapChat\\CapChat\\neutres';

  bcrypt.hash(password, 10, function(err, hash) {
    if (err) throw err;
    var token = crypto.randomBytes(64).toString('hex');

    con.query("INSERT INTO Users (Username, Password, Token) VALUES (?, ?, ?)", [username, hash, token], function(err, result) {
      if (err) throw err;
      console.log("User inserted");

      con.query("SELECT ID FROM Users WHERE Username = ?", [username], function(err, result) {
        if (err) throw err;

        var userID = result[0].ID;
        con.query("INSERT INTO Artists (UserID, Name) VALUES (?, ?)", [userID, artistName], function(err, result) {
          if (err) throw err;
          console.log("Artist inserted");

          con.query("INSERT INTO Themes (Name) VALUES (?)", [themeName], function(err, result) {
            if (err) throw err;
            console.log("Theme inserted");

            con.query("SELECT ID FROM Artists WHERE Name = ?", [artistName], function(err, result) {
              if (err) throw err;

              var artistID = result[0].ID;
              con.query("SELECT ID FROM Themes WHERE Name = ?", [themeName], function(err, result) {
                if (err) throw err;

                var themeID = result[0].ID;
                con.query("INSERT INTO ImageSets (ArtistID, ThemeID, Name) VALUES (?, ?, ?)", [artistID, themeID, setName], async function(err, result) {
                if (err) throw err;
                  console.log("ImageSet inserted");

                try {
                  let files = await fs.readdir(folderPath);

                  files.sort(function(a, b) {
                    var numA = parseInt(a.split('chat neutre ')[1]);
                    var numB = parseInt(b.split('chat neutre ')[1]);
                    return numA - numB;
                  });

                    for (let i = 0; i < files.length; i++) {
                      let file = files[i];
                      let filePath = path.join(folderPath, file);
                      let data = await fs.readFile(filePath);
                      await new Promise((resolve, reject) => {
                      con.query("INSERT INTO Images (ImageSetID, IsSingular, Image, Question) SELECT ImageSets.ID, false, ?, NULL FROM ImageSets WHERE ImageSets.Name = ?", [data, setName], function(err, result) {
                      if (err) {
                        reject(err);
                        return;
                      }
                      console.log("Image added: " + file);
                      resolve();
                      });
                    });
                  }
                  con.end(function(err) {
                  if (err) throw err;
                    console.log('Connection ended');
                  });
                  } catch (err) {
                    console.error(err);
                  }
                });
              });
            });
          });
        });
      });
    });
  });
});
