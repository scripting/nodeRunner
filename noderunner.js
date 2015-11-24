var myVersion = "0.64b", myProductName = "nodeRunner";

	//The MIT License (MIT) 
	
	//Copyright (c) 2014 Dave Winer
	
	//Permission is hereby granted, free of charge, to any person obtaining a copy
	//of this software and associated documentation files (the "Software"), to deal
	//in the Software without restriction, including without limitation the rights
	//to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	//copies of the Software, and to permit persons to whom the Software is
	//furnished to do so, subject to the following conditions:
	
	//The above copyright notice and this permission notice shall be included in all
	//copies or substantial portions of the Software.
	
	//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	//IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	//FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	//AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	//LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	//OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	//SOFTWARE.
	
	//structured listing: http://scripting.com/listings/noderunner.html
	

var fs = require ("fs");
var request = require ("request");
var querystring = require ("querystring"); //11/24/15 by DW
var urlpack = require ("url");
var http = require ("http");
var utils = require ("./lib/utils.js");
var s3 = require ("./lib/s3.js");

var folderPathFromEnv = process.env.noderunnerFolderPath; //12/30/14 by DW

var noderunnerPrefs = {
	myPort: 80,
	secondToRunEveryMinuteScripts: 0,
	minuteToRunHourlyScripts: 0,
	hourToRunOvernightScripts: 0, 
	nameScriptsFolder: "scripts" //1/3/15 by DW
	};

var noderunnerStats = {
	ctStarts: 0, whenLastStart: new Date (0),
	ctStatsReadErrors: 0, ctStatsReads: 0, 
	whenLastEverySecond: new Date (),  whenLastEveryMinute: new Date (), whenLastEveryHour: new Date (), whenLastOvernight: new Date (),
	ctEverySecond: 0, ctLastEveryMinute: 0, ctEveryHour: 0, ctOvernight: 0
	};
var localStorage = {
	};
var fnameStats = "prefs/stats.json", fnamePrefs  = "prefs/prefs.json",  fnameLocalStorage = "prefs/localStorage.json";

var startupScriptsFolderName = "startup";
var everySecondScriptsFolderName = "everySecond";
var everyMinuteScriptsFolderName = "everyMinute";
var everyHourScriptsFolderName = "everyHour";
var overnightScriptsFolderName = "overnight";
var userFilesPath = "files/";

var lastLocalStorageJson;




//routines from fs.js
	function fsSureFilePath (path, callback) { 
		var splits = path.split ("/");
		path = ""; //1/8/15 by DW
		if (splits.length > 0) {
			function doLevel (levelnum) {
				if (levelnum < (splits.length - 1)) {
					path += splits [levelnum] + "/";
					fs.exists (path, function (flExists) {
						if (flExists) {
							doLevel (levelnum + 1);
							}
						else {
							fs.mkdir (path, undefined, function () {
								doLevel (levelnum + 1);
								});
							}
						});
					}
				else {
					if (callback != undefined) {
						callback ();
						}
					}
				}
			doLevel (0);
			}
		else {
			if (callback != undefined) {
				callback ();
				}
			}
		}
//functions that are useful to scripts run from one of the folders
	function getFullFilePath (relpath) { //12/30/14 by DW
		var folderpath = folderPathFromEnv;
		if (folderpath === undefined) { //the environment variable wasn't specified
			return (relpath);
			}
		if (!utils.endsWith (folderpath, "/")) {
			folderpath += "/";
			}
		if (utils.beginsWith (relpath, "/")) {
			relpath = utils.stringDelete (relpath, 1, 1);
			}
		return (folderpath + relpath);
		}
	function httpReadUrl (url, callback) {
		request (url, function (error, response, body) {
			if (!error && (response.statusCode == 200)) {
				callback (body) 
				}
			});
		}
	function fileExists (f, callback) {
		var path = getFullFilePath (userFilesPath + f);
		fs.exists (path, function (flExists) {
			callback (flExists);
			});
		}
	function readWholeFile (f, callback) {
		var path = getFullFilePath (userFilesPath + f);
		fsSureFilePath (path, function () {
			fs.readFile (path, function (err, data) {
				if (callback != undefined) {
					callback (err, data);
					}
				});
			});
		}
	function writeWholeFile (f, data, callback) {
		var path = getFullFilePath (userFilesPath + f);
		fsSureFilePath (path, function () {
			fs.writeFile (path, data, function (err) {
				if (err) {
					console.log ("writeWholeFile: error == " + err.message);
					}
				if (callback != undefined) {
					callback (err);
					}
				});
			});
		}

function writeStats (fname, stats) {
	var f = getFullFilePath (fname);
	fsSureFilePath (f, function () {
		fs.writeFile (f, utils.jsonStringify (stats), function (err) {
			if (err) {
				console.log ("writeStats: error == " + err.message);
				}
			});
		});
	}
function readStats (fname, stats, callback) {
	var f = getFullFilePath (fname);
	fs.exists (f, function (flExists) {
		if (flExists) {
			fs.readFile (f, function (err, data) {
				if (err) {
					console.log ("readStats: error reading file " + f + " == " + err.message)
					}
				else {
					var storedStats = JSON.parse (data.toString ());
					for (var x in storedStats) {
						stats [x] = storedStats [x];
						}
					writeStats (fname, stats);
					}
				if (callback != undefined) {
					callback ();
					}
				});
			}
		else {
			writeStats (fname, stats);
			if (callback != undefined) {
				callback ();
				}
			}
		});
	}
function writeLocalStorageIfChanged () {
	var s = utils.jsonStringify (localStorage);
	if (s != lastLocalStorageJson) {
		lastLocalStorageJson = s;
		writeStats (fnameLocalStorage, localStorage); 
		}
	}
function runUserScript (s, scriptName) {
	try {
		eval (s);
		}
	catch (err) {
		console.log ("runUserScript: error running \"" + scriptName + "\" == " + err.message);
		}
	}
function runScriptsInFolder (foldername, callback) {
	var path = getFullFilePath (noderunnerPrefs.nameScriptsFolder + "/" + foldername);
	if (!utils.endsWith (path, "/")) {
		path += "/";
		}
	fsSureFilePath (path, function () {
		fs.readdir (path, function (err, list) {
			if (!utils.endsWith (path, "/")) {
				path += "/";
				}
			for (var i = 0; i < list.length; i++) {
				var fname = list [i];
				if (utils.endsWith (fname.toLowerCase (), ".js")) {
					var f = path + fname;
					fs.readFile (f, function (err, data) {
						if (err) {
							console.log ("runScriptsInFolder: error == " + err.message);
							}
						else {
							runUserScript (data.toString (), f);
							}
						});
					}
				}
			if (callback != undefined) {
				callback ();
				}
			});
		});
	}
function handleHttpRequest (httpRequest, httpResponse) {
	try {
		var parsedUrl = urlpack.parse (httpRequest.url, true), host, port;
		var lowerpath = parsedUrl.pathname.toLowerCase (), now = new Date ();
		//set host, port
			host = httpRequest.headers.host;
			if (utils.stringContains (host, ":")) {
				port = utils.stringNthField (host, ":", 2);
				host = utils.stringNthField (host, ":", 1);
				}
		console.log (now.toLocaleTimeString () + " " + httpRequest.method + " " + host + ":" + port + " " + lowerpath);
		switch (lowerpath) {
			case "/version":
				httpResponse.writeHead (200, {"Content-Type": "text/plain"});
				httpResponse.end (myVersion);    
				break;
			case "/now": 
				httpResponse.writeHead (200, {"Content-Type": "text/plain"});
				httpResponse.end (now.toString ());    
				break;
			case "/status": 
				var status = {
					prefs: noderunnerPrefs,
					status: noderunnerStats
					}
				httpResponse.writeHead (200, {"Content-Type": "text/plain"});
				httpResponse.end (utils.jsonStringify (status));    
				break;
			default:
				httpResponse.writeHead (404, {"Content-Type": "text/plain"});
				httpResponse.end ("The file was not found.");    
				break;
			}
		}
	catch (tryError) {
		httpResponse.writeHead (500, {"Content-Type": "text/plain"});
		httpResponse.end (tryError.message);    
		}
	}

function overnight () {
	var now = new Date ();
	console.log ("Running overnight scripts.");
	noderunnerStats.whenLastOvernight = now;
	noderunnerStats.ctOvernight++;
	runScriptsInFolder (overnightScriptsFolderName);
	}
function everyHour () {
	var now = new Date ();
	console.log ("Running hourly scripts.");
	noderunnerStats.whenLastEveryHour = now;
	noderunnerStats.ctEveryHour++;
	runScriptsInFolder (everyHourScriptsFolderName);
	}
function everyMinute () {
	var now = new Date ();
	console.log ("");
	console.log ("everyMinute: " + now.toLocaleTimeString ());
	runScriptsInFolder (everyMinuteScriptsFolderName);
	
	if (now.getMinutes () == noderunnerPrefs.minuteToRunHourlyScripts) {
		everyHour ();
		}
	if ((now.getMinutes () == 0) && (now.getHours () == noderunnerPrefs.hourToRunOvernightScripts)) {
		overnight ();
		}
	
	noderunnerStats.whenLastEveryMinute = now;
	noderunnerStats.ctEveryMinute++;
	writeStats (fnameStats, noderunnerStats);
	}
function everySecond () {
	var now = new Date ();
	noderunnerStats.whenLastEverySecond = now;
	noderunnerStats.ctEverySecond++;
	runScriptsInFolder (everySecondScriptsFolderName);
	if (now.getSeconds () == noderunnerPrefs.secondToRunEveryMinuteScripts) {
		everyMinute ();
		}
	writeLocalStorageIfChanged ();
	//sleep until the next second
		var ctmilliseconds = 1000 - (Number (new Date ().getMilliseconds ()) + 1000) % 1000;
		setTimeout (everySecond, ctmilliseconds); 
	}

function startup () {
	readStats (fnamePrefs, noderunnerPrefs, function () {
		readStats (fnameLocalStorage, localStorage, function () {
			lastLocalStorageJson = utils.jsonStringify (localStorage);
			readStats (fnameStats, noderunnerStats, function () {
				var now = new Date ();
				console.log (myProductName + " v" + myVersion + ".");
				
				if (folderPathFromEnv != undefined) { //12/30/14 by DW
					console.log ("Data and scripts are in: " + folderPathFromEnv);
					}
				
				noderunnerStats.ctStarts++;
				noderunnerStats.whenLastStart = now;
				writeStats (fnameStats, noderunnerStats);
				runScriptsInFolder (startupScriptsFolderName, function () {
					everySecond ();
					http.createServer (handleHttpRequest).listen (noderunnerPrefs.myPort);
					});
				});
			});
		});
	}
startup ();



