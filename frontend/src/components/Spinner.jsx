import React from 'react';

export default function Spinner({ fullScreen, size = 24 }) {
  const el = (
    <div
      style={{
        width: size,
        height: size,
        border: `2px solid var(--border)`,
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        flexShrink: 0,
      }}
      className="spin"
    />
  );

  if (fullScreen) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        {el}
      </div>
    );
  }

  return el;
}
