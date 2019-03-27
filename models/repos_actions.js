var request = require('request');

var repos_actions = {
    
    create_repo: function(repo_name, exitCode){

        var send = {};
    
        request.get({

                url: 'http://localhost:5000/repositories/create/' + repo_name,

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
                        send["info"]["repository_details"] = output["info"]["info"];
                        
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

module.exports.repos_actions = repos_actions;