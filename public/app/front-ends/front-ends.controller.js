'use strict';

var app = angular.module('maApp');

app.controller('FrontEndsCtrl', ['$scope', '$http', 'Notification',
    function ($scope, $http, Notification) {
        const ct = this;
        
        ct.res = [];
        
        ct.getFrontEnds = function (){
            
            $http({
                method: 'GET',
                url: '/frontends/list'
            }).then(function success(res){
                
                //alert(res.data);
                var info = JSON.parse(res.data);
                //alert(info.total_rows);
                ct.res = res;
                
                ct.frontEnds = {};
                ct.frontEnds['info'] = [];
                
                for (var i = 0; i < info.total_rows; i++){
                    
                    var component_id = info.rows[i].id;
                    $http({
                        method: 'GET',
                        url: '/frontends/info/' + component_id
                    }).then(function success(result){
                        
                        ct.frontEnds['info'].push(JSON.parse(result.data));
                        
                    }, function error(res){

                    });
                    
                }
                
            }, function error(res){
                
            });
        };
        
        ct.getFrontEnds();
    }
]);