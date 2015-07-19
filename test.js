var sid = "AC9dfe04b24be16149f6614c7e7d2ff349";
var token = "ce82bca4c489e6fd0afea0d031e7c856";

var client = require('twilio')(sid, token)

client.sendSms({
    to: "+17636079191",
    from: "+16515041642",
    body: "heyo"
}, function(err, message) {
    if (!err) {
        console.log("Success! The SID for this SMS is:");
        console.log(message.sid);
        console.log('Message sent on:');
        console.log(message.dateCreated);
        console.log(message);
    } else {
        console.log('Oops! There was an error.');
        console.log(err);
    }
});
