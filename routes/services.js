var express = require('express');
var router = express.Router();
var request = require('request');

// Authentication
var auth = require('../utilities/auth');

/* Get a list of available services related with a specific keyword */
router.get('/search/:keyword', auth.auth.devIsAuth, function(req, res, next) {

    if (req.auth === 'error'){
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true){
        
        request.get({

            url: process.env.ogdsam_url + '/servicesearch?q=' + req.params.keyword

        }, function(error, response, body){

            if(error){

                res.boom.resourceGone('Cannot communicate with OGDSAM');
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