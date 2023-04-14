const express = require('express');
//const controller = require('../controller/controller.js');
const app = express();
const connection = require("../database")

app.get('/', async(req, res) => {
   connection.query("select * from accounts", (err, result, fields) => {
        if (err) {
           return console.log(err);
        }
        return console.log(result);
     })
}); 

app.get('/search', async(req, res) => {
   connection.query("select * from accounts WHERE " + req.query.attribute + " = " + req.query.value, (err, result, fields) => {
      if (err) {
         return console.log(err);
      }
      return console.log(result);
   })
}); 

app.get('/insert/:id/:amount', async(req, res) => {
   var data = [
      req.params.id,
      req.params.amount
   ]

   connection.query("insert into accounts (id, amount) VALUES (?,?)", data, (err, result, fields) => {
      if (err) {
         return console.log(err);
      }
      return console.log(result);
   })
}); 

app.get('/update/:id/:amount', async(req, res) => {
   var query = "UPDATE accounts " +
   "SET amount = ? " +
   "WHERE id = ?";

   var data = [
      req.params.amount,
      req.params.id
   ];

   connection.query(query, data, (err, result, fields) => {
      if (err) {
         return console.log(err);
      }
      return console.log(result);
   })
}); 

app.get('/generateReport', async(req, res) => {
    
}); 

module.exports = app;