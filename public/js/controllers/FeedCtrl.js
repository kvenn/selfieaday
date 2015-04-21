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
	['$http', '$scope', '$routeParams', '$timeout',
	 function ($http, $scope, $routeParams, $timeout)
	 {
		 // TODO pull out to global
		 $scope.basePhotoUrl = "https://selfieaday.s3.amazonaws.com/";

		 $http.get('/api/user')
			 .success(function (data)
			 {
				 $scope.users = data;

				 $scope.images = data[1].pics;

				 $scope.imgIndex = 0;
				 $timeout(function advanceSlide() {
					 $scope.imgIndex = ($scope.imgIndex + 1) % $scope.images.length;
					 $timeout(advanceSlide, 500);
				 });
			 });

	 }]);