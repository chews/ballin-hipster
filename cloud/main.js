var ig = require('cloud/instagram-v1-1.0.js');


ig.initialize('e098fc55f76442deaf8057c0fcaeeb76');
ig.setAccessToken('261345369.dc8bd7d.d743823297444ed1acc38b9b0e1f5ef2');

var FIREBASE_URL = 'https://apis.firebaseio.com';


var WrdEntry = Parse.Object.extend("WrdEntry");
var TriadScore = Parse.Object.extend("TriadScore");

//Only 20 images allowed per call, use pagination feature
var POST_COUNT = 10; 


Parse.Cloud.define("findInstagramAccount",function(request,response)
{
    ig.searchUser({q:request.params.username, count:'1'}).then(function(httpResponse)
        {
            if (httpResponse.data["data"][0]) 
            {
                var userid = httpResponse.data["data"][0]["id"];
                var igusername = httpResponse.data["data"][0]["username"];
                response.success(userid);
            }
            else
            {
                response.error("Finding Instagram account failed.");
            }

        },
        function(error) 
        {
            response.error("Error: " + error.code + " " + error.message);
        });
});


Parse.Cloud.define("pullMedia", function(request, response)
{
    var userid = request.params.userid;
    ig.getRecentMediaByUser(userid,{
    count: POST_COUNT 
    }).then(function(httpResponse) {

        var posts = httpResponse.data["data"];

        var postWords = [];

        posts.forEach(function(post){

            post = cleanPost(post);

            if (post["words"].length != 0)
            {
                post["words"].forEach(function(word){
                    postWords.push(word);
                });
            }
        });

        Parse.Cloud.run('saveUser', { "postWords": postWords }, {
              success: function(gameWordCombos) {
                response.success(gameWordCombos);
              },
              error: function(error) {
                response.error("No sex");
              }
        });
    },
    function(error) {
        response.error("RE: POST_COUNT Ig getRecentMediaByUser - Not enough posts available");
    });
});


/*This function is called to save the user 
with the relevant postWords from Instagram posts.*/
Parse.Cloud.define("saveUser", function(request,response)
{
    var wordDictionary = new Parse.Query(WrdEntry);
    var keys = [];
    var gameWords = [];
    var gameWordCombos = []; 

    wordDictionary.containedIn("word",request.params.postWords);

    wordDictionary.each(function(word){
        keys.push(word.id);
        gameWords.push(word.get("word"));
        word.get("combos").forEach(function(combo)
        {
            gameWordCombos.push(combo);
        });
    },
    {
        success: function(success)
        {
            var currentUser = request.user;

            currentUser.set("wrdEntryKeys",keys);
            currentUser.set("wrds", gameWords);
            currentUser.set("wrdCombos", gameWordCombos);

            currentUser.save().then(function(user)
            {
                response.success("Successfully saved user.");
            }, 
            function(error) {
                    response.error("Error: " + error.code + " " + error.message);
                }
            );
        },
        error: function(error)
        {
            response.error("Could not iterate" +error.code);
        }
    });
});


/*This function creates a WrdGme user account
with automatic password = "gen" */
Parse.Cloud.define("makeGameUser", function(request, response)
{
    var username = request.params.username;
    var userid = request.params.userid;

    var userQuery = new Parse.Query(Parse.User);

    userQuery.equalTo("userid",username);    
    return userQuery.first({
        success: function(userRetrieved)
        {
            if (typeof(userRetrieved)=="undefined") // new object so we save it. 
            {
                var user = new Parse.User();

                user.set("username", username);
                user.set("password", "gen");
                user.set("userid", userid);

                user.signUp(null, {
                    success: function(user) {
                        response.success("Successfully made user");
                    },
                    error: function(user, error) {
                        response.error(error);
                    }
                });
            }  
            else 
            {
                return userRetrieved;
            }
        },
        error: function(error) {
                var user = new Parse.User();

                user.set("username", username);
                user.set("password", "gen");
                user.set("userid", userid);

                user.signUp(null, {
                    success: function(user) {
                        response.success("Successfully made user");
                    },
                    error: function(user, error) {
                        response.error(error);
                    }
                });
        }
    });
});


/*This function will parse out words under 4 letters
and other nonsense folks use in their captions.*/
function cleanPost(post)
{
    post["words"] =[];
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

        text = text.replace(/[.,!?;:"'+()#/]/g," ").replace("  "," ");
        text = text.split(" ");

        var wrdArray = [];
        text.forEach(function(word){
            if (word.length > 3 && word[0]!="@")
            {
                wrdArray.push(word);
            }
        });
        post["words"] = wrdArray;
    }
    return post;
}

