var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "h03_db"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

module.exports = con;
