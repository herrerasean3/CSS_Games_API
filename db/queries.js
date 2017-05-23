let pgp = require('pg-promise')();
let connString = process.env.DATABASE_URL;
let db = pgp(connString);
var unirest = require('unirest');

/*
Tweedr uses a single table database. To this end, all relevant data is contained in the table "tweed".
The table is organized like so:

tweed_id | username | tweed_content | tweed_timestamp | reply_id

tweed_id, tweed_timestamp, and reply_id are automatically resolved by the code, and are by default, impossible to edit.
This serves to ensure preservation of some post data, even if the username and content have been altered.

username is a VARCHAR field, and currently is uncapped. Please avoid colossal usernames.
tweed_content is also a VARCHAR field, but limited to 120 characters in the spirit of Twitter.
*/

// Called whenever the index recieves a GET request.
// Grabs the entire tweed table, save for the placeholder post.
// Sorts the posts by timestamp, then ID.

function readAllPosts(req, res, next) {
	db.any('SELECT * FROM tweed WHERE tweed_id > 1 ORDER BY tweed_timestamp DESC, tweed_id DESC')
		.then(function(data) {
			res.status(200)
			.json({
				status: 'success',
				data: data
			});
		})
		.catch(function(err) {
			return next(err);
		});
}

// Called whenever '/reply/:id' recieves a GET request.
// Using a db.task, two database queries are made in a batch.
// "OP" contains the post to which the parameter ID is pointing to.
// "replies" contains all posts with a reply_id matching the tweed_id of the OP.
// targetID is present at several points in the code, ensuring that there is no way for users to touch the placeholder post.

function populateGames() {
	// These code snippets use an open-source library. http://unirest.io/nodejs

	unirest.get(`https://igdbcom-internet-game-database-v1.p.mashape.com/games/?fields=*&limit=50&offset=$0&order=release_dates.date:desc:min`)
	.header("X-Mashape-Key", "TuXniFMGOQmshjKDomTdGg04leQNp1fHjPmjsncnYr5Q63eBW2")
	.header("Accept", "application/json")
	.end(function (result) {
  	console.log(result.status, result.headers);
  	
  	for (var i = 0; i < result.body.length; i++) {
  	db.none('INSERT INTO games(game_title)' + 
		'values(${name})',
		result.body[i])
  	}
	});
}

function populateGenres() {
	// These code snippets use an open-source library. http://unirest.io/nodejs

	unirest.get(`https://igdbcom-internet-game-database-v1.p.mashape.com/games/?fields=*&limit=50&offset=$0`)
	.header("X-Mashape-Key", "TuXniFMGOQmshjKDomTdGg04leQNp1fHjPmjsncnYr5Q63eBW2")
	.header("Accept", "application/json")
	.end(function (result) {
  	console.log(result.status, result.headers);
  	
  	for (var i = 0; i < result.body.length; i++) {
  	db.none('INSERT INTO genres(genre)' + 
		'values(${name})',
		result.body[i])
  	}
	});
}

function populateSummaries() {
	// These code snippets use an open-source library. http://unirest.io/nodejs

	unirest.get(`https://igdbcom-internet-game-database-v1.p.mashape.com/games/?fields=*&limit=50&offset=$0&order=release_dates.date:desc:min`)
	.header("X-Mashape-Key", "TuXniFMGOQmshjKDomTdGg04leQNp1fHjPmjsncnYr5Q63eBW2")
	.header("Accept", "application/json")
	.end(function (result) {
  	console.log(result.status, result.headers);
  	
  	for (var i = 0; i < result.body.length; i++) {
  	db.none('UPDATE games SET game_desc_short = ${summary} WHERE game_id =' + `${i+1}`,
		result.body[i])
  	}
	});
}

function populateStorylines() {
	// These code snippets use an open-source library. http://unirest.io/nodejs

	unirest.get(`https://igdbcom-internet-game-database-v1.p.mashape.com/games/?fields=*&limit=50&offset=$0&order=release_dates.date:desc:min`)
	.header("X-Mashape-Key", "TuXniFMGOQmshjKDomTdGg04leQNp1fHjPmjsncnYr5Q63eBW2")
	.header("Accept", "application/json")
	.end(function (result) {
  	console.log(result.status, result.headers);
  	
  	for (var i = 0; i < result.body.length; i++) {
  	db.none('UPDATE games SET game_desc = ${storyline} WHERE game_id =' + `${i+1}`,
		result.body[i])
  	}
	});
}

function populateCovers() {
	// These code snippets use an open-source library. http://unirest.io/nodejs

	unirest.get(`https://igdbcom-internet-game-database-v1.p.mashape.com/games/?fields=*&limit=50&offset=$0&order=release_dates.date:desc:min`)
	.header("X-Mashape-Key", "TuXniFMGOQmshjKDomTdGg04leQNp1fHjPmjsncnYr5Q63eBW2")
	.header("Accept", "application/json")
	.end(function (result) {
  	console.log(result.status, result.headers);
  	
  	for (var i = 0; i < result.body.length; i++) {
  	db.none('UPDATE games SET game_cover = ${url} WHERE game_id =' + `${i+1}`,
		result.body[i].cover)
  	}
	});
}

function getPostReplies(req, res, next) {
	let targetID = parseInt(req.params.id) + 1;
	if (targetID < 2) {
		targetID = 2;
	}

	db.task(t => {
		return t.batch([
			t.one('SELECT * FROM tweed WHERE tweed_id = $1', targetID),
			t.any('SELECT * FROM tweed WHERE reply_id = $1 AND tweed_id > 1 ORDER BY tweed_timestamp DESC, tweed_id DESC', targetID)
			]);
	})
	.then(data => {
			res.status(200)
			.json({
				status: 'success',
				OP: data[0],
				replies: data[1]
			});
		})
		.catch(function(err) {
			return next(err);
		});
}

// Called when a POST request is sent to the index.
// Takes "username" and "tweed_content" as values for the request.
// Timestamp is generated automatically, and for new posts, reply ID points to the placeholder post.

function submitPost(req, res, next) {
	db.none('INSERT INTO tweed(username,tweed_content,tweed_timestamp,reply_id)' + 
		'values(${username}, ${tweed_content}, CURRENT_TIMESTAMP, 1)',
		req.body)
	.then(function() {
		res.status(200)
		.json({
          status: 'success',
          message: 'Tweed Submitted'
        });
    })
    .catch(function(err) {
      return next(err);
    });
}

// Called when a POST request is sent to '/reply/:id'.
// Takes the same values as the previous function.
// Uses the id from the URL to determine which post is being replied to and set a replyID accordingly.
// This is done via the targetID variable.

function submitReply(req, res, next) {
	console.log(req.body)
	let targetID = parseInt(req.params.id) + 1;
	if (targetID < 2) {
		targetID = 2;
	}

	db.none('INSERT INTO tweed(username,tweed_content,tweed_timestamp,reply_id)' + 
		'values(${username}, ${tweed_content}, CURRENT_TIMESTAMP,' + `${targetID})`,
		req.body)
	.then(function() {
		res.status(200)
		.json({
          status: 'success',
          message: 'Reply Submitted'
        });
    })
    .catch(function(err) {
      return next(err);
    });
}

// Called when a DELETE request request is sent to '/reply/:id'.
// Only deletes specific posts, so as to avoid easy bulk post wiping.

function deletePost(req, res, next) {
	let targetID = parseInt(req.params.id) + 1;
	if (targetID < 2) {
		targetID = 2;
	}

	db.result('DELETE FROM tweed WHERE tweed_id = $1', targetID)
	.then(function(result) {
      res.status(200)
        .json({
          status: 'success',
          message: `Removed Tweed at ${result.rowCount}`
        });
    })
    .catch(function(err) {
      return next(err);
    });
}

// Called when a PUT request is sent to '/reply/:id'.
// Uses identical arguments to the POST functions up above.

function editPost(req, res, next) {
	let targetID = parseInt(req.params.id) + 1;
	if (targetID < 2) {
		targetID = 2;
	}

	db.none('UPDATE tweed SET username = $1, tweed_content = $2 WHERE tweed_id = $3',
		[req.body.username, req.body.tweed_content, targetID])
	.then(function() {
      res.status(200)
        .json({
          status: 'success',
          message: 'Tweed Updated'
        });
    })
    .catch(function(err) {
      return next(err);
    });
}

module.exports = {
	populateGames: populateGames,
	populateGenres: populateGenres,
	populateSummaries: populateSummaries,
	populateStorylines: populateStorylines,
	populateCovers: populateCovers,
	readAllPosts: readAllPosts,
	getPostReplies: getPostReplies,
	submitPost: submitPost,
	submitReply: submitReply,
	deletePost: deletePost,
	editPost: editPost
};