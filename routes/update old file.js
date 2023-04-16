app.post('/update/:id', async(req, res) => {
    try {
       await logDb[0].query("SELECT MAX(transaction_no) FROM log", (err, result, fields) => {
          var transacNo;
          if (result == null)
             transacNo = 0
          else 
             transacNo = result + 1
       })
       await logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START TRANSACTION')`)
       await db[0].beginTransaction();
 
       const query = `SELECT title FROM movie WHERE id = ${req.params.id}` 
       db[0].query(query)
       .then( async data => {
          const query = `UPDATE movies SET title = '${req.body.title}' WHERE id = ${req.params.id}`;
          await logDb[0].query(`INSERT INTO log(transaction_no, row_no, col_name, old_value, new_value, query) VALUES (${transacNo}, ${req.params.id}, 'title', '${data.title}', '${req.body.title}', '${query}')`)
          db[0].query(query)
          .then(async data => {
             try {
                await logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'COMMIT')`)
                await db[0].commit();
 
                //propagate insert to corresponding secondary Node
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
                   await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START')`)      
                   await db[slaveInd].beginTransaction();
 
                   const query = `UPDATE movies SET title = '${req.body.title}' WHERE id = ${req.params.id}`;
                   await logDb[slaveInd].query(`INSERT INTO log(transaction_no, row_no, col_name, old_value, new_value, query) VALUES (${transacNo}, ${req.params.id}, 'title', '${data.title}', '${req.body.title}', '${query}')`)
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
                } catch (error) { //corresponding slave node cannot begin transac, write to log, recover
                   await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)  
                   console.log(error)
                }
                }
                catch (error) {
                   await logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)  
                console.log(error)
                }
             })
             .catch(async error => {
                await logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)  
             })
       })
    } catch (error) {//node 0 cannot begin transaction, update corr slave, write log, recover
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
           await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START')`)
           await db[slaveInd].beginTransaction();
 
           const query = `SELECT title FROM movie WHERE id = ${req.params.id}` 
           db[slaveInd].query(query)
           .then (async data => {
             const query = `UPDATE movies SET title = '${req.body.title}' WHERE id = ${req.params.id}`;
             await logDb[slaveInd].query(`INSERT INTO log(transaction_no, row_no, col_name, old_value, new_value, query) VALUES (${transacNo}, ${req.params.id}, 'title', '${data.title}', '${req.body.title}', '${query}')`)
             db[slaveInd].query(query)
             .then(async data => {
             try {
                 await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'COMMIT')`) 
                 await db[slaveInd].commit();
                 //todo res.render
             } catch (error) { //commit of secondary node FAILED
                 await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)  
             }
             })
             .catch(async error => {
             await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)  
             })
           })
       } catch (error) { //corresponding slave node cannot begin transac, write to log, recover
           await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)  
       }
    }
 });
 