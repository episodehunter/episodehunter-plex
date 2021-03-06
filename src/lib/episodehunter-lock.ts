declare const Auth0Lock;

export function createEpisodehunterLock(cb) {
  const lock = new Auth0Lock(
    'S0B1JLjaL8Qfmwjw291jqWj08bFjORfP',
    'episodehunter.auth0.com',
    {
      autoclose: true,
      autofocus: true,
      theme: {
        logo: 'logo.png',
        primaryColor: '#03a37e'
      },
      auth: {
        params: {
          scope: 'openid'
        },
        redirect: false,
        sso: false
      },
      allowSignUp: false,
      languageDictionary: {
        title: 'Episodehunter'
      }
    }
  );

  lock.on('authenticated', authResult => {
    cb(authResult.idToken);
  });
  return () => lock.show();
}
