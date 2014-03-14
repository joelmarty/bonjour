
/**
 * Module dependencies.
 */
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var db = exports.db = require('./db')({namespace:'bonjour-db'});

var app = module.exports = express();
var server = null;

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}
app.get('/', routes.index);
app.get('/bonjour/what', routes.bonjour(db).what);
app.get('/bonjour/today', routes.bonjour(db).today);
app.get('/bonjour/date/:year/:month/:day', routes.bonjour(db).getByDate);
app.get('/bonjour/id/:id', routes.bonjour(db).getById);
app.get('/bonjours', routes.bonjour(db).list);

/* these should be restricted */
app.post('/bonjour', routes.bonjour(db).create);
app.put('/bonjour/id/:id', routes.bonjour(db).edit);
app.del('/bonjour/id/:id', routes.bonjour(db).delete);

if(!module.parent) {
  server = app.listen(3000);
  console.log("Express server listening on port %d in %s mode", server.address().port, app.settings.env);
}

process.on('SIGTERM', function(code) {
  console.log('about to end, waiting for remaining connections to complete...');
  server.close();
  db.close();
});
