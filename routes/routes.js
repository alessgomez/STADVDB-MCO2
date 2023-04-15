// FOR NODE 1
const { log } = require('console');
const express = require('express');
const { uptime } = require('process');
//const controller = require('../controller/controller.js');
const app = express();
const db = [];
const log = []
[db[0], db[1], db[2], log[0], log[1], log[2]] = require("../database")

app.get('/', async (req, res) => {
   try { 
      await db[1].beginTransaction();
      const query = "SELECT * FROM movies";
      db[1].query(query)
      .then (async data => {
         await db[1].commit();
         //console.log(data);
         try {
            await db[2].beginTransaction();
            const query = "SELECT * FROM movies";
            db[2].query(query)
            .then (async data => {
               await db[2].commit();
               console.log("this")
               //console.log(data);

               res.render("ViewSearch", data)
            })
         } catch (error) { //Node 2 cannot begin transac, load half from Node 0
            console.log(error)
            try {
               await db[0].beginTransaction();
               const query = "SELECT * FROM movies WHERE year >= 1980"
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
         const query = "SELECT * FROM movies";
         db[2].query(query)
         .then (async data => {
            await db[2].commit();
            console.log(data);
            try {
               await db[0].beginTransaction();
               const query = "SELECT * FROM movies WHERE year < 1980"
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
            const query = "SELECT * FROM movies";
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
   console.log("search")
   console.log(req.query.attribute)
   try {
      await db[1].beginTransaction();
      const query = `SELECT * FROM movies WHERE ${req.query.attribute} = '${req.query.value}'`
      console.log(query)
      db[1].query(query)
      .then(async data => {
         //console.log(data)
         console.log("search")
         await db[1].commit();
         res.render('partials\\rows', data, function(err, html) {
            if (err)
            {
                throw err;
            } 
            console.log("HTML: " + html);
            res.send(html);
        });
      })
   } catch (error) { //node 1 cannot begin transac, search in node 2
      try {
         await db[2].beginTransaction();
         const query = `SELECT * FROM movies WHERE ${req.query.attribute} = "${req.query.value}"`
         db[2].query(query)
               .then(async data => {
         console.log(data)
         await db[2].commit();
         res.render('partials\\rows', data, function(err, html) {
            if (err)
            {
                throw err;
            } 
            console.log("HTML: " + html);
            res.send(html);
        });
      })
      } catch (error) { //node 2 cannot begin transac, search in node 0
         console.log(error)
         try {
            await db[0].beginTransaction();
            const query = `SELECT * FROM movies WHERE ${req.query.attribute} = ${req.query.value}`
            db[0].query(query)
                  .then(async data => {
            console.log(data)
            await db[0].commit();
            res.render('partials\\rows', data, function(err, html) {
               if (err)
               {
                   throw err;
               } 
               console.log("HTML: " + html);
               res.send(html);
           });
         })
         } catch (error) { //node 0 cannot begin transac, cannot search
            console.log(error)
         }
      }
   }
}); 

app.post('/insert', async(req, res) => {
   try {
      log[0].query("SELECT MAX(transaction_no) FROM log", (err, result, fields) => {
         var transacNo;
         if (result == null)
            transacNo = 0
         else 
            transacNo = result + 1
      })
      await log[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, START TRANSACTION)`)
      await db[0].beginTransaction();

      const query = `INSERT INTO movies (id, title, year, rating, genre, director, actor) VALUES (${req.body.id}, ${req.body.title}, ${req.body.year}, ${req.body.rating}, ${req.body.genre}, ${req.body.director}, ${req.body.actor})`
      logQuery = `INSERT INTO movies (id, title, year, rating, genre, director, actor) VALUES (${req.body.id}, ${req.body.title}, ${req.body.year}, ${req.body.rating}, ${req.body.genre}, ${req.body.director}, ${req.body.actor})`
      await log[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, ${logQuery})`)
      db[0].query(query)
      .then(async data => {
         await log[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, COMMIT)`)   
         await db[0].commit();
         //propagate insert to corresponding secondary Node
         var slaveInd;
         if (req.body.year < 1980)
            slaveInd = 1;
         else 
            slaveInd = 2;

         try {
            log[slaveInd].query("SELECT MAX(transaction_no) FROM log", (err, result, fields) => {
               var transacNo;
               if (result == null)
                  transacNo = 0
               else 
                  transacNo = result
            })
            await log[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, START)`)
            await db[slaveInd].beginTransaction();
            
            const query = `INSERT INTO movies (id, title, year, rating, genre, director, actor) VALUES (${req.body.id}, ${req.body.title}, ${req.body.year}, ${req.body.rating}, ${req.body.genre}, ${req.body.director}, ${req.body.actor})`
            logQuery = `INSERT INTO movies (id, title, year, rating, genre, director, actor) VALUES (${req.body.id}, ${req.body.title}, ${req.body.year}, ${req.body.rating}, ${req.body.genre}, ${req.body.director}, ${req.body.actor})`
            await log[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, ${logQuery})`)
            db[slaveInd].query(query)
            .then(async data => {
               try {
                  await log[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, COMMIT)`)  
                  await db[slaveInd].commit();
                  //todo res.render
               } catch (error) { //commit of corresponding slave node FAILED
                  await log[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, ABORT)`)  
               }
            })
         } catch (error) { //corresponding slave node cannot begin transac, write to log, recover
            await log[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, ABORT)`)  
         }
      })
      .catch(async error => {
         await log[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, ABORT)`)   
      })
   } catch (error) { //Node 0 is down, insert to corresponding node/write to recovery log 
      await log[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, ABORT)`)  

      var slaveInd;
      if (req.body.year < 1980)
         slaveInd = 1;
      else 
         slaveInd = 2;

      try {
         log[slaveInd].query("SELECT MAX(transaction_no) FROM log", (err, result, fields) => {
            var transacNo;
            if (result == null)
               transacNo = 0
            else 
               transacNo = result
         })
         await log[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, START)`)
         await db[slaveInd].beginTransaction();
         const query = `INSERT INTO movies (id, title, year, rating, genre, director, actor) VALUES (${req.body.id}, ${req.body.title}, ${req.body.year}, ${req.body.rating}, ${req.body.genre}, ${req.body.director}, ${req.body.actor})`
         logQuery = `INSERT INTO movies (id, title, year, rating, genre, director, actor) VALUES (${req.body.id}, ${req.body.title}, ${req.body.year}, ${req.body.rating}, ${req.body.genre}, ${req.body.director}, ${req.body.actor})`
         await log[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, ${logQuery})`)

         db[slaveInd].query(query)
         .then(async data => {
            try {
               await log[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, COMMIT)`) 
               await db[slaveInd].commit();
               //TODO RES.RENDER
            } catch (error) { //commit of secondary node FAILED
               await log[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, ABORT)`)  
            }
         })
      } catch (error) { //corresponding slave node cannot begin transac, write to log, recover
         console.log(error);
         await log[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, ABORT)`)  
      }
   }
}); 

app.post('/update/:id', async(req, res) => {
   try {
      await db[0].beginTransaction();
      const query = `UPDATE movies SET title = ${req.body.title}, year = ${req.body.year}, rating = ${req.body.rating}, genre = ${req.body.genre}, director = ${req.body.director}, actor WHERE id = ${req.params.id}`;
      db[0].query(query)
      .then(async data => {
         await db[0].commit();
         console.log(data);

         //propagate insert to corresponding secondary Node
         var slaveInd;
         if (req.body.year < 1980)
            slaveInd = 1;
         else 
            slaveInd = 2;

         try {
            await db[slaveInd].beginTransaction();
            const query = `UPDATE movies SET title = ${req.body.title}, year = ${req.body.year}, rating = ${req.body.rating}, genre = ${req.body.genre}, director = ${req.body.director}, actor WHERE id = ${req.params.id}`;
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
      if (req.body.year < 1980)
         slaveInd = 1;
      else 
         slaveInd = 2;

      try {
         await db[slaveInd].beginTransaction();
         const query = `UPDATE movies SET title = ${req.body.title}, year = ${req.body.year}, rating = ${req.body.rating}, genre = ${req.body.genre}, director = ${req.body.director}, actor WHERE id = ${req.params.id}`;
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
   try {
      db[0].beginTransaction();
      const query = `SELECT YEAR, ${req.query.agg}(${req.query.param}) AS VAL FROM movies GROUP BY YEAR`
      db[0].query(query)
      .then(async data => {
         await db[0].commit();
         //res.render
         var isCount = false;
         var isAverage = false;
         if (req.query.agg == "COUNT")
            isCount = true
         else
            isAverage = true
         const results = {
            data: data,
            agg: req.query.agg,
            isCount: isCount,
            isAverage: isAverage
         }
         console.log(data)
         console.log("iscount: "  +isCount)
         console.log("isAverage: " + isAverage)
         res.render('partials\\reportRows', results, function(err, html) {
            if (err)
            {
                throw err;
            } 
            //console.log("HTML: " + html);
            res.send(html);
        });
      })
   } catch(error) { //Node
      try {
         db[1].beginTransaction();
         const query = `SELECT YEAR, ${req.query.agg}(${req.query.param}) AS ${req.query.agg} FROM movies GROUP BY YEAR`
         db[1].query(query)
         .then(async data1 => {
            await db[1].commit();
            try {
               db[2].beginTransaction();
               const query = `SELECT YEAR, ${req.query.agg}(${req.query.param}) AS ${req.query.agg} FROM movies GROUP BY YEAR`
               db[2].query(query)
               .then(async data2 => {
                  await db[2].commit();
                  data = data1.concat(data2)
                  //res.render
               })
               
            } catch (error) { //node 2 cannot begin transac
               
            }
         })
      } catch (error) { //Node 1 cannot begin transac, load node 2 only
         try {
            db[2].beginTransaction();
            const query = `SELECT YEAR, ${req.query.agg}(${req.query.param}) AS ${req.query.agg} FROM movies GROUP BY YEAR`
            db[2].query(query)
            .then(async data => {
               await db[2].commit();
               //res.render
            })
         } catch (error) { //node 2 cannot begin transac
            
         }  
      }

   }
   /*
   SELECT YEAR, ${req.query.agg}(${req.query.param}) AS ${req.query.agg} FROM movies GROUP BY YEAR
   */ 




   /*
   const attributeName = req.query.attributeName
   const agg = req.query.agg
   console.log(attributeName)
   console.log(agg)
   */
}); 


app.get('/addMovies', async(req, res) => {
   res.render("AddMovies")
}); 

app.get('/reports', async(req, res) => {
 
   const data = {
      isDirector: false,
      isActor: false,
      isGenre: false,
      isCount: false,
      isAverage: false,
      attributeName: "",
      agg: "",
      results: []
   }
   res.render("Reports", data)
}); 

app.get('/updateMovies/:id', async(req, res) => {
   const data = {
      id: req.params.id
   }
   res.render("UpdateMovies", data)
}); 

module.exports = app;