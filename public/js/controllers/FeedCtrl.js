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
	['$http', '$scope', '$routeParams', 'Auth', 'Helpers',
	 function ($http, $scope, $routeParams, Auth, Helpers)
	 {
		 // TODO Make current user and isloggedin just root scope?
		 $scope.currentUser = Auth.currentUser();

		 $scope.$watch(Auth.currentUser, function (currentUser)
		 {
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

		 $scope.isFollowing = function (user)
		 {
			 return $scope.currentUser && Helpers.userIndexOf(user.followers, $scope.currentUser) != -1;
		 };

		 $scope.showComments = function (user)
		 {
			 $scope.commentsModalUser = user;
			 $('#myModal').modal('show');
		 };
	 }]);