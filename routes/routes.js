// FOR NODE 1

const express = require('express');
//const controller = require('../controller/controller.js');
const app = express();
const connection = [];
[connection[0], connection[1], connection[2]] = require("../database")

app.get('/', async(req, res) => {
   //res.render("ViewSearch");
   
   connection[1].destroy();
   if (connection[1].state != "disconnected" && connection[2].state != "disconnected")
   {
      connection[1].query("START TRANSACTION", (err, result, fields) => {
         connection[1].query("SELECT * FROM movies", (err, result1, fields) => {
            connection[1].query("COMMIT", (err, result, fields) => {
               connection[2].query("START TRANSACTION", (err, result, fields) => {
                  connection[2].query("SELECT * FROM movies", (err, result2, fields) => {
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

   else if (connection[1].state != "disconnected" && connection[2].state == "disconnected")
   {
      connection[1].query("START TRANSACTION", (err, result, fields) => {
         connection[1].query("SELECT * FROM accounts", (err, result1, fields) => {
            connection[1].query("COMMIT", (err, result, fields) => {
               connection[0].query("START TRANSACTION", (err, result, fields) => {
                  connection[0].query("SELECT * FROM movies WHERE year < 1980", (err, result2, fields) => {
                     connection[0].query("COMMIT", (err, result, fields) => {
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

app.get('/addMovies', async(req, res) => {
   res.render("AddMovies")
}); 

app.get('/reports', async(req, res) => {
   res.render("Reports")
}); 

app.get('/updateMovies', async(req, res) => {
   res.render("UpdateMovies")
}); 


app.get('/search', async(req, res) => {

   if (connection[1].state != "disconnected")
   {
      connection[1].query("START TRANSACTION", (err, result, fields) => {
         connection[1].query("SELECT * FROM accounts WHERE " +  req.query.attribute + " = " + req.query.value, (err, result1, fields) => {
            connection[1].query("COMMIT", (err, result, fields) => {
               if (result1.length == 0)
               {
                  connection[2].query("START TRANSACTION", (err, result, fields) => {
                     connection[2].query("SELECT * FROM accounts WHERE " +  req.query.attribute + " = " + req.query.value, (err, result2, fields) => {
                        connection[0].query("COMMIT", (err, result, fields) => {
                           console.log(result2)
                        })      
                     })    
                  })    
               }
               else 
                  console.log(result1)
            })
         })
      })
   }

   else if (connection[0].state != "disconnected") 
   {
      connection[0].query("START TRANSACTION", (err, result, fields) => {
         connection[0].query("SELECT * FROM accounts WHERE " +  req.query.attribute + " = " + req.query.value, (err, result1, fields) => {
            connection[0].query("COMMIT", (err, result, fields) => {
               console.log(result1)
            })      
         })    
      }) 
   }

   else if (connection[2].state != "disconnected") 
   {
      connection[2].query("START TRANSACTION", (err, result, fields) => {
         connection[2].query("SELECT * FROM accounts WHERE " +  req.query.attribute + " = " + req.query.value, (err, result1, fields) => {
            connection[2].query("COMMIT", (err, result, fields) => {
               console.log(result1)
            })      
         })    
      }) 
   }
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