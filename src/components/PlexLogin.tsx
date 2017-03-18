import * as React from 'react';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { ajax } from 'rxjs/observable/dom/ajax';
import { Overlay } from './Overlay';

type PlexLoginProps = {username: string, token: string, onSucess: (username, token) => void, onCancel: () => void};
type PlexLoginState = {username?: string, password?: string, token?: string, loading?: boolean, errorMsg?: string};

export class PlexLogin extends React.Component<PlexLoginProps, PlexLoginState> {
  loginClick$ = new Subject();
  loginClickSubscription: Subscription;

  constructor(props: PlexLoginProps) {
    super(props);
    this.state = {
      username: props.username,
      password: '',
      token: props.token,
      loading: false,
      errorMsg: ''
    };

    this.loginClickSubscription = this.loginClick$
      .do(() => this.setState({loading: true}))
      .map(() => `user[login]=${encodeURIComponent(this.state.username)}&user[password]=${encodeURIComponent(this.state.password)}`)
      .switchMap(formData => {
        return ajax
          .post(
            'https://plex.tv/users/sign_in.json',
            formData,
            { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Plex-Client-Identifier': 'episodehunter', 'X-Plex-Product': 'Episodehunter', 'X-Plex-Version': '1.0.0' }
          )
          .do(response => this.props.onSucess(this.state.username, response.response.user.authToken))
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
    this.loginClickSubscription.unsubscribe();
  }

  change(prop: keyof PlexLoginState, event) {
    this.setState({[prop]: event.target.value});
  }

  render() {
    return (
      <div>
        {this.state.loading && <Overlay />}
        <div className='from-row'>
          <label>Plex username:</label>
          <input type="text" value={this.state.username} onChange={e => this.change('username', e)} />
        </div>
        <div className="from-row">
          <label>Plex password:</label>
          <input type="password" value={this.state.password} onChange={e => this.change('password', e)} />
        </div>
        <div style={{color: 'red'}}>
         {this.state.errorMsg}
        </div>
        <button onClick={() => this.loginClick$.next()}>Request token</button>
        <p onClick={this.props.onCancel}>Cancel</p>
      </div>
    );
  }
}
