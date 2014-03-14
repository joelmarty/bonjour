var PORT = 3333;
var should = require('should'),
    app = require('../app'),
    moment = require('moment'),
    request = require('supertest');

var today = new Date();
var date = moment().format('YYYY-MM-DD');
var date_path = moment().format('YYYY/MM/DD');

var the_bonjour = { 
  'date': date,
  'picture': '/pics/' + date_path,
  'tags': [ 'bonjour', 'nodejs' ]
};
 
describe('bonjour', function () {

  before (function (done) {
    app.listen(PORT, function (err, result) {
      if (err) {
        done(err);
      } else {
        done();
      }
    });
  });

  it('should exist', function (done) {
    should.exist(app);
    done();
  });

  it('should be listening at localhost:3333', function (done) {
    request(app)
      .get('/')
      .expect(200, done);
  });

  it('should GET /bonjour/what', function(done) {
    request(app)
      .get('/bonjour/what')
      .expect(200)
      .end(function(err, res) {
        if(err) { done(err); }
        var data;
        try {
          data = JSON.parse(res.text);
        } catch(e) {
          done(e);
        }
        data.should.have.property('bonjour', 'foo');
        done();
      });
  });

  it('should POST /bonjour and get the created bonjour', function(done) {
    request(app)
      .post('/bonjour')
      .field('date', the_bonjour.date)
      .field('tags', the_bonjour.tags.join(','))
      .attach('image', '/home/joel/6855732_460s.jpg')
      .end(function(err, res) {
        should.not.exist(err);
        if(err) { done(err); }
        //res.should.have.status(200, 'returned status code was ' + res.status);
        var data = JSON.parse(res.text);
        data.should.have.property('id', 1);
        data.should.have.property('date', the_bonjour.date);
        data.should.have.property('picture', the_bonjour.picture);
        data.should.have.property('tags', the_bonjour.tags);
        the_bonjour = data;
        done();
      });
  });

  it('should GET /bonjour/today', function(done) {
    request(app)
      .get('/bonjour/today')
      .set('Content-Type', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) { done(err); }
        var data = JSON.parse(res.text);
        data.should.have.property('id');
        data.should.have.property('date', the_bonjour.date);
        data.should.have.property('picture', the_bonjour.picture);
        data.should.have.property('tags', the_bonjour.tags);
        done();
      });
  });

  it('should GET /bonjour/date/' + date_path, function(done) {
    request(app)
      .get('/bonjour/date/' + date_path)
      .set('Content-Type', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) { done(err); }
        var data = JSON.parse(res.text);
        data.should.have.property('id');
        data.should.have.property('date', the_bonjour.date);
        data.should.have.property('picture', the_bonjour.picture);
        data.should.have.property('tags', the_bonjour.tags);
        done();
      });
  });

  it('should return 404 when looking for a bonjour that does not exist for that date', function(done) {
    request(app)
      .get('/bonjour/date/0000/00/00')
      .set('Content-Type', 'application/json')
      .expect(404, done);
  });

  it('should GET /bonjours with all items', function(done) {
    request(app)
      .get('/bonjours')
      .set('Content-Type', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) { done(err); }
        var data = JSON.parse(res.text);
        data.should.have.property('bonjours');
        data.bonjours.should.be.an.Array;
        data.bonjours.should.not.be.empty;
        data.bonjours.should.containDeep(the_bonjour);
        done();
      });
  });

  it('should GET /bonjour/id/1', function(done) {
    request(app)
      .get('/bonjour/id/1')
      .set('Content-Type', 'application/json')
      .expect(200) 
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) { done(err); }
        var data = JSON.parse(res.text);
        data.should.have.property('id', 1);
        data.should.eql(the_bonjour);
        done();
      });
  });

  it('should PUT /bonjour/id/1', function(done) {
    the_bonjour.tags = ['foo', 'bar', 'baz'];
    request(app)
      .put('/bonjour/id/1')
      .set('Content-Type', 'application/json')
      .send(the_bonjour)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) { done(err); }
        var data = JSON.parse(res.text);
        data.should.have.property('id', 1);
        data.should.have.property('date', the_bonjour.date);
        data.should.have.property('picture', the_bonjour.picture);
        data.should.have.property('tags', the_bonjour.tags);
        the_bonjour = data;
        done();
      });
  });

  it('should not allow to PUT /bonjour/id/{invalid}', function(done) {
    request(app)
      .put('/bonjour/id/blah')
      .set('Content-Type', 'application/json')
      .send(the_bonjour)
      .expect(400, done);
  });

  it('should not allow to PUT /bonjour/id/{notfound}', function(done) {
    the_bonjour.id = 9999;
    request(app)
      .put('/bonjour/id/9999')
      .set('Content-Type', 'application/json')
      .send(the_bonjour)
      .expect(404, done);
  });

  it('should not allow to PUT /bonjour/id/1 if bonjour object has a different id', function(done) {
    the_bonjour.id = 2;
    request(app)
      .put('/bonjour/id/1')
      .set('Content-Type', 'application/json')
      .send(the_bonjour)
      .expect(500, done);
  });

  it('should allow to DEL /bonjour/id/1', function(done) {
    request(app)
      .del('/bonjour/id/1')
      .expect(200, done);
  });
});
