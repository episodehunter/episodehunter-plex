import * as Config from 'electron-config';
import { ApplicationState, ViewType } from '../types';

const electronConfig = new Config();
const configKey = 'state';

function defaultModel(): ApplicationState {
  return {
    loading: false,
    plex: {
      username: '',
      token: ''
    },
    episodehunter: {
      token: ''
    },
    plexServer: {
      host: 'localhost',
      port: 32400,
      connection: false
    },
    currentView: ViewType.start,
    error: ''
  };
}

const config = {
  get() {
    const state = electronConfig.get(configKey);
    if (!state) {
      const newState = defaultModel();
      electronConfig.set(configKey, newState);
      return newState;
    } else {
      return state;
    }
  },
  set(state: ApplicationState) {
    return electronConfig.set(configKey, state);
  }
};

export { config };
