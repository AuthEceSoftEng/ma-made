'use strict';

var app = angular.module('maApp');

app.controller('ServicesCtrl', ['$scope', '$http', 'Notification',
  function ($scope, $http, Notification) {
    const ct = this;

    ct.hasSearched = false;

    ct.getServices = function () {

      ct.hasSearched = true;

      $http({
        method: 'GET',
        url: '/services/search/' + ct.keyword
      }).then(function success(res) {

        ct.services_info = JSON.parse(res.data);

      }, function error(res) {

        //alert('fail');

      });
    };


  }
]);