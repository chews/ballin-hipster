//Chat capabilities
// Parse.Cloud.beforeSave("Chat", function(request, response){
//     if(request.object.get("name") === "cia"){
//         request.object.set("message", "redacted");
//     }
//     response.success();
// }); 

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