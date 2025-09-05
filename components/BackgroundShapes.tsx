import React, { useState, useEffect, useRef } from 'react';

// --- TYPE DEFINITIONS ---
type ShapeType = 'circle' | 'rounded-square';
type CollisionState = 'none' | 'warning' | 'avoiding';

interface ColorScheme {
  fill: string;
  stroke: string;
}

interface Obstacle {
  id: string;
  rect: DOMRect;
}

interface Shape {
  id: number;
  type: ShapeType;
  color: ColorScheme;
  size: number;
  x: number; y: number;
  vx: number; vy: number;
  rotation: number;
  currentRotation: number; // The actual direction of movement in degrees
  targetRotation: number;  // The direction the shape wants to turn to in degrees
  scale: number;
  opacity: number;
  isSpawning: boolean;
  collisionState: CollisionState;
  indicatorAngle: number;
  avoidanceAngle: number;
  reactionDelayFrames: number;
  evasionCooldownFrames: number; // Cooldown for evasion
  isHovered: boolean; // NEW: For mouse interaction feedback
}

interface BackgroundShapesProps {
  obstacles: Obstacle[];
  onUiCollision: (id: string, angle: number, rect: DOMRect) => void;
  generationTrigger: number;
}

// --- CONSTANTS ---
const colorSchemes: ColorScheme[] = [
  { fill: 'rgba(251, 146, 60, 1)', stroke: 'rgba(234, 88, 12, 1)' },    // orange-400, orange-600
  { fill: 'rgba(250, 204, 21, 1)', stroke: 'rgba(202, 138, 4, 1)' },    // yellow-400, yellow-600
  { fill: 'rgba(248, 113, 113, 1)', stroke: 'rgba(220, 38, 38, 1)' },    // red-400, red-600
  { fill: 'rgba(74, 222, 128, 1)', stroke: 'rgba(22, 163, 74, 1)' },   // green-400, green-600
  { fill: 'rgba(96, 165, 250, 1)', stroke: 'rgba(37, 99, 235, 1)' },    // blue-400, blue-600
  { fill: 'rgba(168, 162, 158, 1)', stroke: 'rgba(87, 83, 78, 1)' },   // stone-400, stone-600
];
const shapeTypes: ShapeType[] = ['circle', 'rounded-square'];
const NUM_SHAPES = 8;
const PREDICTION_FRAMES = 720; // 12 seconds @ 60fps
const REACTION_DELAY_FRAMES = 60; // 1 second @ 60fps
const EVASION_COOLDOWN_FRAMES = 300; // 5 seconds @ 60fps
const NEAR_MISS_BUFFER = 75; // Pixels for near miss warning
const EVASION_TEST_FRAMES = 180; // 3 seconds @ 60fps to test evasion route
const TURN_RATE = 2; // Degrees per frame for smooth turning

// --- HELPER FUNCTIONS ---
const getAngle = (vx: number, vy: number) => (Math.atan2(vy, vx) * 180) / Math.PI;

const findShortestAngle = (angle: number): number => {
    angle = angle % 360;
    if (angle > 180) return angle - 360;
    if (angle < -180) return angle + 360;
    return angle;
};

const findLeastUsedColor = (counts: Record<string, number>, allItems: ColorScheme[]): ColorScheme => {
  const shuffled = [...allItems].sort(() => Math.random() - 0.5);
  return shuffled.reduce((least, current) => (counts[current.fill] || 0) < (counts[least.fill] || 0) ? current : least, shuffled[0]);
};

const findLeastUsedType = (counts: Record<string, number>, allItems: ShapeType[]): ShapeType => {
  const shuffled = [...allItems].sort(() => Math.random() - 0.5);
  return shuffled.reduce((least, current) => (counts[current] || 0) < (counts[least] || 0) ? current : least, shuffled[0]);
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
        const rotation = getAngle(vx, vy);
        
        Object.assign(shape, {
            x: newX, y: newY, vx, vy, rotation, currentRotation: rotation, targetRotation: rotation,
            isSpawning: true, scale: 0, opacity: 0, collisionState: 'none',
            indicatorAngle: 0, avoidanceAngle: 0, reactionDelayFrames: 0,
            evasionCooldownFrames: 0, isHovered: false,
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
    const shapeProperties: { type: ShapeType; color: ColorScheme; size: number }[] = [];
    const colorCounts: Record<string, number> = Object.fromEntries(colorSchemes.map(c => [c.fill, 0]));
    const typeCounts: Record<string, number> = Object.fromEntries(shapeTypes.map(t => [t, 0]));

    for (let i = 0; i < NUM_SHAPES; i++) {
        const type = findLeastUsedType(typeCounts, shapeTypes);
        const color = findLeastUsedColor(colorCounts, colorSchemes);
        typeCounts[type]++;
        colorCounts[color.fill]++;
        shapeProperties.push({
            type, color, size: Math.floor(Math.random() * 31) + 40, // Range: 40px to 70px
        });
    }

    const shapes: Shape[] = shapeProperties.map((props, i) => ({
        id: i,
        ...props,
        x: -100, y: -100, vx: 0, vy: 0, rotation: 0, currentRotation: 0, targetRotation: 0,
        scale: 0, opacity: 0, isSpawning: true, collisionState: 'none', indicatorAngle: 0,
        avoidanceAngle: 0, reactionDelayFrames: 0, evasionCooldownFrames: 0, isHovered: false,
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
            const colorCounts: Record<string, number> = Object.fromEntries(colorSchemes.map(c => [c.fill, 0]));
            const typeCounts: Record<string, number> = Object.fromEntries(shapeTypes.map(t => [t, 0]));
            allCurrentShapes.forEach(s => {
                if (s.opacity > 0 && s.x >= 0) {
                    colorCounts[s.color.fill]++;
                    typeCounts[s.type]++;
                }
            });
            const type = findLeastUsedType(typeCounts, shapeTypes);
            const color = findLeastUsedColor(colorCounts, colorSchemes);

            const newShapePartial: Partial<Shape> = {
                id: baseId + i,
                type: type,
                color: color,
                size: Math.floor(Math.random() * 31) + 40, // Range: 40px to 70px
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

  const initiateEvasion = (reactingShape: Shape, otherShape: Shape | Obstacle) => {
      reactingShape.reactionDelayFrames = REACTION_DELAY_FRAMES;
      reactingShape.collisionState = 'avoiding';
      reactingShape.evasionCooldownFrames = EVASION_COOLDOWN_FRAMES;

      let otherX: number, otherY: number;
      if ('rect' in otherShape) { // It's an Obstacle
        otherX = otherShape.rect.left + otherShape.rect.width / 2;
        otherY = otherShape.rect.top + otherShape.rect.height / 2;
      } else { // It's a Shape
        otherX = otherShape.x;
        otherY = otherShape.y;
      }
      reactingShape.indicatorAngle = getAngle(otherX - reactingShape.x, otherY - reactingShape.y);

      // --- Smarter Evasion Logic ---
      const speed = Math.hypot(reactingShape.vx, reactingShape.vy);
      const angleRad = reactingShape.currentRotation * (Math.PI / 180);
      const leftTurnAngle = angleRad - Math.PI / 2;
      const rightTurnAngle = angleRad + Math.PI / 2;

      const leftVx = Math.cos(leftTurnAngle) * speed, leftVy = Math.sin(leftTurnAngle) * speed;
      const rightVx = Math.cos(rightTurnAngle) * speed, rightVy = Math.sin(rightTurnAngle) * speed;

      const futureLeftX = reactingShape.x + leftVx * EVASION_TEST_FRAMES;
      const futureLeftY = reactingShape.y + leftVy * EVASION_TEST_FRAMES;
      const futureRightX = reactingShape.x + rightVx * EVASION_TEST_FRAMES;
      const futureRightY = reactingShape.y + rightVy * EVASION_TEST_FRAMES;
      
      let futureOtherX: number, futureOtherY: number;
      if ('rect' in otherShape) { // It's an Obstacle
        futureOtherX = otherX;
        futureOtherY = otherY;
      } else { // It's a Shape
        futureOtherX = otherShape.x + otherShape.vx * EVASION_TEST_FRAMES;
        futureOtherY = otherShape.y + otherShape.vy * EVASION_TEST_FRAMES;
      }

      const leftDist = Math.hypot(futureLeftX - futureOtherX, futureLeftY - futureOtherY);
      const rightDist = Math.hypot(futureRightX - futureOtherX, futureRightY - futureOtherY);

      if (leftDist > rightDist) {
          reactingShape.avoidanceAngle = leftTurnAngle * (180 / Math.PI);
      } else {
          reactingShape.avoidanceAngle = rightTurnAngle * (180 / Math.PI);
      }
  };

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
        if (s.reactionDelayFrames === 0) {
            s.collisionState = 'none';
            s.targetRotation = s.currentRotation;
        }
        if (s.evasionCooldownFrames > 0) s.evasionCooldownFrames--;
      });

      // Predict collisions and near misses
      for (let i = 0; i < currentShapes.length; i++) {
        const shapeA = currentShapes[i];
        if (shapeA.opacity < 1) continue;

        // --- Vs other shapes ---
        for (let j = i + 1; j < currentShapes.length; j++) {
            const shapeB = currentShapes[j];
            if (shapeB.opacity < 1) continue;
            
            // Allow active shapes to avoid shapes on cooldown
            if (shapeA.evasionCooldownFrames > 0 && shapeB.evasionCooldownFrames > 0) continue;

            const collisionThreshold = (shapeA.size / 2 + shapeB.size / 2);
            let willCollide = false;
            let timeToCollision = Infinity;

            for (let t = 1; t <= PREDICTION_FRAMES; t += 10) {
                const futureAx = shapeA.x + shapeA.vx * t;
                const futureAy = shapeA.y + shapeA.vy * t;
                const futureBx = shapeB.x + shapeB.vx * t;
                const futureBy = shapeB.y + shapeB.vy * t;
                if (Math.hypot(futureAx - futureBx, futureAy - futureBy) < collisionThreshold) {
                    willCollide = true; timeToCollision = t; break;
                }
            }
            
            if (willCollide) {
                const canA_react = shapeA.reactionDelayFrames === 0 && shapeA.evasionCooldownFrames === 0;
                const canB_react = shapeB.reactionDelayFrames === 0 && shapeB.evasionCooldownFrames === 0;

                if (canA_react && !canB_react) {
                    initiateEvasion(shapeA, shapeB);
                } else if (!canA_react && canB_react) {
                    initiateEvasion(shapeB, shapeA);
                } else if (canA_react && canB_react) {
                    const reactingShape = (timeToCollision < PREDICTION_FRAMES / 2) ? (Math.random() > 0.5 ? shapeA : shapeB) : shapeA;
                    const otherShape = reactingShape === shapeA ? shapeB : shapeA;
                    initiateEvasion(reactingShape, otherShape);
                }
            } else {
                 const currentDist = Math.hypot(shapeA.x - shapeB.x, shapeA.y - shapeB.y);
                 const nearMissThreshold = collisionThreshold + NEAR_MISS_BUFFER;
                 if (currentDist < nearMissThreshold) {
                     const dotProduct = (shapeB.x - shapeA.x) * (shapeA.vx - shapeB.vx) + (shapeB.y - shapeA.y) * (shapeA.vy - shapeB.vy);
                     if (dotProduct > 0) {
                         if (shapeA.collisionState === 'none' && shapeA.evasionCooldownFrames === 0) {
                             shapeA.collisionState = 'warning';
                             shapeA.indicatorAngle = getAngle(shapeB.x - shapeA.x, shapeB.y - shapeA.y);
                         }
                         if (shapeB.collisionState === 'none' && shapeB.evasionCooldownFrames === 0) {
                             shapeB.collisionState = 'warning';
                             shapeB.indicatorAngle = getAngle(shapeA.x - shapeB.x, shapeA.y - shapeB.y);
                         }
                     }
                 }
            }
        }
        
        // --- Vs UI Obstacles ---
        const canA_react_to_ui = shapeA.reactionDelayFrames === 0 && shapeA.evasionCooldownFrames === 0;
        if (canA_react_to_ui) {
            for (const obstacle of obstacles) {
                const { left, right, top, bottom } = obstacle.rect;
                const buffer = shapeA.size / 2;
                
                let willCollide = false;
                for (let t = 1; t <= PREDICTION_FRAMES; t += 10) {
                    const futureX = shapeA.x + shapeA.vx * t;
                    const futureY = shapeA.y + shapeA.vy * t;
                    if (futureX > left - buffer && futureX < right + buffer && futureY > top - buffer && futureY < bottom + buffer) {
                        willCollide = true;
                        break;
                    }
                }

                if (willCollide) {
                    const angleToObstacle = getAngle(left + (right - left) / 2 - shapeA.x, top + (bottom - top) / 2 - shapeA.y);
                    onUiCollision(obstacle.id, angleToObstacle, obstacle.rect);
                    initiateEvasion(shapeA, obstacle);
                    break; 
                }
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
                shape.targetRotation = shape.avoidanceAngle;
            }
        }
        
        const angleDifference = findShortestAngle(shape.targetRotation - shape.currentRotation);
        if (Math.abs(angleDifference) > 0.5) {
            const turnAmount = Math.sign(angleDifference) * Math.min(TURN_RATE, Math.abs(angleDifference));
            shape.currentRotation += turnAmount;
        } else {
            shape.currentRotation = shape.targetRotation;
        }

        const speed = Math.hypot(shape.vx, shape.vy);
        const currentAngleRad = shape.currentRotation * (Math.PI / 180);
        shape.vx = Math.cos(currentAngleRad) * speed;
        shape.vy = Math.sin(currentAngleRad) * speed;

        shape.x += shape.vx;
        shape.y += shape.vy;
        shape.rotation = shape.currentRotation;

        if (shape.x > bounds.width + shape.size || shape.x < -shape.size || shape.y > bounds.height + shape.size || shape.y < -shape.size) {
            const colorCounts: Record<string, number> = Object.fromEntries(colorSchemes.map(c => [c.fill, 0]));
            const typeCounts: Record<string, number> = Object.fromEntries(shapeTypes.map(t => [t, 0]));
            currentShapes.forEach(s => { if (s.id !== shape.id && s.opacity > 0 && s.x >= 0) {
                colorCounts[s.color.fill]++;
                typeCounts[s.type]++;
            }});
            shape.color = findLeastUsedColor(colorCounts, colorSchemes);
            shape.type = findLeastUsedType(typeCounts, shapeTypes);
            shape.size = Math.floor(Math.random() * 31) + 40; // Range: 40px to 70px
            
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
                    const newRotation = getAngle(newVx, newVy);
                    Object.assign(shape, {
                        x: newX, y: newY, vx: newVx, vy: newVy, rotation: newRotation,
                        currentRotation: newRotation, targetRotation: newRotation,
                        isSpawning: true, scale: 0, opacity: 0, collisionState: 'none',
                        indicatorAngle: 0, avoidanceAngle: 0, reactionDelayFrames: 0,
                        evasionCooldownFrames: 0, isHovered: false,
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
        
        el.style.opacity = `${shape.opacity * 0.2}`;
        el.style.transform = `translate(${shape.x - shape.size/2 + parallaxX}px, ${shape.y - shape.size/2 + parallaxY}px)`;

        const shapeDiv = el.children[0] as HTMLDivElement;
        const pathDots = el.querySelectorAll('.path-dot') as NodeListOf<HTMLDivElement>;

        if (shapeDiv) {
            shapeDiv.style.transform = `scale(${shape.scale}) rotate(${shape.rotation}deg)`;
            shapeDiv.style.backgroundColor = shape.color.fill;
            shapeDiv.style.borderColor = shape.color.stroke;
            shapeDiv.style.borderWidth = '3px';
            shapeDiv.style.borderStyle = 'solid';
            shapeDiv.style.borderRadius = shape.type === 'circle' ? '50%' : '20%';
            shapeDiv.style.position = 'relative';

            const arrowDiv = shapeDiv.children[0] as HTMLDivElement;
            const orientationDot = shapeDiv.children[1] as HTMLDivElement;
            const indicatorContainer = shapeDiv.children[2] as HTMLDivElement;
            
            if (arrowDiv) {
                arrowDiv.style.setProperty('--arrow-color', shape.color.stroke);
            }
            
            if (orientationDot) {
                orientationDot.classList.toggle('dot-hovered', shape.isHovered);
                orientationDot.classList.toggle('dot-warning', shape.collisionState === 'warning');
                orientationDot.classList.toggle('dot-avoiding', shape.collisionState === 'avoiding');
                
                if (shape.collisionState === 'none') {
                    orientationDot.style.backgroundColor = shape.color.stroke;
                } else {
                    orientationDot.style.backgroundColor = ''; // Let CSS class handle the color
                }
            }

            if(indicatorContainer) {
                indicatorContainer.style.opacity = shape.collisionState !== 'none' ? '1' : '0';
                if (shape.collisionState !== 'none') {
                    const stateClass = shape.collisionState === 'avoiding' ? 'indicator-avoiding' : 'indicator-warning';
                    const shapeTypeClass = `indicator-is-${shape.type}`;
                    indicatorContainer.className = `collision-indicator ${stateClass} ${shapeTypeClass}`;
                    
                    let angleForCSS = 0;
                    if (shape.collisionState === 'avoiding') {
                        angleForCSS = shape.avoidanceAngle + 90;
                    } else {
                        angleForCSS = shape.indicatorAngle + 90;
                    }
                    const finalAngle = angleForCSS - shape.rotation;
                    indicatorContainer.style.transform = `translate(-50%, -50%) rotate(${finalAngle}deg)`;
                }
            }
        }
        
        if (pathDots.length > 0) {
            if (shape.collisionState !== 'none') {
                const timeStep = 30; // Spacing between dots in frames
                
                // Simulate future path for dots
                let simX = 0; // Relative to shape center
                let simY = 0;
                let simAngle = shape.currentRotation;
                const speed = Math.hypot(shape.vx, shape.vy);

                for (let i = 0; i < pathDots.length; i++) {
                    const dot = pathDots[i];
                    // Simulate from last dot's position to this one's
                    for (let t = 0; t < timeStep; t++) {
                        const angleDiff = findShortestAngle(shape.targetRotation - simAngle);
                        const turnAmount = Math.sign(angleDiff) * Math.min(TURN_RATE, Math.abs(angleDiff));
                        simAngle += turnAmount;
                        
                        const simAngleRad = simAngle * (Math.PI / 180);
                        simX += Math.cos(simAngleRad) * speed;
                        simY += Math.sin(simAngleRad) * speed;
                    }
                    
                    const dotSize = 6;
                    const relativeX = simX + (shape.size / 2) - (dotSize / 2);
                    const relativeY = simY + (shape.size / 2) - (dotSize / 2);

                    dot.style.transform = `translate(${relativeX}px, ${relativeY}px)`;
                    dot.style.backgroundColor = shape.color.stroke;
                    dot.style.opacity = `${0.6 * (1 - (i / pathDots.length) * 0.8)}`;
                }
            } else {
                pathDots.forEach(dot => {
                    dot.style.opacity = '0';
                });
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
          <div 
            style={{width: `${shape.size}px`, height: `${shape.size}px`, pointerEvents: 'auto'}}
            onMouseEnter={() => {
                const s = shapesRef.current.find(s => s.id === shape.id);
                if(s) s.isHovered = true;
            }}
            onMouseLeave={() => {
                const s = shapesRef.current.find(s => s.id === shape.id);
                if(s) s.isHovered = false;
            }}
          >
            <div className="internal-arrow"/>
            <div className="orientation-dot" />
            <div className="collision-indicator">
              <div className="indicator-arc" />
              <div className="indicator-arrow" />
            </div>
          </div>
          {/* Predictive path dots */}
          {[...Array(5)].map((_, i) => (
            <div
              key={`path-${i}`}
              className="path-dot"
              style={{ top: 0, left: 0, width: '6px', height: '6px', opacity: 0 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default BackgroundShapes;