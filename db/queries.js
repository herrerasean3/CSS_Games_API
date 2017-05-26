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



/*

______ ___________ _   _ _       ___ _____ _____ 
| ___ \  _  | ___ \ | | | |     / _ \_   _|  ___|
| |_/ / | | | |_/ / | | | |    / /_\ \| | | |__  
|  __/| | | |  __/| | | | |    |  _  || | |  __| 
| |   \ \_/ / |   | |_| | |____| | | || | | |___ 
\_|    \___/\_|    \___/\_____/\_| |_/\_/ \____/ 

*/


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

	unirest.get(`https://igdbcom-internet-game-database-v1.p.mashape.com/genres/?fields=*&limit=50&offset=$0`)
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

/*

 _____   ___  ___  ___ _____ _____ 
|  __ \ / _ \ |  \/  ||  ___/  ___|
| |  \// /_\ \| .  . || |__ \ `--. 
| | __ |  _  || |\/| ||  __| `--. \
| |_\ \| | | || |  | || |___/\__/ /
 \____/\_| |_/\_|  |_/\____/\____/ 

*/

function getAllGames(req, res, next) {
	db.task(t => {
		return t.batch([
			t.any('SELECT * FROM games ORDER BY game_id DESC'),
			t.any('SELECT * FROM games JOIN genres ON games.game_genre = genres.genre_id ORDER BY game_id DESC'),
			t.any('SELECT * FROM genres')
			])
		})
	.then(data => {
			res.status(200)
			.json({
				status: 'success',
				game: data[0],
				genregames: data[1],
				genres: data[2]
			});
		})
		.catch(function(err) {
			return next(err);
		});
}

// function getGamesByGenre(req, res, next) {
// 	db.
// 	.then(function(data) {
// 			res.status(200)
// 			.json({
// 				status: 'success',
// 				game: data
// 			});
// 		})
// 		.catch(function(err) {
// 			return next(err);
// 		});
// }

function getSingleGame(req, res, next) {
	db.task(t => {
		return t.batch([
			t.one('SELECT * FROM games WHERE game_id = $1', req.params.gameid),
			t.any('SELECT * FROM games JOIN genres ON games.game_genre = genres.genre_id WHERE game_id = $1', req.params.gameid),
			t.any('SELECT * FROM genres'),
			t.any('SELECT * FROM reviews WHERE target_id = $1 ORDER BY review_timestamp DESC, review_id DESC', req.params.gameid)
			])
	})
	.then(data => {
			res.status(200)
			.json({
				status: 'success',
				game: data[0],
				genregame: data[1],
				genres: data[2],
				reviews: data[3]
			});
		})
		.catch(function(err) {
			return next(err);
		});
}

function createGame(req, res, next) {
	db.none('INSERT INTO games(game_title, game_cover, game_genre, game_desc_short, game_desc)' + 
		'values(${game_title}, ${game_cover}, ${game_genre}, ${game_desc_short}, ${game_desc})',
		req.body)
	.then(function() {
		res.status(200)
		.json({
          status: 'success',
          message: 'Game Submitted'
        });
    })
    .catch(function(err) {
      return next(err);
    });
}

function editGame(req, res, next) {
	db.none('UPDATE games SET game_title = ${game_title}, game_cover = ${game_cover}, game_genre = ${game_genre}, game_desc_short = ${game_desc_short}, game_desc = ${game_desc} WHERE game_id =' + `${req.params.gameid}`, 
		req.body)
	.then(function() {
      res.status(200)
        .json({
          status: 'success',
          message: 'Game Updated'
        });
    })
    .catch(function(err) {
      return next(err);
    });
}

function deleteGame(req, res, next) {
db.result('DELETE FROM games WHERE game_id = $1', req.params.gameid)
	.then(function(result) {
      res.status(200)
        .json({
          status: 'success',
          message: `Removed Game at ${result.rowCount}`
        });
    })
    .catch(function(err) {
      return next(err);
    });
}

function searchGame(req, res, next) {
	db.any(`SELECT * FROM games WHERE "game_title" ILIKE '%${req.query.title}%' ORDER BY game_id DESC`)
	    .then(function(data) {
	    	console.log('DATA:', data);
	    	res.status(200)
	    	.json({
	    		games: data
	    	});
	    })
	    .catch(function(err) {
	    	return next(err);
	    });
}


/*

______ _____ _   _ _____ _____ _    _ _____ 
| ___ \  ___| | | |_   _|  ___| |  | /  ___|
| |_/ / |__ | | | | | | | |__ | |  | \ `--. 
|    /|  __|| | | | | | |  __|| |/\| |`--. \
| |\ \| |___\ \_/ /_| |_| |___\  /\  /\__/ /
\_| \_\____/ \___/ \___/\____/ \/  \/\____/ 


*/



// Called whenever the index recieves a GET request.
// Grabs the entire tweed table, save for the placeholder post.
// Sorts the posts by timestamp, then ID.

function readReviews(req, res, next) {
	db.any('SELECT * FROM reviews WHERE target_id = $1 ORDER BY review_timestamp DESC, review_id DESC', req.params.gameid)
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

// Called when a POST request is sent to the index.
// Takes "username" and "tweed_content" as values for the request.
// Timestamp is generated automatically, and for new posts, reply ID points to the placeholder post.

function submitReview(req, res, next) {

	db.none('INSERT INTO reviews(username, review_short, review, review_score, target_id)' + 
		'values(${username}, ${review_short}, ${review}, ${review_score},' + `${req.params.gameid})`,
		req.body)
	.then(function() {
		res.status(200)
		.json({
          status: 'success',
          message: 'Review Submitted'
        });
    })
    .catch(function(err) {
      return next(err);
    });
}

// Called when a DELETE request request is sent to '/reply/:id'.
// Only deletes specific posts, so as to avoid easy bulk post wiping.

function deleteReview(req, res, next) {
db.result('DELETE FROM reviews WHERE review_id = $1', req.params.reviewid)
	.then(function(result) {
      res.status(200)
        .json({
          status: 'success',
          message: `Removed Review at ${result.rowCount}`
        });
    })
    .catch(function(err) {
      return next(err);
    });
}

// Called when a PUT request is sent to '/reply/:id'.
// Uses identical arguments to the POST functions up above.

function editReview(req, res, next) {
	db.none('UPDATE reviews SET username = ${username}, review_short = ${review_short}, review = ${review}, review_score = ${review_score} WHERE review_id =' + `${req.params.reviewid}`,
		req.body)
	.then(function() {
      res.status(200)
        .json({
          status: 'success',
          message: 'Review Updated'
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
	getAllGames: getAllGames,
	getSingleGame: getSingleGame,
	createGame: createGame,
	editGame: editGame,
	deleteGame: deleteGame,
	searchGame: searchGame,
	readReviews: readReviews,
	submitReview: submitReview,
	deleteReview: deleteReview,
	editReview: editReview
};