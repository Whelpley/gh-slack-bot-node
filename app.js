var express = require('express');
var bodyParser = require('body-parser');
var hellobot = require('./hellobot.js');
var dicebot = require('./dicebot.js');
var getHumanbot = require('./gethumanbot.js');

var app = express();
var port = process.env.PORT || 3000;

// body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

// test route
app.get('/', function (req, res) { res.status(200).send('Hello world!') });

// hellobot
app.post('/hello', hellobot);

// dicebot
app.post('/roll', dicebot);

// button replies
app.post('/message_action', getHumanbot);

// basic error handler
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(400).send(err.message);
});

app.listen(port, function () {
  console.log('Slack bot listening on port ' + port);
});