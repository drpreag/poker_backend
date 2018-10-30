const chai = require('chai');
const chaiHttp = require('chai-http');
let should = chai.should();
chai.use (chaiHttp);

const server = require('../server');
var result = null;

describe ('Session Api endpoints test', function () {

	describe ('post /api/sessions - add a session', function () {
		it ('Should return inserted session', function () {
			chai.request(server)
				.post ('/api/sessions')
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.should.have.property('session');
					result = res.body.session;
				});
		});
	});

	describe ('get /api/sessions - get one session', function () {
		it ('Should get one session', function () {
			chai.request(server)
				.get ('/api/sessions/'+result)
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
				});
		});
	});

	describe ('put /api/sessions - edit a session', function () {
		it ('Should return inserted session', function () {
			chai.request(server)
				.put ('/api/sessions/'+result, { username: "username" })
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.should.have.property('session');
					result = res.body.session;
				});
		});
	});

	describe ('get /api/sessions - get all sessions', function () {
		it ('Should get all sessions', function () {
			chai.request(server)
				.get ('/api/sessions')
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('array');
				});
		});
	});	

});

server.stop();