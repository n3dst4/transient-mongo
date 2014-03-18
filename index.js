/*jshint node:true, quotmark:false */
"use strict";
var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");
var rimraf = require("rimraf");
var cp = require("child_process");
var mongoose = require("mongoose");
var randomPort = require("random-port");
var fs = require("fs");

var BIND_IP = "127.4.8.15";
var tmpDir = path.join(process.cwd(), "tmp");

/*
 * spin up a mongo instance for testing, takes a callback which will be passed
 * an object with a url and a destroy method. The destroy method should be used 
 * to dispose of the mongo instance when you're done with it
 */
var create = module.exports = function (done) {
    var child;
    var port = randomPort();
    var localDir = path.join(tmpDir, "transient-mongo-" + Date.now() +
        "-" + process.pid);
    var dataDir = path.join(localDir, "data");
    var logPath = path.join(localDir, "mongod.log");
    var errPath = path.join(localDir, "mongod.err");

    mkdirp(dataDir, function(err){
        if (err) return done(err);
        child = cp.spawn("mongod",
            ["--port", port, "--bind_ip", BIND_IP,
            "--dbpath", dataDir, "--logpath", logPath,
            "--noprealloc", "--nssize", "1", "--nojournal", "--smallfiles"]);

        child.on("error", function (msg) {
            done("Error launching mongod: " + msg);
        });

        process.on("exit", function () {
            child.kill();
        });

        var errLog = fs.createWriteStream(errPath, {flags: 'a'});
        child.stderr.pipe(errLog, { end: true });

        var url = "mongodb://" + BIND_IP + ":" + port;
        var destroy = function (destroyDone) {
            child.kill();
            child.on("exit", function () {
                rimraf(localDir, function (err) {
                    destroyDone(err);
                });
            });
        };
        done(null, {url: url, destroy: destroy});
    });
};

/*
 * Convenience method to pass to mocha's before() or similar to spin up a 
 * mongo instance and connect Mongoose to it. 
 * Note this function does use "this" to remember the mongo instance
 */
module.exports.connectMongoose = function (done) {
    if (module.mongooseMongo) {
        return done(new Error(
            "Mongoose has already been hooked up to transient-mongo"));
    }
    create(function(err, mongo) {
        if (err) {
            done(err);
        }
        else {
            module.mongooseMongo = mongo;
            mongoose.connect(mongo.url);
            done(null, module.mongooseMongo);
        }
    });
};


/*
 * Convenience method to pass to mocha's after() or similar to shut down
 * a mongo instance previously created with connectMongoose()
 */
module.exports.disconnectMongoose = function (done) {
    mongoose.disconnect();
    if (module.mongooseMongo) {
        module.mongooseMongo.destroy(function (err) {
            module.mongooseMongo = null;
            done(err);
        });
    }
    else {
        done(null);
    }
};