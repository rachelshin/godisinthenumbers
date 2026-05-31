// components/Icon.js
// Uses React.createElement with native DOM SVG — works in react-native-web (PWA) without react-native-svg
import React from 'react';

const svg = (size, color, ...children) =>
  React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth: 2,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    style: { display: 'block' },
  }, ...children);

const path = (d) => React.createElement('path', { key: d, d });
const line = (x1, y1, x2, y2) => React.createElement('line', { key: `${x1}${y1}`, x1, y1, x2, y2 });
const polyline = (points) => React.createElement('polyline', { key: points, points });
const circle = (cx, cy, r) => React.createElement('circle', { key: `${cx}${cy}`, cx, cy, r });

// Feather: upload — arrow up into a tray
export function IconUpload({ size = 20, color = '#000' }) {
  return svg(size, color,
    path('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'),
    polyline('17 8 12 3 7 8'),
    line('12', '3', '12', '15'),
  );
}

// Feather: log-out — door with arrow pointing right
export function IconLogOut({ size = 20, color = '#000' }) {
  return svg(size, color,
    path('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'),
    polyline('16 17 21 12 16 7'),
    line('21', '12', '9', '12'),
  );
}
