DROP DATABASE IF EXISTS cssgames;
CREATE DATABASE cssgames;

\c cssgames;

DROP TABLE IF EXISTS genres;

CREATE TABLE genres (
	genre_id SERIAL PRIMARY KEY NOT NULL,
	genre VARCHAR NOT NULL
);

DROP TABLE IF EXISTS games;

CREATE TABLE games (
    game_id SERIAL PRIMARY KEY NOT NULL,
    game_title VARCHAR,
    game_cover VARCHAR,
    game_genre INTEGER REFERENCES genres(genre_id),
    game_desc_short VARCHAR,
    game_desc VARCHAR,
    average_score FLOAT(4),
    expansion_id INTEGER REFERENCES games(game_id)
);

DROP TABLE IF EXISTS reviews;

CREATE TABLE reviews (
	review_id SERIAL PRIMARY KEY NOT NULL,
	username VARCHAR(20) NOT NULL,
	review_short VARCHAR(256),
	review VARCHAR NOT NULL,
	review_score INTEGER NOT NULL,
	review_timestamp TIMESTAMP NOT NULL,
	game_id INTEGER REFERENCES games(game_id) NOT NULL
);