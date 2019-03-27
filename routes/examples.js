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

router.get('/buttons', auth.auth.devIsAuth, function (req, res, next) {


    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        res.render('examples/buttons', {
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

router.get('/forms', auth.auth.devIsAuth, function (req, res, next) {


    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        res.render('examples/forms', {
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

router.get('/general', auth.auth.devIsAuth, function (req, res, next) {


    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        res.render('examples/general', {
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

router.get('/icons', auth.auth.devIsAuth, function (req, res, next) {


    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        res.render('examples/icons', {
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

router.get('/modals', auth.auth.devIsAuth, function (req, res, next) {


    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        res.render('examples/modals', {
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

router.get('/tables', auth.auth.devIsAuth, function (req, res, next) {


    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        res.render('examples/tables', {
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

router.get('/older-adults-friendly', auth.auth.devIsAuth, function (req, res, next) {


    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        res.render('examples/older-adults-friendly', {
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

router.get('/timeline', auth.auth.devIsAuth, function (req, res, next) {


    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        res.render('examples/timeline', {
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

router.get('/widgets', auth.auth.devIsAuth, function (req, res, next) {


    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        res.render('examples/widgets', {
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

router.get('/profile', auth.auth.devIsAuth, function (req, res, next) {


    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        res.render('examples/profile', {
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