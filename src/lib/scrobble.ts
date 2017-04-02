import { Observable } from 'rxjs/Observable';
import { webSocket } from 'rxjs/observable/dom/webSocket';
import { ajax } from 'rxjs/observable/dom/ajax';
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

const scrobbleToEpisodehunter$ = (credentials: Credentials) => {
  // const { ehToken } = credentials;
  // const url = `https://episodehunter.tv/shomething`;
  // const header = { Accept: 'application/json', 'yolo': ehToken };
  return (episode: Show) => {
    return Observable.of(episode).do(() => console.log('Have now scrobbled!', episode));
    // return ajax.post(url, episode, header);
  };
};

const hasWatchedShow = (show: Show) => show.viewOffset / show.duration > .7;

export const watching$ = (credentials: Credentials, event$ = plexEvents$, metadata$ = mediaMetadata$, scrobble$ = scrobbleToEpisodehunter$) => {
  return event$(credentials)
    .filter(hasStoptPlayingEvent)
    .debounceTime(1000)
    .switchMap((plexEvent: PlexEvent) => {
      return metadata$(credentials)(getSessionKey(plexEvent))
        .filter(watchingEpisode)
        .map(mapMetadataToShow)
        .map(show => Object.assign(show, { viewOffset: viewOffset(plexEvent) }));
    })
    .filter(hasWatchedShow)
    .distinctUntilChanged(sameShow)
    .concatMap(scrobble$(credentials));
};

export function satisfiedCredentials$() {
  return (credentials$: Observable<Credentials>) => {
    return credentials$
      .filter(satisfiedCredentials)
      .distinctUntilChanged(shallowObjectCompare);
  };
}
