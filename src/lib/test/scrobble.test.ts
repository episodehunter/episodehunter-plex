import { createRxTestScheduler } from 'marble-test';
import { Observable } from 'rxjs/Observable';
import { satisfiedCredentials$, watchingEpisode, watching$ } from '../scrobble';

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

test.only('scrobble after start and stop event', () => {
  // Arrange
  debugger;
  const scheduler = createRxTestScheduler();
  const startEvent = {
    NotificationContainer: {
      type: 'playing',
      PlaySessionStateNotification: [{
        state: 'start'
      }]
    }
  };
  const stopEvent = {
    NotificationContainer: {
      type: 'playing',
      PlaySessionStateNotification: [{
        state: 'stopped',
        viewOffset: 2610149
      }]
    }
  };
  const credentials = {
    plexToken: 'plex-token',
    ehToken: 'eh-token',
    host: 'plex-host',
    port: 8080
  };
  const vikingsMetadata = {
    MediaContainer: {
      Metadata: [{
        guid: 'com.plexapp.agents.thetvdb://260449/4/18?lang=en',
        type: 'episode',
        title: 'Revenge',
        index: 18,
        parentIndex: 4,
        year: 2017,
        duration: 2610149
      }]
    }
  };
  const viking = {
    theTvDbId: '260449',
    season: '4',
    episode: '18',
    duration: 2610149,
    viewOffset: 2610149
  };

  const scrobble$ = () => show => scheduler.createColdObservable('a|', {a: show});
  const metadata$ = () => () => scheduler.createColdObservable('a|', {a: vikingsMetadata});

  const eventValues = { a: startEvent, b: stopEvent };
  const events$ = () => scheduler.createColdObservable('a--a-b|', eventValues);
  const expected = '------1|';
  const showValues = {1: viking};

  // Act
  const obs = watching$(credentials, events$ as any, metadata$, scrobble$);

  // Assert
  scheduler.expectObservable(obs).toBe(expected, showValues);
  scheduler.flush();
});
