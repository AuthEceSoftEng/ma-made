var express = require('express');
var router = express.Router();
var request = require('request');

// Authentication
var auth = require('../utilities/auth');

/* Get a list of available front-ends */
router.get('/list', auth.auth.devIsAuth, function(req, res, next) {

    console.log('inside');
    if (req.auth === 'error'){
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true){
        
        request.get({

            url: process.env.front_ends_url + '/components'

        }, function(error, response, body){

            if(error){

                res.boom.resourceGone('Cannot communicate with front-ends module');
            }
            else{
                if (response.statusCode != 200){
                    res.status(response.statusCode).json(response.body);
                }
                else{
                    res.json(response.body);
                }
            }
        });
    }
    else{
        res.boom.unauthorized();
    } 
});

router.get('/test', function(req, res, next) {

    console.log('inside');
    res.json('ttt');
     
});

/* Get the information regarding an available front-end component */
router.get('/info/:id', auth.auth.devIsAuth, function(req, res, next) {

    if (req.auth === 'error'){
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true){
        
        request.get({

            url: process.env.front_ends_url + '/component/' + req.params.id

        }, function(error, response, body){

            if(error){

                res.boom.resourceGone('Cannot communicate with front-ends module');
            }
            else{
                if (response.statusCode != 200){
                    res.status(response.statusCode).json(response.body);
                }
                else{
                    res.json(response.body);
                }
            }
        });
    }
    else{
        res.boom.unauthorized();
    } 
});

module.exports = router;