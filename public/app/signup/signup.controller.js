'use strict';

var app = angular.module('maApp');

app.controller('SignUpCtrl', ['$scope',
  function ($scope) {
    const ct = this;

    ct.currentForm = 1;
    ct.setForm = function (formIdx) {
      ct.currentForm = formIdx;
    };
  }
]);
