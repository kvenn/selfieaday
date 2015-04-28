angular.module('helpers', [])
	.factory('Helpers', ['$q', '$location', '$http', '$cookies',
						 function ($q, $location, $http, $cookies)
	{
		return {
			setCookie: function (user)
			{
				var copiedUser = jQuery.extend({}, user);
				delete copiedUser['pics'];
				delete copiedUser['comments'];
				delete copiedUser['images'];
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
			},

			preloadImages: function(users)
			{
				for (var i = 0; i < users.length; i++)
				{
					var user = users[i];
					user.images = [];
					var pics = user.pics;
					for(var x=0;x<pics.length;x++) {
						var tempImg = new Image();
						tempImg.src = "https://selfieaday.s3.amazonaws.com/" + pics[x].filename;
						user.images.push(tempImg);
					}
				}
			}
		};
	}]);