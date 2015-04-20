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
	['$http', '$scope', '$routeParams', 'Auth',
	 function ($http, $scope, $routeParams, Auth)
	 {
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
			 if (Auth.isLoggedIn())
			 {
				 $scope.user = Auth.currentUser();
				 $scope.isLoggedIn = Auth.isLoggedIn();
			 }
			 else
			 {
				 $scope.errorMessage = "Please log in to view your profile."
			 }
		 }


		 /**
		  * Photo Uploading
		  */
			 // Upload photo on upload click
		 $scope.uploadPhoto = function ()
		 {
			 // Convert the data blob to a file to send to S3
			 var png_blob = document.getElementById("photo").src;

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

			 function generateUUID(){
				 var d = new Date().getTime();
				 var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
					 var r = (d + Math.random()*16)%16 | 0;
					 d = Math.floor(d/16);
					 return (c=='x' ? r : (r&0x3|0x8)).toString(16);
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
							 user: Auth.currentUser()._id,
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


		 /**
		  * Photo Taking
		  */
		 // The width and height of the captured photo. We will set the
		 // width to the value defined here, but the height will be
		 // calculated based on the aspect ratio of the input stream.

		 var width = 400;    // We will scale the photo width to this
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

		 function startup()
		 {
			 video = document.getElementById('video');
			 canvas = document.getElementById('canvas');
			 photo = document.getElementById('photo');
			 startbutton = document.getElementById('startbutton');

			 navigator.getMedia =
			 (
			 navigator.getUserMedia ||
			 navigator.webkitGetUserMedia ||
			 navigator.mozGetUserMedia ||
			 navigator.msGetUserMedia);

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
					 height =
					 video.videoHeight / (
					 video.videoWidth / width);

					 // Firefox currently has a bug where the height can't be read from
					 // the video, so we will make assumptions if this happens.

					 if (isNaN(height))
					 {
						 height =
						 width / (
						 4 / 3);
					 }

					 video.setAttribute('width', width);
					 video.setAttribute('height', height);
					 canvas.setAttribute('width', width);
					 canvas.setAttribute('height', height);
					 streaming = true;
				 }
			 }, false);

			 startbutton.addEventListener('click', function (ev)
			 {
				 takepicture();
				 ev.preventDefault();
			 }, false);

			 clearphoto();
		 }

		 // Fill the photo with an indication that none has been
		 // captured.

		 function clearphoto()
		 {
			 var context = canvas.getContext('2d');
			 context.fillStyle = "#AAA";
			 context.fillRect(0, 0, canvas.width, canvas.height);

			 var data = canvas.toDataURL('image/png');
			 photo.setAttribute('src', data);
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
				 canvas.width = width;
				 canvas.height = height;
				 context.drawImage(video, 0, 0, width, height);

				 var data = canvas.toDataURL('image/png');
				 photo.setAttribute('src', data);
			 }
			 else
			 {
				 clearphoto();
			 }
		 }

		 //// Set up our event listener to run the startup process
		 //// once loading is complete.
		 //window.addEventListener('load', startup, false);
		 startup()

	 }]);

