'use client';

import React from 'react';

interface OryxLogoProps {
  size?: number;
  className?: string;
}

export default function OryxLogo({ size = 24, className = '' }: OryxLogoProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center shrink-0 ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]"
      >
        <defs>
          <linearGradient id="oryxGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <linearGradient id="oryxGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
        </defs>

        {/* Outer futuristic diamond ring */}
        <polygon
          points="50,6 94,28 94,72 50,94 6,72 6,28"
          stroke="url(#oryxGrad1)"
          strokeWidth="6"
          strokeLinejoin="round"
          fill="rgba(15, 15, 26, 0.6)"
        />

        {/* Inner geometric core */}
        <polygon
          points="50,22 78,38 78,62 50,78 22,62 22,38"
          fill="url(#oryxGrad1)"
          opacity="0.85"
        />

        {/* Central glowing starburst */}
        <path
          d="M50 32 L54 46 L68 50 L54 54 L50 68 L46 54 L32 50 L46 46 Z"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  );
}
