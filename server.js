var express = require ('express');
var app = express();

var server = require('http').createServer(app);

var io = require ('socket.io').listen (server);

sessions = [];  // id(session), user
votes = []; 	// session, user, vote
connections = [];


server.listen (process.env.PORT || 3000);

console.log ('Poker plan server is up and running');

app.get ('/', function (req, res) {
	res.sendFile (__dirname + '/index.html');
});

// setup listener
io.sockets.on('connection', function(socket) {

	connections.push (socket);
	console.log ('Client connected: %s sockets connected', connections.length);
	
	// Disconnect socket
	socket.on ('disconnect', function (data) {
		connections.splice (connections.indexOf(socket),1);
		console.log ('Client disconnected: %s sockets connected', connections.length);
	});

	// Session started
	socket.on ('session_started', function (data) {
		console.log ("Session " + data.id + " started, user " + data.user + " is admin/scrum master");
		sessions.push ( { id: data.id, user: data.user } );
		votes.push ( { session: data.id, user: data.user, vote: null } );
		socket.send ('session_started', data);		
	});

	// Session joined
	socket.on ('session_joined', function (data) {
		console.log ("User '" + data.user + "' joined session " + data.session);
		votes.push ( { session: data.session, user: data.user, vote: null } );
		socket.send ('session_joined', votes);
	});

	// Session left
	socket.on ('session_left', function (data) {
 		for (var j=0; j<votes.length; j++) {
    		if (votes[j].user === data.user && votes[j].session === data.session) {
    			votes.splice (j,1);			    	
    		}
		}
		console.log ("User '" + data.user + "' left session " + data.session);
	});

	// User has been voted
	socket.on ('voted', function (data) {
		var change = false;
		var voted = [];
		for (var i=0; i<votes.length; i++) {
		    if (votes[i].session==data.session && votes[i].user==data.user ) {
		    	votes[i].vote = data.vote;
		    	change = true;
		    }
		}
		if (! change) {
			votes.push ( { session: data.session, user: data.user, vote: data.vote } );
		}
		for (i=0; i<votes.length; i++) {
		    if (votes[i].session==data.session) {
				voted.push ( { session: votes[i].session, user: votes[i].user, vote: votes[i].vote } );
		    }
		}
		io.sockets.emit ('votes', voted);
		console.log ("Voted");
		console.log (voted);
		console.log ("Votes");
		console.log (votes);

	});	

	// User has been voted
	socket.on ('clear_votes', function (data) {
		var voted = [];
		for (var i=0; i<votes.length; i++) {
		    if (votes[i].session==data.session ) {
		    	votes[i].vote = null;
		    }
		}
		for (i=0; i<votes.length; i++) {
		    if (votes[i].session==data.session) {
				voted.push ( { session: votes[i].session, user: votes[i].user, vote: votes[i].vote } );
		    }
		}
		io.sockets.emit ('votes', voted);
		console.log ("Voted");
		console.log (voted);
	});	

});
