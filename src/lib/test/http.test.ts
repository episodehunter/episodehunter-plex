import 'rxjs/add/observable/throw';
import { createRxTestScheduler } from 'marble-test';
import { Unauthorized } from '../errors/unauthorized';
import { post } from '../http';

const rethrowError$ = e$ => e$.map(e => { throw e; });

test('Return Unauthorized error for status code 401', () => {
  const scheduler = createRxTestScheduler();
  const error = { status: 401 };
  const ajaxPost = () => scheduler.createColdObservable('#', {}, error);

  const obs = post('', {}, {}, rethrowError$, ajaxPost as any);

  scheduler.expectObservable(obs).toBe('#', null, new Unauthorized());
  scheduler.flush();
});

test('Return an generic error for status code 500', () => {
  const scheduler = createRxTestScheduler();
  const error = { status: 500 };
  const ajaxPost = () => scheduler.createColdObservable('#', null, error);

  const obs = post('', {}, {}, rethrowError$, ajaxPost as any);

  scheduler.expectObservable(obs).toBe('#', null, new Error());
  scheduler.flush();
});

test('Return the response for OK', () => {
  const scheduler = createRxTestScheduler();
  const response = { response: { id_token: 'Yoo' } };
  const ajaxPost = () => scheduler.createColdObservable('--a|', { a: response });

  const obs = post('', {}, {}, rethrowError$, ajaxPost as any);

  scheduler.expectObservable(obs).toBe('--a|', { a: response });
  scheduler.flush();
});
