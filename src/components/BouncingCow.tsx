import { useState, useEffect } from 'react';
import stupidCow from '../assets/cows/stupidcow.png';

interface CowInstance {
  id: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  size: number;
  springScale: number;
}

interface BouncingCowProps {
  containerWidth: number;
  containerHeight: number;
}

export function BouncingCow({ containerWidth, containerHeight }: BouncingCowProps) {
  const [cows, setCows] = useState<CowInstance[]>([
    {
      id: 'cow-0',
      position: { x: 100, y: 100 },
      velocity: { x: 2, y: 2 },
      size: 120,
      springScale: 1
    }
  ]);

  useEffect(() => {
    const animate = () => {
      setCows(prevCows =>
        prevCows.map(cow => {
          const newX = cow.position.x + cow.velocity.x;
          const newY = cow.position.y + cow.velocity.y;

          let newVelX = cow.velocity.x;
          let newVelY = cow.velocity.y;

          // Bounce off walls
          if (newX <= 0 || newX >= containerWidth - cow.size) {
            newVelX = -newVelX;
          }
          if (newY <= 0 || newY >= containerHeight - cow.size) {
            newVelY = -newVelY;
          }

          return {
            ...cow,
            position: {
              x: Math.max(0, Math.min(containerWidth - cow.size, newX)),
              y: Math.max(0, Math.min(containerHeight - cow.size, newY))
            },
            velocity: { x: newVelX, y: newVelY }
          };
        })
      );
    };

    const interval = setInterval(animate, 16); // ~60fps
    return () => clearInterval(interval);
  }, [containerWidth, containerHeight]);

  const handleCowClick = (clickedCowId: string) => {
    setCows(prevCows => {
      const clickedCow = prevCows.find(cow => cow.id === clickedCowId);
      if (!clickedCow) return prevCows;

      const newSize = clickedCow.size * 0.9;

      // Create two new cows with random velocities
      const newCow1: CowInstance = {
        id: `cow-${Date.now()}-1`,
        position: { ...clickedCow.position },
        velocity: {
          x: (Math.random() - 0.5) * 4 + 1,
          y: (Math.random() - 0.5) * 4 + 1
        },
        size: newSize,
        springScale: 1
      };

      const newCow2: CowInstance = {
        id: `cow-${Date.now()}-2`,
        position: { ...clickedCow.position },
        velocity: {
          x: (Math.random() - 0.5) * 4 + 1,
          y: (Math.random() - 0.5) * 4 + 1
        },
        size: newSize,
        springScale: 1
      };

      // Remove clicked cow and add two new cows
      return [
        ...prevCows.filter(cow => cow.id !== clickedCowId),
        newCow1,
        newCow2
      ];
    });
  };

  return (
    <>
      {cows.map(cow => (
        <div
          key={cow.id}
          className="absolute cursor-pointer"
          style={{
            left: cow.position.x,
            top: cow.position.y,
            zIndex: 1000, // Top layer
            transition: 'none' // Disable CSS transitions for smooth animation
          }}
          onClick={() => handleCowClick(cow.id)}
        >
          <img
            src={stupidCow}
            alt="Bouncing cow"
            style={{
              width: `${cow.size}px`,
              height: `${cow.size}px`,
              imageRendering: 'pixelated', // Keep the pixel art look
              transform: `scale(${cow.springScale})`,
              transition: 'transform 0.1s ease-out'
            }}
          />
        </div>
      ))}
    </>
  );
}
