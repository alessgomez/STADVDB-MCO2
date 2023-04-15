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

app.get('/search', async(req, res) => {
   try {
      await db[1].beginTransaction();
      const query = `SELECT * FROM accounts WHERE ${req.query.attribute} = ${req.query.value}`
      db[1].query(query)
      .then(async data => {
         console.log(data)
         await db[1].commit();
      })
   } catch (error) { //node 1 cannot begin transac, search in node 2
      try {
         await db[2].beginTransaction();
         const query = `SELECT * FROM accounts WHERE ${req.query.attribute} = ${req.query.value}`
         db[2].query(query)
               .then(async data => {
         console.log(data)
         await db[2].commit();
      })
      } catch (error) { //node 2 cannot begin transac, search in node 0
         console.log(error)
         try {
            await db[0].beginTransaction();
            const query = `SELECT * FROM accounts WHERE ${req.query.attribute} = ${req.query.value}`
            db[0].query(query)
                  .then(async data => {
            console.log(data)
            await db[0].commit();
         })
         } catch (error) { //node 0 cannot begin transac, cannot search
            console.log(error)
         }
      }
   }
}); 

app.get('/insert/:id/:amount', async(req, res) => {
   var data = [
      req.params.id,
      req.params.amount
   ]

   try {
      await db[0].beginTransaction();
      const query = `INSERT INTO ACCOUNTS (id, amount) VALUES (${req.params.id}, ${req.params.amount})`
      db[0].query(query)
      .then(async data => {
         await db[0].commit();
         console.log(data);
         //propagate insert to corresponding secondary Node
         var slaveInd;
         if (req.params.id > 3)
            slaveInd = 1;
         else 
            slaveInd = 2;

         try {
            await db[slaveInd].beginTransaction();
            const query = `INSERT INTO ACCOUNTS2 (id, amount) VALUES (${req.params.id}, ${req.params.amount})`
            db[slaveInd].query(query)
            .then(async data => {
               try {
                  await db[slaveInd].commit();
                  console.log(data);
               } catch (error) { //commit of corresponding slave node FAILED
                  console.log(error);
                  //write to log, recover
               }
            })
         } catch (error) { //corresponding slave node cannot begin transac, write to log, recover
            console.log(error);
            //write to log, recover
         }
      })
   } catch (error) { //Node 0 is down, insert to correspoonding node/write to recovery log 
      var slaveInd;
      if (req.params.year < 1980)
         slaveInd = 1;
      else 
         slaveInd = 2;

      try {
         await db[slaveInd].beginTransaction();
         const query = `INSERT INTO ACCOUNTS (id, amount) VALUES (${data})`
         db[slaveInd].query(query)
         .then(async data => {
            try {
               await db[slaveInd].commit();
               console.log(data);
            } catch (error) { //commit of secondary node FAILED
               console.log(error);
               //write to log, recover
            }
         })
      } catch (error) { //corresponding slave node cannot begin transac, write to log, recover
         console.log(error);
         //write to log, recover
      }
   }
}); 

app.get('/update/:id/:amount', async(req, res) => {

   try {
      await db[0].beginTransaction();
      const query = `UPDATE accounts SET amount = ${req.params.amount} WHERE id = ${req.params.id}`;
      db[0].query(query)
      .then(async data => {
         await db[0].commit();
         console.log(data);

         //propagate insert to corresponding secondary Node
         var slaveInd;
         if (req.params.id > 3)
            slaveInd = 1;
         else 
            slaveInd = 2;

         try {
            await db[slaveInd].beginTransaction();
            const query = `UPDATE accounts SET amount = ${req.params.amount} WHERE id = ${req.params.id}`;
            db[slaveInd].query(query)
            .then(async data => {
               try {
                  await db[slaveInd].commit();
                  console.log(data);
               } catch (error) { //commit of corresponding slave node FAILED
                  console.log(error);
                  //write to log, recover
               }
            })
         } catch (error) { //corresponding slave node cannot begin transac, write to log, recover
            console.log(error);
            //write to log, recover
         }
      })
   } catch (error) { //node 0 cannot begin transaction, update corr slave, write log, recover
      var slaveInd;
      if (req.params.year < 1980)
         slaveInd = 1;
      else 
         slaveInd = 2;

      try {
         await db[slaveInd].beginTransaction();
         const query = `UPDATE accounts SET amount = ${req.params.amount} WHERE id = ${req.params.id}`;
         db[slaveInd].query(query)
         .then(async data => {
            try {
               await db[slaveInd].commit();
               console.log(data);
            } catch (error) { //commit of secondary node FAILED
               console.log(error);
               //write to log, recover
            }
         })
      } catch (error) { //corresponding slave node cannot begin transac, write to log, recover
         console.log(error);
         //write to log, recover
      }
   }
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

<<<<<<< HEAD
=======

app.get('/search', async(req, res) => {

    if (connection[1].state != "disconnected") {
        connection[1].query("START TRANSACTION", (err, result, fields) => {
            connection[1].query("SELECT * FROM oldmovie WHERE " + req.query.attribute + " = " + req.query.value, (err, result1, fields) => {
                connection[1].query("COMMIT", (err, result, fields) => {
                    if (result1.length == 0) {
                        connection[2].query("START TRANSACTION", (err, result, fields) => {
                            connection[2].query("SELECT * FROM newmovie WHERE " + req.query.attribute + " = " + req.query.value, (err, result2, fields) => {
                                connection[0].query("COMMIT", (err, result, fields) => {
                                    console.log(result2)
                                })
                            })
                        })
                    } else
                        console.log(result1)
                })
            })
        })
    } else if (connection[0].state != "disconnected") {
        connection[0].query("START TRANSACTION", (err, result, fields) => {
            connection[0].query("SELECT * FROM movie WHERE " + req.query.attribute + " = " + req.query.value, (err, result1, fields) => {
                connection[0].query("COMMIT", (err, result, fields) => {
                    console.log(result1)
                })
            })
        })
    } else if (connection[2].state != "disconnected") {
        connection[2].query("START TRANSACTION", (err, result, fields) => {
            connection[2].query("SELECT * FROM newmovie WHERE " + req.query.attribute + " = " + req.query.value, (err, result1, fields) => {
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

    connection[0].query("insert into accounts (id, title, year, genre, director, actor, rank) VALUES (?,?,?,?,?,?,?)", data, (err, result, fields) => {
        if (err) {
            return console.log(err);
        }
        return console.log(result);
    })
});

app.post('/updateMovie', async(req, res) => {
    var query = "UPDATE movie " +
        "SET title = ? " +
        "WHERE id = ?";

    var data = [
      req.body.title,
      req.body.year,
      req.body.genre,
      req.body.director,
      req.body.actor,
      req.body.rank
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

>>>>>>> 00a396ccd3d3f59a226b922090c2f4d3540e78e2
module.exports = app;