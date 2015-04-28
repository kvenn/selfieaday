angular.module('auth', [])
	.factory('Auth', ['$q', '$location', '$http', '$cookies', 'Helpers', function ($q, $location, $http, $cookies, Helpers)
	{
		var currentUser;

		return {
			signup: function (username, password, email)
			{
				$http
					.post('/signup', {
						username: username,
						email:    email,
						password: password
					})
					.success(function (data)
					{
						currentUser = data.user;
						Helpers.setCookie(data.user);
						// Redirect to feed after login
						$location.path('/')
					});
			},

			login: function (username, password)
			{
				$http
					.post('/login', {
						username: username,
						password: password
					})
					.success(function (data)
					{
						currentUser = data.user;
						Helpers.setCookie(data.user);
						// Redirect to feed after login
						$location.path('/');
					});
			},

			logout: function ()
			{
				$http
					.post('/logout')
					.success(function (data)
					{
						currentUser = null;
						delete $cookies['u'];
						// Redirect to feed after logout
						$location.path('/')
					});
			},

			isLoggedIn: function ()
			{
				// If the server sent the cookie, they're signed in
				return !!$cookies['u'];
			},

			updateCurrentUser: function (user)
			{
				currentUser = user;
				Helpers.setCookie(user);
				return currentUser;
			},

			currentUser: function ()
			{
				return currentUser;
			}

		};
	}]);