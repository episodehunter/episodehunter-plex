import { createRxTestScheduler } from 'marble-test';
import { spy } from 'simple-spy';
import { satisfiedCredentials$, watchingEpisode, watching$, scrobbleToEpisodehunter$ } from '../scrobble';
import { Unauthorized } from '../errors/unauthorized';
import { post } from '../http';
import { retryOnServerError } from '../util';

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

test('scrobble after start and stop event', () => {
  // Arrange
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
  const logger = { info: () => {} };

  // Act
  const obs = watching$(credentials, logger, events$ as any, metadata$, scrobble$);

  // Assert
  scheduler.expectObservable(obs).toBe(expected, showValues);
  scheduler.flush();
});

test('should continue after scrobble failure', () => {
  // Arrange
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
  const vikingsMetadata2 = {
    MediaContainer: {
      Metadata: [{
        guid: 'com.plexapp.agents.thetvdb://260449/4/19?lang=en',
        type: 'episode',
        title: 'Revenge2',
        index: 19,
        parentIndex: 4,
        year: 2017,
        duration: 2610149
      }]
    }
  };
  const viking = {
    theTvDbId: '260449',
    season: '4',
    episode: '19',
    duration: 2610149,
    viewOffset: 2610149
  };
  const logger = { info: () => {} };

  const eventValues = { a: startEvent, b: stopEvent };
  const credentialsChange$ = scheduler.createHotObservable('-a-', {a: credentials});
  const events$ = scheduler.createHotObservable(           '-a--a-b--b-', eventValues);
  const metadata$ = scheduler.createHotObservable(         '-------a----b|', { a: vikingsMetadata, b: vikingsMetadata2 });
  const scrobbleError$ = scheduler.createColdObservable(   '--#');
  const scrobbleSuccess$ = scheduler.createColdObservable( '--a|');
  let scrobbleTries = 0;

  const events = cred => events$;
  const metadata = () => () => metadata$;
  const scrobble = () => show => {
    if (scrobbleTries === 0) {
      scrobbleTries = 1;
      return scrobbleError$;
     } else {
      return scrobbleSuccess$.map(() => show);
     }
  };

  const watchingMock$ = watching$(credentials as any, logger, events, metadata, scrobble, 0, scheduler);

  const expected = '---------1----2';
  const showValues = {1: null, 2: viking};

  // Act
  const obs = credentialsChange$.switchMap(cred => {
    return watchingMock$;
  });

  // Assert
  scheduler.expectSubscriptions(events$.subscriptions).toBe(['-^-']);
  scheduler.expectObservable(obs).toBe(expected, showValues);
  scheduler.flush();
});

test('scrobbleToEpisodehunter$ should emit values when it goes well', () => {
  const scheduler = createRxTestScheduler();
  const ehToken = 'hej';
  const credentials = { ehToken };
  const episode = {
    playState: 'stopped'
  };
  const posting$ = scheduler.createColdObservable('---x|', {x: 5});
  const postMock = spy(() => posting$);

  // Act
  const obs = scrobbleToEpisodehunter$(credentials as any, postMock as any)(episode as any);
  scheduler.expectObservable(obs).toBe('---a|', {a: 5});
  scheduler.flush();
});

test('scrobbleToEpisodehunter$ should not retry if emitting an Unauthorized error', () => {
  const scheduler = createRxTestScheduler();
  const ehToken = 'hej';
  const credentials = { ehToken };
  const error = { status: 401 };
  const episode = {
    playState: 'stopped'
  };
  const posting$ = scheduler.createColdObservable('---#', undefined, error);
  const postMock = spy(() => post('', {}, {}, undefined, () => posting$));

  // Act
  const obs = scrobbleToEpisodehunter$(credentials as any, postMock as any)(episode as any);
  scheduler.expectObservable(obs).toBe('---#', undefined, new Unauthorized());
  scheduler.flush();
});

test('scrobbleToEpisodehunter$ should retry if emitting an Error', () => {
  const scheduler = createRxTestScheduler();
  const ehToken = 'hej';
  const credentials = { ehToken };
  const error = { status: 500 };
  const episode = {
    playState: 'stopped'
  };
  const posting$ = scheduler.createColdObservable('---#', undefined, error);
  const postMock = spy(() => post('', {}, {}, retryOnServerError(Unauthorized, 10, scheduler), () => posting$));

  // Act
  const obs = scrobbleToEpisodehunter$(credentials as any, postMock as any)(episode as any);
  scheduler.expectObservable(obs).toBe('-----------#', undefined, new Error());
  scheduler.flush();
});

test('scrobbleToEpisodehunter$ should retry after one failure and unsubscribe after success', () => {
  const scheduler = createRxTestScheduler();
  const ehToken = 'hej';
  const credentials = { ehToken };
  const episode = {
    playState: 'stopped'
  };
  const source = scheduler.createHotObservable('---1--2|');
  const posting$ = source.map(x => {
    if (x === '1') {
      throw { status: 500 };
    }
    return x;
  });
  const postMock = spy(() => post('', {}, {}, retryOnServerError(Unauthorized, 0, scheduler), () => posting$));

  // Act
  const obs = scrobbleToEpisodehunter$(credentials as any, postMock as any)(episode as any);
  scheduler.expectObservable(obs).toBe('------2|');
  scheduler.expectSubscriptions(source.subscriptions).toBe(['^--!', '---^---!']);
  scheduler.flush();
});
