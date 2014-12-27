//use localStorage to communicate between invocations of the script

if (localStorage.ctEverySeconds == undefined) {
	localStorage.ctEverySeconds = 1;
	}
else {
	localStorage.ctEverySeconds++;
	}
