// FOR NODE 1

const { log } = require('console');
const express = require('express');
const { uptime } = require('process');
//const controller = require('../controller/controller.js');
const app = express();
const db = [];
[db[0], db[1], db[2]] = require("../database")

app.get('/', async (req, res) => {
   try { 
      await db[1].beginTransaction();
      const query = "SELECT * FROM accounts";
      db[1].query(query)
      .then (async data => {
         await db[1].commit();
         console.log(data);

         try {
            await db[2].beginTransaction();
            const query = "SELECT * FROM accounts";
            db[2].query(query)
            .then (async data => {
               await db[2].commit();
               console.log(data);
            })
         } catch (error) { //Node 2 cannot begin transac, load half from Node 0
            console.log(error)
            try {
               await db[0].beginTransaction();
               const query = "SELECT * FROM accounts WHERE id > 3"
               db[0].query(query)
               .then (async data => {
                  await db[0].commit();
                  console.log(data);
               })
            } catch (error) { //Node 0 cannot begin transac, cannot load half of the data 
               console.log(error)
            }
         }
      })
   } catch (error) { //Node 1 cannot begin transac, load from Node 2 and/or Node 0
      console.log(error)
      try {
         await db[2].beginTransaction();
         const query = "SELECT * FROM accounts";
         db[2].query(query)
         .then (async data => {
            await db[2].commit();
            console.log(data);
            try {
               await db[0].beginTransaction();
               const query = "SELECT * FROM accounts WHERE id > 3"
               db[0].query(query)
               .then (async data => {
                  await db[0].commit();
                  console.log(data);
               })
            } catch (error) { //Node 0 cannot begin transac, cannot load half of the data 
               console.log(error)
            }
         })
      } catch(error) { //Node 2 cannot begin transac, load all from Node 0
         console.log(error)
         try {
            await db[0].beginTransaction();
            const query = "SELECT * FROM accounts";
            db[0].query(query)
            .then (async data => {
               await db[0].commit();
               console.log(data);
            })
         } catch (error) { //Node 0 cannot begin transac, cannot load any data
            console.log(error)
         }
      }
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

app.post('/insertMovie', async(req, res) => {
    var data = [
        req.body.id,
        req.body.title,
        req.body.year,
        req.body.genre,
        req.body.director,
        req.body.actor,
        req.body.rank
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


app.get('/addMovies', async(req, res) => {
   res.render("AddMovies")
}); 

app.get('/reports', async(req, res) => {
   res.render("Reports")
}); 

app.get('/updateMovies', async(req, res) => {
   res.render("UpdateMovies")
}); 

module.exports = app;