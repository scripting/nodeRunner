

//By Dave Winer, May 12, 2015.

//I use this script to copy the only files that River4 produces that have to be publicly accessible.

//It only copies if the dest file doesn't exist or if the content of the files has changed.


var sourcefolder = "/root/river4data/rivers/";var destfolder = "../pagepark/domains/rss4.scripting.com/rivers/";var urldestfoler = "http://rss4.scripting.com/rivers/";console.log ("Hello from copyriverfiles.js");function copyOneFile (fname) {	var fsource = sourcefolder + fname, fdest = destfolder + fname;	console.log ("copyRiverFiles.js: fname == " + fname + ", list [i] == " + list [i]);	fs.readFile (fsource, function (err, jsontext) {		if (err) {			console.log ("copyriverfiles.js: error reading file == " + fsource + ", message == " + err.message);			}		else {			fs.readFile (fdest, function (err, jsontextFromDest) {				if (err || (jsontext.toString () != jsontextFromDest.toString ())) {					fs.writeFile (fdest, jsontext, function (err) {						if (err) {							console.log ("copyriverfiles.js: error writing file == " + fdest + ", message == " + err.message);							}						else {							console.log ("copyriverfiles.js: copied == " + urldestfoler + fname);							}						});					}				});			}		});	}fs.readdir (sourcefolder, function (err, list) {	if (err) {		console.log ("copyRiverFiles.js: error == " + err.message);		}	else {		for (var i = 0; i < list.length; i++) {			copyOneFile (list [i]);			}		}	});