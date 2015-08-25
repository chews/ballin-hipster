var ig = require('cloud/instagram-v1-1.0.js');


ig.initialize('e098fc55f76442deaf8057c0fcaeeb76');
ig.setAccessToken('261345369.dc8bd7d.d743823297444ed1acc38b9b0e1f5ef2');

//var FIREBASE_URL = 'https://apis.firebaseio.com';


var WrdEntry = Parse.Object.extend("WrdEntry");
//var TriadScore = Parse.Object.extend("TriadScore");

var POST_COUNT = 10;


Parse.Cloud.define("userInitiation", function(request, response) {
    var username = request.params.username;

    var query = new Parse.Query(Parse.User);

    query.equalTo("username",username);

    query.first({
        success: function(userRetrieved) {
            var user;
            if (typeof(userRetrieved) == "undefined") {
                var userid = validateIgAccount(username);

                if (userid == null) {
                    response.error("Not a valid Ig Account. ");
                }

                var user  = new Parse.User();

                user.set("username", username);
                user.set("password", "gen");
                user.set("userid", userid);

                user.signUp(null, {
                    success: function(gameUser) {
                        return gameUser;
                    },
                    error: function(error) {
                        response.error("Failed to create user. ");
                    }
                });

            } else {
                user = userRetrieved;
            }
            response.success(user);

        },
        error: function(error) {
            response.error("Error querying the database. " + error.message);
        }
    });
});

Parse.Cloud.define("userLogin", function(request, response) {

    var currUser = request.user;

    var postWords = cleanIgPosts(currUser.get("userid"));

    var keys, words, triads = validateWords(postWords, request);


    currUser.save({
        keys: keys,
        words: words,
        triads: triads
    }, {
        success: function(currUser) {
            response.success("Successfully logged in user.");
        },
        error: function(currUser, error) {
            response.error("Error to login user.");
        }
    });
});


function validateWords(postWords, response) {
    var wordDictionary = new Parse.Query(WrdEntry);
    var keys = [];
    var words = [];
    var triads = [];

    wordDictionary.containedIn("word", postWords);

    wordDictionary.each(function(word) {
        keys.push(word.id);
        words.push(word.get("word"));
        word.get("combos").forEach(function(combo) {
            words.push(combo);
        });
    });

    return keys, words, triads;
}

function cleanIgPosts(id) {
    var postWords = [];

    ig.getRecentMediaByUser(id, {
        count: POST_COUNT
    }).then(function(httpResponse) {
        var posts = httpResponse.data["data"];
        posts.forEach(function(post) {
            post = cleanPost(post);
            if (post["words"].length != 0) {
                post["words"].forEach(function(word) {
                    postWords.push(word);
                });
            }
        });
    });
    return postWords;
}


function validateIgAccount(username) {
    var userid;
    console.log("=========== LOOKING FOR HTTP");
    ig.searchUser({
        q: username,
        count: '1'
    }).then(function(httpResponse) {
        console.log(httpResponse.data);
        if (httpResponse.data["data"][0]) {
            userid = httpResponse.data["data"][0]["id"];
        } else {
            userid = null;
        }
    });
    return userid;
}

/*This function will parse out words under 4 letters
and other nonsense folks use in their captions.*/
function cleanPost(post) {
    post["words"] = [];
    if (post["caption"] != null && post["caption"]["text"] != null && post["tags"] != null) {
        var cap = post["caption"];
        var text = post["caption"]["text"];
        text = text.toLowerCase();
        var tags = post["tags"];
        tags.forEach(function(tag) {
            text = text.replace("#" + tag, "");
        });

        text = text.replace(/[.,!?;:"'+()#/]/g, " ").replace("  ", " ");
        text = text.split(" ");

        var wrdArray = [];
        text.forEach(function(word) {
            if (word.length > 3 && word[0] != "@") {
                wrdArray.push(word);
            }
        });
        post["words"] = wrdArray;
    }
    return post;
}