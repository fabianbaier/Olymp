var app = angular.module('motership', [
    'ui.router',
    'angular-loading-bar',
    'mgcrea.ngStrap',
    'ngAnimate'
]);


app.config(['$stateProvider', '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/home');

        $stateProvider
            .state('home', {
                url: '/home',
                views: {
                    '': {
                        templateUrl: 'templates/home.html'
                    },
                    'containers-all@home': {
                        controller: "ContainersAll",
                        templateUrl: 'templates/containers-all.html'
                    }
                }
            })
            .state('clusters', {
                url: '/clusters',
                views: {
                    '': {
                        templateUrl: 'templates/clusters.html'
                    },
                    'clusters-all@clusters': {
                        controller: "clusters",
                        templateUrl: 'templates/clusters-all.html'
                    }
                }
            })
            .state('settings', {
                url: '/settings',
                views: {
                    '': {
                        templateUrl: 'templates/settings.html'
                    },
                    'settings-all@settings': {
                        controller: "Settings",
                        templateUrl: 'templates/settings-all.html'
                    }
                }
            })
            .state('terminal', {
                url: '/terminal',
                views: {
                    '': {
                        templateUrl: 'templates/terminal.html'
                    },
                    'terminalPageCtrl@terminal': {
                        controller: "terminalPageCtrl",
                        templateUrl: 'templates/terminal1.html'
                    }
                }
            })
    }]);



app.controller('ContainersAll', ['$scope', '$http', '$modal', '$log', 'api', function ($scope, $http, $modal, $log, api) {
    $log.log('ContainersAll instantiated');
    $scope.loadAllContainers = function () {
        api.getAllContainers().then(function (response) {
            $scope.containers = response.data;
        }, function (error) {
            $log.error(error);
        });
    };
    $scope.stopContainer = api.stopContainer;
    $scope.startCluster = api.startCluster;
    $scope.loadAllContainers();

    var myOtherModal = $modal({scope: $scope, template: 'templates/certificate.html', show: false});
    $scope.showModal = function (certificate) {
        $scope.certificate = certificate;
        myOtherModal.$promise.then(myOtherModal.show);
    }
}]);

app.controller('terminalPageCtrl', ['$scope', '$http', '$modal', '$log', 'api', 'TerminalServices', function ($scope, $http, $modal, $log, api, TerminalServices) {
     $log.log('Terminal instantiated');
     $scope.containerName = 'vps1';
     TerminalServices.getTerminal2($scope.containerName).then(function(term) {
       term.open(document.getElementById('console'));
     })}]);

app.controller('clusters', ['$scope', '$http', '$modal', '$log', '$state', 'api', 'TerminalServices', function ($scope, $http, $modal, $log, $state, api, TerminalServices) {
    $log.log('Clusters instantiated');
    $scope.loadClusters = function () {
        api.getClusters().then(function (response) {
            $scope.clusters = response.data.clusterlist;
        }, function (error) {
            $log.error(error);
        });
    };
    $scope.stopCluster = api.stopCluster;
    $scope.startCluster = api.startCluster;
    $scope.loadClusters();

    var showClusterDetails = $modal({scope: $scope, template: 'templates/modal.html', show: false});
    $scope.showClusterDetails = function (cluster) {
        $scope.cluster = cluster;
        showClusterDetails.$promise.then(showClusterDetails.show);
    }

    $scope.showTerminal = function(container) {
             TerminalServices.getTerminal2(container).then(function(term) {
                 container.terminal = term;
                 //term.open(document.getElementById('console' + container));
                 term.open(document.getElementById('console'));
             });
         };
}]);

app.controller('Settings', ['$scope', '$http', '$modal', '$log', 'api', function ($scope, $http, $modal, $log, api) {
    $log.log('Settings instantiated');
    $scope.loadSettings = function () {
        api.getSettings().then(function (response) {
            $scope.containers = response.data;
        }, function (error) {
            $log.error(error);
        });
    };
    $scope.loadSettings();

    $scope.loadAuthenticate = function () {
        api.startAuthenticate().then(function (response) {
            $scope.containers = response.data;
        }, function (error) {
            $log.error(error);
        });
    };
    $log.log('Authenticate instantiated');

    $scope.loadCertificates = function () {
        api.getCertificates().then(function (response) {
            $scope.certificates = response.data;
        }, function (error) {
            $log.error(error);
        });
    };
    $scope.loadCertificates();
    $log.log('Certificates instantiated');

    var myOtherModal = $modal({scope: $scope, template: 'templates/certificate.html', show: false});
    $scope.showModal = function (certificate) {
        $scope.certificate = certificate;
        myOtherModal.$promise.then(myOtherModal.show);
    }
}]);

app.service('TerminalServices', ['$http', '$q', '$log',
        function ($http, $q, $log) {
            var obj = {};
             $log.log('TerminalServices started');
            obj.getTerminal = function(containerName) {
              return $http.post('http://127.0.0.1:5000/v1.0/containers/exec/' + containerName).then(function(data) {
                $log.log('API post sent');
                var op = data.data.clusterexec.metadata.id;
                $log.log('ID: '+JSON.stringify(data.data.clusterexec.metadata.id));
                // Necessary?
                /*$http.get('https://localhost:9000' + op).then(function(data) {
                  return data;
                });*/

                return data;
              });
            }


            obj.getTerminal2 = function(containerName) {

              return obj.getTerminal(containerName).then(function(data) {
                 var operationId = data.data.clusterexec.metadata.id;
                 $log.log(' Secret: '+JSON.stringify(data.data.clusterexec.metadata.metadata.fds[0]));
                 //var secret = data.data.clusterexec.metadata.metadata.fds[0];
                 var secret = data.data.clusterexec.metadata.metadata.fds[0];
                 //var cert1 = "-----BEGIN CERTIFICATE----- MIIFuDCCA6CgAwIBAgIRANzgBaw2wE9f1u2rm/LMoxIwDQYJKoZIhvcNAQELBQAw MjEcMBoGA1UEChMTbGludXhjb250YWluZXJzLm9yZzESMBAGA1UEAwwJcm9vdEBp Y3MyMB4XDTE2MDgwMzAzMzgwNVoXDTI2MDgwMTAzMzgwNVowMjEcMBoGA1UEChMT bGludXhjb250YWluZXJzLm9yZzESMBAGA1UEAwwJcm9vdEBpY3MyMIICIjANBgkq hkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAwcix/WI6gmfKRQC7eNDtLYmfmqC7WbDT Ve7ndOqYtLRbl/PfffFlMfBS0dlPqx8M2hBCIK9vYoJCZ+8pupEGhIaQOsYpqs2m l8tsWFRFmoB4vVQyMdIilg/uTZWDsJN6n2EGjm8Bm3taqzURTxvXoFJV6gcyXjCt ZNcDdIr/kJqaoIlPKLnvlPmPu7zE5yuA/x94i0RQrttE1WXYiGDPNi5R/L1XccLs o0CBzOIOXo96ZfXJ/RcL0WZYE4ExgNElnSO1IhkDiMcSxojJFNNXf44HH++oFKMp E7DkwtSJxOZAclcUie27OAGjrAtHYChRHnLveekohQ5T5Re8RMNjvQhR3covHy6g LJrN1+2IDkfMeImoznCImUvc3SAD/+zwfTd31cTZ6YHkQ+CGRDjuHafYx9X0IgHr oEFxDCvQzmUKKNbfxVKNpxKZJZV0z1rGWyRMlxYrX7CdHLmMqLEIAVynPt2up5fB x4q/TWVu/eUQ2b2cp9OnIKhofR7TCzE9QRxnXFeMhZxMRXlngQHj1cb8RYUIIrWz OZysU0nbENgE6WhZEPSOdnmapzuyGjAJcOIS0ihGoiSTo46/wDbU/8y080jQBAFB UXaVKfky27DsL0FB7eh3cWkn0aGDk4ijMhcuxYNrHHCP59wCqQ3e69Eqi96O3nhW QABUW4flqaECAwEAAaOByDCBxTAOBgNVHQ8BAf8EBAMCBaAwEwYDVR0lBAwwCgYI KwYBBQUHAwEwDAYDVR0TAQH/BAIwADCBjwYDVR0RBIGHMIGEggRpY3MyghAxOTIu MTY4LjEuMTIyLzI0giYyNjA0OjU1MDA6MTY6Mjc6YzUwMTo0ZjNiOmVlMjA6ODIy NC82NIIlMjYwNDo1NTAwOjE2OjI3OjIyMTo1Y2ZmOmZlZjA6MWYwNC82NIIbZmU4 MDo6MjIxOjVjZmY6ZmVmMDoxZjA0LzY0MA0GCSqGSIb3DQEBCwUAA4ICAQBSuS45 bTgVr3LzzrNDhcWvK2WwskmoxktuhdoNvKWXFKHEidlty97SeYY9Dt5uHKC8Q77P Bad1qInd34l//af0jE3GJ3CasHc3zXTRQC/FHLQzrXPfgq0ZYHKuhj1Q1/QnbkpT 5VHeAaWQk+QEN80xSJwRE8g2IXvFL43YPI9tFdfNo7ue3qTkZ4wlquPWYKJXwGHD ctOdnwxibuUBYgPCp5ZCkbDgMpfImsOwjgEVtTgQQAMo+/tmqwjf7I5ncFqOkxc1 rNZ3j/RapzPh/qDIGwM3aEOewyWCJcYAsYA5WBzL8weYy3iP9daCXUt0pTbnIq2C sx/zLtFwUguiKwasLxQScayP4eBq9d5UNVnUMMUkor2sKXCPsH1DuYFKATpk0z6w 72CurkT6eebPOAXh/2KvMl/ynhGdtLUi+tpNnYszs+yLF88zXeXfpPBzoAzFbVHT HGjOTWSg15M2dbju1FbBPlPWswZR4cA9mMHLmEsycXgt+d9CX2UUT2PPpBAsM1ap 5ko5yH19GivbTAtQOvdHpPFtzvAwaEQqF5bmXHvhQ7WwqLtR2FhhsK+7gNF3Pfca m5v0k/V0aVYQGplEaNJBWAHSUCnMs3776QJB4e/ypdpbP40P1nHRsopJ/rwuMJtH Z8GBLpOaWT0zagF+5KDlh+HHT78EDBRO+cGXDg== -----END CERTIFICATE-----"
                 //var key1 = "-----BEGIN RSA PRIVATE KEY----- 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 -----END RSA PRIVATE KEY-----"
                 //var wssurl = 'ws://127.0.0.1:5000/v1.0/wss/'
                 var wssurl = 'wss://192.168.1.128:8443/1.0/operations/'
                   + operationId
                   + "/websocket?secret="
                   + secret;
                 //$log.log('Client Crt: '+cert1);
                 //$log.log('Client Key: '+key1);

                 //var ws = new WebSocket('wss://192.168.1.128:8443/1.0/events?type=operation', wsoptions);
                 var sock = new WebSocket(wssurl);

                 var term = new Terminal({
                     cols: 160,
                     rows: 15,
                     useStyle: true,
                     screenKeys: true,
                     cursorBlink: true
                 });

                 term.on('data', function (data) {
                   console.log('WebSocket on');
                     sock.send(new Blob([data]));
                 });


                 sock.onopen = function (e) {
                   console.log('WebSocket onopen');
                            //container.terminal = term;
                            //term.open(document.getElementById('console'));

                            sock.onmessage = function (msg) {
                                if (msg.data instanceof Blob) {
                                    var reader = new FileReader();
                                    reader.addEventListener('loadend', function () {
                                        term.write(reader.result);
                                    });
                                    reader.readAsBinaryString(msg.data);
                                } else {
                                    term.write(msg.data);
                                }

                            };

                            sock.onclose = function (msg) {
                                console.log('WebSocket closed');
                                term.destroy();
                            };
                            sock.onerror = function (err) {
                                console.error(err);
                            };
                        };

                        return term;
                 })

            }

            return obj;
        }]);

app.service('api', ['$http', function ($http) {
    var url = "http://127.0.0.1:5000";

    function getActiveContainers() {
        return $http.get(url + "/1.0");
    }

    function getAllContainers() {
      return $http.get(url + "/v1.0/raw");
    }

    function getAllClusters() {
      return $http.get(url + "/v1.0/raw");
    }

    function getSettings() {
      return $http.get(url + "/v1.0/raw");
    }

    function getContainer(id) {
        return $http.get(url + "/1.0" + id);
    }

    function getClusters() {
        return $http.get(url + "/v1.0/containers");
    }

    function startAuthenticate() {
        return $http.get(url + "/v1.0/authenticate");
    }

    function startCluster(id) {
        return $http.put(url + "/v1.0/containers/start/" + id);
    }

    function stopCluster(id) {
        return $http.put(url + "/v1.0/containers/stop/" + id);
    }

    function getCertificates() {
        return $http.get(url + "/v1.0/raw/certificates");
    }

    function stopContainer(id) {
        return $http.get(url + "/containers/stop/" + id);
    }

    function deleteContainer(id) {
        return $http.get(url + "/containers/delete/" + id);
    }

    return {
        getActiveContainers: getActiveContainers,
        getAllContainers: getAllContainers,
        getSettings: getSettings,
        getContainer: getContainer,
        getAllClusters: getAllClusters,
        getClusters: getClusters,
        deleteContainer: deleteContainer,
        startAuthenticate: startAuthenticate,
        startCluster: startCluster,
        stopCluster: stopCluster,
        getCertificates: getCertificates,
        stopContainer: stopContainer
    }
}]);
