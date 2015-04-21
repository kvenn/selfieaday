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
	.directive('logout', ['$http', function ($http)
	{
		return {
			restrict: 'A',
			link:     function (scope, element, attrs)
			{
				element.on('click', function (e)
				{
					e.preventDefault();
					$http.post('/logout');
				});
			}
		}
	}])
	.directive('slideshow', ['$timeout', '$interval', function ($timeout, $interval)
	{
		return {
			restrict: 'A',
			scope:    {images: '=images'},
			link:     function (scope, element, attrs)
			{
				//scope.$watch('images', function() {

				//var fullPathUrl = "https://selfieaday.s3.amazonaws.com/";
				//scope.imgIndex = 0;
				//var timeout = $timeout(function advanceSlide()
				//{
				//	scope.imgIndex = (scope.imgIndex + 1) % scope.images.length;
				//	attrs.$set('src', fullPathUrl + scope.images[scope.imgIndex].filename);
				//	$timeout(advanceSlide, 500);
				//});

				var fullPathUrl = "https://selfieaday.s3.amazonaws.com/";
				scope.imgIndex = 0;

				var interval = $interval(function ()
				{
					if(scope.images.length != 0)
						scope.imgIndex = (scope.imgIndex + 1) % scope.images.length;
						attrs.$set('src', fullPathUrl + scope.images[scope.imgIndex].filename);
				}, 100);

				scope.$on('$destroy', function() {
					$interval.cancel(interval);
				});

				//});
			}
		};
	}])
	.directive('enterpress', function ()
	{
		return {
			scope: {user: '=user'},
			link:  function (scope, element, attrs)
			{
				element.bind("keydown keypress", function (event)
				{
					if (event.which === 13)
					{
						// submit this comment for this user
						console.log(scope.user);

						event.preventDefault();
					}
				});
			}
		}
	});
