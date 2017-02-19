import { Observable } from 'rxjs/Observable';
import { ajax } from 'rxjs/observable/dom/ajax';
import { ApplicationState } from '../types';
import { requestNewIdToken } from './renew-eh-token';
import { Unauthorized } from './errors/unauthorized';

export function verifyPlex(host: string, port: number, token: string) {
    const url = `http://${host}:${port}/status/sessions`;
    const header = { Accept: 'application/json', 'X-Plex-Token': token };
    return ajax.get(url, header)
        .map(response => response.status)
        .map(status => {
            if (status === 401) {
                throw new Unauthorized();
            } else if (status < 200 || status > 299) {
                throw new Error();
            }
            return status;
        })
        .retry(2);
}

const isCredentialsCollected = (state: Partial<ApplicationState>) => [
    state.plex.token,
    state.episodehunter.token,
    state.plexServer.connection
].some(key => !!key);

export function checkCredentials$(
    state: Partial<ApplicationState>,
    setPlexCredentials: (username: string, token: string) => void,
    setEpisodehunterToken: (token: string) => void,
    setErrorMessage: (error: string) => void
) {
    if (!isCredentialsCollected(state)) {
      setErrorMessage('Please complete all steps above');
      return Observable.of(false);
    }

    const plex$ = verifyPlex(state.plexServer.host, state.plexServer.port, state.plex.token)
      .map(() => true)
      .catch(error => {
        if (error instanceof Unauthorized) {
          setErrorMessage('Could not connect to your plex server, please try to update your credentials');
          setPlexCredentials('', null);
        } else {
          setErrorMessage('Could not connect to your plex server, please check your connection options');
        }

        return Observable.of(false);
      });

    const eh$ = requestNewIdToken(state.episodehunter.token)
      .map(token => {
        setEpisodehunterToken(token);
        return true;
      })
      .catch(error => {
        if (error instanceof Unauthorized) {
          setErrorMessage('Could not verify your episodehunter credentials, please try to update your username and password');
          setEpisodehunterToken(null);
        } else {
          setErrorMessage('Could not verify your episodehunter credentials, please try again later');
        }
        return Observable.of(false);
      });

    return Observable
      .concat(plex$, eh$)
      .every(val => val)
      .do(val => {
        if (val) {
          console.log('Everyting whent well', val);
          setErrorMessage(null);
        }
      });
  }
