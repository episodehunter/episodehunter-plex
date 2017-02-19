import * as React from 'react';

export function SyncStatus(props: {error: string}) {
  if (props.error) {
    return <h1>{props.error}</h1>;
  } else {
    return <h1>Redy to sync</h1>;
  }
}
