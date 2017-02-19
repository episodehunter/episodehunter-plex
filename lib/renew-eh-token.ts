import { Observable } from 'rxjs/Observable';
import { ajax } from 'rxjs/observable/dom/ajax';
import { Unauthorized } from './errors/unauthorized';

export function requestNewIdToken(idToken: string): Observable<string> {
  const url = `https://episodehunter.auth0.com/delegation`;
  const header = { 'Content-Type': 'application/json' };
  const body = {
    client_id: 'VsaZiNxg8B4eK2mxmcjOI4y1v0A9ZGPL',
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    id_token: idToken,
    scope: 'openid'
  };
  return ajax.post(url, body, header)
    .map(response => {
      const status = response.status;
      if (status === 401) {
        throw new Unauthorized();
      } else if (status < 200 || status > 299) {
        throw new Error();
      }
      return response.response;
    })
    .retryWhen(error$ => {
      return error$
        .map(error => {
          if (error instanceof Unauthorized) {
            throw error;
          }
          return error;
        })
        .delay(5000);
    });
}

export function renewEhToken(idToken: () => string): Observable<string> {
  const period = 1000 * 60 * 60 * 24 * 7; // every 7 day
  return Observable.timer(period, period)
    .switchMap(() => requestNewIdToken(idToken()))
    .retry();
}
