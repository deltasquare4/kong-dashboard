angular.module('app').controller("RouteController", ["$scope", "Kong", "$routeParams", "Alert", "route", "env", function ($scope, Kong, $routeParams, Alert, route, env)
{
    $scope.schema = env.schemas.route;
    $scope.errors = {};


    onInit();

    function onInit() {
        if ($routeParams.id) {
            $scope.route = route;
            $scope.title = "Edit Route";
            $scope.action = "Save";
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
            Kong.patch('/services/' + $scope.route.id, $scope.route).then(function () {
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
            Kong.post('/services', $scope.route).then(function () {
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
    };
}]);
