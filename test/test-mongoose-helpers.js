/*jshint node: true, quotmark:false, unused:vars*/
/*globals describe, it */
"use strict";
var transientMongo = require("..");
var chai = require("chai");
var should = chai.should();
var mongoose = require("mongoose");

var SLOWNESS = 10000;

describe('mongoose helpers', function () {
    it('should hook up mongoose by magic', function (done) {
        this.timeout(SLOWNESS);
        transientMongo.connectMongoose(function (err) {
            should.not.exist(err);
            var kittySchema = mongoose.Schema({ name: String });
            var Kitten = mongoose.model('Kitten', kittySchema);
            var fluffy = new Kitten({ name: 'fluffy' });
            fluffy.save(function (err, fluffy) {
                should.not.exist(err);
                Kitten.find(function (err, kittens) {
                    should.not.exist(err);
                    kittens.length.should.equal(1);
                    done();
                });
            });
        });
    });

    it('should barf if we try and hook up mongoose twice', function (done) {
        this.timeout(SLOWNESS);
        transientMongo.connectMongoose(function (err) {
            should.exist(err);
            done();
        });
    });

    it('should unhook mongoose when asked nicely', function (done) {
        this.timeout(SLOWNESS);
        transientMongo.disconnectMongoose(function (err) {
            should.not.exist(err);
            done();
        });
    });

    it('should be cool with getting disconnected twice', function (done) {
        this.timeout(SLOWNESS);
        transientMongo.disconnectMongoose(function (err) {
            should.not.exist(err);
            done();
        });
    });
});


