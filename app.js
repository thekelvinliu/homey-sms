// SETUP
var https = require('https');
var util = require('util');

// TWILIO
var account_sid = process.env.TWILIO_ACCOUNT_SID;
var auth_token = process.env.TWILIO_AUTH_TOKEN;
var twilio = require('twilio');
var twilio_client = new twilio.RestClient(account_sid, auth_token);

// EXPRESS
var express = require('express');
var app = express();
app.use(require('compression')());
app.use(express.static(__dirname + '/static'));
app.set('port', (process.env.PORT || 5000));

// MONGODB
var MongoClient = require('mongodb').MongoClient;
var uri = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/test';
var db, messages, shelters;
MongoClient.connect(uri, function(err, database) {
  if (err) throw err;
  console.log("Connected to database.");
  db = database;
  messages = db.collection('messages');
  shelters = db.collection('shelters');
  //listener
  app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'));
  });
});

// HOME
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

// INBOUND TEXTS
app.get('/twiml', function(req, res) {
  var data = req.query;
  if (!data.hasOwnProperty('Body')) {
    console.log("Not a text.");
    res.send("404");
  } else {
    var obj = {
      "phone": data["From"],
      "time": new Date(),
      "sms_sid": data["SmsSid"],
      "helped": false
    }
    switch (data["Body"]) {
      case "SHELTER":
        var resp = new twilio.TwimlResponse();
        var msg = "Where are you? Send me your nearest crosst street (e.g. 5th Ave and W 20th St), and I'll give you info on the shelter closest to you!";
        resp.message(msg);
        obj["service"] = "shelter";
        messages.insert(obj, function(err, records) {
          if (err) throw err;
          console.log("record inserted.");
        });
        res.send(resp.toString());
        break;
      default:
        messages.find({"$and": [{"phone": obj["phone"]}, {"helped": false}]}).toArray(function(err, docs) {
          var resp = new twilio.TwimlResponse();
          if (err) {
            console.log(err);
          } else if (docs.length) {
            resp.message("Got it--I'll get back to you in a few minutes!");
            res.send(resp.toString());

            //hit google places seach api to get location
            var url = "https://maps.googleapis.com/maps/api/place/textsearch/json?query=" + data["Body"].split(' ').join('+') +  "+nyc&key=AIzaSyAJyxRRQHYuM2GSOyBywMA5lKraI1cd9nY"
            https.get(url, function(getRes) {
              var resHeader = getRes.headers;
              var resCode = getRes.statusCode;
              console.log("Response: " + resCode);
              var resBody = "";
              getRes.on('data', function(chunk) {
                resBody += chunk;
              });
              getRes.on('end', function() {
                if (resCode == 200 && resHeader['content-type'].split(';')[0] == 'application/json') {
                  resBody = JSON.parse(resBody);
                  if (resBody.hasOwnProperty('results')) {
                    var results = resBody.results;
                    if (results.length) {
                      var location = [results[0].geometry.location.lng, results[0].geometry.location.lat];
                      console.log(location);
                      //query mongo for shelter nearest location
                      shelters.geoNear(location[0], location[1], {num:1}, function(err, shelterDocs) {
                        if (err) throw err;
                        var doc = shelterDocs.results[0].obj;
                        if (doc["24_hours"]) {
                          var msg = "Make your way to %s at %s in %s. It's open 24 hours! :)";
                          msg = util.format(msg, doc.name, doc.address, doc.borough);
                          reply(obj["phone"], msg, twilio_client);
                        } else {
                          var msg = "Make your way to %s at %s in %s. It's open from %s to %s! :)";
                          msg = util.format(msg, doc.name, doc.address, doc.borough, doc.open, doc.close);
                          reply(obj["phone"], msg, twilio_client);
                        }
                        obj["_id"] = docs[0]["_id"];
                        obj["helped"] = true;
                        messages.update({"_id": obj["_id"]}, obj);
                      });
                    } else {
                      //SEND SMS
                      reply(obj["phone"], "I couldn't find anything :o check back soon!", twilio_client);
                      console.log("no results!");
                    }
                  } else {
                    //SEND SMS
                    reply(obj["phone"], "I couldn't find anything :o check back soon!", twilio_client);
                    console.log("no results!");
                  }
                } else {
                  //SEND SMS
                  reply(obj["phone"], "I couldn't find anything :o check back soon!", twilio_client);
                  console.log("error: couldn't find anything!");
                }
              });
            });
          } else {
            console.log("found no docs");
            var msg = "Huh, not sure what you're trying to do. Text SHELTER for info on shelters near you!";
            resp.message(msg);
            res.send(resp.toString());
          }
        });
    }
  }
});

// FUNCTIONS
function reply(recipient, msg, client) {
  client.sendSms({
      to: recipient,
      from: "+16515041642",
      body: msg
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
}
