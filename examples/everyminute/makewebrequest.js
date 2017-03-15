//make a periodict web request and report the size of the file and how long the request took

var whenstart = new Date ();
httpReadUrl ("http://scripting.com/", function (s) {
	console.log ("There are " + s.length + " characters in the web page. The request took " + utils.secondsSince (whenstart) + " seconds.");
	});



