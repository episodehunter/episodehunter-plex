import * as React from 'react';

export function Overlay() {
  const style = {
    zIndex: 100,
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    position: 'absolute',
    top: 0,
    left: 0
  };
  return (
    <div style={style}></div>
  );
}
