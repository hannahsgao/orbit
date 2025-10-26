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
  hasSpawnedChildren: boolean;
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
  const [focusedPlanetId, setFocusedPlanetId] = useState<string | null>(null);
  const [cameraStack, setCameraStack] = useState<Array<{ zoom: number; subjectPlanetId: string | null }>>([]);
  const [focusAnim, setFocusAnim] = useState<{
    inProgress: boolean;
    startMs: number;
    durationMs: number;
    startZoom: number;
    startPan: { x: number; y: number };
    targetZoom: number;
    initialScreenPos: { x: number; y: number };
  } | null>(null);
  type LabelFlashEntry = { visible: boolean; nextAt: number; mode: 'idle' | 'visible' };
  const [currentLabelIds, setCurrentLabelIds] = useState<Set<string>>(new Set());
  const [labelFlash, setLabelFlash] = useState<Record<string, LabelFlashEntry>>({});
  const [hoveredPlanetId, setHoveredPlanetId] = useState<string | null>(null);
  const [labelSeqIndex, setLabelSeqIndex] = useState(0);
  const [labelSeqNextAt, setLabelSeqNextAt] = useState(0);

  // Initialize with root planets
  useEffect(() => {
    const initialPlanets: PlanetNode[] = [];
    
    // Create multiple orbital rings with planets
    const orbits = [
      { radius: 150, count: 2, speed: 0.2 },
      { radius: 260, count: 4, speed: 0.22 },
      { radius: 380, count: 5, speed: 0.15 },
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
          children: [],
          hasSpawnedChildren: false
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
      
      const container = containerRef.current;
      const isFocusing = !!(focusAnim?.inProgress && container);

      if (isFocusing && container && focusAnim) {
        // Ease both zoom and the satellite's screen position to the center
        const now = performance.now();
        const rawT = Math.min(1, Math.max(0, (now - focusAnim.startMs) / focusAnim.durationMs));
        // easeInOutCubic
        const t = rawT < 0.5 ? 4 * rawT * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 3) / 2;

        const currentZoom = focusAnim.startZoom + (focusAnim.targetZoom - focusAnim.startZoom) * t;
        setZoom(currentZoom);

        const subjectPos = focusedPlanetId
          ? calculatePosition(planets.find(p => p.id === focusedPlanetId) || { id: '', orbitRadius: 0, orbitSpeed: 0, planetRadius: 0, color: '', angle: 0, parentId: null, children: [], hasSpawnedChildren: false } as any)
          : { x: centerX, y: centerY };

        const viewportCenterX = container.clientWidth / 2;
        const viewportCenterY = container.clientHeight / 2;

        const desiredScreenX = focusAnim.initialScreenPos.x + (viewportCenterX - focusAnim.initialScreenPos.x) * t;
        const desiredScreenY = focusAnim.initialScreenPos.y + (viewportCenterY - focusAnim.initialScreenPos.y) * t;

        const desiredPan = {
          x: desiredScreenX - subjectPos.x * currentZoom,
          y: desiredScreenY - subjectPos.y * currentZoom
        };

        setPan(desiredPan);
        setTargetPan(desiredPan);
        setTargetZoom(currentZoom);

        if (rawT >= 1) {
          setFocusAnim(prev => (prev ? { ...prev, inProgress: false } : prev));
        }
      } else {
        // Normal smoothing when not actively focusing
        setZoom(z => z + (targetZoom - z) * 0.05);
        setPan(p => (
          focusedPlanetId
            ? p // when focused (and not animating), pan is controlled elsewhere to lock on target
            : {
                x: p.x + (targetPan.x - p.x) * 0.1,
                y: p.y + (targetPan.y - p.y) * 0.1
              }
        ));
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [targetZoom, targetPan, focusedPlanetId, focusAnim, planets]);

  // Keep focused planet centered by updating pan each frame
  useEffect(() => {
    if (!focusedPlanetId) return;
    if (focusAnim && focusAnim.inProgress) return; // during transition, let the animation drive pan
    const container = containerRef.current;
    if (!container) return;
    const focusedPlanet = planets.find(p => p.id === focusedPlanetId);
    if (!focusedPlanet) return;

    const planetPos = calculatePosition(focusedPlanet);
    const viewportCenterX = container.clientWidth / 2;
    const viewportCenterY = container.clientHeight / 2;

    const desiredPan = {
      x: viewportCenterX - planetPos.x * zoom,
      y: viewportCenterY - planetPos.y * zoom
    };

    // Directly set pan while focused to avoid smoothing-induced drift
    setPan(desiredPan);
    setTargetPan(desiredPan);
  }, [time, zoom, focusedPlanetId, planets, focusAnim]);

  // Track which labels should be visible (anchor and its direct children, or roots in root view)
  useEffect(() => {
    const anchorId: string | null = focusedPlanetId;
    const isRootView = !anchorId && selectedPlanetIds.size === 0 && Math.abs(pan.x) < 1 && Math.abs(pan.y) < 1 && zoom <= 1.05;
    let labelIds: Set<string>;
    if (anchorId) {
      const anchor = planets.find(p => p.id === anchorId);
      if (anchor) {
        labelIds = new Set<string>([anchorId, ...anchor.children]);
      } else {
        labelIds = new Set<string>();
      }
    } else if (isRootView) {
      // Only root nodes flash at the most zoomed-out view
      labelIds = new Set<string>(planets.filter(p => p.parentId === null).map(p => p.id));
    } else {
      labelIds = new Set<string>();
    }
    setCurrentLabelIds(labelIds);
    // Reset sequence when the set of label ids changes
    setLabelSeqIndex(0);
    setLabelSeqNextAt(performance.now());
  }, [focusedPlanetId, selectedPlanetIds, planets, pan.x, pan.y, zoom]);

  // Mostly sequential flashing: cycle through labels, showing one at a time with longer on-times
  useEffect(() => {
    const tick = () => {
      const now = performance.now();
      const ids = Array.from(currentLabelIds).sort();
      if (ids.length === 0) {
        setLabelFlash({});
        return;
      }

      let launched = false;
      let nextIdxState = labelSeqIndex;
      let nextLaunchAtState = labelSeqNextAt;

      setLabelFlash(prev => {
        const next: Record<string, LabelFlashEntry> = {};
        // Keep existing states for current ids only and expire finished ones
        let visibleIds: string[] = [];
        ids.forEach(id => {
          const ps = prev[id];
          if (ps && ps.mode === 'visible' && now < ps.nextAt) {
            next[id] = ps;
            visibleIds.push(id);
          } else {
            next[id] = {
              visible: false,
              nextAt: ps ? ps.nextAt : now,
              mode: 'idle'
            };
          }
        });

        // Enforce up to 2 visible at a time
        if (visibleIds.length > 2) {
          // Keep the two with the soonest end times, hide the rest
          visibleIds.sort((a, b) => next[a].nextAt - next[b].nextAt);
          for (let i = 2; i < visibleIds.length; i++) {
            const id = visibleIds[i];
            next[id] = {
              visible: false,
              nextAt: now + (1200 + Math.random() * 1600),
              mode: 'idle'
            };
          }
          visibleIds = visibleIds.slice(0, 2);
        }

        // Launch a new label if we have room (less than 2 visible) and it's time
        if (visibleIds.length < 2 && now >= labelSeqNextAt) {
          // Find the next id mostly sequentially, skipping those already visible
          let idx = (labelSeqIndex + 1) % ids.length;
          if (Math.random() < 0.15 && ids.length > 2) {
            idx = (idx + 1) % ids.length;
          }
          // Advance until we find a non-visible id (to encourage variety)
          let attempts = 0;
          while (attempts < ids.length && visibleIds.includes(ids[idx])) {
            idx = (idx + 1) % ids.length;
            attempts++;
          }
          const showId = ids[idx];
          const visibleDur = 900 + Math.random() * 1200; // 0.9s - 2.1s
          next[showId] = {
            visible: true,
            nextAt: now + visibleDur,
            mode: 'visible'
          };
          // Stagger next launch so we get overlap
          const launchGap = 400 + Math.random() * 900; // 0.4s - 1.3s
          nextIdxState = idx;
          nextLaunchAtState = now + launchGap;
          launched = true;
        }

        return next;
      });

      if (launched) {
        setLabelSeqIndex(nextIdxState);
        setLabelSeqNextAt(nextLaunchAtState);
      }
    };
    const handle = setInterval(tick, 120);
    return () => clearInterval(handle);
  }, [currentLabelIds, labelSeqIndex, labelSeqNextAt]);

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
          setFocusedPlanetId(null);
          setFocusAnim(null);
          setCameraStack([]);
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
          setFocusedPlanetId(null);
          setFocusAnim(null);
          setCameraStack([]);
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
    
    if (!isCmdPressed && focusedPlanetId) {
      // Disable panning while focused
      return;
    }

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
    setFocusedPlanetId(null);
    setFocusAnim(null);
    setCameraStack([]);
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
    const isAlreadyFocused = focusedPlanetId === planetId;
    const container = containerRef.current;
    let isAlreadyCentered = false;
    const planetPos = calculatePosition(clickedPlanet);
    if (container) {
      const viewportCenterX = container.clientWidth / 2;
      const viewportCenterY = container.clientHeight / 2;
      const currentScreenX = planetPos.x * zoom + pan.x;
      const currentScreenY = planetPos.y * zoom + pan.y;
      const dx = currentScreenX - viewportCenterX;
      const dy = currentScreenY - viewportCenterY;
      isAlreadyCentered = Math.hypot(dx, dy) < 12; // threshold in pixels
    }
 
    // If clicking an item that is currently centered: zoom out to previous camera state (no spawn), with eased animation
    if (isAlreadyCentered && cameraStack.length > 0) {
      const next = [...cameraStack];
      const prevCam = next.pop();
      const container2 = containerRef.current;
      if (container2) {
        const desiredZoom = prevCam ? prevCam.zoom : 1;
        const subjectId = prevCam ? prevCam.subjectPlanetId : null;
        const subjectPos = subjectId
          ? calculatePosition(planets.find(p => p.id === subjectId) || clickedPlanet)
          : { x: centerX, y: centerY };
        const initialScreenPos = {
          x: subjectPos.x * zoom + pan.x,
          y: subjectPos.y * zoom + pan.y
        };
        setFocusAnim({
          inProgress: true,
          startMs: performance.now(),
          durationMs: 900,
          startZoom: zoom,
          startPan: { ...pan },
          targetZoom: desiredZoom,
          initialScreenPos
        });
        setFocusedPlanetId(subjectId);
      } else {
        setTargetZoom(prevCam ? prevCam.zoom : 1);
        setFocusedPlanetId(prevCam ? prevCam.subjectPlanetId : null);
      }
      setCameraStack(next);
      return; // prevent spawning more satellites
    }
 
    // Compute depth (root=0, child=1, grandchild=2, ...). Block focus/zoom for depth >= 2
    const computeDepth = (node: PlanetNode): number => {
      let depth = 0;
      let current: PlanetNode | undefined = node;
      while (current && current.parentId !== null) {
        depth += 1;
        current = planets.find(p => p.id === current!.parentId);
      }
      return depth;
    };
    const depth = computeDepth(clickedPlanet);
    if (depth >= 2) {
      return; // Do not zoom/focus grandchildren or deeper
    }

    // Update focus to the clicked planet; animation guard below prevents re-zooming if already centered/focused
    setFocusedPlanetId(planetId);
    
    // Only start focus animation if not already centered/focused
    if (!isAlreadyFocused && !isAlreadyCentered && container) {
      // Calculate new zoom - zoom in aggressively to focus on just this planet
      const newZoom = Math.min(zoom * 2.5, 16);
      // Push current camera to stack so we can return later
      setCameraStack(prev => [...prev, { zoom, subjectPlanetId: focusedPlanetId }]);
      const initialScreenPos = {
        x: planetPos.x * zoom + pan.x,
        y: planetPos.y * zoom + pan.y
      };
      setFocusAnim({
        inProgress: true,
        startMs: performance.now(),
        durationMs: 900,
        startZoom: zoom,
        startPan: { ...pan },
        targetZoom: newZoom,
        initialScreenPos
      });
    }
 
    setPlanets(prevPlanets => {
      const newPlanets = [...prevPlanets];
      const clickedPlanetIndex = newPlanets.findIndex(p => p.id === planetId);
 
      if (clickedPlanetIndex === -1) return prevPlanets;
 
      const clickedPlanet = newPlanets[clickedPlanetIndex];
 
      // If this planet has ever spawned children, do not spawn more
      if (clickedPlanet.hasSpawnedChildren) {
        return prevPlanets;
      }
 
      // If this planet already has satellites, do not spawn more
      if (clickedPlanet.children && clickedPlanet.children.length > 0) {
        return prevPlanets;
      }
 
      // Generate 2-4 child planets
      const numChildren = 2 + Math.floor(Math.random() * 3);
 
      for (let i = 0; i < numChildren; i++) {
        const childId = `${planetId}-child-${Date.now()}-${i}`;
        // Clamp child radius to be smaller than parent
        const tentativeRadius = 8 + Math.random() * 10;
        const maxChildRadius = Math.max(2, clickedPlanet.planetRadius * 0.8);
        const childRadius = Math.min(tentativeRadius, maxChildRadius);
        const childPlanet: PlanetNode = {
          id: childId,
          orbitRadius: 40 + i * 15,
          orbitSpeed: 0.5 + Math.random() * 0.5,
          planetRadius: childRadius,
          color: '#FFFFFF',
          angle: (Math.PI * 2 * i) / numChildren,
          parentId: planetId,
          children: [],
          hasSpawnedChildren: false
        };
        
        newPlanets.push(childPlanet);
        clickedPlanet.children.push(childId);
      }
      // Mark that this planet has spawned at least once
      clickedPlanet.hasSpawnedChildren = true;
      
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
                setFocusedPlanetId(null);
                setFocusAnim(null);
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
        {(() => {
          // Use focused planet if present; otherwise, if exactly one selected, use it as anchor
          let anchorId: string | null = focusedPlanetId;
          if (!anchorId && selectedPlanetIds.size === 1) {
            anchorId = Array.from(selectedPlanetIds)[0];
          }
 
          // Only anchor and its direct children are fully opaque; others dimmed
          let fullOpacityIds: Set<string> | null = null;
          // Detect root view (most zoomed out and centered): treat roots as direct children of center
          const isRootView = !anchorId && selectedPlanetIds.size === 0 && Math.abs(pan.x) < 1 && Math.abs(pan.y) < 1 && zoom <= 1.05;
          if (anchorId) {
            fullOpacityIds = new Set<string>([anchorId]);
            const anchor = planets.find(p => p.id === anchorId);
            if (anchor) {
              anchor.children.forEach(childId => fullOpacityIds!.add(childId));
            }
          } else if (isRootView) {
            // At the most zoomed-out view: show ALL satellites fully (no dimming)
            fullOpacityIds = null;
          }
          return planets.map(planet => {
            const pos = calculatePosition(planet);
            const transformedPos = transformPosition(pos);
            const opacity = fullOpacityIds ? (fullOpacityIds.has(planet.id) ? 1 : 0.2) : 1;
            return (
              <Planet
                key={planet.id}
                x={transformedPos.x}
                y={transformedPos.y}
                radius={planet.planetRadius * zoom}
                color={planet.color}
                onClick={(event) => handlePlanetClick(planet.id, event)}
                isSelected={selectedPlanetIds.has(planet.id)}
                opacity={opacity}
                onMouseEnter={() => setHoveredPlanetId(planet.id)}
                onMouseLeave={() => setHoveredPlanetId(prev => (prev === planet.id ? null : prev))}
              />
            );
          });
        })()}

        {/* Labels for anchor and its direct children */}
        {(() => {
          const anchorId: string | null = focusedPlanetId;
          const isRootView = !anchorId && selectedPlanetIds.size === 0 && Math.abs(pan.x) < 1 && Math.abs(pan.y) < 1 && zoom <= 1.05;
          let labelIds: Set<string>;
          if (anchorId) {
            const anchor = planets.find(p => p.id === anchorId);
            if (!anchor) return null;
            labelIds = new Set<string>([anchorId, ...anchor.children]);
          } else if (isRootView) {
            // Show labels only for root nodes at the most zoomed-out view
            labelIds = new Set<string>(planets.filter(p => p.parentId === null).map(p => p.id));
          } else {
            return null;
          }
          return planets
            .filter(p => labelIds.has(p.id))
            .map(planet => {
              const pos = calculatePosition(planet);
              const transformedPos = transformPosition(pos);
              const label = planet.id;
              const flashVisible = labelFlash[planet.id]?.visible ?? false;
              const forceVisible = hoveredPlanetId === planet.id;
              return (
                <div
                  key={`label-${planet.id}`}
                  style={{
                    position: 'absolute',
                    left: transformedPos.x + planet.planetRadius * zoom + 8,
                    top: transformedPos.y - planet.planetRadius * zoom - 8,
                    color: '#fff',
                    fontFamily: 'VT323, monospace',
                    fontSize: `${14 * zoom}px`,
                    letterSpacing: '0.02em',
                    userSelect: 'none',
                    pointerEvents: 'none',
                    textShadow: '0 1px 0 #000, 1px 0 0 #000, -1px 0 0 #000, 0 -1px 0 #000',
                    opacity: forceVisible ? 1 : (flashVisible ? 0.95 : 0),
                    transition: 'opacity 120ms linear'
                  }}
                >
                  {label}
                </div>
              );
            });
        })()}
      </div>
    </div>
  );
}
