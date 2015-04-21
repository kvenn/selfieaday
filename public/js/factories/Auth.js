angular.module('auth', [])
	.factory('Auth', ['$q', '$location', '$http', '$cookies', function ($q, $location, $http, $cookies)
	{
		var currentUser;
		var sessionKey = 'li';
		var loggedInVal = '42';
		var callInProgress;

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
						$cookies[sessionKey] = loggedInVal;
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
						$cookies[sessionKey] = loggedInVal;
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
						delete $cookies[sessionKey];
						// Redirect to feed after logout
						$location.path('/')
					});
			},

			isLoggedIn: function ()
			{
				// They're logged in on the server but we need the currentUser
				// This will happen every refresh/new time viewing the app
				if ($cookies[sessionKey] == loggedInVal && (currentUser == null || typeof currentUser === 'undefined'))
				{
					if(!callInProgress)
					{
						callInProgress = true;
						// Get the user or log the person out
						$http
							.get('/api/current_user')
							.success(function (data)
							{
								currentUser = data.user;
							})
							.error(function (response, data, status, header)
							{
								//if(status == '404')
								//{
								delete $cookies[sessionKey];
								currentUser = null;
								//}
							})
							.finally(function(){
								callInProgress = false;
							});
					}
					// return true because they have the session cooking - but listen for a change in currentUser
					return true;
				}
				// They're logged in and there is a user - return true and don't make user call
				else if (($cookies[sessionKey] == loggedInVal) && currentUser)
				{
					return true;
				}
				else
				{
					return false;
				}
			},

			updateCurrentUser: function (user)
			{
				currentUser = user;
				return currentUser;
			},

			currentUser: function ()
			{
				return currentUser;
			}

		};
	}]);