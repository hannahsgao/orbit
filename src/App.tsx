import { useState, useEffect } from 'react';
import { OrbitSystem } from './components/OrbitSystem';
import { BouncingCow } from './components/BouncingCow';
import { LandingPage } from './components/LandingPage';
import { ConnectionButton } from './components/ConnectionButton';
import { fetchAndConvertThemes } from './utils/themesToPersonality';
import { PersonalityTree } from './types/personality';
// Uncomment to use example personality tree:
// import { examplePersonalityTree } from './data/examplePersonality';

export default function App() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hasEnteredSolarSystem, setHasEnteredSolarSystem] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSolarSystem, setShowSolarSystem] = useState(false);
  const [personalityTree, setPersonalityTree] = useState<PersonalityTree | undefined>(undefined);
  const [isLoadingThemes, setIsLoadingThemes] = useState(false);
  const [themesError, setThemesError] = useState<string | null>(null);

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

  // Function to load themes from backend
  const loadThemes = async () => {
    setIsLoadingThemes(true);
    setThemesError(null);

    try {
      const userId = 'user-' + Date.now(); // Generate a unique user ID (or use real user auth)
      const tree = await fetchAndConvertThemes(userId);

      if (tree.nodes.length > 0) {
        setPersonalityTree(tree);
        console.log('Loaded personality tree with', tree.nodes.length, 'themes');
      } else {
        // Silently fail if no themes - user might not have connected yet
        console.log('No themes found yet');
      }
    } catch (error) {
      console.error('Error loading themes:', error);
      // Don't show error to user on auto-load
    } finally {
      setIsLoadingThemes(false);
    }
  };

  // Auto-load themes when entering solar system
  useEffect(() => {
    if (hasEnteredSolarSystem && !personalityTree && !isLoadingThemes) {
      // Wait a bit for any OAuth redirects to complete, then try loading
      const timer = setTimeout(() => {
        loadThemes();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [hasEnteredSolarSystem]);

  // Poll for new themes periodically (only if user has connected but themes haven't loaded yet)
  useEffect(() => {
    if (!hasEnteredSolarSystem || personalityTree) return;

    const interval = setInterval(() => {
      // Only poll if we don't have themes yet
      if (!personalityTree && !isLoadingThemes) {
        console.log('Checking for new data...');
        loadThemes();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [hasEnteredSolarSystem, personalityTree, isLoadingThemes]);

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

      {/* Connection buttons in top left */}
      <div className="absolute top-8 left-8 z-50 flex flex-col gap-3 pointer-events-auto">
        <div
          style={{
            color: 'white',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            opacity: 0.75,
            marginTop: '1.5rem',
            marginLeft: '1.5rem',
            marginBottom: '0.5rem',
          }}
        >
          Connections
        </div>
        <ConnectionButton href="http://127.0.0.1:5173/spotify/connect">Spotify</ConnectionButton>
        <ConnectionButton href="http://127.0.0.1:5173/gmail/connect">Gmail</ConnectionButton>
        <ConnectionButton href="">Google Search</ConnectionButton>

        {/* Status Messages */}
        {isLoadingThemes && (
          <div
            style={{
              color: 'white',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              marginTop: '0.5rem',
              padding: '0.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '4px',
            }}
          >
            {'>'} Fetching data & analyzing...
          </div>
        )}

        {!isLoadingThemes && !personalityTree && (
          <div
            style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              marginTop: '0.5rem',
              padding: '0.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
            }}
          >
            {'>'} Waiting for data sources...
          </div>
        )}

        {personalityTree && !isLoadingThemes && (
          <div
            style={{
              color: '#1DB954',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              marginTop: '0.5rem',
              padding: '0.5rem',
              background: 'rgba(29, 185, 84, 0.1)',
              border: '1px solid rgba(29, 185, 84, 0.3)',
              borderRadius: '4px',
            }}
          >
            ✓ {personalityTree.nodes.length} themes discovered
          </div>
        )}
      </div>

      <OrbitSystem
        centerX={dimensions.width / 2}
        centerY={dimensions.height / 2}
        personalityTree={personalityTree}
        // To use example data instead: personalityTree={examplePersonalityTree}
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
