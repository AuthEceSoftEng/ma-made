var request = require('request');

var auth = {
    
    devIsAuth: function(req, res, next){
        
        request.get({
            url: process.env.apps_vm_url + '/auth',
            headers: {
                'TOKEN': req.session.developer_token
            }
        }, function(error, response, body){

            if(error){
                req.auth = "error";
            }
            else{
                if (response.statusCode != 200){
                    req.auth = false;
                }
                else{
                    req.auth = true;
                    req.username = JSON.parse(response.body).user.username;
                }
            }
            return next();
        });
    },
    devIsAuth2: function(req, res, next){
        
        request.get({
            url: process.env.apps_vm_url + '/auth',
            headers: {
                'TOKEN': req.get('TOKEN')
            }
        }, function(error, response, body){

            if(error){
                req.auth = "error";
            }
            else{
                if (response.statusCode != 200){
                    req.auth = false;
                }
                else{
                    req.auth = true;
                    req.username = JSON.parse(response.body).user.username;
                }
            }
            return next();
        });
    },
    devIsAuth3: function(req, res, next){
        
        request.get({
            url: process.env.apps_vm_url + '/auth',
            headers: {
                'TOKEN': req.session.developer_token
            }
        }, function(error, response, body){

            if(error){
                req.auth = "error";
            }
            else{
                if (response.statusCode != 200){
                    req.auth = false;
                }
                else{
                    req.auth = true;
                    req.username = JSON.parse(response.body).user.username;
                    req.name = JSON.parse(response.body).user.name;
                    req.email = JSON.parse(response.body).user.email;
                    req.avatar = JSON.parse(response.body).user.avatar_url;
                    req.id = JSON.parse(response.body).user.id;
                }
            }
            return next();
        });
    }
}

module.exports.auth = auth;