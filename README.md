Noderunner
==========

<a href="http://noderunner.org/">Noderunner</a> is a Node.js server app that runs scripts every second, minute, hour or overnight, each group in its own folder. 

It's the <a href="http://scripting.com/2014/12/28/forReviewNoderunner.html">first</a> of a series of "server snacks" that will come out in early 2015. 

<a href="http://noderunner.smallpict.com/2015/01/03/whyINeededNoderunner.html">Dave Winer</a>

#### How it works
<img src="http://scripting.com/2014/12/28/snacks.png" width="145" height="143" border="0" align="right" alt="A picture named snacks.png">Copy noderunner.js to a folder with a single sub-folder: scripts. 
In scripts, there are four sub-folders, everySecond, everyMinute, everyHour, overnight and startup. You can use the examples in the scripts folder here as examples to help you get started.

Any file with a .js extension in those folders are loaded and run when it's their time. All other files are ignored.

The files are not cached, so you can make changes while Noderunner is running.

They share data through a structure called localStorage, which works more or less like localStorage in browsers. It doesn't have a file size limit, but it's a good idea to keep it small, because it's potentially saved every second. 

It automatically creates the folders it needs when it boots up.

#### Examples

1. Here's a <a href="https://github.com/scripting/noderunner/blob/master/scripts/startup/hello.js">Hello World</a> script that runs when Noderunner starts up.

2. <a href="https://github.com/scripting/noderunner/blob/master/scripts/everyMinute/rivertoconsole.js">RiverToConsole</a> runs every minute and checks a JSON file produced by River4, and echoes new items to the console. It's part of a real app that I use to maintain <a href="https://twitter.com/nyt">@NYT</a> on Twitter. 

3. <a href="https://github.com/scripting/noderunner/blob/master/scripts/overnight/snapshot.js">Snapshot</a> archives the Scripting News feed once a day in a calendar folder structure.

#### Special folders

1. *files* contains files that are accessed through three routines provided by Noderunner: fileExists, readWholeFile and writeWholeFile. Note, you can use any of Node's <a href="http://nodejs.org/api/fs.html">fs</a> routines to read or write to any file on the local system. 

2. *prefs* contains files that are managed by Noderunner. stats.json has data that the server maintains. prefs.son allows you to control when scripts run, what port the server boots up on. localStorage.json is the contents of the localStorage object. 

3. *scripts* has several sub-folders, startup, everySecond, everyMinute, everyHour and overnight. 

#### The HTTP server

The server provides three endpoints: version, now and status, that tell you what version is running, what the current time is on the server, and echoes the contents of the prefs and stats structs. 
#### Why folders?
I like file sharing software like Dropbox, Box, Google Drive, OneDrive, BT Sync. I've built a few pieces of software over the years based on the idea of storing all the data in folder structures. This means that pieces of the app can easily be distributed among a variety of machines, or moved. With folders, I can manage my scripts from any of my sharing-capable computers, which includes my desktop, laptop, tablet and smartphone. 
#### Why did you develop it?
<a href="http://noderunner.smallpict.com/2015/01/03/whyINeededNoderunner.html">I needed it</a>.
#### How do you know it's useful?
This is an adaptation of a core feature in <a href="http://hellofrontier.com/">Frontier</a>, a scripting and object database environment I led the development of. Now that I'm working primarily in Node, I wanted the same ability to quickly add and edit scripts that are constantly running on net-accessible systems. 

#### JavaScript sample code

I've iterated over the code to try to make it good sample code for JavaScript projects. 

I wanted to make code that could be used for people who are just getting started with Node, to help make the process easier.

There will always be more work to do here. ;-)

#### Updates

##### v0.61 1/15/15 by DW

Code reorg. There's now a lib folder, and it contains a module called utils.js. This simplifies noderunner.js, and makes it easier for noderunner to share code with other projects.

##### v0.57 12/30/14 by DW

New environment variable, noderunnerFolderPath, lets you set the folder Noderunner runs from, i.e. where it looks for scripts, prefs, and where it stores its data. See this <a href="http://noderunner.smallpict.com/2014/12/30/noderunnerV057.html">blog post</a> on this release, including general philosophy of Noderunner.

#### Questions, comments?

Please post a note on the <a href="https://groups.google.com/forum/#!forum/server-snacks">Server Snacks</a> mail list. 




