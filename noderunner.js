var myVersion = "0.7.1", myProductName = "nodeRunner"; 

	//The MIT License (MIT) 
	
	//Copyright (c) 2014-2018 Dave Winer
	
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
	
const fs = require ("fs");
const request = require ("request");
const utils = require ("daveutils");
const s3 = require ("daves3");
const davehttp = require ("davehttp");

var folderPathFromEnv = process.env.noderunnerFolderPath; //12/30/14 by DW

var config = {
	port: 1350,
	flLogToConsole: true,
	flAllowAccessFromAnywhere: true,
	userAgent: myProductName + " v" + myVersion,
	secondToRunEveryMinuteScripts: 0,
	minuteToRunHourlyScripts: 0,
	hourToRunOvernightScripts: 0, 
	nameScriptsFolder: "scripts" 
	};

var stats = {
	ctStarts: 0, 
	whenLastStart: new Date (0),
	ctStatsReadErrors: 0, 
	ctStatsReads: 0
	};
var localStorage = {
	};
const fnameStats = "prefs/stats.json", fnamePrefs  = "prefs/prefs.json",  fnameLocalStorage = "prefs/localStorage.json";
const fnameConfig = "config.json";
var flStatsChanged = false;

var startupScriptsFolderName = "startup";
var everySecondScriptsFolderName = "everySecond";
var everyMinuteScriptsFolderName = "everyMinute";
var everyHourScriptsFolderName = "everyHour";
var overnightScriptsFolderName = "overnight";
var userFilesPath = "files/";
var lastLocalStorageJson;

//functions that are useful to scripts run from one of the folders
	function fsSureFilePath (path, callback) { 
		utils.sureFilePath (path, callback);
		}
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
					console.log ("writeWholeFile: err.message == " + err.message);
					}
				if (callback != undefined) {
					callback (err);
					}
				});
			});
		}

function statsChanged () {
	flStatsChanged = true;
	}
function writeStats () {
	utils.sureFilePath (fnameStats, function () {
		fs.writeFile (fnameStats, utils.jsonStringify (stats), function (err) {
			if (err) {
				console.log ("writeStats: err.message == " + err.message);
				}
			});
		});
	}
function writeLocalStorageIfChanged () {
	var whenstart = new Date (), jsontext = utils.jsonStringify (localStorage);
	if (jsontext != lastLocalStorageJson) {
		lastLocalStorageJson = jsontext;
		fs.writeFile (fnameLocalStorage, jsontext, function (err) {
			});
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
	var folderpath = config.nameScriptsFolder + "/" + foldername;
	fsSureFilePath (folderpath, function () {
		fs.readdir (folderpath, function (err, list) {
			if (err) {
				console.log ("runScriptsInFolder: err.message == " + err.message);
				}
			else {
				if (!utils.endsWith (folderpath, "/")) {
					folderpath += "/";
					}
				for (var i = 0; i < list.length; i++) {
					var fname = list [i];
					if (utils.endsWith (fname.toLowerCase (), ".js")) {
						var f = folderpath + fname;
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
				}
			});
		});
	}
function startHttpServer () {
	davehttp.start (config, function (theRequest) {
		function returnString (theString) {
			theRequest.httpReturn (200, "text/plain", theString.toString ());
			}
		function returnData (theData) {
			theRequest.httpReturn (200, "application/json", utils.jsonStringify (theData));
			}
		switch (theRequest.lowerpath) {
			case "/version":
				returnString (myVersion);
				return;
			case "/now": 
				returnData (new Date ().toString ());
				return;
			case "/status": 
				var status = {
					prefs: config,
					status: stats
					}
				returnData (status);
				return;
			}
		theRequest.httpReturn (404, "text/plain", "Not found.");
		});
	}
function overnight () {
	runScriptsInFolder (overnightScriptsFolderName);
	}
function everyHour () {
	runScriptsInFolder (everyHourScriptsFolderName);
	}
function everyMinute () {
	var now = new Date ();
	console.log ("\n" + myProductName + " v" + myVersion + ": " + now.toLocaleTimeString ());
	runScriptsInFolder (everyMinuteScriptsFolderName);
	if (now.getMinutes () == config.minuteToRunHourlyScripts) {
		everyHour ();
		}
	if ((now.getMinutes () == 0) && (now.getHours () == config.hourToRunOvernightScripts)) {
		overnight ();
		}
	if (flStatsChanged) {
		flStatsChanged = false;
		writeStats ();
		}
	}
function everySecond () {
	var now = new Date ();
	runScriptsInFolder (everySecondScriptsFolderName);
	if (now.getSeconds () == config.secondToRunEveryMinuteScripts) {
		everyMinute ();
		}
	writeLocalStorageIfChanged ();
	}
function readConfig (callback) { //12/21/18 by DW
	function tryOne (fname, callback) {
		fs.readFile (fname, function (err, jsontext) {
			if (!err) {
				try {
					var jstruct = JSON.parse (jsontext);
					for (var x in jstruct) {
						config [x] = jstruct [x];
						}
					}
				catch (err) {
					}
				}
			callback ();
			});
		}
	tryOne (fnamePrefs, function () {
		tryOne (fnameConfig, callback);
		});
	}
function readLocalStorage (callback) { //12/21/18 by DW
	fs.readFile (fnameLocalStorage, function (err, jsontext) {
		if (!err) {
			try {
				localStorage = JSON.parse (jsontext);
				}
			catch (err) {
				}
			}
		callback ();
		});
	}
function readStats (callback) { //12/21/18 by DW
	fs.readFile (fnameStats, function (err, jsontext) {
		if (!err) {
			try {
				var jstruct = JSON.parse (jsontext);
				for (var x in jstruct) {
					stats [x] = jstruct [x];
					}
				}
			catch (err) {
				}
			}
		callback ();
		});
	}
function setupScriptsFolder (callback) { //12/21/18 by DW
	function setupOne (foldername, callback) {
		var folderpath = config.nameScriptsFolder + "/" + foldername;
		utils.sureFilePath (folderpath + "/x", callback);
		}
	setupOne (startupScriptsFolderName, function () {
		setupOne (everySecondScriptsFolderName, function () {
			setupOne (everyMinuteScriptsFolderName, function () {
				setupOne (everyHourScriptsFolderName, function () {
					setupOne (overnightScriptsFolderName, function () {
						callback ();
						});
					});
				});
			});
		});
	}

console.log ("\n" + myProductName + " v" + myVersion + ".\n");
readConfig (function () {
	console.log ("config == " + utils.jsonStringify (config));
	readLocalStorage (function () {
		lastLocalStorageJson = utils.jsonStringify (localStorage);
		readStats (function () {
			stats.ctStarts++;
			stats.whenLastStart = new Date ();
			statsChanged ();
			setupScriptsFolder (function () {
				runScriptsInFolder (startupScriptsFolderName, function () {
					setInterval (everySecond, 1000); 
					startHttpServer ();
					});
				});
			});
		});
	});
