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

router.post('/synchronize', auth.auth.devIsAuth, function(req, res, next) {

    if (req.auth === 'error'){
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true){
        
        request.put({

            url: process.env.apps_vm_url + '/containers/sync/' + req.body.application.container +'/' + req.body.application.repo_id,
            form:{
                password: req.body.password,
                application_id: req.body.application._id   
            },
            headers: {
                'TOKEN': req.session.developer_token
            }
        }, function(error, response, body){

            if(error){

                res.boom.resourceGone('Cannot communicate with applications module');
            }
            else{

                if (response.statusCode != 200){
                    res.status(response.statusCode).json(response.body);
                }
                else{
                    res.status(200).json({});
                }
            }
        });
    }
    else{
        res.render('developers/signin', {
            user: 'developer',
            message: [ { msg: 'Developer unauthorized.' } ]
        });
    }

});

/* Get the file tree of a given repository */
router.get('/:repo_id/tree', auth.auth.devIsAuth, function(req, res, next) {
    console.log(req.params.repo_id);
    if (req.auth === 'error'){
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true){
        
        request.get({

            url: process.env.apps_vm_url + '/repos/project/' + req.params.repo_id + '/tree',
            headers: {
                'TOKEN': req.session.developer_token
            }
        }, function(error, response, body){

            if(error){

                res.boom.resourceGone('Cannot communicate with applications module');
            }
            else{

                if (response.statusCode != 200){
                    res.status(response.statusCode).json(response.body);
                }
                else{
                    res.status(200).json({tree:JSON.parse(response.body).files});
                }
            }
        });
    }
    else{
        res.render('developers/signin', {
            user: 'developer',
            message: [ { msg: 'Developer unauthorized.' } ]
        });
    }

});


module.exports = router;
