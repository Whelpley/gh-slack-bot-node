'use strict'

const request = require('request');
const phoneFormatter = require('phone-formatter');

const colors = ['blue', 'green', 'yellow', 'purple', 'red'];

module.exports = function (req, res, next) {
  // some variable-scope confusion over the botPayLoad
  // for now, passing it from function to function
  var botPayload = {};
  botPayload.username = 'Gethuman Bot';
  botPayload.channel = req.body.channel_id;

  var textInput = (req.body.text) ? req.body.text : '';
  if (textInput) {
      // passing in 'res' for debugging
      summonQuestionResponse(textInput, botPayload, res);
  } else {
      botPayload.text = "Tell me your customer service issue.";
      botPayload.icon_emoji = ':question:';
      // send payload
      console.log("About to send the payload. Godspeed!");
      send(botPayload, function (error, status, body) {
      if (error) {
        return next(error);
      } else if (status !== 200) {
        // inform user that our Incoming WebHook failed
        console.log("Oh the humanity! Payload has crashed and burned.");
        console.log("Let's have a look at the payload: " + JSON.stringify(botPayload));
        return next(new Error('Incoming WebHook: ' + status + ' ' + body));
      } else {
        console.log("Payload sent on for much win.");
        return res.status(200).end();
      }
      });
  };
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

function summonQuestionResponse(textInput, botPayload, res) {
    var questions = [];
    var companyIDs = [];
    var guideIDs = [];
    var companyObjects = [];
    var companyTable = {};
    var guideObjects = [];
    var guideTable = {};

    let filters = {
        type: 'question',
        isGuide: true
    };
    let limit = 5;
    request('https://api.gethuman.co/v3/posts/search?match='
            + encodeURIComponent(textInput)
            + '&limit='
            + limit
            + '&filterBy='
            + encodeURIComponent(JSON.stringify(filters))
            , function (error, response, body) {
        if (!error && response.statusCode == 200) {
            questions = JSON.parse(body);
            if (questions && questions.length) {
                for (let i = 0; i < questions.length; i++) {
                    companyIDs.push(questions[i].companyId);
                    guideIDs.push(questions[i].guideId);
                };
                // console.log("Company ID's: " + companyIDs);
                // console.log("Guide ID's: " + guideIDs);
                request('https://api.gethuman.co/v3/companies?where='
                    + encodeURIComponent(JSON.stringify({ _id: { $in: companyIDs }}))
                    , function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        companyObjects = JSON.parse(body);
                        for (let i = 0; i < companyObjects.length; i++) {
                            companyTable[companyObjects[i]._id] = companyObjects[i]
                        };
                        // console.log("All company Objects returned from API: " + JSON.stringify(companyTable));
                        request('https://api.gethuman.co/v3/guides?where='
                            + encodeURIComponent(JSON.stringify({ _id: { $in: guideIDs }}))
                            , function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                guideObjects = JSON.parse(body);
                                for (let i = 0; i < guideObjects.length; i++) {
                                    guideTable[guideObjects[i]._id] = guideObjects[i]
                                };
                                // console.log("All guide Objects returned from API: " + JSON.stringify(guideTable));
                                // attach Companies and Guides to Questions
                                for (var i = 0; i < questions.length; i++) {
                                    let cID = questions[i].companyId;
                                    questions[i].company = companyTable[cID];
                                    let gID = questions[i].guideId;
                                    questions[i].guide = guideTable[gID];
                                };
                                prepareQuestionsPayload(questions, botPayload, res);
                            } else if (error) {
                            console.log(error);
                          }
                        });
                    } else if (error) {
                    console.log(error);
                  }
                });
            } else {
                // send back a plain text response for now
                // later: potential company cards
                botPayload.text = "We could not find any matching questions to your input.";
                botPayload.icon_emoji = ':stuck_out_tongue:';
            };
        } else if (error) {
            console.log(error);
        }
    })
};

function prepareQuestionsPayload(questions, botPayload, res) {
    botPayload.text = "Here are some issues potentially matching your input, and how to resolve them. Check them out!";
    botPayload.icon_emoji = ':tada:';
    botPayload.attachments = [];

    for (let i = 0; i < questions.length; i++) {
        let companyName = questions[i].companyName || '';
        let color = colors[i];
        let urlId = questions[i].urlId || '';
        let phone = (questions[i].company) ? questions[i].company.callback.phone : '';
        //format phone# for international format
        let phoneIntl = (phone) ? phoneFormatter.format(phone, "+1NNNNNNNNNN") : '';
        let title = questions[i].title || '';
        // check if company name is in title already, add to front if not
        if (title.indexOf(companyName) < 0) {
            title = companyName + ": " + title;
        };
        // this only gets the first in the series! Will likely need to iterate through the steps to harvest all the details
        // also has potential for funky-not-fresh formatting wrt HTML tags
        if (questions[i].guide.steps) {
            console.log("Solutions for Question #" + i + ": " + JSON.stringify(questions[i].guide.steps));
        } else {
            console.log("No solutions found for Question #" + i);
        };
        let solution = questions[i].guide.steps[0].details || 'No solution found. Despair and wail!';
        // dummy text for solutions:
        // let solution = "Step 1: Hit it with a hammer\nStep 2: Light it on fire\nStep 3: Order a pizza\nStep 4: Do a little dance."

        // create attachment object
        let singleAttachment = {
            "fallback": "Solution guide for " + companyName,
            "title": title,
            "color": color,
            // redundant link to one in the Fields
            // "title_link": "https://answers.gethuman.co/_" + encodeURIComponent(urlId),
            "text": solution,
            "fields": [
                {
                    "title": "More info",
                    "value": "<https://answers.gethuman.co/_" + encodeURIComponent(urlId) + "|Detailed solutions guide>",
                    "short": true
                },
                {
                    "title": "Solve - $20",
                    "value": "<https://gethuman.com?company=" + encodeURIComponent(companyName) + "|Summon GetHuman's Humans!>",
                    "short": true
                }
            ]
        };
        // if there is a valid phone # (needs stricter checks), add Call field to attachment
        if (phoneIntl) {
            singleAttachment.fields.unshift({
                "title": "Want to talk to " + companyName + " ?",
                "value": "<tel:" + phoneIntl + "|Call them now>",
                "short": true
            })
        };
        // push attachment into payload
        botPayload.attachments.push(singleAttachment);
    };
    // send that payload!
    console.log("About to send the payload. Godspeed!");
    send(botPayload, function (error, status, body) {
      if (error) {
        return next(error);
      } else if (status !== 200) {
        // inform user that our Incoming WebHook failed
        console.log("Oh the humanity! Payload has crashed and burned.");
        console.log("Let's have a look at the payload: " + JSON.stringify(botPayload));
        return next(new Error('Incoming WebHook: ' + status + ' ' + body));
      } else {
        console.log("Payload sent on for much win.");
        return res.status(200).end();
      }
    });
};