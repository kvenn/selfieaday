angular.module('common-directives', [])
	.directive('redir', ['$http', function ($http)
	{
		return {
			restrict: 'A',
			link:     function (scope, element, attrs)
			{
				element.on('click', function (e)
				{
					e.preventDefault();
					window.location = attrs.href;
				});
			}
		}
	}])
	//.directive('logout', ['$http', function ($http)
	//{
	//	return {
	//		restrict: 'A',
	//		link:     function (scope, element, attrs)
	//		{
	//			element.on('click', function (e)
	//			{
	//				e.preventDefault();
	//				$http.post('/logout');
	//
	//				scope.logoutEvent();
	//			});
	//		}
	//	}
	//}])
	.directive('slideshow', ['$timeout', '$interval', function ($timeout, $interval)
	{
		return {
			restrict: 'A',
			scope:    {images: '=images'},
			link:     function (scope, element, attrs)
			{
				//scope.$watch('images', function() {

				var fullPathUrl = "https://selfieaday.s3.amazonaws.com/";
				scope.imgIndex = 0;

				var interval = $interval(function ()
				{
					if (scope.images.length != 0)
						scope.imgIndex = (scope.imgIndex + 1) % scope.images.length;
					attrs.$set('src', fullPathUrl + scope.images[scope.imgIndex].filename);
				}, 200);

				scope.$on('$destroy', function ()
				{
					$interval.cancel(interval);
				});

			}
		};
	}])
	.directive('commentinput', ['$http', function ($http)
	{
		return {
			scope: {
				user: '=',
			},
			link:  function (scope, element, attrs)
			{
				element.bind("keydown keypress", function (event)
				{
					if (event.which === 13)
					{
						// submit this comment for element user
						var comment = {
							text:           element.val(),
							facelapseOwner: scope.user._id
						};
						$http.post('/api/comment', comment)
							.success(function (data)
							{
								scope.user.comments.push(data)
								element.val('');
							});

						event.preventDefault();
					}
				});
			}
		}
	}]);
