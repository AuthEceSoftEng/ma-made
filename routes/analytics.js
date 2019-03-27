const express = require('express');
const router = express.Router();
const request = require('request');

// Authentication
const auth = require('../utilities/auth');

// Load model
const Analytics = require('../models/analytics');

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const Promise = require("bluebird");
Promise.config({
    cancellation: true
});

/* Get request analytics token */
router.post('/register', auth.auth.devIsAuth, function (req, res, next) {

    req.auth = true;
    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        request.post({

            url: process.env.analytics_vm_url + '/analytics/api/register/',
            form: {
                name: req.body.application_name,
                description: req.body.application_name
            }

        }, function (error, response, body) {

            if (error) {

                res.boom.resourceGone('Cannot communicate with analytics server');
            }
            else {
                if (response.statusCode != 200) {

                    res.status(response.statusCode).json(response.body);
                }
                else {
                    tid = response.body.tid;
                    timestamp = response.body.created;

                    var analytics = new Analytics({
                        application_name: req.body.application_name,
                        application_id: req.body.application_id,
                        owner: req.body.application_id,
                        created: timestamp,
                        token: tid
                    });

                    analytics.save(function (err, analytics) {
                        if (err) {
                            res.boom.notAcceptable(err);
                        }
                        else {
                            res.status(201).json({ analytics: analytics });
                        }
                    });
                }
            }
        });
    }
    else {
        res.boom.unauthorized();
    }
});

/**
 * @param {req.query.url} - The url to be run with lighthouse
 */
router.get('/lighthouse', auth.auth.devIsAuth, (req, res, next) => {
    if (req.auth === 'error') {
        return res.boom.resourceGone('Cannot connect to applications module.');
    } else if (req.auth === true) {
        launchChromeAndRunLighthouse(req.query.url, { quite: true, chromeFlags: ['--timeout 10000', '--headless', '--no-sandbox'] })
            .then(results => {
                const data = Object.keys(results.lhr.categories).map(key => ({ category: key, score: results.lhr.categories[key].score }))
                request.post(
                    `${process.env.VEGA_URL}/api/data/stackedBarChart`,
                    {
                        json: {
                            data: {
                                [data[0].category]: [data[0].score, 0, 0, 0, 0],
                                [data[1].category]: [0, data[1].score, 0, 0, 0],
                                [data[2].category]: [0, 0, data[2].score, 0, 0],
                                [data[3].category]: [0, 0, 0, data[3].score, 0],
                                [data[4].category]: [0, 0, 0, 0, data[4].score],
                            }
                        }
                    },
                    (error, response, body) => {
                        if (error) return Promise.reject(error);
                        return res.status(200).json({
                            audits: Object.keys(results.lhr.audits)
                                .filter(key => (results.lhr.audits[key].score !== null && results.lhr.audits[key].score < 0.3))
                                .map(key => ({ audit: key, ...results.lhr.audits[key] })),
                            vegaPlot: body
                        })
                    })
            })
            .catch(err => {
                console.log(err)
                return res.boom.badImplementation(err);
            })
    }
    else {
        return res.boom.unauthorized();
    }
})

module.exports = router;

function launchChromeAndRunLighthouse(url, opts, config = null) {
    return chromeLauncher.launch({ chromeFlags: opts.chromeFlags })
        .then(chrome => {
            console.log('Chrome launched');
            opts.port = chrome.port;
            return lighthouse(url, opts, config).then(results => {
                console.log('Lighthouse ended');
                // The gathered artifacts are typically removed as they can be quite large (~50MB+)
                delete results.artifacts;
                return chrome.kill()
                    .then(() => {
                        console.log('Chrome killed');
                        return Promise.resolve(results);
                    })
            }).catch(error => {
                console.log(error);
                return Promise.reject('Lighthouse error');
            })
        }).catch(error => {
            console.log(error);
            return Promise.reject('Chrome error');
        })
} 