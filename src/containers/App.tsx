import * as React from 'react';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { createLogger } from '../lib/log';
import { LoginRow, PlexLogin, SyncStatus, PlexServerCredentials, Overlay } from '../components';
import { createEpisodehunterLock, config, renewEhToken, requestNewIdToken as requestNewEhToken, satisfiedCredentials$, watching$, checkCredentials$ } from '../lib';
import { ApplicationState, ViewType, StatusType } from '../types';

const log = createLogger();

export default class App extends React.Component<void, Partial<ApplicationState>> {
  showEpisodehunterLock;
  credentialsChange$ = new Subject();
  subscriptions: Subscription[] = [];

  constructor() {
    super();
    log.info('Starting episodehunter-plex!');
    this.state = Object.assign(config.get(), { loading: true, currentView: ViewType.start });
    this.showEpisodehunterLock = createEpisodehunterLock(token => this.setState({episodehunter: {token}}));
  }

  componentWillMount() {
    this.subscriptions.push(
      this.credentialsChange$
        .do(() => log.info('The credentials has changed, lets wait'))
        .debounceTime(10)
        .do(d => log.info('Check satisfiedCredentials$', JSON.stringify(d)))
        .let(satisfiedCredentials$())
        .do(() => log.info('The credentails seems OK. Lets check them'))
        .switchMap(checkCredentials$(
          this.setPlexCredentials,
          this.setEpisodehunterToken,
          this.setErrorMessage
        ))
        .switchMap(credentials => {
          if (credentials === null) {
            log.info('The credentials is not okey, bailout');
            return Observable.never();
          } else {
            log.info('The credentials is okey, switch to watch mode');
            return watching$(credentials, log);
          }
        })
        .catch(error => {
          log.error(error);
          throw error;
        })
        .retry()
        .subscribe(
          show => log.info('Scrobble: ', show),
          error => log.error('Scrobble error: ', error),
          () => log.error('Scrobble is done and done')
        ),
      renewEhToken(() => this.state.episodehunter.token).subscribe(this.setEpisodehunterToken)
    );

    if (this.state.episodehunter.token) {
      requestNewEhToken(this.state.episodehunter.token, undefined, e$ => e$.map(e => { throw e; }))
        .catch(() => Observable.of(null))
        .subscribe(
          token => {
            this.setEpisodehunterToken(token);
            this.setState({loading: false});
          }
        );
    } else {
      this.setState({loading: false});
    }
  }

  componentWillUpdate(nextProps, nextState) {
    config.set(nextState);
    this.credentialsChange$.next({
      plexToken: nextState.plex.token,
      ehToken: nextState.episodehunter.token,
      host: nextState.plexServer.host,
      port: nextState.plexServer.port
    });
  }

  componentWillUnmount() {
    this.subscriptions
      .filter(s => s && s.unsubscribe)
      .forEach(s => s.unsubscribe());
  }

  changeView = (nextView: ViewType) => this.setState({'currentView': nextView});
  resetView = () => this.changeView(ViewType.start);
  setErrorMessage = (error: string) => this.setState({error});
  setEpisodehunterToken = (token: string) => this.setState({ episodehunter: { token } });
  setPlexCredentials = (username, token) => {
    this.setState({plex: {username, token}});
    this.resetView();
  }
  setPlexServerConfig = (host, port) => {
    this.setState({plexServer: {host, port, connection: true}});
    this.resetView();
  }

  renderPlexLogin() {
    return <PlexLogin onCancel={this.resetView} onSucess={this.setPlexCredentials} {...this.state.plex} />;
  }

  renderPlexServerCredentials() {
    return <PlexServerCredentials onCancel={this.resetView} onSucess={this.setPlexServerConfig} plexToken={this.state.plex.token} {...this.state.plexServer} />;
  }

  renderDefaultView() {
    const episodehunterStatus = this.state.episodehunter.token ? StatusType.Ok : StatusType.Warning;
    const plexStatus = this.state.plex.token ? StatusType.Ok : StatusType.Warning;
    const plexServerStatus = this.state.plexServer.connection ? StatusType.Ok : StatusType.Warning;

    return (
      <div style={{display: 'flex', flexFlow: 'column'}}>
        {this.state.loading && <Overlay />}
        <LoginRow status={episodehunterStatus} buttonText='Login to Episodehunter' onButtonClick={this.showEpisodehunterLock} />
        <LoginRow status={plexStatus} buttonText='Login to Plex' onButtonClick={() => this.changeView(ViewType.plex)} />
        <LoginRow status={plexServerStatus} buttonText='Connect to Plex' onButtonClick={() => this.changeView(ViewType.plexserver)} />
        <div style={{flex: '1 1 auto', alignSelf: 'center'}}>
          <SyncStatus error={this.state.error} />
        </div>
      </div>
    );
  }

  render() {
    switch (this.state.currentView) {
      case ViewType.plex:
        return this.renderPlexLogin();
      case ViewType.plexserver:
        return this.renderPlexServerCredentials();
      default:
        return this.renderDefaultView();
    }
  }

}
