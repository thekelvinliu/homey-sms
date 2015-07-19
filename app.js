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
  var data = req.query;
  if (!data.hasOwnProperty('Body')) {
    console.log("Not a text.");
    res.send("404");
  } else {
    var body = data.Body;
    console.log(body);
    res.sendFile(__dirname + '/views/r.xml');
  }
});
