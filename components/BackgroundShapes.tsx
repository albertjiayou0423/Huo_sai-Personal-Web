import React from 'react';

// --- TYPE DEFINITIONS ---
type ShapeType = 'circle' | 'rounded-square';
type CollisionState = 'none' | 'warning' | 'avoiding';
type AnimationState = 'active' | 'reforming';
type Personality = 'agile' | 'fast';
type EvasionTactic = 'none' | 'turn' | 'accelerate';
type StuckState = 'none' | 'escaping' | 're-evaluating' | 'random-walk';
type NavigationState = 'navigating' | 'cooldown';

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

interface Waypoint {
  id: number;
  name: string;
  x: number;
  y: number;
  linkedTo: number | null; // ID of the next waypoint in a route
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
  isBoosting: boolean;
  consecutiveTurns: number;
  
  stuckState: StuckState;
  stuckTimer: number;
  escapeVector: { x: number; y: number } | null;
  stuckWithObstacleId: string | number | null;
  
  currentColorRgb: { fill: RgbColor, stroke: RgbColor };
  
  pairedWith: number | null;
  isPairLeader: boolean;

  navigationState: NavigationState;
  targetWaypointId: number | null;
  cooldownUntil: number; // timestamp in ms
  cooldownDuration: number; // total duration in ms
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
const WAYPOINT_NAMES = ['ASTRO', 'CYGNX', 'PEGAS', 'LYRAX', 'VEGAT', 'ORION', 'DRACO', 'ANDRO', 'CETUS', 'HYDRA', 'NOVAE', 'PULSA', 'QUASR', 'SOLAR', 'LUNAR'];
const INITIAL_WAYPOINTS = 2;
const ARRIVAL_DISTANCE = 50;


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
    
    // Prioritize by color, then other attributes as tie-breakers
    const colorPriority1 = colorSchemes.findIndex(c => c.fill === shape1.originalColor.fill);
    const colorPriority2 = colorSchemes.findIndex(c => c.fill === shape2.originalColor.fill);
    if(colorPriority1 !== colorPriority2) return colorPriority1 < colorPriority2;
    
    if (shape1.ignoresUiObstacles !== shape2.ignoresUiObstacles) return !shape1.ignoresUiObstacles;
    if (shape1.type !== shape2.type) return (shape1.type === 'rounded-square' ? 1 : 2) < (shape2.type === 'rounded-square' ? 1 : 2);
    if (shape1.size !== shape2.size) return shape1.size < shape2.size;
    return shape1.id < shape2.id;
};


const parseRgba = (rgba: string): RgbColor => {
    const result = rgba.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (result) return { r: parseInt(result[1]), g: parseInt(result[2]), b: parseInt(result[3]) };
    return { r: 255, g: 255, b: 255 };
};

const getRandomWaypointId = (waypoints: Waypoint[], currentId: number | null = null): number | null => {
    const availableWaypoints = waypoints.filter(w => w.id !== currentId);
    if (availableWaypoints.length === 0) return null;
    return availableWaypoints[Math.floor(Math.random() * availableWaypoints.length)].id;
};


const placeShapeOnEdge = (shape: Shape, bounds: { width: number; height: number }, waypoints: Waypoint[]): void => {
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
        navigationState: 'navigating',
        targetWaypointId: getRandomWaypointId(waypoints),
        cooldownUntil: 0,
    });
};

const createNewShape = (id: number, x: number, y: number, waypoints: Waypoint[]): Shape => {
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
        navigationState: 'navigating',
        targetWaypointId: getRandomWaypointId(waypoints),
        cooldownUntil: 0,
        cooldownDuration: 0,
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

const createInitialShapes = (bounds: { width: number; height: number }, waypoints: Waypoint[]): Shape[] => {
    return Array.from({ length: NUM_SHAPES }, (_, i) => {
        const shape = createNewShape(i, Math.random() * bounds.width, Math.random() * bounds.height, waypoints);
        shape.animationState = 'active';
        shape.scale = 1;
        shape.opacity = 1;
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
const BackgroundShapes: React.FC<BackgroundShapesProps> = ({ obstacles, onUiCollision, generationTrigger, mouseState, onShapeCountChange, isIdle, hoveredTimelineColor, activeSection }) => {
  const [shapes, setShapes] = React.useState<Shape[]>([]);
  const [waypoints, setWaypoints] = React.useState<Waypoint[]>([]);
  const [contextMenu, setContextMenu] = React.useState<{ x: number, y: number, waypointId: number } | null>(null);
  const [linkingState, setLinkingState] = React.useState<{ fromId: number } | null>(null);
  const [draggedWaypointId, setDraggedWaypointId] = React.useState<number | null>(null);
  
  const [selectedShapeId, setSelectedShapeId] = React.useState<number | null>(null);
  const [isDraggingAngle, setIsDraggingAngle] = React.useState(false);
  const [, setNow] = React.useState(Date.now());
  
  const shapesRef = React.useRef<Shape[]>([]);
  const animationFrameId = React.useRef<number | null>(null);
  const dragStartAngleRef = React.useRef(0);
  const shapeStartAngleRef = React.useRef(0);
  const waypointNameSet = React.useRef(new Set<string>());
  const nextWaypointId = React.useRef(0);

  const timelineColorRgb = React.useMemo(() => {
    if (!hoveredTimelineColor) return null;
    const rgb = hexToRgb(hoveredTimelineColor);
    if (!rgb) return null;
    return { fill: rgb, stroke: darkenRgb(rgb, 30) };
  }, [hoveredTimelineColor]);

  React.useEffect(() => {
    const bounds = { width: window.innerWidth, height: window.innerHeight };
    const padding = 150;
    
    const initialWaypoints: Waypoint[] = [];
    for(let i = 0; i < INITIAL_WAYPOINTS; i++) {
        let name;
        do {
            name = WAYPOINT_NAMES[Math.floor(Math.random() * WAYPOINT_NAMES.length)];
        } while (waypointNameSet.current.has(name));
        waypointNameSet.current.add(name);
        
        initialWaypoints.push({
            id: nextWaypointId.current++,
            name,
            x: Math.random() * (bounds.width - padding * 2) + padding,
            y: Math.random() * (bounds.height - padding * 2) + padding,
            linkedTo: null,
        });
    }
    setWaypoints(initialWaypoints);
    setShapes(createInitialShapes(bounds, initialWaypoints));

    const renderInterval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(renderInterval);
  }, []);

  const lastTrigger = React.useRef(generationTrigger);
  React.useEffect(() => {
    if (generationTrigger > lastTrigger.current) {
        setShapes(prevShapes => {
            if (prevShapes.length >= MAX_SHAPES) return prevShapes;
            
            const newShapes: Shape[] = [];
            let lastId = (prevShapes.length > 0 ? Math.max(...prevShapes.map(s => s.id)) : -1);
            
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            const quadrants = [
                { xMin: 0, xMax: width / 2, yMin: 0, yMax: height / 2 },
                { xMin: width / 2, xMax: width, yMin: 0, yMax: height / 2 },
                { xMin: 0, xMax: width / 2, yMin: height / 2, yMax: height },
                { xMin: width / 2, xMax: width, yMin: height / 2, yMax: height },
            ];

            for (let i = quadrants.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [quadrants[i], quadrants[j]] = [quadrants[j], quadrants[i]];
            }

            for (let i = 0; i < GENERATION_COUNT; i++) {
                const quadrant = quadrants[i];
                const x = Math.random() * (quadrant.xMax - quadrant.xMin) + quadrant.xMin;
                const y = Math.random() * (quadrant.yMax - quadrant.yMin) + quadrant.yMin;
                newShapes.push(createNewShape(++lastId, x, y, waypoints));
            }

            return [...prevShapes, ...newShapes];
        });
        lastTrigger.current = generationTrigger;
    }
  }, [generationTrigger, waypoints]);

  React.useEffect(() => {
    shapesRef.current = shapes;
    onShapeCountChange(shapes.length);
  }, [shapes, onShapeCountChange]);
  
  const handleShapeMouseDown = (e: React.MouseEvent, id: number) => {
    if (e.button === 2) {
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

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu(null);
    setLinkingState(null);
    
    if ((e.target as HTMLElement).closest('[data-waypoint-id]') || (e.target as HTMLElement).closest('[data-shape-id]')) {
      return;
    }

    let name;
    const availableNames = WAYPOINT_NAMES.filter(n => !waypointNameSet.current.has(n));
    if (availableNames.length === 0) return;
    name = availableNames[Math.floor(Math.random() * availableNames.length)];
    waypointNameSet.current.add(name);

    const newWaypoint: Waypoint = {
      id: nextWaypointId.current++,
      name,
      x: e.clientX,
      y: e.clientY,
      linkedTo: null
    };
    setWaypoints(prev => [...prev, newWaypoint]);
  };

  const handleWaypointContextMenu = (e: React.MouseEvent, waypointId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, waypointId });
  };

  const handleDeleteWaypoint = (waypointId: number) => {
    const deletedWaypoint = waypoints.find(w => w.id === waypointId);
    if (deletedWaypoint) {
      waypointNameSet.current.delete(deletedWaypoint.name);
    }

    const remainingWaypoints = waypoints.filter(w => w.id !== waypointId);
    setWaypoints(prev => remainingWaypoints.map(w => {
        if(w.linkedTo === waypointId) {
            return { ...w, linkedTo: null };
        }
        return w;
    }));

    setShapes(prev => prev.map(shape => {
      if (shape.targetWaypointId === waypointId) {
        shape.targetWaypointId = getRandomWaypointId(remainingWaypoints);
      }
      return shape;
    }));
    setContextMenu(null);
  };
  
  const handleStartLinking = (fromId: number) => {
    setLinkingState({ fromId });
    setContextMenu(null);
  };
  
  const handleWaypointClick = (toId: number) => {
    if (!linkingState || linkingState.fromId === toId) return;
    setWaypoints(prev => prev.map(w => w.id === linkingState.fromId ? { ...w, linkedTo: toId } : w));
    setLinkingState(null);
  };
  
  React.useEffect(() => {
    const handleAngleDragMove = (e: MouseEvent) => {
      if (isDraggingAngle && selectedShapeId !== null) {
        const selectedShape = shapesRef.current.find(s => s.id === selectedShapeId);
        if (!selectedShape) return;
        const currentAngle = Math.atan2(e.clientY - selectedShape.y, e.clientX - selectedShape.x) * (180 / Math.PI);
        const angleDelta = findShortestAngle(currentAngle - dragStartAngleRef.current);
        selectedShape.targetRotation = shapeStartAngleRef.current + angleDelta;
      }
      if (draggedWaypointId !== null) {
        setWaypoints(prev => prev.map(w => w.id === draggedWaypointId ? { ...w, x: e.clientX, y: e.clientY } : w));
      }
    };
    
    const handleMouseUp = () => {
      setIsDraggingAngle(false);
      setDraggedWaypointId(null);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu && !(e.target as HTMLElement).closest('[data-context-menu]')) {
          setContextMenu(null);
      }
      if (linkingState && !(e.target as HTMLElement).closest('[data-waypoint-id]')) {
        setLinkingState(null);
      }
    };
    
    window.addEventListener('mousemove', handleAngleDragMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousedown', handleClickOutside);

    return () => {
        window.removeEventListener('mousemove', handleAngleDragMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDraggingAngle, selectedShapeId, draggedWaypointId, contextMenu, linkingState]);


  React.useEffect(() => {
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
      
      const activeSectionObstacle = obstacles.find(o => o.id.includes(activeSection));

      for (const shape of allShapes) {
        
        if (timelineColorRgb) {
          shape.currentColorRgb.fill = { ...timelineColorRgb.fill };
          shape.currentColorRgb.stroke = { ...timelineColorRgb.stroke };
        } else {
          const targetFillRgb = parseRgba(shape.originalColor.fill);
          const targetStrokeRgb = parseRgba(shape.originalColor.stroke);
          const returnLerpFactor = 0.1;

          shape.currentColorRgb.fill.r += (targetFillRgb.r - shape.currentColorRgb.fill.r) * returnLerpFactor;
          shape.currentColorRgb.fill.g += (targetFillRgb.g - shape.currentColorRgb.fill.g) * returnLerpFactor;
          shape.currentColorRgb.fill.b += (targetFillRgb.b - shape.currentColorRgb.fill.b) * returnLerpFactor;
          
          shape.currentColorRgb.stroke.r += (targetStrokeRgb.r - shape.currentColorRgb.stroke.r) * returnLerpFactor;
          shape.currentColorRgb.stroke.g += (targetStrokeRgb.g - shape.currentColorRgb.stroke.g) * returnLerpFactor;
          shape.currentColorRgb.stroke.b += (targetStrokeRgb.b - shape.currentColorRgb.stroke.b) * returnLerpFactor;
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
                if (Math.random() < HOBBY_CHANCE) {
                    shape.hobbyState.active = true;
                    shape.hobbyState.duration = HOBBY_DURATION;
                }
            }
            if (shape.hobbyState.active) {
                shape.hobbyState.duration--;
                if (shape.hobbyState.duration <= 0) shape.hobbyState.active = false;
            }
        }

        // --- STUCK LOGIC ---
        if (shape.stuckState !== 'none') {
            shape.stuckTimer--;
            if (shape.stuckTimer <= 0) {
                shape.stuckState = 'none';
                shape.escapeVector = null;
                shape.stuckWithObstacleId = null;
            }
        }
        if (shape.stuckState === 'escaping' && shape.escapeVector) {
            shape.vx += shape.escapeVector.x * 0.1;
            shape.vy += shape.escapeVector.y * 0.1;
        }

        let { vx, vy, speed, baseSpeed } = shape;
        
        const dxMouse = shape.x - mouseState.x;
        const dyMouse = shape.y - mouseState.y;
        const distMouseSq = dxMouse * dxMouse + dyMouse * dyMouse;
        const mouseRadius = 150;

        if (mouseState.isLeftDown && distMouseSq < mouseRadius * mouseRadius) {
            const distMouse = Math.sqrt(distMouseSq);
            const force = 1 - (distMouse / mouseRadius);
            let forceFactor = force * MOUSE_FORCE_STRENGTH / (distMouse + 0.1);
            if (mouseState.isShiftDown) forceFactor *= -1;
            vx += dxMouse * forceFactor * 0.01;
            vy += dyMouse * forceFactor * 0.01;
        }

        const now = Date.now();
        if (shape.navigationState === 'cooldown' && now > shape.cooldownUntil) {
            shape.navigationState = 'navigating';
            shape.targetWaypointId = getRandomWaypointId(waypoints, shape.targetWaypointId);
        }

        const targetWaypoint = waypoints.find(w => w.id === shape.targetWaypointId);
        if (shape.navigationState === 'navigating' && targetWaypoint) {
            const dxToWaypoint = targetWaypoint.x - shape.x;
            const dyToWaypoint = targetWaypoint.y - shape.y;
            const distToWaypointSq = dxToWaypoint * dxToWaypoint + dyToWaypoint * dyToWaypoint;

            if (distToWaypointSq < ARRIVAL_DISTANCE * ARRIVAL_DISTANCE) {
                if(targetWaypoint.linkedTo !== null) {
                    shape.targetWaypointId = targetWaypoint.linkedTo;
                } else {
                    shape.navigationState = 'cooldown';
                    shape.cooldownDuration = (Math.random() * 8 + 4) * 60 * 1000;
                    shape.cooldownUntil = now + shape.cooldownDuration;
                    shape.targetWaypointId = null;
                }
            } else {
                const navigationStrength = 0.0001;
                vx += dxToWaypoint * navigationStrength;
                vy += dyToWaypoint * navigationStrength;
            }
        } else if (shape.navigationState === 'cooldown') {
            vx *= 0.98; vy *= 0.98;
        }

        
        let separation_vx = 0, separation_vy = 0;
        let flock_vx = 0, flock_vy = 0;
        let neighborCount = 0;
        
        for (const other of allShapes) {
            if (shape.id === other.id) continue;
            const d_sq = (shape.x - other.x)**2 + (shape.y - other.y)**2;
            if (d_sq < ((shape.size + other.size) / 1.5)**2) {
                const d = Math.sqrt(d_sq) || 1;
                separation_vx += (shape.x - other.x) / d;
                separation_vy += (shape.y - other.y) / d;
            }
            if (isIdle && shape.originalColor.fill === other.originalColor.fill && d_sq < CONSTELLATION_DISTANCE ** 2) {
                flock_vx += other.x;
                flock_vy += other.y;
                neighborCount++;
            }
        }
        
        vx += separation_vx * SEPARATION_FORCE;
        vy += separation_vy * SEPARATION_FORCE;

        if (isIdle && neighborCount > 0) {
            flock_vx /= neighborCount;
            flock_vy /= neighborCount;
            vx += (flock_vx - shape.x) * FLOCKING_STRENGTH;
            vy += (flock_vy - shape.y) * FLOCKING_STRENGTH;
        }

        shape.vx = vx;
        shape.vy = vy;
        speed = Math.sqrt(vx * vx + vy * vy);
        
        let targetSpeed = baseSpeed;
        if (shape.navigationState === 'cooldown') targetSpeed *= 0.2;
        if (shape.isBoosting) targetSpeed *= ACCELERATION_BOOST;
        
        speed += (targetSpeed - speed) * 0.05;
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

        // --- COLLISION LOGIC ---
        if (shape.evasionCooldownFrames > 0) shape.evasionCooldownFrames--;
        shape.collisionState = 'none';
        shape.pathIsObstructed = false;
        shape.isBoosting = false;

        if (shape.stuckState !== 'escaping' && shape.evasionCooldownFrames <= 0) {
            const predictionX = shape.x + shape.vx * PREDICTION_FRAMES;
            const predictionY = shape.y + shape.vy * PREDICTION_FRAMES;
            let closestCollision = { distSq: Infinity, entity: null as Shape | Obstacle | null, type: '' };

            for (const other of allShapes) {
                if (shape.id === other.id || other.animationState !== 'active') continue;
                const otherPredictionX = other.x + other.vx * PREDICTION_FRAMES;
                const otherPredictionY = other.y + other.vy * PREDICTION_FRAMES;
                const distSq = (predictionX - otherPredictionX)**2 + (predictionY - otherPredictionY)**2;
                const combinedSize = (shape.size + other.size);
                if (distSq < combinedSize * combinedSize) {
                    const currentDistSq = (shape.x - other.x)**2 + (shape.y - other.y)**2;
                    if (currentDistSq < closestCollision.distSq) {
                        closestCollision = { distSq: currentDistSq, entity: other, type: 'shape' };
                    }
                }
            }
            
            if (!shape.ignoresUiObstacles || shape.hobbyState.active) {
              for (const obstacle of obstacles) {
                  const o = obstacle.rect;
                  const futureX = shape.x + shape.vx * EVASION_TEST_FRAMES;
                  const futureY = shape.y + shape.vy * EVASION_TEST_FRAMES;
                  const closestX = Math.max(o.left, Math.min(futureX, o.right));
                  const closestY = Math.max(o.top, Math.min(futureY, o.bottom));
                  const distSq = (futureX - closestX)**2 + (futureY - closestY)**2;
                  
                  if (distSq < (shape.size * 1.5)**2) {
                      const currentDistSq = (shape.x - closestX)**2 + (shape.y - closestY)**2;
                      if (currentDistSq < closestCollision.distSq) {
                          closestCollision = { distSq: currentDistSq, entity: obstacle, type: 'ui' };
                      }
                  }
              }
            }


            if (closestCollision.entity) {
                shape.pathIsObstructed = true;
                const entity = closestCollision.entity;
                let entityX, entityY;
                if (closestCollision.type === 'shape' && entity) {
                  const otherShape = entity as Shape;
                  entityX = otherShape.x; entityY = otherShape.y;
                } else if(closestCollision.type === 'ui' && entity) {
                  const obs = entity as Obstacle;
                  entityX = obs.rect.left + obs.rect.width / 2;
                  entityY = obs.rect.top + obs.rect.height / 2;
                } else {
                  entityX = shape.x; entityY = shape.y;
                }

                const dx = entityX - shape.x;
                const dy = entityY - shape.y;
                shape.indicatorAngle = getAngle(dx, dy);
                
                const combinedSize = closestCollision.type === 'shape' ? (shape.size + (entity as Shape).size) : shape.size * 2;
                if (closestCollision.distSq < (combinedSize * 1.2)**2) {
                    shape.collisionState = 'warning';
                    
                    if(closestCollision.type === 'ui' && entity) onUiCollision((entity as Obstacle).id, getAngle(shape.vx, shape.vy), (entity as Obstacle).rect);
                    
                    const shouldYield = closestCollision.type === 'ui' || shouldShape1Yield(shape, entity as Shape);

                    if (shouldYield) {
                        shape.collisionState = 'avoiding';
                        const toEntityAngle = getAngle(dx, dy);
                        const angleDiff = findShortestAngle(shape.rotation - toEntityAngle);
                        
                        let turnDirection = Math.sign(angleDiff);
                        if (turnDirection === 0) turnDirection = Math.random() < 0.5 ? 1 : -1;
                        
                        shape.avoidanceAngle = turnDirection * (90 - Math.abs(angleDiff) * 0.5);
                        shape.targetRotation += shape.avoidanceAngle * 0.1;
                        
                        shape.evasionCooldownFrames = EVASION_COOLDOWN_FRAMES;
                    }
                }
            }
        }


        if (shape.id !== selectedShapeId) {
            shape.x += shape.vx;
            shape.y += shape.vy;
        }
        
        const isOutOfBounds = shape.x < -padding || shape.x > bounds.width + padding || shape.y < -padding || shape.y > bounds.height + padding;
        const isInvalid = !isFinite(shape.x) || !isFinite(shape.y);

        if (isOutOfBounds || isInvalid) {
             if (shape.id === selectedShapeId) {
                setSelectedShapeId(null);
                setIsDraggingAngle(false);
            }
            placeShapeOnEdge(shape, bounds, waypoints);
        }
      }
      
      setShapes([...allShapes]);
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [mouseState, obstacles, onUiCollision, selectedShapeId, isDraggingAngle, isIdle, timelineColorRgb, activeSection, waypoints]);

  const constellationLines = React.useMemo(() => {
    const lines = [];
    if (shapes.length < 2) return [];
    
    const pairedIds = new Set<number>();

    for (let i = 0; i < shapes.length; i++) {
        for (let j = i + 1; j < shapes.length; j++) {
            const shape1 = shapes[i];
            const shape2 = shapes[j];
            
            if (shape1.originalColor.fill !== shape2.originalColor.fill) continue;

            const dx = shape1.x - shape2.x;
            const dy = shape1.y - shape2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < CONSTELLATION_DISTANCE) {
                const isPaired = shape1.pairedWith === shape2.id;
                 lines.push({
                    id: `${shape1.id}-${shape2.id}`,
                    x1: shape1.x, y1: shape1.y,
                    x2: shape2.x, y2: shape2.y,
                    opacity: isIdle ? (1 - distance / CONSTELLATION_DISTANCE) * 0.7 : 0,
                    isPaired,
                });
            }
        }
    }
    return lines;
  }, [shapes, isIdle]);

  const routeLines = React.useMemo(() => {
    return waypoints.filter(w => w.linkedTo !== null).map(startW => {
      const endW = waypoints.find(w => w.id === startW.linkedTo);
      if (!endW) return null;
      return { id: `route-${startW.id}-${endW.id}`, x1: startW.x, y1: startW.y, x2: endW.x, y2: endW.y };
    }).filter(Boolean);
  }, [waypoints]);
  
  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-auto z-10" onContextMenu={handleBackgroundContextMenu}>
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        {constellationLines.map(line => (
            <line key={line.id} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} className={`constellation-line ${isIdle ? 'idle' : ''}`} style={{ opacity: line.opacity, strokeWidth: line.isPaired ? '2px' : '1.5px' }} />
        ))}
        {routeLines.map(line => line && (
            <line key={line.id} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="rgb(var(--text-quaternary) / 0.4)" strokeWidth="2" strokeDasharray="5 5" />
        ))}
      </svg>
      {waypoints.map(waypoint => (
        <React.Fragment key={waypoint.id}>
            <div className="absolute flex flex-col items-center pointer-events-none" style={{
                left: waypoint.x,
                top: waypoint.y,
                transform: 'translate(-50%, -150%)',
                zIndex: 12,
            }}>
                <div className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ color: 'rgb(var(--text-tertiary))', backgroundColor: 'rgb(var(--background-card) / 0.5)' }}>
                    {waypoint.name}
                </div>
            </div>
            <div
              className={`absolute w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 pointer-events-auto ${linkingState ? 'hover:bg-blue-500/20' : 'cursor-grab active:cursor-grabbing'}`}
              style={{
                left: waypoint.x, top: waypoint.y,
                transform: 'translate(-50%, -50%)',
                zIndex: 12,
                boxShadow: `0 0 20px 5px ${linkingState?.fromId === waypoint.id ? 'rgba(96, 165, 250, 0.7)' : 'rgba(148, 163, 184, 0.4)'}`,
                cursor: linkingState ? 'pointer' : 'grab'
              }}
              onMouseDown={(e) => { if (e.button === 0 && !linkingState) setDraggedWaypointId(waypoint.id); }}
              onContextMenu={(e) => handleWaypointContextMenu(e, waypoint.id)}
              onClick={() => linkingState && handleWaypointClick(waypoint.id)}
              data-waypoint-id={waypoint.id}
            >
              <div className="w-2 h-2 bg-[rgb(var(--text-secondary))] rounded-full"></div>
            </div>
        </React.Fragment>
      ))}
      
      {contextMenu && (
        <div 
            className="fixed z-50 bg-[rgb(var(--background-card))] rounded-md shadow-lg border border-[rgb(var(--border-primary))] text-sm pointer-events-auto animate-scaleUp"
            style={{ top: contextMenu.y + 10, left: contextMenu.x + 10 }}
            data-context-menu
        >
            <button onClick={() => handleStartLinking(contextMenu.waypointId)} className="block w-full text-left px-4 py-2 text-[rgb(var(--text-secondary))] hover:bg-slate-500/10">创建航线</button>
            <button onClick={() => handleDeleteWaypoint(contextMenu.waypointId)} className="block w-full text-left px-4 py-2 text-red-500 hover:bg-red-500/10">删除航点</button>
        </div>
      )}

      {shapes.map((shape) => {
        const isSelected = shape.id === selectedShapeId;
        const borderRadius = shape.type === 'circle' ? '50%' : '0.5rem';
        const targetWaypoint = waypoints.find(w => w.id === shape.targetWaypointId);

        const outerContainerStyle: React.CSSProperties = {
          position: 'absolute',
          width: `${shape.size}px`,
          height: `${shape.size}px`,
          left: 0,
          top: 0,
          transform: `translate(${shape.x - shape.size / 2}px, ${shape.y - shape.size / 2}px) scale(${shape.scale})`,
          opacity: shape.opacity,
          transition: 'transform 0.05s linear',
          zIndex: isSelected ? 10 : 1,
          pointerEvents: 'auto',
        };

        const rotatingContainerStyle: React.CSSProperties = {
          position: 'relative', width: '100%', height: '100%',
          transform: `rotate(${shape.rotation}deg)`,
          transition: 'transform 0.1s linear',
        };
        
        const shapeStyle: React.CSSProperties = {
          position: 'absolute', width: '100%', height: '100%',
          backgroundColor: shape.color.fill,
          border: `2px solid ${shape.color.stroke}`,
          transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out, background-color 0.5s ease-in-out, border-color 0.5s ease-in-out',
          borderRadius: borderRadius,
          transform: isSelected ? 'translateY(-10px)' : 'translateY(0px)',
        };
        if (isSelected) shapeStyle.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)';
        
        const isIndicatorVisible = shape.collisionState === 'warning' || shape.collisionState === 'avoiding';
        const isAvoiding = shape.collisionState === 'avoiding';
        const relativeIndicatorAngle = findShortestAngle(shape.indicatorAngle - shape.rotation);
        const gradientStartAngle = relativeIndicatorAngle - 54;
        const indicatorStyle = { borderRadius, '--indicator-angle': `${gradientStartAngle}deg` } as React.CSSProperties;
        const arrowColor = shape.ignoresUiObstacles ? '#64748b' : shape.color.stroke;
        
        let cooldownProgress = 0;
        if (shape.navigationState === 'cooldown') {
            const elapsed = Date.now() - (shape.cooldownUntil - shape.cooldownDuration);
            cooldownProgress = Math.min(1, elapsed / shape.cooldownDuration);
        }
        const circumference = 2 * Math.PI * 10;

        return (
          <div key={shape.id} style={outerContainerStyle} data-shape-id={shape.id}>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none" style={{ zIndex: 11 }}>
                <div className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ color: 'rgb(var(--text-tertiary))', backgroundColor: 'rgb(var(--background-card) / 0.5)' }}>
                  {shape.navigationState === 'navigating' && targetWaypoint ? (
                      <span>{targetWaypoint.name}</span>
                  ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" className="-my-1">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="transparent" opacity="0.2" />
                          <circle
                              cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="transparent"
                              strokeDasharray={circumference}
                              strokeDashoffset={circumference * (1 - cooldownProgress)}
                              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s linear' }}
                          />
                      </svg>
                  )}
                </div>
                <div className="w-px h-4" style={{ background: 'rgb(var(--text-quaternary) / 0.5)' }}></div>
            </div>

            <div style={rotatingContainerStyle}>
              <div className={`glow-indicator ${isIndicatorVisible ? 'visible' : ''} ${isAvoiding ? 'avoiding' : ''}`} style={indicatorStyle}>
                <div className="glow-indicator-arc" />
              </div>

              <div style={shapeStyle} onMouseDown={(e) => handleShapeMouseDown(e, shape.id)} onContextMenu={(e) => e.preventDefault()}>
                <div className={`orientation-dot ${shape.collisionState === 'warning' ? 'dot-warning' : ''} ${shape.collisionState === 'avoiding' ? 'dot-avoiding' : ''} ${shape.isBoosting ? 'dot-accelerating' : ''} ${shape.pathIsObstructed && shape.collisionState === 'none' ? 'dot-seen' : ''}`} style={{ '--dot-color': shape.color.stroke } as React.CSSProperties} />
                <div className="internal-arrow" style={{ '--arrow-color': arrowColor } as React.CSSProperties} />
              </div>
            </div>
            {isSelected && (
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/2 left-1/2 w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2 border border-blue-400/50 rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 w-[75%] h-px" style={{ transform: `rotate(${shape.targetRotation}deg)`, transformOrigin: 'left center' }}>
                  <div className="w-full h-full bg-blue-500"></div>
                  <div className="absolute right-[-8px] top-[-8px] w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-grab active:cursor-grabbing pointer-events-auto" onMouseDown={handleAngleDragStart} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BackgroundShapes;