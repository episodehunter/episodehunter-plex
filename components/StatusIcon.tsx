import * as React from 'react';
import { StatusType } from '../types';

export function StatusIcon(props: {status: StatusType}) {
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
