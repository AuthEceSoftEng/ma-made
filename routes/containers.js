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
const PredefinedImage = require('../models/images');
const Application = require('../models/applications');
const Container = require('../models/containers');


router.post('/', auth.auth.devIsAuth2, function(req, res, next) {

    var reg_user = req.username;
    
    if (req.auth === 'error'){
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true){
        
        request.post({

            url: process.env.apps_vm_url + '/containers/deploy/' + reg_user + '_' + req.body.app_id + '/' + req.body.image_tag + '/' + req.body.port,

        }, function(error, response, body){

            if(error){
                res.boom.resourceGone('Cannot communicate with applications module');
            }
            else{

                if (response.statusCode != 201){
                    res.status(response.statusCode).json(JSON.parse(response.body));
                }
                else{
                    containerId = JSON.parse(response.body).containerId;
                    
                    var query1 = PredefinedImage.findOne({'image.name': req.body.image_tag});
    
                    query1.exec(function(err, preImage){
                        if(err){                    
                            res.boom.notAcceptable(err);
                        }
                        else{
                            if(err){                    
                                res.boom.notAcceptable(err);
                            }
                            else{
                                var container = new Container({id: containerId, image_id:preImage._id, owner:reg_user, port:req.body.port});
                
                                container.save(function(err, container){
                                    if(err){                    
                                        res.boom.notAcceptable(err);
                                    }
                                    else{
                                        res.status(201).json({container: container});
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
    }
    else{
        res.boom.unauthorized();
    }
});

/* Get the next available port to expose */
router.get('/availablePort', function(req, res, next) {

    var query = Container.find({});
    
    query.exec(function(err, containers){
        if(err){                    
            res.boom.notAcceptable(err);
        }
        else{
            
            var av_port = 0;
            for (i = process.env.ports_lower_limit; i < process.env.ports_upper_limit; i++){
                var flag = 0;
                for (j = 0; j < containers.length; j++){
                    if(containers[j].port == i){
                        flag = 1;
                        break;
                    }
                }
                if(flag == 0){
                    av_port = i;
                    break;
                }
            }
            if(av_port == 0){
                res.boom.expectationFailed('No available port to expose.');
            }
            else{
                res.status(200).json({available_port:i});
            }
        }
    });
});

router.get('/preconfList', function(req, res, next) {

    var query = PredefinedImage.find({});
    
    query.exec(function(err, images){
        if(err){                    
            res.boom.notAcceptable(err);
        }
        else{
            res.status(200).json({images:images});
        }
    });
});

router.post('/preconf', function(req, res, next) {

    var image = new PredefinedImage({image: req.body.image, devTools: req.body.devTools});
                
    image.save(function(err, image){
        if(err){                    
            res.boom.notAcceptable(err);
        }
        else{

            res.status(201).json({image: image});

        }
    });
});

router.get('/preconfList/id/:im_id', function(req, res, next) {

    dbHandler.dbactions.selectData(dbcon, 'docker_images', '*', [['image_id', req.params.im_id, 0]], 1, function(result){

        if (result['queryStatus'] == 'Success'){
            send["routerStatus"] = "Success";
            send["info"] = result;
        }
        else{

            send["routerStatus"] = "Failure";
            send["routerMessage"] = "DB query error";
        }

        res.json(send);

    });
});

/* Get container details */
router.get('/:container_id/details', function(req, res, next) {

    var query1 = Container.findOne({id:req.params.container_id});
    
    query1.exec(function(err, container){
        if(err){                    
            res.boom.notAcceptable(err);
        }
        else{
            
            var query2 = PredefinedImage.findOne({_id:container.image_id});
            query2.exec(function(err, image){
                if(err){                    
                    res.boom.notAcceptable(err);
                }
                else{
                    res.status(200).json({container:container,image:image});
                }
            });
        }
    });
});

/* Get container details */
router.get('/isActive/:container_id', function(req, res, next) {

    request.get({

        url: process.env.apps_vm_url + '/containers/isActive/' + req.params.container_id ,

    }, function(error, response, body){

        if(error){
            res.boom.resourceGone('Cannot communicate with applications module');
        }
        else{
            if (response.statusCode == 200){
                res.status(response.statusCode).json(response.body);
            }
            else{
                res.boom.notAcceptable(response.body);
            }
        }
    });
});

/* Start a container */
router.put('/start/:container_id', auth.auth.devIsAuth, function(req, res, next) {

    var reg_user = req.username;
    
    if (req.auth === 'error'){
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true){
        
        request.put({

            url: process.env.apps_vm_url + '/containers/start/' + req.params.container_id,
            form: {
                application_id: req.body.application_id
            }

        }, function(error, response, body){

            if(error){
                res.boom.resourceGone('Cannot communicate with applications module');
            }
            else{

                if (response.statusCode != 200){
                    res.status(response.statusCode).json(JSON.parse(response.body));
                }
                else{
                    
                    var query1 = Container.findOne({id: req.params.container_id});
                    
                    query1.exec(function(err, container){
                        if(err){                    
                            res.boom.notAcceptable(err);
                        }
                        else{
                            if(err){                    
                                res.boom.notAcceptable(err);
                            }
                            else{
                                container.active = true;
                                container.save(function(err, container){
                                    if(err){                    
                                        res.boom.notAcceptable(err);
                                    }
                                    else{
                                        res.status(201).json({container: container});
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
    }
    else{
        res.boom.unauthorized();
    }
});

/* Stop a container */
router.put('/stop/:container_id', auth.auth.devIsAuth, function(req, res, next) {

    var reg_user = req.username;
    
    if (req.auth === 'error'){
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true){
        
        request.put({

            url: process.env.apps_vm_url + '/containers/stop/' + req.params.container_id,
            form: {
                application_id: req.body.application_id
            }

        }, function(error, response, body){

            if(error){
                res.boom.resourceGone('Cannot communicate with applications module');
            }
            else{

                if (response.statusCode != 200){
                    res.status(response.statusCode).json(JSON.parse(response.body));
                }
                else{
                    
                    var query1 = Container.findOne({id: req.params.container_id});
                    
                    query1.exec(function(err, container){
                        if(err){                    
                            res.boom.notAcceptable(err);
                        }
                        else{
                            if(err){                    
                                res.boom.notAcceptable(err);
                            }
                            else{
                                container.active = false;
                                container.save(function(err, container){
                                    if(err){                    
                                        res.boom.notAcceptable(err);
                                    }
                                    else{
                                        res.status(201).json({container: container});
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
    }
    else{
        res.boom.unauthorized();
    }
});

/* Synchronize container with the application repository */
router.put('/sync/:container_id/:repo_id', auth.auth.devIsAuth, function(req, res, next) {

    var reg_user = req.username;
    
    if (req.auth === 'error'){
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true){
        
        request.put({

            url: process.env.apps_vm_url + '/containers/sync/' + req.params.container_id + '/' + req.params.repo_id,
            headers: {
                'TOKEN': req.developer_token    
            },
            form: {
                password: req.body.password
            }
        }, function(error, response, body){

            if(error){
                res.boom.resourceGone('Cannot communicate with applications module');
            }
            else{

                if (response.statusCode != 200){
                    res.status(response.statusCode).json(JSON.parse(response.body));
                }
                else{
                    
                    res.status(200).json({});
                }
            }
        });
    }
    else{
        res.boom.unauthorized();
    }
});

module.exports = router;
