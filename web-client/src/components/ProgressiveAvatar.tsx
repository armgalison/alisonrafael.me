'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ProgressiveAvatarProps {
  alt: string;
  className?: string;
}

// Blur placeholder (tiny 24x29 avatar thumbnail, base64 encoded for instant preview)
const BLUR_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAdCAIAAABKpUMmAAAA+ElEQVR4nJXVQQqAMBBA0WPdzeM5D+MlFBELCUPa0VLKnrLmZ3Zm+Ps1M7OIGHnnCp5zDiHEf13XhRBCCEUpoYQCoCCEQgiRJAlSSimFAqAkSSKlVEqplBJCACCEUkr/8p7zvk+SJE3TPJVR13XX9+u6/rGMoijouh7Hseq6ruP4XUVd1y3LUhRFlmVlWTYMA8dxSJKkKIqiKJRlqaoqgiCQyWTCMAx5njMMY5omzfN4njcMQxAE13Ud70/TZFmW53mj0SjPc0lSKpViWRaSJIXDYU7SJEmm02k+n6cgCACA6XQ6n89VVVVVVXVdt1ytkCSp6/oI8f/PbQCmrMvfx6I=';

export function ProgressiveAvatar({ alt, className = '' }: ProgressiveAvatarProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <Image
      src="/avatar.png"
      alt={alt}
      width={900}
      height={1086}
      quality={85}
      priority
      placeholder="blur"
      blurDataURL={BLUR_PLACEHOLDER}
      onLoad={() => setIsLoaded(true)}
      className={`${className} ${isLoaded ? 'transition-opacity duration-300' : ''}`}
      sizes="(max-width: 720px) 100vw, 50vw"
    />
  );
}
