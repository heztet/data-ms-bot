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
    appId: null, //process.env.MY_APP_ID,
    appPassword: null //process.env.MY_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

var films = ["Star Wars The Force Awakens", "The Lion King", "The Truman Show", "Saving Private Ryan", "Rocky"];

var songs = ["I will always love you", "Cannonball", "How much is that doggie in the window", "It wasnt me", "Rockabye"];

var intents = new builder.IntentDialog();
bot.dialog('/', intents);

intents.matches(/^film/i, [
    function (session) {
        session.userData.lives = 5;
        session.userData.word = films[Math.floor(Math.random() * films.length)];
        session.userData.masked = session.userData.word.replace(/[A-Z]/ig,'?')
        session.send('Guess the film title');
        session.beginDialog('/guess');
    }
]);

intents.matches(/^song/i, [
    function (session) {
        session.userData.lives = 5;
        session.userData.word = songs[Math.floor(Math.random() * songs.length)];
        session.userData.masked = session.userData.word.replace(/[A-Z]/ig,'?')
        session.send('Guess the song title');
        session.beginDialog('/guess');
    }
]);

intents.onDefault([
    function (session) {
        session.beginDialog('/welcome');
    }
]);

bot.dialog('/welcome', [
    function (session) {
        session.send("Hi I'm Hangman Bot. Type 'film' or 'song' to start a new game.");
        session.endDialog();
    }
]);

bot.dialog('/guess', [
    function (session) {
        session.send('You have ' + session.userData.lives + ' ' + (session.userData.lives == 1 ? 'life' : 'lives') + ' left');
        builder.Prompts.text(session, session.userData.masked);
    },

    function (session, results) {
        var nextDialog = GetNextDialog(session, results);
        session.beginDialog(nextDialog);
    }
]);

bot.dialog('/win', [
    function (session) {
        session.send(session.userData.masked);
        session.send('Well done, you win!');
        session.endDialog();
    }
]);

bot.dialog('/gameover', [
    function (session) {
        session.send('Game over! You lose!');
        session.send(session.userData.word);
        session.endDialog();
    }
]);

function GetNextDialog(session, results) {
    var nextDialog = '';
    if (results.response.length > 1) {
        if (results.response.toUpperCase() === session.userData.word.toUpperCase()) {
            session.userData.masked = session.userData.word;
            nextDialog = '/win';
        } else {
            session.userData.lives--;
            nextDialog = session.userData.lives === 0 ? '/gameover' : '/guess';
        }
    } else {
        session.userData.letter = results.response;
        session.userData.masked = RevealLettersInMaskedWord(session, results);

        if (session.userData.masked == session.userData.word) {
            nextDialog = '/win';
        } else {
            nextDialog = session.userData.lives === 0 ? '/gameover' : '/guess';
        }
    }
    return nextDialog;
}

function RevealLettersInMaskedWord(session, results) {
    var wordLength = session.userData.word.length;
    var maskedWord = '';
    var found = false;

    for (var i = 0; i < wordLength; i++) {
        var letter = session.userData.word[i];
        if (letter.toUpperCase() === results.response.toUpperCase()) {
            maskedWord += letter;
            found = true;
        }
        else {
            maskedWord += session.userData.masked[i];
        }
    }

    if (!found) {
        session.userData.lives--;
    }

    return maskedWord;
}