var urls = [
	"twitter.littlecardeditor.com",
	"twitter.littleoutliner.com",
	"twitter.liveblog.co",
	"twitter.macwrite.org",
	"twitter.myword.io",
	"twitter.noteblog.io",
	"twitter.podcatch.com",
	"twitter.porkchop.io",
	"twitter.radio3.io",
	"river4b.herokuapp.com",
	"river4a.herokuapp.com",
	"riverforpodcatch.herokuapp.com"
	];
var whenStart = new Date ();

function pingOne (ix) {
	if (ix >= 0) {
		var url = "http://" + urls [ix] + "/now", whenstart = new Date ();
		httpReadUrl (url, function (s) {
			pingOne (ix - 1);
			});
		}
	else {
		console.log ("\npingServers.js took " + utils.secondsSince (whenStart) + " secs to ping " + urls.length + " urls.\n");
		}
	}
pingOne (urls.length - 1);
