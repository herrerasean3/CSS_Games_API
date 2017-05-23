var express = require('express');
var router = express.Router();

var db = require('../db/queries');

/* GET home page. */
router.get('/', db.readAllPosts);
router.get('/reply/:id', db.getPostReplies);

router.post('/', db.submitPost);
router.post('/reply/:id', db.submitReply);

router.put('/:id', db.editPost);

router.delete('/:id', db.deletePost);

router.get('/pop', db.populateGames);
router.get('/pop/genres', db.populateGenres);
router.get('/pop/summ', db.populateSummaries);
router.get('/pop/story', db.populateStorylines);
router.get('/pop/cover', db.populateCovers);

module.exports = router;