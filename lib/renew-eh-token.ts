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
    .map(response => response.response)
    .catch(response => {
      const status = response.status;
      console.log('Get result from server. Status', status);
      if (status === 401) {
        throw new Unauthorized();
      }
      throw new Error();
    })
    .retryWhen(error$ => {
      console.log('FEL!');
      return error$
        .map(error => {
          console.log('FEL!', error instanceof Unauthorized);
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
