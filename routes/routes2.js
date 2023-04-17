// FOR NODE 1
const { log } = require('console');
const express = require('express');
const { uptime } = require('process');
//const controller = require('../controller/controller.js');
const app = express();
const db = [];
const logDb = [];
var mysql = require('mysql');
const bluebird = require('bluebird');
var ctr0 = 0;
var ctr1 = 0;
var ctr2 = 0;

[db[0], db[1], db[2], logDb[0], logDb[1], logDb[2]] = require("../database")

async function setUpMySQL() {
   var query1 = "SET PERSIST innodb_lock_wait_timeout = 10"
   var query2 = "SET GLOBAL TRANSACTION ISOLATION LEVEL SERIALIZABLE"
   await db[0].query(query1)
   await db[1].query(query1)
   await db[2].query(query1)

   await db[0].query(query2)
   await db[1].query(query2)
   await db[2].query(query2)
}

async function recover0(){
   undo = []   
   redo = []
   maxTNo = 0
   logs = []

   try {
      // get max transaction number
      console.log("before get max transaction no")
      const query = "SELECT MAX(transaction_no) AS maxTNo FROM log"
      await logDb[0].query(query)
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
         return logDb[0].query(query)
      })
      .then (data2 => {
         console.log("all node 0 logs:")
         console.log(data2)
         logs = data2
         for (let j = 0; j <= maxTNo; j++)
         { 
            currTransactionNo = j
            console.log("log for transaction no " + currTransactionNo + ": ")
            var currLogs = []
            var k = 0
            
            // store logs with current transaction No j
            for (let i = 0; i < data2.length; i++)
            {
               if (data2[i].transaction_no == currTransactionNo)
               {
                  currLogs[k] = data2[i]
                  k += 1
               }
            }

            var hasCommit = false
            for (let m = 0; m < currLogs.length; m++)
            {
               if (currLogs[m].query == "COMMIT")
                  hasCommit = true
            }
            
            // if transaction no. has commit, push to redo
            if (hasCommit)
               redo.push(currTransactionNo)
            // else push to undo if last log is not abort
            else 
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
                     db[0].query(query1)
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
                     const query2 = currLogs[k].query
                     console.log("query: " + query2)
                     db[0].query(query2)
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
 
}

async function recover1(){
   undo = []   
   redo = []
   maxTNo = 0
   logs = []

   try {
      // get max transaction number
      const query = "SELECT MAX(transaction_no) AS maxTNo FROM log"
      await logDb[1].query(query)
      .then (data1 => {
         maxTNo = data1[0].maxTNo
      })
      .then (result => {
         // loop for each transaction no (Ti)
         const query = "SELECT * FROM log"
         return logDb[1].query(query)
      })
      .then (data2 => {
         logs = data2
         for (let j = 0; j <= maxTNo; j++)
         { 
            currTransactionNo = j
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

            var hasCommit = false
            for (let m = 0; m < currLogs.length; m++)
            {
               if (currLogs[m].query == "COMMIT")
                  hasCommit = true
            }
            
            // if transaction no. has commit, push to redo
            if (hasCommit)
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
                     const query2 = currLogs[k].query
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

async function recover2() {
   undo = []   
   redo = []
   maxTNo = 0
   logs = []

   try {
      // get max transaction number
      console.log("before get max transaction no")
      const query = "SELECT MAX(transaction_no) AS maxTNo FROM log"
      await logDb[2].query(query)
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
         return logDb[2].query(query)
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
            var hasCommit = false
            for (let m = 0; m < currLogs.length; m++)
            {
               if (currLogs[m].query == "COMMIT")
                  hasCommit = true
            }
            
            // if transaction no. has commit, push to redo
            if (hasCommit)
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
                     db[2].query(query1)
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
                     const query2 = currLogs[k].query
                     console.log("query: " + query2)
                     db[2].query(query2)
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
}

async function clearLog0() {
   try {
      const query = "DELETE FROM log" 
      await logDb[0].query(query)
   }catch (error)
   {
      console.log(error)
   }
   
}

async function clearLog1() {
   try {
      const query = "DELETE FROM log" 
      await logDb[1].query(query)
   }catch (error)
   {
      console.log(error)
   }
}

async function clearLog2() {
   try {
      const query = "DELETE FROM log" 
      await logDb[2].query(query)
   }catch (error)
   {
      console.log(error)
   }
}

async function clearAllLogs() {
   await clearLog0();
   await clearLog1();
   await clearLog2();
}

async function recoverAll() {
   await recover0();
   await recover1();
   await recover2();
}

async function reintegrateAll() {
   await reintegrate0and1();
   await reintegrate0and2();
}

async function reintegrate0and1() {
   try {
      console.log("reintegrate")
      // get all movies from node 1
      const query = "SELECT * FROM movies FOR UPDATE"
      await db[1].query(query)
      .then (async data1 => {
         //console.log(data)
         try {
            // get all movies from node 0 that are before 1980
            await db[0].query("SELECT * FROM movies WHERE year < 1980")
            .then (async data0 => {

               for (let i = 0; i < data0.length; i++) // 
               {
                  
                  var colId1 = []
                  
                  // colId1 = all column ids of node 1
                  for (let j = 0; j < data1.length; j++)
                  {
                     colId1[j] = data1[j].id
                  }
                  // if node 1 already has a record corresponding to the current movie from node 0
                  if (colId1.includes(data0[i].id))
                  {
                     try{
                           // update node 1 with the values from node 0
                           // find in data1 the record that matches with data0[i]
                           console.log("PUMASOK SA TRY 1");
                           var found = false
                           var recordInd = 0
                           while(!found)
                           {
                              if (data1[recordInd].id == data0[i].id)
                                 found = true
                              else
                                 recordInd++
                           }
                           console.log("PUMASOK SA TRY 2");

                           
                           var indNodeToBeUpdated = 1
                           var query = `UPDATE movies SET title = "${data0[i].title}", lastUpdated = "${data0[i].lastUpdated}" WHERE id = ${data0[i].id}`

                           // Split timestamp into [ Y, M, D, h, m, s ]
                           try {
                              if (data1[recordInd].lastUpdated > data0[i].lastUpdated) {
                           
                                 indNodeToBeUpdated = 0
                                 query = `UPDATE movies SET title = "${data1[recordInd].title}", lastUpdated = "${data1[i].lastUpdated}"  WHERE id = ${data1[recordInd].id}`
                              }
                           } catch (error) {
                              console.log("ERROR AFTER TRY 2 data0" + data0[i].lastUpdated)
                              console.log("ERROR AFTER TRY 2 data1" + data1[recordInd].lastUpdated)
                              console.log("ERROR AFTER TRY 2" + error)

                              if (data0[i].lastUpdated == null && data1[recordInd] != null)
                              {
                                 indNodeToBeUpdated = 0
                                 query = `UPDATE movies SET title = "${data1[recordInd].title}", lastUpdated = "${data1[i].lastUpdated}"  WHERE id = ${data1[recordInd].id}`
                              }

                           }

                           console.log("PUMASOK SA TRY 3");
                           // Apply each element to the Date function
                          
                           console.log("PUMASOK SA TRY 4");
                          
                           
                           console.log("PUMASOK SA TRY 5");

                           console.log("REINTEG DEBUG 1(node0): " + data0[i].title)
                           console.log("REINTEG DEBUG 2(node1): " + data1[recordInd].title)

                           console.log("REINTEG DEBUG 1(node0): " + data0[i].lastUpdated)
                           console.log("REINTEG DEBUG 2(node1): " + data1[recordInd].lastUpdated)
                          

                           console.log("REINTEG DEBUG 3: " + indNodeToBeUpdated)
                           console.log("REINTEG 4: " + query)

                           
                           await db[indNodeToBeUpdated].query(query)
                           .then (() => {
                              console.log("updated node " + indNodeToBeUpdated)
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
                           const query = `INSERT INTO movies (id, title, year, rating, genre, director, actor, lastUpdated) VALUES (${data0[i].id}, "${data0[i].title}", ${data0[i].year}, ${data0[i].rating}, '${data0[i].genre}', '${data0[i].director}', '${data0[i].actor}', '${data0[i].lastUpdated}')`
                           
                           await db[1].query(query)
                           .then (() => {
                           console.log("inserted to node 1")
                           return new Promise(function(resolve, reject) {
                              resolve('start of new Promise');
                              });
                           
                        })
                     
                     }
                     catch (error) {
                        
                     }
   

                  }
            
               }

               // insert records from node1 that are not yet in node 0
               for (let i = 0; i < data1.length; i++) 
               {
                    // colId0 = all column ids of node 0
                    var colId0 = []
                    for (let j = 0; j < data0.length; j++)
                    {
                       colId0[j] = data0[j].id
                    }

                    if (!colId0.includes(data1[i].id))
                    {
                        try{
                              // insert a new record in node 0
                              const query = `INSERT INTO movies (id, title, year, rating, genre, director, actor, lastUpdated) VALUES (${data1[i].id}, "${data1[i].title}", ${data1[i].year}, ${data1[i].rating}, '${data1[i].genre}', '${data1[i].director}', '${data1[i].actor}', '${data1[i].lastUpdated}')`
                              
                              await db[0].query(query)
                              .then (() => {
                              console.log("inserted to node 0")
                              return new Promise(function(resolve, reject) {
                                 resolve('start of new Promise');
                                 });
                              
                           })
                        
                        }
                        catch (error) {
                           
                        }
                    }
               }
               console.log("node 0 and  1 reintegrated")



            })
         }  catch (error) { 

         }
      })
   } catch (error) {

   }
}

async function reintegrate0and2() {
   try {
      console.log("reintegrate")
      // get all movies from node 2
      const query = "SELECT * FROM movies FOR UPDATE"
      await db[2].query(query)
      .then (async data2 => {
         //console.log(data)
         try {
            // get all movies from node 0 that are >= 1980
            await db[0].query("SELECT * FROM movies WHERE year >= 1980")
            .then (async data0 => {

               //console.log(data2)
               console.log("data node2: " + data2.length)
               console.log("data node0: " + data0.length)
               // for each movie >= 1980 in node 0
               //console.log(data)
               for (let i = 0; i < data0.length; i++) // 
               {
                  
                  var colId2 = []
                  
                  // colId2 = all column ids of node 2
                  for (let j = 0; j < data2.length; j++)
                  {
                     colId2[j] = data2[j].id
                  }
                
                  // if node 2 already has a record corresponding to the current movie from node 0
                  if (colId2.includes(data0[i].id))
                  {
                     try{
                           // update node 2 with the values from node 0
                           // find in data2 the record that matches with data0[i]
                           
                           var found = false
                           var recordInd = 0
                           while(!found)
                           {
                              if (data2[recordInd].id == data0[i].id)
                                 found = true
                              else
                                 recordInd++
                           }

                           var indNodeToBeUpdated = 2
                           var query = `UPDATE movies SET title = "${data0[i].title}", lastUpdated = "${data0[i].lastUpdated}" WHERE id = ${data0[i].id}`

                           try {
                              if (data2[recordInd].lastUpdated > data0[i].lastUpdated) {
                           
                                 indNodeToBeUpdated = 0
                                 query = `UPDATE movies SET title = "${data2[recordInd].title}", lastUpdated = "${data2[i].lastUpdated}"  WHERE id = ${data2[recordInd].id}`
                              }
                           } catch (error) {
                              console.log("ERROR AFTER TRY 2 data0" + data0[i].lastUpdated)
                              console.log("ERROR AFTER TRY 2 data1" + data2[recordInd].lastUpdated)
                              console.log("ERROR AFTER TRY 2" + error)

                              if (data0[i].lastUpdated == null && data2[recordInd] != null)
                              {
                                 indNodeToBeUpdated = 0
                                 query = `UPDATE movies SET title = "${data2[recordInd].title}", lastUpdated = "${data2[i].lastUpdated}"  WHERE id = ${data2[recordInd].id}`
                              }

                           }
                                                
                          
                       

                           
                           await db[indNodeToBeUpdated].query(query)
                           .then (() => {
                              console.log("updated node " + indNodeToBeUpdated)
                              return new Promise(function(resolve, reject) {
                                 resolve('start of new Promise');
                                 });
                              
                           })
            
                        

                     }
                     catch (error) {
                        
                     }
                     
                  }
                  // else if node 2 does not yet have a record corresponding to the current movie from node 0
                  else
                  {
                     console.log("does not include")
                     try{
                           // insert a new record in node 2
                           const query = `INSERT INTO movies (id, title, year, rating, genre, director, actor, lastUpdated) VALUES (${data0[i].id}, "${data0[i].title}", ${data0[i].year}, ${data0[i].rating}, '${data0[i].genre}', '${data0[i].director}', '${data0[i].actor}', '${data1[i].lastUpdated}')`
                           
                           await db[2].query(query)
                           .then (() => {
                           console.log("inserted to node 2")
                           return new Promise(function(resolve, reject) {
                              resolve('start of new Promise');
                              });
                           
                        })
                     
                     }
                     catch (error) {
                        
                     }
   

                  }
            
               }

               // insert records from node 2 that are not yet in node 0
               for (let i = 0; i < data2.length; i++) 
               {
                    // colId0 = all column ids of node 0
                    var colId0 = []
                    for (let j = 0; j < data0.length; j++)
                    {
                       colId0[j] = data0[j].id
                    }

                    if (!colId0.includes(data2[i].id))
                    {
                        console.log("does not include")
                        try{
                              // insert a new record in node 0
                              const query = `INSERT INTO movies (id, title, year, rating, genre, director, actor, lastUpdated) VALUES (${data2[i].id}, "${data2[i].title}", ${data2[i].year}, ${data2[i].rating}, '${data2[i].genre}', '${data2[i].director}', '${data2[i].actor}','${data1[i].lastUpdated}')`
                              
                              await db[0].query(query)
                              .then (() => {
                              console.log("inserted to node 0")
                              return new Promise(function(resolve, reject) {
                                 resolve('start of new Promise');
                                 });
                              
                           })
                        
                        }
                        catch (error) {
                           
                        }
                    }
               }
               console.log("node 0 and  2 reintegrated")



            })
         }  catch (error) { 

         }
      })
   } catch (error) {

   }
}

function updateInNewMaster(id, year, oldTitle, newTitle, lastUpdated) {
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
      logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START')`)
   })
   .then(async result => {
      console.log("444")
      try {
         await db[slaveInd].beginTransaction();
      } catch(error) {
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         throw error
      }
   })
   .then(result => {
      console.log("555")
      const query = `UPDATE movies SET title = '${newTitle}', lastUpdated = '${lastUpdated}' WHERE id = ${id}`;
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
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         throw error
      }
   })
   .then(result => {
      console.log("888")
      logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'COMMIT')`)
   })
   .then(async result => {
      console.log("999")
      try {
         await db[slaveInd].commit()
      } catch(error) {
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         throw error
      }
      
   })
}

function insertInNewMaster(req, lastUpdated) {
   var year = req.body.year;
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
      logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START')`)
   })
   .then(async result => {
      console.log("444")
      try {
         await db[slaveInd].beginTransaction();
      } catch(error) {
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         throw error
      }
   })
   .then(result => {
      console.log("555")
      const query = `INSERT INTO movies (id, title, year, rating, genre, director, actor, lastUpdated) VALUES (${req.body.id}, '${req.body.title}', ${req.body.year}, ${req.body.rank}, '${req.body.genre}', '${req.body.director}', '${req.body.actor}', '${lastUpdated}')`
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
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         throw error
      }
   })
   .then(result => {
      console.log("888")
      logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'COMMIT')`)
   })
   .then(async result => {
      console.log("999")
      try {
         await db[slaveInd].commit()
      } catch(error) {
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         throw error
      }
   })
}
function updateInNewMaster(id, year, oldTitle, newTitle, lastUpdated) {
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
      logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START')`)
   })
   .then(async result => {
      console.log("444")
      try {
         await db[slaveInd].beginTransaction();
      } catch(error) {
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         throw error
      }
   })
   .then(result => {
      console.log("555")
      const query = `UPDATE movies SET title = '${newTitle}', lastUpdated = '${lastUpdated}' WHERE id = ${id}`;
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
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         throw error
      }
   })
   .then(result => {
      console.log("888")
      logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'COMMIT')`)
   })
   .then(async result => {
      console.log("999")
      try {
         await db[slaveInd].commit()
      } catch(error) {
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         throw error
      }
      
   })
}

function insertInNewMaster(req, lastUpdated) {
   var year = req.body.year;
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
      logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START')`)
   })
   .then(async result => {
      console.log("444")
      try {
         await db[slaveInd].beginTransaction();
      } catch(error) {
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         throw error
      }
   })
   .then(result => {
      console.log("555")
      const query = `INSERT INTO movies (id, title, year, rating, genre, director, actor, lastUpdated) VALUES (${req.body.id}, '${req.body.title}', ${req.body.year}, ${req.body.rank}, '${req.body.genre}', '${req.body.director}', '${req.body.actor}', '${lastUpdated}')`
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
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         throw error
      }
   })
   .then(result => {
      console.log("888")
      logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'COMMIT')`)
   })
   .then(async result => {
      console.log("999")
      try {
         await db[slaveInd].commit()
      } catch(error) {
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         throw error
      }
   })
}

app.get('/', async (req, res) => {
   try { 
      try {
         await setUpMySQL()
      } catch(error) {
         console.log("SETUP ERROR: " + error);
      }
      await recoverAll()
      //await clearAllLogs()
      await reintegrateAll()
      .then (async res => {
         await db[2].beginTransaction();
         const query = "SELECT * FROM movies ORDER BY year";
         return db[2].query(query)
      })
      .then (async data1 => {
         await db[2].commit();
         try {
            await db[1].beginTransaction();
            const query = "SELECT * FROM movies ORDER BY year";
            db[1].query(query)
            .then (async data2 => {
               await db[1].commit();
               var data = await data1.concat(data2)
               console.log("FROM DB1 AND DB2")
               res.render("ViewSearch", data)
            })
         } catch (error) { //Node 2 cannot begin transac, load half from Node 0
            console.log(error)
            try {
               await db[0].beginTransaction();
               const query = "SELECT * FROM movies WHERE year < 1980 ORDER BY year"
               db[0].query(query)
               .then (async data2 => {
                  await db[0].commit();
                  var data = await data1.concat(data2)
                  console.log("FROM DB2 AND DB0")
                  res.render("ViewSearch", data)
               })
            } catch (error) { //Node 0 cannot begin transac, cannot load half of the data 
               console.log(error)
               res.render("ViewSearch", data1)
            }
         }
      })
   } catch (error) { //Node 1 cannot begin transac, load from Node 2 and/or Node 0
      console.log(error)
      try {
         await db[1].beginTransaction();
         const query = "SELECT * FROM movies  ORDER BY year";
         db[1].query(query)
         .then (async data1 => {
            await db[1].commit();
            try {
               await db[0].beginTransaction();
               const query = "SELECT * FROM movies WHERE year >= 1980  ORDER BY year"
               db[0].query(query)
               .then (async data2 => {
                  await db[0].commit();
                  var data = await data1.concat(data2)
                  console.log("FROM DB1 AND DB0")
                  res.render("ViewSearch", data)
               })
            } catch (error) { //Node 0 cannot begin transac, cannot load half of the data 
               console.log(error)
               res.render("ViewSearch", data1)
            }
         })
      } catch(error) { //Node 2 cannot begin transac, load all from Node 0
         console.log(error)
         try {
            await db[0].beginTransaction();
            const query = "SELECT * FROM movies  ORDER BY year";
            db[0].query(query)
            .then (async data => {
               await db[0].commit();
               console.log("FROM DB0")
               res.render("ViewSearch", data)
            })
         } catch (error) { //Node 0 cannot begin transac, cannot load any data
            console.log(error)
            res.render("ViewSearch")
         }
      }
   }   
});

app.get('/search', async(req, res) => {
   console.log("search")
   console.log(req.query.attribute)
   try {
      await db[2].beginTransaction();
      const query = `SELECT * FROM movies WHERE ${req.query.attribute} = '${req.query.value}' ORDER BY year`
      console.log(query)
      db[2].query(query)
      .then(async data1 => {
         await db[2].commit();
         try {
            await db[1].beginTransaction();
            const query = `SELECT * FROM movies WHERE ${req.query.attribute} = '${req.query.value}' ORDER BY year`
            db[1].query(query)
            .then(async data2 => {
            await db[1].commit();
            var data = await data1.concat(data2)
            res.render('partials/rows', data, function(err, html) {
               if (err)
               {
                   throw err;
               } 
               res.send(html);
           });
         })
         } catch (error) { //node 2 cannot begin transac, search in node 0
            console.log(error)
            try {
               await db[0].beginTransaction();
               const query = `SELECT * FROM movies WHERE ${req.query.attribute} = '${req.query.value}' AND year < 1980 ORDER BY year`
               db[0].query(query)
               .then(async data2 => {
               await db[0].commit();
               var data = await data1.concat(data2)
               res.render('partials/rows', data, function(err, html) {
                  if (err)
                  {
                      throw err;
                  } 
                  console.log("HTML: " + html);
                  res.send(html);
              });
            })
            } catch (error) { //node 0 cannot begin transac, only from node1
               res.render('partials/rows', data1, function(err, html) {
                  if (err)
                  {
                      throw err;
                  } 
                  console.log("HTML: " + html);
                  res.send(html);
              });
            }
         }
      })
   } catch (error) { //node 1 cannot begin transac, search in node 0
      try {
         await db[0].beginTransaction();
         const query = `SELECT * FROM movies WHERE ${req.query.attribute} = '${req.query.value}' ORDER BY year`
         db[0].query(query)
         .then(async data => {
         await db[0].commit();
         res.render('partials/rows', data, function(err, html) {
            if (err)
            {
                throw err;
            } 
            res.send(html);
        });
      })
      } catch (error) { //node 0 cannot begin transac, search in node 2
         console.log(error)
         try {
            await db[1].beginTransaction();
            const query = `SELECT * FROM movies WHERE ${req.query.attribute} = '${req.query.value}' ORDER BY year`
            db[1].query(query)
            .then(async data => {
            await db[1].commit();
            res.render('partials/rows', data, function(err, html) {
               if (err)
               {
                   throw err;
               } 
               res.send(html);
           });
         })
         } catch (error) { //node 0 cannot begin transac, cannot search
            var data = [];
            res.render('partials/rows', data, function(err, html) {
               if (err)
               {
                   throw err;
               } 
               res.send(html);
           });
         }
      }
   }
}); 

app.post('/insertMovie', async(req, res) => {
   var year = req.body.year;
   var lastUpdated;
   logDb[0].query("SELECT MAX(transaction_no) AS max FROM log")
   .then(result => {
      if (result[0].max == null)
         transacNo = 0
      else 
         transacNo = result[0].max + 1      
   })
   .then(result => {
      var today = new Date();
      var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
      var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      lastUpdated = date+' '+time;
   })
   .then(result => {
      logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START')`)
   })
   .then(async result => {
      console.log("444")
      try {
         await db[0].beginTransaction();
      } catch(error) {
         await logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         await insertInNewMaster(req);
         res.redirect("/addMovies")
         throw error
      }
   })
   .then(result => {
      const query = `INSERT INTO movies (id, title, year, rating, genre, director, actor, lastUpdated) VALUES (${req.body.id}, '${req.body.title}', ${req.body.year}, ${req.body.rank}, '${req.body.genre}', '${req.body.director}', '${req.body.actor}', '${lastUpdated}')`
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
         await logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         await insertInNewMaster(req, lastUpdated);
         res.redirect("/addMovies")
         throw error
      }
   })
   .then(result => {
      logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'COMMIT')`)
   })
   .then(async result => {
      try {
         await db[0].commit();
      } catch(error) {
         await logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         await insertInNewMaster(req, lastUpdated);
         res.redirect("/addMovies")
         throw error
      }
   })
   .then(result => { //propagate update
      if (year < 1980)
         slaveInd = 1;
      else 
         slaveInd = 2;
      return slaveInd
   })
   .then(slaveInd => {
      return logDb[slaveInd].query("SELECT MAX(transaction_no) AS max FROM log")
   })
   .then(result => {
      if (result[0].max == null)
         transacNo = 0
      else 
         transacNo = result[0].max + 1
   })
   .then(result => {
      logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START')`)
   })
   .then(async result => {
      try {
         await db[slaveInd].beginTransaction();
      } catch(error) {
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         res.redirect("/addMovies")
         throw error
      }
   })
   .then(result => {
      const query = `INSERT INTO movies (id, title, year, rating, genre, director, actor, lastUpdated) VALUES (${req.body.id}, '${req.body.title}', ${req.body.year}, ${req.body.rank}, '${req.body.genre}', '${req.body.director}', '${req.body.actor}', '${lastUpdated}')`
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
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         res.redirect("/addMovies")
         throw error
      }
   })
   .then(result => {
      logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'COMMIT')`) 
   })
   .then(async result => {
      try {
         await db[slaveInd].commit();
      } catch(error) {
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         res.redirect("/addMovies")
         throw error
      }
      
   })
   .then(result => {
      res.redirect("/addMovies")
   })
}); 

app.post('/update/:id/:year/:title', async(req, res) => {
   var transacNo;
   var oldTitle;
   var slaveInd;
   var year = req.params.year;
   var id = req.params.id;
   var title = req.params.title;
   var lastUpdated;

   logDb[0].query("SELECT MAX(transaction_no) AS max FROM log")
   .then(result => {
      console.log("111")
      if (result[0].max == null)
         transacNo = 0
      else 
         transacNo = result[0].max + 1
   })
   .then(result => {
      var today = new Date();
      var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
      var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      lastUpdated = date+' '+time;
   })
   .then(async result => {
      console.log("222")
      try {
         result = await db[0].query(`SELECT title FROM movies WHERE id = ${req.params.id}`)
         return result
      } catch (error) {
         await logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         await updateInNewMaster(id, year, title, req.body.title);
         res.redirect("/")
         throw error         
      }
   })
   .then(result => {
      console.log("333")
      oldTitle = result[0].title
      logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START')`)
   })
   .then(async result => {
      console.log("444")
      try {
         await db[0].beginTransaction();
      } catch(error) {
         await logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         await updateInNewMaster(id, year, title, req.body.title);
         res.redirect("/")
         throw error
      }
   })
   .then(result => {
      console.log("555")
      const query = `UPDATE movies SET title = '${req.body.title}', lastUpdated = '${lastUpdated}' WHERE id = ${req.params.id}`;
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
         await logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         await updateInNewMaster(id, year, title, req.body.title, lastUpdated);
         res.redirect("/")
         throw error
      }
   })
   .then(result => {
      console.log("888")
      logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'COMMIT')`)
      //db[0].destroy()
   })
   .then(async result => {
      console.log("999")
      
      try {
         await db[0].commit()
      } catch(error) {
         await logDb[0].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         await updateInNewMaster(id, year, title, req.body.title, lastUpdated);
         res.redirect("/")
         throw error         
      }
   })
   .then(result => { //propagate update
      if (year < 1980)
         slaveInd = 1;
      else 
         slaveInd = 2;
      return slaveInd
   })
   .then(slaveInd => {
      return logDb[slaveInd].query("SELECT MAX(transaction_no) AS max FROM log")
   })
   .then(result => {
      if (result[0].max == null)
         transacNo = 0
      else 
         transacNo = result[0].max + 1
   })
   .then(result => {
      logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'START')`)
   })
   .then(async result => {
      try {
         await db[slaveInd].beginTransaction();
      } catch(error) {
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         res.redirect("/")
         throw error
      }
   })
   .then(result => {
      const query = `UPDATE movies SET title = '${req.body.title}', lastUpdated = '${lastUpdated}' WHERE id = ${req.params.id}`;
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
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         res.redirect("/")
         throw error
      }
   })
   .then(result => {
      logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'COMMIT')`) 
   })
   .then(async result => {
      try {
         await db[slaveInd].commit();
      } catch(error) {
         await logDb[slaveInd].query(`INSERT INTO log(transaction_no, query) VALUES (${transacNo}, 'ABORT')`)
         res.redirect("/")
         throw error
      }
      
   })
   .then(result => {
      res.redirect("/")
   })
});

app.get('/generateReport', async(req, res) => {
   var isCount = false;
   var isAverage = false;
   if (req.query.agg == "COUNT")
   isCount = true
   else
   isAverage = true

   try {
      await db[0].beginTransaction();
      const query = `SELECT YEAR, ${req.query.agg}(${req.query.param}) AS VAL FROM movies GROUP BY YEAR ORDER BY YEAR`
      db[0].query(query)
      .then(async data => {
         await db[0].commit();

         const results = {
            data: data,
            agg: req.query.agg,
            isCount: isCount,
            isAverage: isAverage
         }
         res.render('partials/reportRows', results, function(err, html) {
            if (err)
            {
                throw err;
            } 
            res.send(html);
        });
      })
   } catch(error) { //Node 0 failed, load from node 1 and node 2
      try {
         await db[1].beginTransaction();
         const query = `SELECT YEAR, ${req.query.agg}(${req.query.param}) AS VAL FROM movies GROUP BY YEAR ORDER BY YEAR`
         db[1].query(query)
         .then(async data1 => {
            await db[1].commit();
            try {
               await db[2].beginTransaction();
               const query = `SELECT YEAR, ${req.query.agg}(${req.query.param}) AS VAL FROM movies GROUP BY YEAR ORDER BY YEAR`
               db[2].query(query)
               .then(async data2 => {
                  await db[2].commit();
                  var data = await data1.concat(data2)

                  const results = {
                     data: data,
                     agg: req.query.agg,
                     isCount: isCount,
                     isAverage: isAverage
                  }
                  res.render('partials/reportRows', results, function(err, html) {
                     if (err)
                     {
                         throw err;
                     } 
                     res.send(html);
                 });
               })
            } catch (error) { //node 2 cannot begin transac, display node 1 only

               const results = {
                  data: data1,
                  agg: req.query.agg,
                  isCount: isCount,
                  isAverage: isAverage
               }
               res.render('partials/reportRows', results, function(err, html) {
                  if (err)
                  {
                      throw err;
                  } 
                  res.send(html);
              });
            }
         })
      } catch (error) { //Node 1 cannot begin transac, load node 2 only
         console.log(error)
         try {
            await db[2].beginTransaction();
            const query = `SELECT YEAR, ${req.query.agg}(${req.query.param}) AS VAL FROM movies GROUP BY YEAR ORDER BY YEAR`
            db[2].query(query)
            .then(async data => {
               await db[2].commit();

               const results = {
                  data: data,
                  agg: req.query.agg,
                  isCount: isCount,
                  isAverage: isAverage
               }
               res.render('partials/reportRows', results, function(err, html) {
                  if (err)
                  {
                      throw err;
                  } 
                  res.send(html);
              });
               //res.render
            })
         } catch (error) { //node 2 cannot begin transac

            var data = [];
            const results = {
               data: data,
               agg: req.query.agg,
               isCount: isCount,
               isAverage: isAverage
            }
            res.render('partials/reportRows', results, function(err, html) {
               if (err)
               {
                   throw err;
               } 
               res.send(html);
           });
         }  
      }
   }
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

app.get('/toggle0', async(req, res) => {
   if (ctr0 ==0)
   {
      ctr0 = 1;
      db[0].destroy()
   }
   else {
      ctr0 = 0
      db[0]= mysql.createConnection({
         host: "172.16.3.121",
         user: "group11",
         password: "group11",
         database: "mco2_imdb"
      });
      
      db[0].connect(function(err) {
         if (err) throw err;
         console.log("Db 0 Connected!");
      });
      db[0].query = bluebird.promisify(db[0].query);
   }
   res.redirect("/")
}); 

app.get('/toggle1', async(req, res) => {
   if (ctr1 ==0)
   {
      ctr1 = 1;
      db[1].destroy()
   }
   else {
      ctr1 = 0
      db[1]= mysql.createConnection({
         host: "172.16.3.122",
         user: "group11",
         password: "group11",
         database: "mco2_imdb"
      });
      
      db[1].connect(function(err) {
         if (err) throw err;
         console.log("Db 1 Connected!");
      });
      db[1].query = bluebird.promisify(db[1].query);
   }
   res.redirect("/")
}); 

app.get('/toggle2', async(req, res) => {
   if (ctr2 ==0)
   {
      ctr2 = 1;
      db[2].destroy()
   }
   else {
      ctr2 = 0
      db[2]= mysql.createConnection({
         host: "172.16.3.123",
         user: "group11",
         password: "group11",
         database: "mco2_imdb"
      });
      
      db[2].connect(function(err) {
         if (err) throw err;
         console.log("Db 2 Connected!");
      });
      db[2].query = bluebird.promisify(db[2].query);
   }
   res.redirect("/")
}); 

module.exports = app;