var fprint = require("../node-fprint/index");
var express = require('express');
var request = require('request');
var flatfile = require('flat-file-db');
var fs = require('fs');

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var db = flatfile.sync('/tmp/my.db');
var ret = fprint.init();
var oneClient;
var identifyInProgress = false;
var users = db.get('users');
var logs = db.get('logs');

console.log(users);
if (users === undefined) {
    console.log('Init users !');
    users = [];
    db.put('users', users);
    console.log(users);
}
if (logs === undefined) {
    logs = [];
}

if(ret) {
    fprint.setDebug(3);
    var devices = fprint.discoverDevices();
    if(devices.length > 0) {
        devices.forEach(function(entry) {
            console.log("Found: " + entry);
        });

        var deviceHandle = fprint.openDevice(devices[0]);

        function identify() {
            if (identifyInProgress === false) {
                identifyInProgress = true;

                var prints = new Array();


                users.forEach(function (item) {
                    prints[prints.length] = item.fingerprint;
                });

                console.log("identify your finger! Please swipe your finger once again.");

                fprint.identifyStart(deviceHandle, prints, function(state, message, index) {
                    console.log(message);
                    if(state == 1 || state == 0) {
                        if(state == 1) {
                            console.log("MATCHED."+users[index].name);
                            users[index].lastSuccess = new Date().getTime();

                            log = {
                                name: users[index].name,
                                access: users[index].lastSuccess
                            }

                            logs[logs.length] = log;

                            db.put('users', users);
                            db.put('logs', logs);

                            //on appelle l'action
                            if (users[index].urlAction != '') {
                                request(users[index].urlAction);
                            }
                        } else {
                            console.log("MATCH FAILED.");
                        }


                        fprint.identifyStop(deviceHandle, function () {
                            console.log('Stop identify');
                            identifyInProgress = false;
                            identify();
                        });

                    }
                    else {
                        console.log('ERROOOOOR');
                        fprint.closeDevice(deviceHandle);
                        deviceHandle = fprint.openDevice(devices[0]);
                        identifyInProgress = false;
                        identify();
                    }
                });
            }
        }

        function enroll(name, urlAction) {
            var stage = 1;
            var stages = fprint.getEnrollStages(deviceHandle);
            oneClient.emit('updateContent', "enroll your finger! You will need swipe your finger " + stages + " times.<br /><br />");
            oneClient.emit('updateContent', "stage " + stage++ + "/" + stages+'...');

            fprint.enrollStart(deviceHandle, function(state, message, fingerprint) {
                oneClient.emit('updateContent', message + "<br />");
                if(state == 3) {
                    oneClient.emit('updateContent', "stage " + stage++ + "/" + stages+'...');
                }
                else if(state == 1 || state == 2) {
                    if(state == 1) {
                        myUser = {};
                        myUser.fingerprint = fingerprint;
                        myUser.name = name;
                        myUser.urlAction = urlAction;
                        myUser.lastSuccess = null;

                        console.log(users);

                        users = db.get('users');

                        users[users.length] = myUser;
                        db.put('users', users);
                    }
                    fprint.enrollStop(deviceHandle, function() {
                        oneClient.emit('updateContent', 'stored');
                        identify();
                    });
                }
                else {
                    oneClient.emit('updateContent', "Try again please. State: " + state+'<br />');
                }
            });
        }

        identify();
    }
}

app.get('/', function (req, res) {
     res.sendFile(__dirname + '/index.html', {}, function() {
         io.on('connection', function(client) {
             oneClient = client;

             client.on('getUsers', function() {
                 users = db.get('users');
                 client.emit('getUsers', users);
             });

             client.on('getLogs', function() {
                 client.emit('getLogs', logs);
             });

             client.on('delete', function(index) {
                 users.splice(index, 1);
                 db.put('users', users);
                 client.emit('getUsers', users);
             });

             client.on('startEnroll', function(name, urlAction) {
                 if (identifyInProgress) {
                     fprint.identifyStop(deviceHandle, function () {
                         console.log('Stop identify. Start recording');
                         identifyInProgress = false;

                         enroll(name, urlAction);
                     });
                 } else {
                     enroll(name, urlAction);
                 }
             });
         });
     });
});


server.listen(80);
