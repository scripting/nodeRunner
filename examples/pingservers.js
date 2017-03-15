var urls = [
	"twitter2.littlecardeditor.com:5341",
	"twitter2.liveblog.co:5345",
	"twitter2.macwrite.org:5339",
	"twitter2.myword.io:5343",
	"twitter2.noteblog.io:5346",
	"twitter2.podcatch.com:5344",
	"twitter2.porkchop.io:5340",
	"twitter2.radio3.io:5342",
	"river4b.herokuapp.com",
	"river4a.herokuapp.com",
	"riverforpodcatch.herokuapp.com"
	];
var whenStart = new Date ();

function pingOne (ix) {
	if (ix >= 0) {
		var url = "http://" + urls [ix] + "/now", whenstart = new Date ();
		httpReadUrl (url, function (s) {
			console.log ("ping " + url + ", " + utils.secondsSince (whenstart) + " secs.");
			pingOne (ix - 1);
			});
		}
	else {
		console.log ("\npingServers.js took " + utils.secondsSince (whenStart) + " secs to ping " + urls.length + " urls.\n");
		}
	}
pingOne (urls.length - 1);
