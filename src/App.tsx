import { useState, useEffect } from 'react';
import { OrbitSystem } from './components/OrbitSystem';
import { BouncingCow } from './components/BouncingCow';

export default function App() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTextFadingOut, setIsTextFadingOut] = useState(false);
  const [isOverlayFading, setIsOverlayFading] = useState(false);
  const [blinkOpacity, setBlinkOpacity] = useState(0.7);
  const loadtime = 4000;

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Start text fade-out after 4 blinks (2.0 seconds)
    const textFadeTimer = setTimeout(() => {
      setIsTextFadingOut(true);
    }, 2000);

    // Start overlay fade-out after text is completely gone (4.0 seconds)
    const overlayFadeTimer = setTimeout(() => {
      setIsOverlayFading(true);
    }, loadtime - 1000);

    // Complete loading after overlay fade completes
    const loadTimer = setTimeout(() => {
      setIsLoaded(true);
    }, loadtime); // 4.0s + 1.6s fade duration

    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(textFadeTimer);
      clearTimeout(overlayFadeTimer);
      clearTimeout(loadTimer);
    };
  }, []);

  // Separate effect for blink animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (!isTextFadingOut) {
        setBlinkOpacity(prev => prev === 0.7 ? 0 : 0.7);
      }
    }, 500);

    return () => clearInterval(blinkInterval);
  }, [isTextFadingOut]);

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
            background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: 'monospace',
            opacity: isOverlayFading ? 0 : 1,
            transform: isOverlayFading ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 1.6s cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        >
          {/* Main title with simple fade and glow */}
          <div
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 5rem)',
              fontWeight: '300',
              textTransform: 'uppercase',
              letterSpacing: '0.4em',
              marginBottom: '3rem',
              opacity: isTextFadingOut ? 0 : 1,
              textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
              transition: 'opacity 1s ease-out',
            }}
          >
            MILKY WAY
          </div>
          
          {/* Subtitle with JavaScript blink */}
          <div
            style={{
              fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontWeight: '300',
              opacity: isTextFadingOut ? 0 : blinkOpacity,
              transform: isTextFadingOut ? 'scale(0.8)' : 'scale(1)',
              transition: 'all 1s ease-out',
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
