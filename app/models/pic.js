// app/models/pic.js

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// define our pic model
// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('Pic',
	{
		filename: {type: String, default: ''},
		user: {type: Schema.Types.ObjectId, ref: 'User'},
		hashtags: [String]
	});