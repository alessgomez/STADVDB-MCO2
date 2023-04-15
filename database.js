var mysql = require('mysql');
const bluebird = require('bluebird');

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

connection1.query = bluebird.promisify(connection1.query);
connection2.query = bluebird.promisify(connection2.query);
connection3.query = bluebird.promisify(connection3.query);

module.exports = [
  connection1,
  connection2,
  connection3
];
