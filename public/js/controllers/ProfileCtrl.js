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
		 // TODO: make global (rootscope?)
		 $scope.basePhotoUrl = "https://selfieaday.s3.amazonaws.com/";

		 var username = $routeParams.username;
		 if (username)
		 {
			 $http.get('/api/user/' + username)
				 .success(function (data)
				 {
					 $scope.user = data;
				 })
				 .error(function (response, data, status, header)
				 {
					 //if(status == '404')
					 //{
					 $scope.errorMessage = "The user " + username + " doesn't exist or is set to private.";
					 //}
				 });
		 }
		 else
		 {
			 $scope.$watch(Auth.currentUser, function (currentUser)
			 {
				 var loggedIn = Auth.isLoggedIn();
				 if (loggedIn)
				 {
					 $scope.isLoggedIn = loggedIn;
					 $scope.user = currentUser;
					 $scope.isCurrentProfile = true; // they're viewing their own profile
				 }
				 else
				 {
					 $scope.errorMessage = "Please log in to view your profile."
					 $scope.isLoggedIn = loggedIn;
					 $scope.user = null;
					 $scope.isCurrentProfile = false;
				 }
			 });
		 }

		 // Might need to wait for onload?
		 // Only start camera if this is the current users profile
		 $scope.$watch($scope.isCurrentProfile, function (currentUser)
		 {
			 if ($scope.isCurrentProfile && !streaming)
				 startup();
		 });

		 /*===================================================
		  PHOTO UPLOAD
		  ====================================================*/
		 // Upload photo on upload click
		 $scope.uploadPhoto = function ()
		 {
			 // Convert the data blob to a file to send to S3
			 var png_blob = document.getElementById("photo").src;

			 // TODO: pull out below methods into helper class
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
					 // TODO: save off to photo table with picture_id
					 $http.post('/api/pic/',
						 {
							 filename: picture_id,
							 user:     Auth.currentUser()._id,
							 hashtags: ["#kyle"]
						 })
						 .success(function (data)
						 {
							 console.log(data);
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


				 var squareDim = 500;
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

				 var data = canvas.toDataURL('image/png');
				 photo.setAttribute('src', data);
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
	 }]);

