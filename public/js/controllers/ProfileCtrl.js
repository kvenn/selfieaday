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
		 var mediaStream;
		 // TODO: just set the css to hide by default
		 $("#camera").hide();

		 var username = $routeParams.username;
		 // Viewing a user
		 if (username && username != $scope.currentUser.username)
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
		 //$scope.$watch(Auth.currentUser, function (currentUser)
		 //{
			// $scope.isLoggedIn = Auth.isLoggedIn();
			// $scope.currentUser = Auth.currentUser();
			// // viewing a user
			// if (username)
			// {
			//	 if ($scope.currentUser && $scope.user)
			//	 {
			//		 $scope.isFollowing = userIndexOf($scope.currentUser.following, $scope.user) != -1
			//	 }
			// }
			// // Viewing your own profile (if you're logged in)
			// else
			// {
			//	 if ($scope.isLoggedIn)
			//	 {
			//		 $scope.user = currentUser;
			//		 $scope.isCurrentProfile = true; // they're viewing their own profile
			//	 }
			//	 else
			//	 {
			//		 $scope.errorMessage = "Please log in to view your profile.";
			//		 $scope.user = null;
			//		 $scope.isCurrentProfile = false;
			//	 }
			// }
		 //
		 //});

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
			 $scope.cameraOn = true;
			 $("#camera").show();
			 startup();
		 };
		 $scope.hideCamera = function ()
		 {
			 $scope.cameraOn = false;
			 $("#camera").hide();
			 mediaStream.stop();
		 };

		 $scope.follow = function ()
		 {
			 $http.post('/api/follow/', {userToFollowId: $scope.user._id})
				 .success(function (data)
				 {
					 var currentUser = Auth.currentUser();
					 currentUser.following.push($scope.user);
					 $scope.user.followers.push(currentUser);

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
			 var png_blob = document.getElementById("photo").src;

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
		 // The width and height of the captured photo. We will set the
		 // width to the value defined here, but the height will be
		 // calculated based on the aspect ratio of the input stream.

		 var width = 666;    // We will scale the photo width to this
		 var height = 0;     // This will be computed based on the input stream

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

		 // Overlap picture of video
		 function updateLocation()
		 {
			 //var jVideo = jQuery('#video');
			 var jPhoto = jQuery('#photo');
			 var jCancel = jQuery('#cancelpicture');

			 var offset = jPhoto.offset();

			 //jPhoto.offset({top: offset.top, left: offset.left});

			 jCancel.offset({top: offset.top + 10, left: (offset.left + jPhoto.width()) - 30});
		 }

		 $(window).resize(function ()
		 {
			 updateLocation();
		 });

		 function startup()
		 {
			 video = document.getElementById('video');
			 canvas = document.getElementById('canvas');
			 photo = document.getElementById('photo');
			 startbutton = document.getElementById('startbutton');
			 cancelpicture = document.getElementById('cancelpicture');
			 uploadphoto = document.getElementById('uploadphoto');

			 $(cancelpicture).hide();
			 $(photo).hide();
			 $(uploadphoto).hide();

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
					 height = video.videoHeight / (video.videoWidth / width);

					 // Firefox currently has a bug where the height can't be read from
					 // the video, so we will make assumptions if this happens.
					 if (isNaN(height))
					 {
						 height = width / (4 / 3);
					 }

					 video.setAttribute('width', width);
					 video.setAttribute('height', height);
					 //canvas.setAttribute('width', width);
					 //canvas.setAttribute('height', height);
					 streaming = true;
				 }
			 }, false);

			 startbutton.addEventListener('click', function (ev)
			 {
				 takepicture();
				 ev.preventDefault();
				 updateLocation();
			 }, false);

			 cancelpicture.addEventListener('click', function (ev)
			 {
				 $(cancelpicture).hide();
				 $(photo).hide();
				 $(uploadphoto).hide();

				 $(startbutton).show();
				 $(video).show();
				 clearphoto();
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
		 // drawing that to the screen, we can change its size and/or apply
		 // other changes before drawing it.
		 function takepicture()
		 {
			 var context = canvas.getContext('2d');
			 if (width && height)
			 {
				 //canvas.width = width;
				 //canvas.height = height;
				 //context.drawImage(video, 0, 0, width, height);

				 // all of our images in the database should be exactly squareDim by squareDim
				 var squareDim = 640;
				 canvas.width = squareDim;
				 canvas.height = squareDim;
				 var widthDifference = width - height;
				 context.drawImage(video, widthDifference / 2, 0, width - widthDifference, height, 0, 0, squareDim, squareDim);

				 /*
				  var squareDim = 900;
				  canvas.width = squareDim;
				  canvas.height = squareDim;
				  // draw cropped image
				  var sourceX = 0;
				  var sourceY = 0;
				  var destWidth = squareDim;
				  var destHeight = squareDim;

				  var widthDifference = width - height;
				  // move over by widthdiff/2 to crop evenly on left and right
				  context.drawImage(video, widthDifference/2, sourceY, destWidth, destHeight, 0, 0, destWidth, destHeight);
				  */

				 var data = canvas.toDataURL('image/png');
				 photo.setAttribute('src', data);
				 // shrink the image to be the same size as the video so it looks normal (but also account for the square cropping)
				 photo.setAttribute('width', height);
				 photo.setAttribute('height', height);

				 updateLocation();
				 $(startbutton).hide();
				 $(video).hide();

				 $(cancelpicture).show();
				 $(photo).show();
				 $(uploadphoto).show();
			 }
			 else
			 {
				 clearphoto();
			 }
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
	 }]);

