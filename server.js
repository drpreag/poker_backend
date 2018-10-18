var express = require ('express');
var app = express();
var server = require('http').createServer(app);
var io = require ('socket.io').listen (server);
var cors = require('cors'); 
app.use(cors());
var compression = require('compression');
app.use (compression());
var helmet = require('helmet');
app.use (helmet());

sessions = [];  	// session, user
users = [];			// socketid, session, username
votes = []; 		// session, user, vote
connections = [];	// socket.io connections

server.listen (process.env.PORT || 3000);

console.log ('Poker plan server is up and running');

app.get ('/', function (req, res) {
	console.log ('Request for /');	
	res.sendFile (__dirname + '/index.html');
});

app.get ('/session/:session', function (req, res) {
	console.log ('API request for /session/' + req.params.session);		

	for (var i=0; i<sessions.length; i++) {
		if (sessions[i].session == req.params.session) {
			res.json ({ session: req.params.session, exists: true, algorythm: sessions[i].algorythm, story: sessions[i].story, date: sessions[i].date });			
		}
	}
	// session does not exist
	res.json ({ session: req.params.session, exists: false });

});

// app.get ('/session/:session/algorythm', function (req, res) {
// 	console.log ('API request for /session/%d/algorythm/', req.params.session);		

// 	var algorythm = 1;
// 	for (var i=0; i<sessions.length; i++) {
// 		if (sessions[i].session == req.params.session) {
// 			algorythm = sessions[i].algorythm;
// 		}
// 	}		
// 	res.json ({ session: req.params.session, algorythm: algorythm });
// });

app.get ('/session/:session/votes', function (req, res) {
	var response = [];
	console.log ('API request for /session/%d/votes/', req.params.session);	
	session_id = Number(req.params.session);

	for (var i=0; i<votes.length; i++) {
	 	if (votes[i].session == session_id) {
	 		response.push ( {session: Number(votes[i].session), username: votes[i].username, vote: votes[i].vote} );
		}
	}		
	res.json(response);
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
		console.log ('User %s on a session %d disconnected', users.indexOf(socket.id).username, users.indexOf(socket.id).session);		

		// delete votes
 		for (var i=0; i<votes.length; i++) {
    		if (votes[i].username == users.indexOf(socket.id).username && votes[i].session == users.indexOf(socket.id).session) {
    			user_exists = true;
    		}
		}		
		users.splice (users.indexOf(socket.id),1);		
		connections.splice (connections.indexOf(socket),1);

		socket.leave (data.session);
		console.log ('Client disconnected: %s sockets connected', connections.length);
	});

	// Session started
	socket.on ('session_started', function (data) {
		sessions.push ( {session: data.session, username: data.username, algorythm: 1, story: null, date: Date.now()} );
		console.log ("Session %s started by user %s @ %s", data.session, data.username, Date.now());		
	});

	// User joined to a session
	socket.on ('session_joined', function (data) {
		socket.broadcast.emit ('session_joined', data);
		users.push ( { socket: socket.id, session: data.session, username: data.username } );

		var user_exist = false;
 		for (var i=0; i<votes.length; i++) {
    		if (votes[i].username == data.username && votes[i].session == data.session) {
    			user_exist = true;
				console.log ('User %s re-joined session %s', data.username, data.session);    			
    		}
		}			
		if (!user_exist) {
			votes.push ( { session: data.session, username: data.username, vote: null } );
			socket.join (data.session);
			// broadcast to all other clients in a channel
			console.log ('User %s joined session %s', data.username, data.session);
		}
	});	

	// User re-joined to a session
	socket.on ('session_rejoined', function (data) {
		socket.broadcast.emit ('session_rejoined', data);
		users.push ( { socket: socket.id, session: data.session, username: data.username } );

		var user_exist = false;
 		for (var i=0; i<votes.length; i++) {
    		if (votes[i].username == data.username && votes[i].session == data.session) {
    			user_exists = true;
    		}
		}			
		if (!user_exist)
			votes.push ( { session: data.session, username: data.username, vote: null } );		

		socket.join (data.session);
		// broadcast to all other clients in a channel
		console.log ('User %s re-joined session %s', data.username, data.session);
	});		

	// User left a session
	socket.on ('session_left', function (data) {
		socket.broadcast.emit ('session_left', data);
		console.log ('User %s left session %s', data.username, data.session);
 		for (var i=0; i<votes.length; i++) {
    		if (votes[i].username == data.username && votes[i].session == data.session) {
    			votes.splice (i,1);
    		}
		}	
		users.splice (users.indexOf(socket.id),1);
		socket.leave (data.session);
		// broadcast to all other clients in a channel
	});	

	// If one user has been voted, then send all votes to all users in a channel
	socket.on ('voted', function (data) {
		socket.broadcast.emit ('voted', data);		
		var change = false;
		// add that users vote to votes[] (alter or push)
		for (var i=0; i<votes.length; i++) {
		    if (votes[i].session==data.session && votes[i].username==data.username ) {
		    	votes[i].vote = data.vote;
		    	change = true;
		    }
		}
		if (! change) {
			votes.push ( { session: Number(data.session), username: data.username, vote: data.vote } );
		}
		var missing = false;
		var voted = []; // new array with current session only
		for (i=0; i<votes.length; i++) {
		    if (votes[i].session == data.session) {
				voted.push ( { session: Number(votes[i].session), username: votes[i].username, vote: votes[i].vote } );
				// if (votes[i].vote == null) 
				// 	missing = true;	// at least one user did not vote
		    }
		}		
		// if (! missing) {
		// 	console.log ("All voted in session " + data.session);	
		// 	socket.broadcast.emit ('show_all_votes', data);		
		// }
	});	

	// Votes have been cleared
	socket.on ('clear_votes', function (data) {
		for (var i=0; i<votes.length; i++) {
		    if (votes[i].session == data.session ) {
		    	votes[i].vote = null;
		    }
		}
		socket.broadcast.emit ('clear_votes', data);
		console.log ("In Session %d cleared votes by %s", data.session, data.username);
	});	

	// Someone changed vote algorythm
	socket.on ('change_algorythm', function (data) {
		for (var i=0; i<sessions.length; i++) {
		    if (sessions[i].session == data.session ) {
		    	sessions[i].algorythm = data.algorythm;
				socket.broadcast.emit ('change_algorythm', data);
				console.log ("In Session %d changed algorythm to %d by %s", data.session, data.algorythm, data.username);		    	
		    }
		}		
	});		

	// Someone changed story name
	socket.on ('change_story', function (data) {
		for (var i=0; i<sessions.length; i++) {
		    if (sessions[i].session == data.session ) {
		    	sessions[i].story = data.story;
				socket.broadcast.emit ('change_story', data);
				console.log ("In Session %d user %s changed story name to %s", data.session, data.username, data.story);		    	
		    }
		}		
	});		

	// lets show all votes
	socket.on ('show_all_votes', function (data) {
		for (var i=0; i<sessions.length; i++) {
		    if (sessions[i].session == data.session ) {
				socket.broadcast.emit ('show_all_votes', data);
				console.log ("In Session %d user %s sent show all votes signal", data.session, data.username);
			}
		}
	});	
});
