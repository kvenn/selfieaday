// public/js/services/PicService.js
angular.module('UserService', []).factory('User', ['$http', function ($http)
{
	return {

		// Get all users
		get: function ()
		{
			$http.get('/api/user')
				.success(function (data)
				{
					return data;
				})
		},

		create: function (picData)
		{
			return $http.post('/api/user', picData);
		}
	}

}]);