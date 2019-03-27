var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Mobile-Age Platform' });
});

/* GET signup page. */
router.get('/signUp/developer', function(req, res, next) {
  res.render('signup', {
    signUpAs: "developer"
  });
});

router.get('/signUp/odp', function(req, res, next) {
  res.render('signup', {
    signUpAs: "odp"
  });
});


module.exports = router;
