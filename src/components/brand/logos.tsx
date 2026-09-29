import React from 'react';
import { CraftLogoId } from '../../types/index.js';

export interface CraftLogoMeta {
  id: CraftLogoId;
  name: string;
  concept: string;
  category: string;
  description: string;
  badge: string;
}

export const CRAFT_LOGOS: CraftLogoMeta[] = [
  {
    id: 'logo-1',
    name: 'Craft AI Logo 1',
    concept: 'Nexus Core',
    category: 'Modern AI Symbol',
    description: 'Precision hexagonal neural nexus with an energetic diamond core and dynamic orbital nodes.',
    badge: 'Nexus',
  },
  {
    id: 'logo-2',
    name: 'Craft AI Logo 2',
    concept: 'Artisan Weave',
    category: 'Abstract Craft Symbol',
    description: 'Interlocking dual-ribbon Mobius craft prism with an artisan spark at the focal intersection.',
    badge: 'Artisan',
  },
  {
    id: 'logo-3',
    name: 'Craft AI Logo 3',
    concept: 'Isometric Lattice',
    category: 'Geometric AI Symbol',
    description: 'Architectural isometric hypercube matrix with glowing neural conduits and dimensional depth.',
    badge: 'Lattice',
  },
  {
    id: 'logo-4',
    name: 'Craft AI Logo 4',
    concept: 'Kinetic Aperture',
    category: 'Minimal Futuristic',
    description: 'Ultra-minimal dual aerodynamic arcs revolving in kinetic balance around a quantum singularity.',
    badge: 'Kinetic',
  },
  {
    id: 'logo-5',
    name: 'Craft AI Logo 5',
    concept: 'Prism Crest',
    category: 'Premium Technology',
    description: 'Sovereign multi-tiered crystalline chevron crest with crown vertex and golden champagne spark.',
    badge: 'Crest',
  },
];

interface RenderLogoOptions {
  logoId: CraftLogoId;
  isMonochrome?: boolean;
  isDarkTone?: boolean;
  idSuffix?: string;
  variant?: string;
}

/**
 * Renders the internal SVG paths and gradients for the given Craft AI logo.
 */
export function renderLogoContent({
  logoId,
  isMonochrome = false,
  isDarkTone = false,
  idSuffix = 'def',
  variant,
}: RenderLogoOptions) {
  // Gradients for dark vs light vs monochrome
  const g1Start = isMonochrome ? (isDarkTone ? '#0f172a' : '#ffffff') : '#6366f1';
  const g1Mid = isMonochrome ? (isDarkTone ? '#1e293b' : '#f8fafc') : '#4f46e5';
  const g1End = isMonochrome ? (isDarkTone ? '#334155' : '#e2e8f0') : '#06b6d4';

  const g2Start = isMonochrome ? (isDarkTone ? '#334155' : '#cbd5e1') : '#06b6d4';
  const g2End = isMonochrome ? (isDarkTone ? '#64748b' : '#94a3b8') : '#38bdf8';

  const accentColor = isMonochrome ? (isDarkTone ? '#0f172a' : '#ffffff') : '#fbbf24';
  const sparkCenter = isMonochrome ? (isDarkTone ? '#0f172a' : '#ffffff') : '#ffffff';

  switch (logoId) {
    case 'logo-1':
      // Logo 1: Nexus Core - Modern AI Hexagonal Neural Prism
      return (
        <>
          <defs>
            <linearGradient id={`l1_g1_${idSuffix}`} x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={g1Start} />
              <stop offset="50%" stopColor={g1Mid} />
              <stop offset="100%" stopColor={g1End} />
            </linearGradient>
            <linearGradient id={`l1_g2_${idSuffix}`} x1="16" y1="14" x2="32" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={g2Start} />
              <stop offset="100%" stopColor={g1Start} />
            </linearGradient>
          </defs>
          {variant === 'app-icon' && <rect width="48" height="48" rx="14" fill="#090d16" />}
          {/* Hexagonal Outer Frame */}
          <path
            d="M24 6L39 14.8V33.2L24 42L9 33.2V14.8L24 6Z"
            stroke={`url(#l1_g1_${idSuffix})`}
            strokeWidth="3.2"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Internal Faceted Neural Core */}
          <path
            d="M24 14L33 24L24 34L15 24L24 14Z"
            fill={`url(#l1_g2_${idSuffix})`}
            fillOpacity={isMonochrome ? 0.8 : 0.85}
          />
          {/* Vertex Connectivity Conduits */}
          <line x1="24" y1="6" x2="24" y2="14" stroke={`url(#l1_g1_${idSuffix})`} strokeWidth="2.2" strokeLinecap="round" />
          <line x1="39" y1="24" x2="33" y2="24" stroke={`url(#l1_g1_${idSuffix})`} strokeWidth="2.2" strokeLinecap="round" />
          <line x1="24" y1="42" x2="24" y2="34" stroke={`url(#l1_g1_${idSuffix})`} strokeWidth="2.2" strokeLinecap="round" />
          <line x1="9" y1="24" x2="15" y2="24" stroke={`url(#l1_g1_${idSuffix})`} strokeWidth="2.2" strokeLinecap="round" />
          {/* Center Quantum Spark Dot */}
          <circle cx="24" cy="24" r="3.2" fill={sparkCenter} />
          <circle cx="24" cy="24" r="1.5" fill={accentColor} />
        </>
      );

    case 'logo-2':
      // Logo 2: Artisan Weave - Abstract Craft & AI Infinity Ribbon
      return (
        <>
          <defs>
            <linearGradient id={`l2_g1_${idSuffix}`} x1="8" y1="10" x2="40" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={isMonochrome ? g1Start : '#8b5cf6'} />
              <stop offset="50%" stopColor={g1Mid} />
              <stop offset="100%" stopColor={g1End} />
            </linearGradient>
            <linearGradient id={`l2_g2_${idSuffix}`} x1="20" y1="12" x2="36" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={accentColor} />
              <stop offset="100%" stopColor={isMonochrome ? g2End : '#f43f5e'} />
            </linearGradient>
          </defs>
          {variant === 'app-icon' && <rect width="48" height="48" rx="14" fill="#090d16" />}
          {/* Primary Sweeping Craft Loop ("C" Silhouette) */}
          <path
            d="M34 13C31 10 26.5 8.5 22 9C14.5 9.8 8.8 16 9 23.5C9.2 31 15.5 37 23 37C27.5 37 31.5 35 34 32L29.5 28C28 29.8 25.5 31 23 31C18.5 31 15 27.5 15 23C15 18.5 18.5 15 23 15C25.5 15 28 16.2 29.5 18L34 13Z"
            fill={`url(#l2_g1_${idSuffix})`}
          />
          {/* Interlocking Artisan Wing / Facet */}
          <path
            d="M26 19L37 15L39 24L30 26L26 19Z"
            fill={`url(#l2_g2_${idSuffix})`}
            fillOpacity={0.9}
          />
          <path
            d="M26 29L37 33L39 24L30 22L26 29Z"
            fill={`url(#l2_g1_${idSuffix})`}
            fillOpacity={0.8}
          />
          {/* Core Star Node */}
          <circle cx="28" cy="24" r="3" fill={sparkCenter} />
          <polygon
            points="28,21 29,23.5 31.5,24 29,24.5 28,27 27,24.5 24.5,24 27,23.5"
            fill={accentColor}
          />
        </>
      );

    case 'logo-3':
      // Logo 3: Isometric Lattice - Geometric 3D Hypercube
      return (
        <>
          <defs>
            <linearGradient id={`l3_top_${idSuffix}`} x1="10" y1="15" x2="38" y2="15" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={isMonochrome ? g1Mid : '#38bdf8'} />
              <stop offset="100%" stopColor={isMonochrome ? g1End : '#0284c7'} />
            </linearGradient>
            <linearGradient id={`l3_left_${idSuffix}`} x1="10" y1="15" x2="24" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={isMonochrome ? g1Start : '#4f46e5'} />
              <stop offset="100%" stopColor={isMonochrome ? g1Mid : '#312e81'} />
            </linearGradient>
            <linearGradient id={`l3_right_${idSuffix}`} x1="24" y1="24" x2="38" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={isMonochrome ? g2Start : '#818cf8'} />
              <stop offset="100%" stopColor={isMonochrome ? g2End : '#6366f1'} />
            </linearGradient>
          </defs>
          {variant === 'app-icon' && <rect width="48" height="48" rx="14" fill="#090d16" />}
          {/* Isometric Top Face */}
          <polygon points="24,7 38,15 24,23 10,15" fill={`url(#l3_top_${idSuffix})`} />
          {/* Isometric Left Face */}
          <polygon points="10,15 24,23 24,39 10,31" fill={`url(#l3_left_${idSuffix})`} />
          {/* Isometric Right Face */}
          <polygon points="24,23 38,15 38,31 24,39" fill={`url(#l3_right_${idSuffix})`} />
          {/* Architectural Conduits & Neural Inset Lines */}
          <line x1="24" y1="7" x2="24" y2="23" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.4" />
          <line x1="10" y1="15" x2="24" y2="23" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.5" />
          <line x1="38" y1="15" x2="24" y2="23" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.3" />
          <line x1="24" y1="23" x2="24" y2="39" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.6" />
          {/* Center Lattice Node */}
          <circle cx="24" cy="23" r="3.2" fill={sparkCenter} />
          <circle cx="24" cy="23" r="1.5" fill={accentColor} />
        </>
      );

    case 'logo-4':
      // Logo 4: Kinetic Aperture - Minimal Futuristic Orbital
      return (
        <>
          <defs>
            <linearGradient id={`l4_g1_${idSuffix}`} x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={isMonochrome ? g1Start : '#0ea5e9'} />
              <stop offset="60%" stopColor={isMonochrome ? g1Mid : '#06b6d4'} />
              <stop offset="100%" stopColor={isMonochrome ? g1End : '#10b981'} />
            </linearGradient>
            <linearGradient id={`l4_g2_${idSuffix}`} x1="40" y1="40" x2="8" y2="8" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={isMonochrome ? g2Start : '#6366f1'} />
              <stop offset="100%" stopColor={isMonochrome ? g2End : '#a855f7'} />
            </linearGradient>
          </defs>
          {variant === 'app-icon' && <rect width="48" height="48" rx="14" fill="#090d16" />}
          {/* Primary Ascending Aerodynamic Arc */}
          <path
            d="M24 7C33.3888 7 41 14.6112 41 24C41 27.5 39.9 30.7 38 33.4L33.6 29.8C34.5 28.1 35 26.1 35 24C35 17.9249 30.0751 13 24 13C21.9 13 19.9 13.5 18.2 14.4L14.6 10C17.3 8.1 20.5 7 24 7Z"
            fill={`url(#l4_g1_${idSuffix})`}
          />
          {/* Secondary Descending Aerodynamic Arc */}
          <path
            d="M24 41C14.6112 41 7 33.3888 7 24C7 20.5 8.1 17.3 10 14.6L14.4 18.2C13.5 19.9 13 21.9 13 24C13 30.0751 17.9249 35 24 35C26.1 35 28.1 34.5 29.8 33.6L33.4 38C30.7 39.9 27.5 41 24 41Z"
            fill={`url(#l4_g2_${idSuffix})`}
          />
          {/* Center Quantum Singularity Dot & Ring */}
          <circle cx="24" cy="24" r="5" stroke={`url(#l4_g1_${idSuffix})`} strokeWidth="1.5" fill="none" opacity="0.6" />
          <circle cx="24" cy="24" r="3.2" fill={sparkCenter} />
        </>
      );

    case 'logo-5':
      // Logo 5: Prism Crest - Premium Layered Technology Chevrons
      return (
        <>
          <defs>
            <linearGradient id={`l5_top_${idSuffix}`} x1="12" y1="8" x2="36" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={isMonochrome ? g1Start : '#4f46e5'} />
              <stop offset="50%" stopColor={isMonochrome ? g1Mid : '#06b6d4'} />
              <stop offset="100%" stopColor={isMonochrome ? g1End : '#38bdf8'} />
            </linearGradient>
            <linearGradient id={`l5_mid_${idSuffix}`} x1="10" y1="20" x2="38" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={isMonochrome ? g1Mid : '#4338ca'} />
              <stop offset="100%" stopColor={isMonochrome ? g2Start : '#0284c7'} />
            </linearGradient>
            <linearGradient id={`l5_bot_${idSuffix}`} x1="16" y1="32" x2="32" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={isMonochrome ? g2Start : '#312e81'} />
              <stop offset="100%" stopColor={isMonochrome ? g2End : '#1e1b4b'} />
            </linearGradient>
          </defs>
          {variant === 'app-icon' && <rect width="48" height="48" rx="14" fill="#090d16" />}
          {/* Top Layer Sovereign Chevron */}
          <polygon points="24,7 37,17 24,25 11,17" fill={`url(#l5_top_${idSuffix})`} />
          {/* Mid Layer Chevron */}
          <polygon points="24,21 38,30 24,36 10,30" fill={`url(#l5_mid_${idSuffix})`} />
          {/* Base Anchor Chevron */}
          <polygon points="24,33 33,40 24,43 15,40" fill={`url(#l5_bot_${idSuffix})`} />
          {/* Crown Apex Diamond Star */}
          <polygon
            points="24,4 25.5,6.5 28,7.5 25.5,8.5 24,11 22.5,8.5 20,7.5 22.5,6.5"
            fill={accentColor}
          />
          {/* Center Prism Focal Spark */}
          <circle cx="24" cy="21" r="2.2" fill={sparkCenter} />
        </>
      );

    default:
      return null;
  }
}

/**
 * Returns a standalone clean SVG string suitable for Data URI favicon generation.
 */
export function getLogoSvgString(logoId: CraftLogoId, isLight: boolean = false): string {
  const g1Start = '#6366f1';
  const g1Mid = '#4f46e5';
  const g1End = '#06b6d4';
  const accent = '#fbbf24';
  const white = '#ffffff';

  switch (logoId) {
    case 'logo-1':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><defs><linearGradient id="fav_g1" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="${g1Start}"/><stop offset="50%" stop-color="${g1Mid}"/><stop offset="100%" stop-color="${g1End}"/></linearGradient></defs><rect width="48" height="48" rx="12" fill="#090d16"/><path d="M24 6L39 14.8V33.2L24 42L9 33.2V14.8L24 6Z" stroke="url(#fav_g1)" stroke-width="3.5" stroke-linejoin="round"/><path d="M24 14L33 24L24 34L15 24L24 14Z" fill="url(#fav_g1)"/><circle cx="24" cy="24" r="3" fill="${white}"/></svg>`;

    case 'logo-2':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><defs><linearGradient id="fav_g2" x1="8" y1="10" x2="40" y2="38" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="${g1End}"/></linearGradient></defs><rect width="48" height="48" rx="12" fill="#090d16"/><path d="M34 13C31 10 26.5 8.5 22 9C14.5 9.8 8.8 16 9 23.5C9.2 31 15.5 37 23 37C27.5 37 31.5 35 34 32L29.5 28C28 29.8 25.5 31 23 31C18.5 31 15 27.5 15 23C15 18.5 18.5 15 23 15C25.5 15 28 16.2 29.5 18L34 13Z" fill="url(#fav_g2)"/><circle cx="28" cy="24" r="3" fill="${white}"/></svg>`;

    case 'logo-3':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="12" fill="#090d16"/><polygon points="24,7 38,15 24,23 10,15" fill="#38bdf8"/><polygon points="10,15 24,23 24,39 10,31" fill="#4f46e5"/><polygon points="24,23 38,15 38,31 24,39" fill="#818cf8"/><circle cx="24" cy="23" r="3.2" fill="${white}"/></svg>`;

    case 'logo-4':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><defs><linearGradient id="fav_g4" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#0ea5e9"/><stop offset="100%" stop-color="#10b981"/></linearGradient></defs><rect width="48" height="48" rx="12" fill="#090d16"/><path d="M24 7C33.4 7 41 14.6 41 24C41 27.5 39.9 30.7 38 33.4L33.6 29.8C34.5 28.1 35 26.1 35 24C35 17.9 30.1 13 24 13C21.9 13 19.9 13.5 18.2 14.4L14.6 10C17.3 8.1 20.5 7 24 7Z" fill="url(#fav_g4)"/><circle cx="24" cy="24" r="3.5" fill="${white}"/></svg>`;

    case 'logo-5':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><defs><linearGradient id="fav_g5" x1="12" y1="8" x2="36" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#4f46e5"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient></defs><rect width="48" height="48" rx="12" fill="#090d16"/><polygon points="24,7 37,17 24,25 11,17" fill="url(#fav_g5)"/><polygon points="24,21 38,30 24,36 10,30" fill="#4338ca"/><polygon points="24,4 25.5,6.5 28,7.5 25.5,8.5 24,11 22.5,8.5 20,7.5 22.5,6.5" fill="${accent}"/></svg>`;

    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="12" fill="#090d16"/><circle cx="24" cy="24" r="8" fill="#6366f1"/></svg>`;
  }
}

/**
 * Updates the browser's dynamic favicon element with the chosen logo.
 */
export function updateFavicon(logoId: CraftLogoId) {
  if (typeof document === 'undefined') return;
  try {
    const svgStr = getLogoSvgString(logoId);
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href = dataUri;
  } catch (e) {
    console.warn('Failed to update favicon:', e);
  }
}
