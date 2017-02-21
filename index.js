'use strict';
/**
 * Created by mercury on 16/3/20.
 */
var qiniu = require('qiniu');
var http = require('http');


function QNFileAdapter() {
  this._bucket = arguments[2].bucket;
  this._bucketDomain = arguments[2].bucketDomain;
  this._directAccess = arguments[2].directAccess||false;

  qiniu.conf.ACCESS_KEY = arguments[0];
  qiniu.conf.SECRET_KEY = arguments[1];
  this._client = new qiniu.rs.Client();
}


QNFileAdapter.prototype.createFile = function(filename, data, contentType) {
  let upToken = new qiniu.rs.PutPolicy(this._bucket + ":" + filename).token();

    return new Promise((resolve, reject) => {
      let extra = new qiniu.io.PutExtra();
      qiniu.io.put(upToken, filename, data, extra, (err, ret) => {
        if (!err) {
          resolve(ret);
        } else {
          reject(err);
        }
      })
    });
}

QNFileAdapter.prototype.deleteFile = function(filename) {
  return new Promise((resolve, reject) => {
      this._client.remove(this._bucket, filename, (err, ret) => {
        if (!err) {
          resolve(ret);
        } else {
          reject(err);
        }
      })
    });
}
QNFileAdapter.prototype.getFileData = function(filename) {
  return new Promise((resolve, reject) => {
      let baseUrl = qiniu.rs.makeBaseUrl(this._bucketDomain, filename);
      let policy = qiniu.rs.GetPolicy();
      let downloadUrl = policy.makeRequest(baseUrl);

      http.get(downloadUrl, (res) => {
        let buff = new Buffer;

        if (res.statusCode == 200) {

          res.on('data', (data)=> buff.write(data));
          res.on('end', () => resolve(buff));

        } else {

          reject(`status ${res.statusCode}`);

        }

      }).on('error', (err) => reject(err));
    });
}

QNFileAdapter.prototype.getFileLocation = function(config, filename) {
  if (this._directAccess) {
      return `${this._bucketDomain}/${filename}`;
    }
    return (`${config.mount}/files/${config.applicationId}/${encodeURIComponent(filename)}`);
}
module.exports = QNFileAdapter;
module.exports.default = QNFileAdapter;
