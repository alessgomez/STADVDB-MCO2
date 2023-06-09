// FOR NODE 1
const { log } = require('console');
const express = require('express');
const { uptime } = require('process');
//const controller = require('../controller/controller.js');
const app = express();
const db = [];
const logDb = [];
[db[0], db[1], db[2], logDb[0], logDb[1], logDb[2]] = require("../database")

async function recover(){
   undo = []   
   redo = []
   maxTNo = 0
   logs = []

   try {
      // get max transaction number
      console.log("before get max transaction no")
      const query = "SELECT MAX(transaction_no) AS maxTNo FROM log"
      await logDb[1].query(query)
      .then (data1 => {
         console.log("max transaction no")
         console.log(data1)
         console.log(data1[0].maxTNo)
         maxTNo = data1[0].maxTNo
      })
      .then (result => {
         console.log("hey there")
         // loop for each transaction no (Ti)
         console.log(maxTNo)
         console.log("before getting log")
         const query = "SELECT * FROM log"
         return logDb[1].query(query)
      })
      .then (data2 => {
         logs = data2
         for (let j = 0; j <= maxTNo; j++)
         { 
            currTransactionNo = j
            console.log("log for transaction no " + currTransactionNo + ": ")
            var currLogs = []
            var k = 0
            console.log("data2:")
            console.log(data2)
            // store logs with current transaction No j
            for (let i = 0; i < data2.length; i++)
            {
               if (data2[i].transaction_no == currTransactionNo)
               {
                  currLogs[k] = data2[i]
                  k += 1
               }
            }
            
            // if transaction no. has commit, push to redo
            if (currLogs[currLogs.length-1].query == "COMMIT")
               redo.push(currTransactionNo)
            // else push to undo if last log is not abort
            else if (currLogs[currLogs.length-1].query != "ABORT")
               undo.push(currTransactionNo)
                 
         }
         
       
      })  
      .then (results => { 
         console.log("undo")
         undo = undo.reverse()
         console.log("undo: " + undo)
         console.log("redo: " + redo)
         for (let i = 0; i < undo.length; i++)
         {
            console.log(undo[i])
            
            try {
               // select all logs with current transaction no.
               const query = "SELECT * FROM log WHERE transaction_no = " + undo[i]
               console.log(query)
               //console.log(logs)
               currTransactionNo = undo[i]
               console.log("log for transaction no " + currTransactionNo + ": ")
               var currLogs = []
               var k = 0
               // store logs with current transaction No 
               for (let j = 0; j < logs.length; j++)
               {
                  if (logs[j].transaction_no == currTransactionNo)
                  {
                     currLogs[k] = logs[j]
                     k += 1
                  }
               }
               // curr logs - stores current logs of all transactions
               // starting from the last log up until the log right after start
               for (let k = currLogs.length-1; k > 0; k--)
               {
                  console.log("currLog: " + currLogs[k])
                  try {
                     // restore the old values
                     var query1 = ""
                     if (currLogs[k].old_value != null)
                        query1 = `UPDATE movies SET ${currLogs[k].col_name} = '${currLogs[k].old_value}' WHERE id = ${logs[k].row_no}`;
                     else
                        query1 = `DELETE FROM movies WHERE id = ${currLogs[k].row_no}`
                     // DELETE FROM table_name WHERE condition; 
                     console.log("query: " + query1)
                     db[1].query(query1)
                     console.log("after query")
    
                  } catch (error) { 
                    console.log(error)
                  }
               }
               

               
            } catch (error) { 
               console.log(error)
            }  
         }
      })
      .then (results => { 
         console.log("redo")
         for (let i = 0; i < redo.length; i++)
         {
            try {
               const query = "SELECT * FROM log WHERE transaction_no = " + redo[i]
               console.log(query)
               // get all logs with curerent transaction no
               currTransactionNo = redo[i]
               console.log("log for transaction no " + currTransactionNo + ": ")
               var currLogs = []
               var k = 0
               // store logs with current transaction No 
               for (let j = 0; j < logs.length; j++)
               {
                  if (logs[j].transaction_no == currTransactionNo)
                  {
                     currLogs[k] = logs[j]
                     k += 1
                  }
               }

               console.log("redo currLogs.legnth = " + currLogs.length)
               // starting from log right after start up until the most recent log before the commit
               for (let k = 1; k < currLogs.length-1; k++)
               {
                  console.log("k: " + k);
                  console.log("currLog: " + currLogs[k])
                  try {
                     // restore the old values
                     var query2 = ""
                     if (currLogs[k].new_value != null)
                        query2 = `UPDATE movies SET ${currLogs[k].col_name} = '${currLogs[k].new_value}' WHERE id = ${logs[k].row_no}`;
                     else  
                        query2 = currLogs[k].query
                     console.log("query: " + query2)
                     db[1].query(query2)
                     console.log("after query")
    
                  } catch (error) { 
                    console.log(error)
                  }
               }
          
            } catch (error) { 
               console.log(error)
            }  
         }
      })
   } catch (error) { 
      console.log(error)
   }
 
   // for all transaction numbers in undo
  
   /*
   console.log("undo: ")
   console.log(undo)
   console.log("redo: ")
   console.log(redo)

   // for each transaction number  in redo
  
   */
}


async function reintegrate() {
   try {
      console.log("reintegrate")
      // get all movies from node 1
      const query = "SELECT * FROM movies FOR UPDATE"
      await db[1].query(query)
      .then (async data => {
         //console.log(data)
         try {
            // get all movies from node 0 that are before 1980
            await db[0].query("SELECT * FROM movies WHERE year < 1980")
            .then (async data1 => {

               //console.log(data1)
               console.log("data node1: " + data.length)
               console.log("data node0: " + data1.length)
               // for each movie <1980 in node 0
               //console.log(data)
               for (let i = 0; i < data1.length; i++) // 
               {
                  // if node 1 already has a record corresponding to the current movie from node 0
                  var colId = []
                  
                  for (let j = 0; j < data.length; j++)
                  {
                     colId[j] = data[j].id
                  }
                  //console.log(colId)
                  console.log("i: " + i)
                  if (colId.includes(data1[i].id))
                  {
                     console.log("includes")
                     try{
                           // update node 1 with the values from node 0
                           const query = `UPDATE movies SET title = "${data1[i].title}" WHERE id = ${data1[i].id}`
                           console.log(query)
                           await db[1].query(query)
                           .then (() => {
                              console.log("updated")
                              return new Promise(function(resolve, reject) {
                                 resolve('start of new Promise');
                                 });
                              
                           })
            
                        

                     }
                     catch (error) {
                        
                     }
                     
                  }
                  // else if node 1 does not yet have a record corresponding to the current movie from node 0
                  else
                  {
                     console.log("does not include")
                     try{
                           // insert a new record in node 1
                           const query = `INSERT INTO movies (id, title, year, rating, genre, director, actor) VALUES (${data1[i].id}, "${data1[i].title}", ${data1[i].year}, ${data1[i].rating}, '${data1[i].genre}', '${data1[i].director}', '${data1[i].actor}')`
                           console.log(query)
                           await db[1].query(query)
                           .then (() => {
                           console.log("inserted")
                           return new Promise(function(resolve, reject) {
                              resolve('start of new Promise');
                              });
                           
                        })
                     
                     }
                     catch (error) {
                        
                     }
   

                  }
            
               }



            })
         }  catch (error) { 

         }
      })
   } catch (error) {

   }
 
   
}

function updateInNewMaster(id, year, oldTitle, newTitle) {
   var transacNo;
   var slaveInd;

   if (year < 1980)
      slaveInd = 1;
   else 
      slaveInd = 2;
   
   logDb[slaveInd].query("SELECT MAX(transaction_no) AS max FROM log")
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
      await recover()
      await reintegrate()
      .then (async res => {
         await db[2].beginTransaction();
         const query = "SELECT * FROM movies";
         return db[2].query(query)
      })
      .then (async data1 => {
         await db[2].commit();
         try {
            await db[1].beginTransaction();
            const query = "SELECT * FROM movies";
            db[1].query(query)
            .then (async data2 => {
               await db[1].commit();
               var data = await data1.concat(data2)
               res.render("ViewSearch", data)
            })
         } catch (error) { //Node 1 cannot begin transac, load half from Node 0
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
   } catch (error) { //Node 2 cannot begin transac, load from Node 1 and/or Node 0
      console.log(error)
      try {
         await db[1].beginTransaction();
         const query = "SELECT * FROM movies";
         db[1].query(query)
         .then (async data1 => {
            await db[1].commit();
            try {
               await db[0].beginTransaction();
               const query = "SELECT * FROM movies WHERE year >= 1980"
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
      } catch(error) { //Node 1 cannot begin transac, load all from Node 0
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
      await db[2].beginTransaction();
      const query = `SELECT * FROM movies WHERE ${req.query.attribute} = '${req.query.value}'`
      console.log(query)
      db[2].query(query)
      .then(async data => {
         console.log("search")
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
   } catch (error) { //node 2 cannot begin transac, search in node 1
      try {
         await db[1].beginTransaction();
         const query = `SELECT * FROM movies WHERE ${req.query.attribute} = "${req.query.value}"`
         db[1].query(query)
               .then(async data => {
         console.log(data)
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
      } catch (error) { //node 1 cannot begin transac, search in node 0
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