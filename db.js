module.exports = function (options) {
 
/**
 * Module options
 */
var redis = require('redis');
var client = redis.createClient()
  , namespace = 'bonjour';

//redis.debug_mode = true;

//client.on('error', console.log);

if ('undefined' !== typeof options) { _set_options_(options); }
 
/**
 * Privates
 */
// Get bonjour key name
function _key_ (id) {
  return namespace + ':' + id + ':json';
}

function _key_date_(date) {
  return namespace + ':' + date + ':id';
}

// Get sequence key name
function _seq_ () {
  return namespace + '::sequence';
}
// Update internal options
function _set_options_ (options) {
  if ('undefined' !== typeof options.database) { client.select(options.database); }
  if ('undefined' !== typeof options.namespace) { namespace = options.namespace; }
  return this;
}
 
/*
 * gets an id by date.
 * callback is called with callback(err, id). id is undefined if
 * not found.
 */
function _fetchIndex(date, callback) {
  client.get(_key_date_(date), function(err, value) {
    if(!err && !value) {
      return callback(undefined, undefined);
    }
    if(err) { return callback(err); }
    var id = value;
    return callback(undefined, id);
  });
}

/**
 * Stores an index entry (date -> id).
 * returns callback(err).
 */
function _index(date, id, callback) {
  client.set(_key_date_(date), id, function(err) {
    if(err) {
      return callback(err);
    }
  });
}

/**
 * Deletes an index entry.
 * returns callback(err, deleted).
 */
function _deleteIndex(date, callback) {
  client.del(_key_date_(date), function(err, deleted) {
    if(!err && deleted === 0) {
      err = {
             "message": "index not found",
             "type": "ENOTFOUND"
            };
    }
    return callback(err, deleted > 0);
  });
}

return {
 
  /**
   * Update options
   */
  "configure": _set_options_,
 
  /**
   * Allow disconnection
   */
  "close": function disconnect (callback) {
    if (callback) { client.on('close', callback); }
    if (client.connected) { client.quit(); }
  },
 
  "private_fetchIndex": _fetchIndex,
  "private_index": _index,
  "private_deleteIndex": _deleteIndex,

  /**
   * Save a new bonjour
   * if bonjour has no id, it's an insertion, an update otherwise
   * callback is called with (err, bonjour, created)
   */
  "save": function save (bonjour, callback) {
    var created = ('undefined' == typeof bonjour.id);
    var self = this;
    var onIdReady = function (bonjour) {
      client.set(_key_(bonjour.id), JSON.stringify(bonjour), function (err) {
        if(!err) {
          _index(bonjour.date, bonjour.id, callback);
        } else {
          return callback(err);
        }
        return callback(err, bonjour, created);
      });
    }; 
    if(created) {
       client.incr(_seq_(), function(err, id) {
        if(err) { return callback(err); }
        bonjour.id = id;
        onIdReady(bonjour);
       }); 
    } else {
      this.fetchOne(bonjour.id, function(err, old) {
        if(err) { return callback(err); }
        for(var attr in bonjour) {
          old[attr] = bonjour[attr];
        }
        bonjour = old;
        onIdReady(bonjour);
      });
    }
  },

  /**
   * Retrieve a bonjour
   * callback is called with (err, bonjour)
   * if no bonjour is found, an error is raised with type=ENOTFOUND
   */
  "fetchOne": function fetchOne (id, callback) {
    client.get(_key_(id), function(err, value) {
      if(!err && !value) {
        err = {
               "message": "Bonjour not found",
               "type": "ENOTFOUND"
              };
      }
      if(err) { return callback(err); }
      var bonjour = null;
      try {
        bonjour = JSON.parse(value);
      } catch(e) {
        return callback(e);
      }
      return callback(undefined, bonjour);
    });
   },

  "fetchByDate": function fetchByDate(date, callback) {
    var self = this;
    _fetchIndex(date, function(err, id) {
      if(!err && id) {
        self.fetchOne(id, callback);
      } else {
        err = {
                "message": "Bonjour not indexed",
                "type": "ENOTFOUND"
              };
        return callback(err);
      }
    });

  },

  /**
   * Retrieve all IDs
   * callback is called with (err, bonjours)
   */
  "fetchAll": function fetchAll (callback) {
    client.keys(_key_('*'), function(err, keys) { 
      if(err) { return callback(err); }
      callback(undefined, keys.map(function(key) {
        return parseInt(key.substring(namespace.length + 1));
      }));
      return;
    });
  },

  /**
   * delete a bonjour
   * callback is called with (err, deleted)
   */
  "deleteOne": function deleteOne (bonjour, callback) {
    _deleteIndex(bonjour.date, function(err, idx_deleted) {
      if(!err && idx_deleted ) {
        client.del(_key_(bonjour.id), function(err, deleted) {
          if(!err && deleted == 0) {
            err = {
                    "message": "Bonjour not found",
                    "type": "ENOTFOUND"
                  }
          }
          return callback(err, deleted > 0);
        }); 
      } else {
        return callback(err);
      }
    });
  },

  /**
   * /!\ deletes ALL bonjours /!\
   *
   * note it doesn't call "flushAll" so only "bonjour" entries will be removed
   * callback is called with (err, bonjour)
   */
  "deleteAll": function deleteAll (callback) {
    var self = this;
    client.keys(_key_('*'), function (err, keys) {
      if(err) { return callback(err); }
      var deleteSequence = function deleteSequence (err, deleted) {
        if(err) { return callback(err); }
        client.del(_seq_(), function (err, seq_deleted) {
          callback(err, deleted > 0 || seq_deleted > 0);
        });
      };
      if(keys.length) {
        client.del(keys, deleteSequence);
      } else {
        deleteSequence(undefined, 0);
      }
    }); 
    client.keys(_key_date_('*'), function (err, keys) {
      if(err) { return callback(err); }
      if(keys.length) {
        client.del(keys, function(err, idx_deleted) {
          if(err) { return callback(err); }
          callback(err, idx_deleted > 0);
        });
      }
    });
  }
}
 
};
