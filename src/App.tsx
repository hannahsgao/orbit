import { useState, useEffect } from 'react';
import { OrbitSystem } from './components/OrbitSystem';
import { BouncingCow } from './components/BouncingCow';

export default function App() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Start fade-out after 1.5 seconds
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1500);

    // Complete loading after fade completes
    const loadTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 3300); // 1.5s + 1.8s fade duration

    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(fadeTimer);
      clearTimeout(loadTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Clean cinematic loading overlay */}
      {!isLoaded && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: '#000000',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: 'monospace',
            opacity: isFadingOut ? 0 : 1,
            transition: 'opacity 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          {/* Main title */}
          <div
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 5rem)',
              fontWeight: '300',
              textTransform: 'uppercase',
              letterSpacing: '0.4em',
              marginBottom: '3rem',
              opacity: isFadingOut ? 0 : 1,
              transition: 'opacity 1.2s ease-out 0.3s',
            }}
          >
            MILKY WAY
          </div>
          
          {/* Subtitle */}
          <div
            style={{
              fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
              opacity: 0.4,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontWeight: '300',
            }}
          >
            {'>'} INITIALIZING SOLAR SYSTEM...
          </div>
        </div>
      )}

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
  );
}
