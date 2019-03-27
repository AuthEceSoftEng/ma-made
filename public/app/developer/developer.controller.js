'use strict';

var app = angular.module('maApp');
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];


window.onbeforeunload = () => {
  return window.location.href.includes('/developers/design') ?
    'Are you sure you want to leave the design?'
    :
    null
}

app.directive('fileModel', ['$parse', function ($parse) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var model = $parse(attrs.fileModel);
      var modelSetter = model.assign;

      element.bind('change', function () {
        scope.$apply(function () {
          modelSetter(scope, element[0].files[0]);
        });
      });
    }
  };
}]);

app.controller('DeveloperCtrl', ['$scope',
  function ($scope) {
    const ct = this;
  }
]);

app.controller('DevDashboardCtrl', ['$rootScope', '$q', '$document', '$window', '$scope', '$http', 'FileUploader', 'Notification', '$uibModal', '$sce',
  function ($rootScope, $q, $document, $window, $scope, $http, FileUploader, Notification, $uibModal, $sce) {
    $scope.trustAsHtml = $sce.trustAsHtml
    new ClipboardJS('.btn-data-clipboard-text');

    const ct = this;
    ct.username = 'Unidentified user';
    ct.fileTree = [];
    ct.appUrl = '';
    ct.data = [];
    ct.data2 = [];
    ct.model = {};
    ct.latestEvents = [];
    ct.components = [];
    ct.promiseArray = [];
    ct.isLoading = true;
    ct.showSchema = false;
    ct.schema = {};
    ct.endpoints = [];
    ct.canSync = true;
    ct.canDeploy = false;
    ct.canStop = false;
    ct.canPreview = false;
    ct.installDepBtnText = 'Install Dependencies';
    ct.installDepLoading = false;
    ct.syncBtnText = 'Synchronize Code';
    ct.syncLoading = false;
    ct.deployBtnText = 'Deploy Application';
    ct.deployLoading = false;
    ct.stopBtnText = 'Stop Application';
    ct.stopLoading = false;
    ct.uiComponent = {};

    const date = new Date();
    ct.curMonth = months[date.getMonth()];
    ct.year = date.getFullYear();

    // For uploading app
    ct.appTags = []

    // For uploading datasets and services
    ct.datasetAndServicefilterInput = '';
    ct.uploadTags = [];
    ct.schemaDotOrgTypes = [];
    ct.schemaDotOrgProperties = [];
    ct.localeList = [];

    // Open datasets
    ct.openDatasetForModal = undefined;
    ct.openServiceForModal = undefined;
    ct.datasetSeparatorInput = ','
    ct.addNewServiceEndPoint = { example: {} }

    /* Design app variables */
    ct.designApp = {
      activeTab: 0,

      designId: undefined,
      myApps: [],
      myFavoriteComponents: [],
      myDatasets: [],
      myServices: [],
      selectedApp: undefined,
      selectedComponents: [],
      selectedComponentsBackup: [],
      selectedDatasets: [],
      selectedServices: [],
      datasetToVisualize: undefined,
      datasetToVisualizeRawInitial: undefined,
      datasetToVisualizeRaw: undefined,
      dataColumnsToVisualize: [],
      selectedGraph: undefined,
      selectedColForVegaOperation: undefined,
      currentPlottedGraph: undefined,
      savedGraphs: [],
      showSaveGraphPopover: false,
      isSavedGraphsCollapsed: true,
      // Last things for hackathon...
      // dataTablesViews_
      dataTablesViews_datasetToVisualize: undefined,
      dataTablesViews_dataColumnsToVisualize: [],
      dataTablesViews_showSaveNewPopover: false,
      dataTablesViews_saveNewName: undefined,
      dataTableViews_savedTables: [],

      // Data instances
      dataInstancesViews_datasetToVisualize: undefined,
      dataInstancesViews_dataColumnsToVisualize: [],
      dataInstancesViews_showSaveNewPopover: false,
      dataInstancesViews_saveNewName: undefined,
      dataInstancesViews_savedInstances: [],
    }

    // Analytics
    ct.lighthouseAudits = []

    const VEGA_PORT = 2082;
    const SKETCH_APP_PORT = 2086;
    const SCHEMA_DOT_ORG_PORT = 2052;


    /**
     * *******************
     * ********** **Full Screen Spinner Modal Controller** *******************
     * *******************
     */
    ct.showFullScreenSpinner = function () {
      ct.fullScreenSpinner = $uibModal.open({
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        backdrop: 'static',
        templateUrl: 'fullScreenModal.html',
        size: 'lg',
        scope: $scope,
        windowClass: 'background-transparent my-modal-centered'
      });
      ct.fullScreenSpinner.result.then(() => { }).catch((err) => { console.log(err) })
    }

    ct.closeFullScreenSpinner = function () {
      ct.fullScreenSpinner.close();
    }

    // Upload functionality in order to upload a new dataset
    $scope.uploadFile = function () {
      var file = $scope.datasetFile;
      var fd = new FormData();
      fd.append('file', file);
      ct.uploadDataLoading = true;
      ct.description = $('#inputDesc').val();
      ct.importDataFailLogs = false;
      ct.showSchema = false;

      if (file === undefined) {
        Notification.error('You should upload a file');
        ct.uploadDataLoading = false;
      }
      else if (!ct.datasetSeparatorInput || ct.datasetSeparatorInput === '') {
        Notification.error('You should select a dataset separator!');
        ct.uploadDataLoading = false;
      }
      else if (!ct.datasetNameInput || ct.datasetNameInput === '') {
        Notification.error('You should give a dataset name!');
        ct.uploadDataLoading = false;
      } else if (!ct.datasetNameInput.match(/^([0-9]|[a-z])+([0-9a-z]+)$/i)) {
        Notification.error('Dataset name should contain only letters & numbers without spaces!');
        ct.uploadDataLoading = false;
      }
      else if (ct.description === '') {
        Notification.error('You should give a description of data');
        ct.uploadDataLoading = false;
      } else if (!ct.locale || ct.locale === '') {
        Notification.error('You should provide a dataset locale');
        ct.uploadDataLoading = false;
      } else if (ct.curator && ct.curator.isThirdParty && (!ct.curator.name || ct.curator.name === '')) {
        Notification.error('You should provide the dataset curator name!');
        ct.uploadDataLoading = false;
      }
      else {
        jQuery.ajax({
          url: `/applications/datasets/uploadDataset?datasetName=${ct.datasetNameInput}&separator=${ct.datasetSeparatorInput}`,
          data: fd,
          cache: false,
          contentType: false,
          processData: false,
          method: 'POST',
          type: 'POST',
          success: function (res) {
            ct.showSchema = true;
            ct.schema = JSON.parse(res).schema;
            ct.uploadDataLoading = false;
            ct.data_sample = JSON.parse(res).data_sample;

            Notification.success('Upload data successful');
          },
          error: function (res) {
            ct.uploadDataLoading = false;

            Notification.error('Upload data failed: ' + JSON.parse(res.responseJSON).log);
          }
        });
      }

    };

    // Import data after successfull uploading and revisioning
    ct.importData = function () {
      ct.importDataLoading = true;
      var file = $scope.datasetFile;
      var fd = new FormData();
      fd.append('file', file);
      fd.append('jsonBody', JSON.stringify({
        schema: ct.schema,
        description: ct.description,
        locale: ct.locale,
        ...(ct.curator ? { curator: ct.curator } : {}),
        tags: ct.uploadTags || [],
        data_sample: ct.data_sample,
        ...(
          ct.schemaDotOrgType ?
            {
              schemaDotOrg: {
                type: ct.schemaDotOrgType,
                properties: Object.keys(ct.schema).map(k =>
                  ({
                    key: k,
                    ...(ct.schema[k].property ? { property: ct.schema[k].property } : {})
                  }))
              }
            }
            : {}
        )
      }))
      jQuery.ajax({
        url: `/applications/datasets/importDataset?datasetName=${ct.datasetNameInput}&separator=${ct.datasetSeparatorInput}`,
        data: fd,
        cache: false,
        contentType: false,
        processData: false,
        method: 'POST',
        type: 'POST',
        success: function (res) {
          ct.showSchema = false;
          var input = $("#inputFile");
          input.replaceWith(input.val(null));
          $('#datasetNameInput').val('');
          $('#inputDesc').val('');
          ct.importDataLoading = false;
          ct.importDataFailLogs = false;
          Notification.success('Import data successful');
          window.location.replace('/developers/open_datasets')
        },
        error: function (res) {
          ct.failLogs = JSON.parse(res.data).log;
          ct.importDataLoading = false;
          ct.importDataFailLogs = true;
          Notification.error('Import data failed');
        }
      });
    };

    // Get the available uploaded datasets
    ct.getDatasets = function () {
      $http({
        method: 'GET',
        url: '/applications/datasets/getDatasets'
      }).then(function success(res) {
        ct.datasets = res.data.datasets;
        if (ct.fullScreenSpinner) {
          ct.closeFullScreenSpinner();
        }
      }, function error(res) {
        if (ct.fullScreenSpinner) {
          ct.closeFullScreenSpinner();
        }
        Notification.error('Cannot communicate with database');
      })
    };

    // Functionality of uploading a new API Service
    ct.addNewService = function (name, url, description) {
      if (name === '' || url == undefined || description === '' || ct.endpoints[0].method === '' || ct.endpoints[0].endpoint === '' || ct.endpoints[0].description === '') {
        Notification.error('Please fill all the required fields.');
      } else if (!ct.locale || ct.locale === '') {
        Notification.error('You should provide a service locale');
      } else if (ct.curator && ct.curator.isThirdParty && (!ct.curator.name || ct.curator.name === '')) {
        Notification.error('You should provide the service curator name!');
      }
      else {
        $http({
          method: 'POST',
          url: '/applications/services/uploadService',
          data: {
            name: name,
            url: url,
            description: description,
            endpoints: ct.endpoints,
            tags: ct.uploadTags || [],
            locale: ct.locale,
            ...(
              ct.schemaDotOrgType ?
                {
                  schemaDotOrg: {
                    type: ct.schemaDotOrgType
                  }
                }
                : {}
            ),
            ...(ct.curator ? { curator: ct.curator } : {}),
          }
        }).then(function success(res) {
          Notification.success('Service uploaded successfully.');
          $scope.name = '';
          $scope.url = '';
          $scope.description = '';
          ct.endpoints = [];
          ct.addNewEndpoint();
          window.location.replace('/developers/open_services')
        }, function error(res) {
          Notification.error('Could not add the new Service: ' + res.err);
        });
      }
    };

    // Add a new endpoint to the Service's upload endpoint list 
    ct.addNewEndpoint = function () {
      let newEndpoint = {
        'method': 'GET',
        'endpoint': '',
        'description': '',
        'example': {
          'request': '',
          'response': ''
        }
      };

      if (ct.endpoints.length > 0) {
        let lastElement = ct.endpoints[ct.endpoints.length - 1];

        if (lastElement.method === '' || lastElement.endpoint === '' || lastElement.description === '') {
          Notification.error('Please fill all the required fields.')
        } else {
          ct.endpoints.push(newEndpoint);
        }
      } else {
        ct.endpoints.push(newEndpoint);
      }
    };

    // Get all available uplaoded Services
    ct.getServices = function () {
      $http({
        method: 'GET',
        url: '/applications/services/getServices'
      }).then(function success(res) {
        ct.services = res.data.services;
      }, function error(res) {
        Notification.error('Cannot communicate with database');
      })
    };

    // Remove last endpoint from Service's upload endpoint list (except the first)
    ct.removeLastEndpoint = function () {
      ct.endpoints.pop();
    }

    // Get all the open issues from GitLab repositories
    ct.getOpenIssues = function () {
      ct.promiseArray.push($http({
        method: 'GET',
        url: '/applications/dashboard/openIssues'
      }).then(function success(res) {
        ct.openIssues = JSON.parse(res.data).issues;
      }));
    };

    // Get the number of all repo commits from GitLab repositories 
    ct.getCommits = function () {
      ct.promiseArray.push($http({
        method: 'GET',
        url: '/applications/dashboard/commits'
      }).then(function success(res) {
        ct.commits = JSON.parse(res.data).commits;
      }));
    };

    // Get the issues and commits of current month and show in Main Dashboard
    ct.getLatestEventsInfo = function () {
      ct.promiseArray.push($http({
        method: 'GET',
        url: '/applications/dashboard/latestEvents'
      }).then(function success(res) {
        ct.latestEvents = JSON.parse(res.data).info.sort((leftSide, rightSide) => {
          if (leftSide.timestamp < rightSide.timestamp) return 1;
          if (leftSide.timestamp > rightSide.timestamp) return -1;
          return 0;
        });
      }));
    };

    // Get the number of active application containers
    ct.getActiveContainers = function () {
      ct.promiseArray.push($http({
        method: 'GET',
        url: '/applications/dashboard/activeContainers'
      }).then(function success(res) {
        ct.activeContainers = res.data.containers.length;
      }));
    };

    // Get all the last month issues from GitLab repository 
    ct.getIssuesLastMonth = function () {
      ct.promiseArray.push($http({
        method: 'GET',
        url: '/applications/dashboard/issues/lastmonth'
      }).then(function success(res) {
        ct.issuesLastMonth = JSON.parse(res.data).issues;
      }));
    };

    // Get all the last month commits from GitLab repository
    ct.getCommitsLastMonth = function () {
      ct.promiseArray.push($http({
        method: 'GET',
        url: '/applications/dashboard/commits/lastmonth'
      }).then(function success(res) {
        ct.commitsLastMonth = JSON.parse(res.data).commits;
      }));
    };


    /* Initialization of Main Dashboard, with latest issues, commits etc. 
       and also functionality and the initialization monthly report chart */

    ct.mainDashboardContent = function () {
      ct.getOpenIssues();
      ct.getCommits();
      ct.getLatestEventsInfo();
      ct.getActiveContainers();
      ct.getIssuesLastMonth();
      ct.getCommitsLastMonth();

      $q.all(ct.promiseArray).then(function () {
        ct.isLoading = false;

        setTimeout(function () {
          var monthlyCanvas = $('#monthlyChart').get(0).getContext('2d');
          // This will get the first returned node in the jQuery collection.
          var monthlyChart = new Chart(monthlyCanvas);

          var monthlyChartData = {
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31'],
            datasets: [
              {
                label: 'Issues',
                fillColor: 'rgb(210, 214, 222)',
                strokeColor: 'rgb(210, 214, 222)',
                pointColor: 'rgb(210, 214, 222)',
                pointStrokeColor: '#c1c7d1',
                pointHighlightFill: '#fff',
                pointHighlightStroke: 'rgb(220,220,220)',
                data: ct.issuesLastMonth
              },
              {
                label: 'Commits',
                fillColor: 'rgba(60,141,188,0.9)',
                strokeColor: 'rgba(60,141,188,0.8)',
                pointColor: '#3b8bba',
                pointStrokeColor: 'rgba(60,141,188,1)',
                pointHighlightFill: '#fff',
                pointHighlightStroke: 'rgba(60,141,188,1)',
                data: ct.commitsLastMonth
              }
            ]
          };

          var monthlyChartOptions = {
            // Boolean - If we should show the scale at all
            showScale: true,
            // Boolean - Whether grid lines are shown across the chart
            scaleShowGridLines: false,
            // String - Colour of the grid lines
            scaleGridLineColor: 'rgba(0,0,0,.05)',
            // Number - Width of the grid lines
            scaleGridLineWidth: 1,
            // Boolean - Whether to show horizontal lines (except X axis)
            scaleShowHorizontalLines: true,
            // Boolean - Whether to show vertical lines (except Y axis)
            scaleShowVerticalLines: true,
            // Boolean - Whether the line is curved between points
            bezierCurve: true,
            // Number - Tension of the bezier curve between points
            bezierCurveTension: 0.3,
            // Boolean - Whether to show a dot for each point
            pointDot: false,
            // Number - Radius of each point dot in pixels
            pointDotRadius: 4,
            // Number - Pixel width of point dot stroke
            pointDotStrokeWidth: 1,
            // Number - amount extra to add to the radius to cater for hit detection outside the drawn point
            pointHitDetectionRadius: 20,
            // Boolean - Whether to show a stroke for datasets
            datasetStroke: true,
            // Number - Pixel width of dataset stroke
            datasetStrokeWidth: 2,
            // Boolean - Whether to fill the dataset with a color
            datasetFill: true,
            // String - A legend template
            legendTemplate: '<ul class=\'<%=name.toLowerCase()%>-legend\'><% for (var i=0; i<datasets.length; i++){%><li><span style=\'background-color:<%=datasets[i].lineColor%>\'></span><%=datasets[i].label%></li><%}%></ul>',
            // Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
            maintainAspectRatio: true,
            // Boolean - whether to make the chart responsive to window resizing
            responsive: true
          };

          // Create the line chart
          monthlyChart.Line(monthlyChartData, monthlyChartOptions);
        }, 200);
      });
    };

    // Get information abput user's profile page from GitLab account
    ct.getProfileInfo = function () {
      $http({
        method: 'GET',
        url: '/developers/user/'
      }).then(function success(res) {
        ct.user_id = res.data.id;
        ct.username = res.data.username;
        ct.name = res.data.name;
        ct.email = res.data.email;
        ct.avatar = res.data.avatar;
      });
    };
    ct.getProfileInfo(); // Executed with every refresh in order to take photo and name from GitLab

    // Save the latest state of the dashboard in every refresh (in order to show the right page after that)
    ct.setMainDashboard = function (state, latency) {
      setTimeout(function () { sessionStorage.setItem("mainDashboard", state); }, latency);
    }

    // Get the previous saved state or set to true if it is the first time open that tab
    ct.getMainDashboard = function () {
      if (sessionStorage.getItem("mainDashboard") === null) {
        return 'true';
      } else {
        return sessionStorage.getItem("mainDashboard");
      }
    }

    // Save the application ID in case of refresh
    ct.setCurrentAppIdx = function (currentAppIdx) {
      sessionStorage.setItem("currentAppIdx", currentAppIdx);
    }

    // Get the previous saved application ID or else set to -1 if it is first time open that tab
    ct.getCurrentAppIdx = function () {
      if (sessionStorage.getItem("currentAppIdx") === null) {
        return -1;
      } else {
        return sessionStorage.getItem("currentAppIdx");
      }
    }

    // Save the application's container info in case of refresh
    ct.setContainer = function (state) {
      sessionStorage.setItem("container", state);
    }

    // Get the previous saved container's info or false if first time open taht tab
    ct.getContainer = function () {
      if (sessionStorage.getItem("container") === null) {
        return 'false';
      } else {
        return sessionStorage.getItem("container");
      }
    }

    // Get applciations deployment logs
    ct.getLogs = function () {

      ct.logs = {};
      ct.logs.container_logs = [];
      ct.logs.application_logs = [];
      var containers_actions_list = ["deploy_container", "start_container", "stop_container"]
      var application_actions_list = ["sync_workspace", "install_dependencies", "deploy_application", "stop_application"]
      //alert('test');
      $http({
        method: 'GET',
        url: '/log/list/' + ct.application_info._id
      }).then(function success(res) {

        for (var i = 0; i < res.data.logs.length; i++) {
          if (containers_actions_list.indexOf(res.data.logs[i].action) > 0) {
            ct.logs.container_logs.push(res.data.logs[i]);
          }
          else {
            ct.logs.application_logs.push(res.data.logs[i]);
          }
        }
      }, function error(res) {

      });
    };

    /*
    ct.logs={
        container_logs: [
            {
                id:'jshebfjeh8476hjbdabd',
                action: 'Start container',
                success: 1,
                timestamp: Date(new Date())
            },
            {
                id:'jshebfjeh8476hjbdabd',
                action: 'Stop container',
                success: 0,
                timestamp: Date(new Date())
            }
        ],
        application_logs: [
            {
                id:'jshebfjeh8476hjbdabd',
                action: 'Create Application',
                success: 1,
                timestamp: Date(new Date())
            },
            {
                id:'jshebfjeh8476hjbdabd',
                action: 'Synchronize Code',
                success: 1,
                timestamp: Date(new Date())
            },
            {
                id:'jshebfjeh8476hjbdabd',
                action: 'Deploy Application',
                success: 0,
                timestamp: Date(new Date())
            },
            {
                id:'jshebfjeh8476hjbdabd',
                action: 'Deploy Application',
                success: 1,
                timestamp: Date(new Date())
            },
            {
                id:'jshebfjeh8476hjbdabd',
                action: 'Stop Application',
                success: 1,
                timestamp: Date(new Date())
            }
        ],
        user_logs: [
            {
                id:'jshebfjeh8476hjbdabd',
                action: 'User creation',
                success: 1,
                timestamp: Date(new Date())
            },
            {
                id:'jshebfjeh8476hjbdabd',
                action: 'Login',
                success: 0,
                timestamp: Date(new Date())
            },
            {
                id:'jshebfjeh8476hjbdabd',
                action: 'Login',
                success: 1,
                timestamp: Date(new Date())
            }
        ]
    };*/

    // Sync repo content with application's container
    ct.sync = function (pass) {

      ct.syncBtnText = 'Syncing';
      ct.syncLoading = true;

      $http({
        method: 'POST',
        url: '/repositories/synchronize',
        data: {
          application: ct.application_info,
          container: ct.container_info,
          password: pass
        }
      }).then(function success(res) {

        ct.syncBtnText = 'Synchronize Code';
        ct.syncLoading = false;
        ct.canSync = true;
        ct.canDeploy = true;
        ct.canStop = false;
        ct.canPreview = false;
        ct.getLogs();

        ct.getFileTree(ct.application_info.repo_id);

        Notification.success('Synchronization successful');

      }, function error(res) {

        ct.syncBtnText = 'Synchronize Code';
        ct.syncLoading = false;
        ct.canSync = true;
        ct.canDeploy = false;
        ct.canStop = false;
        ct.canPreview = false;
        ct.getLogs();

        Notification.error('Synchronization failed');

      });
    };

    // Install dependencies inside application's containers
    ct.installAppDependencies = function () {

      ct.installDepBtnText = 'Installing';
      ct.installDepLoading = true;

      $http({
        method: 'PUT',
        url: '/applications/dependencies',
        data: {
          application: ct.application_info
        }
      }).then(function success(res) {

        ct.installDepBtnText = 'Install Dependencies';
        ct.installDepLoading = false;
        ct.canSync = true;
        ct.canDeploy = true;
        ct.canStop = false;
        ct.canPreview = false;
        ct.getLogs();

        ct.getFileTree(ct.application_info.repo_id);

        Notification.success('Dependencies installation successful');

      }, function error(res) {

        ct.installDepBtnText = 'Install Dependencies';
        ct.installDepLoading = false;
        ct.canSync = true;
        ct.canDeploy = false;
        ct.canStop = false;
        ct.canPreview = false;
        ct.getLogs();

        Notification.error('Dependencies installation failed');

      });
    };

    // Deploy the applciation inside application's container
    ct.deployApp = function () {

      ct.deployBtnText = 'Deploying';
      ct.deployLoading = true;

      $http({
        method: 'PUT',
        url: '/applications/deploy',
        data: {
          application: ct.application_info,
          container: ct.container_info,
        }
      }).then(function success(res) {

        ct.deployBtnText = 'Deploy Application';
        ct.deployLoading = false;
        ct.canDeploy = false;
        ct.canStop = true;
        ct.canPreview = true;
        ct.canSync = false;
        ct.getLogs();

        Notification.success('Deployment successful');

      }, function error(res) {

        ct.deployBtnText = 'Deploy Application';
        ct.deployLoading = false;
        ct.canDeploy = true;
        ct.canStop = false;
        ct.canPreview = false;
        ct.canSync = true;
        ct.getLogs();

        Notification.error('Deployment failed');

      });
    };

    // Stop applciation execution inside applciation's container
    ct.stopApp = function () {

      ct.stopBtnText = 'Stopping';
      ct.stopLoading = true;

      $http({
        method: 'PUT',
        url: '/applications/stop',
        data: {
          application: ct.application_info,
          container: ct.container_info,
        }
      }).then(function success(res) {

        ct.stopBtnText = 'Stop Application';
        ct.stopLoading = false;
        ct.canDeploy = true;
        ct.canStop = false;
        ct.canPreview = false;
        ct.canSync = true;
        ct.getLogs();

        Notification.success('Application stopped successfully');

      }, function error(res) {

        ct.stopBtnText = 'Stop Application';
        ct.stopLoading = false;

        ct.canDeploy = false;
        ct.canStop = true;
        ct.canPreview = true;
        ct.canSync = false;
        ct.getLogs();

        Notification.error('Application stop failed');

      });
    };

    ct.filesUploader = new FileUploader({
      queueLimit: 10,
    });

    ct.getPreconfImages = function () {

      $http({
        method: 'GET',
        url: '/containers/preconfList'
      }).then(function success(res) {

        ct.images = res.data.images;

      }, function error(res) {

        ct.images = [];
      });
    };

    ct.getPreconfImages();

    ct.getUsername = function () {

      $http({
        method: 'GET',
        url: '/developers'
      }).then(function success(res) {

        ct.username = res.data.username;
        ct.getMyApps();

      }, function error(res) {

        ct.username = 'Unidentified user';
      }, () => {

      });
    };

    ct.getUsername();

    ct.getMyApps = function () {
      $http({
        method: 'GET',
        url: '/applications/my_apps'
      }).then(function success(res) {
        ct.applications = res.data.apps;
        if (ct.fullScreenSpinner)
          ct.closeFullScreenSpinner();
      }, function error(res) {
        if (ct.fullScreenSpinner)
          ct.closeFullScreenSpinner();
        ct.applications = [{ name: 'error' }];
      });
    };

    ct.addAppLoading = false;
    ct.addAppBtnText = 'Add Application';

    ct.addApplication = function () {

      ct.addAppLoading = true;
      ct.addAppBtnText = 'In Progress';

      $http({
        method: 'POST',
        url: '/applications/' + ct.appName,
        data: {
          description: ct.appDescription,
          tags: ct.appTags
        }
      }).then(function success(res) {

        ct.getMyApps();
        ct.addAppLoading = false;
        ct.addAppBtnText = 'Add Application';
        Notification.success('Application ' + ct.appName + ' created successfully.');

        window.location.replace('/developers/my-applications')

      }, function error(res) {

        ct.addAppLoading = false;
        ct.addAppBtnText = 'Add Application';
        Notification.error('Create application ' + ct.appName + ' failed.');
      });

    };

    ct.getAppNameById = function (id) {
      const app = ct.applications && ct.applications.find(_app => _app._id === id);
      return app && app.name
    };

    ct.getContainerDetails = function (id) {

      $http({
        method: 'GET',
        url: '/containers/' + id + '/details'
      }).then(function success(res) {

        ct.container_info = res.data;

      }, function error(res) {

        ct.container_info = [];
      });

    };

    ct.getApplicationUrl = function (app_id) {

      $http({
        method: 'GET',
        url: '/applications/url/' + app_id
      }).then(function success(res) {

        ct.appUrl = res.data.application_url;
        ct.checkIfAppActive(ct.appUrl);

      }, function error(res) {

        ct.appUrl = '';
      });

    };

    ct.checkIfAppActive = function (url) {

      $http({
        method: 'GET',
        url: '/applications/isActive',
        params: {
          app_url: url
        }
      }).then(function success(res) {

        ct.application_active = res.data.active;

      }, function error(res) {

      });
    }

    ct.getIfActive = function (container_id) {

      $http({
        method: 'GET',
        url: '/containers/isActive/' + container_id

      }).then(function success(res) {

        ct.active_container = JSON.parse(res.data).isActive;

      }, function error(res) {


      });
    };

    // Set the view of application to the app id
    ct.setCurrentApp = function (idx) {

      ct.setCurrentAppIdx(idx);

      $http({
        method: 'GET',
        url: '/applications/info/' + idx
      }).then(function success(res) {

        ct.application_info = res.data.app;
        ct.repository_info = res.data.repo;
        ct.getFileTree(ct.application_info.repo_id);

        if (ct.application_info.container == "not_assigned") {

          ct.setContainer(false);
        }
        else {
          ct.setContainer(true);
          ct.getContainerDetails(ct.application_info.container);
          ct.getIfActive(ct.application_info.container);
          ct.getApplicationUrl(ct.getCurrentAppIdx());
          ct.getLogs();
        }

      }, function error(res) {

        ct.application_info = [];
      });
    };

    ct.setCurrentApp(ct.getCurrentAppIdx());

    // Deploy a new container
    ct.deployContainer = function () {

      $http({
        method: 'POST',
        url: '/applications/' + ct.application_info._id + '/instantiate',
        data: {
          image_tag: $("#sel1 option:selected").val()
        }
      }).then(function success(res) {

        Notification.success('Container created successfully.');
        ct.setContainer(true);
        ct.setCurrentApp(ct.getCurrentAppIdx());
        ct.getLogs();

      }, function error(res) {

        Notification.error('Container creation failed.');
        ct.getLogs();
      });
    };

    // Get the file tree from GitLsb application's repo
    ct.getFileTree = function (repository_id) {
      $http({
        method: 'GET',
        url: '/repositories/' + repository_id + '/tree'
      }).then(function success(res) {

        ct.fileTree = res;

      }, function error(res) {

        ct.fileTree = {};

      });
    };

    // Start the execution of an applciation's container
    ct.startContainer = function () {

      $http({
        method: 'PUT',
        url: '/containers/start/' + ct.container_info.container.id,
        data: {
          application_id: ct.application_info._id
        }
      }).then(function success(res) {

        ct.container_info.container.active = true;
        ct.active_container = true;
        Notification.success('Container started successfully.');
        ct.getLogs();

      }, function error(res) {

        Notification.error('Container start failure.');
        ct.getLogs();
      });
    };

    // Stop the execution of an applciation's container
    ct.stopContainer = function () {

      $http({
        method: 'PUT',
        url: '/containers/stop/' + ct.container_info.container.id,
        data: {
          application_id: ct.application_info._id
        }
      }).then(function success(res) {

        ct.container_info.container.active = false;
        ct.active_container = false;
        Notification.success('Container stopped successfully.');
        ct.getLogs();

      }, function error(res) {

        Notification.error('Container stop failure.');
        ct.getLogs();
      });
    };

    // Add a new UI component to favorite list of a specific application
    ct.addUIComponent = function (repo_id, category, element) {

      let e = $('#' + element).clone();
      $('#' + element + "-btn", e).remove();
      ct.uiComponent.desc = e.html();
      ct.uiComponent.category = category;
      ct.uiComponent.repo_id = repo_id;
      ct.uiComponent.component = element;

    };

    // Save the previous UI component including the describing tags
    ct.saveUIComponent = function () {

      $http({
        method: 'POST',
        url: '/applications/project/issues',
        data: {
          app_id: ct.uiComponent.repo_id,
          labels: ct.uiComponent.category + ',' + ct.uiComponent.component + ',' + $('#tagsInput').val(),
          description: ct.uiComponent.desc
        }
      }).then(function success(res) {
        Notification.success('Component added successfully');
        ct.getMyApps();
        $('#tagsInput').tagsinput('removeAll');
      }, function error(res) {
        Notification.error('Add component failed');
        $('#tagsInput').tagsinput('removeAll');
      });

    };

    // Get the favorite components of a specif applciation
    ct.getFavoriteComponents = function (idx) {
      $http({
        method: 'GET',
        url: '/applications/project/issues/components/' + idx,
      }).then(function success(res) {
        ct.components = res.data.components;
        ct.added = [];

        $(function () {
          //Initialize Select2 Elements
          $('.select2').select2()
          //Datemask dd/mm/yyyy
          $('#datemask').inputmask('dd/mm/yyyy', { 'placeholder': 'dd/mm/yyyy' })
          //Datemask2 mm/dd/yyyy
          $('#datemask2').inputmask('mm/dd/yyyy', { 'placeholder': 'mm/dd/yyyy' })
          //Money Euro
          $('[data-mask]').inputmask()
          //Date range picker
          $('#reservation').daterangepicker()
          //Date range picker with time picker
          $('#reservationtime').daterangepicker({ timePicker: true, timePickerIncrement: 30, format: 'MM/DD/YYYY h:mm A' })
          //Date range as a button
          $('#daterange-btn').daterangepicker(
            {
              ranges: {
                'Today': [moment(), moment()],
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
              },
              startDate: moment().subtract(29, 'days'),
              endDate: moment()
            },
            function (start, end) {
              $('#daterange-btn span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'))
            }
          )
          //Date picker
          $('#datepicker').datepicker({
            autoclose: true
          })
          //iCheck for checkbox and radio inputs
          $('input[type="checkbox"].minimal, input[type="radio"].minimal').iCheck({
            checkboxClass: 'icheckbox_minimal-blue',
            radioClass: 'iradio_minimal-blue'
          })
          //Red color scheme for iCheck
          $('input[type="checkbox"].minimal-red, input[type="radio"].minimal-red').iCheck({
            checkboxClass: 'icheckbox_minimal-red',
            radioClass: 'iradio_minimal-red'
          })
          //Flat red color scheme for iCheck
          $('input[type="checkbox"].flat-red, input[type="radio"].flat-red').iCheck({
            checkboxClass: 'icheckbox_flat-green',
            radioClass: 'iradio_flat-green'
          })
          //Colorpicker
          $('.my-colorpicker1').colorpicker()
          //color picker with addon
          $('.my-colorpicker2').colorpicker()
          //Timepicker
          $('.timepicker').timepicker({
            showInputs: false
          })
          $('.slider').slider()

          // Replace the <textarea id="editor1"> with a CKEditor
          // instance, using default configuration.
          CKEDITOR.replace('editor1')
          //bootstrap WYSIHTML5 - text editor
          $('.textarea').wysihtml5()

          /*$('#example1').DataTable()
          $('#example2').DataTable({
            'paging'      : true,
            'lengthChange': false,
            'searching'   : false,
            'ordering'    : true,
            'info'        : true,
            'autoWidth'   : false
          })*/

        });

      });
    };

    // Delete a saved UI component of an application
    ct.deleteFavoriteComponent = function (issue_id, app_id) {
      $http({
        method: 'POST',
        url: '/applications/project/issues/deleteIssue',
        data: {
          app_id: app_id,
          issue_id: issue_id
        }
      }).then(function success(res) {
        ct.getFavoriteComponents(app_id);
        Notification.success("Component deleted successfully");
      }, function error(res) {
        Notification.error('Component delete failed');
      });
    };

    // Show the code of a UI saved component
    ct.showCode = function (id, code) {
      if (!ct.added.includes(code)) {
        $("#" + id).append(code);
        ct.added.push(code);
      }
    };

    // Update user's information (name, email and password)
    ct.updateInfo = function () {
      let name = ct.model.inputName;
      let email = ct.model.inputEmail;

      if (ct.model.inputName === undefined && ct.model.inputEmail === undefined
        && ct.model.inputCurrentPassword === undefined && ct.model.inputNewPassword === undefined
        && ct.model.inputPasswordConfirmation === undefined) {

        Notification.error('Nothing to be changed');
      }

      else {

        if (ct.model.inputName === undefined) name = ct.name;
        if (ct.model.inputEmail === undefined) email = ct.email;

        $http({
          method: 'POST',
          url: '/developers/update',
          data: {
            name: name,
            email: email,
            currentPassword: ct.model.inputCurrentPassword,
            newPassword: ct.model.inputNewPassword,
            passwordConfirm: ct.model.inputPasswordConfirmation,
            username: ct.username,
            id: ct.user_id
          }
        }).then(function success(res) {

          ct.model.inputName = undefined;
          ct.model.inputEmail = undefined;
          ct.model.inputCurrentPassword = undefined;
          ct.model.inputNewPassword = undefined;
          ct.model.inputPasswordConfirmation = undefined;
          Notification.success('Update data successfully');
          ct.getProfileInfo();

          if (res.data == 'Password changed') {
            ct.logout();
          }

        }, function error(res) {

          Notification.error(res.data);

        });
      }
    }

    // Logout from user's account
    ct.logout = function () {
      $http({
        method: 'POST',
        url: '/developers/logout'
      }).then(function success(res) {
        Notification.success("Logout successfully");
      }, function error(res) {
        // No reason for this notification, as user has already been redirected as a logged-out user.
        // Notification.error('Logout failed');
      });

    };



    /**
    * **************************
    * *********************************************
    * *********************************************
    * *********************************************
    * TASOS STARTS HERE
    * *********************************************
    * *********************************************
    */
    ct.openDatasetsModal = function (dataset) {
      ct.openDatasetForModal = { ...dataset };
      ct.openDatasetModal = $uibModal.open({
        animation: false,
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        // backdrop: 'static',
        templateUrl: 'datasetModal.html',
        size: 'lg',
        scope: $scope,
        // windowClass: 'background-transparent my-modal-centered'
      });
      ct.openDatasetModal.result.then(() => { }).catch((err) => { console.log(err) })
    }

    ct.closeDatasetsModal = function () {
      ct.openDatasetModal.close();
    }

    ct.openServicesModal = function (service) {
      ct.showServiceAddEndpoint = false;
      ct.addNewServiceEndPoint = { example: {} }
      ct.openServiceForModal = { ...service };
      ct.openServiceModal = $uibModal.open({
        animation: false,
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        // backdrop: 'static',
        templateUrl: 'serviceModal.html',
        size: 'lg',
        scope: $scope,
        // windowClass: 'background-transparent my-modal-centered'
      });
      ct.openServiceModal.result.then(() => { }).catch((err) => { console.log(err) })
    }

    ct.closeServiceModal = function () {
      ct.openServiceModal.close();
    }

    /* Design app functions */

    /**
     * *******************
     * ********** **Http Calls** *******************
     * *******************
     */
    ct.getMyAppsv2 = function () { // res.data.apps
      return $http({
        method: 'GET',
        url: '/applications/my_apps'
      })
    }

    ct.getMyFavoriteComponents = function () {
      return $http({
        method: 'GET',
        url: '/applications/favorite_components/all'
      })
    }

    ct.getAllDatasets = function () {
      return $http({
        method: 'GET',
        url: '/applications/datasets/getDatasets'
      })
    }

    ct.getAllServices = function () {
      return $http({
        method: 'GET',
        url: '/applications/services/getServices'
      })
    }

    ct.getVegaGraphData = function (graph, data) {
      return $http({
        method: 'POST',
        url: `${window.location.protocol}//${window.location.hostname}:${VEGA_PORT}/api/data/` + graph,
        data
      })
    }

    ct.getVegaOperation = function (operation, data, bounds) {
      return $http({
        method: 'POST',
        url: `${window.location.protocol}//${window.location.hostname}:${VEGA_PORT}/api/data/` + 'operation/' + operation,
        data: { 'data': data, 'bounds': bounds }
      })
    }

    ct.getDatasetData = function (datasetUrl) {
      return $http({
        method: 'GET',
        url: datasetUrl
      })
        .then(res => {
          return Promise.resolve(res.data._items.map(item => {
            delete item._updated;
            delete item._links;
            delete item._created;
            delete item._id;
            delete item._etag
            return item;
          }))
        })
    }

    ct.getAppDesignData = function (applicationId, username) {
      return $http({
        method: 'GET',
        url: '/design',
        params: { applicationId, developerUsername: username ? username : ct.username }
      })
    }

    ct.createDesignData = function (applicationId) {
      return $http({
        method: 'POST',
        url: '/design',
        params: { applicationId, developerUsername: ct.username }
      })
    }

    ct.patchDesignData = function (designId, data) {
      return $http({
        method: 'PATCH',
        url: `/design/${designId}`,
        data: data
      })
    }

    ct.saveGraphToDb = function (designId, graph, dataset, plottedColumns, graphType, action) { // type is one of 'ADD', 'EDIT', 'DELETE'
      return $http({
        method: 'PATCH',
        url: `/design/${designId}/graph`,
        data: { vegaData: graph, datasetId: dataset._id, plottedColumns, graphType },
        params: { action }
      })
    }

    ct.getSchemaTypesAPI = function () {
      return $http({
        method: 'GET',
        url: `${window.location.protocol}//${window.location.hostname}:${SCHEMA_DOT_ORG_PORT}/api/getSchemaTypes`,
      })
    }

    ct.getSchemaPropertiesAPI = function (type) {
      return $http({
        method: 'GET',
        url: `${window.location.protocol}//${window.location.hostname}:${SCHEMA_DOT_ORG_PORT}/api/getSchemaProperties?type=${type}`,
      })
    }

    ct.saveTableViewToDb = function (designId, data) {
      return $http({
        method: 'PATCH',
        url: `/design/${designId}/add-table-view`,
        data: { ...data }
      })
    }

    ct.saveInstanceViewToDb = function (designId, data) {
      return $http({
        method: 'PATCH',
        url: `/design/${designId}/add-instance-view`,
        data: { ...data }
      })
    }

    ct.deleteDatasetById = function (datasetId) {
      return $http({
        method: 'DELETE',
        url: `/applications/datasets/deleteDataset/${datasetId}`
      })
    }

    ct.deleteServiceById = function (serviceId) {
      return $http({
        method: 'DELETE',
        url: `/applications/services/deleteService/${serviceId}`
      })
    }

    ct.addServiceEndpointAPI = function (serviceId, endpoint) {
      return $http({
        method: 'PATCH',
        url: `/applications/services/addServiceEndpoint/${serviceId}`,
        data: { ...endpoint }
      })
    }

    ct.removeServiceEndpointAPI = function (serviceId, endpointIndex) {
      return $http({
        method: 'PATCH',
        url: `/applications/services/removeServiceEndpoint/${serviceId}?endpointIndex=${endpointIndex}`,
      })
    }

    ct.getLocaleListAPI = function () {
      return $http({
        method: 'GET',
        url: `/applications/localeList`,
      })
    }

    ct.getLighthouseMetricsAPI = function (url) {
      return $http({
        method: 'GET',
        url: `/analytics/lighthouse?url=${url}`,
      })
    }
    /**
     * *******************
     * ********** **Tab stuff** *******************
     * *******************
     */
    ct.setActiveTab = function (num) {
      ct.designApp.activeTab = num;
      window.scrollTo(0, 0)
    }



    /**
     * *******************
     * ********** **Initialize Design App** *******************
     * *******************
     */
    ct.designAppInit = function () {

      ct.showFullScreenSpinner();

      Promise.all([
        ct.getMyAppsv2(),
        ct.getMyFavoriteComponents(),
        ct.getAllDatasets(),
        ct.getAllServices()
      ])
        .then(([res1, res2, res3, res4]) => {
          ct.designApp.myApps = res1.data.apps;
          ct.designApp.myFavoriteComponents = res2.data;
          ct.designApp.myDatasets = res3.data.datasets;
          ct.designApp.myServices = res4.data.services;

          // Here if selected app is pre-selected on the window location query
          if (window.location.search) {
            const query = queryToJson(window.location.search);
            if (query && query.selectedAppId) {
              ct.designApp.selectedApp = ct.designApp.myApps.find(app => app._id === query.selectedAppId)
              ct.onAppSelected(query.developerUsername);
            }
          }
        })
        .catch(err => {
          console.log(err);
        })
        .finally(() => {
          ct.closeFullScreenSpinner();
        })
    };

    ct.isAnAppSelected = function () {
      return ct.designApp && ct.designApp.selectedApp !== null && ct.designApp.selectedApp !== undefined;
    }

    ct.onAppSelected = function (username) {
      if (ct.isAnAppSelected()) {
        ct.getAppDesignData(ct.designApp.selectedApp._id, username)
          .then(designData => {
            if (designData.data === null) {
              // No design data, create empty object back-end
              return ct.createDesignData(ct.designApp.selectedApp._id)
                .then(data => {
                  return Promise.resolve(data.data._id)
                })
            } else {
              // Update front-end with back-end data
              ct.designApp.selectedComponents = designData.data.selectedComponents ? designData.data.selectedComponents : []
              ct.designApp.selectedComponentsBackup = [...ct.designApp.selectedComponents];
              ct.designApp.selectedDatasets = designData.data.selectedDatasets ? designData.data.selectedDatasets : []
              ct.designApp.selectedServices = designData.data.selectedServices ? designData.data.selectedServices : []
              ct.designApp.savedGraphs = designData.data.vegaPlots ? designData.data.vegaPlots : []
              ct.designApp.dataTableViews_savedTables = designData.data.tableViews ? designData.data.tableViews : []
              ct.designApp.dataInstancesViews_savedInstances = designData.data.instanceViews ? designData.data.instanceViews : []
              return Promise.resolve(designData.data._id)
            }
          })
          .then(designId => {
            ct.designApp.designId = designId;
          })
          .catch(err => {
            console.log(err);
          })
      } else {
        ct.designApp.designId = undefined;
      }

    }

    /**
    * *******************
    * ********** **Favorite/Selected Components Stuff** *******************
    * *******************
    */
    ct.openComponentsModal = function () {
      ct.modalComponentsInstance = $uibModal.open({
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        templateUrl: 'myModalContent.html',
        size: 'lg',
        scope: $scope,
        backdrop: 'static',
        keyboard: false
      });
      ct.modalComponentsInstance.result.then(() => { }).catch((err) => { console.log(err) })
    }

    ct.closeComponentsModal = function () {
      ct.modalComponentsInstance.close()
    }

    ct.cancelSelectedComponents = function () {
      ct.designApp.selectedComponents = [...ct.designApp.selectedComponentsBackup];
    }

    ct.saveSelectedComponents = function () {
      if (ct.designApp.selectedComponents && ct.designApp.selectedComponents.length > 0) {
        if (ct.designApp.selectedComponents.map(c => c._id).sort().join(',') !== ct.designApp.selectedComponentsBackup.map(c => c._id).sort().join(',')) {
          ct.designApp.selectedComponentsBackup = [...ct.designApp.selectedComponents];
          ct.patchDesignData(ct.designApp.designId, {
            selectedComponents: ct.designApp.selectedComponents.map(c => c._id)
          })
            .then(designData => {

            })
            .catch(err => {
              Notification.error('Error saving design data')
            })
        }
      }
    }

    ct.toggleComponentToDesign = function (componentId) {
      const component = ct.designApp.selectedComponents.find(c => c._id === componentId);
      if (!component) {
        let _addComp = ct.designApp.myFavoriteComponents.find(c => c._id === componentId);
        if (_addComp)
          ct.designApp.selectedComponents.push(_addComp)
      } else {
        ct.designApp.selectedComponents = ct.designApp.selectedComponents.filter(c => c._id !== componentId);
      }
    }

    ct.isComponentSelected = function (componentId) {
      return ct.designApp.selectedComponents.some(c => c._id === componentId)
    }

    /**
    * *******************
    * ********** **Selected Datasets & Services Stuff** *******************
    * *******************
    */
    ct.toggleDatasetToDesign = function (datasetId) {
      const dataset = ct.designApp.selectedDatasets.find(c => c._id === datasetId);
      if (!dataset) {
        let _addDataset = ct.designApp.myDatasets.find(c => c._id === datasetId);
        if (_addDataset) {
          ct.designApp.selectedDatasets.push(_addDataset);
          if (ct.designApp.selectedDatasets.length === 1) {
            ct.setDatasetToVisualize(datasetId)
          }
        }
      } else {
        ct.designApp.selectedDatasets = ct.designApp.selectedDatasets.filter(c => c._id !== datasetId);
        if (ct.designApp.selectedDatasets.length > 0) {
          ct.setDatasetToVisualize(ct.designApp.selectedDatasets[0]._id)
        } else {
          ct.setDatasetToVisualize(-1);
        }
      }
      ct.patchDesignData(ct.designApp.designId, {
        selectedDatasets: ct.designApp.selectedDatasets.map(d => d._id)
      })
        .then(designData => {

        })
        .catch(err => {
          Notification.error('Error saving design data')
        })
    }

    ct.isDatasetSelected = function (datasetId) {
      return ct.designApp && ct.designApp.selectedDatasets.some(c => c._id === datasetId)
    }

    ct.toggleServiceToDesign = function (serviceId) {
      const service = ct.designApp.selectedServices.find(c => c._id === serviceId);
      if (!service) {
        let _addService = ct.designApp.myServices.find(c => c._id === serviceId);
        if (_addService) {
          ct.designApp.selectedServices.push(_addService);
        }
      } else {
        ct.designApp.selectedServices = ct.designApp.selectedServices.filter(c => c._id !== serviceId);
      }
      ct.patchDesignData(ct.designApp.designId, {
        selectedServices: ct.designApp.selectedServices.map(d => d._id)
      })
        .then(designData => {

        })
        .catch(err => {
          Notification.error('Error saving design data')
        })
    }

    ct.isServiceSelected = function (serviceId) {
      return ct.designApp && ct.designApp.selectedServices.some(c => c._id === serviceId)
    }


    /**
    * *******************
    * ********** **Datasets to Visualize Stuff** *******************
    * *******************
    */
    ct.shouldHideTabs = function () {
      return ct.designApp && (ct.designApp.selectedApp === null || ct.designApp.selectedApp === undefined)
    }

    ct.onDatasetToVisualizeChange = function () {
      ct.designApp.dataColumnsToVisualize = [];
      ct.resetSelectedGraph();
      ct.resetCurrentVegaPlotId();
      if (ct.designApp.datasetToVisualize !== null && ct.designApp.datasetToVisualize !== undefined && ct.designApp.datasetToVisualize !== '') {
        ct.showFullScreenSpinner();
        ct.getDatasetData(ct.designApp.datasetToVisualize.url)
          .then(data => {
            ct.designApp.datasetToVisualizeRaw = [...data];
            ct.designApp.datasetToVisualizeRawInitial = [...data];
          })
          .catch(err => {

          })
          .finally(() => {
            ct.closeFullScreenSpinner()
          })
      }
    }

    ct.setDatasetToVisualize = function (datasetId) {
      ct.designApp.dataColumnsToVisualize = [];
      const dataset = ct.designApp.selectedDatasets.find(d => d._id === datasetId)
      if (!dataset) {
        ct.designApp.datasetToVisualize = undefined;
      } else {
        ct.designApp.datasetToVisualize = dataset;
        ct.showFullScreenSpinner();
        ct.getDatasetData(dataset.url)
          .then(data => {
            ct.designApp.datasetToVisualizeRaw = [...data];
            ct.designApp.datasetToVisualizeRawInitial = [...data];
            ct.closeFullScreenSpinner()
          })
          .catch(err => {
            ct.closeFullScreenSpinner()
          })
      }
      ct.resetSelectedGraph();
      ct.resetCurrentVegaPlotId();
    }

    ct.resetDatasetToVisualize = function () {
      ct.designApp.datasetToVisualizeRaw = [...ct.designApp.datasetToVisualizeRawInitial];
    }

    ct.isThisTheDatasetToVisualize = function (datasetId) {
      return ct.designApp && ct.designApp.datasetToVisualize && ct.designApp.datasetToVisualize._id === datasetId
    }

    ct.extractColumnHeadersFromDatasetToVisualize = function () {
      if (ct.designApp.datasetToVisualize && ct.designApp.datasetToVisualize.sample) {
        return Object.keys(ct.designApp.datasetToVisualize.sample[0]);
      } else {
        return [];
      }
    }

    ct.toggleDataColumnToVisualize = function (columnHeader) {
      const columnIndex = ct.designApp.dataColumnsToVisualize.indexOf(columnHeader)
      if (columnIndex === -1) {
        ct.designApp.dataColumnsToVisualize.push(columnHeader);
      } else {
        ct.designApp.dataColumnsToVisualize.splice(columnIndex, 1);
      }
      if (!ct.shouldHidePlots()) {
        // It means that plot is already rendered
        ct.showGraph();
      }
      if (ct.designApp.dataColumnsToVisualize && ct.designApp.dataColumnsToVisualize.length === 0) {
        ct.resetSelectedGraph()
      }
      ct.resetCurrentVegaPlotId()
    }

    ct.isDataColumnSelectedToVisualize = function (columnHeader) {
      return ct.designApp.dataColumnsToVisualize.indexOf(columnHeader) !== -1;
    }

    /**
    * *******************
    * ********** **Graph/Plots/Vega Stuff** *******************
    * *******************
    */
    ct.resetSelectedGraph = function () {
      ct.designApp.selectedGraph = undefined;
    }

    ct.isSelectedGraphSet = function () {
      return ct.designApp.selectedGraph !== undefined && ct.designApp.selectedGraph !== null && ct.designApp.selectedGraph !== '';
    }

    ct.shouldHideGraphs = function () {
      return ct.shouldHideTabs() || (ct.designApp.dataColumnsToVisualize === undefined || ct.designApp.dataColumnsToVisualize.length === 0)
    }

    ct.shouldHidePlots = function () {
      return (ct.designApp.selectedGraph === undefined || ct.designApp.selectedGraph === null || ct.designApp.selectedGraph === '')
    }

    ct.showGraph = function () {
      const graph = ct.designApp.selectedGraph;
      if (graph === undefined || graph === null || graph === '') {
        return;
      } else {
        const data = {}
        ct.designApp.dataColumnsToVisualize.forEach(col => {
          data[col] = ct.designApp.datasetToVisualizeRaw.map(v => v[col]);
        })
        let vegaData = { data }
        if ((graph == 'barChart' || graph == 'areaChart' || graph == 'histogramChart') && ct.designApp.dataColumnsToVisualize.length > 1) {
          Notification.error('Please select only one column!');
          return;
        }
        else if (graph == 'contourPlotChart' && ct.designApp.dataColumnsToVisualize.length != 2) {
          Notification.error('Please select exactly two columns');
          return;
        }
        else if (graph == 'scatterPlotChart' && ct.designApp.dataColumnsToVisualize.length !== 2) {
          Notification.error('Please select exactly two columns');
          return;
        }
        else {
          ct.showFullScreenSpinner();
          ct.getVegaGraphData(graph, vegaData)
            .then(res => {
              render(res.data);
            })
            .catch(err => {
              Notification.error(res.data);
            })
            .finally(() => {
              ct.closeFullScreenSpinner()
            })
        }
      }

    };

    function render(spec) {
      console.log(spec);
      ct.designApp.currentPlottedGraph = { ...spec };
      var view = new vega.View(vega.parse(spec))
        .renderer('canvas')  // set renderer (canvas or svg)
        .initialize('#view') // initialize view within parent DOM container
        .hover()             // enable hover encode set processing
        .run();
    }

    ct.isSetSelectedColForVegaOperation = function () {
      return ct.designApp.selectedColForVegaOperation !== undefined && ct.designApp.selectedColForVegaOperation !== null && ct.designApp.selectedColForVegaOperation !== '';
    }

    ct.applyOperation = function (operation) {
      ct.resetCurrentVegaPlotId();
      let bounds;
      if (ct.designApp.selectedColForVegaOperation != '') {
        const data = {}
        ct.designApp.dataColumnsToVisualize.forEach(col => {
          data[col] = ct.designApp.datasetToVisualizeRaw.map(v => v[col]);
        })
        let vegaData = {
          data,
          selectedColumn: ct.designApp.selectedColForVegaOperation
        }
        if (operation == 'topPercent') {
          if ($('#topPercent').val() == '') {
            Notification.error('Please fill out the percentage.');
            return;
          }
          if (parseInt($('#topPercent').val()) > 100 || parseInt($('#topPercent').val()) < 0) {
            Notification.error('Percentage must be in the range [0,100].');
            return;
          }
          bounds = { 'top': $('#topPercent').val() };
        } else if (operation == 'bottomPercent') {
          if ($('#bottomPercent').val() == '') {
            Notification.error('Please fill out the percentage.');
            return;
          }
          if (parseInt($('#bottomPercent').val()) > 100 || parseInt($('#bottomPercent').val()) < 0) {
            Notification.error('Percentage must be in the range [0,100].');
            return;
          }
          bounds = { 'bottom': $('#bottomPercent').val() };
        } else if (operation == 'rangePercent') {
          if ($('#rangePercentBottom').val() == '' || $('#rangePercentTop').val() == '') {
            Notification.error('Please fill out the percentages.');
            return;
          }
          if (parseInt($('#rangePercentBottom').val()) > parseInt($('#rangePercentTop').val())) {
            Notification.error('Top percentage must be bigger than bottom.');
            return;
          }
          if (parseInt($('#rangePercentBottom').val()) > 100 || parseInt($('#rangePercentBottom').val()) < 0 || parseInt($('#rangePercentTop').val()) > 100 || parseInt($('#rangePercentTop').val()) < 0) {
            Notification.error('Percentage must be in the range [0,100].');
            return;
          }
          bounds = { 'bottom': $('#rangePercentBottom').val(), 'top': $('#rangePercentTop').val() };
        } else if (operation == 'rangeValues') {
          if ($('#rangeValuesBottom').val() == '' || $('#rangeValuesTop').val() == '') {
            Notification.error('Please fill out the percentages.');
            return;
          }
          if (parseInt($('#rangeValuesBottom').val()) > parseInt($('#rangeValuesTop').val())) {
            Notification.error('Top value must be bigger than bottom.');
            return;
          }
          bounds = { 'bottom': $('#rangeValuesBottom').val(), 'top': $('#rangeValuesTop').val() };
        }
        ct.showFullScreenSpinner();
        ct.getVegaOperation(operation, vegaData, bounds)
          .then(res => {
            ct.designApp.datasetToVisualizeRaw = ct.designApp.datasetToVisualizeRaw.map((da, i) =>
              ({
                ...da,
                [ct.designApp.selectedColForVegaOperation]: res.data.data[ct.designApp.selectedColForVegaOperation][i]
              }))
            const newData = {}
            ct.designApp.dataColumnsToVisualize.forEach(col => {
              newData[col] = ct.designApp.datasetToVisualizeRaw.map(v => v[col]);
            })
            return ct.getVegaGraphData(ct.designApp.selectedGraph, { data: newData })
          })
          .then(res => {
            render(res.data);
          })
          .catch(err => {
            Notification.error(res.data);
          })
          .finally(() => {
            ct.closeFullScreenSpinner();
          })
      } else {
        Notification.error('Please select column');
      }
    };

    ct.clearOperations = function () {
      $('#view').empty();
      ct.designApp.datasetToVisualizeRaw = [...ct.designApp.datasetToVisualizeRawInitial]
      setTimeout(() => {
        ct.showGraph()
      }, 350)
    }

    ct.setShowSaveGraphPopover = function (bool) {
      ct.designApp.currentPlottedGraph = { ...ct.designApp.currentPlottedGraph, name: undefined }
      ct.designApp.showSaveGraphPopover = bool;
      if (bool === true) {
        setTimeout(() => {
          const el = document.getElementById('savePlotInput')
          if (el) el.focus();
        }, 200)
      }
    }

    ct.saveGraph = function () {
      const tmp = { ...ct.designApp.currentPlottedGraph };
      ct.setShowSaveGraphPopover(false);
      ct.showFullScreenSpinner();
      ct.saveGraphToDb(ct.designApp.designId, tmp, ct.designApp.datasetToVisualize, ct.designApp.dataColumnsToVisualize, ct.designApp.selectedGraph, 'ADD')
        .then(designData => {
          ct.designApp.savedGraphs = [...designData.data.vegaPlots];
        })
        .catch(err => {
          Notification.error('Error saving data')
        })
        .finally(() => {
          ct.closeFullScreenSpinner();
        })
    }

    ct.onKeyPressSaveGraph = function (evt) {
      if (evt.keyCode === 13) {
        ct.saveGraph();
      }
    }

    ct.showGraphFromSavedOnClick = function (vegaPlotId) {
      const tmp = ct.designApp.savedGraphs.find(v => v._id === vegaPlotId)
      // console.log(tmp);
      if (tmp) {
        ct.setDatasetToVisualize(tmp.datasetId); // This has to be first
        ct.designApp.selectedGraph = tmp.graphType;
        ct.designApp.dataColumnsToVisualize = tmp.plottedColumns;
        ct.designApp.currentVegaPlotId = vegaPlotId;
        setTimeout(() => {
          render({ ...tmp.vegaData, $schema: tmp.vegaData.schema });
        }, 100)

      }
    }

    ct.resetCurrentVegaPlotId = function () {
      ct.designApp.currentVegaPlotId = undefined;
    }

    ct.isSomePlotShownFromSaved = function () {
      return ct.designApp.savedGraphs.some(g => g._id === ct.designApp.currentVegaPlotId)
    }

    ct.setIsSavedGraphsCollapsed = function (bool) {
      ct.designApp.isSavedGraphsCollapsed = bool;
    }

    ct.goToDesignWithAppSelected = function (appId) {
      window.location.replace(`/developers/design?selectedAppId=${appId}&developerUsername=${ct.username}`)
    }

    ct.redirectToSketch = function () {
      // const cookie =
      const query = `developerUsername=${ct.username}&applicationId=${ct.designApp.selectedApp._id}`;
      window.open(`${window.location.protocol}//${window.location.hostname}:${SKETCH_APP_PORT}?${query}`, '_blank');
    }

    function queryToJson(queryString) {
      if (queryString.indexOf('?') > -1) {
        queryString = queryString.split('?')[1];
      }
      var pairs = queryString.split('&');
      var result = {};
      pairs.forEach(function (pair) {
        pair = pair.split('=');
        result[pair[0]] = decodeURIComponent(pair[1] || '');
      });
      return result;
    }

    ct.getSchemaTypes = function () {
      ct.getSchemaTypesAPI()
        .then(data => {
          if (!data.data.error) {
            ct.schemaDotOrgTypes = data.data.types;
          } else {
            Notification.error(data.data.error);
          }
        })
        .catch(err => {
          console.log(err)
          Notification.error('Something went wrong')
        })
    }

    ct.getSchemaProperties = function (type) {
      ct.getSchemaPropertiesAPI(type)
        .then(data => {
          if (!data.data.error) {
            ct.schemaDotOrgProperties = data.data.properties;
          } else {
            Notification.error(data.data.error);
          }
        })
        .catch(err => {
          console.log(err)
          Notification.error('Something went wrong')
        })
    }

    /**
     * -----------------------------------------------
     * ------------------------------------------------------------------
     * --------------------------------- Data Tables ----------------------------------
     * ------------------------------------------------------------------
     * -----------------------------------------------
     * 
     */
    ct.dataTablesViews_onDatasetToVisualizeChange = function () {
      ct.designApp.dataTablesViews_dataColumnsToVisualize = [];
      if (ct.designApp.dataTablesViews_datasetToVisualize !== null
        && ct.designApp.dataTablesViews_datasetToVisualize !== undefined
        && ct.designApp.dataTablesViews_datasetToVisualize !== '') {
        ct.showFullScreenSpinner();
        ct.getDatasetData(ct.designApp.dataTablesViews_datasetToVisualize.url)
          .then(data => {
            console.log(data);
          })
          .catch(err => {
            console.log(err);
          })
          .finally(() => {
            ct.closeFullScreenSpinner()
          })
      }
    }

    ct.showTableFromSavedOnClick = function (tableId) {
      const tmp = ct.designApp.dataTableViews_savedTables.find(v => v._id === tableId)
      if (tmp) {
        ct.designApp.dataTableViews_savedTableViewShown = tmp;
        ct.designApp.dataTableViews_currentTableId = tableId;
      }
    }

    ct.dataTablesViews_extractColumnHeadersFromDatasetToVisualize = function () {
      if (ct.designApp.dataTablesViews_datasetToVisualize && ct.designApp.dataTablesViews_datasetToVisualize.sample) {
        return Object.keys(ct.designApp.dataTablesViews_datasetToVisualize.sample[0]);
      } else {
        return [];
      }
    }

    ct.dataTablesViews_toggleDataColumnToVisualize = function (columnHeader) {
      const columnIndex = ct.designApp.dataTablesViews_dataColumnsToVisualize.indexOf(columnHeader)
      if (columnIndex === -1) {
        ct.designApp.dataTablesViews_dataColumnsToVisualize.push(columnHeader);
      } else {
        ct.designApp.dataTablesViews_dataColumnsToVisualize.splice(columnIndex, 1);
      }
      ct.designApp.dataTableViews_currentTableId = undefined;
      ct.designApp.dataTableViews_savedTableViewShown = undefined;
    }

    ct.dataTablesViews_isDataColumnSelectedToVisualize = function (columnHeader) {
      return ct.designApp.dataTablesViews_dataColumnsToVisualize.indexOf(columnHeader) !== -1;
    }

    ct.setShowSaveTableViewPopover = function (bool) {
      // ct.designApp.currentPlottedGraph = { ...ct.designApp.currentPlottedGraph, name: undefined }
      ct.designApp.dataTablesViews_saveNewName = undefined;
      ct.designApp.dataTablesViews_showSaveNewPopover = bool;
      if (bool === true) {
        setTimeout(() => {
          const el = document.getElementById('saveTableNameInput')
          if (el) el.focus();
        }, 200)
      }

    }

    ct.saveTableView = function () {
      const keys = Object.keys(ct.designApp.dataTablesViews_datasetToVisualize.sample[0])
      const data = ct.designApp.dataTablesViews_datasetToVisualize.sample.map(row => {
        let ret = {}
        for (let k in keys) {
          let key = keys[k]
          if (ct.designApp.dataTablesViews_dataColumnsToVisualize.indexOf(key) !== -1) {
            ret[key] = row[key]
          }
        }
        return ret;
      })
      const name = ct.designApp.dataTablesViews_saveNewName
      ct.setShowSaveTableViewPopover(false);
      ct.showFullScreenSpinner();
      ct.saveTableViewToDb(ct.designApp.designId, { data, name, columnOrder: ct.designApp.dataTablesViews_dataColumnsToVisualize })
        .then(designData => {
          ct.designApp.dataTableViews_savedTables = [...designData.data.tableViews];
        })
        .catch(err => {
          Notification.error('Error saving data')
        })
        .finally(() => {
          ct.closeFullScreenSpinner();
        })
    }

    ct.onKeyPressSaveTable = function (evt) {
      if (evt.keyCode === 13) {
        ct.saveTableView();
      }
    }

    /**
    * -----------------------------------------------
    * ------------------------------------------------------------------
    * --------------------------------- Data Instances ----------------------------------
    * ------------------------------------------------------------------
    * -----------------------------------------------
    * 
    */
    ct.dataInstancesViews_onDatasetToVisualizeChange = function () {
      ct.designApp.dataInstancesViews_dataColumnsToVisualize = [];
      if (ct.designApp.dataInstancesViews_datasetToVisualize !== null
        && ct.designApp.dataInstancesViews_datasetToVisualize !== undefined
        && ct.designApp.dataInstancesViews_datasetToVisualize !== '') {
        ct.showFullScreenSpinner();
        ct.getDatasetData(ct.designApp.dataInstancesViews_datasetToVisualize.url)
          .then(data => {
            console.log(data);
          })
          .catch(err => {
            console.log(err);
          })
          .finally(() => {
            ct.closeFullScreenSpinner()
          })
      }
    }

    ct.showInstanceFromSavedOnClick = function (instanceId) {
      const tmp = ct.designApp.dataInstancesViews_savedInstances.find(v => v._id === instanceId)
      if (tmp) {
        ct.designApp.dataInstancesViews_savedInstanceShown = tmp;
        ct.designApp.dataInstancesViews_currentInstanceId = instanceId;
      }
    }

    ct.dataInstancesViews_extractColumnHeadersFromDatasetToVisualize = function () {
      if (ct.designApp.dataInstancesViews_datasetToVisualize && ct.designApp.dataInstancesViews_datasetToVisualize.sample) {
        return Object.keys(ct.designApp.dataInstancesViews_datasetToVisualize.sample[0]);
      } else {
        return [];
      }
    }

    ct.dataInstancesViews_toggleDataColumnToVisualize = function (columnHeader) {
      const columnIndex = ct.designApp.dataInstancesViews_dataColumnsToVisualize.indexOf(columnHeader)
      if (columnIndex === -1) {
        ct.designApp.dataInstancesViews_dataColumnsToVisualize.push(columnHeader);
      } else {
        ct.designApp.dataInstancesViews_dataColumnsToVisualize.splice(columnIndex, 1);
      }
      ct.designApp.dataInstancesViews_currentInstanceId = undefined;
      ct.designApp.dataInstancesViews_savedInstanceShown = undefined;
    }

    ct.dataInstancesViews_isDataColumnSelectedToVisualize = function (columnHeader) {
      return ct.designApp.dataInstancesViews_dataColumnsToVisualize.indexOf(columnHeader) !== -1;
    }

    ct.setShowSaveInstanceViewPopover = function (bool) {
      ct.designApp.dataInstancesViews_saveNewName = undefined;
      ct.designApp.dataInstancesViews_showSaveNewPopover = bool;
      if (bool === true) {
        setTimeout(() => {
          const el = document.getElementById('saveInstanceNameInput')
          if (el) el.focus();
        }, 200)
      }

    }

    ct.saveInstanceView = function () {
      let data = {};
      for (let key in ct.designApp.dataInstancesViews_datasetToVisualize.sample[0]) {
        if (ct.designApp.dataInstancesViews_dataColumnsToVisualize.indexOf(key) !== -1) {
          data[key] = ct.designApp.dataInstancesViews_datasetToVisualize.sample[0][key]
        }
      }
      const name = ct.designApp.dataInstancesViews_saveNewName
      ct.setShowSaveInstanceViewPopover(false);
      ct.showFullScreenSpinner();
      ct.saveInstanceViewToDb(ct.designApp.designId, { data, name, columnOrder: ct.designApp.dataInstancesViews_dataColumnsToVisualize })
        .then(designData => {
          ct.designApp.dataInstancesViews_savedInstances = [...designData.data.instanceViews];
        })
        .catch(err => {
          Notification.error('Error saving data')
        })
        .finally(() => {
          ct.closeFullScreenSpinner();
        })
    }

    ct.onKeyPressSaveInstance = function (evt) {
      if (evt.keyCode === 13) {
        ct.saveInstanceView();
      }
    }

    /**
        * -----------------------------------------------
        * ------------------------------------------------------------------
        * --------------------------------- MISC ----------------------------------
        * ------------------------------------------------------------------
        * -----------------------------------------------
        * 
        */

    ct.deleteDataset = function (datasetId) {
      if (confirm('Are you sure you want to delete this dataset?')) {
        ct.showFullScreenSpinner();
        ct.deleteDatasetById(datasetId)
          .then(res => {
            ct.datasets = ct.datasets.filter(dataset => dataset._id !== datasetId)
            Notification.success('Dataset deleted')
          })
          .catch(err => {
            Notification.error('Dataset could not be deleted')
          })
          .finally(() => {
            ct.closeDatasetsModal();
            ct.closeFullScreenSpinner();
          })
      }
    }

    ct.deleteService = function (serviceId) {
      if (confirm('Are you sure you want to delete this service?')) {
        ct.showFullScreenSpinner();
        ct.deleteServiceById(serviceId)
          .then(res => {
            ct.services = ct.services.filter(service => service._id !== serviceId)
            Notification.success('Service deleted')
          })
          .catch(err => {
            Notification.error('Service could not be deleted')
          })
          .finally(() => {
            ct.closeServiceModal();
            ct.closeFullScreenSpinner();
          })
      }
    }

    // Logic to add service endpoint
    ct.addServiceEndpoint = function (serviceId) {
      if (ct.addNewServiceEndPoint
        && ct.addNewServiceEndPoint.description && ct.addNewServiceEndPoint.description.trim() !== ''
        && ct.addNewServiceEndPoint.endpoint && ct.addNewServiceEndPoint.endpoint.trim() !== ''
        && ct.addNewServiceEndPoint.method && ct.addNewServiceEndPoint.method.trim() !== ''
        && ct.addNewServiceEndPoint.example
        && ct.addNewServiceEndPoint.example.response && ct.addNewServiceEndPoint.example.response.trim() !== ''
        && ct.addNewServiceEndPoint.example.request && ct.addNewServiceEndPoint.example.request.trim() !== '') {
        ct.showFullScreenSpinner();
        ct.addServiceEndpointAPI(serviceId, ct.addNewServiceEndPoint)
          .then(res => {
            const serviceUpdated = res.data.service;
            ct.services = ct.services.map(service => service._id === serviceId ? serviceUpdated : service)
            ct.openServiceForModal = serviceUpdated;
            ct.addNewServiceEndPoint = { example: {} }
            ct.showServiceAddEndpoint = false;
            Notification.success('Service endpoint added!')
          })
          .catch(err => {
            Notification.error('Service endpoint could not be added!')
          })
          .finally(() => {
            ct.closeFullScreenSpinner();
          })
      } else {
        Notification.error('You have missing endpoint fields!')
      }
    }

    ct.removeServiceEndpoint = function (serviceId, endpointIndex) {
      if (confirm('Are you sure you want to delete this endpoint?')) {
        ct.showFullScreenSpinner();
        ct.removeServiceEndpointAPI(serviceId, endpointIndex)
          .then(res => {
            const serviceUpdated = res.data.service;
            ct.services = ct.services.map(service => service._id === serviceId ? serviceUpdated : service)
            ct.openServiceForModal = serviceUpdated;
            Notification.success('Service endpoint deleted')
          })
          .catch(err => {
            Notification.error('Service endpoint could not be deleted')
          })
          .finally(() => {
            ct.closeFullScreenSpinner();
          })
      }
    }

    ct.getLocaleList = function () {
      ct.getLocaleListAPI()
        .then(res => {
          ct.localeList = res.data.locales;
        })
        .catch(err => {
          console.log(err);
        })
    }

    // TODO: Get the real URL of the app.
    ct.onRequestLighthouseAnalytics = function (url) {
      if (url === undefined) {
        Notification.error('Your app url is undefined. Make sure your app is running!')
        return;
      }
      ct.showFullScreenSpinner();
      ct.getLighthouseMetricsAPI(url)
        .then(res => {
          ct.lighthouseAudits = res.data.audits ? res.data.audits : []
          var view = new vega.View(vega.parse({ ...res.data.vegaPlot, width: document.getElementById('analytics-box').offsetWidth - 200 }))
            .renderer('canvas')  // set renderer (canvas or svg)
            .initialize('#view') // initialize view within parent DOM container
            .hover()             // enable hover encode set processing
            .run();
        })
        .catch(err => console.log(err))
        .finally(() => {
          ct.closeFullScreenSpinner();
        })
    }

    ct.isObjectEmpty = function (object) {
      return Object.keys(object).length <= 0;
    }

    ct.myFilter = function (object) {
      const filter = ct.datasetAndServicefilterInput;
      if (filter && filter.trim() !== '') {
        let bool = false;
        const regExp = new RegExp(filter, 'i');
        for (let key in object) {
          if (key === 'name') {
            const name = object[key];
            if (name.match(regExp)) {
              object.appliedFilters = { [key]: name }
              bool = true;
            }
          } else if (key === 'tags') {
            const tags = object[key].map(t => t.text)
            let demTags = [];
            tags.forEach(tag => {
              if (tag.match(regExp)) {
                bool = true;
                demTags.push(tag);
                object.appliedFilters = { tags: demTags }
              }
            })
          } else if (key === 'schemaDotOrg') {
            if (object.schemaDotOrg.type && object.schemaDotOrg.type.trim() !== '') {
              const type = object.schemaDotOrg.type;
              if (type.match(regExp)) {
                bool = true;
                object.appliedFilters = { 'Schema-Type': type }
              }
            }

          }
        }
        return bool;
      }
      // If no filter is present show em all
      else {
        object.appliedFilters = {};
        return true;
      }
    }

  }


]);