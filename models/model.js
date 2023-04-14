const mysql = require('mysql');

const node1 = mysql.createConnection({
    host: "ccscloud2.dlsu.edu.ph:38021",
    user: "admin",
    password: "password",
    database: "imdb"
});

const con2 = mysql.createConnection({
	host: "ccscloud2.dlsu.edu.ph:38022",
	user: "admin",
	password: "advdb123",
	database: "imdb"
});

const con3 = mysql.createConnection({
	host: "ccscloud2.dlsu.edu.ph:38023",
	user: "admin",
	password: "advdb123",
	database: "imdb"
});

node1.connect(function(err) {
    if (err) throw err;

    node1.query("SELECT * FROM movies", function (err, result, fields) {
        if (err) throw err;
        console.log(result);
    });
});