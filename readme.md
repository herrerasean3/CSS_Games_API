# CSSGAMES API

Built by gamers for gamers, CSSGAMES API is so easy, a sleep deprived dork like yours truly can access it just fine!

The API is in a very much indev state, but currently supports the submission, accessing, editing, and deleting of games and reviews.

## Values that can be accessed are:

### 'games' Table:

These values can be found at ```/game``` on our API.
For a specific game, try ```/game/:gameid```

```
'game_id' - ID of the target game. Used for serving up and organizing data. Also referenced for the review system. SERIAL PRIMARY KEY

'game_title' - The title of the game. Used in our search function. VARCHAR.

'game_genre' - References the genre table to determine what genre a game has. INTEGER REFERENCES.

'game_desc_short' - Short summary of the game. VARCHAR.

'game_desc' - Long summary of the game. VARCHAR.
```

### 'genres' Table:

The genres table is inaccessible on its own.
However, one may find them returned via queries to ```/game```

```
'genre_id' - ID of the target genre. Referenced by 'game_genre' on the 'games' table. SERIAL PRIMARY KEY.

'genre' - Name of the genre. VARCHAR.
```

### 'reviews' Table:

A specific game's reviews may be found via a request to ```/game/:gameid``` or ```game/:gameid/reviews```.

```
'review_id' - Assigned ID for the target game. SERIAL PRIMARY KEY.

'username' - Name of user that submitted the post. Should auth0 be implemented, this would be referenced to another table as a username_id instead, but for now users simply write in a username when they submit a post. Character limit of 20. VARCHAR(20).

'review_short' - Intended to be the brief form of the review, but not actually capped. VARCHAR.

'review' - The review proper. Also VARCHAR.

'review_score' - A numeric score for the game. Range determined by whomever is using this API. I personally prefer ranges of 0 to 10 myself. INTEGER.

'review_timestamp' - Automatically generated timestamp for a review. There's no implemented way to edit this, so as to prevent abuse of recordkeeping mechanics.

'target_id' - References the 'game_id' column in 'games', noting that this review is for a specific game. This cannot be edited later, so make sure you're reviewing the right games!
```

## Submitting a new game or review.

A new game may be submitted by sending a POST request to ```/game``` on the API. Games use these values:
game_title, game_cover, game_genre, game_desc_short, and game_desc.
Make sure game_genre is an integer!

A new review may be submitted by sending a POST request to ```/game/:gameid/reviews```. Reviews use these values: 
username, review_short, review and review_score.
Make sure review_score is an integer as well!

## Editing or Deleting a game or review:

Editing a game may be done via submitting a PUT request to ```/game/:gameid```, and a review may be edited by sending a PUT request to ```/review/:reviewid'```

Automatically generated values may not be edited.

To delete a game, send a DELETE request to ```/game/:gameid```, and a game may be deleted by sending a DELETE request to ```/review/:reviewid'```