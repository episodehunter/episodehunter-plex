import { Observable } from 'rxjs/Observable';
import { ajax } from 'rxjs/observable/dom/ajax';
import { ApplicationState } from '../types';
import { requestNewIdToken } from './renew-eh-token';
import { retryOnServerError } from './util';
import { Unauthorized } from './errors/unauthorized';

export function verifyPlex(host: string, port: number, token: string, _ajax = ajax, retry = retryOnServerError(Unauthorized, 1000)) {
  const url = `http://${host}:${port}/status/sessions`;
  const header = { Accept: 'application/json', 'X-Plex-Token': token };
  return _ajax.get(url, header)
    .map(response => response.status)
    .catch(response => {
      const status = response.status;
      if (status === 401) {
        throw new Unauthorized();
      }
      throw new Error();
    })
    .retryWhen(retry);
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
        setPlexCredentials('', null);
        setErrorMessage('Could not connect to your plex server, please try to update your credentials');
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
      setEpisodehunterToken(null);
      if (error instanceof Unauthorized) {
        setErrorMessage('Could not verify your episodehunter credentials, please try to update your username and password');
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
        setErrorMessage(null);
      }
    });
}
