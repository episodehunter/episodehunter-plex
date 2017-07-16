import * as React from 'react';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { observable, action, reaction, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { createLogger } from '../lib/log';
import { Credentials } from '../model/credentials';
import { LoginRow, PlexLogin, SyncStatus, PlexServerCredentials, Overlay } from '../components';
import { createEpisodehunterLock, config, renewEhToken, requestNewIdToken as requestNewEhToken, satisfiedCredentials$, watching$, checkCredentials$ } from '../lib';
import { ViewType, StatusType, Credentials as SimpleCredentials } from '../types';

const log = createLogger();

function createSimpleCredentials(credentials: Credentials): SimpleCredentials {
  return {
    plexToken: credentials.plex.token,
    ehToken: credentials.episodehunter.token,
    host: credentials.plexServer.host,
    port: credentials.plexServer.port
  };
}

@observer
export default class App extends React.Component {
  showEpisodehunterLock;
  credentialsChange$: BehaviorSubject<SimpleCredentials>;
  subscriptions: Subscription[] = [];
  @observable credentials: Credentials;
  @observable currentView: ViewType;
  @observable errorMessage: string;
  @observable loading: boolean = true;

  constructor() {
    super();
    log.info('Starting...');
    this.credentials = new Credentials(config.get());
    this.credentialsChange$ = new BehaviorSubject(createSimpleCredentials(this.credentials));
    this.showEpisodehunterLock = createEpisodehunterLock(this.credentials.setEpisodehunterToken);
  }

  scrobble$() {
    return this.credentialsChange$
      .do(() => log.info('Credentials has changed'))
      .debounceTime(10)
      .let(satisfiedCredentials$())
      .switchMap(checkCredentials$(
        this.credentials.setPlexCredentials,
        this.credentials.setPlexConnectionStatus,
        this.credentials.setEpisodehunterToken,
        this.setErrorMessage
      ))
      .switchMap(credentials => {
        if (credentials === null) {
          log.info('Credentials was not okey');
          return Observable.never();
        } else {
          log.info('Credentials is OK, lets switch to the watching stream');
          this.setErrorMessage('');
          return watching$(credentials, log);
        }
      });
  }

  componentWillMount() {
    this.subscriptions.push(
      this.scrobble$().subscribe(
        () => log.info('Scobble!'),
        error => log.error(error),
        () => log.error('Shutting down')
      ),
      renewEhToken(() => this.credentials.episodehunter.token).subscribe(this.credentials.setEpisodehunterToken)
    );

    if (this.credentials.episodehunter.token) {
      requestNewEhToken(this.credentials.episodehunter.token)
        .catch(() => Observable.of(null))
        .subscribe(
          action((token: string) => {
            this.credentials.setEpisodehunterToken(token);
            this.setLoaing(false);
          })
        );
    } else {
      this.setLoaing(false);
    }

    reaction(
      () => this.credentials,
      credentials => {
        log.into('Pushing new values on the subscription!');
        this.generateErrorMessage();
        config.set(toJS(credentials));
        this.credentialsChange$.next(createSimpleCredentials(credentials));
      }
    );
  }

  componentWillUnmount() {
    this.subscriptions
      .filter(s => s && s.unsubscribe)
      .forEach(s => s.unsubscribe());
  }

  @action setErrorMessage = (error: string) => this.errorMessage = error;
  @action changeView = (nextView: ViewType) => this.currentView = nextView;
  @action setLoaing = (loading: boolean) => this.loading = loading;
  resetView = () => this.changeView(ViewType.start);
  @action updateStateAndRestView = fun => (...args) => {
    this.resetView();
    return fun(...args);
  }

  generateErrorMessage() {
    if (!this.credentials.episodehunter.token) {
      this.setErrorMessage('Could not login to episodehunter.tv, please try again');
    } else if (!this.credentials.plex.token) {
      this.setErrorMessage('Could not login to plex.tv, please try again');
    } else if (!this.credentials.plexServer.connection) {
      this.setErrorMessage('Could not login to your plex server, please try again');
    }
  }


  renderPlexLogin() {
    return (
      <PlexLogin
        onCancel={this.resetView}
        onSucess={this.updateStateAndRestView(this.credentials.setPlexCredentials)}
        {...this.credentials.plex}
      />
    );
  }

  renderPlexServerCredentials() {
    return (
      <PlexServerCredentials
        onCancel={this.resetView}
        onSucess={this.updateStateAndRestView(this.credentials.setPlexServerConfig)}
        plexToken={this.credentials.plex.token}
        {...this.credentials.plexServer}
      />
    );
  }

  renderDefaultView() {
    const episodehunterStatus = this.credentials.episodehunter.token ? StatusType.Ok : StatusType.Warning;
    const plexStatus = this.credentials.plex.token ? StatusType.Ok : StatusType.Warning;
    const plexServerStatus = this.credentials.plexServer.connection ? StatusType.Ok : StatusType.Warning;

    return (
      <div style={{display: 'flex', flexFlow: 'column'}}>
        {this.loading && <Overlay />}
        <LoginRow status={episodehunterStatus} buttonText='Login to Episodehunter' onButtonClick={this.showEpisodehunterLock} />
        <LoginRow status={plexStatus} buttonText='Login to Plex' onButtonClick={() => this.changeView(ViewType.plex)} />
        <LoginRow status={plexServerStatus} buttonText='Connect to Plex' onButtonClick={() => this.changeView(ViewType.plexserver)} />
        <div style={{flex: '1 1 auto', alignSelf: 'center'}}>
          <SyncStatus error={this.errorMessage} />
        </div>
      </div>
    );
  }

  render() {
    switch (this.currentView) {
      case ViewType.plex:
        return this.renderPlexLogin();
      case ViewType.plexserver:
        return this.renderPlexServerCredentials();
      default:
        return this.renderDefaultView();
    }
  }

}
