var mysql = require('mysql');

var connection1 = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "h03_db"
});

var connection2 = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "h03_db"
});

var connection3 = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "h03_db"
});

connection1.connect(function(err) {
  if (err) throw err;
  console.log("Connection 1 Connected!");
});

connection2.connect(function(err) {
  if (err) throw err;
  console.log("Connection 2 Connected!");
});

connection3.connect(function(err) {
  if (err) throw err;
  console.log("Connection 3 Connected!");
});

module.exports = [
  connection1,
  connection2,
  connection3
];
