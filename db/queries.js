let pgp = require('pg-promise')();
let connString = process.env.DATABASE_URL;
let db = pgp(connString);
var unirest = require('unirest');

/*

______ ___________ _   _ _       ___ _____ _____ 
| ___ \  _  | ___ \ | | | |     / _ \_   _|  ___|
| |_/ / | | | |_/ / | | | |    / /_\ \| | | |__  
|  __/| | | |  __/| | | | |    |  _  || | |  __| 
| |   \ \_/ / |   | |_| | |____| | | || | | |___ 
\_|    \___/\_|    \___/\_____/\_| |_/\_/ \____/ 

*/
// All populate functions just use the first 50 entries in their respective IGDB tables.
// In the future, I'd like to be able to tweak the offset to account for the current API size. 
// But for now, the goal is just 50 games worth of stock data.

// Pulls down the 50 most recent games from IGDB.
// Used for populating the table with stock data.
// Due to how IGDB is set up, this populates the first 50 game titles.
// IGDB doesn't return Null for content that a game lacks, leaving an entire column empty.
// Hence, the populate functions are an elaborate workaround for this design flaw.
// Call this before all other populate functions or you'll be an unhappy camper.

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

// Pulls down the genre table from IGDB. The query is for 50 genres, and their own database references more than 20 genres.
// But only 20 genres are returned. I certainly don't know what's going on.

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

// Populates the Summaries for our previously pulled games.
// By exploiting how pg-promise handles errors, we can skip over games that lack summaries and still accurately pull down summaries.
// Summaries are stored as "game_desc_short".

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

// Functionally identical to populateSummaries, but for Storylines.
// Storylines are stored as "game_desc"

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

// Pulls down cover URLs from IGDB.
// That said, their URLs are broken and lacking a domain.
// In effect, this function is kind of pointless.

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

// When a GET request is made to /game, this is called.
// Pulls down all games, sorted by ID, descending.
// Also pulls down all games with genres.
// And the genre table.

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

// Called when a GET request is made to /game/:gameid
// More or less the same as the previous function, but with minor differences to the query task.
// The games and games with genres query specify a single ID, which is equal to :gameid.
// And all reviews for a game are pulled down, in which the target_id is equal to :gameid.

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

// Called when a POST request is sent to /game
// Takes the values of game_title, game_cover, game_genre, game_desc_short, and game_desc.
// Everything, save for game_genre is VARCHAR, so write in whatever. Go nuts.
// game_genre is an integer that references the Genre Table.
// Given how awful implementation of Genre from IGDB was, I'm considering just making that VARCHAR as well.

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

// Called when a PUT request is sent to /game/:gameid
// Takes the exact same values as createGame.

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

// Called when a DELETE request is sent to /game/:gameid

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

// Called when a GET request is made to /search?title=, where ?title= has a value. My test value is 'THE'.
// Searches the games table for rows where game_title contains that particular string, with wildcards for the rest of the title.
// The search is made using ILIKE, so it's case insensitive.
// As such, searches for 'THE' will also return titles containing 'The' and 'the'.

function searchGame(req, res, next) {
	db.task(t => {
		return t.batch([
			t.any(`SELECT * FROM games WHERE "game_title" ILIKE '%${req.query.title}%' ORDER BY game_id DESC`),
			t.any(`SELECT * FROM games JOIN genres ON games.game_genre = genres.genre_id WHERE "game_title" ILIKE '%${req.query.title}%' ORDER BY game_id DESC`),
			t.any('SELECT * FROM genres')
			])
	})
	    .then(function(data) {
	    	console.log('DATA:', data);
	    	res.status(200)
	    	.json({
	    		games: data[0],
	    		genregames: data[1],
	    		genres: data[2]
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



// Called whenever /game/:gameid/reviews recieves a GET request.
// Grabs all posts related to the target game.
// Use this for a page containing only reviews. Otherwise, getSingleGame is objectively better.
// Sorts the reviews by timestamp, then ID.

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

// Called when a POST request is sent to /game/:gameid/reviews.
// Takes username, review_short, review and review_score as manually set values for the request.
// review_score is an integer. The actual limits on how high or low a score the review may have has been left in the hands of the front-end team.
// A review has its timestamp automatically generated via DEFAULT.

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

// Called when a DELETE request request is sent to '/review/:reviewid'.
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

// Called when a PUT request is sent to '/review/:reviewid'.
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
