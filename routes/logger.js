var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var shell = require('shelljs');
var request = require('request');

// Create connection
var dbcon = require('../models/dbconnect');

// Access database
var dbHandler = require('../models/dbHandler');

// Authentication
var auth = require('../utilities/auth');

// Load models
const Log = require('../models/logs');

router.post('/', function(req, res, next) {
    
    var currTimestamp = Date();
    var elapsed_time = String(Number(req.body.timeEl).toFixed(3)) + ' sec'
    
    var log = new Log({action: req.body.action, application_id:req.body.application_id, message:req.body.message, timestamp:currTimestamp, status:req.body.status, timeElapsed:elapsed_time});
                
    log.save(function(err, log){

        if(err){                    
            res.boom.notAcceptable(err);
        }
        else{
            res.status(201).json({log: log});
        }
    });
});

router.get('/list/:app_id', function(req, res, next) {

    var query = Log.find({application_id: req.params.app_id});
    
    query.exec(function(err, logs){
        if(err){                    
            res.boom.notAcceptable(err);
        }
        else{
            res.status(200).json({logs:logs});
        }
    });
});

module.exports = router;