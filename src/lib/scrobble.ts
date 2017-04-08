import { Observable } from 'rxjs/Observable';
import { webSocket } from 'rxjs/observable/dom/webSocket';
import { ajax } from 'rxjs/observable/dom/ajax';
const log = require('electron').remote.require('electron-log');
import { Credentials, PlexEvent, PlexMetadata, Show } from '../types';
import { retryOnServerError } from './util';
import { Unauthorized } from './errors/unauthorized';

log.transports.console.level = 'info';
log.transports.file.level = 'info';

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

const scrobbleToEpisodehunter$ = (credentials: Credentials) => {
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
    return ajax.post(url, body, header).retryWhen(retryOnServerError(Unauthorized, 1000));
  };
};

const hasWatchedShow = (show: Show) => show.viewOffset / show.duration > .7;

export const watching$ = (credentials: Credentials, event$ = plexEvents$, metadata$ = mediaMetadata$, scrobble$ = scrobbleToEpisodehunter$) => {
  return event$(credentials)
    .do(() => log.info('Has the user stopt playing?'))
    .filter(hasStoptPlayingEvent)
    .do(() => log.info('Yepp, lets wait for a while'))
    .debounceTime(1000)
    .switchMap((plexEvent: PlexEvent) => {
      log.info('Get meta data for the show');
      return metadata$(credentials)(getSessionKey(plexEvent))
        .filter(watchingEpisode)
        .map(mapMetadataToShow)
        .map(show => Object.assign(show, { viewOffset: viewOffset(plexEvent) }));
    })
    .do(() => log.info('Check if the user has watched the show'))
    .filter(hasWatchedShow)
    .do(() => log.info('Is it a new show?'))
    .distinctUntilChanged(sameShow)
    .do(() => log.info('Mark it as waiched!'))
    .concatMap(scrobble$(credentials));
};

export function satisfiedCredentials$() {
  return (credentials$: Observable<Credentials>) => {
    return credentials$
      .filter(satisfiedCredentials)
      .distinctUntilChanged(shallowObjectCompare);
  };
}
