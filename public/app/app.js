'use strict';

var app = angular.module('maApp', [
    'ui.bootstrap',
    'angularFileUpload',
    'ui-notification',
    'angularModalService',
    'angularChart',
    'ngAnimate',
    'ngTagsInput'
]).config(function (NotificationProvider) {
    NotificationProvider.setOptions({
        delay: 10000,
        startTop: 20,
        startRight: 10,
        verticalSpacing: 20,
        horizontalSpacing: 20,
        positionX: 'right',
        positionY: 'bottom'
    });
});
