// public/js/controllers/LoginCtrl.js

angular.module('login', [])
	.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider)
	{
		$routeProvider
			.when('/signup', {
				templateUrl:          '/views/signup.html',
				controller:           'SignupController',
				controllerAs:         'signup',
				caseInsensitiveMatch: true
			})
			.when('/login', {
				templateUrl:          '/views/login.html',
				controller:           'LoginController',
				controllerAs:         'login',
				caseInsensitiveMatch: true
			})
			.otherwise({
				templateUrl:  '/views/feed.html',
				controller:   'FeedController',
				controllerAs: 'feed'
			});

		$locationProvider.html5Mode(true); //Use html5Mode so your angular routes don't have #/route
	}])
	.controller('LoginController', ['$http', '$scope', '$location', 'Auth', function ($http, $scope, $location, Auth)
	{
		if (Auth.isLoggedIn())
		{
			$location.path('/');
		}
	}]).controller('SignupController', ['$http', '$scope', '$location', 'Auth', function ($http, $scope, $location, Auth)
	{
		if (Auth.isLoggedIn())
		{
			$location.path('/');
		}
	}])
	.controller('LoginForm', ['$http', '$scope', 'Auth', function ($http, $scope, Auth)
	{
		$scope.login = function ()
		{
			Auth.login(this.username, this.password)
		};
	}])
	.controller('SignupForm', ['$http', '$scope', 'Auth', function ($http, $scope, Auth)
	{
		$scope.signup = function ()
		{
			Auth.signup(this.username, this.password, this.email);
		}
	}]);
