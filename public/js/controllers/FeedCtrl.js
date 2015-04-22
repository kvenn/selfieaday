// public/js/controllers/FeedCtrl.js

angular.module('feed', [])
	.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider)
	{
		$locationProvider.html5Mode(true);
	}])
	.controller('FeedController',
	['$http', '$scope', '$routeParams', '$timeout',
	 function ($http, $scope, $routeParams, $timeout)
	 {

		 $scope.getUsers = function()
		 {
			 $http.get('/api/user')
				 .success(function (data)
				 {
					 $scope.users = data;
				 });
		 };
		 $scope.getUsers();

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

		 $scope.submitComment = function(userId) {
			 console.log('hit')
		 }

	 }]);