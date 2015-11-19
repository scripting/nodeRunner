var AWS = require ("aws-sdk");
var s3 = new AWS.S3 ();

exports.stats = s3stats;
exports.defaultType = s3defaultType;
exports.defaultAcl = s3defaultAcl;
exports.splitPath = s3SplitPath;
exports.newObject = s3NewObject;
exports.redirect = s3Redirect;
exports.getObjectMetadata = s3GetObjectMetadata;
exports.getObject = s3GetObject;
exports.listObjects = s3ListObjects;

 

var s3defaultType = "text/plain";
var s3defaultAcl = "public-read";

var s3stats = {
	ctReads: 0, ctBytesRead: 0, ctReadErrors: 0, 
	ctWrites: 0, ctBytesWritten: 0, ctWriteErrors: 0
	};

function s3SplitPath (path) { //split path like this: /tmp.scripting.com/testing/one.txt -- into bucketname and path.
	var bucketname = "";
	if (path.length > 0) {
		if (path [0] == "/") { //delete the slash
			path = path.substr (1); 
			}
		var ix = path.indexOf ("/");
		bucketname = path.substr (0, ix);
		path = path.substr (ix + 1);
		}
	return ({Bucket: bucketname, Key: path});
	}
function s3NewObject (path, data, type, acl, callback, metadata) {
	var splitpath = s3SplitPath (path);
	if (type === undefined) {
		type = s3defaultType;
		}
	if (acl === undefined) {
		acl = s3defaultAcl;
		}
	var params = {
		ACL: acl,
		ContentType: type,
		Body: data,
		Bucket: splitpath.Bucket,
		Key: splitpath.Key,
		Metadata: metadata
		};
	s3.putObject (params, function (err, data) { 
		if (err) {
			console.log ("s3NewObject: error == " + err.message);
			s3stats.ctWriteErrors++;
			if (callback != undefined) {
				callback (err, data);
				}
			}
		else {
			s3stats.ctWrites++;
			s3stats.ctBytesWritten += params.Body.length;
			if (callback != undefined) {
				callback (err, data);
				}
			}
		});
	}
function s3Redirect (path, url) { //1/30/14 by DW -- doesn't appear to work -- don't know why
	var splitpath = s3SplitPath (path);
	var params = {
		WebsiteRedirectLocation: url,
		Bucket: splitpath.Bucket,
		Key: splitpath.Key,
		Body: " "
		};
	s3.putObject (params, function (err, data) { 
		if (err != null) {
			console.log ("s3Redirect: err.message = " + err.message + ".");
			}
		else {
			console.log ("s3Redirect: path = " + path + ", url = " + url + ", data = ", JSON.stringify (data));
			}
		});
	}
function s3GetObjectMetadata (path, callback) {
	var params = s3SplitPath (path);
	s3.headObject (params, function (err, data) {
		callback (data);
		});
	}
function s3GetObject (path, callback) {
	var params = s3SplitPath (path);
	s3.getObject (params, function (err, data) {
		if (err) {
			s3stats.ctReadErrors++;
			}
		else {
			s3stats.ctReads++;
			s3stats.ctBytesRead += data.Body.length;
			}
		callback (err, data);
		});
	}
function s3ListObjects (path, callback) {
	var splitpath = s3SplitPath (path);
	function getNextGroup (marker) {
		var params = {Bucket: splitpath.Bucket, Prefix: splitpath.Key};
		if (marker != undefined) {
			params = {Bucket: splitpath.Bucket, Prefix: splitpath.Key, Marker: marker};
			}
		s3.listObjects (params, function (err, data) {
			if (err) {
				console.log ("s3ListObjects: error == " + err.message);
				}
			else {
				var lastobj = data.Contents [data.Contents.length - 1];
				for (var i = 0; i < data.Contents.length; i++) {
					data.Contents [i].s3path = splitpath.Bucket + "/" + data.Contents [i].Key; //5/22/14 by DW
					callback (data.Contents [i]);
					}
				if (data.IsTruncated) {
					getNextGroup (lastobj.Key);
					}
				else {
					var obj = new Object ();
					obj.flLastObject = true;
					callback (obj);
					}
				}
			});
		}
	getNextGroup ();
	}





