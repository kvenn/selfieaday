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
	['$http', '$scope', '$routeParams', 'Auth', 'Helpers', '$rootScope', 'growl',
	 function ($http, $scope, $routeParams, Auth, Helpers, $rootScope, growl)
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
					 Helpers.preloadImages($scope.users);
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
			 if (args.charAt(0) == '@')
			 {
				 var username = args.substring(1); // remove @ symbol
				 username.replace(/ /g, ''); // remove spaces
				 $http.get('/api/searchUser/' + username)
					 .success(function (data)
					 {
						 if (data.length > 0)
						 {
							 $scope.users = [].concat(data);
							 Helpers.preloadImages($scope.users);
						 }
						 else
						 {
							 growl.error("No users found with that username: " + username, {ttl: 4000});
						 }
					 })
					 .error(function (response, data, status, header)
					 {
						 growl.error("Something went wrong...please try again later", {ttl: 3000});
						 console.log(response);
					 });
			 }
			 else if (args.charAt(0) == '#')
			 {
				 var hashtag = args.substring(1); // remove # symbol
				 hashtag.replace(/ /g, ''); // remove spaces
				 $http.get('/api/searchHashtag/' + hashtag)
					 .success(function (data)
					 {
						 if (data.length > 0)
						 {
							 $scope.users = [].concat(data);
							 Helpers.preloadImages($scope.users);
						 }
						 else
						 {
							 growl.error("No pics found with that hashtag: " + hashtag, {ttl: 4000});
						 }
					 })
					 .error(function (response, data, status, header)
					 {
						 growl.error("Something went wrong...please try again later", {ttl: 3000});
						 console.log(response);
					 });
			 }
			 else if (args == "") // no query = full feed
			 {
				 $scope.getUsers();
			 }
			 else
			 {
				 growl.info("Please specify either username (@) or hashtag (#)", {ttl: 4000});
			 }
		 });
	 }]);