// public/js/controllers/NavCtrl.js

angular.module('navbar', [])
	.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider)
	{
		$routeProvider
			.when('/', {
				templateUrl:  '/views/feed.html',
				controller:   'FeedController',
				controllerAs: 'feed'
			});

		$routeProvider
			.when('/profile/:username', {
				templateUrl:  '/views/profile.html',
				controller:   'ProfileController',
				controllerAs: 'profile'
			});

		$locationProvider.html5Mode(true);
	}])
	.controller('NavigationController', ['$http', '$scope', '$routeParams', 'Auth', function ($http, $scope, $routeParams, Auth)
	{
		$scope.logout = function ()
		{
			Auth.logout();
		};

		$scope.$watch( Auth.currentUser, function ( currentUser ) {
			$scope.isLoggedIn = Auth.isLoggedIn();
			$scope.currentUser = currentUser;
		});

	}]);