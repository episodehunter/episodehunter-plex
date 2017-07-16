import * as React from 'react';

const style: React.CSSProperties = {
  zIndex: 100,
  height: '100%',
  width: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  position: 'absolute',
  top: 0,
  left: 0
};

export function Overlay() {
  return <div style={style} />;
}
