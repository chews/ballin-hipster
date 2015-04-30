var FIREBASE_URL = 'https://apis.firebaseio.com';

var PARSE_ID = '5UxktAbnKRHOhWjRAI76GLnbo8ex21ziAk15mLxA';
var PARSE_JS_KEY = 'OCCJlERKyvKzKSJYONqctiNFdcufO9VaCCpyTKRr';

Parse.initialize(PARSE_ID, PARSE_JS_KEY);

var name;

var ChatItem = Parse.Object.extend("Chat");

var ref = new Firebase(FIREBASE_URL + '/chat');

function pressedKeyInMessage(e) {
    // enter
    if (e.keyCode === 13) {
        var self = this;
        var message = this.value;

        if (message) {
            var chatItem = new ChatItem();

            chatItem.set("name", name);
            chatItem.set("message", message);
             
            chatItem.save(null, {
                success: function(chatItem) {
                    self.value = '';
                },
                error: function(chatItem, error) {
                    alert('Failed to create new object, with error code: ' + error.message);
                }
            });
        }
    }
}

document.getElementById('message').addEventListener('keydown', pressedKeyInMessage, false);
document.getElementById('message').style.display = 'none';


function pressedKeyInName(e) {
    // enter
    if (e.keyCode === 13) {
        if (this.value) {
            name = this.value;

            this.style.display = 'none';
            document.getElementById('message').style.display = 'block';
            updateMessages();
        }
    }
}

document.getElementById('name').addEventListener('keydown', pressedKeyInName, false);


function updateMessages() {
    // fetch all messages
    var query = new Parse.Query(ChatItem);
    query.find({
        success: function(results) {
            removeAllMessages();

            // insert all fetched messages
            for (var i = 0; i < results.length; i++) {
                var object = results[i];
                addItemToList(object);
            }
        },
        error: function(error) {
            alert("Error: " + error.code + " " + error.message);
        }
    });
};

function removeAllMessages() {
    var messagesList = document.getElementById("messages");
    while (messagesList.firstChild) {
        messagesList.removeChild(messagesList.firstChild);
    }
}

function addItemToList(object) {
    var div = document.createElement('div');
    var txt = document.createTextNode(object.get('name') + ': ' + object.get('message'));
    div.appendChild(txt);
    document.getElementById('messages').appendChild(div);
}




ref.on("value", function(snapshot) {
    updateMessages();
}, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
});