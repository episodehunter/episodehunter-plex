import { createRxTestScheduler } from 'marble-test';
import { satisfiedCredentials$, watchingEpisode } from '../scrobble';

test('watchingEpisode should return true for episodes', () => {
  const metadata = {
    MediaContainer: {
      Metadata: [{
        type: 'episode'
      }]
    }
  };
  const result = watchingEpisode(metadata as any);

  expect(result).toBe(true);
});

test('watchingEpisode should return false for movies', () => {
  const metadata = {
    MediaContainer: {
      Metadata: [{
        type: 'movie'
      }]
    }
  };
  const result = watchingEpisode(metadata as any);

  expect(result).toBe(false);
});

test('satisfiedCredentials should not pass through the same object', () => {
  // Arrange
  const scheduler = createRxTestScheduler();
  const credentials = {
    plexToken: 'plex-token',
    ehToken: 'eh-token',
    host: 'plex-host',
    port: 8080
  };
  const values = { a: credentials, b: Object.assign({}, credentials) };
  const e1 = scheduler.createColdObservable('a--b|', values);
  const expected = 'a---|';

  // Act
  const obs = e1.let(satisfiedCredentials$());

  // Assert
  scheduler.expectObservable(obs).toBe(expected, values);
  scheduler.flush();
});

test('satisfiedCredentials should pass through a new object', () => {
  // Arrange
  const scheduler = createRxTestScheduler();
  const credentials = {
    plexToken: 'plex-token',
    ehToken: 'eh-token',
    host: 'plex-host',
    port: 8080
  };
  const values = { a: credentials, b: Object.assign({}, credentials, { port: 9000 }) };
  const e1 = scheduler.createColdObservable('a--a-b|', values);
  const expected = 'a----b|';

  // Act
  const obs = e1.let(satisfiedCredentials$());

  // Assert
  scheduler.expectObservable(obs).toBe(expected, values);
  scheduler.flush();
});
