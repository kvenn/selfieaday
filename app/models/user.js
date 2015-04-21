// app/models/user.js

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('User',
	{
		username:    String,
		password:    {type: String, select: false},
		email:       String,
		phoneNumber: String,
		isPrivate:   {type: Boolean, default: false},
		pics:        [{type: Schema.Types.ObjectId, ref: 'Pic'}],
		comments:    [{type: Schema.Types.ObjectId, ref: 'Comment'}],
		followers:    [{type: Schema.Types.ObjectId, ref: 'User'}],
		following:    [{type: Schema.Types.ObjectId, ref: 'User'}]
	});