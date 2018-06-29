angular.module('app').controller("RoutesController", ["$scope", "Kong", function ($scope, Kong) {
    $scope.routes = [];
    $scope.total = null;
    $scope.offset = null;

    var loaded_pages = [];
    $scope.loadMore = function() {
        var page = '/routes?';
        if ($scope.offset) {
            page += 'offset=' + $scope.offset + '&';
        }
        if (loaded_pages.indexOf(page) !== -1) {
            return;
        }
        loaded_pages.push(page);

        Kong.get(page).then(function(collection) {
            if ($scope.total === null) {
                $scope.total = 0;
            }

            Kong.get('/services?').then(function(serviceCollection) {
                var serviceData = serviceCollection.data.map(function(services){
                    return {serviceId: services.id, serviceName: services.name};
                });

                angular.forEach(collection.data, function(routes, index){
                    angular.forEach(serviceData, function(service){
                        if (routes.service.id === service.serviceId) {
                            collection.data[index]['serviceName'] = service.serviceName;
                        }
                    })
                });
            });

            $scope.routes.push.apply($scope.routes, collection.data);
            $scope.total += collection.data.length;
            $scope.offset = collection.offset ? collection.offset : null;
        });
    };
    $scope.loadMore();

    $scope.showDeleteModal = function (name, id) {
        $scope.current = {name: name, id: id};
        $('#deleteRoute').modal('open');
    };

    $scope.abortDelete = function () {
        $('#deleteRoute').modal('close');
    };

    $scope.performDelete = function () {
        $('#deleteRoute').modal('close');
        Kong.delete('/routes/' + $scope.current.id).then(function () {
            $scope.total -= 1;
            $scope.routes.forEach(function(element, index) {
                if (element.id === $scope.current.id) {
                    $scope.routes.splice(index, 1);
                }
            });
        });
    }
}]);

