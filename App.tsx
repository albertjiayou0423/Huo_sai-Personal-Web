import React, { useState, useEffect, useRef, useCallback } from 'react';
import BackgroundShapes from './components/BackgroundShapes';
import Confetti from './components/Confetti';
import ProgrammerDayCountdown from './components/ProgrammerDayCountdown';
import { CodeIcon, DesignIcon, GithubIcon, MailIcon, ZapIcon, EarthquakeIcon, PartyPopperIcon, ClockIcon } from './components/Icons';

// Define background colors for each section in a map for easy access
const sectionBackgrounds: { [key: string]: string } = {
  home: 'bg-slate-100',
  about: 'bg-teal-50',
  contact: 'bg-rose-50',
};

// Define the structure of the earthquake data we'll display
interface EarthquakeInfo {
  hypocenter?: string;
  maxInt?: string;
  magnitude?: string;
  depth?: string;
  originTime?: string;
  tsunamiInfo?: string;
  eventId?: string;
}

// Define the structure for UI obstacles
interface Obstacle {
  id: string;
  rect: DOMRect;
}

// NEW: Define structure for mouse state
interface MouseState {
  x: number;
  y: number;
  isLeftDown: boolean;
  isRightDown: boolean;
}

const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const designColors = [
    { bg: 'bg-blue-100', text: 'text-blue-600' },    // Slate Blue family
    { bg: 'bg-rose-100', text: 'text-rose-600' },    // Dusty Rose family
    { bg: 'bg-teal-100', text: 'text-teal-600' },    // Sage Green family
];

export default function App() {
  // State and logic for custom mouse cursor
  const cursorOuterRef = useRef<HTMLDivElement>(null);
  const [isHoveringLink, setIsHoveringLink] = useState(false);
  
  // NEW: State for mouse position, clicks, and scroll
  const [mouseState, setMouseState] = useState<MouseState>({ x: window.innerWidth / 2, y: window.innerHeight / 2, isLeftDown: false, isRightDown: false });
  const [scrollVelocity, setScrollVelocity] = useState(0);
  const scrollTimeoutRef = useRef<number | null>(null);
  const lastScrollTop = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorOuterRef.current) {
        cursorOuterRef.current.style.left = `${e.clientX}px`;
        cursorOuterRef.current.style.top = `${e.clientY}px`;
      }
      setMouseState(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) setMouseState(prev => ({ ...prev, isLeftDown: true }));
      if (e.button === 2) setMouseState(prev => ({ ...prev, isRightDown: true }));
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) setMouseState(prev => ({ ...prev, isLeftDown: false }));
      if (e.button === 2) setMouseState(prev => ({ ...prev, isRightDown: false }));
    };
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    const container = scrollContainerRef.current;
    const handleScroll = () => {
        if (!container) return;
        const scrollTop = container.scrollTop;
        const velocity = scrollTop - lastScrollTop.current;
        lastScrollTop.current = scrollTop;
        setScrollVelocity(velocity);

        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = window.setTimeout(() => setScrollVelocity(0), 100);

        if (container.scrollTop > 10) setHasScrolled(true);
    };
    container?.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('contextmenu', handleContextMenu);
        container?.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // State and logic for scroll indicator
  const [hasScrolled, setHasScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // State for earthquake modal and data
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [earthquakeData, setEarthquakeData] = useState<EarthquakeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for toast notifications
  const [toastInfo, setToastInfo] = useState<{ id: string; message: string } | null>(null);
  const lastEarthquakeIdRef = useRef<string | null>(null);

  // Effect for polling earthquake data
  useEffect(() => {
    const fetchLatestEarthquake = async () => {
      try {
        const response = await fetch('https://dev.narikakun.net/webapi/earthquake/post_data.json');
        if (!response.ok) return; // Fail silently
        const data = await response.json();
        const eventId = data.Head?.EventID;

        // On first fetch, just set the ID without showing a toast
        if (lastEarthquakeIdRef.current === null) {
            lastEarthquakeIdRef.current = eventId;
            return;
        }

        if (eventId && eventId !== lastEarthquakeIdRef.current) {
          lastEarthquakeIdRef.current = eventId;
          const message = `${data.Body?.Earthquake?.Hypocenter?.Name || 'N/A'} 最大震度: ${data.Body?.Intensity?.Observation?.MaxInt || 'N/A'}`;
          setToastInfo({ id: eventId, message });
        }
      } catch (error) {
        console.error("Error fetching earthquake data:", error); // Log silently
      }
    };
    
    fetchLatestEarthquake(); // Initial fetch
    const intervalId = setInterval(fetchLatestEarthquake, 60000); // Poll every 60 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Effect for auto-dismissing toasts
  useEffect(() => {
    if (toastInfo) {
      const timer = setTimeout(() => setToastInfo(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toastInfo]);
  
  // State for card interactions
  const [isGlitched, setIsGlitched] = useState(false);
  const [designColorIndex, setDesignColorIndex] = useState(0);

  // State for confetti celebration
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);

  // State for UI obstacles and their indicators
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [uiIndicators, setUiIndicators] = useState<Record<string, { style: React.CSSProperties }>>({});
  const mainRef = useRef<HTMLElement>(null);

  // State and logic for circle gesture
  const [generationTrigger, setGenerationTrigger] = useState(0);
  const [vignetteProgress, setVignetteProgress] = useState(0); // 0 to 1
  const [showVignette, setShowVignette] = useState(false);
  const gestureRef = useRef({
    points: [] as { x: number; y: number }[],
    totalAngle: 0,
    lastAngle: 0,
    isActivated: false,
  });
  const progressTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleGesture = (e: MouseEvent) => {
      const { clientX: x, clientY: y } = e;
      const g = gestureRef.current;

      if (progressTimeoutRef.current) clearTimeout(progressTimeoutRef.current);
      progressTimeoutRef.current = window.setTimeout(() => {
        setShowVignette(false);
        g.points = [];
        g.totalAngle = 0;
        g.isActivated = false;
        setVignetteProgress(0);
      }, 500);

      const lastPoint = g.points[g.points.length - 1];
      if (lastPoint && Math.hypot(x - lastPoint.x, y - lastPoint.y) < 10) return;
      g.points.push({ x, y });
      if (g.points.length > 20) g.points.shift();
      if (g.points.length < 5) return;

      const sample = g.points.slice(-10);
      const center = sample.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
      center.x /= sample.length;
      center.y /= sample.length;

      const currentAngle = Math.atan2(y - center.y, x - center.x);
      if (g.points.length > 5) {
        const delta = currentAngle - g.lastAngle;
        let wrappedDelta = delta;
        if (delta > Math.PI) wrappedDelta -= 2 * Math.PI;
        if (delta < -Math.PI) wrappedDelta += 2 * Math.PI;

        if (Math.sign(g.totalAngle) !== 0 && Math.sign(wrappedDelta) !== Math.sign(g.totalAngle) && Math.abs(wrappedDelta) > 1.0) {
          g.totalAngle = 0;
          g.isActivated = false;
          setShowVignette(false);
          setVignetteProgress(0);
        } else {
          g.totalAngle += wrappedDelta;
        }
      }
      g.lastAngle = currentAngle;
      const circles = Math.abs(g.totalAngle) / (2 * Math.PI);

      if (!g.isActivated) {
        if (circles >= 1.5) { // Lowered activation threshold
          g.isActivated = true;
          g.totalAngle = 0; // Reset angle to count from here for progress
        }
      } else {
        setShowVignette(true);
        const progress = Math.min(1, circles / 1.0); // Progress from 0 to 1 as we go from 1.5 to 2.5 circles
        setVignetteProgress(progress);
        if (circles >= 1.0) { // Trigger after 1 more circle (2.5 total)
          setGenerationTrigger(prev => prev + 1);
          g.totalAngle = 0;
          g.points = [];
          g.isActivated = false;
          setVignetteProgress(0);
          setShowVignette(false);
          if (progressTimeoutRef.current) clearTimeout(progressTimeoutRef.current);
        }
      }
    };
  
    window.addEventListener('mousemove', handleGesture);
    return () => window.removeEventListener('mousemove', handleGesture);
  }, []);

  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement) return;

    const measureElements = () => {
        const obstacleNodes = mainElement.querySelectorAll<HTMLElement>('[data-obstacle="true"]');
        const newObstacles = Array.from(obstacleNodes).map((node, index) => {
            const rect = node.getBoundingClientRect();
            const id = node.dataset.id || `obstacle-${index}`;
            return { id, rect };
        }).filter(item => item.rect.width > 0 && item.rect.height > 0);
        setObstacles(newObstacles);
    };

    const observer = new ResizeObserver(measureElements);
    observer.observe(mainElement);
    const timeoutId = setTimeout(measureElements, 100);
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);
  
  const handleUiCollision = useCallback((id: string, angle: number, rect: DOMRect) => {
    const normalizedAngle = (angle + 360) % 360;
    const segmentWidth = Math.min(rect.width * 0.6, 200);
    const segmentHeight = Math.min(rect.height * 0.6, 150);
    const indicatorStyle: React.CSSProperties = { opacity: 1 };
    
    if (normalizedAngle >= 225 && normalizedAngle < 315) { 
        Object.assign(indicatorStyle, { top: `${rect.bottom}px`, left: `${rect.left + rect.width / 2 - segmentWidth / 2}px`, width: `${segmentWidth}px`, height: `3px` });
    } 
    else if (normalizedAngle >= 45 && normalizedAngle < 135) { 
        Object.assign(indicatorStyle, { top: `${rect.top - 3}px`, left: `${rect.left + rect.width / 2 - segmentWidth / 2}px`, width: `${segmentWidth}px`, height: `3px` });
    }
    else if (normalizedAngle > 135 && normalizedAngle < 225) { 
        Object.assign(indicatorStyle, { top: `${rect.top + rect.height / 2 - segmentHeight / 2}px`, left: `${rect.left - 3}px`, width: `3px`, height: `${segmentHeight}px` });
    } 
    else { 
        Object.assign(indicatorStyle, { top: `${rect.top + rect.height / 2 - segmentHeight / 2}px`, left: `${rect.right}px`, width: `3px`, height: `${segmentHeight}px` });
    }
    
    setUiIndicators(prev => ({ ...prev, [id]: { style: indicatorStyle } }));
    setTimeout(() => {
        setUiIndicators(prev => {
            const newIndicators = { ...prev };
            delete newIndicators[id];
            return newIndicators;
        });
    }, 500);
  }, []);

  const handleConfettiClick = () => {
    if (isCooldown) return;
    setShowConfetti(true);
    setIsCooldown(true);
    setTimeout(() => { setIsCooldown(false); }, 30000);
  };
  
  const onAnimationEnd = useCallback(() => { setShowConfetti(false); }, []);

  const handleEewCardClick = async () => {
    setIsModalOpen(true);
    setIsLoading(true);
    setError(null);
    setEarthquakeData(null);
    
    try {
      const response = await fetch('https://dev.narikakun.net/webapi/earthquake/post_data.json');
      if (!response.ok) throw new Error('网络响应错误，请稍后重试。');
      const data = await response.json();
      
      const parsedData: EarthquakeInfo = {
        hypocenter: data.Body?.Earthquake?.Hypocenter?.Name || 'N/A',
        maxInt: data.Body?.Intensity?.Observation?.MaxInt || 'N/A',
        magnitude: data.Body?.Earthquake?.Magnitude || 'N/A',
        depth: data.Body?.Earthquake?.Hypocenter?.Depth ? `${data.Body.Earthquake.Hypocenter.Depth}km` : 'N/A',
        originTime: data.Body?.Earthquake?.OriginTime || 'N/A',
        tsunamiInfo: data.Body?.Comments?.Observation || '无',
        eventId: data.Head?.EventID || 'N/A',
      };
      setEarthquakeData(parsedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeCardClick = () => {
    setIsGlitched(true);
    setTimeout(() => setIsGlitched(false), 300);
  };

  const handleDesignCardClick = () => {
    setDesignColorIndex((prevIndex) => (prevIndex + 1) % designColors.length);
  };

  const [activeSection, setActiveSection] = useState('home');
  const homeRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sections = [homeRef.current, aboutRef.current, contactRef.current];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) { setActiveSection(entry.target.id ?? 'home'); } });
      },
      { root: scrollContainerRef.current, threshold: 0.5, }
    );
    sections.forEach((section) => { if (section) observer.observe(section); });
    return () => { sections.forEach((section) => { if (section) observer.unobserve(section); }); };
  }, []);
  
  const clickCount = useRef(0);
  const clickTimer = useRef<number | null>(null);
  const handleTitleClick = () => {
    clickCount.current += 1;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    if (clickCount.current >= 5) {
      const canvasConfetti = (window as any).confetti;
      if (canvasConfetti) {
          canvasConfetti({ particleCount: 150, spread: 90, zIndex: 100 });
      }
      clickCount.current = 0;
    } else {
      clickTimer.current = window.setTimeout(() => {
        clickCount.current = 0;
      }, 800);
    }
  };

  const age = calculateAge(new Date('2013-01-01'));

  return (
    <main ref={mainRef} className={`relative h-screen text-slate-800 antialiased overflow-hidden transition-colors duration-700 ease-in-out ${sectionBackgrounds[activeSection]}`}>
      {/* --- Mouse Force Field Visualizer --- */}
      <div
        className="fixed pointer-events-none z-40 rounded-full border-2 border-dashed transition-all duration-300 ease-out"
        style={{
          left: mouseState.x,
          top: mouseState.y,
          transform: 'translate(-50%, -50%)',
          width: mouseState.isLeftDown ? '300px' : '0px',
          height: mouseState.isLeftDown ? '300px' : '0px',
          opacity: mouseState.isLeftDown ? 0.7 : 0,
          borderColor: 'rgba(239, 68, 68, 0.5)' // Red for push
        }}
      />
      
      <div
        ref={cursorOuterRef}
        className="fixed pointer-events-none z-50"
        style={{ top: -100, left: -100 }}
      >
        <div
          className={`w-8 h-8 rounded-full transition-all duration-200 ease-in-out ${
            isHoveringLink
              ? 'bg-blue-400 scale-150'
              : mouseState.isLeftDown || mouseState.isRightDown
              ? 'bg-blue-400/50 scale-125'
              : 'bg-transparent border-2 border-blue-400'
          }`}
          style={{ transform: 'translate(-50%, -50%)' }}
        />
      </div>

      <div
        className={`vignette-progress ${showVignette ? 'visible' : ''}`}
        style={{ '--vignette-size': `${400 - vignetteProgress * 300}px` } as React.CSSProperties}
      />
      
      {showConfetti && <Confetti onAnimationEnd={onAnimationEnd} />}
      
      <BackgroundShapes 
        obstacles={obstacles} 
        onUiCollision={handleUiCollision} 
        generationTrigger={generationTrigger}
        mouseState={mouseState}
        scrollVelocity={scrollVelocity}
      />
      
      {Object.entries(uiIndicators).map(([id, indicator]) => (
          <div key={id} className="ui-indicator-segment" style={indicator.style} />
      ))}
      
      {toastInfo && (
        <div className="fixed top-5 right-5 z-50 w-full max-w-sm bg-white/80 backdrop-blur-md rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden animate-toast-in-right">
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <EarthquakeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">新地震情报</p>
                <p className="mt-1 text-sm text-gray-600">{toastInfo.message}</p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={() => setToastInfo(null)}
                  className="inline-flex text-gray-400 rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleConfettiClick}
        disabled={isCooldown}
        className={`fixed bottom-4 left-4 z-20 p-3 bg-white/80 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 ${
          isCooldown
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:scale-110'
        }`}
        aria-label="撒花"
        onMouseEnter={() => !isCooldown && setIsHoveringLink(true)}
        onMouseLeave={() => setIsHoveringLink(false)}
        data-obstacle="true" data-id="confetti-button"
      >
        {isCooldown ? (
          <ClockIcon className="w-6 h-6 text-slate-600" />
        ) : (
          <PartyPopperIcon className="w-6 h-6 text-rose-500" />
        )}
      </button>

      <div ref={scrollContainerRef} className="relative z-10 h-screen w-full snap-y snap-mandatory overflow-y-scroll">
        <section ref={homeRef} id="home" className="relative h-screen w-full snap-start flex flex-col items-center justify-center text-center p-4 sm:p-8">
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-full max-w-md px-4" data-obstacle="true" data-id="countdown">
             <ProgrammerDayCountdown />
          </div>
          <div className="relative flex flex-col items-center" data-obstacle="true" data-id="hero-title">
            <h1 
              className="text-6xl sm:text-8xl font-bold text-slate-700 tracking-tighter"
              onClick={handleTitleClick}
              role="button"
              tabIndex={0}
            >
              Huo_sai
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-slate-600 tracking-wide">
              初中生 • 编程 • 简洁设计
            </p>
            <p className="mt-2 text-base text-slate-500">
              ({age}岁)
            </p>
          </div>
          <div
            className={`absolute bottom-6 left-1/2 -translate-x-1/2 transition-opacity duration-500 ${hasScrolled ? 'opacity-0' : 'opacity-100'}`}
            aria-hidden="true"
          >
            <div className="text-slate-500">
              <p className="mb-2 text-xs tracking-wider">滚动浏览</p>
              <svg className="w-6 h-6 mx-auto animate-bounce-slow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17l-4 4m0 0l-4-4m4 4V3" />
              </svg>
            </div>
          </div>
        </section>

        <section ref={aboutRef} id="about" className="h-screen w-full snap-start flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="relative w-full max-w-4xl text-center">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-12" data-obstacle="true" data-id="about-title">关于我</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left" data-obstacle="true" data-id="about-cards">
              <div
                className="bg-white p-6 rounded-lg border border-gray-200/50 shadow-sm transition-transform hover:scale-105 duration-300"
                onClick={handleCodeCardClick} role="button" tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleCodeCardClick()}
                onMouseEnter={() => setIsHoveringLink(true)} onMouseLeave={() => setIsHoveringLink(false)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
                    <CodeIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold">编程</h3>
                </div>
                <p className={`mt-4 text-slate-600 ${isGlitched ? 'animate-glitch' : ''}`}>主修 C++，享受用代码构建逻辑和解决问题的过程。</p>
              </div>
              <div 
                className="bg-white p-6 rounded-lg border border-gray-200/50 shadow-sm transition-transform hover:scale-105 duration-300"
                onClick={handleEewCardClick} role="button" tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleEewCardClick()}
                onMouseEnter={() => setIsHoveringLink(true)} onMouseLeave={() => setIsHoveringLink(false)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-red-100 p-3 rounded-full flex-shrink-0">
                    <ZapIcon className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold">EEW</h3>
                </div>
                <p className="mt-4 text-slate-600">对 EEW (紧急地震速报) 抱有浓厚兴趣，关注防灾减灾技术。</p>
              </div>
              <div
                className="bg-white p-6 rounded-lg border border-gray-200/50 shadow-sm transition-transform hover:scale-105 duration-300"
                onClick={handleDesignCardClick} role="button" tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleDesignCardClick()}
                onMouseEnter={() => setIsHoveringLink(true)} onMouseLeave={() => setIsHoveringLink(false)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full flex-shrink-0 transition-colors duration-300 ${designColors[designColorIndex].bg}`}>
                    <DesignIcon className={`w-6 h-6 transition-colors duration-300 ${designColors[designColorIndex].text}`} />
                  </div>
                  <h3 className="text-xl font-semibold">设计</h3>
                </div>
                <p className="mt-4 text-slate-600">热爱简洁、明快的设计风格，相信“少即是多”。</p>
              </div>
            </div>
          </div>
        </section>
        
        <section ref={contactRef} id="contact" className="h-screen w-full snap-start flex flex-col items-center justify-center p-4 sm:p-8">
           <div className="relative w-full max-w-4xl text-center">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-10" data-obstacle="true" data-id="contact-title">联系我</h2>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10" data-obstacle="true" data-id="contact-links">
                <a 
                  href="mailto:albert.tang_1a@hotmail.com"
                  className="flex items-center gap-3 text-slate-700 hover:text-blue-500 transition-colors duration-300 group"
                  onMouseEnter={() => setIsHoveringLink(true)}
                  onMouseLeave={() => setIsHoveringLink(false)}
                >
                  <MailIcon className="w-7 h-7" />
                  <span className="text-lg group-hover:underline">albert.tang_1a@hotmail.com</span>
                </a>
                <a 
                  href="https://github.com/albertjiayou0423" 
                  target="_blank" rel="noopener noreferrer" 
                  className="flex items-center gap-3 text-slate-700 hover:text-green-600 transition-colors duration-300 group"
                  onMouseEnter={() => setIsHoveringLink(true)}
                  onMouseLeave={() => setIsHoveringLink(false)}
                  >
                  <GithubIcon className="w-7 h-7" />
                  <span className="text-lg group-hover:underline">albertjiayou0423</span>
                </a>
             </div>
           </div>
        </section>
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 animate-fadeIn" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white p-6 sm:p-8 rounded-lg border border-gray-200/50 shadow-lg text-left animate-scaleUp">
             <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="关闭"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6 text-center">最新JMA地震情报</h2>
              {isLoading && <p className="text-slate-600 text-center">正在加载最新地震情报...</p>}
              {error && <p className="text-red-600 text-center">加载失败: {error}</p>}
              {earthquakeData && (
                <div>
                  <div className="flex items-start gap-4 mb-4 pb-4 border-b">
                     <div className="bg-blue-100 p-3 rounded-full flex-shrink-0 mt-1">
                        <EarthquakeIcon className="w-7 h-7 text-blue-600" />
                     </div>
                     <div>
                       <h3 className="text-2xl font-bold">{earthquakeData.hypocenter}</h3>
                       <p className="text-sm text-slate-500">
                        发布时间: {
                          earthquakeData.originTime && earthquakeData.originTime !== 'N/A'
                          ? new Date(earthquakeData.originTime).toLocaleString('zh-CN', {
                              year: 'numeric', month: '2-digit', day: '2-digit',
                              hour: '2-digit', minute: '2-digit', second: '2-digit'
                            })
                          : 'N/A'
                        }
                       </p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-500 w-16 text-right">震级:</span>
                      <span className="font-bold">{earthquakeData.magnitude}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-500 w-16 text-right">深度:</span>
                      <span className="font-bold">{earthquakeData.depth}</span>
                    </div>
                     <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-500 w-16 text-right">最大震度:</span>
                      <span className="font-bold text-red-600">{earthquakeData.maxInt}</span>
                    </div>
                     <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-500 w-16 text-right">EventID:</span>
                      <span className="font-mono text-sm">{earthquakeData.eventId}</span>
                    </div>
                    <div className="col-span-2 flex items-start gap-3 mt-2">
                      <span className="font-semibold text-slate-500 w-16 text-right shrink-0">海啸信息:</span>
                      <span className="font-bold">{earthquakeData.tsunamiInfo}</span>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </main>
  );
}