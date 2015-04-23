// public/js/controllers/FeedCtrl.js

angular.module('feed', [])
	.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider)
	{
		$routeProvider
			.when('/', {
				templateUrl:  '/views/feed.html',
				controller:   'FeedController',
				controllerAs: 'feed'
			});

		$locationProvider.html5Mode(true);
	}])
	.controller('FeedController',
	['$http', '$scope', '$routeParams', 'Auth',
	 function ($http, $scope, $routeParams, Auth)
	 {
		 // TODO Make current user and isloggedin just root scope?
		 $scope.currentUser = Auth.currentUser();

		 $scope.$watch( Auth.currentUser, function ( currentUser ) {
			 $scope.isLoggedIn = Auth.isLoggedIn();
			 $scope.currentUser = currentUser;
		 });

		 $scope.getUsers = function ()
		 {
			 $http.get('/api/user')
				 .success(function (data)
				 {
					 $scope.users = data;
				 });
		 };
		 $scope.getUsers();

		 // Check if enter was pressed
		 //$(document).keypress(function (e)
		 //{
			// if (e.which == 13)
			// {
			//	 // Get the focused element:
			//	 var focused = $(':focus');
			//	 if (focused.is('input') && focused.hasClass('comment-input'))
			//	 {
			//		 console.log(focused.scope().node)
			//	 }
			// }
		 //});

	 }]);