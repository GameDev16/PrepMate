import React from 'react';

// SuperHi Decorative Paper-Cut Shape System
// Flat oversized geometric primitives with 0px radius, zero shadow, rotated -15° to +15°, sitting at z-0 behind content spilling off viewport.

export function FloatingShapes({ variant = 'default' }) {
  if (variant === 'hero') {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Large Marker Red Semicircle top-right spilling off page */}
        <div className="absolute -top-20 -right-20 w-[420px] h-[420px] text-marker-red transform rotate-[12deg] opacity-90">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
            <path d="M 10,90 A 40,40 0 0,1 90,90 Z" />
          </svg>
        </div>

        {/* Hi-Yellow Pentagon left side */}
        <div className="absolute top-28 -left-28 w-[380px] h-[380px] text-hi-yellow transform -rotate-[14deg] opacity-90">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
            <polygon points="50,5 95,38 78,92 22,92 5,38" />
          </svg>
        </div>

        {/* Jelly Green Triangle bottom-left */}
        <div className="absolute -bottom-32 left-16 w-[360px] h-[360px] text-jelly-green transform rotate-[8deg] opacity-85">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
            <polygon points="50,10 95,90 5,90" />
          </svg>
        </div>

        {/* Powder Sky Circle right-bottom */}
        <div className="absolute bottom-12 -right-24 w-[340px] h-[340px] text-powder-sky transform -rotate-[6deg] opacity-90">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
            <circle cx="50" cy="50" r="45" />
          </svg>
        </div>

        {/* Bubblegum Pink Star center-right */}
        <div className="absolute top-1/3 right-[15%] w-[220px] h-[220px] text-bubblegum transform rotate-[15deg] opacity-85">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
            <polygon points="50,5 63,35 95,38 71,60 78,92 50,75 22,92 29,60 5,38 37,35" />
          </svg>
        </div>

        {/* Sunbeam Pentagon top-center behind hero */}
        <div className="absolute -top-16 left-[35%] w-[260px] h-[260px] text-sunbeam transform -rotate-[10deg] opacity-80">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
            <polygon points="50,5 95,38 78,92 22,92 5,38" />
          </svg>
        </div>
      </div>
    );
  }

  // Default scattered cutout shapes for standard pages
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Hi-Yellow Pentagon top right */}
      <div className="absolute -top-24 -right-16 w-[320px] h-[320px] text-hi-yellow transform rotate-[14deg] opacity-90">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
          <polygon points="50,5 95,38 78,92 22,92 5,38" />
        </svg>
      </div>

      {/* Jelly Green Triangle middle left */}
      <div className="absolute top-1/2 -left-20 w-[280px] h-[280px] text-jelly-green transform -rotate-[12deg] opacity-85">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
          <polygon points="50,10 95,90 5,90" />
        </svg>
      </div>

      {/* Powder Sky Circle bottom right */}
      <div className="absolute -bottom-24 right-10 w-[300px] h-[300px] text-powder-sky transform rotate-[7deg] opacity-90">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
          <circle cx="50" cy="50" r="45" />
        </svg>
      </div>

      {/* Bubblegum Star top left */}
      <div className="absolute top-12 left-10 w-[200px] h-[200px] text-bubblegum transform -rotate-[15deg] opacity-80">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
          <polygon points="50,5 63,35 95,38 71,60 78,92 50,75 22,92 29,60 5,38 37,35" />
        </svg>
      </div>

      {/* Marker Red Semicircle bottom center */}
      <div className="absolute -bottom-16 left-[40%] w-[260px] h-[260px] text-marker-red transform -rotate-[9deg] opacity-85">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
          <path d="M 10,90 A 40,40 0 0,1 90,90 Z" />
        </svg>
      </div>
    </div>
  );
}

export function GridPattern() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 opacity-25">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--frost) 1px, transparent 1px),
            linear-gradient(to bottom, var(--frost) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}

export function DotPattern() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, var(--ink) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
}

export default FloatingShapes;
