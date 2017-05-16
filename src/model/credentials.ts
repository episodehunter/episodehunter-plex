import { observable, action } from 'mobx';
import { ApplicationState } from '../types/application-state';

export interface PlexCredentials {
  username: string;
  token: string;
}

export interface PlexServerCredentials {
  host: string;
  port: number;
  connection: boolean;
}

export interface EpisodehunterCredentials {
  token: string;
}


export class Credentials {
  @observable plex: PlexCredentials;
  @observable episodehunter: EpisodehunterCredentials;
  @observable plexServer: PlexServerCredentials;

  constructor(appState: ApplicationState) {
    this.plex = appState.plex;
    this.episodehunter = appState.episodehunter;
    this.plexServer = appState.plexServer;
  }

  @action
  setEpisodehunterToken = (token: string) => this.episodehunter.token = token;

  @action
  setPlexCredentials = (username, token) => {
    this.plex.username = username;
    this.plex.token = token;
  }

  @action
  setPlexConnectionStatus = connection => this.plexServer.connection = connection;

  @action
  setPlexServerConfig = (host, port) => {
    this.plexServer.host = host;
    this.plexServer.port = port;
  }

}
