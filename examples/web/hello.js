var f = "count.txt";
readWholeFile (f, function (err, s) {
	httpResponse.end ("The value in count.txt == " + s);    
	});
"";
