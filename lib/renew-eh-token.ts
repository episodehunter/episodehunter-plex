import { Observable } from 'rxjs/Observable';
import { ajax } from 'rxjs/observable/dom/ajax';
import { retryOnServerError } from './util';
import { Unauthorized } from './errors/unauthorized';

export function requestNewIdToken(idToken: string, post = ajax.post, retry = retryOnServerError(Unauthorized, 1000)): Observable<string> {
  const url = `https://episodehunter.auth0.com/delegation`;
  const header = { 'Content-Type': 'application/json' };
  const body = {
    client_id: 'VsaZiNxg8B4eK2mxmcjOI4y1v0A9ZGPL',
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    id_token: idToken,
    scope: 'openid'
  };
  return post(url, body, header)
    .map(response => response.response)
    .catch(response => {
      const status = response.status;
      if (status === 401) {
        throw new Unauthorized();
      }
      throw new Error();
    })
    .retryWhen(retry);
}

export function renewEhToken(idToken: () => string): Observable<string> {
  const period = 1000 * 60 * 60 * 24 * 7; // every seventh day
  return Observable.timer(period, period)
    .switchMap(() => requestNewIdToken(idToken()))
    .retry();
}
