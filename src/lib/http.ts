import { ajax } from 'rxjs/observable/dom/ajax';
import { Observable } from 'rxjs/Observable';
import { retryOnServerError } from './util';
import { Unauthorized } from './errors/unauthorized';

export function post<R>(url, body, header, retry = retryOnServerError(Unauthorized, 1000), _post = ajax.post): Observable<{status: number; response: R}> {
  return _post(url, body, header)
    .catch(response => {
      const status = response.status;
      if (status === 401) {
        return Observable.throw(new Unauthorized());
      }
      return Observable.throw(new Error());
    })
    .retryWhen(retry);
}
