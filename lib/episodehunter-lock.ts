declare const Auth0Lock;

export function createEpisodehunterLock(cb) {
  const lock = new Auth0Lock(
    'S0B1JLjaL8Qfmwjw291jqWj08bFjORfP',
    'episodehunter.auth0.com',
    {
      autoclose: true,
      auth: {
        params: {
          scope: 'openid email user_id'
        },
        redirect: false,
        sso: false
      }
    }
  );

  lock.on('authenticated', authResult => {
    cb(authResult.idToken);
  });
  return () => lock.show();
}
