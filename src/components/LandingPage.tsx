interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'monospace',
        zIndex: 10000,
      }}
    >
      {/* Logo */}
      <img
        src="/src/assets/planets/cowplanet.png"
        alt="Cow Planet Logo"
        style={{
          width: 'clamp(150px, 20vw, 300px)',
          height: 'clamp(150px, 20vw, 300px)',
          marginBottom: '2rem',
          filter: 'drop-shadow(0 0 30px rgba(255, 255, 255, 0.3))',
        }}
      />

      {/* Main title */}
      <div
        style={{
          fontSize: 'clamp(2.5rem, 8vw, 5rem)',
          fontWeight: '300',
          textTransform: 'uppercase',
          letterSpacing: '0.4em',
          marginBottom: '3rem',
          textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
        }}
      >
        MILKY WAY
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontWeight: '300',
          marginBottom: '4rem',
        }}
      >
        Interactive Solar System Explorer
      </div>

      {/* Enter button */}
      <button
        onClick={onEnter}
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '2px solid rgba(255, 255, 255, 0.5)',
          color: 'white',
          padding: '1rem 3rem',
          fontSize: '1.2rem',
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {'>'} Enter
      </button>
    </div>
  );
}
