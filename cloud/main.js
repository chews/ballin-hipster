var FIREBASE_URL = 'https://apis.firebaseio.com';

Parse.Cloud.afterSave("Chat", function(request) {
    Parse.Cloud.httpRequest({
        method: 'POST',
        url: FIREBASE_URL + '/chat.json',
        body: '"updated"'
    }).then(function(httpResponse) {
        console.log('Success!');
    },
    function(httpResponse) {
        console.error('Request failed with response code ' + httpResponse.status);
    });
});