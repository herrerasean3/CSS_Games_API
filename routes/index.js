var express = require('express');
var router = express.Router();

var db = require('../db/queries');

/* GET home page. */

//Game Routes
router.get('/game', db.getAllGames);
router.get('/game/:gameid', db.getSingleGame);
router.get('/search', db.searchGame);

router.post('/game', db.createGame);

router.delete('/game/:gameid', db.deleteGame);

router.put('/game/:gameid', db.editGame);

//Review Routes

router.get('/game/:gameid/reviews', db.readReviews);

router.post('/game/:gameid/reviews', db.submitReview);

router.delete('/review/:reviewid', db.deleteReview);

router.put('/review/:reviewid', db.editReview);

//Population Routes. To be commented out when API is launched.

// router.get('/pop', db.populateGames);
// router.get('/pop/genres', db.populateGenres);
// router.get('/pop/summ', db.populateSummaries);
// router.get('/pop/story', db.populateStorylines);
// router.get('/pop/cover', db.populateCovers);

module.exports = router;