const express = require('express');
const router = express.Router();
const auth = require('../utilities/auth');

const Developer = require('../models/developers');
const Design = require('../models/design');

/**
 * @description Get design data of an app for a developer
 * @param req.query.developerUsername
 * @param req.query.applicationId
 */
router.get('/', auth.auth.devIsAuth, (req, res, next) => {
  if (req.auth === 'error') {
    res.boom.resourceGone('Cannot connect to applications module.');
  } else if (req.auth === true) {
    Developer.findOne({ username: req.query.developerUsername })
      .then(developer => {
        if (developer) {
          return Design.findOne({
            owner: developer._id,
            application: req.query.applicationId,
          }).populate('selectedComponents').populate('selectedDatasets').populate('selectedServices').populate('vegaPlots.dataset')
        } else {
          return Promise.reject('Developer not found')
        }
      })
      .then(data => {
        return res.json(data);
      })
      .catch(err => {
        console.log(err)
        res.boom.notAcceptable(err);
      })
  } else {
    res.boom.unauthorized();
  }
})

/**
 * @description Create a new design app object
 * @param req.query.developerUsername
 * @param req.query.applicationId
 */
router.post('/', auth.auth.devIsAuth, (req, res, next) => {
  if (req.auth === 'error') {
    res.boom.resourceGone('Cannot connect to applications module.');
  } else if (req.auth === true) {
    Developer.findOne({ username: req.query.developerUsername })
      .then(developer => {
        if (developer) {
          return new Design({
            owner: developer._id,
            application: req.query.applicationId,
            sketch: {
              grid: {
                rows: [{ cols: [{ type: 'empty' }] }],
              }
            }
          }).save()
        } else {
          return Promise.reject('Developer not found')
        }
      })
      .then(data => {
        return res.json(data);
      })
      .catch(err => {
        console.log(err)
        res.boom.notAcceptable(err);
      })
  } else {
    res.boom.unauthorized();
  }
})

/**
 * @description Patch a design object
 * @param req.params.id
 */
router.patch('/:id', auth.auth.devIsAuth, (req, res, next) => {
  if (req.body._id) delete req.body._id;
  if (req.auth === 'error') {
    res.boom.resourceGone('Cannot connect to applications module.');
  } else if (req.auth === true) {
    Design.findById(req.params.id)
      .then(design => {
        if (design) {
          return Design.findByIdAndUpdate(req.params.id, {
            $set: req.body
          }, { new: true })
        } else {
          return Promise.reject('Design id not found!')
        }
      })
      .then(design => {
        return res.json(design)
      })
      .catch(err => {
        console.log(err)
        res.boom.notAcceptable(err);
      })
  } else {
    res.boom.unauthorized();
  }
})

/**
 * @description Patch the vegaGraphs 
 * @param req.params.id
 * @param req.query.action 'ADD', 'EDIT', 'DELETE'
 * @param req.query.graphId (if 'EDIT' or 'DELETE')
 */
router.patch('/:id/graph', auth.auth.devIsAuth, (req, res, next) => {
  if (req.body._id) delete req.body._id;
  if (req.auth === 'error') {
    res.boom.resourceGone('Cannot connect to applications module.');
  } else if (req.auth === true) {
    Design.findById(req.params.id)
      .then(design => {
        if (design) {
          if (req.body.vegaData && req.body.vegaData.$schema) {
            req.body.vegaData.schema = req.body.vegaData.$schema;
            delete req.body.vegaData.$schema;
          }
          switch (req.query.action) {
            case 'ADD':
              return Design.findByIdAndUpdate(req.params.id, {
                $push: {
                  vegaPlots: req.body
                  // {
                  //   ...req.body,
                  //   dataset: req.body.dataset._id
                  // }
                }
              }, { new: true }).populate('selectedComponents').populate('selectedDatasets')
            case 'EDIT':

              break;
            case 'DELETE':

              break;

            default:
              return res.boom.badRequest('Action should be Add, Edit or Delete!');
          }
          // return Design.findByIdAndUpdate(req.params.id, {
          //   $set: req.body
          // }, { new: true })
        } else {
          return Promise.reject('Design id not found!')
        }
      })
      .then(design => {
        return res.json(design)
      })
      .catch(err => {
        console.log(err)
        res.boom.notAcceptable(err);
      })
  } else {
    res.boom.unauthorized();
  }
})

/**
 * @description Add table view 
 * @param req.params.id
 * @param req.body - The table view to be added
 */
router.patch('/:id/add-table-view', auth.auth.devIsAuth, (req, res, next) => {
  if (req.body._id) delete req.body._id;
  if (req.auth === 'error') {
    res.boom.resourceGone('Cannot connect to applications module.');
  } else if (req.auth === true) {
    Design.findById(req.params.id)
      .then(design => {
        if (design) {
          return Design.findByIdAndUpdate(req.params.id, {
            $push: {
              tableViews: req.body
            }
          }, { new: true })
        } else {
          return Promise.reject('Design id not found!')
        }
      })
      .then(design => {
        return res.json(design)
      })
      .catch(err => {
        console.log(err)
        res.boom.notAcceptable(err);
      })
  } else {
    res.boom.unauthorized();
  }
})

/**
 * @description Add instance view 
 * @param req.params.id
 * @param req.body - The instance view to be added
 */
router.patch('/:id/add-instance-view', auth.auth.devIsAuth, (req, res, next) => {
  if (req.body._id) delete req.body._id;
  if (req.auth === 'error') {
    res.boom.resourceGone('Cannot connect to applications module.');
  } else if (req.auth === true) {
    Design.findById(req.params.id)
      .then(design => {
        if (design) {
          return Design.findByIdAndUpdate(req.params.id, {
            $push: {
              instanceViews: req.body
            }
          }, { new: true })
        } else {
          return Promise.reject('Design id not found!')
        }
      })
      .then(design => {
        return res.json(design)
      })
      .catch(err => {
        console.log(err)
        res.boom.notAcceptable(err);
      })
  } else {
    res.boom.unauthorized();
  }
})

module.exports = router;