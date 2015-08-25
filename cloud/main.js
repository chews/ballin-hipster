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
        success: function(user) {
            if (typeof(user) == "undefined") {
                var user  = new Parse.User();
                var userid; 

                ig.searchUser({
                    q: username,
                    count: '1'
                }).then(function(httpResponse) {
                    if (httpResponse.data["data"][0]) {
                        userid = httpResponse.data["data"][0]["id"];
                    } 

                    if (userid != null) {
                        user.set("username", username);
                        user.set("password", "gen");
                        user.set("userid", userid);

                        user.signUp(null, {
                            success: function(user) {
                                response.success(user);
                            },
                            error: function(error) {
                                response.error("SIGN UP FAILURE. ");
                            }
                        });
                    } else {
                        response.error("INVALID.")
                    }

                }, function (error) {
                    response.error("IG USER SEARCH FAILURE.");
                });

            } else {
                response.success(user);
            }
        },
        error: function(error) {
            response.error("USER DATABASE QUERY FAILURE. " );
        }
    });
});


Parse.Cloud.define("userLogin", function(request, response) {

    var currUser = request.user;

    var postWords = [];

    ig.getRecentMediaByUser(currUser.get("userid"), {
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

        var wordDictionary = new Parse.Query(WrdEntry);
        var keys = [];
        var words = [];
        var triads = [];

        wordDictionary.containedIn("word", postWords);

        wordDictionary.each(function(word) {
            keys.push(word.id);
            words.push(word.get("word"));
            word.get("combos").forEach(function(combo) {
                triads.push(combo);
            });
        }, {
            success: function(success) {
                currUser.save({
                    keys: keys,
                    words: words,
                    triads: triads
                }).then(function(user) {
                        response.success(triads);
                    },
                    function(error) {
                        response.error("SAVE GAME WORDS FAILURE.");
                    }
                );
            }, 
            error: function(error) {
               response.error("DICTIONARY QUERY FAILURE.");
            }
        });

    }, function (error) {
        response.error("RECENT MEDIA CALL FAILURE.");
    });
});


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