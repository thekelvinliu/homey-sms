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
var db;
MongoClient.connect(uri, function(err, database) {
  if (err) throw err;
  console.log("Connected to database.");
  db = database;
  //listener
  app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'));
  });
});

// HOME
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/views/index.html');
});
