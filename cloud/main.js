var ig = require('cloud/instagram-v1-1.0.js');

ig.initialize('e098fc55f76442deaf8057c0fcaeeb76');
ig.setAccessToken('261345369.dc8bd7d.d743823297444ed1acc38b9b0e1f5ef2');

var WrdEntry = Parse.Object.extend("WrdEntry");

var POST_COUNT = 10;


Parse.Cloud.define("userInitiation", function(request, response) {
    var username = request.params.username;

    var query = new Parse.Query(Parse.User);

    query.equalTo("username",username);

    query.first({
        success: function(user) {
            if (typeof(user) == "undefined") {
                ig.searchUser({
                    q: username,
                    count: '1'
                }).then(function(httpResponse) {
                    var user  = new Parse.User();

                    var userid; 

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
                                response.error("ERROR: USER SIGN UP.");
                            }
                        });
                    } else {
                        response.error("ERROR: INSTAGRAM USER ID IS INVALID.")
                    }

                }, function (error) {
                    response.error("ERROR: INSTAGRAM USER SEARCH.");
                });

            } else {
                response.success(user);
            }
        },
        error: function(error) {
            response.error("ERROR: USER DATABASE QUERY.");
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
                        response.error("ERROR: SAVE CURRENT USER GAME WORDS.");
                    }
                );
            }, 
            error: function(error) {
               response.error("ERROR: WORD DICTIONARY QUERY.");
            }
        });

    }, function (error) {
        response.error("ERROR: INSTAGRAM RECENT MEDIA PULL.");
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