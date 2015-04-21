var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
var bCrypt = require('bcrypt-nodejs');

module.exports = function (passport)
{
	passport.use('login', new LocalStrategy({
			passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
		},
		function (req, username, password, done)
		{
			if (username)
				username = username.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

			// asynchronous
			process.nextTick(function ()
			{
				User.findOne({'username': username}).select('+password').exec(function (err, user)
				{
					// if there are any errors, return the error
					if (err)
						return done(err);

					// if no user is found, return the message
					if (!user)
					{
						console.log('User Not Found with username ' + username);
						return done(null, {error: 'No user found.'});
					}

					if (!isValidPassword(user, password))
					{
						console.log('Invalid Password');
						return done(null, {error: 'Oops! Wrong password.'});
					}

					// User and password both match, return user from done method
					// which will be treated like success
					return done(null, user);
				});
			});
		}));

	var isValidPassword = function (user, password)
	{
		return bCrypt.compareSync(password, user.password);
	}
};
