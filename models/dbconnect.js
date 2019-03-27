/*
    This file contains information regarding DB connection process

*/

var mysql = require('mysql');

// Function for creating connection
function mysqlCon(connection){

    var con = mysql.createConnection({

        host: process.env.host,
        user: process.env.user,
        password: process.env.password,
        database: process.env.functional_db

    });

    con.connect(function(err){

        if(!err){
            console.log('Connection Successful');
            return connection(con);
        }
        else{
            console.log('Ooops, something went wrong');
            console.log(err);
            console.log(process.env.host)
            return connection("error");
        }

    });

}

module.exports.dbconnection = mysqlCon;
