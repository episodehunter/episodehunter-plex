import * as React from 'react';
import { StatusIcon } from './StatusIcon';
import { LogInButton } from './LoginButton';
import { StatusType } from '../types';

const style = {
  display: 'flex',
  paddingTop: '20px',
  flexWrap: 'wrap'
} as any;

export function LoginRow(props: {status: StatusType, buttonText: string, onButtonClick: (e) => void, errorMsg?: string}) {
  return (
    <div style={style}>
      <StatusIcon status={props.status} />
      <LogInButton buttonText={props.buttonText} onClick={props.onButtonClick}/>
      {props.errorMsg}
    </div>
  );
}
