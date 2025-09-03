import React, { useState, useEffect, useRef } from 'react';

// --- TYPE DEFINITIONS ---
type ShapeType = 'circle' | 'rounded-square';
type CollisionState = 'none' | 'warning' | 'avoiding';

interface Obstacle {
  id: string;
  rect: DOMRect;
}

interface Shape {
  id: number;
  type: ShapeType;
  color: string;
  size: number;
  x: number; y: number;
  vx: number; vy: number;
  rotation: number;
  scale: number;
  opacity: number;
  isSpawning: boolean;
  collisionState: CollisionState;
  indicatorAngle: number;
  avoidanceAngle: number;
  reactionDelayFrames: number;
  evasionCooldownFrames: number; // Cooldown for evasion
}

interface BackgroundShapesProps {
  obstacles: Obstacle[];
  onUiCollision: (id: string, angle: number, rect: DOMRect) => void;
  generationTrigger: number;
}

// --- CONSTANTS ---
const colors = ['bg-orange-400', 'bg-yellow-400', 'bg-red-400', 'bg-green-400', 'bg-blue-400', 'bg-stone-400'];
const shapeTypes: ShapeType[] = ['circle', 'rounded-square'];
const NUM_SHAPES = 8;
const PREDICTION_FRAMES = 360; // 6 seconds @ 60fps
const REACTION_DELAY_FRAMES = 60; // 1 second @ 60fps
const EVASION_COOLDOWN_FRAMES = 300; // 5 seconds @ 60fps
const NEAR_MISS_BUFFER = 75; // Pixels for near miss warning
const EVASION_TEST_FRAMES = 180; // 3 seconds @ 60fps to test evasion route

// --- HELPER FUNCTIONS ---
const getAngle = (vx: number, vy: number) => (Math.atan2(vy, vx) * 180) / Math.PI;

const findLeastUsed = <T extends string>(counts: Record<T, number>, allItems: T[]): T => {
  const shuffled = [...allItems].sort(() => Math.random() - 0.5);
  return shuffled.reduce((least, current) => counts[current] < counts[least] ? current : least, shuffled[0]);
};

const placeShapeInQuadrant = (
    shape: Partial<Shape>,
    quadrant: number,
    bounds: { width: number; height: number },
    allShapes: Shape[]
): boolean => {
    const MAX_TRIES = 50;
    for (let i = 0; i < MAX_TRIES; i++) {
        const safePadding = (shape.size ?? 50) / 2 + 10;
        const qWidth = bounds.width / 2;
        const qHeight = bounds.height / 2;
        const qx = quadrant % 2 === 0 ? 0 : qWidth;
        const qy = quadrant < 2 ? 0 : qHeight;
        
        const newX = Math.random() * (qWidth - safePadding * 2) + qx + safePadding;
        const newY = Math.random() * (qHeight - safePadding * 2) + qy + safePadding;

        let isOverlapping = false;
        for (const other of allShapes) {
            if (shape.id === other.id || other.opacity <= 0) continue;
            if (Math.hypot(newX - other.x, newY - other.y) < ((shape.size ?? 50) / 2 + other.size / 2 + 50)) {
                isOverlapping = true; break;
            }
        }
        if (isOverlapping) continue;
        
        const baseSpeed = 0.4;
        const angle = Math.atan2(newY - bounds.height / 2, newX - bounds.width / 2);
        const speedVariation = (Math.random() * 0.4) + 0.8;
        const vx = Math.cos(angle) * baseSpeed * speedVariation;
        const vy = Math.sin(angle) * baseSpeed * speedVariation;
        
        Object.assign(shape, {
            x: newX, y: newY, vx, vy, rotation: getAngle(vx, vy),
            isSpawning: true, scale: 0, opacity: 0, collisionState: 'none',
            indicatorAngle: 0, avoidanceAngle: 0, reactionDelayFrames: 0,
            evasionCooldownFrames: 0,
        });
        return true;
    }
    return false; // Fallback handled by caller
};


const placeShape = (
    shape: Partial<Shape>,
    bounds: { width: number; height: number },
    allShapes: Shape[]
): boolean => {
    // --- Placement in least populated quadrant ---
    const quadrantCounts = [0, 0, 0, 0];
    allShapes.forEach(s => {
        if (s.id !== shape.id && s.x >= 0) {
            const s_quad = Math.floor(s.x / (bounds.width / 2)) + Math.floor(s.y / (bounds.height / 2)) * 2;
            if (s_quad >= 0 && s_quad < 4) quadrantCounts[s_quad]++;
        }
    });
    const targetQuadrant = quadrantCounts.indexOf(Math.min(...quadrantCounts));
    return placeShapeInQuadrant(shape, targetQuadrant, bounds, allShapes);
};

// --- CORE LOGIC FUNCTIONS ---
const createInitialShapes = (bounds: { width: number; height: number }): Shape[] => {
    const shapeProperties: { type: ShapeType; color: string; size: number }[] = [];
    const colorCounts: Record<string, number> = Object.fromEntries(colors.map(c => [c, 0]));
    const typeCounts: Record<string, number> = Object.fromEntries(shapeTypes.map(t => [t, 0]));

    for (let i = 0; i < NUM_SHAPES; i++) {
        const type = findLeastUsed(typeCounts, shapeTypes);
        const color = findLeastUsed(colorCounts, colors);
        typeCounts[type]++;
        colorCounts[color]++;
        shapeProperties.push({
            type, color, size: Math.floor(Math.random() * 50) + 30,
        });
    }

    const shapes: Shape[] = shapeProperties.map((props, i) => ({
        id: i,
        ...props,
        x: -100, y: -100, vx: 0, vy: 0, rotation: 0, scale: 0, opacity: 0,
        isSpawning: true, collisionState: 'none', indicatorAngle: 0,
        avoidanceAngle: 0, reactionDelayFrames: 0, evasionCooldownFrames: 0,
    }));

    shapes.forEach(shape => {
        placeShape(shape, bounds, shapes);
    });

    return shapes;
};


// --- REACT COMPONENT ---
const BackgroundShapes: React.FC<BackgroundShapesProps> = ({ obstacles, onUiCollision, generationTrigger }) => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const shapesRef = useRef<Shape[]>([]);
  const elementsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const animationFrameId = useRef<number | null>(null);
  const mousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const prevGenerationTrigger = useRef(generationTrigger);

  useEffect(() => {
    if (generationTrigger > prevGenerationTrigger.current) {
        const bounds = { width: window.innerWidth, height: window.innerHeight };
        const newShapes: Shape[] = [];
        const currentShapes = shapesRef.current;
        const baseId = (currentShapes.length > 0 ? Math.max(...currentShapes.map(s => s.id)) : 0) + 1;

        for (let i = 0; i < 4; i++) {
            const quadrant = i;
            
            const allCurrentShapes = [...currentShapes, ...newShapes];
            const colorCounts: Record<string, number> = Object.fromEntries(colors.map(c => [c, 0]));
            const typeCounts: Record<string, number> = Object.fromEntries(shapeTypes.map(t => [t, 0]));
            allCurrentShapes.forEach(s => {
                if (s.opacity > 0 && s.x >= 0) {
                    colorCounts[s.color]++;
                    typeCounts[s.type]++;
                }
            });
            const type = findLeastUsed(typeCounts, shapeTypes);
            const color = findLeastUsed(colorCounts, colors);

            const newShapePartial: Partial<Shape> = {
                id: baseId + i,
                type: type,
                color: color,
                size: Math.floor(Math.random() * 50) + 30,
            };

            if (placeShapeInQuadrant(newShapePartial, quadrant, bounds, allCurrentShapes)) {
                newShapes.push(newShapePartial as Shape);
            }
        }
        
        shapesRef.current = [...currentShapes, ...newShapes];
        setShapes(shapesRef.current);
        prevGenerationTrigger.current = generationTrigger;
    }
  }, [generationTrigger]);

  useEffect(() => {
    setShapes(createInitialShapes({ width: window.innerWidth, height: window.innerHeight }));
  }, []);

  useEffect(() => {
    if (shapes.length === 0) return;
    shapesRef.current = JSON.parse(JSON.stringify(shapes));

    const handleMouseMove = (event: MouseEvent) => { mousePos.current = { x: event.clientX, y: event.clientY }; };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      const bounds = { width: window.innerWidth, height: window.innerHeight };
      const currentMouse = mousePos.current;
      const currentShapes = shapesRef.current;

      // Reset indicators for shapes NOT in reaction delay
      currentShapes.forEach(s => {
        if (s.reactionDelayFrames === 0) s.collisionState = 'none';
        if (s.evasionCooldownFrames > 0) s.evasionCooldownFrames--;
      });

      // Predict collisions and near misses
      for (let i = 0; i < currentShapes.length; i++) {
        const shapeA = currentShapes[i];
        if (shapeA.opacity < 1 || shapeA.evasionCooldownFrames > 0) continue;

        // Vs other shapes
        for (let j = i + 1; j < currentShapes.length; j++) {
            const shapeB = currentShapes[j];
            if (shapeB.opacity < 1 || shapeB.evasionCooldownFrames > 0) continue;
            
            const currentDist = Math.hypot(shapeA.x - shapeB.x, shapeA.y - shapeB.y);
            const nearMissThreshold = (shapeA.size / 2 + shapeB.size / 2) + NEAR_MISS_BUFFER;
            const collisionThreshold = (shapeA.size / 2 + shapeB.size / 2);

            if (currentDist < nearMissThreshold) {
                const dotProduct = (shapeB.x - shapeA.x) * (shapeA.vx - shapeB.vx) + (shapeB.y - shapeA.y) * (shapeA.vy - shapeB.vy);
                if (dotProduct > 0) {
                     if (shapeA.collisionState === 'none') {
                        shapeA.collisionState = 'warning';
                        shapeA.indicatorAngle = getAngle(shapeB.x - shapeA.x, shapeB.y - shapeA.y);
                    }
                    if (shapeB.collisionState === 'none') {
                        shapeB.collisionState = 'warning';
                        shapeB.indicatorAngle = getAngle(shapeA.x - shapeB.x, shapeA.y - shapeB.y);
                    }
                }
            }

            const futureAx = shapeA.x + shapeA.vx * PREDICTION_FRAMES;
            const futureAy = shapeA.y + shapeA.vy * PREDICTION_FRAMES;
            const futureBx = shapeB.x + shapeB.vx * PREDICTION_FRAMES;
            const futureBy = shapeB.y + shapeB.vy * PREDICTION_FRAMES;
            
            if (Math.hypot(futureAx - futureBx, futureAy - futureBy) < collisionThreshold) {
                if (shapeA.reactionDelayFrames === 0 && shapeB.reactionDelayFrames === 0) {
                    const reactingShape = Math.random() > 0.5 ? shapeA : shapeB;
                    const otherShape = reactingShape === shapeA ? shapeB : shapeA;
                    
                    reactingShape.reactionDelayFrames = REACTION_DELAY_FRAMES;
                    reactingShape.collisionState = 'avoiding';
                    reactingShape.evasionCooldownFrames = EVASION_COOLDOWN_FRAMES;
                    reactingShape.indicatorAngle = getAngle(otherShape.x - reactingShape.x, otherShape.y - reactingShape.y);
                    
                    const { vx, vy } = reactingShape;
                    const angleRad = Math.atan2(vy, vx);
                    const leftTurnAngle = angleRad - Math.PI / 2;
                    const rightTurnAngle = angleRad + Math.PI / 2;
                    const speed = Math.hypot(vx, vy);
                    const leftVx = Math.cos(leftTurnAngle) * speed, leftVy = Math.sin(leftTurnAngle) * speed;
                    const rightVx = Math.cos(rightTurnAngle) * speed, rightVy = Math.sin(rightTurnAngle) * speed;
                    
                    const futureLeftX = reactingShape.x + leftVx * EVASION_TEST_FRAMES;
                    const futureLeftY = reactingShape.y + leftVy * EVASION_TEST_FRAMES;
                    const futureRightX = reactingShape.x + rightVx * EVASION_TEST_FRAMES;
                    const futureRightY = reactingShape.y + rightVy * EVASION_TEST_FRAMES;
                    const futureOtherX = otherShape.x + otherShape.vx * EVASION_TEST_FRAMES;
                    const futureOtherY = otherShape.y + otherShape.vy * EVASION_TEST_FRAMES;

                    const isLeftSafe = Math.hypot(futureLeftX - futureOtherX, futureLeftY - futureOtherY) > collisionThreshold;
                    const isRightSafe = Math.hypot(futureRightX - futureOtherX, futureRightY - futureOtherY) > collisionThreshold;

                    if (isLeftSafe && !isRightSafe) {
                        reactingShape.avoidanceAngle = getAngle(leftVx, leftVy);
                    } else if (!isLeftSafe && isRightSafe) {
                        reactingShape.avoidanceAngle = getAngle(rightVx, rightVy);
                    } else {
                        reactingShape.avoidanceAngle = Math.random() > 0.5 ? getAngle(leftVx, leftVy) : getAngle(rightVx, rightVy);
                    }
                }
            } 
        }
        
        if (shapeA.collisionState === 'avoiding') continue; 
        
        for (const obstacle of obstacles) {
            const { left, right, top, bottom } = obstacle.rect;
            const buffer = shapeA.size / 2;
            const futureX = shapeA.x + shapeA.vx * PREDICTION_FRAMES;
            const futureY = shapeA.y + shapeA.vy * PREDICTION_FRAMES;

            if (futureX > left - buffer && futureX < right + buffer && futureY > top - buffer && futureY < bottom + buffer) {
                const angleToObstacle = getAngle(left + (right - left) / 2 - shapeA.x, top + (bottom - top) / 2 - shapeA.y);
                onUiCollision(obstacle.id, angleToObstacle, obstacle.rect);
                
                shapeA.reactionDelayFrames = REACTION_DELAY_FRAMES;
                shapeA.collisionState = 'avoiding';
                shapeA.evasionCooldownFrames = EVASION_COOLDOWN_FRAMES;
                shapeA.indicatorAngle = angleToObstacle;
                
                const { vx, vy } = shapeA;
                const angleRad = Math.atan2(vy, vx);
                const leftTurnAngle = angleRad - Math.PI / 2;
                const rightTurnAngle = angleRad + Math.PI / 2;
                shapeA.avoidanceAngle = Math.random() > 0.5 ? leftTurnAngle * 180 / Math.PI : rightTurnAngle * 180 / Math.PI;
                break;
            }
        }
      }

      currentShapes.forEach((shape) => {
        if (shape.isSpawning) {
          shape.scale = Math.min(1, shape.scale + 0.04);
          shape.opacity = Math.min(1, shape.opacity + 0.04);
          if (shape.scale >= 1) shape.isSpawning = false;
        }
        
        if (shape.reactionDelayFrames > 0) {
            shape.reactionDelayFrames--;
            if (shape.reactionDelayFrames === 0) {
                const newAngleRad = shape.avoidanceAngle * (Math.PI / 180);
                const speed = Math.hypot(shape.vx, shape.vy);
                shape.vx = Math.cos(newAngleRad) * speed;
                shape.vy = Math.sin(newAngleRad) * speed;
                shape.rotation = shape.avoidanceAngle;
            }
        }
        
        shape.x += shape.vx;
        shape.y += shape.vy;

        if (shape.x > bounds.width + shape.size || shape.x < -shape.size || shape.y > bounds.height + shape.size || shape.y < -shape.size) {
            const colorCounts: Record<string, number> = Object.fromEntries(colors.map(c => [c, 0]));
            const typeCounts: Record<string, number> = Object.fromEntries(shapeTypes.map(t => [t, 0]));
            currentShapes.forEach(s => { if (s.id !== shape.id && s.opacity > 0 && s.x >= 0) {
                colorCounts[s.color]++;
                typeCounts[s.type]++;
            }});
            shape.color = findLeastUsed(colorCounts, colors);
            shape.type = findLeastUsed(typeCounts, shapeTypes);
            shape.size = Math.floor(Math.random() * 50) + 30;
            
            const potentialTargets = currentShapes.filter(s => s.id !== shape.id && s.opacity > 0 && s.x >= 0);
            if (potentialTargets.length > 0 && Math.random() < 0.1) {
                const targetShape = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
                let newX = 0, newY = 0, placed = false;
                const MAX_TRIES = 30;
                const spawnRadius = 300;

                for (let i = 0; i < MAX_TRIES; i++) {
                    const angle = Math.random() * 2 * Math.PI;
                    const radius = Math.random() * spawnRadius + (shape.size / 2 + targetShape.size / 2 + 50);
                    
                    newX = targetShape.x + Math.cos(angle) * radius;
                    newY = targetShape.y + Math.sin(angle) * radius;

                    const safePadding = shape.size / 2;
                    if (newX < safePadding || newX > bounds.width - safePadding || newY < safePadding || newY > bounds.height - safePadding) {
                        continue;
                    }
                    
                    let isOverlapping = false;
                    for (const other of currentShapes) {
                        if (shape.id === other.id || other.opacity <= 0) continue;
                        if (Math.hypot(newX - other.x, newY - other.y) < ((shape.size / 2) + other.size / 2 + 20)) {
                            isOverlapping = true;
                            break;
                        }
                    }
                    
                    if (!isOverlapping) {
                        placed = true;
                        break;
                    }
                }

                if (placed) {
                    const collisionSpeed = 0.6;
                    const angleToTarget = Math.atan2(targetShape.y - newY, targetShape.x - newX);
                    const newVx = Math.cos(angleToTarget) * collisionSpeed;
                    const newVy = Math.sin(angleToTarget) * collisionSpeed;
                    Object.assign(shape, {
                        x: newX, y: newY, vx: newVx, vy: newVy, rotation: getAngle(newVx, newVy),
                        isSpawning: true, scale: 0, opacity: 0, collisionState: 'none',
                        indicatorAngle: 0, avoidanceAngle: 0, reactionDelayFrames: 0,
                        evasionCooldownFrames: 0,
                    });
                } else {
                    placeShape(shape, bounds, currentShapes);
                }
            } else {
                placeShape(shape, bounds, currentShapes);
            }
        }

        const el = elementsRef.current.get(shape.id);
        if (!el) return;
        
        const parallaxX = (currentMouse.x / bounds.width - 0.5) * (shape.size / 2);
        const parallaxY = (currentMouse.y / bounds.height - 0.5) * (shape.size / 2);
        const rotationStyle = shape.type === 'rounded-square' ? `rotate(${shape.rotation}deg)` : '';

        el.style.opacity = `${shape.opacity * 0.2}`;
        el.style.transform = `translate(${shape.x - shape.size/2 + parallaxX}px, ${shape.y - shape.size/2 + parallaxY}px) scale(${shape.scale}) ${rotationStyle}`;

        const shapeDiv = el.children[0] as HTMLDivElement;
        const indicatorContainer = el.children[1] as HTMLDivElement;
        if (shapeDiv) {
            shapeDiv.className = `${shape.color}`;
            shapeDiv.style.borderRadius = shape.type === 'circle' ? '50%' : '20%';
        }
        if(indicatorContainer) {
            indicatorContainer.style.opacity = shape.collisionState !== 'none' ? '1' : '0';
            if (shape.collisionState !== 'none') {
                const stateClass = shape.collisionState === 'avoiding' ? 'indicator-avoiding' : 'indicator-warning';
                const shapeTypeClass = `indicator-is-${shape.type}`;
                indicatorContainer.className = `collision-indicator ${stateClass} ${shapeTypeClass}`;
                
                const correctedIndicatorAngle = shape.indicatorAngle + 90;
                indicatorContainer.style.transform = `translate(-50%, -50%) rotate(${correctedIndicatorAngle}deg)`;
                
                const arrowDiv = indicatorContainer.children[1] as HTMLDivElement;
                if(arrowDiv) {
                  const relativeAvoidanceAngle = shape.avoidanceAngle - shape.indicatorAngle;
                  arrowDiv.style.transform = `translateX(-50%) rotate(${relativeAvoidanceAngle}deg)`;
                }
            }
        }
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [shapes, obstacles, onUiCollision]);

  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {shapes.map((shape) => (
        <div
          key={shape.id}
          ref={(node) => {
            if (node) elementsRef.current.set(shape.id, node);
            else elementsRef.current.delete(shape.id);
          }}
          className="absolute"
          style={{ top: 0, left: 0, willChange: 'transform, opacity' }}
        >
          <div style={{width: `${shape.size}px`, height: `${shape.size}px`}} />
          <div className="collision-indicator">
            <div className="indicator-arc" />
            <div className="indicator-arrow" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default BackgroundShapes;