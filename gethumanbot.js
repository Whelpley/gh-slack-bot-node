var request = require('request');

module.exports = function (req, res, next) {

  var botPayload = {};
  var userText = (req.body.text) ? req.body.text : '';

  // write response message and add to payload
  botPayload.text = req.body.user_name + ", you just told me to " + userText + " myself!"

  botPayload.username = 'gethumanbot';
  botPayload.channel = req.body.channel_id;
  botPayload.icon_emoji = ':stuck_out_tongue:';

  // send payload
  send(botPayload, function (error, status, body) {
    if (error) {
      return next(error);
    } else if (status !== 200) {
      // inform user that our Incoming WebHook failed
      return next(new Error('Incoming WebHook: ' + status + ' ' + body));
    } else {
      return res.status(200).end();
    }
  });
}

function send (payload, callback) {
  var path = process.env.INCOMING_WEBHOOK_PATH;
  var uri = 'https://hooks.slack.com/services/' + path;

  request({
    uri: uri,
    method: 'POST',
    body: JSON.stringify(payload)
  }, function (error, response, body) {
    if (error) {
      return callback(error);
    }

    callback(null, response.statusCode, body);
  });
}