'use client';

import React from 'react';
import Image from 'next/image';

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
      <Image
        src="/oryx-logo-v2.png"
        alt="Oryx AI"
        width={size}
        height={size}
        className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]"
        priority
      />
    </div>
  );
}
