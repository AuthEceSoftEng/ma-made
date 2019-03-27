var request = require('request');

var db_procedures = {
    
    init_app: function(container_id, image_tag, app_id, repo_id, port, user, exitCode){

        var send = {};
    
        request.post({

            url: 'http://localhost:5000/dbactions/updateDB/initiateApp',
            form: {
                container_id: container_id,
                image_tag: image_tag,
                app_id: app_id,
                repo_id: repo_id,
                port: port,
                user: user
            }
        }, function(error, response, body){

            if (error){
                send["routerStatus"] = "Failure";
                send["routerMessage"] = "Internal Error";

                return exitCode(send);
            }
            else{
                
                var db_update = JSON.parse(body);

                if (db_update['routerStatus'] == "Success"){

                    send["routerStatus"] = "Success";
                    send["routerMessage"] = "Database updated successfully";

                    return exitCode(send);
                }
                else{

                    send["routerStatus"] = "Failure";
                    send["routerMessage"] = "Update DB - initiateApp route failed";

                    return exitCode(send);
                }
            }
        });
    }
}

module.exports.db_procedures = db_procedures;