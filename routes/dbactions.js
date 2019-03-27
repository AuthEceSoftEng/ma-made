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


router.post('/updateDB/initiateApp', function(req, res, next) {

    var container_id = req.body.container_id;
    var image_tag = req.body.image_tag;
    var app_id = req.body.app_id;
    var repo_id = req.body.repo_id;
    var port = req.body.port;
    var user = req.body.user;

    var send = {};

    dbHandler.dbactions.create_rows(dbcon, 'containers', [['container_id', container_id], ['image_id', image_tag], ['developer_id', user], ['active', 1], ['port', port]], function(result){

        if(result['queryStatus'] == 'Success'){

            dbHandler.dbactions.update_table(dbcon, 'applications', [['container_id', container_id]], [['id', app_id, 0]], 1, function(result){

                if(result['queryStatus'] == 'Success'){

                    dbHandler.dbactions.create_rows(dbcon, 'app_repos', [['container_id', container_id], ['project_id', repo_id], ['developer', user]], function(result){

                        if(result['queryStatus'] == 'Success'){

                            send["routerStatus"] = "Success";
                            send["routerMessage"] = "Database updated successfully";

                            res.json(send);
                        }
                        else{
                            send["routerStatus"] = "Failure";
                            send["routerMessage"] = "DB query error - Create rows on app_repos";

                            res.json(send);
                        }
                    });
                }
                else{
                    send["routerStatus"] = "Failure";
                    send["routerMessage"] = "DB query error - Update table applications";

                    res.json(send);
                }
            });
        }
        else{

            send["routerStatus"] = "Failure";
            send["routerMessage"] = "DB query error - Create rows on containers";

            res.json(send);
        }
    });
});

module.exports = router;
