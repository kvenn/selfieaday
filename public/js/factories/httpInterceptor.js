/*
 Factory that listens to all responses from GET/POST and pre-processes it
 * If data.redirect is present, perform a redirect with angular (Hash redirect)
 * If data.error is present, display growl errors
 */

angular.module('httpFactory', [])
	.factory('myHttpResponseInterceptor', ['$q', '$location', 'growl', '$cookies', '$injector', function ($q, $location, growl, $cookies, $injector)
	{
		return {
			response:      function (response)
			{
				if (!!$cookies['u'])
				{
					var user = JSON.parse($cookies['u']);
					$injector.get('Auth').userFromCookie(user);
				}
				if (typeof response.data === 'object')
				{
					if (response.data.redirect)
					{
						$location.path(response.data.redirect);
						return {} || $q.when(response);
					}
					else if (response.data.error)
					{
						growl.error(response.data.error, {ttl: 4000});
					}
					else if (response.data.success)
					{
						growl.success(response.data.success, {ttl: 2000});
					}
				}
				return response || $q.when(response);
			},
			responseError: function (rejection)
			{
				if (typeof rejection.data === 'object')
				{
					if (rejection.data.redirect)
					{
						$location.path(rejection.data.redirect);
						return {} || $q.when(rejection);
					}
					else if (rejection.data.error)
					{
						growl.error(rejection.data.error, {ttl: 4000});
					}
				}
				return $q.reject(rejection);
			}
		};
	}])
	.config(['$httpProvider', function ($httpProvider)
	{
		$httpProvider.interceptors.push('myHttpResponseInterceptor');
	}]);
