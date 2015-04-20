// app/models/user.js

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('User',
	{
		username:    String,
		password:    String,
		email:       String,
		phoneNumber: String,
		pics:        [{type: Schema.Types.ObjectId, ref: 'Pic'}],
		isPrivate:   {type: Boolean, default: false}
	});