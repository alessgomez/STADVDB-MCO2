app.post('/update/:id', async(req, res) => {
   var transacNo;
   var oldTitle;
   var slaveInd;
   logDb[0].query("SELECT MAX(transaction_no) AS max FROM log")
   .then(result => {
      if (result[0].max == null)
         transacNo = 0
      else 
         transacNo = result[0].max + 1
   })
   .then(result => {
      return db[0].query(`SELECT title FROM movies WHERE id = ${req.params.id}`)
   })
   .then(result => {
      oldTitle = result[0].title
      logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START TRANSACTION 1')`)
      db[0].destroy();
   })
   .then(async result => {
      console.log("333")
      //db[0].beginTransaction()
      try {
         await db[0].beginTransaction()

         
      } catch(error) {
        await logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT 1')`)
      }
   })
   .then(result => {
      console.log("444")
      const query = `UPDATE movies SET title = '${req.body.title}' WHERE id = ${req.params.id}`;
      return query
   })
   .then(query => {
      console.log("555")
      console.log(query)
      return query
   })
   .then(query => {
      db[0].query(query)
   })
   .then(result => {
      logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'COMMIT 1')`)
   })
   .then(result => {
      db[0].commit()
      .then(result => { //propagate update
         if (req.body.year < 1980)
            slaveInd = 1;
         else 
            slaveInd = 2;
         return slaveInd
      })
      .then(slaveInd => {
         logDb[slaveInd].query("SELECT MAX(transaction_no) FROM log")
      })
      .then(result => {
         if (result == null)
            transacNo = 0
         else 
            transacNo = result + 1
      })
      .then(result => {
         logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START TRANSACTION 2')`)
      })
      .then(result => {
         db[slaveInd].beginTransaction()
      })
      .then(result => {
         const query = `UPDATE movies SET title = '${req.body.title}' WHERE id = ${req.params.id}`;
         logDb[slaveInd].query(`INSERT INTO log(transaction_no, row_no, col_name, old_value, new_value, query) VALUES (${transacNo}, ${req.params.id}, 'title', '${oldTitle}', '${req.body.title}', "${query}")`)
         return query;
      })
      .then(query => {
         db[slaveInd].query(query);
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
      .catch(error => { //slave failed to start transac
         logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT 2')`)  
      })
   })
   
   /*.catch(error => { //node 0 start transac failed
      logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT 1')`)
   })*/
});
