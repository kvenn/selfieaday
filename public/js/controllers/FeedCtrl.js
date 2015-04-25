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
			 return $scope.currentUser && userIndexOf(user.followers, $scope.currentUser) != -1;
		 };

		 $scope.showComments = function (user)
		 {
			 $scope.commentsModalUser = user;
			 $('#myModal').modal('show');
		 };

		 // TODO pull out to global functions
		 function userIndexOf(arr, user)
		 {
			 for (var i = 0; i < arr.length; i++)
			 {
				 if (arr[i]._id == user._id)
				 {
					 return i;
				 }
			 }
			 return -1;
		 }
	 }]);