import { ViewType } from './enums';

export interface ApplicationState {
  loading: boolean;
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
