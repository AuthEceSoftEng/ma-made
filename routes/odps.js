var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var request = require('request');

// Create connection
var dbcon = require('../models/dbconnect');

// Access database
var dbHandler = require('../models/dbHandler');

// Load models
const Odp = require('../models/odps');

router.get('/signin', function(req, res, next) {

  res.render('odp/signin', {
  });

});

router.get('/signup', function(req, res, next) {

  res.render('odp/signup', {
  });

});

router.post('/add', function(req, res, next) {
    
    var usernames = [];
    var emails = [];
    var organizations = [];
    var query = Odp.find({});
    
    var x = query.exec(function(err, odps){
        if(err){                    
            res.boom.notAcceptable(err);
        }
        else{
            for (var index in odps){
                usernames.push(odps[index].username);
                emails.push(odps[index].email);
                organizations.push(odps[index].organization);
            }
        }
    });
    x.then(function(data){
        
        req.checkBody('username', 'First name cannot be empty.').notEmpty();
        req.checkBody('password', 'Password cannot be empty.').notEmpty();
        req.checkBody('organization', 'Organization name cannot be empty.').notEmpty();
        req.checkBody('email', 'Must be a valid email address.').isEmail();
        req.checkBody('passwordConfirm', 'Passwords must match').equals(req.body.password);

        const errors = req.validationErrors();
        
        for (var index in data){
            if(data[index].username == req.body.username){
                if(errors){
                    errors.push({ "param": "username", "msg": "The username already exists", "value": "" });
                }
                else{
                    errors = [{ "param": "username", "msg": "The username already exists", "value": "" }];
                }
            }
            if(data[index].email == req.body.email){
                if(errors){
                    errors.push({ "param": "email", "msg": "The email already exists", "value": "" });
                }
                else{
                    errors = [{ "param": "email", "msg": "The email already exists", "value": "" }];
                }
            }
            if(data[index].organization == req.body.organization){
                if(errors){
                    errors.push({ "param": "organization", "msg": "The organization already exists", "value": "" });
                }
                else{
                    errors = [{ "param": "organization", "msg": "The organization already exists", "value": "" }];
                }
            }
        }
        
        if(req.body.username){
            if(req.body.username.split(' ').length > 1){
                if(errors){
                    errors.push({ "param": "username", "msg": "The username cannot contain spaces", "value": "" });   
                }
                else{
                    errors = [{ "param": "username", "msg": "The username cannot contain spaces", "value": "" }];
                }
            }
        }

        if (errors){
            
            res.render('odp/signup', {
                user: 'odp',
                message: errors
            });
        }
        else{

            request.post({

                url: process.env.ogdsam_url + '/ckan/api/action/organization_create',
                headers:{
                    'Authorization': process.env.ckan_authorization_key,
                    'Content-Type': 'application/json'
                },
                json:{

                    "name": req.body.organization,

                }

            }, function(error, response, body){

                if(error){
                    
                    errors = [{ "param": "Connection Failure", "msg": "Cannot create organization.", "value": "" }];

                    res.render('odp/signup', {
                        user: 'odp',
                        message: errors
                    });
                }
                else{
                    if(response.statusCode != 200){
                        
                        var message = response.body.error.message;                    
                        var inputErrors = [{ "param": "Input Error", "msg": JSON.stringify(message) }];

                        res.render('odp/signup', {
                            user: 'odp',
                            message: inputErrors
                        });
                    }
                    else{

                        var organization_name = response.body.result.name;
                        var organization_id = response.body.result.id;

                        var odp = new Odp({username: req.body.username, password: req.body.password, email: req.body.email, organization_name: organization_name, organization_id: organization_id});

                        odp.save(function(err, odp){
                            if(err){                    
                                res.render('odp/signup', {
                                    user: 'odp',
                                    message: [ { msg: 'Database error. Please try again.' } ]
                                });
                            }
                            else{

                                req.session.odp = req.body.username;
                                res.render('odp/signin', {
                                    user: 'odp',
                                    successMessage: 'Sign up successful. Please enter your credentials to login.'
                                });
                            }
                        });
                    }
                }
            });
        }
    })
});

router.post('/authenticate', function(req, res, next) {

    req.checkBody('username', "Username can't be empty").notEmpty();
    req.checkBody('password', "Password can't be empty").notEmpty();

    const errors = req.validationErrors();
    if (errors){
        res.render('odp/signin', {
            message: errors
        });
    }
    else{
        
        var query = Odp.find({"username": req.body.username, "password": req.body.password});
    
        query.exec(function(err, odps){
            if(err){
                errors = [{ "param": "DB ERROR", "msg": "Error in connection with database", "value": "" }];
                res.render('odp/signin', {
                    user: 'odp',
                    errorsMessage: errors
                });
            }
            else{
                if(odps.length == 0){
                    res.render('odp/signin', {
                        user: 'odp',
                        message: [ { "msg": "Authentication Failed: Please check your credentials" } ]
                    });
                }
                else{
                    return res.redirect(process.env.ogdsam_url + '/annotations/platform?username=' + req.body.username + '&organization=' + odps[0].organization_id);
                }
            }
        });
    }
});

module.exports = router;