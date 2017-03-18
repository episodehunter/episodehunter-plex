import { Observable } from 'rxjs/Observable';

export function retryOnServerError(rethrowError: Function, delayTime: number, scheduler?) {
  return (error$: Observable<Error>) => error$
    .map(error => {
      if (error instanceof rethrowError) {
        throw error;
      }
      return error;
    })
    .scan((errorCount, err) => {
      if (errorCount >= 2) {
        throw err;
      }
      return errorCount + 1;
    }, 0)
    .delay(delayTime, scheduler);
}
