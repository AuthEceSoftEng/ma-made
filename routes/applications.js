var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var shell = require('shelljs');
var request = require('request');
var isReachable = require('is-reachable');
var fs = require('fs');
var multer = require('multer');
const upload = multer();
const localeList = require('../utilities/locales')

// Authentication
var auth = require('../utilities/auth');

// Containers actions
var containers_actions = require('../models/containers_actions');

// Application actions
var apps_actions = require('../models/apps_actions');

// Repositories actions
var repos_actions = require('../models/repos_actions');

// BD procedures
var db_procedures = require('../models/db_procedures');

// Load models
const Application = require('../models/applications');
const Developer = require('../models/developers');
const Container = require('../models/containers');
const Component = require('../models/reusable_components');
const Dataset = require('../models/datasets');
const Service = require('../models/services');

/* Instantiate application */
router.post('/:app_id/instantiate', auth.auth.devIsAuth, function (req, res, next) {

    var reg_user = req.username;

    console.log(req.session.developer_token);
    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        request.get({

            url: process.env.platform_url + '/containers/availablePort'

        }, function (error, response, body) {
            if (error) {
                res.boom.badImplementation('Internal error occured');
            }
            else {
                if (response.statusCode != 200) {
                    res.status(response.statusCode).json(JSON.parse(response.body));
                }
                else {
                    var port = JSON.parse(response.body).available_port;

                    request.post({

                        url: process.env.platform_url + '/containers',
                        form: {
                            app_id: req.params.app_id,
                            image_tag: req.body.image_tag,
                            port: port
                        },
                        headers: {
                            'TOKEN': req.session.developer_token
                        }

                    }, function (error, response, body) {

                        if (error) {
                            res.boom.badImplementation('Internal error occured');
                        }
                        else {
                            if (response.statusCode != 201) {
                                res.status(response.statusCode).json(JSON.parse(response.body));
                            }
                            else {

                                var container_id = JSON.parse(response.body).container.id;

                                var query1 = Application.findOne({ _id: req.params.app_id });

                                query1.exec(function (err, application) {
                                    if (err) {
                                        res.boom.notAcceptable(err);
                                    }
                                    else {
                                        application.container = container_id;
                                        application.save(function (err, application) {
                                            if (err) {
                                                res.boom.notAcceptable(err);
                                            }
                                            else {
                                                res.status(201).json({ application: application });
                                            }
                                        });
                                    }
                                });
                            }
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

/* Create new application */
/**
 * @param req.body.description - optional
 * @param req.body.tags - optional
 */
router.post('/:name', auth.auth.devIsAuth, function (req, res, next) {

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        var query = Developer.findOne({ username: req.username });

        query.exec(function (err, dev) {
            if (err) {
                res.boom.notAcceptable(err);
            }
            else {

                request.post({

                    url: process.env.apps_vm_url + '/repos/project/',
                    headers: {
                        'TOKEN': req.session.developer_token
                    },
                    form: {
                        name: req.params.name
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
                            var info = JSON.parse(response.body);
                            var app = new Application({
                                name: req.params.name,
                                owner: dev._id,
                                repo_id: info.project.id,
                                ...(req.body.description ? { description: req.body.description } : {}),
                                ...(req.body.tags ? { tags: req.body.tags } : {})
                            });

                            app.save(function (err, app) {
                                if (err) {
                                    res.boom.notAcceptable(err);
                                }
                                else {
                                    res.status(200).json({ app: app });
                                }
                            });
                        }
                    }
                });
            }
        });
    }
    else {
        res.boom.unauthorized();
    }
});

/* Get list of registered applications */
router.get('/my_apps', auth.auth.devIsAuth, function (req, res, next) {

    var reg_user = req.username;

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        var query1 = Developer.findOne({ username: reg_user });

        query1.exec(function (err, dev) {
            if (err) {
                res.boom.notAcceptable(err);
            }
            else {

                var query2 = Application.find({ owner: dev._id }).lean();

                query2.exec(function (err, apps) {
                    if (err) {
                        res.boom.notAcceptable(err);
                    }
                    else {
                        // Here also return the status of the container assigned
                        Promise.all(
                            apps.map(app => app.container === 'not_assigned' ?
                                new Promise((resolve, reject) => resolve('not_assigned'))
                                :
                                Container.findOne({ id: app.container })
                                    .then(container => {
                                        return Promise.resolve(container && container.active ? 'running' : 'stopped')
                                    })
                            ))
                            .then(containerStatuses => {
                                return res.status(200).json({ apps: apps.map((app, i) => ({ ...app, containerStatus: containerStatuses[i] })) });
                            })
                            .catch(err2 => {
                                return res.boom.badImplementation(err2);
                            })
                    }
                });
            }
        });
    }
    else {
        res.boom.unauthorized();
    }
});

/* Get application information */
router.get('/info/:app_id', auth.auth.devIsAuth, function (req, res, next) {

    var reg_user = req.username;

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        var query1 = Application.findOne({ _id: req.params.app_id });

        query1.exec(function (err, app) {
            if (err) {
                res.boom.notAcceptable(err);
            }
            else {
                request.get({
                    url: process.env.apps_vm_url + '/repos/project/' + app.repo_id,
                    headers: {
                        'TOKEN': req.session.developer_token
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
                            var repo_info = JSON.parse(response.body).info;
                            var domain_name = process.env.code_repo_url.replace('http://', '').split(':')[0];
                            repo_info.ssh_url_to_repo = repo_info.ssh_url_to_repo.replace('localhost', domain_name);
                            repo_info.http_url_to_repo = repo_info.http_url_to_repo.replace('localhost', domain_name);

                            res.json({ app: app, repo: repo_info });
                        }
                    }
                });
            }
        });
    }
    else {
        res.boom.unauthorized();
    }
});

/* Get deployment url for an application */
router.get('/url/:app_id', auth.auth.devIsAuth, function (req, res, next) {

    var reg_user = req.username;

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        var query1 = Application.findOne({ _id: req.params.app_id });

        query1.exec(function (err, app) {
            if (err) {
                res.boom.notAcceptable(err);
            }
            else {

                var query2 = Container.findOne({ id: app.container });

                query2.exec(function (err, container) {
                    if (err) {
                        res.boom.notAcceptable(err);
                    }
                    else {
                        res.json({ application_url: 'http://' + process.env.apps_vm_ip + ':' + container.port });
                    }
                });
            }
        });
    }
    else {
        res.boom.unauthorized();
    }
});

/* Deploy application */
router.put('/deploy', auth.auth.devIsAuth, function (req, res, next) {

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        request.put({

            url: process.env.apps_vm_url + '/applications/deploy/' + req.body.application.container + '/' + req.body.application.repo_id,
            headers: {
                'TOKEN': req.session.developer_token
            },
            form: {
                application_id: req.body.application._id,
                username: req.username,
                application_name: req.body.application.name
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
                    res.status(200).json({});
                }
            }
        });
    }
    else {
        res.render('developers/signin', {
            user: 'developer',
            message: [{ msg: 'Developer unauthorized.' }]
        });
    }
});

/* Deploy application */
router.put('/dependencies', auth.auth.devIsAuth, function (req, res, next) {

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        request.put({

            url: process.env.apps_vm_url + '/applications/dependencies/' + req.body.application.container,
            headers: {
                'TOKEN': req.session.developer_token
            },
            form: {
                application_id: req.body.application._id,
                username: req.username,
                application_name: req.body.application.name
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
                    res.status(200).json({});
                }
            }
        });
    }
    else {
        res.render('developers/signin', {
            user: 'developer',
            message: [{ msg: 'Developer unauthorized.' }]
        });
    }
});

/* Stop application */
router.put('/stop', auth.auth.devIsAuth, function (req, res, next) {

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        request.put({

            url: process.env.apps_vm_url + '/applications/stop/' + req.body.application.container + '/' + req.body.application.repo_id,
            headers: {
                'TOKEN': req.session.developer_token
            },
            form: {
                application_id: req.body.application._id
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
                    res.status(200).json({});
                }
            }
        });
    }
    else {
        res.render('developers/signin', {
            user: 'developer',
            message: [{ msg: 'Developer unauthorized.' }]
        });
    }
});

/* Check if application's container is active */
router.get('/isActive', auth.auth.devIsAuth, function (req, res, next) {

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        isReachable(req.query.app_url).then(reachable => {
            res.status(200).json({ active: reachable });
        });
    }
    else {
        res.boom.unauthorized();
    }
});

/* Post a new issue in a specific repository of applciation's GitLab account */
router.post('/project/issues', auth.auth.devIsAuth, function (req, res, next) {

    var reg_user = req.username;

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {
        request.post({

            url: process.env.apps_vm_url + '/repos/project/' + req.body.app_id + '/issues',
            headers: {
                'TOKEN': req.session.developer_token
            },
            form: {
                title: 'Incorporate UI Component',
                labels: req.body.labels,
                description: req.body.description
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
                    var query1 = Developer.findOne({ username: reg_user });

                    query1.exec(function (err, dev) {
                        if (err) {
                            res.boom.notAcceptable(err);
                        }
                        else {

                            var component = new Component({ id: JSON.parse(response.body).issues.id, code: req.body.description, owner: dev._id, repo_id: req.body.app_id, tags: req.body.labels.split(",") });

                            component.save(function (err, comp) {
                                if (err) {
                                    res.boom.notAcceptable(err);
                                }
                                else {
                                    var query2 = Application.findOne({ owner: dev._id, repo_id: req.body.app_id });

                                    query2.exec(function (err, app) {
                                        if (err) {
                                            res.boom.notAcceptable(err);
                                        }
                                        else {
                                            Application.update(
                                                { "_id": app._id },
                                                { "$push": { "components": req.body.labels.split(",")[1] } },
                                                function (err, raw) {
                                                    if (err) res.boom.notAcceptable(err);
                                                    res.status(200).json({ component: comp });
                                                }
                                            );
                                        }
                                    });

                                }
                            });
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

/* Delete a specific repository issue from GitLab account */
router.post('/project/issues/deleteIssue', auth.auth.devIsAuth, function (req, res, next) {

    var reg_user = req.username;

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {
        request.post({

            url: process.env.apps_vm_url + '/repos/project/' + req.body.app_id + '/issues/' + req.body.issue_id,
            headers: {
                'TOKEN': req.session.developer_token
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
                    var query1 = Developer.findOne({ username: reg_user });

                    query1.exec(function (err, dev) {
                        if (err) {
                            res.boom.notAcceptable(err);
                        }
                        else {
                            Component.findOneAndRemove({ id: req.body.issue_id }, function (err, comp) {
                                if (err) {
                                    res.boom.notAcceptable(err);
                                }
                                else {

                                    var query2 = Application.findOne({ owner: dev._id, repo_id: req.body.app_id });

                                    query2.exec(function (err, app) {
                                        if (err) {
                                            res.boom.notAcceptable(err);
                                        }
                                        else {
                                            Application.update(
                                                { "_id": app._id },
                                                { "$pullAll": { "components": [comp.tags[1]] } },
                                                function (err, raw) {
                                                    if (err) res.boom.notAcceptable(err);
                                                    res.status(200).json({});
                                                }
                                            );
                                        }
                                    });
                                }
                            });
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

/* Get all the favorite saved components for a specific application */
router.get('/project/issues/components/:app_id', auth.auth.devIsAuth, function (req, res, next) {

    var reg_user = req.username;

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        var query1 = Developer.findOne({ username: reg_user });

        query1.exec(function (err, dev) {

            if (err) {
                res.boom.notAcceptable(err);
            }
            else {

                var query2 = Component.find({ owner: dev._id, repo_id: req.params.app_id });

                query2.exec(function (err, components) {
                    if (err) {
                        res.boom.notAcceptable(err);
                    }
                    else {
                        res.status(200).json({ components: components });
                    }
                });

            }
        });
    }
    else {
        res.boom.unauthorized();
    }

});

/* Get all favorite components of specific user */
router.get('/favorite_components/all', auth.auth.devIsAuth, function (req, res, next) {

    var reg_user = req.username;

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        var query1 = Developer.findOne({ username: reg_user });

        query1.exec(function (err, dev) {

            if (err) {
                res.boom.notAcceptable(err);
            }
            else {
                var query2 = Component.find({ owner: dev._id });

                query2.exec(function (err, components) {
                    if (err) {
                        res.boom.notAcceptable(err);
                    }
                    else {
                        res.status(200).json(components);
                    }
                });
            }
        });
    }
    else {
        res.boom.unauthorized();
    }
});

/* Get all the repositories' open issues */
router.get('/dashboard/openIssues', auth.auth.devIsAuth, function (req, res, next) {
    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {
        request.get({

            url: process.env.apps_vm_url + '/repos/project/issues/all/opened',
            headers: {
                'TOKEN': req.session.developer_token
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
    else {
        res.boom.unauthorized();
    }
});

/* Get all the repositories' commits */
router.get('/dashboard/commits', auth.auth.devIsAuth, function (req, res, next) {

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {
        request.get({

            url: process.env.apps_vm_url + '/repos/project/commits/all',
            headers: {
                'TOKEN': req.session.developer_token
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
    else {
        res.boom.unauthorized();
    }
});

/* Get the current's month issues and commits from all repositories */
router.get('/dashboard/latestEvents', auth.auth.devIsAuth, function (req, res, next) {

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {
        request.get({

            url: process.env.apps_vm_url + '/repos/project/info/lastmonth',
            headers: {
                'TOKEN': req.session.developer_token
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
    else {
        res.boom.unauthorized();
    }
});

/* Get all the issues from last month */
router.get('/dashboard/issues/lastmonth', auth.auth.devIsAuth, function (req, res, next) {

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {
        request.get({

            url: process.env.apps_vm_url + '/repos/project/issues/lastmonth/detailed',
            headers: {
                'TOKEN': req.session.developer_token
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
    else {
        res.boom.unauthorized();
    }
});

/* Get all the commits from last month */
router.get('/dashboard/commits/lastmonth', auth.auth.devIsAuth, function (req, res, next) {

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {
        request.get({

            url: process.env.apps_vm_url + '/repos/project/commits/lastmonth/detailed',
            headers: {
                'TOKEN': req.session.developer_token
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
    else {
        res.boom.unauthorized();
    }
});

/* Get active containers number */
router.get('/dashboard/activeContainers', auth.auth.devIsAuth, function (req, res, next) {

    var reg_user = req.username;

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        var query = Container.find({ owner: reg_user, active: true });

        query.exec(function (err, containers) {
            if (err) {
                res.boom.notAcceptable(err);
            }
            else {
                res.status(200).json({ containers: containers });
            }
        });

    }
    else {
        res.boom.unauthorized();
    }
});

// needs req.query.datasetName and req.query.separator
/* Upload a new Open Dataset */
router.post('/datasets/uploadDataset', auth.auth.devIsAuth, upload.single('file'), function (req, res, next) {

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        if (!req.query.datasetName || !req.query.separator) {
            res.boom.badRequest('You shoud provide datasetName and separator!')
        } else {
            request.post({

                url: process.env.apps_vm_url + `/datasets/uploadDataset?datasetName=${req.query.datasetName}&separator=${req.query.separator}`,
                headers: {
                    'TOKEN': req.session.developer_token
                },
                form: {
                    file: req.file
                }
            }, function (error, response, body) {

                if (error) {

                    res.boom.resourceGone('Cannot communicate with applications module');
                }
                else {

                    if (!(String(response.statusCode).startsWith('2'))) {
                        res.status(response.statusCode).json(response.body);
                    }
                    else {
                        res.status(200).json(response.body);
                    }
                }
            });
        }
    }
    else {
        res.boom.unauthorized();
    }
});

// needs req.query.datasetName and req.query.separator
/* Import a previous uploaded Open Dataset in order to RESTify */
router.post('/datasets/importDataset', auth.auth.devIsAuth, upload.single('file'), function (req, res, next) {
    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {
        if (!req.query.datasetName || !req.query.separator) {
            res.boom.badRequest('You shoud provide datasetName and separator!')
        } else {
            request.post({
                url: process.env.apps_vm_url + `/datasets/importDataset?datasetName=${req.query.datasetName}&separator=${req.query.separator}`,
                headers: {
                    'TOKEN': req.session.developer_token
                },
                form: {
                    file: req.file
                }
            }, function (error, response, body) {

                if (error) {

                    res.boom.resourceGone('Cannot communicate with applications module');
                }
                else {
                    if (!(String(response.statusCode).startsWith('2'))) {
                        res.status(response.statusCode).json(response.body);
                    }
                    else {
                        const _body = JSON.parse(req.body.jsonBody)
                        var dataset = new Dataset({
                            name: req.query.datasetName,
                            url: `http://${process.env.MY_IP_ADDRESS}:6092/api/v1/${req.query.datasetName}`,
                            description: _body.description,
                            locale: _body.locale,
                            ...(_body.curator ? { curator: _body.curator } : {}),
                            sample: JSON.parse(body).data_sample,
                            tags: _body.tags || [],
                            ...(
                                _body.schemaDotOrgType ?
                                    {
                                        schemaDotOrg: {
                                            type: _body.schemaDotOrgType,
                                            properties: _body.schemaDotOrgProperties
                                        }
                                    }
                                    : {}
                            )
                        });
                        dataset.save(function (err, data) {
                            if (err) {
                                res.boom.notAcceptable(err);
                            }
                            else {
                                res.status(200).json(JSON.parse(response.body));
                            }
                        });
                    }
                }
            });
        }
    }
    else {
        res.boom.unauthorized();
    }
});

/* Get all the available Open Datasets */
router.get('/datasets/getDatasets', auth.auth.devIsAuth, function (req, res, next) {

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        Dataset.find({}).exec(function (err, datasets) {
            if (err) {
                res.boom.notAcceptable(err);
            }
            else {
                res.status(200).json({ datasets: datasets })
            }
        });

    }
    else {
        res.boom.unauthorized();
    }
});

/* Upload a new Open Service */
router.post('/services/uploadService', auth.auth.devIsAuth, function (req, res, next) {
    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        var service = new Service(
            {
                name: req.body.name,
                url: req.body.url,
                description: req.body.description,
                endpoints: req.body.endpoints,
                tags: req.body.tags || [],
                locale: req.body.locale,
                ...(req.body.schemaDotOrg && req.body.schemaDotOrg.type ?
                    {
                        schemaDotOrg: {
                            type: req.body.schemaDotOrg.type
                        }
                    }
                    : {}),
                ...(req.body.curator ? { curator: req.body.curator } : {}),
            });

        service.save(function (err, data) {
            if (err) {
                res.boom.notAcceptable(err);
            }
            else {
                res.status(200).json({});
            }
        });

    }
    else {
        res.boom.unauthorized();
    }
});

/* Get all the available uploaded Open Services */
router.get('/services/getServices', auth.auth.devIsAuth, function (req, res, next) {

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {

        Service.find({}).exec(function (err, services) {
            if (err) {
                res.boom.notAcceptable(err);
            }
            else {
                res.status(200).json({ services: services })
            }
        });

    }
    else {
        res.boom.unauthorized();
    }
});

/* Delete open dataset */
router.delete('/datasets/deleteDataset/:datasetId', auth.auth.devIsAuth, function (req, res, next) {

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {
        Dataset.findByIdAndRemove(req.params.datasetId).exec(function (err, dataset) {
            if (err) {
                res.boom.notAcceptable(err);
            }
            else {
                res.status(200).json({ ok: true, message: 'Dataset Deleted' })
            }
        });
    }
    else {
        res.boom.unauthorized();
    }
});

/* Delete open service */
router.delete('/services/deleteService/:serviceId', auth.auth.devIsAuth, function (req, res, next) {

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {
        Service.findByIdAndRemove(req.params.serviceId).exec(function (err, service) {
            if (err) {
                res.boom.notAcceptable(err);
            }
            else {
                res.status(200).json({ ok: true, message: 'Service Deleted' })
            }
        });
    }
    else {
        res.boom.unauthorized();
    }
});

/* Add service entpoint */
router.patch('/services/addServiceEndpoint/:serviceId', auth.auth.devIsAuth, function (req, res, next) {

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {
        Service.findByIdAndUpdate(req.params.serviceId, {
            $push: {
                endpoints: req.body
            }
        }, { new: true }).lean().exec(function (err, service) {
            if (err) {
                res.boom.notAcceptable(err);
            }
            else {
                res.status(200).json({ ok: true, service })
            }
        });
    }
    else {
        res.boom.unauthorized();
    }
});

// req.query.endpointIndex
/* Remove service entpoint */
router.patch('/services/removeServiceEndpoint/:serviceId', auth.auth.devIsAuth, function (req, res, next) {

    if (req.auth === 'error') {
        res.boom.resourceGone('Cannot connect to applications module.');
    }
    else if (req.auth === true) {
        // Smart way to remove element of array by index
        const arrayInd = `endpoints.${req.query.endpointIndex}`
        const unsetObj = {}; unsetObj[arrayInd] = 1;
        Service.findByIdAndUpdate(req.params.serviceId, { $unset: unsetObj })
            .then(service => {
                if (service) {
                    return Service.findByIdAndUpdate(req.params.serviceId, { $pull: { "endpoints": null } }, { new: true }).lean().exec()
                } else {
                    return Promise.resolve(null)
                }
            })
            .then(service => {
                if (service) {
                    return res.status(200).json({ service })
                } else {
                    return res.status(404).json({ message: 'Service not found by id' })
                }
            })
            .catch(err => {
                res.boom.notAcceptable(err);
            })
    }
    else {
        res.boom.unauthorized();
    }
});

router.get('/localeList', (req, res, next) => {
    return res.status(200).json({ locales: localeList })
})


module.exports = router;