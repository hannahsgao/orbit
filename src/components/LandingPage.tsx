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
        overflow: 'hidden',
      }}
    >
      {/* Rolling cowplanets background animation */}
      {Array.from({ length: 6 }).map((_, i) => (
        <img
          key={i}
          src="/src/assets/planets/cowplanet.png"
          alt="Rolling Cow Planet"
          style={{
            position: 'absolute',
            width: '60px',
            height: '60px',
            top: `${20 + (i * 15)}%`,
            left: '-100px',
            animation: `rollAcross${i} ${8 + (i * 2)}s linear infinite`,
            animationDelay: `${i * 1.5}s`,
            opacity: 0.6,
            filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.2))',
            zIndex: 1,
          }}
        />
      ))}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes rollAcross0 {
            0% { transform: translateX(-100px) rotate(0deg); }
            100% { transform: translateX(calc(100vw + 100px)) rotate(360deg); }
          }
          @keyframes rollAcross1 {
            0% { transform: translateX(-100px) rotate(0deg); }
            100% { transform: translateX(calc(100vw + 100px)) rotate(360deg); }
          }
          @keyframes rollAcross2 {
            0% { transform: translateX(-100px) rotate(0deg); }
            100% { transform: translateX(calc(100vw + 100px)) rotate(360deg); }
          }
          @keyframes rollAcross3 {
            0% { transform: translateX(-100px) rotate(0deg); }
            100% { transform: translateX(calc(100vw + 100px)) rotate(360deg); }
          }
          @keyframes rollAcross4 {
            0% { transform: translateX(-100px) rotate(0deg); }
            100% { transform: translateX(calc(100vw + 100px)) rotate(360deg); }
          }
          @keyframes rollAcross5 {
            0% { transform: translateX(-100px) rotate(0deg); }
            100% { transform: translateX(calc(100vw + 100px)) rotate(360deg); }
          }
          
          .milky-way-title {
            font-family: 'Comic Sans MS', cursive, sans-serif !important;
            font-weight: bold !important;
            text-shadow: 
              0 0 25px rgba(255, 255, 255, 0.7),
              0 0 50px rgba(255, 255, 255, 0.5),
              0 0 75px rgba(255, 255, 255, 0.3),
              3px 3px 6px rgba(0, 0, 0, 0.4) !important;
            filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5)) !important;
            letter-spacing: 0.05em !important;
          }
          
          .subtitle-text {
            font-family: 'Comic Sans MS', cursive, sans-serif !important;
            font-weight: bold !important;
            text-shadow: 
              0 0 20px rgba(255, 255, 255, 0.5),
              0 0 40px rgba(255, 255, 255, 0.3),
              2px 2px 4px rgba(0, 0, 0, 0.3) !important;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4)) !important;
          }
          
          .logo-hover:hover {
            transform: perspective(400px) rotateX(15deg) rotateY(-5deg) scale(1.1) !important;
            transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
            filter: drop-shadow(0 0 40px rgba(255, 255, 255, 0.5)) !important;
          }
          
          .enter-button {
            font-family: 'Comic Sans MS', cursive, sans-serif !important;
            font-weight: bold !important;
            background: none !important;
            border: none !important;
            color: white !important;
            padding: 0 !important;
            font-size: 1.5rem !important;
            text-transform: uppercase !important;
            letter-spacing: 0.1em !important;
            cursor: pointer !important;
            text-shadow: 
              0 0 15px rgba(255, 255, 255, 0.8),
              0 0 30px rgba(255, 255, 255, 0.6),
              0 0 45px rgba(255, 255, 255, 0.4),
              0 0 60px rgba(255, 255, 255, 0.2) !important;
            filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3)) !important;
            transition: all 0.3s ease !important;
          }
          
          .enter-button:hover {
            transform: scale(1.1) !important;
            text-shadow: 
              0 0 20px rgba(255, 255, 255, 1),
              0 0 40px rgba(255, 255, 255, 0.8),
              0 0 60px rgba(255, 255, 255, 0.6),
              0 0 80px rgba(255, 255, 255, 0.4) !important;
            filter: drop-shadow(0 0 30px rgba(255, 255, 255, 0.6)) !important;
          }
        `
      }} />
      {/* Logo */}
      <img
        className="logo-hover"
        src="/src/assets/cows/stupidcow.png"
        alt="Stupid Cow Logo"
        style={{
          width: 'clamp(150px, 20vw, 300px)',
          height: 'clamp(150px, 20vw, 300px)',
          marginBottom: '2rem',
          filter: 'drop-shadow(0 0 30px rgba(255, 255, 255, 0.3))',
          zIndex: 10,
          position: 'relative',
        }}
      />

      {/* Main title */}
      <div
        className="milky-way-title"
        style={{
          fontSize: 'clamp(2.5rem, 8vw, 5rem)',
          fontWeight: '300',
          textTransform: 'uppercase',
          letterSpacing: '0.4em',
          marginBottom: '3rem',
          zIndex: 10,
          position: 'relative',
        }}
      >
        MILKY WAY
      </div>

      {/* Subtitle */}
      <div
        className="subtitle-text"
        style={{
          fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontWeight: '300',
          marginBottom: '4rem',
          zIndex: 10,
          position: 'relative',
        }}
      >
        Your story, mapped in the stars.
      </div>

      {/* Enter button */}
      <button
        className="enter-button"
        onClick={onEnter}
      >
        {'>'} Enter
      </button>
    </div>
  );
}
