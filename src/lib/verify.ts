import { Observable } from 'rxjs/Observable';
import { ajax } from 'rxjs/observable/dom/ajax';
import { Credentials } from '../types';
import { requestNewIdToken } from './renew-eh-token';
import { retryOnServerError } from './util';
import { Unauthorized } from './errors/unauthorized';

export function verifyPlex$(host: string, port: number, token: string, _ajax = ajax, retry = retryOnServerError(Unauthorized, 1000)) {
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

const objectValues = obj => Object.keys(obj).map(key => obj[key]);

export const isCredentialsCollected = (credentials: Credentials) => objectValues(credentials).every(value => value);

export function checkCredentials$(
  setPlexCredentials: (username: string, token: string) => void,
  setEpisodehunterToken: (token: string) => void,
  setErrorMessage: (error: string) => void
): (credentials: Credentials) => Observable<Credentials | null> {
  const plex$ = (host, port, token) => verifyPlex$(host, port, token)
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

  const eh$ = oldtoken => requestNewIdToken(oldtoken)
    .map(token => true)
    .catch(error => {
      setEpisodehunterToken(null);
      if (error instanceof Unauthorized) {
        setErrorMessage('Could not verify your episodehunter credentials, please try to update your username and password');
      } else {
        setErrorMessage('Could not verify your episodehunter credentials, please try again later');
      }
      return Observable.of(false);
    });

  return (credentials: Credentials) => {
    if (!isCredentialsCollected(credentials)) {
      setErrorMessage('Please complete all steps above');
      return Observable.of(null);
    }
    return Observable
      .concat(
        plex$(credentials.host, credentials.port, credentials.plexToken),
        eh$(credentials.ehToken)
      )
      .every(valid => valid)
      .do(valid => {
        console.log('Is it valid?', valid);
        if (valid) {
          setErrorMessage(null);
        }
      })
      .map(valid => valid ? credentials : null);
  };

}
