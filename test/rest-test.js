var PORT = 3000;
var assert = require('assert')
  , app = require('../app').app
  , moment = require('moment');
 
// Configure REST API host & URL
var suite = require('api-easy')
            .describe('bonjour-service')
            .use('localhost', PORT)
            .root('/bonjour')
            .setHeader('Content-Type', 'application/json')
            .setHeader('Accept', 'application/json');
 
var today = new Date();
var date = moment().format('YYYY-MM-DD');
var date_path = moment().format('YYYY/MM/DD');

var the_bonjour = { 
            'date': date,
            'picture': '/pics/' + date_path,
            'tags': [ 'bonjour', 'nodejs' ]
          };

// Initially: start server
suite.expect('Start server', function () {
  app.db.configure({namespace: 'bonjour-test-rest'});
  app.listen(PORT);
}).next()
 
.discuss('when deleting all bonjours')
.del()
.expect(200)
.next()
.undiscuss()
 
.discuss('when querying the bonjour name')
.get('/what')
.expect('should respond with the bonjour name', function(err, res, body) {
  var data;
  assert.doesNotThrow(function() { data = JSON.parse(body); }, SyntaxError);
  assert.deepEqual(data, { 'bonjour': 'foo' });
})
.next()
.undiscuss()

.discuss('when adding a bonjour')
.post('', the_bonjour)
.expect('responds with the created bonjour', function(err, res, body) {
  var bjr;
  assert.doesNotThrow(function() { bjr = JSON.parse(body); }, SyntaxError);
  assert.include(bjr, 'id');
  assert.equal(bjr.id, 1);
  assert.equal(bjr.date, date);
  the_bonjour = res;
})
.next()
.undiscuss()

.discuss('when getting bonjour for today')
.get('')
.expect('bonjour for today', function(err, res, body) {
  var bjr;
  assert.doesNotThrow(function() { bjr = JSON.parse(body); }, SyntaxError);
  assert.equal(bjr.date, date);
})
.next()
.undiscuss()

.discuss('when getting a specific bonjour')
.get(date_path)
.expect('the correct bonjour', function(err, res, body) {
  var bjr;
  assert.doesNotThrow(function() { bjr = JSON.parse(body); }, SyntaxError);
  assert.equal(bjr.date, date);
})
.next()
.undiscuss()

.discuss('when trying an unauthorized method')
.post('/what').expect(405)
.put().expect(405)
.undiscuss()
 
// Finally: clean, and stop server
.expect('Clean & exit', function () {
  app.db.deleteAll(function () {});
  app.close();
})
 
// Export tests for Vows
.export(module);
