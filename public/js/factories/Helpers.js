angular.module('helpers', [])
	.factory('Helpers', ['$q', '$location', '$http', '$cookies', function ($q, $location, $http, $cookies)
	{
		return {
			setCookie: function (user)
			{
				var copiedUser = jQuery.extend({},user);
				delete copiedUser['pics'];
				delete copiedUser['comments'];
				$cookies['u'] = JSON.stringify(copiedUser);
			}
		};
	}]);