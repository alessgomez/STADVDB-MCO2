var transacNo;
logDb[0].query("SELECT MAX(transaction_no) AS max FROM log")
.then(result => {
   transacNo;
   if (result.max == null)
      transacNo = 0
   else 
      transacNo = result + 1 
})
.then(result => {
   logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START TRANSACTION')`)
})
.then(async result => {
   try {
      await db[0].beginTransaction();
      const query = `SELECT title FROM movies WHERE id = ${req.params.id}` 
      db[0].query(query)
      .then(async data => {
         const query = `UPDATE movies SET title = '${req.body.title}' WHERE id = ${req.params.id}`;
         console.log(query)
         return data
      })
         .then(data => {
            console.log("before insert into log")
         logDb[0].query(`INSERT INTO log(transaction_no, row_no, col_name, old_value, new_value, query) VALUES (${transacNo}, ${req.params.id}, 'title', '${data[0].title}', '${req.body.title}', '${query}')`)
         .then(result => {
            db[0].query(query)
            .then(data => {
               logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'COMMIT')`)
               .then(async result => {
                  try {
                     await db[0].commit();
      
                     //propagate insert to corresponding secondary Node
                     var slaveInd;
                     if (req.body.year < 1980)
                        slaveInd = 1;
                     else 
                        slaveInd = 2;
      
                     logDb[slaveInd].query("SELECT MAX(transaction_no) FROM log")
                     .then (result => {
                        var transacNo;
                        if (result == null)
                           transacNo = 0
                        else 
                           transacNo = result + 1
                     })
                     .then(result => {
                        logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START')`)   
                     })
                     .then(async result => {
                        try {   
                           await db[slaveInd].beginTransaction();
         
                           const query = `UPDATE movies SET title = '${req.body.title}' WHERE id = ${req.params.id}`;
                           logDb[slaveInd].query(`INSERT INTO log(transaction_no, row_no, col_name, old_value, new_value, query) VALUES (${transacNo}, ${req.params.id}, 'title', '${data[0].title}', '${req.body.title}', ${query})`)
                           .then(result => {
                              db[slaveInd].query(query)
                              .then(async data => {
                                    try {
                                       await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'COMMIT')`) 
                                       await db[slaveInd].commit();
                                       //todo res.render
                                    } catch (error) { //commit of corresponding slave node FAILED
                                       await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)  
                                    }
                              })
                              .catch(async error => {
                                    await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)  
                              })
                           })
                        } catch (error) { //corresponding slave node cannot begin transac, write to log, recover
                           await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)  
                           console.log(error)
                        }                           
                     })
                     }
                     catch (error) {
                        await logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)  
                        console.log(error)
                     }
               })
               })
               .catch(async error => {
                  await logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)  
               })  
                         
         })
      })
   } catch(error) {
      var slaveInd;
      if (req.body.year < 1980)
         slaveInd = 1;
      else 
         slaveInd = 2;
      
      try {
         await logDb[slaveInd].query("SELECT MAX(transaction_no) FROM log", (err, result, fields) => {
         var transacNo;
         if (result == null)
            transacNo = 0
         else 
            transacNo = result + 1
         })
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, START)`)
         await db[slaveInd].beginTransaction();

         const query = `SELECT title FROM movie WHERE id = ${req.params.id}` 
         db[slaveInd].query(query)
         .then (async data => {
            const query = `UPDATE movies SET title = '${req.body.title}' WHERE id = ${req.params.id}`;
            await logDb[slaveInd].query(`INSERT INTO log(transaction_no, row_no, col_name, old_value, new_value, query) VALUES (${transacNo}, ${req.params.id}, "title", ${data[0].title}, ${req.body.title}, ${query})`)
            db[slaveInd].query(query)
            .then(async data => {
            try {
               await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, COMMIT)`) 
               await db[slaveInd].commit();
               //todo res.render
            } catch (error) { //commit of secondary node FAILED
               console.log(error)
               await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, ABORT)`)  
            }
            })
            .catch(async error => {
               console.log(error)
               await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, ABORT)`)  
            })
         })
      } catch (error) { //corresponding slave node cannot begin transac, write to log, recover
         console.log(error)
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, ABORT)`)  
      }
   } 
})