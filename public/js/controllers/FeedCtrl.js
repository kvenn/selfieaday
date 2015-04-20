// public/js/controllers/FeedCtrl.js

angular.module('feed', [])
	.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider)
	{
		//$routeProvider
		//	.when('/profile', {
		//		templateUrl:  '/views/profile.html',
		//		controller:   'ProfileController',
		//		controllerAs: 'profile'
		//	});

		$locationProvider.html5Mode(true);
	}])
	.controller('FeedController',
	['$http', '$scope', '$routeParams',
	 function ($http, $scope, $routeParams)
	 {
		 $http.get('/api/user')
			 .success(function (data)
			 {
				 $scope.users = data;
			 });
	 }]);