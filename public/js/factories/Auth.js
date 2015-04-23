angular.module('auth', [])
	.factory('Auth', ['$q', '$location', '$http', '$cookies', function ($q, $location, $http, $cookies)
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
						$cookies['u'] = JSON.stringify(data.user);
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
				$cookies['u'] = JSON.stringify(user);
				return currentUser;
			},

			userFromCookie: function (user)
			{
				//if (user == '')
				//{
				//	delete $cookies['u'];
				//	currentUser = null;
				//}

				currentUser = user;
			},

			currentUser: function ()
			{
				return currentUser;
			}

		};
	}]);