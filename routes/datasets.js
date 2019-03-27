var express = require('express');
var router = express.Router();
var request = require('request');

// Authentication
var auth = require('../utilities/auth');

/* Get a list of available datasets */
router.get('/list', auth.auth.devIsAuth, function(req, res, next) {

    if (req.auth === 'error'){
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true){
        
        if(typeof req.query.category === 'undefined'){
        req.query.category = '';
        }
        if(typeof req.query.publisher === 'undefined'){
            req.query.publisher = '';
        }
        if(typeof req.query.licence === 'undefined'){
            req.query.licence = '';
        }
        if(typeof req.query.language === 'undefined'){
            req.query.language = '';
        }

        var params = 'category=' + req.query.category + '&publisher=' + req.query.publisher + '&licence=' + req.query.licence + '&language=' + req.query.language;
        
        console.log(params);
        request.get({

            url: process.env.ogdsam_url + '/datasets/search?' + params
            
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

// var params = 'category=' + 'pharmacy' + '&publisher=' + '' + '&licence=' + '' + '&language=' + '';
        
// console.log(params);
// request.get({

//     url: 'http://83.212.100.226' + '/datasets/search?' + params
    
// }, function(error, response, body){

//     if(error){
//         console.log('Error: ', error);
//         //res.boom.resourceGone('Cannot communicate with OGDSAM');
//     }
//     else{
//         if (response.statusCode != 200){
//             console.log('Error: ', response.statusCode);
//             //res.status(response.statusCode).json(response.body);
//         }
//         else{
//             console.log(response.body);
//             //res.json(response.body);
//         }
//     }
// });


/* Get the info of a list of datasets */
router.get('/:dataset/info', auth.auth.devIsAuth, function(req, res, next) {

    if (req.auth === 'error'){
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true){
        
        request.get({

            url: process.env.ogdsam_url + '/ckan/api/3/action/package_show?id=' + req.params.dataset

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

/* Get a list of available publishers */
router.get('/publishers/list', auth.auth.devIsAuth, function(req, res, next) {

    if (req.auth === 'error'){
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true){
        
        request.get({

            url: process.env.ogdsam_url + '/ckan/api/action/organization_list'

        }, function(error, response, body){

            if(error){

                res.boom.resourceGone('Cannot communicate with OGDSAM');
            }
            else{
                if (response.statusCode != 200){
                    res.status(response.statusCode).json(response.body);
                }
                else{
                    res.json(JSON.parse(response.body));
                }
            }
        });
    }
    else{
        res.boom.unauthorized();
    } 
});

/* Get a list of available licences */
router.get('/licenses/list', auth.auth.devIsAuth, function(req, res, next) {

    if (req.auth === 'error'){
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true){
        
        request.get({

            url: process.env.ogdsam_url + '/ckan/api/action/license_list'

        }, function(error, response, body){

            if(error){

                res.boom.resourceGone('Cannot communicate with OGDSAM');
            }
            else{
                if (response.statusCode != 200){
                    res.status(response.statusCode).json(response.body);
                }
                else{
                    res.json(JSON.parse(response.body));
                }
            }
        });
    }
    else{
        res.boom.unauthorized();
    } 
});

/* Get a list of the used languages among */
router.get('/languages/list', auth.auth.devIsAuth, function(req, res, next) {

    if (req.auth === 'error'){
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true){
        
        request.get({

            url: process.env.ogdsam_url + '/ogd/languages?used=true'

        }, function(error, response, body){

            if(error){

                res.boom.resourceGone('Cannot communicate with OGDSAM');
            }
            else{
                if (response.statusCode != 200){
                    res.status(response.statusCode).json(response.body);
                }
                else{
                    res.json(JSON.parse(response.body));
                }
            }
        });
    }
    else{
        res.boom.unauthorized();
    } 
});

module.exports = router;