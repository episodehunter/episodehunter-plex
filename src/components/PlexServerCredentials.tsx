import * as React from 'react';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { ajax } from 'rxjs/observable/dom/ajax';
import { Overlay } from './Overlay';

type PlexServerCredentialsProps = {host: string, port: number, plexToken: string, onSucess: (host, port) => void, onCancel: () => void};
type PlexServerCredentialsState = {host: string, port: number, loading: boolean, errorMsg: string};

export class PlexServerCredentials extends React.Component<PlexServerCredentialsProps, Partial<PlexServerCredentialsState>> {
  checkClick$ = new Subject();
  checkClickSubscription: Subscription;

  constructor(props: PlexServerCredentialsProps) {
    super(props);
    this.state = {
      host: props.host,
      port: props.port,
      loading: false,
      errorMsg: ''
    };

    this.checkClickSubscription = this.checkClick$
      .do(() => this.setState({loading: true}))
      .map(() => `http://${this.state.host}:${this.state.port}/status/sessions`)
      .switchMap(url => {
        return ajax
          .get(url, {Accept: 'application/json', 'X-Plex-Token': this.props.plexToken})
          .do(response => this.props.onSucess(this.state.host, this.state.port))
          .catch(reason => {
            console.log(reason);
            this.setState({
              loading: false,
              errorMsg: 'Something went wrong'
            });
            return Observable.of(null);
          });
      })
      .subscribe();
  }

  componentWillUnmount() {
    this.checkClickSubscription.unsubscribe();
  }

  chnage(prop: keyof PlexServerCredentialsState, event) {
    this.setState({[prop]: event.target.value});
  }

  updateHost(host: string) {
    this.setState({'host': host.replace(/.*?:\/\//g, '')});
  }

  updatePort(port) {
    this.setState({'port': (port | 0)});
  }

  render() {
    return (
      <div style={{width: '100%'}}>
        {this.state.loading && <Overlay />}
        <div className='from-row'>
          <label>Plex hostname or ip:</label>
          <input type="text" value={this.state.host} onChange={(e: any) => this.updateHost(e.target.value)} />
        </div>
        <div className="from-row">
          <label>Port:</label>
          <input type="text" value={this.state.port} onChange={(e: any) => this.updatePort(e.target.value)} />
        </div>
        <div>
         {this.state.errorMsg}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => this.checkClick$.next()}>Test connection</button>
          <button className="cancel" onClick={this.props.onCancel}>Cancel</button>
        </div>
      </div>
    );
  }
}
