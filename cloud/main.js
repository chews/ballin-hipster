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