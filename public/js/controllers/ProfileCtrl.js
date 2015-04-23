angular.module('profile', [])
	.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider)
	{
		$routeProvider
			.when('/profile', {
				templateUrl:  '/views/profile.html',
				controller:   'ProfileController',
				controllerAs: 'profile'
			});

		$locationProvider.html5Mode(true);
	}])

	.controller('ProfileController',
	['$http', '$scope', '$routeParams', '$route', 'Auth',
	 function ($http, $scope, $routeParams, $route, Auth)
	 {
		 /*===================================================
		  SCOPE VARIABLE INIT
		  ====================================================*/
		 // TODO: make global (rootscope?)
		 $scope.basePhotoUrl = "https://selfieaday.s3.amazonaws.com/";
		 $scope.isLoggedIn = Auth.isLoggedIn();
		 $scope.currentUser = Auth.currentUser();

		 // TODO this will be replaced by global user
		 $scope.$watch(Auth.currentUser, function (currentUser)
		 {
			 $scope.isLoggedIn = Auth.isLoggedIn();
			 $scope.currentUser = currentUser;
			 if ($scope.isLoggedIn && $scope.isCurrentProfile)
			 {
				 $scope.user = $scope.currentUser;
			 }
		 });


		 var mediaStream;
		 // TODO: just set the css to hide by default

		 var username = $routeParams.username;
		 // Viewing a user
		 if (username && ($scope.currentUser ? username != $scope.currentUser.username : true))
		 {
			 $http.get('/api/user/' + username)
				 .success(function (data)
				 {
					 $scope.user = data;
					 if ($scope.currentUser != null)
					 {
						 $scope.isFollowing = userIndexOf($scope.currentUser.following, $scope.user) != -1
					 }
				 })
				 .error(function (response, data, status, header)
				 {
					 //if(status == '404')
					 //{
					 $scope.errorMessage = "The user " + username + " doesn't exist or is set to private.";
					 //}
				 });
			 $scope.isCurrentProfile = false;
		 }
		 else
		 {
			 if ($scope.isLoggedIn)
			 {
				 // viewing their own profile
				 $scope.user = $scope.currentUser;
				 $scope.isCurrentProfile = true; // they're viewing their own profile
			 }
			 else
			 {
				 $scope.errorMessage = "Please log in to view your profile.";
				 $scope.user = null;
				 $scope.isCurrentProfile = false;
			 }
		 }

		 // Turn off camera once you leave the profile
		 $scope.$on('$destroy', function ()
		 {
			 if (mediaStream)
			 {
				 mediaStream.stop();
			 }
		 });

		 /*===================================================
		  CLICK HANDLERS
		  ====================================================*/
		 $scope.showCamera = function ()
		 {
			 $scope.photoMode = true;
			 startup();
		 };
		 $scope.hideCamera = function ()
		 {
			 $scope.photoMode = false;
			 mediaStream.stop();
		 };

		 $scope.cancelPicture = function()
		 {
			 clearphoto();
			 $scope.viewingPhoto = false;
			 updateLocation();
		 };

		 $scope.follow = function ()
		 {
			 $http.post('/api/follow/', {userToFollowId: $scope.user._id})
				 .success(function (data)
				 {
					 var currentUser = Auth.currentUser();
					 currentUser.following.push(toSimpleUser($scope.user));
					 $scope.user.followers.push(toSimpleUser(currentUser));

					 Auth.updateCurrentUser(currentUser);
					 $scope.isFollowing = true;
				 })
		 };

		 $scope.unfollow = function ()
		 {
			 $http.post('/api/unfollow/', {userToUnfollowId: $scope.user._id})
				 .success(function (data)
				 {
					 var currentUser = Auth.currentUser();
					 var unfollowUserIdx = userIndexOf(currentUser.following, $scope.user);
					 currentUser.following.splice(unfollowUserIdx, 1);

					 var removeFollowerIdx = userIndexOf($scope.user.followers, currentUser);
					 $scope.user.followers.splice(removeFollowerIdx, 1);

					 Auth.updateCurrentUser(currentUser);
					 $scope.isFollowing = false;
				 })
		 };

		 /*===================================================
		  PHOTO UPLOAD
		  ====================================================*/
		 // Upload photo on upload click
		 $scope.uploadPhoto = function ()
		 {
			 // Convert the data blob to a file to send to S3
			 var png_blob = document.getElementById("camera_photo").src;

			 var picture_id = generateUUID();

			 var status_elem = document.getElementById("status");
			 var s3upload = new S3Upload({
				 //file_dom_selector: 'files',
				 s3_object_name:  picture_id,
				 file_to_send:    dataURItoBlob(png_blob),
				 s3_sign_put_url: '/sign_s3',
				 onProgress:      function (percent, message)
				 {
					 status_elem.innerHTML = 'Upload progress: ' + percent + '% ' + message;
				 },
				 onFinishS3Put:   function (public_url)
				 {
					 status_elem.innerHTML = 'Upload completed. Uploaded to: ' + public_url;

					 var pic = {
						 filename: picture_id,
						 user:     Auth.currentUser()._id,
						 hashtags: ["#kyle"]
					 };

					 $http.post('/api/pic/', pic)
						 .success(function (data)
						 {
							 console.log(data);
							 var currentUser = Auth.currentUser();
							 currentUser.pics.push(pic);
							 Auth.updateCurrentUser(currentUser);
							 $scope.cancelPicture();
							 $scope.hideCamera();
						 });
				 },
				 onError:         function (status)
				 {
					 status_elem.innerHTML = 'Upload error: ' + status;
				 }
			 });
		 };


		 // TODO pull into directive
		 /*===================================================
		  CAMERA SETUP
		  ====================================================*/

		 // |streaming| indicates whether or not we're currently streaming
		 // video from the camera. Obviously, we start at false.
		 var streaming = false;

		 // The various HTML elements we need to configure or control. These
		 // will be set by the startup() function.
		 var video = null;
		 var canvas = null;
		 var photo = null;
		 var startbutton = null;
		 var cancelpicture = null;
		 var uploadphoto = null;

		 function updateLocation()
		 {
			 // Resize video (4/3 is the aspect ratio - this might be dynamic?)
			 var containerWidth;
			 containerWidth = $("#video_container").width();
			 if (containerWidth == 0)
			 	containerWidth = $("#camera_photo_container").width();

			 video.width = (4 / 3) * containerWidth;
			 var widthDifference = video.width - (video.width * (3 / 4));
			 $(video).css('margin-left', '-' + widthDifference / 2 + 'px');
		 }

		 $(window).resize(function ()
		 {
			 updateLocation();
		 });

		 $scope.photoMode = false;
		 $scope.viewingPhoto = false;

		 function startup()
		 {
			 video = document.getElementById('video');
			 canvas = document.getElementById('canvas');
			 photo = document.getElementById('camera_photo');
			 startbutton = document.getElementById('startbutton');
			 cancelpicture = document.getElementById('cancelpicture');
			 uploadphoto = document.getElementById('uploadphoto');

			 navigator.getMedia = (navigator.getUserMedia ||
								   navigator.webkitGetUserMedia ||
								   navigator.mozGetUserMedia ||
								   navigator.msGetUserMedia ||
								   navigator.oGetUserMedia);

			 navigator.getMedia(
				 {
					 video: true,
					 audio: false
				 },
				 function (stream)
				 {
					 mediaStream = stream;
					 if (navigator.mozGetUserMedia)
					 {
						 video.mozSrcObject = stream;
					 }
					 else
					 {
						 var vendorURL = window.URL || window.webkitURL;
						 video.src = vendorURL.createObjectURL(stream);
					 }
					 video.play();
				 },
				 function (err)
				 {
					 console.log("An error occured! " + err);
				 }
			 );

			 video.addEventListener('canplay', function (ev)
			 {
				 if (!streaming)
				 {
					 streaming = true;
				 }
			 }, false);

			 startbutton.addEventListener('click', function (ev)
			 {
				 takepicture();
				 $scope.viewingPhoto = true;
				 updateLocation();
				 ev.preventDefault();
			 }, false);

			 cancelpicture.addEventListener('click', function (ev)
			 {
				 $scope.cancelPicture();
			 }, false);

			 clearphoto();
		 }

		 // Wipe out the photo container
		 function clearphoto()
		 {
			 var data = canvas.toDataURL('image/png');
			 photo.setAttribute('src', data);
			 updateLocation();
		 }

		 // Capture a photo by fetching the current contents of the video
		 // and drawing it into a canvas, then converting that to a PNG
		 // format data URL. By drawing it on an offscreen canvas and then
		 // drawing that to the screen, then we can change its size
		 function takepicture()
		 {
			 var context = canvas.getContext('2d');

			 // all of our images in the database should be exactly squareDim by squareDim
			 var squareDim = 640;
			 canvas.width = squareDim;
			 canvas.height = squareDim;

			 context.drawImage(video, 80, 0, 480, 480, 0, 0, squareDim, squareDim);

			 var data = canvas.toDataURL('image/png');
			 photo.setAttribute('src', data);

			 updateLocation();
		 }


		 // TODO: pull out below methods into helper class
		 function userIndexOf(arr, user)
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

		 // convert file to blob that S3 can take
		 function dataURItoBlob(dataURI)
		 {
			 var binary = atob(dataURI.split(',')[1]);
			 var array = [];
			 for (var i = 0; i < binary.length; i++)
			 {
				 array.push(binary.charCodeAt(i));
			 }
			 return new Blob([new Uint8Array(array)], {type: 'image/png'});
		 }

		 function generateUUID()
		 {
			 var d = new Date().getTime();
			 var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c)
			 {
				 var r = (d + Math.random() * 16) % 16 | 0;
				 d = Math.floor(d / 16);
				 return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
			 });
			 return uuid;
		 }

		 // Remove the other fields that could cause circular references (followers/following)
		 function toSimpleUser(user)
		 {
			 return {
				 _id:      user._id,
				 username: user.username
			 }
		 }
	 }]);

