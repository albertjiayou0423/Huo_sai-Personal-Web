
import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- TYPE DEFINITIONS ---
type ShapeType = 'circle' | 'rounded-square';
type CollisionState = 'none' | 'warning' | 'avoiding';
type AnimationState = 'active' | 'reforming';
type Personality = 'agile' | 'fast';
type EvasionTactic = 'none' | 'turn' | 'accelerate';

interface ColorScheme {
  fill: string;
  stroke: string;
}

interface Obstacle {
  id: string;
  rect: DOMRect;
}

interface MouseState {
  x: number;
  y: number;
  isLeftDown: boolean;
  isRightDown: boolean;
}

interface Shape {
  id: number;
  type: ShapeType;
  personality: Personality;
  color: ColorScheme;
  size: number;
  x: number; y: number;
  vx: number; vy: number;
  svx: number; svy: number;
  baseSpeed: number;
  speed: number;
  rotation: number;
  currentRotation: number;
  targetRotation: number;
  scale: number;
  opacity: number;
  collisionState: CollisionState;
  indicatorAngle: number;
  avoidanceAngle: number;
  evasionCooldownFrames: number;
  isHovered: boolean;
  animationState: AnimationState;
  animationCounter: number;
  evasionTactic: EvasionTactic;
}

interface BackgroundShapesProps {
  obstacles: Obstacle[];
  onUiCollision: (id: string, angle: number, rect: DOMRect) => void;
  generationTrigger: number;
  mouseState: MouseState;
  scrollVelocity: number;
}

// --- CONSTANTS ---
const colorSchemes: ColorScheme[] = [
  { fill: 'rgba(172, 195, 215, 0.9)', stroke: 'rgba(110, 142, 170, 1)' },   // Slate Blue
  { fill: 'rgba(228, 185, 185, 0.9)', stroke: 'rgba(195, 135, 135, 1)' },  // Dusty Rose
  { fill: 'rgba(188, 206, 188, 0.9)', stroke: 'rgba(130, 158, 130, 1)' },   // Sage Green
  { fill: 'rgba(250, 230, 180, 0.9)', stroke: 'rgba(225, 195, 120, 1)' },    // Butter Yellow
  { fill: 'rgba(210, 185, 210, 0.9)', stroke: 'rgba(168, 135, 168, 1)' },   // Muted Mauve
  { fill: 'rgba(180, 210, 225, 0.9)', stroke: 'rgba(120, 165, 190, 1)' },   // Powder Blue
];
const shapeTypes: ShapeType[] = ['circle', 'rounded-square'];
const NUM_SHAPES = 8;
const PREDICTION_FRAMES = 100;
const EVASION_COOLDOWN_FRAMES = 120;
const EVASION_TEST_FRAMES = 60; // How "soon" a collision must be to trigger evasion
const ANIMATION_DURATION = 30;
const MOUSE_FORCE_STRENGTH = 150;
const FLOCKING_STRENGTH = 0.0005;
const CONSTELLATION_DISTANCE = 350;
const ACCELERATION_BOOST = 1.5;
const GENERATION_COUNT = 4;
const MIN_SPEED_FACTOR = 0.2;
const MAX_SHAPES = 50; // Increased shape limit

// --- HELPER FUNCTIONS ---
const getAngle = (vx: number, vy: number) => (Math.atan2(vy, vx) * 180) / Math.PI;

const findShortestAngle = (angle: number): number => {
    angle %= 360;
    if (angle > 180) return angle - 360;
    if (angle < -180) return angle + 360;
    return angle;
};

const placeShapeOnEdge = (
    shape: Shape,
    bounds: { width: number; height: number }
): void => {
    const edge = Math.floor(Math.random() * 4);
    const padding = (shape.size || 50) + 20;
    let x = 0, y = 0, angle = 0;

    switch (edge) {
        case 0: x = Math.random() * bounds.width; y = -padding; angle = Math.random() * 120 + 30; break;
        case 1: x = bounds.width + padding; y = Math.random() * bounds.height; angle = Math.random() * 120 + 150; break;
        case 2: x = Math.random() * bounds.width; y = bounds.height + padding; angle = Math.random() * 120 + 210; break;
        case 3: x = -padding; y = Math.random() * bounds.height; angle = Math.random() * 120 - 30; break;
    }
    
    const maxSpeed = shape.personality === 'fast' ? 0.8 : 0.6;
    const speed = (Math.random() * 0.3 + 0.7) * maxSpeed;
    const angleRad = angle * (Math.PI / 180);
    const vx = Math.cos(angleRad) * speed;
    const vy = Math.sin(angleRad) * speed;

    Object.assign(shape, {
        x, y, vx, vy, svx: 0, svy: 0,
        speed,
        baseSpeed: speed,
        rotation: angle, currentRotation: angle, targetRotation: angle,
        animationState: 'reforming', animationCounter: ANIMATION_DURATION,
        scale: 0, opacity: 0, collisionState: 'none', indicatorAngle: 0,
        avoidanceAngle: 0, evasionCooldownFrames: 0, isHovered: false,
        evasionTactic: 'none',
    });
};

const createNewShape = (id: number, x: number, y: number): Shape => {
    const type = shapeTypes[id % shapeTypes.length];
    const newShape: Partial<Shape> = {
        id,
        type,
        color: colorSchemes[id % colorSchemes.length],
        size: Math.floor(Math.random() * 31) + 40,
        personality: type === 'circle' ? 'agile' : 'fast',
    };

    const angle = Math.random() * 360;
    const maxSpeed = newShape.personality === 'fast' ? 0.8 : 0.6;
    const speed = (Math.random() * 0.3 + 0.7) * maxSpeed;
    const angleRad = angle * (Math.PI / 180);
    const vx = Math.cos(angleRad) * speed;
    const vy = Math.sin(angleRad) * speed;

    Object.assign(newShape, {
        x, y, vx, vy, svx: 0, svy: 0,
        speed,
        baseSpeed: speed,
        rotation: angle, currentRotation: angle, targetRotation: angle,
        animationState: 'reforming', animationCounter: ANIMATION_DURATION,
        scale: 0, opacity: 0, collisionState: 'none', indicatorAngle: 0,
        avoidanceAngle: 0, evasionCooldownFrames: 0, isHovered: false,
        evasionTactic: 'none',
    });
    return newShape as Shape;
};

const createInitialShapes = (bounds: { width: number; height: number }): Shape[] => {
    return Array.from({ length: NUM_SHAPES }, (_, i) => {
        const shape = createNewShape(i, Math.random() * bounds.width, Math.random() * bounds.height);
        shape.animationState = 'active';
        shape.scale = 1;
        shape.opacity = 1;
        return shape;
    });
};

// --- REACT COMPONENT ---
const BackgroundShapes: React.FC<BackgroundShapesProps> = ({ obstacles, onUiCollision, generationTrigger, mouseState, scrollVelocity }) => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<number | null>(null);
  const [isDraggingAngle, setIsDraggingAngle] = useState(false);
  
  const shapesRef = useRef<Shape[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const dragStartAngleRef = useRef(0);
  const shapeStartAngleRef = useRef(0);

  const initializeShapes = useCallback(() => {
    setShapes(createInitialShapes({ width: window.innerWidth, height: window.innerHeight }));
  }, []);

  useEffect(initializeShapes, [initializeShapes]);

  const lastTrigger = useRef(generationTrigger);
  useEffect(() => {
    if (generationTrigger > lastTrigger.current) {
        setShapes(prevShapes => {
            if (prevShapes.length >= MAX_SHAPES) return prevShapes;
            
            const newShapes: Shape[] = [];
            let lastId = (prevShapes.length > 0 ? Math.max(...prevShapes.map(s => s.id)) : -1);
            
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            const quadrants = [
                { xMin: 0, xMax: width / 2, yMin: 0, yMax: height / 2 },         // Top-Left
                { xMin: width / 2, xMax: width, yMin: 0, yMax: height / 2 },      // Top-Right
                { xMin: 0, xMax: width / 2, yMin: height / 2, yMax: height },     // Bottom-Left
                { xMin: width / 2, xMax: width, yMin: height / 2, yMax: height }, // Bottom-Right
            ];

            // Shuffle quadrants to make generation order random
            for (let i = quadrants.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [quadrants[i], quadrants[j]] = [quadrants[j], quadrants[i]];
            }

            for (let i = 0; i < GENERATION_COUNT; i++) {
                const quadrant = quadrants[i];
                const x = Math.random() * (quadrant.xMax - quadrant.xMin) + quadrant.xMin;
                const y = Math.random() * (quadrant.yMax - quadrant.yMin) + quadrant.yMin;
                newShapes.push(createNewShape(++lastId, x, y));
            }

            return [...prevShapes, ...newShapes];
        });
        lastTrigger.current = generationTrigger;
    }
  }, [generationTrigger]);

  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);
  
  const handleShapeMouseDown = (e: React.MouseEvent, id: number) => {
    if (e.button === 2) { // Right click
      e.preventDefault();
      e.stopPropagation();
      setSelectedShapeId(prevId => (prevId === id ? null : id));
      setIsDraggingAngle(false);
    }
  };

  const handleAngleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const selectedShape = shapesRef.current.find(s => s.id === selectedShapeId);
    if (!selectedShape) return;

    setIsDraggingAngle(true);
    const initialAngle = Math.atan2(e.clientY - selectedShape.y, e.clientX - selectedShape.x) * (180 / Math.PI);
    dragStartAngleRef.current = initialAngle;
    shapeStartAngleRef.current = selectedShape.targetRotation;
  };
  
  useEffect(() => {
    const handleAngleDragMove = (e: MouseEvent) => {
      if (!isDraggingAngle || selectedShapeId === null) return;
      const selectedShape = shapesRef.current.find(s => s.id === selectedShapeId);
      if (!selectedShape) return;

      const currentAngle = Math.atan2(e.clientY - selectedShape.y, e.clientX - selectedShape.x) * (180 / Math.PI);
      const angleDelta = findShortestAngle(currentAngle - dragStartAngleRef.current);
      selectedShape.targetRotation = shapeStartAngleRef.current + angleDelta;
    };
    
    const handleAngleDragEnd = () => setIsDraggingAngle(false);
    
    window.addEventListener('mousemove', handleAngleDragMove);
    window.addEventListener('mouseup', handleAngleDragEnd);
    return () => {
        window.removeEventListener('mousemove', handleAngleDragMove);
        window.removeEventListener('mouseup', handleAngleDragEnd);
    };
  }, [isDraggingAngle, selectedShapeId]);


  useEffect(() => {
    const animate = () => {
      const allShapes = shapesRef.current;
      if (allShapes.length === 0) {
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }
      const bounds = { width: window.innerWidth, height: window.innerHeight };
      const padding = 100;
      
      if (selectedShapeId !== null && !allShapes.some(s => s.id === selectedShapeId)) {
        setSelectedShapeId(null);
        setIsDraggingAngle(false);
      }

      for (const shape of allShapes) {
        if (shape.animationState === 'reforming') {
          shape.animationCounter--;
          const progress = 1 - (shape.animationCounter / ANIMATION_DURATION);
          shape.scale = progress * progress;
          shape.opacity = progress;
          if (shape.animationCounter <= 0) shape.animationState = 'active';
        }

        let { vx, vy, speed, baseSpeed } = shape;
        
        vy += scrollVelocity * 0.05;
        
        const dxMouse = shape.x - mouseState.x;
        const dyMouse = shape.y - mouseState.y;
        const distMouseSq = dxMouse * dxMouse + dyMouse * dyMouse;
        const mouseRadius = 150;

        if (mouseState.isLeftDown && distMouseSq < mouseRadius * mouseRadius) {
            const distMouse = Math.sqrt(distMouseSq);
            const force = 1 - (distMouse / mouseRadius);
            const forceFactor = force * MOUSE_FORCE_STRENGTH / (distMouse + 0.1);
            vx += dxMouse * forceFactor * 0.01;
            vy += dyMouse * forceFactor * 0.01;
        }
        
        let avg_vx = 0, avg_vy = 0, neighbor_count = 0;
        for (const other of allShapes) {
            if (shape.id === other.id) continue;
            const d_sq = (shape.x - other.x)**2 + (shape.y - other.y)**2;
            if (d_sq < CONSTELLATION_DISTANCE ** 2) {
                avg_vx += other.vx;
                avg_vy += other.vy;
                neighbor_count++;
            }
        }
        if (neighbor_count > 0) {
            avg_vx /= neighbor_count;
            avg_vy /= neighbor_count;
            vx += (avg_vx - vx) * FLOCKING_STRENGTH * neighbor_count;
            vy += (avg_vy - vy) * FLOCKING_STRENGTH * neighbor_count;
        }

        shape.vx = vx;
        shape.vy = vy;
        speed = Math.sqrt(vx * vx + vy * vy);
        
        let targetSpeed = baseSpeed;
        if (shape.evasionTactic === 'accelerate') {
            targetSpeed *= ACCELERATION_BOOST;
        }
        speed += (targetSpeed - speed) * 0.05; // Smoothly return to target speed
        const minSpeed = baseSpeed * MIN_SPEED_FACTOR;
        if (speed < minSpeed) speed = minSpeed;

        if (shape.id !== selectedShapeId || !isDraggingAngle) {
            const desiredRotation = getAngle(vx, vy);
            const rotationDiff = findShortestAngle(desiredRotation - shape.targetRotation);
            shape.targetRotation += rotationDiff * 0.05;
        }
        
        const turnRate = shape.personality === 'agile' ? 0.2 : 0.1;
        const angleDiff = findShortestAngle(shape.targetRotation - shape.currentRotation);
        shape.currentRotation += angleDiff * turnRate;
        shape.rotation = shape.currentRotation;

        const rad = shape.currentRotation * (Math.PI / 180);
        shape.vx = Math.cos(rad) * speed;
        shape.vy = Math.sin(rad) * speed;
        shape.speed = speed;

        // --- Collision Detection & Avoidance (REWORKED) ---
        if (shape.evasionCooldownFrames > 0) shape.evasionCooldownFrames--;

        let potentialCollision: { time: number; id: number | string; angle: number; isUi: boolean; rect?: DOMRect } | null = null;
        
        // Only check for new collisions if the shape is not on a cooldown period.
        if (shape.evasionCooldownFrames <= 0) {
            // Reset state before each check.
            shape.collisionState = 'none';
            shape.evasionTactic = 'none';
            
            const myPath = Array.from({ length: PREDICTION_FRAMES }, (_, i) => ({
                x: shape.x + shape.vx * i,
                y: shape.y + shape.vy * i,
            }));

            // Check against other shapes
            for (const other of allShapes) {
                if (shape.id === other.id) continue;
                for (let i = 0; i < PREDICTION_FRAMES; i++) {
                    const otherX = other.x + other.vx * i;
                    const otherY = other.y + other.vy * i;
                    const distSq = (myPath[i].x - otherX)**2 + (myPath[i].y - otherY)**2;
                    const combinedRadius = (shape.size + other.size) / 2;
                    if (distSq < combinedRadius**2) {
                        const angleToOther = getAngle(other.x - shape.x, other.y - shape.y);
                        if (!potentialCollision || i < potentialCollision.time) {
                            potentialCollision = { time: i, id: other.id, angle: angleToOther, isUi: false };
                        }
                        break;
                    }
                }
            }
            
            // Check against UI obstacles
            for (const obs of obstacles) {
                const rect = obs.rect;
                for (let i = 0; i < PREDICTION_FRAMES; i++) {
                    const p = myPath[i];
                    const halfSize = shape.size / 2;
                    if (p.x + halfSize > rect.left && p.x - halfSize < rect.right && p.y + halfSize > rect.top && p.y - halfSize < rect.bottom) {
                        const angleToObs = getAngle(rect.left + rect.width / 2 - shape.x, rect.top + rect.height / 2 - shape.y);
                        if (!potentialCollision || i < potentialCollision.time) {
                            potentialCollision = { time: i, id: obs.id, angle: angleToObs, isUi: true, rect };
                        }
                        break;
                    }
                }
            }

            if (potentialCollision) {
                shape.collisionState = 'warning';
                shape.indicatorAngle = potentialCollision.angle;
                
                if (potentialCollision.time < EVASION_TEST_FRAMES) {
                    shape.collisionState = 'avoiding';
                    shape.evasionCooldownFrames = EVASION_COOLDOWN_FRAMES;
                    if (potentialCollision.isUi && potentialCollision.rect) {
                        onUiCollision(potentialCollision.id as string, potentialCollision.angle, potentialCollision.rect);
                    }
                    
                    const angleToThreat = potentialCollision.angle;
                    const diff = findShortestAngle(angleToThreat - shape.currentRotation);
                    
                    if (shape.personality === 'fast' && Math.abs(diff) > 135) {
                        shape.evasionTactic = 'accelerate';
                        shape.avoidanceAngle = 0;
                    } else {
                        shape.evasionTactic = 'turn';
                        const turnDirection = diff > 0 ? -1 : 1;
                        const turnAmount = shape.personality === 'agile' ? 90 : 60;
                        shape.avoidanceAngle = turnDirection * turnAmount;
                        shape.targetRotation = shape.currentRotation + shape.avoidanceAngle;
                    }
                }
            }
        } else {
             // If on cooldown, maintain the 'avoiding' state visually.
             shape.collisionState = 'avoiding';
        }

        shape.x += shape.vx;
        shape.y += shape.vy;
        
        const isOutOfBounds = shape.x < -padding || shape.x > bounds.width + padding || shape.y < -padding || shape.y > bounds.height + padding;
        const isInvalid = !isFinite(shape.x) || !isFinite(shape.y);

        if (isOutOfBounds || isInvalid) {
             if (shape.id === selectedShapeId) {
                setSelectedShapeId(null);
                setIsDraggingAngle(false);
            }
            placeShapeOnEdge(shape, bounds);
        }
      }
      
      setShapes([...allShapes]);
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [scrollVelocity, mouseState, obstacles, onUiCollision, selectedShapeId, isDraggingAngle]);
  
  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
      {shapes.map((shape) => {
        const isSelected = shape.id === selectedShapeId;
        const borderRadius = shape.type === 'circle' ? '50%' : '0.5rem';

        const outerContainerStyle: React.CSSProperties = {
          position: 'absolute',
          width: `${shape.size}px`,
          height: `${shape.size}px`,
          left: 0,
          top: 0,
          transform: `translate(${shape.x - shape.size / 2}px, ${shape.y - shape.size / 2}px) scale(${shape.scale})`,
          opacity: shape.opacity,
          transition: 'transform 0.05s linear, opacity 0.2s ease-out',
          zIndex: isSelected ? 10 : 1,
          pointerEvents: 'auto',
        };

        const rotatingContainerStyle: React.CSSProperties = {
          position: 'relative',
          width: '100%',
          height: '100%',
          transform: `rotate(${shape.rotation}deg)`,
          transition: 'transform 0.1s linear',
        };
        
        const shapeStyle: React.CSSProperties = {
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: shape.color.fill,
          border: `2px solid ${shape.color.stroke}`,
          transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out',
          borderRadius: borderRadius,
          transform: isSelected ? 'translateY(-10px)' : 'translateY(0px)',
        };
        
        if (isSelected) {
          shapeStyle.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)';
        }
        
        // --- NEW V2: Indicator Calculation ---
        const isIndicatorVisible = shape.collisionState === 'warning' || shape.collisionState === 'avoiding';
        const isAvoiding = shape.collisionState === 'avoiding';
        
        // The indicator's angle relative to the shape's current rotation
        const relativeIndicatorAngle = findShortestAngle(shape.indicatorAngle - shape.rotation);
        // The start angle for the conic-gradient, centering the 108deg arc
        const gradientStartAngle = relativeIndicatorAngle - 54; // 108 / 2 = 54

        // Cast style object to React.CSSProperties to allow for CSS custom properties.
        const indicatorStyle = {
          borderRadius,
          '--indicator-angle': `${gradientStartAngle}deg`,
        } as React.CSSProperties;

        return (
          <div key={shape.id} style={outerContainerStyle}>
            <div style={rotatingContainerStyle}>
              
              {/* --- NEW V2: Robust Glow Indicator (Rendered First -> Below) --- */}
              <div
                className={`glow-indicator ${isIndicatorVisible ? 'visible' : ''} ${isAvoiding ? 'avoiding' : ''}`}
                style={indicatorStyle}
              >
                <div className="glow-indicator-arc" />
              </div>

              {/* --- Actual Shape (Rendered Second -> On Top) --- */}
              <div
                style={shapeStyle}
                onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}
                onContextMenu={(e) => e.preventDefault()}
              >
                <div
                  className={`orientation-dot ${
                    shape.collisionState === 'warning' ? 'dot-warning' : ''
                  } ${
                    shape.collisionState === 'avoiding' ? 'dot-avoiding' : ''
                  } ${
                    shape.evasionTactic === 'accelerate' ? 'dot-accelerating' : ''
                  }`}
                  style={{ '--dot-color': shape.color.stroke } as React.CSSProperties}
                />
                <div className="internal-arrow" style={{ '--arrow-color': shape.color.stroke } as React.CSSProperties} />

                {isSelected && (
                  <div className="absolute w-full h-full top-0 left-0 flex items-center justify-center">
                    <div
                      className="relative w-[150%] h-[150%] border-2 border-dashed border-blue-300/70 rounded-full animate-spin-slow"
                      style={{ transform: `rotate(${-shape.rotation}deg)` }}
                    >
                      <div
                        className="absolute top-[-8px] left-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-grab active:cursor-grabbing"
                        style={{ transform: `translateX(-50%) rotate(${shape.rotation}deg)` }}
                        onMouseDown={handleAngleDragStart}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BackgroundShapes;