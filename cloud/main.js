var ig = require('cloud/instagram-v1-1.0.js');
var express = require('express');
var app = express();

ig.initialize('e098fc55f76442deaf8057c0fcaeeb76');
ig.setAccessToken('261345369.dc8bd7d.d743823297444ed1acc38b9b0e1f5ef2');

var FIREBASE_URL = 'https://apis.firebaseio.com';

Parse.Cloud.afterSave("Chat", function(request) {
    console.log('==============1====================')
    var jsn = request.object.get("message")
    console.log('==============2===================' + jsn)
    console.log('==============3===================')

    Parse.Cloud.httpRequest({
        method: 'POST',
        url: FIREBASE_URL + '/chat.json',
        body: '{"test":"complete"}'
    }).then(function(httpResponse) {
        console.log('Success!');
    },
    function(httpResponse) {
        console.error('Request failed with response code ' + httpResponse.status);
    });
});



// App configuration section
//app.set('views', 'cloud/views');  // Folder containing view templates
//app.set('view engine', 'ejs');    // Template engine
app.use(express.bodyParser());    // Read the request body into a JS object

var UserItem = Parse.Object.extend("IgUser");


// Attach request handlers to routes
app.get('/test', function(req, res) {
  // GET http://example.parseapp.com/test?message=hello
	ig.searchUser({
	q: 'otherchews',
	count: '1'
	}).then(function(httpResponse) {
		userid = httpResponse.data["data"][0]["id"]

        var userItem = new UserItem();
        userItem.set("userid", userid);

		ig.getRecentMediaByUser(userid,{
		count: '10'
		}).then(function(httpResponse) {
			var images = httpResponse.data["data"];
			var captions = [];
			images.forEach(function(e){
				captions.push({caption:e["caption"]["text"],image:e["images"]["standard_resolution"]["url"]})
			});
			userItem.set("captions",captions);
			userItem.save(null, {
                success: function(userItem) {
                   console.log("Success");

                },
                error: function(userItem, error) {
                    alert('Try another instagram account' + error.message);
                }
            });
            res.send(captions);



		},
		function(error) {
		console.log(error);
		});
	},
	function(error) {
	console.log(error);
	});

});

app.post('/process_user', function(req, res) {
  // POST http://example.parseapp.com/test (with request body "message=hello")
  res.json({ message: req.body.message });  // Send a JSON response
});

// Attach the Express app to your Cloud Code
app.listen();