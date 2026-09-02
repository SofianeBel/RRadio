import React, { useEffect, useState } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  color: string;
  barCount?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  color,
  barCount = 24
}) => {
  const [heights, setHeights] = useState<number[]>(() => Array(barCount).fill(4));

  useEffect(() => {
    if (!isPlaying) {
      setHeights(Array(barCount).fill(3));
      return;
    }

    const interval = setInterval(() => {
      setHeights(
        Array.from({ length: barCount }, (_, i) => {
          // Dynamic bell curve distribution for realistic sound spectrum
          const centerFactor = 1 - Math.abs(i - barCount / 2) / (barCount / 2);
          const base = 6 + centerFactor * 14;
          const randomFactor = Math.random() * (12 + centerFactor * 18);
          return Math.floor(base + randomFactor);
        })
      );
    }, 80);

    return () => clearInterval(interval);
  }, [isPlaying, barCount]);

  return (
    <div className="flex items-end justify-center gap-[3px] h-8 px-2">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-t-sm transition-all duration-75"
          style={{
            height: `${h}px`,
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}88`
          }}
        />
      ))}
    </div>
  );
};
