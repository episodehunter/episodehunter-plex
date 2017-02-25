import 'rxjs/add/observable/throw';
import { Observable } from 'rxjs/Observable';
import { spy } from 'simple-spy';
import { Unauthorized } from '../errors/unauthorized';
import { verifyPlex } from '../verify';

test('Return Unauthorized error for status code 401', () => {
  expect.assertions(1);
  const ajax = { get: () => Observable.throw({ status: 401 }) };

  verifyPlex('', 80, '', ajax as any)
    .subscribe(
      () => ({}),
      error => expect(error instanceof Unauthorized).toBe(true)
    );
});

test('Return an generic error for status code 500', done => {
  const ajax = { get: () => Observable.throw({ status: 500 }) };

  verifyPlex('', 80, '', ajax as any, 0)
    .subscribe(
      () => console.log('NEXT!'),
      error => {
        expect(error instanceof Error).toBe(true);
        done();
      }
    );
});

test('Return the status code for OK', () => {
  expect.assertions(1);
  const ajax = { get: () => Observable.of({ status: 200 }) };

  verifyPlex('', 80, '', ajax as any)
    .subscribe(
      next => expect(next).toBe(200)
    );
});

test('Should call the plex server when a token', () => {
  const ajax = { get: spy(() => Observable.of({ status: 200 })) };

  verifyPlex('host', 80, 'my-token', ajax as any).subscribe();

  const url = ajax.get.args[0][0];
  const token = ajax.get.args[0][1]['X-Plex-Token'];
  expect(url).toBe('http://host:80/status/sessions');
  expect(token).toBe('my-token');
});
