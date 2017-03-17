'use strict';

console.log('Loading function');

const uuidV1 = require('uuid/v1');
const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();

exports.handler = function(event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);
        if (event.session.application.applicationId !== "amzn1.ask.skill.bae54acf-f16b-4f41-8ab5-bcae02c8e63f") {
            context.fail("Invalid Application ID");
        }

        if (event.session.new) {
            onSessionStarted({
                requestId: event.request.requestId
            }, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);
    var cardTitle = "Telly"
    var speechOutput = "You can ask telly to play and pause"
    callback(session.attributes,
        buildSpeechletResponse(cardTitle, speechOutput, "", true));
}

function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;
    console.log("Intent Name=" + intentName);

    // dispatch custom intents to handlers here
    if (intentName == 'TestIntent') {
        handleTestRequest(intent, session, callback);
    } else if (intentName == 'AMAZON.YesIntent') {
        handleYesIntent(intent, session, callback);
    } else {
        throw "Invalid intent";
    }
}

function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

function handleYesIntent(intent, session, callback) {
    var msg = session.attributes;
    console.log("msg info " + msg);
    if (msg.action) {
        dynamo.putItem({
            TableName: "macca_macca",
            Item: {
                action: msg.action,
                id: uuidV1()
            }
        }, function() {
            console.log("done adding record");
            callback(session.attributes,
                buildSpeechletResponseWithoutCard("OK, I'll " + msg.action + " the telly", "", "true"));
        });

    } else {
        callback(session.attributes,
            buildSpeechletResponseWithoutCard("Im sorry i must have missed your question, please ask again", "", "true"));
    }

}

function handleTestRequest(intent, session, callback) {
    //var query = intent.slots.query.value || '';
    var action = intent.slots.action.value || '';
    var msg = {
        action: action,
        all: action
    };
    if ((action === 'play' || action === 'watch' || action === 'pause')) {
        session.attributes = msg;
        callback(session.attributes,
            buildSpeechletResponseWithoutCard("Would you like to " + msg.all + " the telly", "", "false"));
    }
}

// ------- Helper functions to build responses -------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
