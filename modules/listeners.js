function disconnect (socket, users, votes, connection, data) {
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
}

function sessionJoined (socket, users, votes, data) {
	// User joined to a session
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
}

function sessionReJoined (socket, users, votes, data) {
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
}

function sessionLeft (socket, users, votes, data) {
	socket.broadcast.emit ('session_left', data);
		for (var i=0; i<votes.length; i++) {
		if (votes[i].username == data.username && votes[i].session == data.session) {
			votes.splice (i,1);
		}
	}	
	users.splice (users.indexOf(socket.id),1);
	socket.leave (data.session);
	// broadcast to all other clients in a channel
	console.log ('User %s left session %s', data.username, data.session);
}

function userVoted (socket, users, votes, data) {
	socket.broadcast.emit ('voted', data);		
	var change = false;
	// add that users vote to votes[] (alter or push)
	for (var i=0; i<votes.length; i++) {
	    if (votes[i].session==data.session && votes[i].username==data.username ) {
	    	votes[i].vote = data.vote;
	    	change = true;
	    }
	}
	if (! change) 
		votes.push ( { session: Number(data.session), username: data.username, vote: data.vote } );
	
	var missing = false;
	var voted = []; // new array with current session only
	for (i=0; i<votes.length; i++) {
	    if (votes[i].session == data.session) {
			voted.push ( { session: Number(votes[i].session), username: votes[i].username, vote: votes[i].vote } );
	    }
	}	
	console.log ('User %s voted in session %s', data.username, data.session);	
}

function clearVotes (socket, users, votes, data) {
	// Votes have been cleared
	for (var i=0; i<votes.length; i++) {
	    if (votes[i].session == data.session ) {
	    	votes[i].vote = null;
	    }
	}
	socket.broadcast.emit ('clear_votes', data);
	console.log ("In Session %d cleared votes by %s", data.session, data.username);
}

function changedSession (socket, session, data) {
	// Someone changed vote algorythm
	for (var i=0; i<sessions.length; i++) {
	    if (sessions[i].session == data.session ) {
	    	sessions[i].algorythm = data.algorythm;
	    	sessions[i].story = data.story;
			socket.broadcast.emit ('change_session', data);
			console.log ("Session %d changed by %s", data.session, data.username);
	    }
	}		
}

function showAllVotes (socket, data) {
	// lets show all votes	
	for (var i=0; i<sessions.length; i++) {
	    if (sessions[i].session == data.session ) {
			socket.broadcast.emit ('show_all_votes', data);
			console.log ("In Session %d user %s sent show all votes signal", data.session, data.username);
		}
	}
}

module.exports.disconnect = disconnect;
module.exports.sessionJoined = sessionJoined;
module.exports.sessionReJoined = sessionReJoined;
module.exports.sessionLeft= sessionLeft;
module.exports.userVoted = userVoted;
module.exports.clearVotes = clearVotes;
module.exports.changedSession = changedSession;
module.exports.showAllVotes = showAllVotes;