transient-mongo
===============

Create throwaway mongo instances for testing

## Prerequisites

This module expects that `mongod` (aka Mongo DB) is installed on your system and
available on your $PATH. You can download it from the 
[MongoDB website](https://www.mongodb.org/) if you need to. Installation is 
easy, you just put the `bin/` folder on your $PATH.

You can test that it's working by running `mongod`; you should see a blurt of 
log messages containing an `ERROR:`.

## Usage

Install:

```sh
npm install git+https://github.com/n3dst4/transient-mongo.git --save-dev
```

To get a usable Mongo instance:

```js
var transientMongo = require("transient-mongo");
var myMongo = 
transientMongo(function (err, myMongo) {
    if (err) return console.log(err);
    var myMongoUrl = myMongo.url; // will be something like
                                  // mongodb://127.4.8.15:123456
                                  // Connect to it with mongo client or 
                                  // whatever
    // finally, when you're all done:
    myMongo.destroy(function(err) {
        if (err) return console.log(err);
        // and now the instance has been torn down and its directory destroyed
    });
```

If you fail to call .destroy(), the mongo instance will be left lying around.


## Mongoose integration

Given that 99% of my own use-cases for this module are for use in before/after 
steps in Mocha tests on Mongoose code, it also provides two helper methods:

`.connectMongoose()` creates a transient mongo and calls Mongoose's `.connect()`
with its URL. `.connectMongoose()` takes a callback of the form 
`callback(err, mongo)`, where `err` is an error, if any happened, and `mongo` is
the {url, destroy} object like you'd get from the "normal" usage above. I 
recommend you ignore the object and just use `.disconnectMongoose()`.

`.disconnectMongoose()` will `.destroy()` the instance created and disconnect 
Mongoose.

Attempting to `.connectMongoose()` twice without calling `.disconnectMongoose()`
is an error. You can call `.disconnectMongoose()` as many times as you like.


## Tests

```
npm test
```

## Notes

...TODO...