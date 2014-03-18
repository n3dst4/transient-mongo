/*jshint node: true, quotmark:false, unused:vars*/
/*globals describe, it */
"use strict";
var transientMongo = require("..");
var MongoClient = require("mongodb").MongoClient;
var chai = require("chai");
var should = chai.should();
var path = require("path");
var fs = require("fs");
var _ = require("lodash");
var backoff = require("backoff");

var SLOWNESS = 10000;

describe('transient-mongo', function () {

    var myMongo;

    // using deeply nested callbacks here to make the test as clear as poss
    it('should create an instance of mongo we can use', function (done) {
        this.timeout(SLOWNESS);
        transientMongo(function (err, _myMongo) {
            should.not.exist(err);
            myMongo = _myMongo;
            MongoClient.connect(myMongo.url, function (err, db) {
                should.not.exist(err);
                var collection = db.collection('test_insert');
                collection.insert({a:2}, function(err, docs) {
                    should.not.exist(err);
                    collection.find().toArray(function(err, results) {
                        should.not.exist(err);
                        results.length.should.equal(1);
                        db.close();
                        done();
                    });
                });
            });
        });
    });

    it('should be destroyable', function (done) {
        this.timeout(SLOWNESS);
        var opts = {server: {socketOptions: {connectTimeoutMS: 500}}};
        myMongo.destroy(function (err) {
            should.not.exist(err);
            MongoClient.connect(myMongo.url, opts, function (err, db) {
                should.exist(err);
                done();
            });
        });
    });


    it('should not leave any folders lying around', function (done) {
    	this.timeout(10000);
        var tmpDir = path.join(process.cwd(), "tmp");
        var tmpMatch = /^transient-mongo-/;

        // this backoff craziness is because it seems that on WIN32 (at least,
        // haven't tried elsewhere) the folder deletion sometimes doesn't take
        // effect immediately. 
        // See https://github.com/MathieuTurcotte/node-backoff

        var fibonacciBackoff = backoff.fibonacci({
            randomisationFactor: 0,
            initialDelay: 100,
            maxDelay: 1000
        });

        fibonacciBackoff.failAfter(10);

        fibonacciBackoff.on('backoff', function(number, delay) {
            console.log("waiting for folder to be empty" + ' ' + delay + 'ms');
        });

        fibonacciBackoff.on('ready', function(number, delay) {
            fs.readdir(tmpDir, function (err, files) {
                files = _(files).filter(function (file) {
                    return tmpMatch.test(file);
                }).value();
                if (files.length === 0) {
                	done();
                }
                else {
            		fibonacciBackoff.backoff();    	
                }
            });
        });

        fibonacciBackoff.on('fail', function() {
            done(new Error("folder was not empty"));
        });

        fibonacciBackoff.backoff();
    });
});