import * as Config from 'electron-config';
import { ApplicationState } from '../types';

const electronConfig = new Config();
const configKey = 'state';

function defaultModel(): ApplicationState {
  return {
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
    }
  };
}

const config = {
  get(): ApplicationState {
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
