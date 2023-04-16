var mysql = require('mysql');
const bluebird = require('bluebird');

var connection1 = mysql.createConnection({
  host: "127.0.0.1",
  user: "group11",
  password: "group11",
  database: "mco2_imdb"
});

var connection2 = mysql.createConnection({
  host: "127.0.0.1",
  user: "group11",
  password: "group11",
  database: "mco2_imdb"
});

var connection3 = mysql.createConnection({
  host: "127.0.0.1",
  user: "group11",
  password: "group11",
  database: "mco2_imdb"
});

var connection4 = mysql.createConnection({
  host: "127.0.0.1",
  user: "group11",
  password: "group11",
  database: "recovery0"
});

var connection5 = mysql.createConnection({
  host: "127.0.0.1",
  user: "group11",
  password: "group11",
  database: "recovery1"
});

var connection6 = mysql.createConnection({
  host: "127.0.0.1",
  user: "group11",
  password: "group11",
  database: "recovery2"
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

connection4.connect(function(err) {
  if (err) throw err;
  console.log("Connection 4 Connected!");
});

connection5.connect(function(err) {
  if (err) throw err;
  console.log("Connection 5 Connected!");
});

connection6.connect(function(err) {
  if (err) throw err;
  console.log("Connection 6 Connected!");
});


connection1.query = bluebird.promisify(connection1.query);
connection2.query = bluebird.promisify(connection2.query);
connection3.query = bluebird.promisify(connection3.query);
connection4.query = bluebird.promisify(connection3.query);
connection5.query = bluebird.promisify(connection3.query);
connection6.query = bluebird.promisify(connection3.query);

module.exports = [
  connection1,
  connection2,
  connection3,
  connection4,
  connection5,
  connection6
];
