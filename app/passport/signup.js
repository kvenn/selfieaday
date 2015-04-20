var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
var bCrypt = require('bcrypt-nodejs');

module.exports = function (passport)
{
	passport.use('signup', new LocalStrategy({
			passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
		},
		function (req, username, password, done)
		{
			if (username)
				username = username.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive username matching

			// if the user is not already logged in:
			if (!req.user)
			{
				findOrCreateUser = function ()
				{
					User.findOne({'username': username}, function (err, user)
					{
						// In case of any error, return using the done method
						if (err)
						{
							console.log('Error in SignUp: ' + err);
							return done(err);
						}

						// already exists
						if (user)
						{
							console.log('User already exists with username: ' + username);
							return done(null, {error: 'That username is already taken.'});
						}
						else
						{
							// if there is no user with that email
							// create the user
							var newUser = new User();

							// set the user's local credentials
							newUser.username = username;
							newUser.password = createHash(password);
							newUser.email = req.param('email');
							newUser.firstName = req.param('firstName');
							newUser.lastName = req.param('lastName');

							// save the user
							newUser.save(function (err)
							{
								if (err)
								{
									console.log('Error in Saving user: ' + err);
									throw err;
								}
								console.log('User Registration successful');
								return done(null, newUser);
							});
						}

					});
				};

				// Delay the execution of findOrCreateUser and execute the method
				// in the next tick of the event loop (async)
				process.nextTick(findOrCreateUser);
			}
			else
			{
				// user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
				return done(null, req.user);
			}

		}));

	// Generates hash using bCrypt
	var createHash = function (password)
	{
		return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
	}

};


