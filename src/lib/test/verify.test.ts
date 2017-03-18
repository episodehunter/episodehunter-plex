import 'rxjs/add/observable/throw';
import { Observable } from 'rxjs/Observable';
import { createRxTestScheduler } from 'marble-test';
import { spy } from 'simple-spy';
import { Unauthorized } from '../errors/unauthorized';
import { verifyPlex } from '../verify';

const rethrowError$ = e$ => e$.map(e => { throw e; });

test('Return Unauthorized error for status code 401', () => {
  const scheduler = createRxTestScheduler();
  const error = { status: 401 };
  const ajax = { get: () => scheduler.createColdObservable('#', {}, error) };

  const obs = verifyPlex('', 80, '', ajax as any, rethrowError$);

  scheduler.expectObservable(obs).toBe('#', null, new Unauthorized());
  scheduler.flush();
});

test('Return an generic error for status code 500', () => {
  const scheduler = createRxTestScheduler();
  const error = { status: 500 };
  const ajax = { get: () => scheduler.createColdObservable('#', null, error) };

  const obs = verifyPlex('', 80, '', ajax as any, rethrowError$);

  scheduler.expectObservable(obs).toBe('#', null, new Error());
  scheduler.flush();
});

test('Return the status code for OK', () => {
  const scheduler = createRxTestScheduler();
  const response = { status: 200 };
  const ajax = { get: () => scheduler.createColdObservable('--a|', { a: response }) };

  const obs = verifyPlex('', 80, '', ajax as any, rethrowError$);

  scheduler.expectObservable(obs).toBe('--a|', { a: 200 });
  scheduler.flush();
});

test('Should call the plex server when a token', () => {
  const ajax = { get: spy(() => Observable.of({ status: 200 })) };

  verifyPlex('host', 80, 'my-token', ajax as any).subscribe();

  const url = ajax.get.args[0][0];
  const token = ajax.get.args[0][1]['X-Plex-Token'];
  expect(url).toBe('http://host:80/status/sessions');
  expect(token).toBe('my-token');
});
