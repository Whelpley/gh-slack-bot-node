var request = require('request');

module.exports = function (req, res, next) {
  var userText = (req.body.text) ? req.body.text : '';

  // write response message and add to payload
  // invoke after all responses from API are complete ready
  var botPayload = {};
  botPayload.text = req.body.user_name + ", here are some solutions to " + userText + ":";
  botPayload.username = 'gethumanbot';
  botPayload.channel = req.body.channel_id;
  botPayload.icon_emoji = ':stuck_out_tongue:';
  botPayload.attachments = [
        {
            "fallback": "Required plain-text summary of the attachment.",
            "title": "Verizon: I dropped my phone in the toilet",
            "title_link": "https://api.slack.com/",
            "text": "Step 1: Take it out \nStep 2: put it in the oven\nStep3: eat it\nStep 4: That should have worked",
            "fields": [
                {
                    "title": "More info",
                    "value": "<www.theonion.com|Detailed solutions>",
                    "short": true
                },
                {
                    "title": "Call them",
                    "value": "<tel:+14156805629|Phone them now>",
                    "short": true
                },
                {
                    "title": "Solve - $20",
                    "value": "<www.gethuman.com|Go to GetHuman>",
                    "short": true
                }
            ]
        },
        {
            "fallback": "Required plain-text summary of the attachment.",
            "title": "Verizon: I dropped my phone in the toilet",
            "title_link": "https://api.slack.com/",
            "text": "Below is a link that will allow you to do your re-certification for Assurance Wireless: \nStep 1: https://www.assurancewireless.com/Secure/ReCertification/AnnualRecertification.aspx",
            "fields": [
                {
                    "title": "More info",
                    "value": "<www.theonion.com|Detailed solutions>",
                    "short": true
                },
                {
                    "title": "Call them",
                    "value": "<tel:+14156805629|Phone them now>",
                    "short": true
                },
                {
                    "title": "Solve - $20",
                    "value": "<www.gethuman.com|Go to GetHuman>",
                    "short": true
                }
            ]
        }
  ]

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