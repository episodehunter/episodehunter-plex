import { Observable } from 'rxjs/Observable';
import * as jwt from 'jsonwebtoken';
import { post } from './http';

export function requestNewIdToken(idToken: string, _post = post): Observable<string> {
  const url = `https://episodehunter.auth0.com/delegation`;
  const header = { 'Content-Type': 'application/json' };
  const body = {
    client_id: 'S0B1JLjaL8Qfmwjw291jqWj08bFjORfP',
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    id_token: idToken,
    scope: 'openid'
  };
  return _post<any>(url, body, header)
    .map(response => response.response.id_token);
}

export function ehTokenExpired(token: string) {
  const decoded = jwt.decode(token);
  return !decoded || decoded.exp < (Date.now() / 1000);
}

export function renewEhToken(idToken: () => string): Observable<string> {
  const period = 1000 * 60 * 60 * 24 * 7; // every seventh day
  return Observable.timer(period, period)
    .switchMap(() => requestNewIdToken(idToken()))
    .retry();
}
