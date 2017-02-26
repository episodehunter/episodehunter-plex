import * as React from 'react';

export function LogInButton(props: {buttonText: string, onClick: (e) => void}) {
  return (
    <button onClick={props.onClick}>{props.buttonText}</button>
  );
}
