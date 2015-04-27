angular.module('helpers', [])
	.factory('Helpers', ['$q', '$location', '$http', '$cookies', function ($q, $location, $http, $cookies)
	{
		return {
			setCookie: function (user)
			{
				var copiedUser = jQuery.extend({}, user);
				delete copiedUser['pics'];
				delete copiedUser['comments'];
				$cookies['u'] = JSON.stringify(copiedUser);
			},

			userIndexOf: function (arr, user)
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
		};
	}]);