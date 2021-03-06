// app/routes.js

path = require('path');
aws = require('aws-sdk');

// grab the nerd model we just created
var Pic = require('./models/pic');
var User = require('./models/user');
var Comment = require('./models/comment');
//var ObjectId = require('mongoose').Types.ObjectId;

module.exports = function (app, passport)
{
	/*===================================================
	 USER API
	 ====================================================*/
	var userPopulateQuery = [{path: 'pics', select: 'filename hashtags'},
							 {path: 'followers', select: 'username'},
							 {path: 'following', select: 'username'},
							 {path: 'comments', select: 'author text'}];

	// Get all users
	app.get('/api/user', function (req, res)
	{
		var query;
		if (req.user)
		{
			// Exclude the signed in user
			query = {isPrivate: false, username: {'$ne': req.user.username}}
		}
		else
		{
			query = {isPrivate: false}
		}

		// populate pics wit hteh actual pics they reference
		User.find(query).populate(userPopulateQuery).exec(function (err, docs)
		{
			if (err)
				res.status(400).send(err);

			//res.json(users);
			var options = {
				path:  'comments.author',
				model: 'User'
			};

			if (err)
				res.status(400).send(err);
			User.populate(docs, options, function (err, users)
			{
				res.json(users);
			});
		});
	});

	// Get specific user by username
	app.get('/api/user/:username', function (req, res)
	{
		var username = req.params.username;
		User.findOne({username: username}).populate(userPopulateQuery).exec(function (err, doc)
		{
			var options = {
				path:  'comments.author',
				model: 'User'
			};

			if (err)
				res.status(400).send(err);
			User.populate(doc, options, function (err, user)
			{
				res.json(user);
			});
		})
	});

	// follow a user
	app.post('/api/follow', function (req, res)
	{
		var userToFollowId = req.body.userToFollowId;
		var currentUserId = req.user._id;
		User.update({_id: currentUserId}, {$addToSet: {following: userToFollowId}}).exec(function (err, numAffected)
		{
			if (err)
				res.status(400).send(err);
			// if successful, update the other end of the relationship to reflect their followers
			User.update({_id: userToFollowId}, {$addToSet: {followers: currentUserId}}).exec(function (err, numAffected)
			{
				console.log(numAffected);
				if (err)
					res.status(400).send(err);
				res.send();
			})
		})
	});

	// unfollow a user
	app.post('/api/unfollow', function (req, res)
	{
		var userToUnfollowId = req.body.userToUnfollowId;
		var currentUserId = req.user._id;
		User.update({_id: currentUserId}, {$pull: {following: userToUnfollowId}}).exec(function (err, numAffected)
		{
			if (err)
				res.status(400).send(err);
			// if successful, update the other end of the relationship to reflect their followers
			User.update({_id: userToUnfollowId}, {$pull: {followers: currentUserId}}).exec(function (err, numAffected)
			{
				if (err)
					res.status(400).send(err);
				res.send();
			})
		})
	});

	// write comment on a user
	app.post('/api/comment', function (req, res)
	{
		var facelapsOwner = req.body.facelapseOwner;
		var text = req.body.text;
		var authorId = req.user._id;

		var comment = new Comment();
		comment.facelapseOwner = facelapsOwner;
		comment.text = text;
		comment.author = authorId;

		comment.save(function (err, comment)
		{
			User.update({_id: facelapsOwner}, {$addToSet: {comments: comment._id}}).exec(function (err, numAffected)
			{
				if (err)
					res.status(404).send(err);

				Comment.populate(comment, 'author', function (err, comment)
				{
					res.send(comment);
				});
			});
		});
	});

	// write comment on a user
	app.delete('/api/comment/:id', function (req, res)
	{
		var commentId = req.params.id;
		User.update({comments: commentId}, {$pull: {comments: commentId}}).exec(function (err, numAffected)
		{
			if (err)
				res.status(404).send(err);
			res.send();
		});
	});

	/*===================================================
	 Search API
	 ====================================================*/
	// Find all users by username
	app.get('/api/searchUser/:username', function (req, res)
	{
		User.find({isPrivate: false, "username": new RegExp(req.params.username, "i")}).populate(userPopulateQuery).exec(function (err, docs)
		{
			var options = {
				path:  'comments.author',
				model: 'User'
			};

			if (err)
				res.status(400).send(err);
			User.populate(docs, options, function (err, users)
			{
				res.json(users);
			});
		});
	});

	// Find all users by hashtag
	app.get('/api/searchHashtag/:hashtag', function (req, res)
	{

		Pic.find({hashtags: {$in: [req.params.hashtag]}}).exec(function (err, pics)
		{
			// Map the docs into an array of just the _ids
			var ids = pics.map(function(pic) { return pic._id; });

			User.find({isPrivate: false, pics: {$in: ids}}).populate(userPopulateQuery).exec(function (err, docs)
			{
				if (err)
					res.status(400).send(err);
				var options = {
					path:  'comments.author',
					model: 'User'
				};

				User.populate(docs, options, function (err, users)
				{
					res.json(users);
				});
			})
		});
	});

	/*===================================================
	 PIC API
	 ====================================================*/
	// Sign the S3 Credentials to allow direct upload
	app.get('/sign_s3', function (req, res)
	{
		//aws.config.update({accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY});
		aws.config.update({
			accessKeyId:     process.env.AWS_ACCESS_KEY,
			secretAccessKey: process.env.AWS_SECRET_KEY
		});
		var s3 = new aws.S3();
		var s3_params = {
			Bucket:      process.env.S3_BUCKET,
			Key:         req.query.s3_object_name,
			Expires:     60,
			ContentType: req.query.s3_object_type,
			ACL:         'public-read'
		};
		s3.getSignedUrl('putObject', s3_params, function (err, data)
		{
			if (err)
			{
				console.log(err);
			}
			else
			{
				var return_data = {
					signed_request: data,
					url:            'https://selfieaday.s3.amazonaws.com/' + req.query.s3_object_name
				};
				res.write(JSON.stringify(return_data));
				res.end();
			}
		});
	});

	// Send a picture up and save it to the user
	app.post('/api/pic', function (req, res)
	{
		var pic = new Pic();
		pic.filename = req.body.filename;
		pic.user = req.user._id;
		if (req.body.hashtags)
		{
			pic.hashtags = req.body.hashtags;
		}
		pic.save(function (err, pic)
		{
			console.log(pic);
			// Add the pic to the users "pics" array
			User.update({_id: req.user._id}, {$addToSet: {pics: pic._id}}).exec(function (err, numAffected)
			{
				//User.populate(user, 'pics', function (err, user)
				//{
				if (err)
					res.status(404).send(err);
				res.send();
				//})
			});
		});
	});

	/*===================================================
	 AUTH API
	 ====================================================*/
	app.get('/api/current_user', function (req, res)
	{
		// They're logged in, return the user
		if (req.isAuthenticated())
		{
			User.findOne({_id: req.user._id}).populate(userPopulateQuery).exec(function (err, user)
			{
				if (err)
					res.status(400).send(err);
				return res.json({
					user: user
				})
			});
		}
		else
		{
			res.status(404).send('Not found');
		}
	});

	// process the login form
	app.post('/login', function (req, res, next)
	{
		if (!req.body.username || !req.body.password)
		{
			return res.status(400).send({error: 'Username and Password required'});
		}
		passport.authenticate('login', function (err, user, info)
		{
			if (err)
			{
				return res.status(400).send(err);
			}
			if (user.error)
			{
				return res.status(400).send({error: user.error});
			}
			req.logIn(user, function (err)
			{
				if (err)
				{
					return res.status(400).send(err);
				}

				User.findOne({_id: user._id}).populate(userPopulateQuery).exec(function (err, user)
				{
					if (err)
						res.status(400).send(err);

					return res.json({
						user: user
					})
				});
			});
		})(req, res);
	});

	// process the signup form
	app.post('/signup', function (req, res, next)
	{
		if (!req.body.username || !req.body.password || !req.body.email)
		{
			return res.status(400).send({error: 'Username, Email, and Password required'});
		}
		passport.authenticate('signup', function (err, user, info)
		{
			if (err)
			{
				return res.status(400).send(err);
			}
			if (user.error)
			{
				return res.status(400).send({error: user.error});
			}
			req.logIn(user, function (err)
			{
				if (err)
				{
					return res.status(400).send(err);
				}
				return res.json(
					{
						user: user
					});//res.json({redirect: '/profile'});
			});
		})(req, res);
	});

	// log user out
	app.post('/logout', function (req, res)
	{
		req.logout();
		res.json(
			{
				redirect: '/',
				success:  'Successfully logged out'
			});
	});

	/*===================================================
	 Front end routes
	 ====================================================*/
	// route to handle all angular requests
	app.get('*', function (req, res)
		//app.use(function(req, res, next){
	{
		if (req.isAuthenticated())
		{
			User.findOne({_id: req.user._id}).populate(userPopulateQuery).exec(function (err, user)
			{
				if (err)
					res.status(400).send(err);

				//res.cookie('u', JSON.stringify(user), {maxAge: 900000});
				//res.sendFile('index.html', {root: path.join(__dirname, '../public')}); // load our public/index.html file
				res.render('index', {globalUser: user})
			});
		}
		else
		{
			//res.cookie('u', '', {maxAge: 900000});
			//res.sendFile('index.html', {root: path.join(__dirname, '../public')}); // load our public/index.html file
			console.log("not logged in");
			res.render('index', {globalUser: ""})
		}
	});
};
