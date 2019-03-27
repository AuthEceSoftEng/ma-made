var request = require('request');

var containers_actions = {
    
    get_available_port: function(exitCode){

        var send = {};
    
        request.get({

                url: 'http://localhost:5000/containers/availablePort',

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
                        send["info"] = output["info"];
                        
                        return exitCode(send); 
                    }
                    else{

                        send["routerStatus"] = "Failure";
                        send["routerMessage"] = "Apps VM route failed";

                        return exitCode(send);   
                    }
                }
        });
    },
    deploy_container: function(app_id, image_tag, port, exitCode){
        
        var send = {};
        
        request.get({

                url: 'http://localhost:5000/containers/deploy/' + app_id + '/' + image_tag + '/' + port,

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
                        send["info"] = {}
                        send["info"] = output["info"];
                        
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

module.exports.containers_actions = containers_actions;