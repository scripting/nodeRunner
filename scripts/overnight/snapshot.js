//make a copy of the main Scripting News feed once a day

httpReadUrl ("http://scripting.com/rss.xml", function (s) {
	var f = getDatePath () + "rss.xml"; //a path like this: 2014/12/29/rss.xml
	writeWholeFile (f, s, function (err) {
		if (err) {
			console.log ("There was an error writing to " + f + ". " + err.message);
			}
		else {
			console.log ("Wrote " + s.length + " characters to " + f);
			}
		});
	});



