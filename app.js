// TWILIO
var account_sid = "ACd882274f43e1f2fffb2f26e4348ea273";
var auth_token = "7db2af93aa137cfeb9eff5224fa18ec8";
var twilio = require('twilio');
var client = new twilio.RestClient(account_sid, auth_token);

// EXPRESS
var express = require('express');
var app = express();
app.use(require('compression')());
app.use(express.static(__dirname + '/static'));
app.engine('.html', require('ejs').__express);
app.set('port', (process.env.PORT || 5000));

// MONGODB
var MongoClient = require('mongodb').MongoClient;
var uri = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/test';
var db, messages;
MongoClient.connect(uri, function(err, database) {
  if (err) throw err;
  console.log("Connected to database.");
  db = database;
  messages = db.collection('messages');
  //listener
  app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'));
  });
});

// HOME
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/test', function(req, res) {
  res.send(messages.findOne());
});

app.get('/twiml', function(req, res) {
  var resp = new twilio.TwimlResponse();
  var data = req.query;
  console.log(data);
  if (!data.hasOwnProperty('Body')) {
    console.log("Not a text.");
    res.send("404");
  } else {
    var body = data.Body;
    switch (body) {
      case "SHELTER":
        var msg = "Where are you? Send me your nearest crosst street (e.g. 5th Ave and W 20th St), and I'll give you info on the shelter closest to you!";
        resp.message(msg);
        break;
      case "FOOD":
        var msg = "Where are you? Send me your nearest crosst street (e.g. 5th Ave and W 20th St), and I'll give you info on the soup kitchen closest to you!";
        resp.message(msg);
        break;
      default:
        var msg = "Huh, not sure what you're trying to do? Text SHELTER for info on shelters and FOOD for info on soup kitchens near you!";
        resp.message(msg);
    }
    res.send(resp.toString());
  }
});
