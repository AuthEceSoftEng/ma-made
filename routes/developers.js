var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var request = require('request');

// Authentication
var auth = require('../utilities/auth');

// Create connection
var dbcon = require('../models/dbconnect');

// Access database
var dbHandler = require('../models/dbHandler');

// Load models
const Developer = require('../models/developers');

/* Get current registered developer */
router.get('/', auth.auth.devIsAuth, function (req, res, next) {

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        res.status(201).json({ username: req.username });
    }
    else {
        res.boom.unauthorized();
    }

});

router.get('/user', auth.auth.devIsAuth3, function (req, res, next) {

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        res.status(201).json({ username: req.username, name: req.name, email: req.email, avatar: req.avatar, id: req.id });
    }
    else {
        res.boom.unauthorized();
    }

});

router.post('/logout', auth.auth.devIsAuth, function (req, res, next) {
    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        req.session.destroy();
        res.status(200).send('OK');
    }
    else {
        res.boom.unauthorized();
    }
});

router.post('/update', auth.auth.devIsAuth, function (req, res, next) {

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        if (req.body.currentPassword === undefined && req.body.newPassword === undefined && req.body.passwordConfirm === undefined) {
            if (req.body.name === undefined && req.body.email === undefined) {
                res.status(400).send('Nothing to change');
            } else {

                request.put({

                    url: process.env.apps_vm_url + '/auth/update',
                    form: {
                        email: req.body.email,
                        name: req.body.name,
                        id: req.body.id
                    }
                }, function (error, response, body) {

                    if (error) {

                        res.boom.resourceGone('Cannot communicate with applications module');
                    }
                    else {
                        if (response.statusCode != 201) {
                            res.status(response.statusCode).json(response.body);
                        }
                        else {
                            res.status(200).json(response.body);
                        }
                    }
                });
            }
        } else if (req.body.currentPassword !== undefined) {
            if (req.body.newPassword !== req.body.passwordConfirm) {
                res.status(400).send('Passwords must match');
            } else if (req.body.newPassword !== undefined && req.body.newPassword !== '') {

                request.post({

                    url: process.env.apps_vm_url + '/auth/user/',
                    form: {
                        username: req.body.username,
                        password: req.body.currentPassword
                    }

                }, function (error, response, body) {

                    if (error) {
                        res.boom.resourceGone('Cannot communicate with applications module');
                    }
                    else {
                        if (response.statusCode != 201) {

                            res.status(400).send('You must provide a valid current password');
                        }
                        else {

                            request.put({

                                url: process.env.apps_vm_url + '/auth/update',
                                form: {
                                    email: req.body.email,
                                    name: req.body.name,
                                    password: req.body.newPassword,
                                    id: req.body.id
                                }
                            }, function (error, response, body) {

                                if (error) {

                                    res.boom.resourceGone('Cannot communicate with applications module');
                                }
                                else {
                                    if (response.statusCode != 200) {
                                        res.status(response.statusCode).json(response.body);
                                    }
                                    else {
                                        res.status(200).send('Password changed');
                                    }
                                }
                            });
                        }
                    }
                });

            } else {
                res.status(400).send('Define new password');
            }
        } else {
            res.status(400).send('You must provide your current password')
        }

    }
    else {
        res.boom.unauthorized();
    }

});

router.post('/add', function (req, res, next) {

    req.checkBody('username', 'First name cannot be empty.').notEmpty();
    req.checkBody('password', 'Last name cannot be empty.').notEmpty();
    req.checkBody('email', 'Must be a valid email address.').isEmail();
    req.checkBody('passwordConfirm', 'Passwords must match').equals(req.body.password);

    const errors = req.validationErrors();

    if (req.body.username) {
        if (req.body.username.split(' ').length > 1) {
            if (errors) {
                errors.push({ "param": "username", "msg": "The username cannot contain spaces", "value": "" });
            }
            else {
                errors = [{ "param": "username", "msg": "The username cannot contain spaces", "value": "" }];
            }
        }
    }

    if (errors) {

        res.render('developers/signup', {
            user: 'developer',
            message: errors
        });
    }
    else {

        request.post({

            url: process.env.apps_vm_url + '/repos/users',
            form: {

                'name': req.body.username,
                'username': req.body.username,
                'password': req.body.password,
                'email': req.body.email

            }

        }, function (error, response, body) {

            if (error) {
                errors = [{ "param": "Connection Failure", "msg": "Cannot connect to applications module.", "value": "" }];

                res.render('developers/signup', {
                    user: 'developer',
                    message: errors
                });
            }
            else {
                if (response.statusCode != 201) {

                    var message = JSON.parse(response.body).message;
                    var inputErrors = [{ "param": "Input Error", "msg": JSON.stringify(message) }];

                    res.render('developers/signup', {
                        user: 'developer',
                        message: inputErrors
                    });
                }
                else {

                    var user = JSON.parse(body).user;
                    var dev = new Developer({ username: req.body.username, code_repo_id: user.id });

                    dev.save(function (err, dev) {
                        if (err) {
                            res.render('developers/signup', {
                                user: 'developer',
                                message: [{ msg: 'Database error. Please try again.' }]
                            });
                        }
                        else {

                            req.session.developer = req.body.username;
                            res.render('developers/signin', {
                                user: 'developer',
                                successMessage: 'Sign up successful. Please enter your credentials to login into the platform.'
                            });
                        }
                    });
                }
            }
        });
    }
});

router.get('/signIn', function (req, res, next) {

    if (req.query.code == 'bad_cred') {
        res.render('developers/signin', {
            errorsMessage: 'Bad credentials'
        });
    }
    else if (req.query.code == 'error_01') {
        res.render('developers/signin', {
            errorsMessage: 'Cannot connect to database - Please try again'
        });
    }
    else if (req.query.code == 'error_02') {
        res.render('developers/signin', {
            errorsMessage: 'Internal error'
        });
    }
    else {
        res.render('developers/signin', {
        });
    }

});

router.post('/authenticate', function (req, res, next) {

    req.checkBody('username', "Username can't be empty").notEmpty();
    req.checkBody('password', "Password can't be empty").notEmpty();

    const errors = req.validationErrors();
    if (errors) {
        res.render('developers/signin', {
            message: errors
        });
    }
    else {

        request.post({

            url: process.env.apps_vm_url + '/auth/user/',
            form: {
                username: req.body.username,
                password: req.body.password
            }

        }, function (error, response, body) {
            if (error) {
                res.render('developers/signin', {
                    errorsMessage: 'Error in communication with database'
                });
            }
            else {
                if (response.statusCode != 201) {
                    res.status(response.statusCode);
                    res.render('developers/signin', {
                        user: 'developer',
                        message: [{ msg: JSON.parse(response.body).message }]
                    });
                }
                else {

                    req.session.developer_token = JSON.parse(body).user.private_token;
                    return res.redirect('/developers/dashboard');
                }
            }

        });
    }
});


router.post('/isAuth', function (req, res, next) {

    username = req.body.key;

    var send = {};

    dbHandler.dbactions.selectData(dbcon, 'developers', '*', [['username', username, 0]], 1, function (result) {

        if (result['queryStatus'] == 'Success') {

            if (result['data'].length > 0) {
                send["routerStatus"] = "Success";
                send["isAuth"] = "true";
            }
            else {
                send["routerStatus"] = "Success";
                send["isAuth"] = "false";
            }

        }
        else {
            send["routerStatus"] = "Failure";
            send["routerMessage"] = "BD Query error";
        }

        res.json(send);
    });
});

router.get('/dashboard', auth.auth.devIsAuth, function (req, res, next) {


    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        res.render('developers/dashboard', {
            login: true
        });
    }
    else {
        res.render('developers/signin', {
            user: 'developer',
            message: [{ msg: 'Developer unauthorized.' }]
        });
    }


});

router.get('/favorite_components', auth.auth.devIsAuth, function (req, res, next) {


    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        res.render('developers/favorite_components', {
            login: true
        });
    }
    else {
        res.render('developers/signin', {
            user: 'developer',
            message: [{ msg: 'Developer unauthorized.' }]
        });
    }


});

router.get('/upload_dataset', auth.auth.devIsAuth, function (req, res, next) {


    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        res.render('developers/upload_dataset', {
            login: true
        });
    }
    else {
        res.render('developers/signin', {
            user: 'developer',
            message: [{ msg: 'Developer unauthorized.' }]
        });
    }


});

router.get('/open_datasets', auth.auth.devIsAuth, function (req, res, next) {


    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        res.render('developers/open_datasets', {
            login: true
        });
    }
    else {
        res.render('developers/signin', {
            user: 'developer',
            message: [{ msg: 'Developer unauthorized.' }]
        });
    }


});

router.get('/upload_service', auth.auth.devIsAuth, function (req, res, next) {


    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        res.render('developers/upload_service', {
            login: true
        });
    }
    else {
        res.render('developers/signin', {
            user: 'developer',
            message: [{ msg: 'Developer unauthorized.' }]
        });
    }


});

router.get('/open_services', auth.auth.devIsAuth, function (req, res, next) {


    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        res.render('developers/open_services', {
            login: true
        });
    }
    else {
        res.render('developers/signin', {
            user: 'developer',
            message: [{ msg: 'Developer unauthorized.' }]
        });
    }


});

router.get('/design', auth.auth.devIsAuth, function (req, res, next) {
    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {
        res.render('developers/design', {
            login: true
        });
    }
    else {
        res.render('developers/signin', {
            user: 'developer',
            message: [{ msg: 'Developer unauthorized.' }]
        });
    }
});

router.get('/my-applications', auth.auth.devIsAuth, function (req, res, next) {
    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {
        res.render('developers/my-applications', {
            login: true
        });
    }
    else {
        res.render('developers/signin', {
            user: 'developer',
            message: [{ msg: 'Developer unauthorized.' }]
        });
    }
});

module.exports = router;
