import 'rxjs/add/observable/throw';
import { createRxTestScheduler } from 'marble-test';
import { requestNewIdToken } from '../renew-eh-token';

const rethrowError$ = e$ => e$.map(e => { throw e; });

test('requestNewIdToken should map out the id token', () => {
  const scheduler = createRxTestScheduler();
  const response = { response: { id_token: 'dog' } };
  const ajaxPost = () => scheduler.createColdObservable('-a|', {a: response});

  const obs = requestNewIdToken('', ajaxPost as any);

  scheduler.expectObservable(obs).toBe('-a|', {a: 'dog'});
  scheduler.flush();
});
