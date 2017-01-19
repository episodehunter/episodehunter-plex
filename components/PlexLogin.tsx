import * as React from 'react';

type PlexLoginProps = {username: string, password: string, onSucess: (username, token) => void, onCancel: () => void};
type PlexLoginState = {username?: string, password?: string, token?: string, loading?: boolean};

class FlavorForm extends React.Component<PlexLoginProps, PlexLoginState> {

  constructor(props: PlexLoginProps) {
    super(props);
    this.state = {
      username: props.username,
      password: props.password,
      loading: false
    };
  }

  login() {
    console.log('Login');
  }

  chnage(prop: string, event) {
    this.setState({[prop]: event.target.value});
  }

  render() {
    return (
      <div>
        <div className='from-row'>
          <label>Plex username:</label>
          <input type="text" value={this.state.username} onChange={e => this.chnage('username', e)} />
        </div>
        <div className="from-row">
          <label>Plex password:</label>
          <input type="password" value={this.state.password} onChange={e => this.chnage('password', e)} />
        </div>
        <button onClick={() => this.login()}>Login</button>
        <p onClick={this.props.onCancel}>Cancel</p>
      </div>
    );
  }
}
