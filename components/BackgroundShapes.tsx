import React from 'react';

// --- TYPE DEFINITIONS ---
type ShapeType = 'circle' | 'rounded-square';
type CollisionState = 'none' | 'warning' | 'avoiding';
type AnimationState = 'active' | 'reforming';
type Personality = 'agile' | 'fast';
type EvasionTactic = 'none' | 'turn' | 'accelerate';
type StuckState = 'none' | 'escaping' | 're-evaluating' | 'random-walk';

interface HobbyState {
    active: boolean;
    duration: number; // in frames
    checkTimer: number; // in frames
}

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
  isShiftDown: boolean;
}

interface RgbColor {
  r: number; g: number; b: number;
}

interface Shape {
  id: number;
  type: ShapeType;
  personality: Personality;
  originalColor: ColorScheme;
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
  pathIsObstructed: boolean;
  ignoresUiObstacles: boolean;
  hobbyState: HobbyState;
  isBoosting: boolean; // New for acceleration while turning
  consecutiveTurns: number; // New for cooperative evasion
  
  stuckState: StuckState;
  stuckTimer: number;
  escapeVector: { x: number; y: number } | null;
  stuckWithObstacleId: string | number | null;
  
  currentColorRgb: { fill: RgbColor, stroke: RgbColor };
  
  pairedWith: number | null;
  isPairLeader: boolean;
}

interface BackgroundShapesProps {
  obstacles: Obstacle[];
  onUiCollision: (id: string, angle: number, rect: DOMRect) => void;
  generationTrigger: number;
  mouseState: MouseState;
  onShapeCountChange: (count: number) => void;
  isIdle: boolean;
  hoveredTimelineColor: string | null;
  activeSection: string;
  isPaused: boolean; // --- NEW ---
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
const EVASION_COOLDOWN_FRAMES = 15;
const EVASION_TEST_FRAMES = 60;
const ANIMATION_DURATION = 40;
const MOUSE_FORCE_STRENGTH = 150;
const FLOCKING_STRENGTH = 0.0005;
const CONSTELLATION_DISTANCE = 350;
const ACCELERATION_BOOST = 1.5;
const GENERATION_COUNT = 4;
const MIN_SPEED_FACTOR = 0.2;
const MAX_SHAPES = 50;
const HOBBY_CHECK_INTERVAL = 60 * 60;
const HOBBY_CHANCE = 0.6;
const HOBBY_DURATION = 5 * 60;
const SEPARATION_FORCE = 0.01;

// --- HELPER FUNCTIONS ---
const getAngle = (vx: number, vy: number) => (Math.atan2(vy, vx) * 180) / Math.PI;

const findShortestAngle = (angle: number): number => {
    angle %= 360;
    if (angle > 180) return angle - 360;
    if (angle < -180) return angle + 360;
    return angle;
};

const easeOutBack = (x: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

const shouldShape1Yield = (shape1: Shape, shape2: Shape): boolean => {
    const shape1Turns = shape1.consecutiveTurns || 0;
    const shape2Turns = shape2.consecutiveTurns || 0;

    if (shape1Turns > 3 && shape2Turns <= 3) return false;
    if (shape2Turns > 3 && shape1Turns <= 3) return true;
    
    const s1_isReckless = shape1.ignoresUiObstacles;
    const s2_isReckless = shape2.ignoresUiObstacles;
    const s1_typeVal = shape1.type === 'rounded-square' ? 1 : 2;
    const s2_typeVal = shape2.type === 'rounded-square' ? 1 : 2;

    if (shape1.originalColor.fill === shape2.originalColor.fill) return shape1.id < shape2.id;
    if (s1_isReckless !== s2_isReckless) return !s1_isReckless; 
    if (s1_typeVal !== s2_typeVal) return s1_typeVal < s2_typeVal;
    if (shape1.size !== shape2.size) return shape1.size < shape2.size;
    return shape1.id < shape2.id;
};

const parseRgba = (rgba: string): RgbColor => {
    const result = rgba.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (result) return { r: parseInt(result[1]), g: parseInt(result[2]), b: parseInt(result[3]) };
    return { r: 255, g: 255, b: 255 };
};

const placeShapeOnEdge = (shape: Shape, bounds: { width: number; height: number }): void => {
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
        speed, baseSpeed: speed,
        rotation: angle, currentRotation: angle, targetRotation: angle,
        animationState: 'reforming', animationCounter: ANIMATION_DURATION,
        scale: 0, opacity: 0, collisionState: 'none', indicatorAngle: 0,
        avoidanceAngle: 0, evasionCooldownFrames: 0, isHovered: false,
        evasionTactic: 'none', pathIsObstructed: false, isBoosting: false, consecutiveTurns: 0,
        stuckState: 'none', stuckTimer: 0, escapeVector: null, stuckWithObstacleId: null,
        pairedWith: null, isPairLeader: false,
    });
};

const createNewShape = (id: number, x: number, y: number): Shape => {
    const type = shapeTypes[id % shapeTypes.length];
    const originalColor = colorSchemes[id % colorSchemes.length];
    
    const newShape: Partial<Shape> = {
        id, type, originalColor,
        color: { ...originalColor },
        currentColorRgb: { fill: parseRgba(originalColor.fill), stroke: parseRgba(originalColor.stroke) },
        size: Math.floor(Math.random() * 31) + 40,
        personality: type === 'circle' ? 'agile' : 'fast',
        ignoresUiObstacles: Math.random() < 0.15,
        hobbyState: { active: false, duration: 0, checkTimer: Math.random() * HOBBY_CHECK_INTERVAL },
    };

    const angle = Math.random() * 360;
    const maxSpeed = newShape.personality === 'fast' ? 0.8 : 0.6;
    const speed = (Math.random() * 0.3 + 0.7) * maxSpeed;
    const angleRad = angle * (Math.PI / 180);
    const vx = Math.cos(angleRad) * speed;
    const vy = Math.sin(angleRad) * speed;

    Object.assign(newShape, {
        x, y, vx, vy, svx: 0, svy: 0,
        speed, baseSpeed: speed,
        rotation: angle, currentRotation: angle, targetRotation: angle,
        animationState: 'reforming', animationCounter: ANIMATION_DURATION,
        scale: 0, opacity: 0, collisionState: 'none', indicatorAngle: 0,
        avoidanceAngle: 0, evasionCooldownFrames: 0, isHovered: false,
        evasionTactic: 'none', pathIsObstructed: false, isBoosting: false, consecutiveTurns: 0,
        stuckState: 'none', stuckTimer: 0, escapeVector: null, stuckWithObstacleId: null,
        pairedWith: null, isPairLeader: false,
    });
    return newShape as Shape;
};

const createInitialShapes = (bounds: { width: number; height: number }): Shape[] => {
    return Array.from({ length: NUM_SHAPES }, (_, i) => {
        const shape = createNewShape(i, Math.random() * bounds.width, Math.random() * bounds.height);
        shape.animationState = 'active'; shape.scale = 1; shape.opacity = 1;
        return shape;
    });
};

const hexToRgb = (hex: string): RgbColor | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};

const darkenRgb = (rgb: RgbColor, percent: number): RgbColor => {
    const factor = 1 - percent / 100;
    return { r: Math.round(rgb.r * factor), g: Math.round(rgb.g * factor), b: Math.round(rgb.b * factor) };
};

// --- REACT COMPONENT ---
const BackgroundShapes: React.FC<BackgroundShapesProps> = ({ obstacles, onUiCollision, generationTrigger, mouseState, onShapeCountChange, isIdle, hoveredTimelineColor, activeSection, isPaused }) => {
  const [shapes, setShapes] = React.useState<Shape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = React.useState<number | null>(null);
  const [isDraggingAngle, setIsDraggingAngle] = React.useState(false);
  
  const shapesRef = React.useRef<Shape[]>([]);
  const animationFrameId = React.useRef<number | null>(null);
  const dragStartAngleRef = React.useRef(0);
  const shapeStartAngleRef = React.useRef(0);

  const timelineColorRgb = React.useMemo(() => {
    if (!hoveredTimelineColor) return null;
    const rgb = hexToRgb(hoveredTimelineColor);
    if (!rgb) return null;
    return { fill: rgb, stroke: darkenRgb(rgb, 30) };
  }, [hoveredTimelineColor]);

  React.useEffect(() => {
    setShapes(createInitialShapes({ width: window.innerWidth, height: window.innerHeight }));
  }, []);

  const lastTrigger = React.useRef(generationTrigger);
  React.useEffect(() => {
    if (generationTrigger > lastTrigger.current) {
        setShapes(prevShapes => {
            if (prevShapes.length >= MAX_SHAPES) return prevShapes;
            const newShapes: Shape[] = [];
            let lastId = (prevShapes.length > 0 ? Math.max(...prevShapes.map(s => s.id)) : -1);
            const width = window.innerWidth, height = window.innerHeight;
            const quadrants = [
                { xMin: 0, xMax: width / 2, yMin: 0, yMax: height / 2 }, { xMin: width / 2, xMax: width, yMin: 0, yMax: height / 2 },
                { xMin: 0, xMax: width / 2, yMin: height / 2, yMax: height }, { xMin: width / 2, xMax: width, yMin: height / 2, yMax: height },
            ];
            for (let i = quadrants.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [quadrants[i], quadrants[j]] = [quadrants[j], quadrants[i]]; }
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

  React.useEffect(() => {
    shapesRef.current = shapes;
    onShapeCountChange(shapes.length);
  }, [shapes, onShapeCountChange]);
  
  const handleShapeMouseDown = (e: React.MouseEvent, id: number) => {
    if (e.button === 2) {
      e.preventDefault(); e.stopPropagation();
      setSelectedShapeId(prevId => (prevId === id ? null : id));
      setIsDraggingAngle(false);
    }
  };

  const handleAngleDragStart = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const selectedShape = shapesRef.current.find(s => s.id === selectedShapeId);
    if (!selectedShape) return;
    setIsDraggingAngle(true);
    const initialAngle = Math.atan2(e.clientY - selectedShape.y, e.clientX - selectedShape.x) * (180 / Math.PI);
    dragStartAngleRef.current = initialAngle;
    shapeStartAngleRef.current = selectedShape.targetRotation;
  };
  
  React.useEffect(() => {
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


  React.useEffect(() => {
    const animate = () => {
      // --- NEW: Pause animation loop ---
      if (isPaused) {
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }

      const allShapes = shapesRef.current;
      if (allShapes.length === 0) {
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }
      const bounds = { width: window.innerWidth, height: window.innerHeight };
      const padding = 100;
      
      if (selectedShapeId !== null && !allShapes.some(s => s.id === selectedShapeId)) {
        setSelectedShapeId(null); setIsDraggingAngle(false);
      }
      
      const activeSectionObstacle = obstacles.find(o => o.id.includes(activeSection));

      for (const shape of allShapes) {
        if (timelineColorRgb) {
          shape.currentColorRgb.fill = { ...timelineColorRgb.fill };
          shape.currentColorRgb.stroke = { ...timelineColorRgb.stroke };
        } else {
          const targetFillRgb = parseRgba(shape.originalColor.fill);
          const targetStrokeRgb = parseRgba(shape.originalColor.stroke);
          const lerp = 0.1;
          shape.currentColorRgb.fill.r += (targetFillRgb.r - shape.currentColorRgb.fill.r) * lerp;
          shape.currentColorRgb.fill.g += (targetFillRgb.g - shape.currentColorRgb.fill.g) * lerp;
          shape.currentColorRgb.fill.b += (targetFillRgb.b - shape.currentColorRgb.fill.b) * lerp;
          shape.currentColorRgb.stroke.r += (targetStrokeRgb.r - shape.currentColorRgb.stroke.r) * lerp;
          shape.currentColorRgb.stroke.g += (targetStrokeRgb.g - shape.currentColorRgb.stroke.g) * lerp;
          shape.currentColorRgb.stroke.b += (targetStrokeRgb.b - shape.currentColorRgb.stroke.b) * lerp;
        }
        shape.color.fill = `rgba(${Math.round(shape.currentColorRgb.fill.r)}, ${Math.round(shape.currentColorRgb.fill.g)}, ${Math.round(shape.currentColorRgb.fill.b)}, 0.9)`;
        shape.color.stroke = `rgba(${Math.round(shape.currentColorRgb.stroke.r)}, ${Math.round(shape.currentColorRgb.stroke.g)}, ${Math.round(shape.currentColorRgb.stroke.b)}, 1)`;

        if (shape.animationState === 'reforming') {
          shape.animationCounter--;
          const progress = 1 - (shape.animationCounter / ANIMATION_DURATION);
          shape.scale = easeOutBack(progress);
          shape.opacity = progress;
          if (shape.animationCounter <= 0) shape.animationState = 'active';
        }
        
        if (shape.ignoresUiObstacles) {
            shape.hobbyState.checkTimer--;
            if (shape.hobbyState.checkTimer <= 0) {
                shape.hobbyState.checkTimer = HOBBY_CHECK_INTERVAL + Math.random() * (HOBBY_CHECK_INTERVAL / 2);
                if (Math.random() < HOBBY_CHANCE) { shape.hobbyState.active = true; shape.hobbyState.duration = HOBBY_DURATION; }
            }
            if (shape.hobbyState.active) {
                shape.hobbyState.duration--;
                if (shape.hobbyState.duration <= 0) shape.hobbyState.active = false;
            }
        }

        let stuckObstacle: { id: string | number, x: number, y: number } | null = null;
        const overlapFactor = 0.5;

        for (const other of allShapes) {
            if (shape.id === other.id || other.id === shape.stuckWithObstacleId) continue;
            const distSq = (shape.x - other.x) ** 2 + (shape.y - other.y) ** 2;
            const combinedRadius = (shape.size + other.size) / 2;
            if (distSq < (combinedRadius * overlapFactor) ** 2) { stuckObstacle = { id: other.id, x: other.x, y: other.y }; break; }
        }
        if (!stuckObstacle && !shape.ignoresUiObstacles) {
            for (const obs of obstacles) {
                if (obs.id === shape.stuckWithObstacleId) continue;
                const rect = obs.rect;
                const closestX = Math.max(rect.left, Math.min(shape.x, rect.right));
                const closestY = Math.max(rect.top, Math.min(shape.y, rect.bottom));
                const distSq = (shape.x - closestX) ** 2 + (shape.y - closestY) ** 2;
                if (distSq < (shape.size * overlapFactor) ** 2) { stuckObstacle = { id: obs.id, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; break; }
            }
        }
        if (stuckObstacle && shape.stuckState === 'none') {
            shape.stuckState = 'escaping'; shape.stuckTimer = 0; shape.escapeVector = null; shape.stuckWithObstacleId = stuckObstacle.id;
        } else if (!stuckObstacle && shape.stuckState !== 'none') {
            shape.stuckState = 'none'; shape.stuckTimer = 0; shape.escapeVector = null; shape.stuckWithObstacleId = null;
        }
        if (shape.stuckState !== 'none' && shape.stuckWithObstacleId !== null) {
            shape.stuckTimer++; shape.collisionState = 'avoiding'; 
            let obsCenter = {x: 0, y: 0};
            const obs = obstacles.find(o => o.id === shape.stuckWithObstacleId) || allShapes.find(s => s.id === shape.stuckWithObstacleId);
            if(obs) {
                if ('rect' in obs) obsCenter = { x: obs.rect.left + obs.rect.width / 2, y: obs.rect.top + obs.rect.height / 2 };
                else obsCenter = { x: obs.x, y: obs.y };
                shape.indicatorAngle = getAngle(obsCenter.x - shape.x, obsCenter.y - shape.y);
            }
            if (shape.stuckTimer > 30 * 60) shape.stuckState = 'random-walk';
            else if (shape.stuckTimer > 10 * 60 && shape.stuckState === 'escaping') shape.stuckState = 're-evaluating';

            switch (shape.stuckState) {
                case 'escaping':
                    if (!shape.escapeVector && obsCenter) {
                        const escapeDx = shape.x - obsCenter.x; const escapeDy = shape.y - obsCenter.y; const dist = Math.sqrt(escapeDx ** 2 + escapeDy ** 2) || 1;
                        shape.escapeVector = { x: escapeDx / dist, y: escapeDy / dist }; shape.targetRotation = getAngle(shape.escapeVector.x, shape.escapeVector.y);
                    } break;
                case 're-evaluating': shape.escapeVector = null; shape.stuckState = 'escaping'; break;
                case 'random-walk': if (shape.stuckTimer % 60 === 0) shape.targetRotation += (Math.random() - 0.5) * 180; break;
            }
            const angleDiff = findShortestAngle(shape.targetRotation - shape.currentRotation); shape.currentRotation += angleDiff * 0.1;
            shape.rotation = shape.currentRotation; const rad = shape.currentRotation * (Math.PI / 180);
            shape.speed = shape.baseSpeed * 0.7; shape.vx = Math.cos(rad) * shape.speed; shape.vy = Math.sin(rad) * shape.speed;
        } else {
            let { vx, vy, speed, baseSpeed } = shape;
            const dxMouse = shape.x - mouseState.x; const dyMouse = shape.y - mouseState.y; const distMouseSq = dxMouse * dxMouse + dyMouse * dyMouse;
            if (mouseState.isLeftDown && distMouseSq < 150 * 150) {
                const distMouse = Math.sqrt(distMouseSq); const force = 1 - (distMouse / 150);
                let forceFactor = force * MOUSE_FORCE_STRENGTH / (distMouse + 0.1);
                if (mouseState.isShiftDown) forceFactor *= -1;
                vx += dxMouse * forceFactor * 0.01; vy += dyMouse * forceFactor * 0.01;
            }
            let avg_vx = 0, avg_vy = 0, neighbor_count = 0, same_color_center_x = 0, same_color_center_y = 0, same_color_count = 0, separation_vx = 0, separation_vy = 0;
            if (!isIdle && shape.pairedWith !== null) {
                const partner = allShapes.find(s => s.id === shape.pairedWith);
                if (partner) { partner.pairedWith = null; partner.isPairLeader = false; }
                shape.pairedWith = null; shape.isPairLeader = false;
            }
            for (const other of allShapes) {
                if (shape.id === other.id) continue;
                const d_sq = (shape.x - other.x)**2 + (shape.y - other.y)**2;
                if (d_sq < CONSTELLATION_DISTANCE ** 2) {
                    avg_vx += other.vx; avg_vy += other.vy; neighbor_count++;
                    if (d_sq < ((shape.size + other.size) / 1.5)**2) { const d = Math.sqrt(d_sq) || 1; separation_vx += (shape.x - other.x) / d; separation_vy += (shape.y - other.y) / d; }
                }
                if (isIdle && shape.originalColor.fill === other.originalColor.fill) {
                    same_color_center_x += other.x; same_color_center_y += other.y; same_color_count++;
                    if (shape.pairedWith === null && other.pairedWith === null && d_sq < ((shape.size + other.size) * 1.5)**2) {
                        if (Math.random() < 0.0005) { shape.pairedWith = other.id; shape.isPairLeader = true; other.pairedWith = shape.id; other.isPairLeader = false; }
                    }
                }
            }
            if (shape.pairedWith !== null && !shape.isPairLeader) {
                 const leader = allShapes.find(s => s.id === shape.pairedWith);
                 if (leader) { const targetX = leader.x - leader.vx * 15; const targetY = leader.y - leader.vy * 15; vx += (targetX - shape.x) * 0.005; vy += (targetY - shape.y) * 0.005; }
                 else { shape.pairedWith = null; }
            } else { if (neighbor_count > 0) { avg_vx /= neighbor_count; avg_vy /= neighbor_count; vx += (avg_vx - vx) * FLOCKING_STRENGTH * neighbor_count; vy += (avg_vy - vy) * FLOCKING_STRENGTH * neighbor_count; } }
            if (isIdle && same_color_count > 0) { const targetX = same_color_center_x / same_color_count; const targetY = same_color_center_y / same_color_count; vx += (targetX - shape.x) * 0.0001; vy += (targetY - shape.y) * 0.0001; }
            vx += separation_vx * SEPARATION_FORCE; vy += separation_vy * SEPARATION_FORCE;
            if (!isIdle && activeSectionObstacle && shape.id % 4 === 0) { const rect = activeSectionObstacle.rect; if (rect.width > 0) { const targetX = rect.left + rect.width / 2; const targetY = rect.top + rect.height / 2; vx += (targetX - shape.x) * 0.00005; vy += (targetY - shape.y) * 0.00005; } }
            shape.vx = vx; shape.vy = vy; speed = Math.sqrt(vx * vx + vy * vy);
            let targetSpeed = baseSpeed;
            if (shape.isBoosting) targetSpeed *= ACCELERATION_BOOST;
            speed += (targetSpeed - speed) * 0.05;
            const minSpeed = baseSpeed * MIN_SPEED_FACTOR;
            if (speed < minSpeed) speed = minSpeed;
            if (shape.hobbyState.active) { const dx = bounds.width / 2 - shape.x; const dy = bounds.height / 2 - shape.y; shape.targetRotation = getAngle(dx, dy); }
            else if (shape.id !== selectedShapeId || !isDraggingAngle) { const desiredRotation = getAngle(vx, vy); const rotationDiff = findShortestAngle(desiredRotation - shape.targetRotation); shape.targetRotation += rotationDiff * 0.05; }
            const turnRate = shape.personality === 'agile' ? 0.2 : 0.1; const angleDiff = findShortestAngle(shape.targetRotation - shape.currentRotation); shape.currentRotation += angleDiff * turnRate;
            shape.rotation = shape.currentRotation; const rad = shape.currentRotation * (Math.PI / 180);
            shape.vx = Math.cos(rad) * speed; shape.vy = Math.sin(rad) * speed; shape.speed = speed;
            if (shape.evasionCooldownFrames > 0) shape.evasionCooldownFrames--;
            let potentialCollision: { time: number; id: number | string; angle: number; isUi: boolean; rect?: DOMRect } | null = null;
            let isPathObstructed = false;
            if (shape.evasionCooldownFrames <= 0) {
                shape.collisionState = 'none'; shape.evasionTactic = 'none'; shape.isBoosting = false;
                const myPath = Array.from({ length: PREDICTION_FRAMES }, (_, i) => ({ x: shape.x + shape.vx * i, y: shape.y + shape.vy * i }));
                for (const other of allShapes) {
                    if (shape.id === other.id) continue;
                    for (let i = 0; i < PREDICTION_FRAMES; i++) {
                        const otherX = other.x + other.vx * i; const otherY = other.y + other.vy * i; const distSq = (myPath[i].x - otherX)**2 + (myPath[i].y - otherY)**2;
                        if (distSq < ((shape.size + other.size) / 2)**2) {
                            isPathObstructed = true;
                            if (shouldShape1Yield(shape, other)) {
                                const angleToOther = getAngle(other.x - shape.x, other.y - shape.y);
                                if (!potentialCollision || i < potentialCollision.time) potentialCollision = { time: i, id: other.id, angle: angleToOther, isUi: false };
                            } break;
                        }
                    }
                }
                if (!shape.ignoresUiObstacles) {
                    for (const obs of obstacles) {
                        const rect = obs.rect;
                        for (let i = 0; i < PREDICTION_FRAMES; i++) {
                            const p = myPath[i]; const halfSize = shape.size / 2;
                            if (p.x + halfSize > rect.left && p.x - halfSize < rect.right && p.y + halfSize > rect.top && p.y - halfSize < rect.bottom) {
                                isPathObstructed = true; const angleToObs = getAngle(rect.left + rect.width / 2 - shape.x, rect.top + rect.height / 2 - shape.y);
                                if (!potentialCollision || i < potentialCollision.time) potentialCollision = { time: i, id: obs.id, angle: angleToObs, isUi: true, rect };
                                break;
                            }
                        }
                    }
                }
                shape.pathIsObstructed = isPathObstructed;
                if (potentialCollision) {
                    shape.collisionState = 'warning'; shape.indicatorAngle = potentialCollision.angle;
                    if (potentialCollision.time < EVASION_TEST_FRAMES) {
                        shape.collisionState = 'avoiding'; shape.evasionCooldownFrames = EVASION_COOLDOWN_FRAMES;
                        if (potentialCollision.isUi && potentialCollision.rect) onUiCollision(potentialCollision.id as string, potentialCollision.angle, potentialCollision.rect);
                        const diff = findShortestAngle(potentialCollision.angle - shape.currentRotation);
                        if (shape.personality === 'fast' && Math.abs(diff) > 135) { shape.evasionTactic = 'accelerate'; shape.isBoosting = true; shape.consecutiveTurns = 0; shape.avoidanceAngle = 0; }
                        else { shape.evasionTactic = 'turn'; shape.consecutiveTurns = (shape.consecutiveTurns || 0) + 1; if (Math.random() < 0.3) shape.isBoosting = true; const turnDirection = diff > 0 ? -1 : 1; const turnAmount = shape.personality === 'agile' ? 90 : 60; shape.avoidanceAngle = turnDirection * turnAmount; shape.targetRotation = shape.currentRotation + shape.avoidanceAngle; }
                    } else { shape.consecutiveTurns = 0; }
                } else { shape.consecutiveTurns = 0; }
            } else { shape.collisionState = 'avoiding'; shape.pathIsObstructed = false; }
            if (shape.collisionState === 'none' && !shape.isBoosting) {
                let rearEndThreat = null;
                for (const other of allShapes) {
                    if (shape.id === other.id) continue;
                    const relX = other.x - shape.x; const relY = other.y - shape.y; const dotProduct = shape.vx * relX + shape.vy * relY; if (dotProduct > 0) continue; 
                    const distSq = relX * relX + relY * relY;
                    if (other.speed > shape.speed * 1.2 && distSq < (150)**2) { 
                        const relVx = other.vx - shape.vx; const relVy = other.vy - shape.vy; const relSpeedSq = relVx * relVx + relVy * relVy; if (relSpeedSq < 0.01) continue;
                        const timeToCollision = -dotProduct / relSpeedSq;
                        if (timeToCollision > 0 && timeToCollision < 120) { if (!rearEndThreat || timeToCollision < rearEndThreat.time) rearEndThreat = { time: timeToCollision }; }
                    }
                }
                if (rearEndThreat && !shape.pathIsObstructed) { shape.isBoosting = true; shape.evasionCooldownFrames = 60; }
            }
        }
        if (shape.id !== selectedShapeId) { shape.x += shape.vx; shape.y += shape.vy; }
        const isOutOfBounds = shape.x < -padding || shape.x > bounds.width + padding || shape.y < -padding || shape.y > bounds.height + padding;
        const isInvalid = !isFinite(shape.x) || !isFinite(shape.y);
        if (isOutOfBounds || isInvalid) {
             if (shape.id === selectedShapeId) { setSelectedShapeId(null); setIsDraggingAngle(false); }
            placeShapeOnEdge(shape, bounds);
        }
      }
      setShapes([...allShapes]);
      animationFrameId.current = requestAnimationFrame(animate);
    };
    animationFrameId.current = requestAnimationFrame(animate);
    return () => { if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current); };
  }, [mouseState, obstacles, onUiCollision, selectedShapeId, isDraggingAngle, isIdle, timelineColorRgb, activeSection, isPaused]);

  const constellationLines = React.useMemo(() => {
    const lines = [];
    const currentShapes = shapesRef.current;
    for (let i = 0; i < currentShapes.length; i++) {
        for (let j = i + 1; j < currentShapes.length; j++) {
            const shape1 = currentShapes[i]; const shape2 = currentShapes[j];
            if (shape1.originalColor.fill !== shape2.originalColor.fill) continue;
            const isPaired = shape1.pairedWith === shape2.id;
            const distSq = (shape1.x - shape2.x) ** 2 + (shape1.y - shape2.y) ** 2;
            if (isPaired || distSq < CONSTELLATION_DISTANCE ** 2) {
                const distance = Math.sqrt(distSq);
                let opacity = isPaired ? 0.8 : (1 - (distance / CONSTELLATION_DISTANCE)) * 0.5;
                if (isIdle) opacity = Math.min(1, opacity * 2.5);
                lines.push({ id: `${shape1.id}-${shape2.id}`, x1: shape1.x, y1: shape1.y, x2: shape2.x, y2: shape2.y, opacity: opacity, isPaired: isPaired });
            }
        }
    }
    return lines;
  }, [shapes, isIdle]);
  
  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-10">
      <svg className="absolute top-0 left-0 w-full h-full" style={{ zIndex: 0 }}>
        {constellationLines.map(line => (<line key={line.id} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} className={`constellation-line ${isIdle ? 'idle' : ''}`} style={{ opacity: line.opacity, strokeWidth: line.isPaired ? '2px' : '1.5px' }} />))}
      </svg>
      {shapes.map((shape) => {
        const isSelected = shape.id === selectedShapeId;
        const borderRadius = shape.type === 'circle' ? '50%' : '0.5rem';
        const outerContainerStyle: React.CSSProperties = { position: 'absolute', width: `${shape.size}px`, height: `${shape.size}px`, left: 0, top: 0, transform: `translate(${shape.x - shape.size / 2}px, ${shape.y - shape.size / 2}px) scale(${shape.scale})`, opacity: shape.opacity, transition: 'transform 0.05s linear', zIndex: isSelected ? 10 : 1, pointerEvents: 'auto' };
        const rotatingContainerStyle: React.CSSProperties = { position: 'relative', width: '100%', height: '100%', transform: `rotate(${shape.rotation}deg)`, transition: 'transform 0.1s linear' };
        const shapeStyle: React.CSSProperties = { position: 'absolute', width: '100%', height: '100%', backgroundColor: shape.color.fill, border: `2px solid ${shape.color.stroke}`, transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out, background-color 0.5s ease-in-out, border-color 0.5s ease-in-out', borderRadius: borderRadius, transform: isSelected ? 'translateY(-10px)' : 'translateY(0px)' };
        if (isSelected) shapeStyle.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)';
        const isIndicatorVisible = shape.collisionState === 'warning' || shape.collisionState === 'avoiding';
        const isAvoiding = shape.collisionState === 'avoiding';
        const relativeIndicatorAngle = findShortestAngle(shape.indicatorAngle - shape.rotation);
        const gradientStartAngle = relativeIndicatorAngle - 54;
        const indicatorStyle = { borderRadius, '--indicator-angle': `${gradientStartAngle}deg` } as React.CSSProperties;
        const arrowColor = shape.ignoresUiObstacles ? '#64748b' : shape.color.stroke;
        return (
          <div key={shape.id} style={outerContainerStyle}>
            <div style={rotatingContainerStyle}>
              <div className={`glow-indicator ${isIndicatorVisible ? 'visible' : ''} ${isAvoiding ? 'avoiding' : ''}`} style={indicatorStyle}><div className="glow-indicator-arc" /></div>
              <div style={shapeStyle} onMouseDown={(e) => handleShapeMouseDown(e, shape.id)} onContextMenu={(e) => e.preventDefault()}>
                <div className={`orientation-dot ${shape.collisionState === 'warning' ? 'dot-warning' : ''} ${shape.collisionState === 'avoiding' ? 'dot-avoiding' : ''} ${shape.isBoosting ? 'dot-accelerating' : ''} ${shape.pathIsObstructed && shape.collisionState === 'none' ? 'dot-seen' : ''}`} style={{ '--dot-color': shape.color.stroke } as React.CSSProperties}/>
                <div className="internal-arrow" style={{ '--arrow-color': arrowColor } as React.CSSProperties} />
              </div>
            </div>
            {isSelected && (
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/2 left-1/2 w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2 border border-blue-400/50 rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 w-[75%] h-px" style={{ transform: `rotate(${shape.targetRotation}deg)`, transformOrigin: 'left center' }}><div className="w-full h-full bg-blue-500"></div><div className="absolute right-[-8px] top-[-8px] w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-grab active:cursor-grabbing pointer-events-auto" onMouseDown={handleAngleDragStart}/></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
export default BackgroundShapes;