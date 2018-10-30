/*
 * Node JS Express common part
*/
const express = require ('express');
const app = express();
app.use (express.json());

const server = require('http').createServer(app);

const io = require ('socket.io').listen (server);

const cors = require('cors'); 
app.use(cors());

const compression = require('compression');
app.use (compression());

const helmet = require('helmet');
app.use (helmet());

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

app.disable('etag');

/*
 * 
*/

const listeners = require ('./modules/listeners.js');
const common = require ('./modules/common.js');
const serverPort = process.env.PORT || 3000;

sessions = [ 		// session, username, algorythm, story, date
	{ session: 91969, username: "Peca", algorythm: 2, story: '', date: Date.now() }
];  	
users = [];			// socketid, session, username
votes = []; 		// session, user, vote
connections = [];	// socket.io connections

server.listen (serverPort);

console.log (`Poker plan server is up and running on port ${serverPort}...`);

// GET index.html
app.get ('/', function (req, res) {
	console.log ('Request for /');	
	res.sendFile (__dirname + '/index.html');
});

// GET /api/sessions
app.get ('/api/sessions', function (req, res) {
	console.log ("API get request for /api/sessions");	

	if (sessions.length===0) 
		return res.status(404).send("Sessions not found");
	res.send (sessions);
	console.log ("  Sessions found");
});

// GET /api/sessions/:id
app.get ('/api/sessions/:id', function (req, res) {
	console.log ("API get request for /api/sessions/" + req.params.id);

	if (isNaN(req.params.id)) 
		return res.status(400).send("Invalid input " + req.params.id);
	const sessionId = parseInt(req.params.id);
	const session = sessions.find (s => s.session === sessionId);

	if (session)
		return res.send ({ session: sessionId, exists: true, algorythm: session.algorythm, story: session.story, date: session.date });
	res.status(404).send("Session not found " + sessionId);
});

// POST /api/sessions
app.post ('/api/sessions', function (req, res) {
	console.log ("API post request for /api/sessions/");

    var session = null;
    var exists = true;	

    while (exists) {
    	exists = false;
		newSession = common.randomNumber(10000,99999)
		for (var i=0; i<sessions.length; i++)
			if (sessions[i].session == newSession) {
				exists = true;
				continue;
			}
	}
	sessions.push ( { session: newSession, username: req.body.username, algorythm: 2, story: null, date: Date.now() } );

	return res.send (sessions[sessions.length-1]);
});

// PUT /api/sessions/:id
app.put ('/api/sessions/:id', function (req, res) {
	console.log ("API put request for /api/sessions/" + req.params.id);

	if (isNaN(req.params.id)) 
		return res.status(400).send("Invalid input " + req.params.id);

	const sessionId = parseInt(req.params.id);
	const session = sessions.find (s => s.session === sessionId);
	if (session) {
		session.algorythm = req.body.algorythm;
		session.story = req.body.story;
		return res.send (session);
	}
	return res.status(500).send("Session error " + sessionId);
});

// GET /api/sessions/:id/votes
app.get ('/api/sessions/:id/votes', function (req, res) {
	console.log ('API request for /api/sessions/%d/votes/', req.params.id);	

	if (isNaN(req.params.id)) 
		return res.status(400).send("Invalid input " + req.params.session);

	const sessionId = parseInt(req.params.id);
	var response = [];

	for (var i=0; i<votes.length; i++) {
	 	if (votes[i].session == sessionId) {
	 		response.push ( {session: sessionId, username: votes[i].username, vote: votes[i].vote} );	 		
		}
	}
	if (response.length!==0)
		return res.send(response);
	res.status(404).send("Votes not found for session " +  sessionId);
});


// create single namespace
// var nsp = io.of('/');

// setup listeners
io.on('connection', function(socket) {
// nsp.on('connection', function(socket) {

	connections.push (socket);
	console.log ('Client connected: %s sockets connected', connections.length);
	
	// Disconnected user (on a network level, not when user leave room)
	socket.on ('disconnect', function (data) {
		listeners.disconnect (socket, users, votes, connections, data);
	});

	// User joined to a session
	socket.on ('session_joined', function (data) {
		listeners.sessionJoined (socket, users, votes, data);
	});	

	// User re-joined to a session
	socket.on ('session_rejoined', function (data) {
		listeners.sessionReJoined (socket, users, votes, data);
	});		

	// User left a session
	socket.on ('session_left', function (data) {
		listeners.sessionLeft (socket, users, votes, data);
	});	

	// If one user has been voted, then send all votes to all users in a channel
	socket.on ('voted', function (data) {
		listeners.userVoted (socket, users, votes, data);
	});	

	// Votes have been cleared
	socket.on ('clear_votes', function (data) {
		listeners.clearVotes (socket, users, votes, data);
	});	

	// Someone changed vote algorythm
	socket.on ('changed_session', function (data) {
		listeners.changedSession (socket, data);		
	});		

	// lets show all votes
	socket.on ('show_all_votes', function (data) {
		listeners.showAllVotes (socket, data)	
	});	
});

function stop() {
  server.close();
}

module.exports = app;
module.exports.stop = stop;