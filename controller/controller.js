const mysql = require('mysql');
//const nodes = require('../models/model.js')

var node1isOn = true;
var node2isOn = true;
var node3isOn = true;

const controller = {
	getIndex: function (req, res) {
		res.send("hello test");
	}
}

module.exports = controller;