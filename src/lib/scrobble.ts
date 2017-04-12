import { Observable } from 'rxjs/Observable';
import { webSocket } from 'rxjs/observable/dom/webSocket';
import { ajax } from 'rxjs/observable/dom/ajax';
import { post } from './http';
import { Credentials, PlexEvent, PlexMetadata, Show } from '../types';

export function watchingEpisode(metadata: PlexMetadata) {
  return metadata.MediaContainer.Metadata[0].type === 'episode';
}

function satisfiedCredentials(credentials: Credentials) {
  return Object.keys(credentials).every(key => credentials[key]);
}

function shallowObjectCompare(a, b) {
  return Object.keys(a).every(key => a[key] === b[key]);
}

function sameShow(a: Show, b: Show) {
  const keys: (keyof Show)[] = ['theTvDbId', 'season', 'episode'];
  return keys.every(key => a[key] === b[key]);
}

function createPlexServerUrl(credentials: Credentials) {
  const { plexToken, host, port } = credentials;
  return `ws://${host}:${port}/:/websockets/notifications?X-Plex-Token=${plexToken}`;
}

function getSessionKey(event: PlexEvent) {
  return event.NotificationContainer.PlaySessionStateNotification[0].key;
}

function viewOffset(event: PlexEvent) {
  return event.NotificationContainer.PlaySessionStateNotification[0].viewOffset;
}

function parsePlexGuid(plexGuid: string) {
  return /\/\/(\d+)\/(\d+)\/(\d+)/g.exec(plexGuid);
}

function hasStoptPlayingEvent(plexEvent: PlexEvent) {
  return plexEvent.NotificationContainer.type === 'playing' && plexEvent.NotificationContainer.PlaySessionStateNotification[0].state === 'stopped';
}

const mapMetadataToShow = (metadata: PlexMetadata) => {
  const [, theTvDbId, season, episode ] = parsePlexGuid(metadata.MediaContainer.Metadata[0].guid);
  return {
    theTvDbId,
    season,
    episode,
    duration: metadata.MediaContainer.Metadata[0].duration,
  } as Show;
};

const mediaMetadata$ = (credentials: Credentials) => {
  const { plexToken, host, port } = credentials;
  const url = `http://${host}:${port}`;
  const header = { Accept: 'application/json', 'X-Plex-Token': plexToken };
  return (sessionKey: string) => {
    return ajax.get(url + sessionKey, header).map(response => response.response);
  };
};

const plexEvents$ = (credentials: Credentials) => {
  return webSocket(createPlexServerUrl(credentials))
    .retryWhen(error$ => error$.delay(5000));
}

export const scrobbleToEpisodehunter$ = (credentials: Credentials, _post = post) => {
  const { ehToken } = credentials;
  const url = `https://episodehunter-scrobble-ilrosnyqaq.now.sh/episode`;
  const header = {
    'Content-Type': 'application/json',
    'Authorization': 'bearer ' + ehToken
  };
  return (episode: Show) => {
    const body = {
      theTvDbId: Number(episode.theTvDbId),
      season: Number(episode.season),
      episode: Number(episode.episode)
    };
    return _post(url, body, header);
  };
};

const hasWatchedShow = (show: Show) => show.viewOffset / show.duration > .7;

export const watching$ = (credentials: Credentials, log, event$ = plexEvents$, metadata$ = mediaMetadata$, scrobble$ = scrobbleToEpisodehunter$, debounceTime = 1000, scheduler?) => {
  return event$(credentials)
    .do(() => log.info('Okej, the user is doing somthing'))
    .filter(hasStoptPlayingEvent)
    .debounceTime(debounceTime, scheduler)
    .switchMap((plexEvent: PlexEvent) => {
      log.info('Alright, the user has stopt plaing, lets get meta data for the show');
      return metadata$(credentials)(getSessionKey(plexEvent))
        .filter(watchingEpisode)
        .map(mapMetadataToShow)
        .map(show => Object.assign(show, { viewOffset: viewOffset(plexEvent) }));
    })
    .do(() => log.info('Check if the user has watched the show'))
    .filter(hasWatchedShow)
    .do(() => log.info('Is it a new show?'))
    .distinctUntilChanged(sameShow)
    .do(s => log.info('Mark it as waiched!' + JSON.stringify(s)))
    .concatMap(episode => {
      return scrobble$(credentials)(episode)
        .catch(error => {
          log.error(error);
          return Observable.of(null);
        });
    });
};

export function satisfiedCredentials$() {
  return (credentials$: Observable<Credentials>) => {
    return credentials$
      .filter(satisfiedCredentials)
      .distinctUntilChanged(shallowObjectCompare);
  };
}
