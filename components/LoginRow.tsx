import * as React from 'react';

export enum StatusType {
  Ok,
  Warning,
  Error
};

interface LoginRowArgs {
  status: StatusType;
  buttonText: string;
  onButtonClick: Function;
}

function StatusIcon(props: {status: StatusType}) {
  const style = {
    borderRadius: '10px',
    width: '20px',
    height: '20px',
    alignSelf: 'center',
    marginRight: '10px',
    backgroundColor: ['green', '#d2d200', 'red'][props.status]
  };
  return (
    <div style={style} />
  );
}

function LogInButton(props: {buttonText: string, onClick: (e) => void}) {
  return (
    <button onClick={props.onClick}>{props.buttonText}</button>
  );
}

export function LoginRow(props: {status: StatusType, buttonText: string, onButtonClick: (e) => void, errorMsg?: string}) {
  const style = {
    display: 'flex',
    paddingTop: '20px',
    flexWrap: 'wrap'
  } as any;
  return (
    <div style={style}>
      <StatusIcon status={props.status} />
      <LogInButton buttonText={props.buttonText} onClick={props.onButtonClick}/>
      {props.errorMsg}
    </div>
  );
}
