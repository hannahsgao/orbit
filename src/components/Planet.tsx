import { useEffect, useRef } from 'react';

interface PlanetProps {
  x: number;
  y: number;
  radius: number;
  color: string;
  onClick: (event: React.MouseEvent) => void;
  isSelected?: boolean;
}

export function Planet({ x, y, radius, color, onClick, isSelected = false }: PlanetProps) {
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
  }, [radius, color, x, y, isSelected]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    onClick(e);
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{
        position: 'absolute',
        left: x - radius,
        top: y - radius,
        cursor: 'pointer',
        imageRendering: 'pixelated',
      }}
    />
  );
}
