Noderunner
==========

<a href="http://noderunner.org/">Noderunner</a> is a Node.js server app that runs scripts every second, minute, hour or overnight, each group in its own folder. 

It was written by <a href="http://scripting.com/">Dave Winer</a>, and is the first of a series of "server snacks" that will come out in early 2015. 

#### How it works
<img src="http://scripting.com/2014/12/28/snacks.png" width="145" height="143" border="0" align="right" alt="A picture named snacks.png">Copy noderunner.js to a folder with a single sub-folder: scripts. 
In scripts, there are four sub-folders, everySecond, everyMinute, everyHour, overnight and startup. You can use the examples in the scripts folder here as examples to help you get started.

Any file with a .js extension in those folders are loaded and run when it's their time. All other files are ignored.

The files are not cached, so you can make changes while Noderunner is running.

They share data through a structure called localStorage, which works more or less like localStorage in browsers. It doesn't have a file size limit, but it's a good idea to keep it small, because it's potentially saved every second. 

It automatically creates the folders it needs when it boots up.

#### Example

Here's a <a href="https://github.com/scripting/noderunner/blob/master/scripts/startup/hello.js">Hello World</a> script that runs when Noderunner starts up.

#### Special folders

1. *files* contains files that are accessed through three routines provided by Noderunner: fileExists, readWholeFile and writeWholeFile. Note, you can use any of Node's <a href="http://nodejs.org/api/fs.html">fs</a> routines to read or write to any file on the local system. 

2. *prefs* contains files that are managed by Noderunner. stats.json has data that the server maintains. prefs.son allows you to control when scripts run, what port the server boots up on. localStorage.json is the contents of the localStorage object. 

3. *scripts* has several sub-folders, startup, everySecond, everyMinute, everyHour and overnight. 

#### The HTTP server

The server provides three endpoints: version, now and status, that tell you what version is running, what the current time is on the server, and echoes the contents of the prefs and stats structs. 
#### Why folders?
I like Dropbox. I've built a few pieces of software over the years based on the idea of storing all the data in folder structures. This means that pieces of the app can easily be distributed among a variety of machines, or easily moved. With folders, I can manage my scripts from any of my Dropbox-capable computers, which includes my desktop, laptop, tablet and smartphone. 
Node.js plus Dropbox-managed folder structures is an incredible combination of technologies. Very simple yet powerful.
BTW, when I say Dropbox, I mean all manner of systems that do more or less the same thing, synchronizing folders across devices. 
#### Why did you develop it?
I need it.
#### How do you know it's useful?
This is an adaptation of a core feature in <a href="http://hellofrontier.com/">Frontier</a>, a scripting and object database environment I led the development of. Now that I'm working primarily in Node, I wanted the same ability to quickly add and edit scripts that are constantly running on net-accessible systems. 

There's an <a href="https://github.com/scripting/noderunner/blob/master/scripts/everyMinute/rivertoconsole.js">example app</a> in the everyMinute folder in the repository that reads a River4 file every minute and echoes the titles of NY Times stories on the console. It's part of a real app that I use to maintain <a href="https://twitter.com/nyt">@NYT</a> on Twitter. 

#### JavaScript sample code

I've iterated over the code to try to make it good sample code for JavaScript projects. 

I wanted to make code that could be used for people who are just getting started with Node, to help make the process easier.

There will always be more work to do here. ;-)


