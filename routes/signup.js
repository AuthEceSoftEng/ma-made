var express = require('express');
var router = express.Router();


router.get('/developers', function(req, res, next) {
    
    res.render('developers/signup', {
        
    });
});

module.exports = router;