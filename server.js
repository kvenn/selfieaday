#!/bin/env node

/** modules ================================================= */
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var multer = require('multer');
var methodOverride = require('method-override');
var passport = require('passport');
var expressSession = require('express-session');
var mongoose = require('mongoose');

/** configuration =========================================== */

// config files
var db = require('./config/db');

// connect to our mongoDB database
mongoose.connect(db.url);

app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());

// Initialize Passport
var initPassport = require('./app/passport/init');
initPassport(passport);

// get all data/stuff of the body (POST) parameters
// parse application/json
app.use(bodyParser.json());
// parse application/vnd.api+json as json
app.use(bodyParser.json({type: 'application/vnd.api+json'}));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));
// override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(methodOverride('X-HTTP-Method-Override'));
// for parsing multipart/form-data
app.use(multer());

// set the static files location /public/img will be /img for users
app.use(express.static(__dirname + '/public'));

//  Set the environment variables we need.
ipaddress = process.env.OPENSHIFT_NODEJS_IP;
port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

if (typeof ipaddress === "undefined")
{
	console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
	ipaddress = "127.0.0.1";
}

/** routes ================================================== */
require('./app/routes')(app,passport); // configure our routes

/** start app =============================================== */

//  Start the app on the specific interface (and port).
app.listen(port, ipaddress, function ()
{
	console.log('%s: Node server started on %s:%d ...', new Date(Date.now()), ipaddress, port);
});
