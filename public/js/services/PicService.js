// public/js/services/PicService.js
angular.module('PicService', []).factory('Pic', ['$http', function ($http)
{

	return {
		// call to get all nerds
		get:    function ()
		{
			return $http.get('/api/pics');
		},

		// these will work when more API routes are defined on the Node side of things
		// call to POST and create a new nerd
		create: function (picData)
		{
			return $http.post('/api/pics', picData);
		},

		// call to DELETE a nerd
		delete: function (id)
		{
			return $http.delete('/api/pics/' + id);
		}
	}

}]);