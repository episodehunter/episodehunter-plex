import * as Config from 'electron-config';
import { ApplicationState, ViewType } from '../types';

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
            console.log('Loading old state :)');
            return state;
        }
    },
    set(state: ApplicationState) {
        console.log('Saving the next sate', state);
        return electronConfig.set(configKey, state);
    }
};

export { config };
