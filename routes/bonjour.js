var moment = require('moment');
var multiparty = require('multiparty');
var directory = require('../lib/directory');
var tools = require('../lib/tools');

/**
 * TODO: put static folder in config
 */
var static_folder = '/home/joel/tmp/bonjour/pics';

module.exports = function(db) {

  var self = {

    /**
     * GET bonjour subject
     * TODO: put subject in config
     */
    what: function(req, res) {
      res.send({'bonjour': 'foo'});
    },

    /**
     * GET today's bonjour
     */
    today: function(req, res) {
      var date = moment().format('YYYY-MM-DD');
      db.fetchByDate(date, function(err, bonjour) {
        if(err) {
          if(err.type === 'ENOTFOUND') {
            res.send(404, 'Sorry, this bonjour does not exist (yet)');
          } else {
            res.send(500, 'Ooops, something blew up!');
          }
        } else {
          res.send(200, bonjour);
        }
      });
    },

    getByDate: function(req, res) {
      res.status(501).send({ err: "not implemented yet"});
    },

    getById: function(req, res) {
      res.status(501).send({ err: "not implemented yet"});
    },

    list: function(req, res) {
      res.status(501).send({ err: "not implemented yet"});
    },

    create: function(req, res) {
      var current_date = moment();
      var date_string = current_date.format('YYYY-MM-DD');
      var date_path = current_date.format('/YYYY/MM/');
      var file_name = current_date.format('DD');

      var form = new multiparty.Form();
      var file_created;

      var bjr = {};

      form.on('error', function(err) {
        console.log(err);
        res.send(400, {
          err: 'error processing request',
          reason: err.message
        });
      });

      form.on('part', function(part) {
        if(part.name === 'image') {
          if(!part.filename) {
            res.send(400, {
              'err': 'request did not contain any file to upload'
            });
            return;
          }
          var part_type = part.headers['content-type'];
          if(!part_type.match(/image/i)) {
            res.send(400, {
              'err': 'MIME type of file is not an image, got: ' + part_type
            });
            return;
          }

          var extension = part.filename.split('.').pop();
          var new_folder = static_folder + date_path;
          var new_filepath = new_folder
                           + file_name
                           + '.'
                           + extension;

          if(!tools.fileExistsSync(new_folder)) {
            directory.mkdirSync(new_folder);
          }

          tools.writeStream(new_filepath, part, false, function(err, created) {
            if(err) {
              res.send(500, {
                'err': 'could not save picture file',
                'reason': err
              });
              return;
            }
            file_created = created;
          });
        }
      });

      form.on('field', function(name, value) {
        if(name === 'date') {
          bjr.date = moment(value).format('YYYY-MM-DD');
          bjr.picture = '/pics/' + moment(value).format('YYYY/MM/DD');
        }
        if(name === 'tags') {
          bjr.tags = value.split(',');
        }
      });

      form.on('close', function() {
        db.save(bjr, function(redis_err, bonjour, created) {
          if(redis_err) {
           console.log(redis_err);
           res.send(500, {
             'err': 'could not save bonjour',
             'reason': redis_err.message
           });
          } else {
            res.send(200, bonjour);
          }
        });
      });

      form.parse(req);
    },

    edit: function(req, res) {
      res.status(501).send({ err: "not implemented yet"});
    },

    delete: function(req, res) {
      res.status(501).send({ err: "not implemented yet"});
    }
  };
  return self;
}
