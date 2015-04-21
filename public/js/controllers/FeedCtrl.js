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
		 //$scope.basePhotoUrl = "https://selfieaday.s3.amazonaws.com/";

		 $http.get('/api/user')
			 .success(function (data)
			 {
				 $scope.users = data;
			 });

		 // Check if enter was pressed
		 $(document).keypress(function (e)
		 {
			 if (e.which == 13)
			 {
				 // Get the focused element:
				 var focused = $(':focus');
				 if(focused.is('input'))
				 {

				 }
			 }
		 });

	 }]);