import { useState, useEffect, useRef } from 'react';
import { Planet } from './Planet';

interface PlanetNode {
  id: string;
  orbitRadius: number;
  orbitSpeed: number;
  planetRadius: number;
  color: string;
  angle: number;
  parentId: string | null;
  children: string[];
}

interface OrbitSystemProps {
  centerX: number;
  centerY: number;
}

export function OrbitSystem({ centerX, centerY }: OrbitSystemProps) {
  const [planets, setPlanets] = useState<PlanetNode[]>([]);
  const [time, setTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [targetZoom, setTargetZoom] = useState(1);
  const [targetPan, setTargetPan] = useState({ x: 0, y: 0 });
  const [selectedPlanetIds, setSelectedPlanetIds] = useState<Set<string>>(new Set());
  const [isMultiSelecting, setIsMultiSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize with root planets
  useEffect(() => {
    const initialPlanets: PlanetNode[] = [];
    
    // Create multiple orbital rings with planets
    const orbits = [
      { radius: 120, count: 3, speed: 0.2 },
      { radius: 180, count: 5, speed: 0.25 },
      { radius: 250, count: 6, speed: 0.15 },
      { radius: 320, count: 8, speed: 0.12 },
    ];

    let planetIndex = 0;
    orbits.forEach(orbit => {
      for (let i = 0; i < orbit.count; i++) {
        const id = `planet-${planetIndex}`;
        initialPlanets.push({
          id,
          orbitRadius: orbit.radius,
          orbitSpeed: orbit.speed + Math.random() * 0.05,
          planetRadius: 12 + Math.random() * 18,
          color: '#FFFFFF',
          angle: (Math.PI * 2 * i) / orbit.count + Math.random() * 0.5,
          parentId: null,
          children: []
        });
        planetIndex++;
      }
    });
    
    setPlanets(initialPlanets);
  }, []);

  // Animation loop with camera smoothing
  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      setTime(t => t + 0.01);
      
      // Smooth camera transitions
      setZoom(z => z + (targetZoom - z) * 0.1);
      setPan(p => ({
        x: p.x + (targetPan.x - p.x) * 0.1,
        y: p.y + (targetPan.y - p.y) * 0.1
      }));
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [targetZoom, targetPan]);

  // Zoom handler
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const delta = e.deltaY * -0.001;
      const newZoom = Math.min(Math.max(0.1, targetZoom + delta), 20);
      
      setTargetZoom(newZoom);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [targetZoom]);

  // Keyboard shortcuts for multi-select
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;
      
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (selectedPlanetIds.size > 0) {
            // Remove all selected planets and their children
            setPlanets(prevPlanets => {
              const removePlanetAndChildren = (planetId: string, planets: PlanetNode[]): PlanetNode[] => {
                const planet = planets.find(p => p.id === planetId);
                if (!planet) return planets;
                
                let remainingPlanets = planets.filter(p => p.id !== planetId);
                planet.children.forEach(childId => {
                  remainingPlanets = removePlanetAndChildren(childId, remainingPlanets);
                });
                
                return remainingPlanets;
              };
              
              let newPlanets = [...prevPlanets];
              selectedPlanetIds.forEach(planetId => {
                newPlanets = removePlanetAndChildren(planetId, newPlanets);
              });
              
              setSelectedPlanetIds(new Set());
              return newPlanets;
            });
          }
          break;
        case 'Escape':
          e.preventDefault();
          setSelectedPlanetIds(new Set());
          setTargetZoom(1);
          setTargetPan({ x: 0, y: 0 });
          break;
        case '=':
        case '+':
          e.preventDefault();
          setTargetZoom(Math.min(50, targetZoom * 1.2));
          break;
        case '-':
          e.preventDefault();
          setTargetZoom(Math.max(0.05, targetZoom * 0.8));
          break;
        case '0':
          e.preventDefault();
          setTargetZoom(1);
          setTargetPan({ x: 0, y: 0 });
          break;
        case 'a':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            // Select all planets
            setSelectedPlanetIds(new Set(planets.map(p => p.id)));
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedPlanetIds, planets]);

  // Pan handlers with multi-select support
  const handleMouseDown = (e: React.MouseEvent) => {
    const isCmdPressed = e.metaKey || e.ctrlKey;
    
    if (isCmdPressed) {
      // Start multi-select mode
      setIsMultiSelecting(true);
      setIsDragging(false);
      setDragStart({ x: e.clientX, y: e.clientY });
      setSelectionBox({ startX: e.clientX, startY: e.clientY, endX: e.clientX, endY: e.clientY });
    } else {
      // Normal pan mode
      setIsDragging(true);
      setIsMultiSelecting(false);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectionBox(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newPan = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      };
      setPan(newPan);
      setTargetPan(newPan);
    } else if (isMultiSelecting && selectionBox) {
      // Update selection box
      setSelectionBox({
        ...selectionBox,
        endX: e.clientX,
        endY: e.clientY
      });
    }
  };

  const handleMouseUp = () => {
    if (isMultiSelecting && selectionBox) {
      // Finalize multi-select
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const selectedPlanets = new Set<string>();
        
        // Check which planets are within the selection box
        planets.forEach(planet => {
          const pos = calculatePosition(planet);
          const transformedPos = transformPosition(pos);
          const screenX = transformedPos.x;
          const screenY = transformedPos.y;
          
          const minX = Math.min(selectionBox.startX - rect.left, selectionBox.endX - rect.left);
          const maxX = Math.max(selectionBox.startX - rect.left, selectionBox.endX - rect.left);
          const minY = Math.min(selectionBox.startY - rect.top, selectionBox.endY - rect.top);
          const maxY = Math.max(selectionBox.startY - rect.top, selectionBox.endY - rect.top);
          
          if (screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY) {
            selectedPlanets.add(planet.id);
          }
        });
        
        setSelectedPlanetIds(selectedPlanets);
      }
    }
    
    setIsDragging(false);
    setIsMultiSelecting(false);
    setSelectionBox(null);
  };

  // Double-click to reset zoom and pan
  const handleDoubleClick = () => {
    setTargetZoom(1);
    setTargetPan({ x: 0, y: 0 });
  };

  const handlePlanetClick = (planetId: string, event: React.MouseEvent) => {
    if (isDragging) return; // Don't spawn planets if we were dragging
    
    // Handle selection vs spawning
    if (event.metaKey || event.ctrlKey || event.button === 2) {
      // Add/remove from selection
      setSelectedPlanetIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(planetId)) {
          newSet.delete(planetId);
        } else {
          newSet.add(planetId);
        }
        return newSet;
      });
      return;
    }
    
    // Get the planet's current position
    const clickedPlanet = planets.find(p => p.id === planetId);
    if (!clickedPlanet) return;
    
    const planetPos = calculatePosition(clickedPlanet);
    
    // Calculate new zoom - zoom in aggressively to focus on just this planet
    const newZoom = Math.min(zoom * 4, 20);
    
    // Calculate pan to center the planet in the viewport
    const container = containerRef.current;
    if (container) {
      const viewportCenterX = container.clientWidth / 2;
      const viewportCenterY = container.clientHeight / 2;
      
      // We want: planetPos * newZoom + newPan = viewportCenter
      // So: newPan = viewportCenter - planetPos * newZoom
      const newPan = {
        x: viewportCenterX - planetPos.x * newZoom,
        y: viewportCenterY - planetPos.y * newZoom
      };
      
      setTargetZoom(newZoom);
      setTargetPan(newPan);
    }
    
    setPlanets(prevPlanets => {
      const newPlanets = [...prevPlanets];
      const clickedPlanetIndex = newPlanets.findIndex(p => p.id === planetId);
      
      if (clickedPlanetIndex === -1) return prevPlanets;

      const clickedPlanet = newPlanets[clickedPlanetIndex];

      // Generate 2-4 child planets
      const numChildren = 2 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < numChildren; i++) {
        const childId = `${planetId}-child-${Date.now()}-${i}`;
        const childPlanet: PlanetNode = {
          id: childId,
          orbitRadius: 40 + i * 15,
          orbitSpeed: 0.5 + Math.random() * 0.5,
          planetRadius: 8 + Math.random() * 10,
          color: '#FFFFFF',
          angle: (Math.PI * 2 * i) / numChildren,
          parentId: planetId,
          children: []
        };
        
        newPlanets.push(childPlanet);
        clickedPlanet.children.push(childId);
      }
      
      return newPlanets;
    });
  };

  const findPlanet = (planetId: string): PlanetNode | undefined => {
    return planets.find(p => p.id === planetId);
  };

  const calculatePosition = (planet: PlanetNode): { x: number; y: number } => {
    if (planet.parentId === null) {
      // Root planet orbits around center
      const angle = planet.angle + time * planet.orbitSpeed;
      return {
        x: centerX + Math.cos(angle) * planet.orbitRadius,
        y: centerY + Math.sin(angle) * planet.orbitRadius
      };
    } else {
      // Child planet orbits around parent
      const parent = findPlanet(planet.parentId);
      if (!parent) return { x: centerX, y: centerY };
      
      const parentPos = calculatePosition(parent);
      const angle = planet.angle + time * planet.orbitSpeed;
      return {
        x: parentPos.x + Math.cos(angle) * planet.orbitRadius,
        y: parentPos.y + Math.sin(angle) * planet.orbitRadius
      };
    }
  };

  const transformPosition = (pos: { x: number; y: number }) => {
    return {
      x: pos.x * zoom + pan.x,
      y: pos.y * zoom + pan.y
    };
  };

  const transformedCenter = transformPosition({ x: centerX, y: centerY });

  return (
    <div 
      ref={containerRef}
      style={{ 
        position: 'fixed', 
        inset: 0, 
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: 1,
        overflow: 'hidden'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Zoom indicator and controls */}
        <div 
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            padding: '8px 12px',
            color: 'white',
            fontFamily: 'monospace',
            fontSize: '12px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ pointerEvents: 'none' }}>
            ZOOM: {zoom.toFixed(2)}x | PAN: ({Math.round(pan.x)}, {Math.round(pan.y)}) | SELECTED: {selectedPlanetIds.size}
          </div>
          <div style={{ display: 'flex', gap: '4px', pointerEvents: 'auto' }}>
            <button
              onClick={() => setTargetZoom(Math.max(0.05, targetZoom * 0.8))}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: 'white',
                padding: '4px 8px',
                fontSize: '10px',
                cursor: 'pointer',
                fontFamily: 'monospace'
              }}
            >
              -
            </button>
            <button
              onClick={() => setTargetZoom(Math.min(50, targetZoom * 1.2))}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: 'white',
                padding: '4px 8px',
                fontSize: '10px',
                cursor: 'pointer',
                fontFamily: 'monospace'
              }}
            >
              +
            </button>
            <button
              onClick={() => {
                setTargetZoom(1);
                setTargetPan({ x: 0, y: 0 });
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: 'white',
                padding: '4px 8px',
                fontSize: '10px',
                cursor: 'pointer',
                fontFamily: 'monospace'
              }}
            >
              RESET
            </button>
          </div>
        </div>

        {/* Selection box */}
        {selectionBox && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(selectionBox.startX, selectionBox.endX),
              top: Math.min(selectionBox.startY, selectionBox.endY),
              width: Math.abs(selectionBox.endX - selectionBox.startX),
              height: Math.abs(selectionBox.endY - selectionBox.startY),
              border: '2px dashed rgba(255, 255, 255, 0.8)',
              background: 'rgba(255, 255, 255, 0.1)',
              pointerEvents: 'none',
              zIndex: 50
            }}
          />
        )}

        {/* Central star */}
        <div
          style={{
            position: 'absolute',
            left: transformedCenter.x - 15 * zoom,
            top: transformedCenter.y - 15 * zoom,
            width: 30 * zoom,
            height: 30 * zoom,
            borderRadius: '50%',
            background: '#FFFFFF',
            border: `${2 * zoom}px solid #000000`,
            boxShadow: `0 0 ${20 * zoom}px rgba(255, 255, 255, 0.5)`,
            pointerEvents: 'none'
          }}
        />
        
        {/* Orbit paths */}
        {planets
          .filter(p => p.parentId === null)
          .map(planet => (
            <div
              key={`orbit-${planet.id}`}
              style={{
                position: 'absolute',
                left: transformedCenter.x - planet.orbitRadius * zoom,
                top: transformedCenter.y - planet.orbitRadius * zoom,
                width: planet.orbitRadius * 2 * zoom,
                height: planet.orbitRadius * 2 * zoom,
                border: `${Math.max(1, zoom)}px dashed rgba(255, 255, 255, 0.3)`,
                borderRadius: '50%',
                pointerEvents: 'none'
              }}
            />
          ))}
        
        {/* Planets */}
        {planets.map(planet => {
          const pos = calculatePosition(planet);
          const transformedPos = transformPosition(pos);
          return (
            <Planet
              key={planet.id}
              x={transformedPos.x}
              y={transformedPos.y}
              radius={planet.planetRadius * zoom}
              color={planet.color}
              onClick={(event) => handlePlanetClick(planet.id, event)}
              isSelected={selectedPlanetIds.has(planet.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
