import { useState, useEffect, useRef } from 'react';

import { ThemeNode } from '../types/personality';

interface PlanetProps {
  x: number;
  y: number;
  radius: number;
  color: string;
  imageAsset: string;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  isSelected?: boolean;
  opacity?: number;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
  themeData?: ThemeNode;
}

export function Planet({ x, y, radius, color, imageAsset, onClick, isSelected = false, opacity = 1, onMouseEnter, onMouseLeave, themeData }: PlanetProps) {
  const [imageError, setImageError] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onClick(e);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setShowTooltip(true);
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    setShowTooltip(false);
    onMouseLeave?.(e);
  };

  return (
    <>
      <div
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      style={{
        position: 'absolute',
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2,
        cursor: 'pointer',
        opacity: opacity,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        imageRendering: 'pixelated',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
    >
      {/* Fallback to programmatic rendering if PNG fails to load */}
      {imageError ? (
        <FallbackPlanetCanvas 
          radius={radius} 
          color={color} 
          isSelected={isSelected}
        />
      ) : (
        <img
          src={imageAsset}
          alt="Planet"
          style={{
            width: '100%',
            height: '100%',
            imageRendering: 'pixelated',
            outline: isSelected ? '2px solid #FFFFFF' : 'none',
            outlineOffset: isSelected ? '1px' : '0px',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            pointerEvents: 'none',
          }}
          onError={() => setImageError(true)}
        />
      )}
      </div>

      {/* Tooltip for theme description */}
      {showTooltip && themeData && themeData.description && (
        <div
          style={{
            position: 'absolute',
            left: x + radius + 10,
            top: y - radius,
            background: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '8px 12px',
            fontFamily: 'monospace',
            fontSize: '12px',
            maxWidth: '250px',
            zIndex: 1000,
            pointerEvents: 'none',
            borderRadius: '4px',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            {themeData.name}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.9 }}>
            {themeData.description}
          </div>
          {themeData.level && (
            <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>
              Level: {themeData.level}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// Fallback component that renders the original dithered planet if PNG fails to load
function FallbackPlanetCanvas({ radius, color, isSelected }: { radius: number; color: string; isSelected: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const size = Math.ceil(radius * 2);
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Bayer matrix for ordered dithering (8x8)
    const bayerMatrix = [
      [0, 32, 8, 40, 2, 34, 10, 42],
      [48, 16, 56, 24, 50, 18, 58, 26],
      [12, 44, 4, 36, 14, 46, 6, 38],
      [60, 28, 52, 20, 62, 30, 54, 22],
      [3, 35, 11, 43, 1, 33, 9, 41],
      [51, 19, 59, 27, 49, 17, 57, 25],
      [15, 47, 7, 39, 13, 45, 5, 37],
      [63, 31, 55, 23, 61, 29, 53, 21]
    ];

    // Create image data
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const dx = px - radius;
        const dy = py - radius;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= radius) {
          // Calculate shading based on distance from center (sphere effect)
          const normalizedDist = distance / radius;
          const shading = Math.cos(normalizedDist * Math.PI / 2);

          // Apply dithering - pure black and white
          const threshold = bayerMatrix[py % 8][px % 8] / 64;
          const pixelIndex = (py * size + px) * 4;

          if (shading > threshold) {
            // White pixel
            data[pixelIndex] = 255;
            data[pixelIndex + 1] = 255;
            data[pixelIndex + 2] = 255;
            data[pixelIndex + 3] = 255;
          } else {
            // Black pixel
            data[pixelIndex] = 0;
            data[pixelIndex + 1] = 0;
            data[pixelIndex + 2] = 0;
            data[pixelIndex + 3] = 255;
          }
        } else {
          // Transparent outside circle
          const pixelIndex = (py * size + px) * 4;
          data[pixelIndex + 3] = 0;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    
    // Add white border for selected planets
    if (isSelected) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(radius, radius, radius - 1, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }, [radius, color, isSelected]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        imageRendering: 'pixelated',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        pointerEvents: 'none',
      }}
    />
  );
}
