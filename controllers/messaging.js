//Validator is used to validate and serialize data
var validator = require('validator');

//Misc functions
var helperFunctions = require('../helpers.js');

//POBox model
var POBox = require('../models/POBox.js');

//Location model
var Location = require('../models/Location.js');

//Message model
var Message = require('../models/Message.js');

module.exports = function(app,express,db)
{

	//Sends a message from the current user's PO Box to a recipient. This
	//Parameters: 		 	
	//				recipient_box_number		- 			POBox number of recipient
	//				title  						- 			String with message title
	//				template					-			String with template file name
	//				number_content_lines		-			The number of body lines in request
	//				content_line_#				-			A line for the body, where # is the line number
	app.post('/messaging/sendMessage',helperFunctions.isAuthenticated, function(req, res) {
		var recipient_box_number,
			title,
			template,
			number_content_lines,
			content_lines;

		//Grab variables from the body
		recipient_box_number = req.body.recipient_box_number;
		title = req.body.title;
		template = req.body.template;
		number_content_lines = req.body.number_content_lines;
		content_lines = new Array();

		//Check the variables are set
		if(!recipient_box_number || !title || !template || !number_content_lines)
			return;

		//Sanatize inputs
		recipient_box_number = parseInt(recipient_box_number);
		number_content_lines = parseInt(number_content_lines);
		title = validator.escape(title);

		//Build the content object
		for (var i=0;i<number_content_lines;i++) {
			content_lines.push(validator.escape(req.body["content_line_" + i]));
		}

		//Load the recipient's PO Box
		POBox.find({box_number: recipient_box_number}, function(err,foundBox)
		{
			if(err)
				throw err;
			if(!foundBox)
			{
				return;
			}

			//Got the box, so compose the message
			Message.sendMessage(req.user.box_number,foundBox[0]._id,title,content_lines,template,function(message)
			{
			});
		});
	});

	//Returns a view with all the logged in user's messages
	//Parameters: 	count 			-			Number of messages to list
	//				begin 			- 			Message to start list with
	//				sort  			- 			Sort option. 0 for descending, 1 for ascending
	//				sortParam		-			Field to sort on. 0 for sent time, 1 for read
	app.get('/messaging/listMessages', helperFunctions.isAuthenticated, function(req, res) {
		//Simplified object to return, don't want to return a users password
		var toReturnObject = {
			user_firstName: req.user.first_name,
		}

		//Load the current user's messages
		Message.find({'_id':{$in: req.user.messages}}, function(err, messages)
		{
			toReturnObject.user_messages = messages;


			//Render the inbox, providing the messages and user name
			res.render('inbox', toReturnObject);
		});
	});

	//Deletes message with given id from current user's account
	//Parameters: 	messageID		-			The id of the message to delete
	app.get('/messaging/deleteMessage/:messageID', helperFunctions.isAuthenticated, function(req, res) {
		console.log(req.user.messages);

		var messageID;

		messageID = req.params.messageID;

		//Check that the messageID exists in the array, don't delete someone else's messages!
		Message.findById(messageID, function(err, message)
		{
			if(err || !message)
			{
				res.sendStatus(401);
				return;
			}
				
			message.remove(function(err)
			{
				if(err)
					throw err;

				res.render('inbox', toReturnObject);
			});
		});
	});
} 