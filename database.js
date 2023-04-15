var mysql = require('mysql');

var connection1 = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "120301",
  database: "h03"
});

var connection2 = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "120301",
  database: "h03"
});

var connection3 = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "120301",
  database: "h03"
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
