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

var myVersion = "0.53", myProductName = "Noderunner";

var fs = require ("fs");
var request = require ("request");
var urlpack = require ("url");
var http = require ("http");

var noderunnerPrefs = {
	myPort: 80,
	secondToRunEveryMinuteScripts: 0,
	minuteToRunHourlyScripts: 0,
	hourToRunOvernightScripts: 0
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

var userScriptsPath = "scripts/";
var startupScriptsFolderName = "startup";
var everySecondScriptsFolderName = "everySecond";
var everyMinuteScriptsFolderName = "everyMinute";
var everyHourScriptsFolderName = "everyHour";
var overnightScriptsFolderName = "overnight";
var webScriptsFolderName = "web";
var userFilesPath = "files/";

//routines from utils.js, fs.js
	function getBoolean (val) {  
		switch (typeof (val)) {
			case "string":
				if (val.toLowerCase () == "true") {
					return (true);
					}
				break;
			case "boolean":
				return (val);
				break;
			case "number":
				if (val != 0) {
					return (true);
					}
				break;
			}
		return (false);
		}
	function jsonStringify (jstruct) { 
		return (JSON.stringify (jstruct, undefined, 4));
		}
	function secondsSince (when) { 
		var now = new Date ();
		when = new Date (when);
		return ((now - when) / 1000);
		}
	function endsWith (s, possibleEnding, flUnicase) {
		if ((s == undefined) || (s.length == 0)) { 
			return (false);
			}
		var ixstring = s.length - 1;
		if (flUnicase == undefined) {
			flUnicase = true;
			}
		if (flUnicase) {
			for (var i = possibleEnding.length - 1; i >= 0; i--) {
				if (s [ixstring--].toLowerCase () != possibleEnding [i].toLowerCase ()) {
					return (false);
					}
				}
			}
		else {
			for (var i = possibleEnding.length - 1; i >= 0; i--) {
				if (s [ixstring--] != possibleEnding [i]) {
					return (false);
					}
				}
			}
		return (true);
		}
	function stringContains (s, whatItMightContain, flUnicase) { 
		if (flUnicase == undefined) {
			flUnicase = true;
			}
		if (flUnicase) {
			s = s.toLowerCase ();
			whatItMightContain = whatItMightContain.toLowerCase ();
			}
		return (s.indexOf (whatItMightContain) != -1);
		}
	function stringCountFields (s, chdelim) {
		var ct = 1;
		if (s.length == 0) {
			return (0);
			}
		for (var i = 0; i < s.length; i++) {
			if (s [i] == chdelim) {
				ct++;
				}
			}
		return (ct)
		}
	function stringNthField (s, chdelim, n) {
		var splits = s.split (chdelim);
		if (splits.length >= n) {
			return splits [n-1];
			}
		return ("");
		}
	function fsSureFilePath (path, callback) { 
		var splits = path.split ("/"), path = "";
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
	function httpReadUrl (url, callback) {
		request (url, function (error, response, body) {
			if (!error && (response.statusCode == 200)) {
				callback (body) 
				}
			});
		}
	function fileExists (f, callback) {
		var path = userFilesPath + f;
		fs.exists (path, function (flExists) {
			callback (flExists);
			});
		}
	function readWholeFile (f, callback) {
		var path = userFilesPath + f;
		fsSureFilePath (path, function () {
			fs.readFile (path, function (err, data) {
				if (!err) {
					if (callback != undefined) {
						callback (err, data);
						}
					}
				});
			});
		}
	function writeWholeFile (f, data, callback) {
		var path = userFilesPath + f;
		fsSureFilePath (path, function () {
			fs.writeFile (path, data, function (err) {
				if (err) {
					console.log ("writeWholeFile: error == " + err.message);
					}
				});
			});
		
		
		}

function writeStats (fname, stats) {
	fsSureFilePath (fname, function () {
		fs.writeFile (fname, jsonStringify (stats), function (err) {
			if (err) {
				console.log ("writeStats: error == " + err.message);
				}
			});
		});
	}
function readStats (f, stats, callback) {
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
					writeStats (f, stats);
					}
				if (callback != undefined) {
					callback ();
					}
				});
			}
		else {
			writeStats (fname, stats);
			}
		});
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
	var path = userScriptsPath + foldername;
	if (!endsWith (path, "/")) {
		path += "/";
		}
	fsSureFilePath (path, function () {
		fs.readdir (path, function (err, list) {
			if (!endsWith (path, "/")) {
				path += "/";
				}
			for (var i = 0; i < list.length; i++) {
				var fname = list [i];
				if (endsWith (fname.toLowerCase (), ".js")) {
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
			if (stringContains (host, ":")) {
				port = stringNthField (host, ":", 2);
				host = stringNthField (host, ":", 1);
				}
		console.log (httpRequest.method + " " + host + ":" + port + " " + lowerpath);
		switch (lowerpath) {
			case "/version":
				httpResponse.writeHead (200, {"Content-Type": "text/plain"});
				httpResponse.end (myVersion);    
				break;
			case "/now": 
				httpResponse.writeHead (200, {"Content-Type": "text/plain"});
				httpResponse.end (now.toString ());    
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
	writeStats (fnameLocalStorage, localStorage); 
	}
function everySecond () {
	var now = new Date ();
	noderunnerStats.whenLastEverySecond = now;
	noderunnerStats.ctEverySecond++;
	runScriptsInFolder (everySecondScriptsFolderName);
	if (now.getSeconds () == noderunnerPrefs.secondToRunEveryMinuteScripts) {
		everyMinute ();
		}
	//sleep until the next second
		var ctmilliseconds = 1000 - (Number (new Date ().getMilliseconds ()) + 1000) % 1000;
		setTimeout (everySecond, ctmilliseconds); 
	}

function startup () {
	readStats (fnamePrefs, noderunnerPrefs, function () {
		readStats (fnameLocalStorage, localStorage, function () {
			readStats (fnameStats, noderunnerStats, function () {
				var now = new Date ();
				console.log (myProductName + " v" + myVersion + ".");
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



