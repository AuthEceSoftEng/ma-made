const express = require('express');
const operations = require('./utilities/operations');
const router = express.Router();

router.use(function (req, res, next) {
  //Perform operations as preprocessing step
  // e.g. operations.get_quantile(req.body.data.ttt, 0.5)
  next()
});

module.exports = router;