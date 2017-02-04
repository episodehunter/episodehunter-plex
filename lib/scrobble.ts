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
        viewOffset: number;
        state: PlayState;
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
  duration: string;
  viewOffset: number;
};

function satisfiedCredentials(credentials: PlexServerCredentials) {
  return Object.values(credentials).every(v => !!v);
}

function credentialsCompare(a: PlexServerCredentials, b: PlexServerCredentials) {
  return Object.keys(a).every(key => a[key] === b[key]);
}

function createPlexServerUrl(credentials: PlexServerCredentials) {
  const { plexToken, host, port } = credentials;
  return `ws://${host}:${port}/:/websockets/notifications?X-Plex-Token=${plexToken}`;
}

function createPlexServerSessionsStatusUrl(credentials: PlexServerCredentials) {
  const { plexToken, host, port } = credentials;
  return {
    url: `http://${host}:${port}/status/sessions`,
    header: { Accept: 'application/json', 'X-Plex-Token': plexToken }
  };
}

function mapSessionEventToPlayingState(event: PlexEvent) {
  return event.NotificationContainer.PlaySessionStateNotification[0].state;
}

function parsePlexGuid(plexGuid: string) {
  return /\/\/(\d+)\/(\d+)\/(\d+)/g.exec(plexGuid);
}

function mapSessionToShow(session: PlexSessionState) {
  const [, theTvDbId, season, episode ] = parsePlexGuid(session.MediaContainer.Video[0].guid);
  return {
    theTvDbId,
    season,
    episode,
    duration: Number(session.MediaContainer.Video[0].duration),
    viewOffset: Number(session.MediaContainer.Video[0].viewOffset),
    playState: 'playing' as PlayState
  } as Show;
}

function isPlayingEvent(plexEvent: PlexEvent) {
  return plexEvent.NotificationContainer.type === 'playing';
}

function accumulatePlayTime(acc: Playing, event) {
  return acc;
}

const credentials$ = new Subject<PlexServerCredentials>();

const credentialsChanges$ = credentials$
  .filter(satisfiedCredentials)
  .distinctUntilChanged(credentialsCompare);

const sessionsStatus$ = (credentials: PlexServerCredentials) => {
  const { url, header } = createPlexServerSessionsStatusUrl(credentials);
  return () => ajax.get(url, header).map(response => response.response).map(mapSessionToShow);
}

const watching$ = (credentials: PlexServerCredentials) => {
  return webSocket(createPlexServerUrl(credentials))
    .filter(isPlayingEvent)
    .map(mapSessionEventToPlayingState)
    .distinctUntilChanged()
    .switchMap(playState => {
      if (playState === 'playing') {
        return sessionsStatus$(credentials)();
      }
      return Observable.of({ playState } as Show);
    })
    .scan(accumulatePlayTime);
}

credentialsChanges$
  .switchMap(credentials => {
    return webSocket(createPlexServerUrl(credentials));
  })
  .filter();
