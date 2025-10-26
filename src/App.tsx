import { useState, useEffect } from 'react';
import { OrbitSystem } from './components/OrbitSystem';

export default function App() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <div className="absolute inset-0">
        {/* Starfield background - retro style */}
        {Array.from({ length: 150 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-white"
            style={{
              width: Math.random() > 0.7 ? '2px' : '1px',
              height: Math.random() > 0.7 ? '2px' : '1px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              opacity: Math.random() > 0.5 ? 1 : 0.5
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-8 pointer-events-none">
        <div className="text-center mb-8">
          <h1 className="text-white mb-2" style={{ fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            Dithered Planets
          </h1>
          <p className="text-white opacity-75" style={{ fontFamily: 'monospace' }}>
            {'>'} Left-click planets to spawn satellites | Cmd+click to select | Cmd+drag for multi-select | Double-click to reset zoom | +/- keys to zoom
          </p>
        </div>
      </div>

      <OrbitSystem 
        centerX={dimensions.width / 2} 
        centerY={dimensions.height / 2} 
      />
    </div>
  );
}
