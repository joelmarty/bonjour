var fs = require('fs');

exports.writeStream = function(path, stream, overwrite, callback) {
  if(!overwrite) {
    if(fs.existsSync(path)) {
      callback({
        err: 'file already exists',
        path: path
      }, false);
      return;
    }
  }
  stream.on('error', function() {
    callback({
      err: 'could not read input stream :(',
      path: path
    }, false);
    return;
  });
  var output = fs.createWriteStream(path);
  output.on('error', function() {
    callback({
      err: 'could not write file :(',
      path: path
    }, false);
    return;
  });
  output.on('finish', function() {
    callback(false, true);
  });
  stream.pipe(output);
};

exports.fileExistsSync = function(path) {
  return fs.existsSync(path);
};
