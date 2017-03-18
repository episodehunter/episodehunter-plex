import { ViewType } from './enums';

export interface ApplicationState {
  plex: {
    username: string;
    token: string;
  };
  episodehunter: {
    token: string;
  };
  plexServer: {
    host: string;
    port: number;
    connection: boolean;
  };
  currentView: ViewType;
  error: string;
};
