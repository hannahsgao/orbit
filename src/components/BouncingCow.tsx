import { useState, useEffect } from 'react';
import stupidCow from '../assets/cows/stupidcow.png';

interface BouncingCowProps {
  containerWidth: number;
  containerHeight: number;
}

export function BouncingCow({ containerWidth, containerHeight }: BouncingCowProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [velocity, setVelocity] = useState({ x: 2, y: 2 });
  const [springScale, setSpringScale] = useState(1);

  useEffect(() => {
    const animate = () => {
      setPosition(prev => {
        const newX = prev.x + velocity.x;
        const newY = prev.y + velocity.y;
        
        let newVelX = velocity.x;
        let newVelY = velocity.y;
        
        // Cow dimensions (approximate)
        const cowWidth = 120;
        const cowHeight = 120;
        
        // Bounce off walls
        if (newX <= 0 || newX >= containerWidth - cowWidth) {
          newVelX = -newVelX;
        }
        if (newY <= 0 || newY >= containerHeight - cowHeight) {
          newVelY = -newVelY;
        }
        
        setVelocity({ x: newVelX, y: newVelY });
        
        return {
          x: Math.max(0, Math.min(containerWidth - cowWidth, newX)),
          y: Math.max(0, Math.min(containerHeight - cowHeight, newY))
        };
      });
    };

    const interval = setInterval(animate, 16); // ~60fps
    return () => clearInterval(interval);
  }, [velocity.x, velocity.y, containerWidth, containerHeight]);

  const handleCowClick = () => {
    // Multi-bounce spring animation
    const springSequence = [
      { scale: 1.3, delay: 0 },
      { scale: 0.9, delay: 100 },
      { scale: 1.15, delay: 200 },
      { scale: 0.95, delay: 300 },
      { scale: 1.05, delay: 400 },
      { scale: 1, delay: 500 }
    ];
    
    springSequence.forEach(({ scale, delay }) => {
      setTimeout(() => setSpringScale(scale), delay);
    });
  };

  return (
    <div
      className="absolute cursor-pointer"
      style={{
        left: position.x,
        top: position.y,
        zIndex: 1000, // Top layer
        transition: 'none' // Disable CSS transitions for smooth animation
      }}
      onClick={handleCowClick}
    >
      <img
        src={stupidCow}
        alt="Bouncing cow"
        className="w-15 h-15"
        style={{
          width: '120px',
          height: '120px',
          imageRendering: 'pixelated', // Keep the pixel art look
          transform: `scale(${springScale})`,
          transition: 'transform 0.1s ease-out' // Quick transitions for multiple bounces
        }}
      />
    </div>
  );
}
