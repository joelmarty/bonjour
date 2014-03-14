process.env.NODE_ENV = 'test';

var testCase = require('nodeunit').testCase,
    db = require('../db')({namespace:'bonjour-test-db'}),
    the_bonjour = {};

exports.db = testCase({

  'set up the test suite': function(test) {
    test.expect(0);
    db.deleteAll(function(err, deleted) {
      if(err) {
        test.equal(err, null, 'err is not null');
      }
      test.done();
    });
  },

  'it should save a new bonjour': function(test) {
    test.expect(6);
    var  bjr = {
                "date": "2014-02-20",
                "picture": "/pics/2014/02/20",
                "tags":  [ "valtech", "bonjour" ]
               };
    db.save(bjr,
      function(err, bonjour, created) {
        test.equal(err, null, 'err is not null' + err);
        test.ok(created, 'bonjour has been created');
        test.equal(bonjour.id, 1, 'bonjour has id: ' + bonjour.id);
        test.equal(bonjour.date, '2014-02-20', 'has date != 2014-02-20');
        test.equal(bonjour.picture, '/pics/2014/02/20', 'has incorrect pic url');
        test.deepEqual(bonjour.tags, ['valtech', 'bonjour'], 'has incorrect tags');
        the_bonjour = bonjour;
        test.done();
      });
  },

  'it should have saved an index entry': function(test) {
    test.expect(2);
    db.fetchByDate(the_bonjour.date, function(err, bonjour) {
      test.equal(err, null, 'err is not null');
      test.deepEqual(bonjour, the_bonjour, 'indexed bonjour isnt the same');
      test.done();
    });
  },

  'it should fetch the created bonjour': function(test) {
    test.expect(4);
    db.fetchOne(the_bonjour.id, function(err, bonjour) {
      test.equal(err, null, 'err is not null');
      test.equal(err, undefined, 'err is not undefined');
      test.notEqual(bonjour, null, 'is null');
      test.deepEqual(bonjour, the_bonjour, 'isnt equal to the_bonjour');
      test.done();
    });
  },

  'it should update the created bonjour': function(test) {
      test.expect(3);
      the_bonjour.tags = ['bonjour', 'valtech', 'nodejs'];
      db.save(the_bonjour, function(err, bonjour, created) {
        test.equal(err, null, 'err isnt null');
        test.equal(created, false, 'created something: ' + created);
        test.deepEqual(the_bonjour, bonjour, 'returned bonjour is not the same');
        test.done();
      });
    
  },

  'it should delete the bonjour': function(test) {
    test.expect(2);
    db.deleteOne(the_bonjour, function(err, deleted) {
      test.equal(err, null, 'err isnt null');
      test.ok(deleted, 'deleted is' + deleted);
      test.done();
    });
  },

  'it should delete all bonjours': function(test) {
    test.expect(2);
    db.deleteAll(function(err, deleted) {
      test.equal(err, null, 'err isnt null');
      test.ok(deleted, 'deleted is' + deleted);
      test.done();
    });
  },
  
  'it should close connection': function(test) {
    test.expect(1);
    db.close(function(code) {
      test.equal(code, 0, 'client.close() return code is ' + code);
      test.done();
    });
  }
});
