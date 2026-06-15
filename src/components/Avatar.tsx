import React, { useState } from 'react';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number; // pixels
  className?: string;
}

const COLORS = [
  '#6366f1', // indigo
  '#06b6d4', // cyan
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f97316', // orange
];

function stringToIndex(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
}

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 40, className = '' }) => {
  const [errored, setErrored] = useState(false);
  const initial = name ? name.trim()[0].toUpperCase() : '?';
  const color = COLORS[stringToIndex(name || '') % COLORS.length];

  if (src && !errored) {
    return (
      // Use aria-label for accessibility; keep `alt` empty to avoid raw alt-text rendering when images fail
      <img
        src={src}
        onError={() => setErrored(true)}
        style={{ width: size, height: size, objectFit: 'cover', borderRadius: 12 }}
        className={className}
        alt=""
        aria-label={name}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, backgroundColor: color, borderRadius: 12 }}
      className={className + ' flex items-center justify-center text-white font-black'}
      role="img"
      aria-label={name}
    >
      <span style={{ fontSize: Math.max(12, Math.floor(size / 2.2)) }}>{initial}</span>
    </div>
  );
};

export default Avatar;
