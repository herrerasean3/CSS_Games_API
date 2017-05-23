\c cssgames

INSERT INTO genres (genre)
VALUES
('video'),
('games');

INSERT INTO games (game_title, game_cover, game_genre, publisher, game_desc_short, game_desc)
VALUES
('The Game', 'notarealweb.site/game.png', 1, 'HI', 'It''s a game', 'It''s a game');

INSERT INTO reviews (username, review_short, review, review_score, review_timestamp, game_id)
VALUES
('test', 'test', 'test', 5, CURRENT_TIMESTAMP, 1);