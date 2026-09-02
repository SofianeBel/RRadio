import React from 'react';

interface BackgroundViewProps {
  mode: 'gameplay' | 'neon' | 'transparent';
}

export const BackgroundView: React.FC<BackgroundViewProps> = ({ mode }) => {
  // Pure Transparent Overlay Mode: Return nothing so Windows/Games are 100% visible
  if (mode === 'transparent') {
    return null;
  }

  if (mode === 'neon') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-[#0F051D] via-[#2A0845] to-[#FF007F] pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-t from-[#FFD600] to-[#FF007F] blur-2xl opacity-40" />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 42, 133, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.4) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            transform: 'perspective(400px) rotateX(60deg) translateY(120px)'
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>
    );
  }

  // Gameplay simulation backdrop (for browser testing)
  return (
    <div className="absolute inset-0 overflow-hidden bg-zinc-950 pointer-events-none">
      <div
        className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-1000 ease-out"
        style={{
          backgroundImage: `url('/extracted_frames/clean_gameplay.png')`,
          filter: 'brightness(0.9) contrast(1.05)'
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: '100% 3px'
        }}
      />
    </div>
  );
};
