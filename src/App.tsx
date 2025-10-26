import { useState, useEffect } from 'react';
import { OrbitSystem } from './components/OrbitSystem';
import { BouncingCow } from './components/BouncingCow';
import { LandingPage } from './components/LandingPage';

export default function App() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hasEnteredSolarSystem, setHasEnteredSolarSystem] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSolarSystem, setShowSolarSystem] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const handleEnter = () => {
    setIsTransitioning(true);

    // Start showing solar system content after landing page begins fading
    setTimeout(() => {
      setShowSolarSystem(true);
    }, 600);

    // Complete transition
    setTimeout(() => {
      setHasEnteredSolarSystem(true);
      setIsTransitioning(false);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Landing page with fade out */}
      {!hasEnteredSolarSystem && (
        <div
          style={{
            opacity: isTransitioning ? 0 : 1,
            transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: isTransitioning ? 'none' : 'auto',
          }}
        >
          <LandingPage onEnter={handleEnter} />
        </div>
      )}

      {/* Solar system with fade in */}
      {(showSolarSystem || hasEnteredSolarSystem) && (
        <div
          style={{
            opacity: showSolarSystem ? 1 : 0,
            transform: showSolarSystem ? 'scale(1)' : 'scale(1.05)',
            transition: 'opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1), transform 2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div className="min-h-screen bg-black overflow-hidden">
      {/* Main content */}
      <div className="absolute inset-0">
        {/* Starfield background */}
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
          <p className="text-white opacity-75" style={{ fontFamily: 'monospace' }}>
            {'>'} Left-click planets to spawn satellites | Cmd+click to select | Cmd+drag for multi-select | Double-click to reset zoom | Click outside to zoom out | +/- keys to zoom
          </p>
        </div>
      </div>

      <OrbitSystem 
        centerX={dimensions.width / 2} 
        centerY={dimensions.height / 2} 
      />

      <BouncingCow
        containerWidth={dimensions.width}
        containerHeight={dimensions.height}
      />
          </div>
        </div>
      )}
    </div>
  );
}
