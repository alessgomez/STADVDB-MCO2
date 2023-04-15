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
      const query = "SELECT * FROM movies";
      db[1].query(query)
      .then (async data => {
         await db[1].commit();
         console.log(data);
         try {
            await db[2].beginTransaction();
            const query = "SELECT * FROM movies";
            db[2].query(query)
            .then (async data => {
               await db[2].commit();
               console.log(data);
               res.render("UpdateMovies")
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
   try {
      await db[1].beginTransaction();
      const query = `SELECT * FROM movies WHERE ${req.query.attribute} = ${req.query.value}`
      db[1].query(query)
      .then(async data => {
         console.log(data)
         await db[1].commit();
         res.render("ViewSearch")
      })
   } catch (error) { //node 1 cannot begin transac, search in node 2
      try {
         await db[2].beginTransaction();
         const query = `SELECT * FROM movies WHERE ${req.query.attribute} = ${req.query.value}`
         db[2].query(query)
               .then(async data => {
         console.log(data)
         await db[2].commit();
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
         })
         } catch (error) { //node 0 cannot begin transac, cannot search
            console.log(error)
         }
      }
   }
}); 

app.post('/insert', async(req, res) => {
   try {
      await db[0].beginTransaction();
      const query = `INSERT INTO movies (id, title, year, rating, genre, director, actor) VALUES (${req.body.id}, ${req.body.title}, ${req.body.year}, ${req.body.rating}, ${req.body.genre}, ${req.body.director}, ${req.body.actor})`
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
            const query = `INSERT INTO movies (id, title, year, rating, genre, director, actor) VALUES (${req.body.id}, ${req.body.title}, ${req.body.year}, ${req.body.rating}, ${req.body.genre}, ${req.body.director}, ${req.body.actor})`
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
      if (req.body.year < 1980)
         slaveInd = 1;
      else 
         slaveInd = 2;

      try {
         await db[slaveInd].beginTransaction();
         const query = `INSERT INTO movies (id, title, year, rating, genre, director, actor) VALUES (${req.body.id}, ${req.body.title}, ${req.body.year}, ${req.body.rating}, ${req.body.genre}, ${req.body.director}, ${req.body.actor})`
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
    
}); 

module.exports = app;