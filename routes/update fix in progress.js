   logDb[0].query("SELECT MAX(transaction_no) FROM log")
   .then(result => {
      var transacNo;
      if (result == null)
         transacNo = 0
      else 
         transacNo = result + 1
         return result;
   })
   .then(result => {
      logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START TRANSACTION')`)
   })
   .then(async result => {
      try {
         await db[0].beginTransaction();
      }
      catch (error) {
         //slave ind main catch
      }
   })
   .then(result => {
      
   })