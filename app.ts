import * as Rx from 'rxjs/Rx';

interface PlexSignInResponse {
  user: {
    authToken: string;
  };
}

// const Config = require('electron-config');
// const config = new Config();
//
// config.set('unicorn', '🦄');
// console.log(config.get('unicorn'));
// //=> '🦄'
//
// // use dot-notation to access nested properties
// config.set('foo.bar', true);
// console.log(config.get('foo'));
// //=> {bar: true}
//
// config.delete('unicorn');
// console.log(config.get('unicorn'));
// //=> undefined

function getPlexToken(username, password) {
  const header = {
    'X-Plex-Client-Identifier': 'episodehunter',
    'X-Plex-Product': 'Episodehunter',
    'X-Plex-Version': '3.0.0',
    'Content-Type': 'multipart/form-data',
    'Accept': 'application/json'
  };
  const body = { username, password };

  return Rx.Observable.ajax.post('https://plex.tv/users/sign_in.json', body, header)
    .map(data => data.response)
    .map((response: PlexSignInResponse) => response.user.authToken);
}

function validateEhApiKey(username, apiKey) {
  const header = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  const body = { username, apiKey };

  return Rx.Observable.ajax.post('', body, header)
    .map(data => data.response);
}

const form = document.querySelector('form');
const loginButton = document.querySelector('#login-button');
const loginButtonClicks$ = Rx.Observable.fromEvent<Event>(loginButton, 'click')
  .do(event => event.preventDefault());


loginButtonClicks$
  .map(() => new FormData(form))
  .switchMap((fileds: any) => {
    return Rx.Observable.forkJoin(
      getPlexToken(fileds.get('plexUsername'), fileds.get('plexPassword')),
      validateEhApiKey(fileds.get('ehUsername'), fileds.get('ehApiKey')),
      Rx.Observable.of(fileds)
    );
  });

declare const Auth0Lock;

const lock = new Auth0Lock(
  'S0B1JLjaL8Qfmwjw291jqWj08bFjORfP',
  'episodehunter.auth0.com',
  {
    auth: {
      redirect: false,
      sso: false
    }
  }
);

lock.show();

lock.on('authenticated', authResult => {
  lock.getProfile(authResult.idToken, function(error, profile) {
    if (error) {
      // Handle error
      return;
    }
    localStorage.setItem('id_token', authResult.idToken);
    console.log(profile);
  });
});

Rx.Observable.fromEvent<Event>(document.querySelector('show-lock'), 'click')
  .do(event => event.preventDefault())
  .do(() => lock.show());



// .subscribe(() => console.log('Click!'));


// console.log('Hej');
