import * as React from 'react';
import { StatusType } from '../types';

const style = status => ({
  borderRadius: '10px',
  width: '20px',
  height: '20px',
  alignSelf: 'center',
  marginRight: '10px',
  backgroundColor: ['green', '#d2d200', 'red'][status]
});

export function StatusIcon({status}: {status: StatusType}) {
  return (
    <div style={style(status)} />
  );
}
