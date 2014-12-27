//read and write a file in the "files" sub-folder of the noderunner folder

var f = "count.txt";
fileExists (f, function (flExists) {
	var ct;
	if (flExists) {
		readWholeFile (f, function (err, s) {
			if (!err) {
				writeWholeFile ("count.txt", ++s);
				console.log ("Just wrote " + s + " to " + f + ".");
				}
			});
		}
	else {
		writeWholeFile (f, 0);
		console.log ("Just wrote " + 0 + " to " + f + ".");
		}
	});
writeWholeFile ("test.txt", new Date ());
