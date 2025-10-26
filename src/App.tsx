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
  const [connectedSources, setConnectedSources] = useState<Set<string>>(new Set());
  const [lastThemeCount, setLastThemeCount] = useState(0);

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
  const loadThemes = async (showNotification = false) => {
    setIsLoadingThemes(true);
    setThemesError(null);

    try {
      const userId = 'user-current'; // Use consistent user ID
      const tree = await fetchAndConvertThemes(userId);

      if (tree.nodes.length > 0) {
        const newThemeCount = tree.nodes.length;
        const hadNewThemes = newThemeCount > lastThemeCount;
        
        setPersonalityTree(tree);
        setLastThemeCount(newThemeCount);
        
        // Track which sources are connected
        const sources = new Set<string>();
        tree.nodes.forEach(node => {
          if (node.dataSources.spotify) sources.add('spotify');
          if (node.dataSources.gmail) sources.add('gmail');
          if (node.dataSources.search) sources.add('search');
        });
        setConnectedSources(sources);
        
        console.log('Loaded personality tree with', newThemeCount, 'themes from', Array.from(sources).join(', '));
        
        // Show notification if requested and new themes were added
        if (showNotification && hadNewThemes && lastThemeCount > 0) {
          const addedCount = newThemeCount - lastThemeCount;
          console.log(`✨ Added ${addedCount} new theme${addedCount > 1 ? 's' : ''}!`);
        }
      } else {
        // Silently fail if no themes - user might not have connected yet
        console.log('No themes found yet - waiting for data sources');
      }
    } catch (error) {
      console.error('Error loading themes:', error);
      setThemesError('Failed to load themes');
    } finally {
      setIsLoadingThemes(false);
    }
  };

  // Auto-load themes when entering solar system (one-time)
  useEffect(() => {
    if (hasEnteredSolarSystem && !personalityTree && !isLoadingThemes) {
      // Wait a bit for any OAuth redirects to complete, then try loading
      const timer = setTimeout(() => {
        loadThemes();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [hasEnteredSolarSystem]);

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
          Data Sources
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <ConnectionButton href="http://127.0.0.1:5173/spotify/connect">
            {connectedSources.has('spotify') ? '✓ Spotify' : 'Spotify'}
          </ConnectionButton>
          <ConnectionButton href="http://127.0.0.1:5173/gmail/connect">
            {connectedSources.has('gmail') ? '✓ Gmail' : 'Gmail'}
          </ConnectionButton>
          <ConnectionButton href="">
            {connectedSources.has('search') ? '✓ Search' : 'Google Search'}
          </ConnectionButton>
        </div>
        
        {/* Manual refresh button */}
        {personalityTree && (
          <button
            onClick={() => loadThemes(true)}
            disabled={isLoadingThemes}
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              cursor: isLoadingThemes ? 'wait' : 'pointer',
              opacity: isLoadingThemes ? 0.5 : 1,
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isLoadingThemes) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
          >
            {isLoadingThemes ? 'Refreshing...' : '↻ Refresh'}
          </button>
        )}

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
            {'>'} Analyzing connected sources...
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
            {'>'} Connect data sources to begin
          </div>
        )}

        {personalityTree && !isLoadingThemes && (
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              marginTop: '0.5rem',
              padding: '0.5rem',
              background: 'rgba(29, 185, 84, 0.1)',
              border: '1px solid rgba(29, 185, 84, 0.3)',
              borderRadius: '4px',
            }}
          >
            <div style={{ color: '#1DB954', marginBottom: '0.25rem' }}>
              ✓ {personalityTree.nodes.length} themes active
            </div>
            {connectedSources.size > 0 && (
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem' }}>
                Sources: {Array.from(connectedSources).join(', ')}
              </div>
            )}
          </div>
        )}
        
        {/* Hint about connecting more sources */}
        {personalityTree && !isLoadingThemes && connectedSources.size < 3 && (
          <div
            style={{
              color: 'rgba(255, 255, 255, 0.4)',
              fontFamily: 'monospace',
              fontSize: '0.65rem',
              marginTop: '0.5rem',
              padding: '0.5rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              fontStyle: 'italic',
            }}
          >
            Connect more sources, then click Refresh
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
