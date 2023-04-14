// FOR NODE 1

const express = require('express');
//const controller = require('../controller/controller.js');
const app = express();
const connection = [];
[connection[0], connection[1], connection[2]] = require("../database")

app.get('/', async(req, res) => {
   connection[1].destroy();
   if (connection[1].state != "disconnected" && connection[2].state != "disconnected")
   {
      connection[1].query("START TRANSACTION", (err, result, fields) => {
         connection[1].query("SELECT * FROM accounts", (err, result1, fields) => {
            connection[1].query("COMMIT", (err, result, fields) => {
               connection[2].query("START TRANSACTION", (err, result, fields) => {
                  connection[2].query("SELECT * FROM accounts", (err, result2, fields) => {
                     connection[2].query("COMMIT", (err, result, fields) => {
                        data = result1.concat(result2)
                        console.log(data)
                     })
                  })
               })
            })
         })
      })
   }

   else 
   {
      connection[0].query("START TRANSACTION", (err, result, fields) => {
         connection[0].query("SELECT * FROM accounts", (err, result1, fields) => {
            connection[0].query("COMMIT", (err, result, fields) => {
               console.log(result1)
            })      
         })      
      })         
   }
}); 

app.get('/search', async(req, res) => {
   connection[0].query("select * from accounts WHERE " + req.query.attribute + " = " + req.query.value, (err, result, fields) => {
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

   connection[0].query("insert into accounts (id, amount) VALUES (?,?)", data, (err, result, fields) => {
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

   connection[0].query(query, data, (err, result, fields) => {
      if (err) {
         return console.log(err);
      }
      return console.log(result);
   })
}); 

app.get('/generateReport', async(req, res) => {
    
}); 

app.get('/disconnect', async(req, res) => {
   connection[0].destroy()
});

module.exports = app;