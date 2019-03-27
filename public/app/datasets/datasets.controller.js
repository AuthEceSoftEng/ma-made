'use strict';

var app = angular.module('maApp');

app.controller('OpenDatasetsCtrl', ['$scope', '$http', 'Notification',
    function ($scope, $http, Notification) {
        const ct = this;
        
        ct.hasSearched = false;
        
        ct.getDatasets = function (){
            
            ct.hasSearched = true;

            $http({
                method: 'GET',
                url: '/datasets/list',
                params:{
                    category: ct.category,
                    publisher: ct.publisher,
                    licence: ct.licence,
                    language: ct.language
                }
                
            }).then(function success(res){
                
                var datasets = JSON.parse(res.data);
                
                ct.datasets_info = {};
                ct.datasets_info['info'] = [];
                
                for (var i = 0; i < datasets.result.results.length; i++){
                    
                    ct.datasets_info['info'].push(datasets.result.results[i]);
                }
                
            }, function error(res){
                
                Notification.error('Cannot communicate with OGDSAM.');
                
            });
        };
        
        /* Get a list of available publishers */
        ct.getPublishers = function (){
            
            $http({
                method: 'GET',
                url: '/datasets/publishers/list'
                
            }).then(function success(res){
                
                ct.publishers = res.data;
                
            }, function error(res){
                
                Notification.error('Cannot communicate with OGDSAM.');
                
            });
        };
        
        ct.getPublishers();
        
        /* Get a list of available licences */
        ct.getLicenses = function (){
            
            $http({
                method: 'GET',
                url: '/datasets/licenses/list'
                
            }).then(function success(res){
                
                ct.licenses = res.data;
                
            }, function error(res){
                
                Notification.error('Cannot communicate with OGDSAM.');
                
            });
        };
        
        ct.getLicenses();
        
        ct.getUsedLanguages = function (){
            
            $http({
                method: 'GET',
                url: '/datasets/languages/list'
                
            }).then(function success(res){
                
                ct.languages = res.data;
                
            }, function error(res){
                
                Notification.error('Cannot communicate with OGDSAM.');
                
            });
        };
        
        ct.getUsedLanguages();
        
    }
]);