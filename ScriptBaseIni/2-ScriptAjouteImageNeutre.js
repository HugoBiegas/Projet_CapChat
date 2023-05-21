const mysql = require('mysql');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "CapChat"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");

  const username = 'root';
  const password = 'root';
  const artistName = 'Hugo';
  const themeName = 'Général';
  const setName = 'general';
  const folderPath = path.join(__dirname, '..','server', 'views', 'image', 'neutres');

  bcrypt.hash(password, 10, function(err, hash) {
    if (err) throw err;
    const token = crypto.randomBytes(64).toString('hex');

    con.query("INSERT INTO Users (Username, Password, NameArtiste) VALUES (?, ?, ?)", [username, hash, artistName], function(err, result) {
      if (err) throw err;
      console.log("User inserted");

      con.query("SELECT ID FROM Users WHERE Username = ?", [username], function(err, result) {
        if (err) throw err;

        const userID = result[0].ID;

        con.query("INSERT INTO Themes (Name) VALUES (?)", [themeName], function(err, result) {
          if (err) throw err;
          console.log("Theme inserted");

          con.query("SELECT ID FROM Themes WHERE Name = ?", [themeName], function(err, result) {
            if (err) throw err;

            const themeID = result[0].ID;
            con.query("INSERT INTO ImageSets (UserID, ThemeID,URLUsage) VALUES (?, ?, ?)", [userID, themeID,setName], async function(err, result) {
              if (err) throw err;
              console.log("ImageSet inserted");

              try {
                const files = await fs.readdir(folderPath);

                files.sort(function(a, b) {
                  const numA = parseInt(a.split('chat neutre ')[1]);
                  const numB = parseInt(b.split('chat neutre ')[1]);
                  return numA - numB;
                });

                for (let i = 0; i < files.length; i++) {
                  const file = files[i];
                  const filePath = path.join(folderPath, file);
                  const data = await fs.readFile(filePath, 'utf8');
                  await new Promise((resolve, reject) => {
                    con.query("INSERT INTO Images (ImageSetID, FilePath, Question) SELECT ImageSets.ID, ?, NULL FROM ImageSets WHERE ImageSets.URLUsage = ?", [path.basename(filePath), setName], function(err, result) {
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
