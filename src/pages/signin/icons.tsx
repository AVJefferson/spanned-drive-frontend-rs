import type { JSX } from "react";

const baseSvgProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  xmlns: "http://www.w3.org/2000/svg",
};

export const OneDriveIcon: JSX.Element = (
  <svg {...baseSvgProps} aria-hidden focusable="false">
    <defs>
      <linearGradient id="onedrive-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0364B8" />
        <stop offset="100%" stopColor="#28A8EA" />
      </linearGradient>
    </defs>
    <path
      d="M14.5 8.5a4.5 4.5 0 0 0-8.49-1.5A4 4 0 0 0 2.5 11a4 4 0 0 0 4 4h12a3.5 3.5 0 0 0 .5-6.96A4.5 4.5 0 0 0 14.5 8.5Z"
      fill="url(#onedrive-grad)"
    />
  </svg>
);

export const DropboxIcon: JSX.Element = (
  <svg {...baseSvgProps} aria-hidden focusable="false">
    <path
      d="M6 3 1.5 6.25 6 9.5l4.5-3.25Zm12 0L13.5 6.25 18 9.5l4.5-3.25ZM1.5 13.25 6 16.5l4.5-3.25L6 10ZM18 10l-4.5 3.25L18 16.5l4.5-3.25ZM6 17.5 10.5 20.75 12 19.75l-4.5-3.25Zm12 0-4.5-1.25L12 19.75l1.5 1L18 17.5Z"
      fill="#0061FF"
    />
  </svg>
);

export const BoxIcon: JSX.Element = (
  <svg {...baseSvgProps} aria-hidden focusable="false">
    <rect x="2" y="4" width="20" height="16" rx="3" fill="#0061D5" />
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fontFamily="Inter, Arial, sans-serif"
      fontWeight="800"
      fontSize="11"
      fill="#fff"
    >
      Box
    </text>
  </svg>
);

export const ICloudIcon: JSX.Element = (
  <svg {...baseSvgProps} aria-hidden focusable="false">
    <defs>
      <linearGradient id="icloud-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#9CA3AF" />
        <stop offset="100%" stopColor="#4B5563" />
      </linearGradient>
    </defs>
    <path
      d="M17.5 19a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.4 9.04 4 4 0 0 0 6.5 17H17.5Z"
      fill="url(#icloud-grad)"
    />
  </svg>
);

export const PCloudIcon: JSX.Element = (
  <svg {...baseSvgProps} aria-hidden focusable="false">
    <path
      d="M17 18a4 4 0 0 0 .8-7.92A6 6 0 0 0 6.2 9.05 4 4 0 0 0 7 17h10Z"
      fill="#19A9DE"
    />
    <text
      x="12"
      y="15.5"
      textAnchor="middle"
      fontFamily="Inter, Arial, sans-serif"
      fontWeight="800"
      fontSize="9"
      fill="#fff"
    >
      p
    </text>
  </svg>
);

export const MegaIcon: JSX.Element = (
  <svg {...baseSvgProps} aria-hidden focusable="false">
    <circle cx="12" cy="12" r="10" fill="#D9272E" />
    <path
      d="M6 16V8.5L9.5 12.5 12 9.5 14.5 12.5 18 8.5V16h-2.2v-3.6L14 14.4l-2-2.3-2 2.3-1.8-2V16Z"
      fill="#fff"
    />
  </svg>
);

export const SyncIcon: JSX.Element = (
  <svg {...baseSvgProps} aria-hidden focusable="false">
    <circle cx="12" cy="12" r="10" fill="#1D9BF0" />
    <path
      d="M8 11a4 4 0 0 1 7-2.6V7h1.5v3.5H13V9h1.4A2.5 2.5 0 0 0 9.5 11Zm8 2a4 4 0 0 1-7 2.6V17H7.5v-3.5H11V15H9.6A2.5 2.5 0 0 0 14.5 13Z"
      fill="#fff"
    />
  </svg>
);

export const YandexDiskIcon: JSX.Element = (
  <svg {...baseSvgProps} aria-hidden focusable="false">
    <circle cx="12" cy="12" r="10" fill="#FFCC00" />
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fontFamily="Inter, Arial, sans-serif"
      fontWeight="800"
      fontSize="13"
      fill="#000"
    >
      Я
    </text>
  </svg>
);

export const SpannedLogoMark: JSX.Element = (
  <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sd-mark" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7dd3fc" />
        <stop offset="55%" stopColor="#0ea5e9" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="36" height="36" rx="11" fill="url(#sd-mark)" />
    <path
      d="M13 14h10a4 4 0 0 1 0 8H17a4 4 0 0 0 0 8h10"
      stroke="#fff"
      strokeWidth="2.6"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="13" cy="14" r="2" fill="#fff" />
    <circle cx="27" cy="30" r="2" fill="#fff" />
  </svg>
);
