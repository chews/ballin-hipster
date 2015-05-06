var ig = require('cloud/instagram-v1-1.0.js');
var express = require('express');
var app = express();

ig.initialize('e098fc55f76442deaf8057c0fcaeeb76');
ig.setAccessToken('261345369.dc8bd7d.d743823297444ed1acc38b9b0e1f5ef2');

var FIREBASE_URL = 'https://apis.firebaseio.com';
Parse.Cloud.beforeSave("Chat", function(request, response){
    if(request.object.get("name") === "cia"){
        request.object.set("message", "redacted");
    }
    response.success();
});



// Parse.Cloud.afterSave("Chat", function(request) {
//     var jsn = request.object.get("message")
//     console.log('=================================' + jsn)

//     Parse.Cloud.httpRequest({
//         method: 'POST',
//         url: FIREBASE_URL + '/chat.json',
//         body: '{"test":"complete"}'
//     }).then(function(httpResponse) {
//         console.log('Success!');
//     },
//     function(httpResponse) {
//         console.error('Request failed with response code ' + httpResponse.status);
//     });
// });



// App configuration section
//app.set('views', 'cloud/views');  // Folder containing view templates
//app.set('view engine', 'ejs');    // Template engine
app.use(express.bodyParser());    // Read the request body into a JS object

var UserItem = Parse.Object.extend("IgUser");
var WrdEntry = Parse.Object.extend("WrdEntry");


// Parse.Cloud.define("processKeys", function(request, response) {

  
//     returnArr = [];
//     query.each(function(obj){
//         returnArr.push(obj.id);
//         console.log(obj.id);
//     }).then(function(obj){
//         return returnArr;
//         console.log("done")
//     });
// });




// Attach request handlers to routes
app.get('/user/:id', function(req, res) {
  // GET http://example.parseapp.com/test?message=hello
    ig.searchUser({
    q: req.params.id,
    count: '1'
    }).then(function(httpResponse) {
        var userItem;

        userid = httpResponse.data["data"][0]["id"]

        var query = new Parse.Query(UserItem);
        query.equalTo("userid",userid);
        query.first({
            success: function(object)
            {
                if (typeof(object)=="undefined") // new object so we save it. 
                {
                    userItem = new UserItem();
                    userItem.set("userid", userid);
                }  
                else 
                {
                    userItem = object;
                }

            },
            error: function(error) {
                console.log("no item found");
            }
        });


        ig.getRecentMediaByUser(userid,{
        count: '10' //change count here 
        }).then(function(httpResponse) {
            var posts = httpResponse.data["data"];
            var captions = [];
            posts.forEach(function(e){
                if (e["caption"] != null)
                {
                    if (e["caption"]["text"] != null)
                    {
                        if (e["tags"] != null)
                        {
                            ig_caption = e["caption"]["text"].toLowerCase();
                            e["tags"].forEach(function(tag)
                            {
                                ig_caption = ig_caption.replace("#"+tag,"");
                            });
                        }


                        ig_caption = ig_caption.replace(/[.,!?;:"']/g,"");
                        ig_caption = ig_caption.replace("  "," ");

                        ig_caption = ig_caption.split(" ");
                        ig_caption_new = [];
                        ig_caption.forEach(function(ig_element){
                            if (ig_element.length > 3)
                            {
                                if (ig_element[0]!="@")
                                {
                                    ig_caption_new.push(ig_element);
                                }
                            }
                        });

                      //Parse.Cloud.run("processKeys", {"captions":captions, "image":e["id"], "caption":ig_caption_new});
                        var queryTwo = new Parse.Query(WrdEntry);
                        queryTwo.containedIn("word",ig_caption_new);
                        queryTwo.find({
                          success: function(results) {
                                captions.push({image:e["id"],caption:ig_caption_new,wordkeys:results});
                                userItem.set("captions",captions);
                                userItem.save(null, {
                                    success: function(userItem) {
                                        res.send(captions);
                                        console.log("Success");
                                    },
                                    error: function(userItem, error) {
                                        alert('Try another instagram account' + error.message);
                                    }
                                });
                            },
                           error: function(error) {
                             console.log(error);

                           }
                        });
                  
                        // captions.push({caption:ig_caption_new,hashs:e["tags"],image:e["images"]["standard_resolution"]["url"]})
                     // captions.push({image:e["id"],caption:ig_caption_new,wordkeys:process_keys(ig_caption_new)});
                    }
                  }
            });

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
