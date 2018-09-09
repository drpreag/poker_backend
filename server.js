var express = require ('express');
var app = express();

var server = require('http').createServer(app);
//var http = require('http');
//var server = http.createServer(function(request, response){
//  response.writeHead(200, {'Content-Type': 'text/html'});
//  response.write('<h1>The server is working!</h1>');
//  response.end();
//});
var io = require ('socket.io').listen (server);

sessions = [];  // session, admin user
users = [];	// user, session
votes = []; // session, user, vote
connections = [];


server.listen (process.env.PORT || 3000);

console.log ('Poker plan server is up and running');

app.get ('/', function (req, res) {
	res.sendFile (__dirname + '/index.html');
});

io.sockets.on('connection', function(socket) {
	connections.push (socket);
	console.log ('Client connected: %s sockets connected', connections.length);

	// Disconnect socket
	socket.on ('disconnect', function (data) {
		connections.splice (connections.indexOf(socket),1);
		console.log ('Client disconnected: %s sockets connected', connections.length);		
	});

	// Session started
	socket.on ('session started', function (data) {
		sessions.push ( {id: data.id, user_id: data.user_id } );
		users.push ( {id: data.user_id, session: data.id } );
		console.log (sessions);
		console.log (users);
	});

	// Session started
	socket.on ('session joined', function (data) {
		sessions.push ( {id: data.id, user_id: data.user_id } );
		users.push ( {id: data.user_id, session: data.id } );
		console.log (sessions);
		console.log (users);
	});

	// Session started
	socket.on ('voted', function (data) {
		var change = false;
		for (var i = 0; i < votes.length; i++) {
		    if (votes[i].session==data.session && votes[i].user==data.user ) {
		    	votes[i].vote = data.vote;
		    	change = true;
		    }
		}
		if (! change) {
			votes.push ( {session: data.session, user: data.user, vote: data.vote } );
		}
		console.log (votes);
	});	
});



