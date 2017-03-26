import * as React from 'react';

export function SyncStatus(props: {error: string}) {
  if (props.error) {
    return <h1 style={{color: '#ff5f5f', fontSize: '16px'}}>{props.error}</h1>;
  } else {
    return <h1>Ready to sync</h1>;
  }
}
