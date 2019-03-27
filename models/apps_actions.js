var request = require('request');

var apps_actions = {
    
    get_name_by_id: function(app_id, exitCode){

        var send = {};
    
        request.get({

                url: 'http://localhost:5000/applications/name/' + app_id,

            }, function(error, response, body){

                if(error){

                    send["routerStatus"] = "Failure";
                    send["routerMessage"] = "Internal Error";

                    return exitCode(send);
                }
                else{

                    var output = JSON.parse(body);

                    if (output["routerStatus"] == "Success"){
                        
                        send["routerStatus"] = "Success";
                        send["info"] = {};
                        send["info"]["app_name"] = output["info"];
                        
                        return exitCode(send); 
                    }
                    else{

                        send["routerStatus"] = "Failure";
                        send["routerMessage"] = "Apps VM route failed";

                        return exitCode(send);   
                    }
                }
        });
    }
}

module.exports.apps_actions = apps_actions;