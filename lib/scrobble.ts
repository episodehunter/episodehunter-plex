import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { webSocket } from 'rxjs/observable/dom/webSocket';
import { ajax } from 'rxjs/observable/dom/ajax';

type PlayState = 'paused' | 'stopped' | 'playing' | 'donotknow';

interface PlexServerCredentials {
  plexToken: string;
  ehToken: string;
  host: string;
  port: number;
};

interface PlexEvent {
  NotificationContainer: {
      type: 'playing';
      PlaySessionStateNotification: {
        key: string;
        viewOffset: number;
        state: PlayState;
      }[];
  };
}

interface PlexMetadata {
  MediaContainer: {
    Metadata: {
      guid: string; // com.plexapp.agents.thetvdb://260449/4/18?lang=en
      type: string; // episode
      title: string; // Revenge
      index: number; // 18
      parentIndex: number; // 4
      viewOffset: number; // 104519,
      year: number; // 2017
      duration: number; // 2610149;
    }[];
  };
}

interface PlexSessionState {
  MediaContainer: {
    Video: {
      duration: string, // 2610149
      grandparentTitle: string; // Vikings
      guid: string; // com.plexapp.agents.thetvdb://260449/4/18?lang=en
      title: string; // Revenge
      type: 'episode';
      viewOffset: string; // 60969
      User: {
        id: string; // 1
        title: string; // tjoskar
      };
    }[];
  };
}

interface Show {
  theTvDbId?: string;
  season?: string;
  episode?: string;
  duration?: number;
  viewOffset?: number;
  playState: PlayState;
}

interface Playing {
  payling: boolean;
  playtime: number;
}

interface PlayingState {
  viewOffset: number;
  playState: PlayState;
  key: string;
};

export const credentials$ = new Subject<PlexServerCredentials>();

function satisfiedCredentials(credentials: PlexServerCredentials) {
  return Object.keys(credentials).every(key => credentials[key]);
}

function shallowObjectCompare(a, b) {
  return Object.keys(a).every(key => a[key] === b[key]);
}

function createPlexServerUrl(credentials: PlexServerCredentials) {
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
    // viewOffset: metadata.MediaContainer.Metadata[0].viewOffset
  } as Show;
};

const mediaMetadata$ = (credentials: PlexServerCredentials) => {
  const { plexToken, host, port } = credentials;
  const url = `http://${host}:${port}`;
  const header = { Accept: 'application/json', 'X-Plex-Token': plexToken };
  return (sessionKey: string) => {
    return ajax.get(url + sessionKey, header).map(response => response.response).map(mapMetadataToShow);
  };
};

const scrobbleToEpisodehunter$ = (credentials: PlexServerCredentials) => {
  // const { ehToken } = credentials;
  // const url = `https://episodehunter.tv/shomething`;
  // const header = { Accept: 'application/json', 'yolo': ehToken };
  return (episode: Show) => {
    return Observable.of(episode).do(() => console.log('Have now scrobbled!', episode));
    // return ajax.post(url, episode, header);
  };
};

const credentialsChanges$ = credentials$
  .do(() => console.log('filter satisfiedCredentials'))
  .filter(satisfiedCredentials)
  .do(() => console.log('distinctUntilChanged shallowObjectCompare'))
  .distinctUntilChanged(shallowObjectCompare);

const watching$ = (credentials: PlexServerCredentials) => {
  return webSocket(createPlexServerUrl(credentials))
    .do(() => console.log('filter hasStoptPlayingEvent'))
    .filter(hasStoptPlayingEvent)
    .do(() => console.log('map getSessionKey'))
    // .map(getSessionKey)
    .do(() => console.log('concatMap mediaMetadata$'))
    .concatMap((plexEvent: PlexEvent) => {
      return mediaMetadata$(credentials)(getSessionKey(plexEvent)).map(show => Object.assign(show, { viewOffset: viewOffset(plexEvent) }));
    })
    .do(show => console.log('filter watched', show))
    .filter(show => show.viewOffset / show.duration > .7)
    .do(() => console.log('concatMap scrobbleToEpisodehunter$'))
    .concatMap(show => {
      return scrobbleToEpisodehunter$(credentials)(show);
    });
}

credentialsChanges$
  .do(() => console.log('switchMap watching$'))
  .switchMap(credentials => {
    return watching$(credentials);
  })
  .subscribe(
    next => console.log(next),
    error => console.log(error),
    () => console.log('Done')
  );
