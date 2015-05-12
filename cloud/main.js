var ig = require('cloud/instagram-v1-1.0.js');
var express = require('express');
var app = express();

ig.initialize('e098fc55f76442deaf8057c0fcaeeb76');
ig.setAccessToken('261345369.dc8bd7d.d743823297444ed1acc38b9b0e1f5ef2');

var FIREBASE_URL = 'https://apis.firebaseio.com';

// App configuration section
//app.set('views', 'cloud/views');  // Folder containing view templates
//app.set('view engine', 'ejs');    // Template engine
app.use(express.bodyParser());    // Read the request body into a JS object

var UserItem = Parse.Object.extend("IgUser");
var WrdEntry = Parse.Object.extend("WrdEntry");
var TriadScore = Parse.Object.extend("TriadScore");

var userItem;

// Attach request handlers to routes
app.get('/user/:id', function(req, res) {

    var triadScore = new TriadScore();
    var query = new Parse.Query(TriadScore);
    

    ig.searchUser({
    q: req.params.id,
    count: '1'
    }).then(function(httpResponse) {

        userid = httpResponse.data["data"][0]["id"];
        igusername = httpResponse.data["data"][0]["username"];

        makeUser(userid,igusername);


        var postCount = 10;
        ig.getRecentMediaByUser(userid,{
        count: postCount //Only 20 images allowed per call, use pagination feature
        }).then(function(httpResponse) {

            var posts = httpResponse.data["data"];
            // res.send(posts);
            var captions = [];

            posts.forEach(function(post){
                post = cleanPost(post);
            });

            var gameWords = [];
            var gameWordCombos = []; 
            
            posts.forEach(function(post,index){
                var processKeys = new Parse.Query(WrdEntry);
                var keys = [];


                index++; //count # of posts

                processKeys.containedIn("word",post["words"]);
                processKeys.each(function(obj){
                    keys.push(obj.id);
                    gameWords.push(obj.get("word"));
                    gameWordCombos.push(obj.get("combos"));

                }).then(function(obj) {
                    if (post["words"].length !== 0)
                    {
                        captions.push({image:post["id"],caption:post["words"],wordkeys:keys});
                    }

                    if (index == postCount)  //check if last post in loop
                    {
                        userItem.set("captions",captions);
                        userItem.set("gameWords", gameWords);
                        userItem.set("gameWordCombos", gameWordCombos);
                        userItem.save(null, {

                            success: function(userItem) {
                                res.send({words:gameWords,combos:gameWordCombos});
                                console.log("Success");
                            },
                            error: function(userItem, error) {
                                console.log('Try another instagram account' + error.message);
                            }

                        });
                    }
                });
            });
        },
        function(error) {
            res.send("This account is private. Try another.");
        });
    },
    function(error) {
        res.send(error);
    });
});

app.post('/process_user', function(req, res) {
  res.json({ message: req.body.message });  
});

// Attach the Express app to your Cloud Code
app.listen();


function makeUser(userid, username)
{
    var query = new Parse.Query(UserItem);
    query.equalTo("userid",userid);
    query.first({
        success: function(object)
        {
            if (typeof(object)=="undefined") // new object so we save it. 
            {
                userItem = new UserItem();
                userItem.set("userid", userid);
                userItem.set("igusername", igusername);
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
    return userItem;

}

function cleanPost(post)
{
    if (post["caption"] != null && post["caption"]["text"] != null && post["tags"] != null)
    {
        var cap = post["caption"];
        var text = post["caption"]["text"];
        text = text.toLowerCase();
        var tags = post["tags"];
        tags.forEach(function(tag)
        {
            text = text.replace("#"+tag,"");
        });

        text = text.replace(/[.,!?;:"'+()/]/g," ").replace("  "," ");
        text = text.split(" ");

        wrdArray = [];
        text.forEach(function(word){
            if (word.length > 3 && word[0]!="@")
            {
                wrdArray.push(word);
            }
        });
    }
    if (wrdArray !== "undefined")
    {
        post["words"] = wrdArray;
    }
    else 
    {
        post["words"] =[];
    }
}

