import * as React from 'react';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';
import { LoginRow, PlexLogin, SyncStatus, PlexServerCredentials } from '../components';
import { createEpisodehunterLock, config, renewEhToken, satisfiedCredentials$, watching$, checkCredentials$ } from '../lib';
import { ApplicationState, ViewType, StatusType } from '../types';

export default class App extends React.Component<void, Partial<ApplicationState>> {
  showEpisodehunterLock;
  credentialsChange$ = new Subject();
  subscriptions: Subscription[] = [];

  constructor() {
    super();
    this.state = config.get();
    this.showEpisodehunterLock = createEpisodehunterLock(token => this.setState({episodehunter: {token}}));
  }

  componentWillMount() {
    this.subscriptions.push(
      checkCredentials$(
        this.state,
        this.setPlexCredentials,
        this.setEpisodehunterToken,
        this.setErrorMessage
      )
      .subscribe(
        isCredentialsOk => console.log('Credentials result on boot: ', isCredentialsOk),
        error => console.error('Error on credentials check on boot: ', error)
      ),

      this.credentialsChange$
        .debounceTime(10)
        .let(satisfiedCredentials$())
        .switchMap(watching$)
        .retry()
        .subscribe(
          next => console.log('Scrobble: ', next),
          error => console.error('Scrobble error: ', error),
          () => console.log('Scrobble is DONE AND DONE!')
        ),

      renewEhToken(() => this.state.episodehunter.token).subscribe()
    );
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

  setState(args) {
    super.setState(args);
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
