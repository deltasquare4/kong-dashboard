angular.module('app').controller("RouteController", ["$scope", "Kong", "$routeParams", "Alert", "route", "env", function ($scope, Kong, $routeParams, Alert, route, env)
{
    $scope.schema = env.schemas.route;
    $scope.errors = {};
    $scope.services = {};

    onInit();

    function onInit() {
        Kong.get('/services').then(function(collection) {
            $scope.services = collection.data;
        });

        if ($routeParams.id) {
            $scope.route = route;
            $scope.title = "Edit Route";
            $scope.action = "Save";
            $scope.service = route.service.id;
        } else {
            $scope.route = {};
            $scope.title = "Add an Route";
            $scope.action = "Create";
        }
    }

    $scope.isEdit = function () {
        return $routeParams.id != null;
    }

    $scope.save = function () {
        if ( $scope.isEdit() ) {
            $scope.route = routeData();
            Kong.patch('/routes/' + $scope.route.id, $scope.route).then(function () {
                Alert.success('Route updated');
                // clearing errors.
                $scope.errors = {};
            }, function (response) {
                if (response.status == 400 || response.status == 409) {
                    $scope.errors = response.data;
                } else {
                    Alert.error('Unexpected error from Kong');
                    console.log(response);
                }
            });
        } else {
            $scope.route = routeData();
            Kong.post('/routes', $scope.route).then(function () {
                Alert.success('Route created');
                // clearing inputs.
                $scope.route = {};
                // clearing errors.
                $scope.errors = {};
            }, function (response) {
                if (response.status == 400 || response.status == 409) {
                    $scope.errors = response.data;
                } else {
                    Alert.error('Unexpected error from Kong');
                    console.log(response);
                }
            });
        }

        function routeData() {
            //convert to array
            var hosts;
            var paths;

            if (typeof($scope.route.hosts) === 'string' && typeof($scope.route.paths) === 'string') {
                hosts = $scope.route.hosts.split(',');
                paths = $scope.route.paths.split(',');
            } else if (typeof($scope.route.paths) === 'string') {
                paths = $scope.route.paths.split(',');
                hosts = $scope.route.hosts;
            } else if (typeof($scope.route.hosts) === 'string'){
                hosts = $scope.route.hosts.split(',');
                paths = $scope.route.paths;
            }

            //add to route object
            $scope.route.hosts = hosts;
            $scope.route.paths = paths;
            $scope.route.service = {id: $scope.service};

            return $scope.route;
        }
    };
}]);
