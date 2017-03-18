import * as React from 'react';

export function LogInButton({onClick, buttonText}: {buttonText: string, onClick: (e) => void}) {
  return (
    <button onClick={onClick}>{buttonText}</button>
  );
}
