/*jshint node: true, quotmark:false, unused:vars*/
/*globals describe, it */
"use strict";
var transientMongo = require("..");
var MongoClient = require("mongodb").MongoClient;
var chai = require("chai");
var should = chai.should();

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


    it.skip('should not leave any folders lying around', function (done) {
        
    });

});