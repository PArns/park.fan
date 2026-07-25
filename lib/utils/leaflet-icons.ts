'use client';

import L from 'leaflet';

// Fix for default marker icons in Next.js.
// Runs once at module scope, before any importer renders a marker.
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons for different entity types
const createIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 25px; height: 25px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><div style="transform: rotate(45deg); width: 100%; height: 100%;"></div></div>`,
    iconSize: [25, 25],
    iconAnchor: [12, 25],
    popupAnchor: [0, -25],
  });
};

export const parkIcon = createIcon('#3b82f6'); // blue
export const attractionOperatingIcon = createIcon('#10b981'); // green
export const attractionClosedIcon = createIcon('#ef4444'); // red
export const showIcon = createIcon('#a855f7'); // purple
export const restaurantIcon = createIcon('#f97316'); // orange

// Custom eye-catching user location icon with pulsing animation
export const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div style="position: relative; width: 40px; height: 40px; z-index: 1000;">
    <style>
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.4; }
        50% { transform: scale(1.3); opacity: 0.1; }
      }
    </style>
    <div style="position: absolute; width: 40px; height: 40px; background: radial-gradient(circle, #3b82f6 0%, #2563eb 100%); border-radius: 50%; animation: pulse 2s ease-in-out infinite;"></div>
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 16px; height: 16px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border: 3px solid white; border-radius: 50%; box-shadow: 0 3px 8px rgba(0,0,0,0.4);"></div>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});
