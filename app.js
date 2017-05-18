'use strict';

var builder = require('botbuilder');
var restify = require('restify');

//=========================================================
// Bot Setup
//=========================================================


// Setup restify server
var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MY_APP_ID,
    appPassword: process.env.MY_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

var intents = new builder.IntentDialog();
bot.dialog('/', intents);

// Roll20 dice roller
intents.matches(/[0-9]+d[0-9]+/, [
    function (session) {
        var textArray = session.message.text.split('d');
        session.userData.numDice = parseInt(textArray[0]);
        session.userData.numSides = parseInt(textArray[1]);
        session.beginDialog('/roll20');
    }
])

bot.dialog('/roll20', [
    function (session) {
        var result = RollDice(session);
        session.send(result);
        session.endDialog();
    }
])

function RollDice(session) {
    var total = 0;
    var record = '';

    var numDice = session.userData.numDice;
    var numSides = session.userData.numSides;

    for (var i = 0; i < numDice; i++) {
        var currentDiceValue = Math.floor(Math.random() * numSides + 1);
        total += currentDiceValue;
        record = record + currentDiceValue.toString() + (i === numDice - 1 ? '<br /> = ' : ', ');
    }

    record += total;
    return record;
}