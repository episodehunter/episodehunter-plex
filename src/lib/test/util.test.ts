import 'rxjs/add/observable/throw';
import { Observable } from 'rxjs/Observable';
import { createRxTestScheduler } from 'marble-test';
import { Unauthorized } from '../errors/unauthorized';
import { retryOnServerError } from '../util';

test('rethrow errors', () => {
  expect.assertions(1);
  const errors$ = Observable.of(new Unauthorized());

  retryOnServerError(Unauthorized, 0)(errors$)
    .subscribe(
      () => { throw new Error(); },
      error => expect(error instanceof Unauthorized).toBe(true)
    );
});

test('count errors', () => {
  // Arrange
  const scheduler = createRxTestScheduler();
  const values = { a: new Error(), b: new Error(), 1: 1, 2: 2 };
  const e1 = scheduler.createColdObservable('a--b|', values);
  const expected =  '1--2|';

  // Act
  const obs = retryOnServerError(Unauthorized, 0, scheduler)(e1 as any);

  // Assert
  scheduler.expectObservable(obs).toBe(expected, values);
  scheduler.flush();
});

test('rethrow after 2 tries', () => {
  // Arrange
  const scheduler = createRxTestScheduler();
  const error = new Error();
  const values = { a: error, 1: 1, 2: 2 };
  const e1 = scheduler.createColdObservable('a--a--a', values);
  const expected =  '1--2--#';

  // Act
  const obs = retryOnServerError(Unauthorized, 0, scheduler)(e1 as any);

  // Assert
  scheduler.expectObservable(obs).toBe(expected, values, error);
  scheduler.flush();
});
