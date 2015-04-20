angular.module('auth', [])
	.factory('Auth', ['$q', '$location', '$http', function ($q, $location, $http)
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
						console.log(data);
						currentUser = data.user;
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
						console.log(data);
						currentUser = data.user;
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
						console.log(data);
						currentUser = null;
						// Redirect to feed after logout
						$location.path('/')
					});
			},

			isLoggedIn: function ()
			{
				if (currentUser == null || typeof currentUser === 'undefined')
				{
					$http
						.get('/api/is_logged_in')
						.success(function (data)
						{
							if (data.loggedIn)
							{
								currentUser = data.user;
								return true;
							}
							else
							{
								return false;
							}
						});
				}
				else
					return true;
			},

			currentUser: function ()
			{
				return currentUser;
			}

		};
	}]);