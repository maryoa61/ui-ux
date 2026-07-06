import React from 'react';

interface CFVpnLogoProps {
  className?: string;
  size?: number;
}

export const CFVpnLogo: React.FC<CFVpnLogoProps> = ({ className = '', size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 108 108"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="cfvpn_bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B1D3A" />
          <stop offset="50%" stopColor="#112A54" />
          <stop offset="100%" stopColor="#061226" />
        </linearGradient>
        <linearGradient id="shield_glow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="cloud_grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <filter id="glow_filter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background Rounded Square for app icon look */}
      <rect x="2" y="2" width="104" height="104" rx="26" fill="url(#cfvpn_bg)" />
      <rect x="2" y="2" width="104" height="104" rx="26" stroke="#1E3A8A" strokeWidth="1.5" />

      {/* Subtle background radial glow */}
      <circle cx="54" cy="54" r="36" fill="#1E40AF" fillOpacity="0.25" filter="url(#glow_filter)" />

      {/* Outer Glowing Cyan Shield */}
      <path
        d="M 54 18 C 38 23 26 24 25 26 L 25 52 C 25 72 40 84 54 89 C 68 84 83 72 83 52 L 83 26 C 82 24 70 23 54 18 Z"
        fill="url(#shield_glow)"
        filter="url(#glow_filter)"
      />

      {/* Inner Deep Royal Blue Shield Body */}
      <path
        d="M 54 21.5 C 40 26 28 26 28 28 L 28 51.5 C 28 69 41 80 54 85 C 67 80 80 69 80 51.5 L 80 28 C 80 26 68 26 54 21.5 Z"
        fill="#1E3A8A"
      />

      {/* Inner Darker Rim */}
      <path
        d="M 54 24.5 C 42 28.5 31 28.5 31 30.5 L 31 51 C 31 66.5 42 76 54 81 C 66 76 77 66.5 77 51 L 77 30.5 C 77 28.5 66 28.5 54 24.5 Z"
        fill="#172554"
      />

      {/* Cloudflare Orange Cloud Base */}
      <path
        d="M 44 51.5 C 36 51.5 32 46 32 40.5 C 32 35 36.5 31 41.5 30.5 C 44 25.5 49 22.5 55 22.5 C 61.5 22.5 66.5 27 67.5 32.5 C 72 33.5 75 37.5 75 42 C 75 47.5 70.5 51.5 65.5 51.5 Z"
        fill="url(#cloud_grad)"
      />

      {/* Cloud Highlight */}
      <path
        d="M 55 24.5 C 49.5 24.5 45 27.5 42.5 32 C 38 32.5 34.5 36 34.5 40.5 C 34.5 45 38 49 44 49 L 65 49 C 69 49 72.5 45.5 72.5 41.5 C 72.5 37.5 69.5 34 65.5 33.7 C 64.5 28.5 60 24.5 55 24.5 Z"
        fill="#FB923C"
      />

      {/* White Wave Primary Surge */}
      <path
        d="M 32 47.5 C 38 41.5 47 42.5 55 48.5 C 61 53.5 67 50.5 71 44.5 C 73.5 49.5 69 56.5 61 56.5 C 53 56.5 45 50.5 37 51.5 C 34.5 52 33 50 32 47.5 Z"
        fill="#FFFFFF"
      />

      {/* White Wave Secondary Swoosh */}
      <path
        d="M 35 52.5 C 43 49.5 50 53.5 57 58.5 C 63 61.5 69 57.5 73 52.5 C 74 56 68 61.5 60 61.5 C 50 61.5 43 55.5 35 52.5 Z"
        fill="#E2E8F0"
      />

      {/* Ribbon Banner Outer Band */}
      <path
        d="M 30 59 L 78 59 L 78 72 L 54 76 L 30 72 Z"
        fill="#1E40AF"
      />

      {/* Ribbon Banner Inner Band */}
      <path
        d="M 31 60 L 77 60 L 77 71 L 54 74.5 L 31 71 Z"
        fill="#1D4ED8"
      />

      {/* Letters C F V P N in White */}
      <path d="M 39 62.5 L 35.5 62.5 L 35.5 68.5 L 39 68.5 L 39 67 L 37 67 L 37 64 L 39 64 Z" fill="#FFFFFF" />
      <path d="M 41 62.5 L 45 62.5 L 45 64 L 42.5 64 L 42.5 65 L 44.5 65 L 44.5 66.3 L 42.5 66.3 L 42.5 68.5 L 41 68.5 Z" fill="#FFFFFF" />
      <path d="M 47 62.5 L 48.5 62.5 L 49.5 66.5 L 50.5 62.5 L 52 62.5 L 50.2 68.5 L 48.8 68.5 Z" fill="#FFFFFF" />
      <path d="M 54 62.5 L 57.5 62.5 C 58.8 62.5 58.8 65.5 57.5 65.5 L 55.5 65.5 L 55.5 68.5 L 54 68.5 Z M 55.5 63.8 L 55.5 64.3 L 57.2 64.3 C 57.6 64.3 57.6 63.8 57.2 63.8 Z" fill="#FFFFFF" />
      <path d="M 60.5 62.5 L 62 62.5 L 64 66.5 L 64 62.5 L 65.5 62.5 L 65.5 68.5 L 64 68.5 L 62 64.5 L 62 68.5 L 60.5 68.5 Z" fill="#FFFFFF" />
    </svg>
  );
};
