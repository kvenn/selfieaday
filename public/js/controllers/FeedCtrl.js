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
	['$http', '$scope', '$routeParams', 'Auth', 'Helpers', '$rootScope',
	 function ($http, $scope, $routeParams, Auth, Helpers, $rootScope)
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

		 $scope.picsMoreThan = function (val)
		 {
			 return function (item)
			 {
				 return item.pics.length > val;
			 }
		 };

		 $rootScope.$on('searchEvent', function (event, args)
		 {
			 if(args.charAt(0) == '@')
			 {
				 var username = args.substring(1); // remove @ symbol
				 username.replace(/ /g,''); // remove spaces
				 $http.get('/api/user/' + username)
					 .success(function (data)
					 {
						 $scope.users = [].concat( data );;
					 })
					 .error(function (response, data, status, header)
					 {
						 //if(status == '404')
						 //{
						 //$scope.errorMessage = "The user " + username + " doesn't exist or is set to private.";
						 //}
						 console.log("error");
					 });
			 }
			 else if (args.charAt(0) == '#')
			 {
				 console.log("hashtag search")
			 }
			 else
			 {
				 console.log("generic search")
			 }
			 //$http.get('/api/user')
				// .success(function (data)
				// {
				//	 $scope.users = data;
				// });
		 });
	 }]);