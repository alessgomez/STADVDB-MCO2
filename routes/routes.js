// FOR NODE 1
const { log } = require('console');
const express = require('express');
const { uptime } = require('process');
//const controller = require('../controller/controller.js');
const app = express();
const db = [];
const logDb = [];
[db[0], db[1], db[2], logDb[0], logDb[1], logDb[2]] = require("../database")

function updateInNewMaster(id, year, oldTitle, newTitle) {
   var transacNo;
   var slaveInd;

   if (year < 1980)
      slaveInd = 1;
   else 
      slaveInd = 2;
   
   logDb[0].query("SELECT MAX(transaction_no) AS max FROM log")
   .then(result => {
      console.log("111")
      if (result[0].max == null)
         transacNo = 0
      else 
         transacNo = result[0].max + 1
   })
   .then(result => {
      logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START TRANSACTION 1')`)
   })
   .then(async result => {
      console.log("444")
      try {
         await db[slaveInd].beginTransaction();
      } catch(error) {
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT 1')`)
         throw error
      }
   })
   .then(result => {
      console.log("555")
      const query = `UPDATE movies SET title = '${newTitle}' WHERE id = ${id}`;
      return query
   })
   .then(query => {
      logDb[slaveInd].query(`INSERT INTO log(transaction_no, row_no, col_name, old_value, new_value, query) VALUES (${transacNo}, ${id}, 'title', '${oldTitle}', '${newTitle}', "${query}")`)
      return query
   })
   .then(async query => {
      try {
         await db[slaveInd].query(query)
      } catch (error) {
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT 12')`)
         throw error
      }
   })
   .then(result => {
      console.log("888")
      logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'COMMIT 1')`)
   })
   .then(result => {
      console.log("999")
      db[slaveInd].commit()
   })
}

function insertInNewMaster(req) {
   var year = req.body.year;
   console.log("INSERT NEW MASTER: " + year);
   if (year < 1980)
      slaveInd = 1;
   else 
      slaveInd = 2;

   logDb[slaveInd].query("SELECT MAX(transaction_no) AS max FROM log")
   .then(result => {
      if (result[0].max == null)
         transacNo = 0
      else 
         transacNo = result[0].max + 1      
   })
   .then(result => {
      logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START TRANSACTION 1')`)
   })
   .then(async result => {
      console.log("444")
      try {
         await db[slaveInd].beginTransaction();
      } catch(error) {
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT 1')`)
         throw error
      }
   })
   .then(result => {
      console.log("555")
      const query = `INSERT INTO movies (id, title, year, rating, genre, director, actor) VALUES (${req.body.id}, '${req.body.title}', ${req.body.year}, ${req.body.rank}, '${req.body.genre}', '${req.body.director}', '${req.body.actor}')`
      return query
   })
   .then(query => {
      logDb[slaveInd].query(`INSERT INTO log(transaction_no, row_no, query) VALUES (${transacNo}, ${req.body.id}, "${query}")`)
      return query
   })
   .then(async query => {
      try {
         await db[slaveInd].query(query)
      } catch (error) {
         console.log(error)
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT 12')`)
         throw error
      }
   })
   .then(result => {
      console.log("888")
      logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'COMMIT 1')`)
   })
   .then(result => {
      console.log("999")
      db[slaveInd].commit()
   })
}

app.get('/', async (req, res) => {
   try { 
      await db[1].beginTransaction();
      const query = "SELECT * FROM movies";
      db[1].query(query)
      .then (async data1 => {
         await db[1].commit();
         try {
            await db[2].beginTransaction();
            const query = "SELECT * FROM movies";
            db[2].query(query)
            .then (async data2 => {
               await db[2].commit();
               var data = await data1.concat(data2)
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
                  res.render("ViewSearch", data)
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
         .then (async data1 => {
            await db[2].commit();
            try {
               await db[0].beginTransaction();
               const query = "SELECT * FROM movies WHERE year < 1980"
               db[0].query(query)
               .then (async data2 => {
                  await db[0].commit();
                  var data = await data1.concat(data2)
                  res.render("ViewSearch", data)
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
               res.render("ViewSearch", data)
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

app.post('/insertMovie', async(req, res) => {
   var year = req.body.year;
   logDb[0].query("SELECT MAX(transaction_no) AS max FROM log")
   .then(result => {
      if (result[0].max == null)
         transacNo = 0
      else 
         transacNo = result[0].max + 1      
   })
   .then(result => {
      logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START TRANSACTION 1')`)
      db[0].destroy();
   })
   .then(async result => {
      console.log("444")
      try {
         await db[0].beginTransaction();
      } catch(error) {
         await logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT 1')`)
         await insertInNewMaster(req);
         throw error
      }
   })
   .then(result => {
      console.log("555")
      const query = `INSERT INTO movies (id, title, year, rating, genre, director, actor) VALUES (${req.body.id}, '${req.body.title}', ${req.body.year}, ${req.body.rank}, '${req.body.genre}', '${req.body.director}', '${req.body.actor}')`
      return query
   })
   .then(query => {
      logDb[0].query(`INSERT INTO log(transaction_no, row_no, query) VALUES (${transacNo}, ${req.body.id}, "${query}")`)
      return query
   })
   .then(async query => {
      try {
         await db[0].query(query)
      } catch (error) {
         console.log(error)
         await logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT 12')`)
         await insertInNewMaster(req);
         throw error
      }
   })
   .then(result => {
      console.log("888")
      logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'COMMIT 1')`)
   })
   .then(result => {
      console.log("999")
      db[0].commit()
      .then(result => { //propagate update
         console.log("year!! + " + year)
         if (year < 1980)
            slaveInd = 1;
         else 
            slaveInd = 2;
         return slaveInd
      })
      .then(slaveInd => {
         console.log("SLAVE INDEX!!!!   " + slaveInd)
         return logDb[slaveInd].query("SELECT MAX(transaction_no) AS max FROM log")
      })
      .then(result => {
         console.log(result[0].max +" !!!!! ")
         if (result[0].max == null)
            transacNo = 0
         else 
            transacNo = result[0].max + 1
      })
      .then(result => {
         logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START TRANSACTION 2')`)
      })
      .then(async result => {
         try {
            await db[slaveInd].beginTransaction();
         } catch(error) {
            await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT 1')`)
            throw error
         }
      })
      .then(result => {
         const query = `INSERT INTO movies (id, title, year, rating, genre, director, actor) VALUES (${req.body.id}, '${req.body.title}', ${req.body.year}, ${req.body.rank}, '${req.body.genre}', '${req.body.director}', '${req.body.actor}')`
         return query;
      })
      .then(query => {
         logDb[slaveInd].query(`INSERT INTO log(transaction_no, row_no, query) VALUES (${transacNo}, ${req.body.id}, "${query}")`)
         return query;
      })
      .then(async query => {
         try {
            await db[slaveInd].query(query)
         } catch(error) {
            await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT 12')`)
            throw error
         }
      })
      .then(result => {
         logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'COMMIT 2')`) 
      })
      .then(result => {
         db[slaveInd].commit();
      })
      .then(result => {
         //todo res.render
      })
   })
}); 

app.post('/update/:id/:year/:title', async(req, res) => {
   var transacNo;
   var oldTitle;
   var slaveInd;
   var year = req.params.year;
   var id = req.params.id;
   var title = req.params.title;
   logDb[0].query("SELECT MAX(transaction_no) AS max FROM log")
   .then(result => {
      console.log("111")
      if (result[0].max == null)
         transacNo = 0
      else 
         transacNo = result[0].max + 1
   })
   .then(result => {
      console.log("222")
      return db[0].query(`SELECT title FROM movies WHERE id = ${req.params.id}`)
   })
   .then(result => {
      console.log("333")
      oldTitle = result[0].title
      logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START TRANSACTION 1')`)
   })
   .then(async result => {
      console.log("444")
      try {
         await db[0].beginTransaction();
      } catch(error) {
         await logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT 1')`)
         await updateInNewMaster(id, year, title, req.body.title);
         throw error
      }
   })
   .then(result => {
      console.log("555")
      const query = `UPDATE movies SET title = '${req.body.title}' WHERE id = ${req.params.id}`;
      return query
   })
   .then(query => {
      logDb[0].query(`INSERT INTO log(transaction_no, row_no, col_name, old_value, new_value, query) VALUES (${transacNo}, ${req.params.id}, 'title', '${oldTitle}', '${req.body.title}', "${query}")`)
      return query
   })
   .then(async query => {
      try {
         await db[0].query(query)
      } catch (error) {
         await logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT 12')`)
         await updateInNewMaster(id, year, title, req.body.title);
         throw error
      }
   })
   .then(result => {
      console.log("888")
      logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'COMMIT 1')`)
   })
   .then(result => {
      console.log("999")
      db[0].commit()
      .then(result => { //propagate update
         console.log("year!! + " + year)
         if (year < 1980)
            slaveInd = 1;
         else 
            slaveInd = 2;
         return slaveInd
      })
      .then(slaveInd => {
         console.log("SLAVE INDEX!!!!   " + slaveInd)
         return logDb[slaveInd].query("SELECT MAX(transaction_no) AS max FROM log")
      })
      .then(result => {
         console.log(result[0].max +" !!!!! ")
         if (result[0].max == null)
            transacNo = 0
         else 
            transacNo = result[0].max + 1
      })
      .then(result => {
         logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START TRANSACTION 2')`)
      })
      .then(async result => {
         try {
            await db[slaveInd].beginTransaction();
         } catch(error) {
            await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT 1')`)
            throw error
         }
      })
      .then(result => {
         const query = `UPDATE movies SET title = '${req.body.title}' WHERE id = ${req.params.id}`;
         return query;
      })
      .then(query => {
         logDb[slaveInd].query(`INSERT INTO log(transaction_no, row_no, col_name, old_value, new_value, query) VALUES (${transacNo}, ${req.params.id}, 'title', '${oldTitle}', '${req.body.title}', "${query}")`)
         return query;
      })
      .then(async query => {
         try {
            await db[slaveInd].query(query)
         } catch(error) {
            await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT 12')`)
            throw error
         }
      })
      .then(result => {
         logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'COMMIT 2')`) 
      })
      .then(result => {
         db[slaveInd].commit();
      })
      .then(result => {
         //todo res.render
      })
   })
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
      console.log(error)
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
               console.log(error)
            }
         })
      } catch (error) { //Node 1 cannot begin transac, load node 2 only
         console.log(error)
         try {
            db[2].beginTransaction();
            const query = `SELECT YEAR, ${req.query.agg}(${req.query.param}) AS ${req.query.agg} FROM movies GROUP BY YEAR`
            db[2].query(query)
            .then(async data => {
               await db[2].commit();
               //res.render
            })
         } catch (error) { //node 2 cannot begin transac
            console.log(error)
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

app.get('/updateMovies/:id/:year/:title', async(req, res) => {
   const data = {
      id: req.params.id,
      year: req.params.year,
      title: req.params.title
   }
   res.render("UpdateMovies", data)
}); 

module.exports = app;