//an example script that reads a River4 file and displays new items on the console.
//derived from a script that keeps the @NYT twitter account filled with news.
//for now it just echoes the title of the news item to the console.

var urlRiver = "http://rss.scripting.com/rivers/nytRiver.js", riverStats;
var flAtMostOneTweetPerMinute = false;

function sendTweet (s) { //doesn't do anything for now -- 12/27/14 by DW
	}

//init stuff in localStorage
	if (localStorage.riverStats === undefined) {
		localStorage.riverStats = new Object ();
		localStorage.riverStats.ctStories = 0;
		localStorage.riverStats.whenLastStory = new Date (0);
		localStorage.riverStats.ctRiverChecks = 0;
		localStorage.riverStats.whenLastCheck = new Date (0);
		localStorage.riverStats.idsSeen = new Object ();
		}
	riverStats = localStorage.riverStats;

httpReadUrl (urlRiver, function (s) {
	var now = new Date (), prefix = "onGetRiverStream (", idsStruct = {}, flNoTweetsSentYet = true;
	for (var x in riverStats.idsSeen) { //create idsStruct -- at the end it will contain ids that in the array, but not in the river
		idsStruct [x] = true;
		}
	s = stringDelete (s, 1, prefix.length);
	s = stringMid (s, 1, s.length - 1); //pop off right paren at end
	var jstruct = JSON.parse (s);
	var feeds = jstruct.updatedFeeds.updatedFeed;
	for (var i = 0; i < feeds.length; i++) {
		var feed = feeds [i];
		for (var j = 0; j < feed.item.length; j++) {
			var item = feed.item [j];
			if (riverStats.idsSeen [item.id] === undefined) {
				if ((!flAtMostOneTweetPerMinute) || flNoTweetsSentYet) {
					var flTitleInArray = false;
					for (var x in riverStats.idsSeen) { //set flTitleInArray
						if (riverStats.idsSeen [x].title == item.title) { 
							flTitleInArray = true;
							break;
							}
						}
					riverStats.idsSeen [item.id] = {
						title: item.title,
						when: now
						};
					riverStats.ctStories++;
					riverStats.whenLastStory = now;
					if (!flTitleInArray) { //avoid literal duplicates
						console.log (item.title);
						sendTweet (item.title + ". " + item.link);
						flNoTweetsSentYet = false; //11/22/14 by DW
						}
					}
				}
			else {
				idsStruct [item.id] = false; //if it's false it's still in the river, and can't be deleted from the riverStats struct
				}
			}
		}
	var ctRemoved = 0, ctInArray = 0;
	for (var x in idsStruct) {
		if (idsStruct [x]) {
			ctRemoved++;
			delete riverStats.idsSeen [x];
			}
		ctInArray++;
		}
	riverStats.ctRiverChecks++;
	riverStats.whenLastCheck = now;
	});





