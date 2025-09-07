
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import BackgroundShapes from './components/BackgroundShapes';
import Confetti from './components/Confetti';
import ProgrammerDayCountdown from './components/ProgrammerDayCountdown';
import { Icon } from './components/Icons';
import { useDailyGreeting } from './hooks/useDailyGreeting';
import AchievementsModal, { Achievement } from './components/AchievementsModal';
import AchievementToast from './components/AchievementToast';
import GuidedTour from './components/GuidedTour';
import CodeSnippetModal from './components/CodeSnippetModal';
import StatsDashboard from './components/StatsDashboard';
import AccessibilityModal from './components/AccessibilityModal';

// Define background colors for each section using CSS variables
const sectionBgVars: { [key: string]: string } = {
  home: 'var(--background-home)',
  about: 'var(--background-about)',
  timeline: 'var(--background-timeline)',
  contact: 'var(--background-contact)',
};

// --- Unified EEW Data Structure ---
interface EarthquakeInfo {
  source: string; // JMA, Sichuan, CENC, Fujian
  hypocenter?: string;
  maxInt?: string;
  magnitude?: string;
  depth?: string;
  originTime?: string;
  reportTime?: string;
  eventId?: string;
  isFinal?: boolean;
  isCancel?: boolean;
  tsunamiInfo?: string; // JMA specific
  intensityLabel?: string; // --- NEW: Centralized label logic
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

// --- NEW: Stats Interface ---
interface UserStats {
  timeOnSite: number; // in seconds
  shapesCreated: number;
}

// --- NEW: Custom Theme Interface ---
interface CustomTheme {
  primary: string;
  accent: string;
}

// --- UPDATED: Expanded Accessibility Settings Interface ---
interface AccessibilitySettings {
    reduceMotion: boolean;
    disableIdle: boolean;
    highContrast: boolean;
    hideShapes: boolean;
    largeCursor: boolean;
    largeText: boolean;
    disableFlashes: boolean;
}

// --- NEW: GitHub Event Interface ---
interface GithubEventTrigger {
    url: string;
    message: string;
    repo: string;
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
    { bg: 'bg-blue-100', text: 'text-blue-600' },
    { bg: 'bg-rose-100', text: 'text-rose-600' },
    { bg: 'bg-teal-100', text: 'text-teal-600' },
];

function hexToRgb(hex: string): string | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
        : null;
}

function lightenHex(hex: string, percent: number): string {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(1, 5).substring(2, 4), 16);
    let b = parseInt(hex.substring(3, 7).substring(2, 4), 16);

    r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
    g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
    b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));

    const toHex = (c: number) => c.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const parseEewTime = (timeStr: string | undefined, timezoneOffset: number): Date | null => {
    if (!timeStr) return null;
    const cleanedStr = timeStr.replace(/\//g, '-').trim();
    const parts = cleanedStr.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
    if (!parts) return null;

    const [_, year, month, day, hour, minute, second] = parts.map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    
    utcDate.setUTCHours(utcDate.getUTCHours() - timezoneOffset);
    
    return utcDate;
}

// --- UPDATED: Achievements now total 16 and include parent relationships ---
const initialAchievements: Omit<Achievement, 'unlocked'>[] = [
    // --- Exploration Branch ---
    { id: 'shape_creator', parent: null, title: '形状创造者', description: '首次通过画圈手势生成新形状。', icon: <Icon name="autorenew" /> },
    { id: 'precision_guidance', parent: 'shape_creator', title: '精准制导', description: '首次用右键拖拽设定形状方向。', icon: <Icon name="explore" /> },
    { id: 'gravity_master', parent: 'shape_creator', title: '引力大师', description: '首次使用引力场吸引周围的形状。', icon: <Icon name="attractions" /> },
    { id: 'mighty_push', parent: 'gravity_master', title: '大力出奇迹', description: '用鼠标力场将一个形状推出屏幕。', icon: <Icon name="rocket_launch" /> },
    { id: 'core_overload', parent: 'mighty_push', title: '核心过载', description: '让屏幕上的形状总数超过45个。', icon: <Icon name="hub" /> },
    
    // --- Feature Discovery Branch ---
    { id: 'secret_revealer', parent: null, title: '秘密揭示者', description: '发现了隐藏功能说明，真棒！', icon: <Icon name="help" /> },
    { id: 'all_seeing_eye', parent: 'secret_revealer', title: '全知之眼', description: '打开了网站上所有类型的弹窗。', icon: <Icon name="visibility" /> },
    { id: 'easter_egg_hunter', parent: 'secret_revealer', title: '彩蛋猎人', description: '连续点击主标题5次触发了礼花。', icon: <Icon name="egg" /> },
    { id: 'code_resonance', parent: 'secret_revealer', title: '代码共鸣', description: '点击“编程”卡片触发了故障特效。', icon: <Icon name="data_object" /> },

    // --- Customization Branch ---
    { id: 'colorist', parent: null, title: '调色师', description: '首次更换网站的背景主题配色。', icon: <Icon name="palette" /> },
    { id: 'personalization_master', parent: 'colorist', title: '个性化大师', description: '创建并保存了你的自定义主题。', icon: <Icon name="brush" /> },
    { id: 'theme_architect', parent: 'personalization_master', title: '主题建筑师', description: '创建并分享了你的第一个自定义主题。', icon: <Icon name="share" /> },

    // --- Standalone Achievements ---
    { id: 'eew_discoverer', parent: null, title: 'EEW 发现者', description: '首次查询一个地区的地震速报。', icon: <Icon name="earthquake" /> },
    { id: 'time_traveler', parent: null, title: '时间旅人', description: '在时间线上回顾过去与未来。', icon: <Icon name="timeline" /> },
    { id: 'astronomer', parent: null, title: '天文学家', description: '静静观察，发现形状间的星群。', icon: <Icon name="stars" /> },
    { id: 'hand_in_hand', parent: 'astronomer', title: '手牵手', description: '观察到两个同色形状配对而行。', icon: <Icon name="favorite" /> },
];


export default function App() {
  const cursorOuterRef = useRef<HTMLDivElement>(null);
  const [isHoveringLink, setIsHoveringLink] = useState(false);
  
  const [mouseState, setMouseState] = useState<MouseState>({ x: window.innerWidth / 2, y: window.innerHeight / 2, isLeftDown: false, isRightDown: false, isShiftDown: false });
  
  const [palette, setPalette] = useState('slate');
  const [isPaletteModalOpen, setIsPaletteModalOpen] = useState(false);
  const [isCustomThemeModalOpen, setIsCustomThemeModalOpen] = useState(false);
  const [tempCustomTheme, setTempCustomTheme] = useState<CustomTheme>({ primary: '#f1f5f9', accent: '#e2e8f0' });
  const [showShareToast, setShowShareToast] = useState(false);

  const dailyGreeting = useDailyGreeting();
  
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('hs-unlocked-achievements');
    const unlockedIds = saved ? JSON.parse(saved) : [];
    return initialAchievements.map(ach => ({
        ...ach,
        unlocked: unlockedIds.includes(ach.id),
    }));
  });
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const [achievementUnlockQueue, setAchievementUnlockQueue] = useState<Achievement[]>([]);
  const [currentToast, setCurrentToast] = useState<Achievement | null>(null);

  const [isCaptureMode, setIsCaptureMode] = useState(false);
  const [isCodeSnippetModalOpen, setIsCodeSnippetModalOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [stats, setStats] = useState<UserStats>({ timeOnSite: 0, shapesCreated: 0 });

  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState(false);
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>({
    reduceMotion: false,
    disableIdle: false,
    highContrast: false,
    hideShapes: false,
    largeCursor: false,
    largeText: false,
    disableFlashes: false,
  });
  
  const [githubEventTrigger, setGithubEventTrigger] = useState<GithubEventTrigger | null>(null);
  const lastGithubEventIdRef = useRef<string | null>(null);

  const [openedModals, setOpenedModals] = useState<Set<string>>(new Set());
  const allModalTypes = useMemo(() => new Set(['help', 'achievements', 'palette', 'customTheme', 'eew']), []);

  const unlockAchievement = useCallback((id: string) => {
    setAchievements(prev => {
        const achievement = prev.find(a => a.id === id);
        if (!achievement || achievement.unlocked) {
            return prev;
        }
        
        const newAchievements = prev.map(a => a.id === id ? { ...a, unlocked: true } : a);
        const unlockedIds = newAchievements.filter(a => a.unlocked).map(a => a.id);
        localStorage.setItem('hs-unlocked-achievements', JSON.stringify(unlockedIds));

        setAchievementUnlockQueue(queue => [...queue, { ...achievement, unlocked: true }]);
        
        return newAchievements;
    });
  }, []);
  
  useEffect(() => {
    const fetchGithubActivity = async () => {
      try {
        const response = await fetch('https://api.github.com/users/albertjiayou0423/events/public');
        if (!response.ok) {
            return; // Rate limit or other error, fail silently
        }
        const events = await response.json();
        
        const latestEvent = events.find((e: any) => e.type === 'PushEvent' || e.type === 'PullRequestEvent');
        
        if (latestEvent && latestEvent.id !== lastGithubEventIdRef.current) {
            if (!lastGithubEventIdRef.current) {
                // On first load, just store the latest ID without showing a visual
                lastGithubEventIdRef.current = latestEvent.id;
                return;
            }
            lastGithubEventIdRef.current = latestEvent.id;
            
            let url = '';
            let message = '';
            const repo = latestEvent.repo.name;

            if (latestEvent.type === 'PushEvent') {
                const commit = latestEvent.payload.commits[0];
                if (commit) {
                    url = `https://github.com/${repo}/commit/${commit.sha}`;
                    message = commit.message.split('\n')[0];
                }
            } else if (latestEvent.type === 'PullRequestEvent' && latestEvent.payload.action === 'opened') {
                const pr = latestEvent.payload.pull_request;
                if (pr) {
                    url = pr.html_url;
                    message = pr.title;
                }
            }
            
            if (url) {
                setGithubEventTrigger({ url, message, repo });
            }
        }
      } catch (error) {
        console.error("Failed to fetch GitHub activity:", error);
      }
    };
    
    fetchGithubActivity();
    const intervalId = setInterval(fetchGithubActivity, 60000); // Poll every 60 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (openedModals.size >= allModalTypes.size) {
        unlockAchievement('all_seeing_eye');
    }
  }, [openedModals, allModalTypes, unlockAchievement]);

  const trackModalOpen = useCallback((modalType: string) => {
    setOpenedModals(prev => new Set(prev).add(modalType));
  }, []);

  useEffect(() => {
    const savedStats = localStorage.getItem('hs-user-stats');
    if (savedStats) {
      try {
        const parsedStats = JSON.parse(savedStats);
        setStats(prev => ({ ...prev, ...parsedStats }));
      } catch (e) {
        localStorage.removeItem('hs-user-stats');
      }
    }
    const timer = setInterval(() => {
      setStats(prev => {
        const newStats = { ...prev, timeOnSite: prev.timeOnSite + 1 };
        localStorage.setItem('hs-user-stats', JSON.stringify(newStats));
        return newStats;
      });
    }, 1000);
    
    const savedA11y = localStorage.getItem('hs-a11y-settings');
    if (savedA11y) {
        try {
            const parsedA11y = JSON.parse(savedA11y);
            // Ensure all keys are present to avoid errors with older saved data
            setAccessibilitySettings(prev => ({ ...prev, ...parsedA11y }));
        } catch(e) { /* ignore */ }
    }

    return () => clearInterval(timer);
  }, []);
  
  const handleAccessibilityChange = (newSettings: AccessibilitySettings) => {
      setAccessibilitySettings(newSettings);
      localStorage.setItem('hs-a11y-settings', JSON.stringify(newSettings));
  };
  
  // --- NEW: Effect to apply accessibility settings to the DOM ---
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // High Contrast
    if (accessibilitySettings.highContrast) {
        root.dataset.theme = 'high-contrast';
    } else {
        root.dataset.theme = palette;
    }

    // Large Text
    body.classList.toggle('text-large', accessibilitySettings.largeText);

  }, [accessibilitySettings, palette]);


  useEffect(() => {
    if (!currentToast && achievementUnlockQueue.length > 0) {
        const nextInQueue = achievementUnlockQueue[0];
        setCurrentToast(nextInQueue);

        setTimeout(() => {
            setCurrentToast(null);
            setAchievementUnlockQueue(queue => queue.slice(1));
        }, 4000);
    }
  }, [achievementUnlockQueue, currentToast]);


  const applyCustomTheme = useCallback((theme: CustomTheme) => {
    const root = document.documentElement;
    const primaryRgb = hexToRgb(theme.primary);
    if (!primaryRgb) return;

    const accentRgb = hexToRgb(theme.accent);
    if (!accentRgb) return;
    
    const frostedRgb = hexToRgb(lightenHex(theme.accent, 40));
    if (!frostedRgb) return;

    root.style.setProperty('--background-primary', primaryRgb);
    root.style.setProperty('--background-home', accentRgb);
    root.style.setProperty('--background-about', primaryRgb);
    root.style.setProperty('--background-timeline', accentRgb);
    root.style.setProperty('--background-contact', primaryRgb);
    root.style.setProperty('--background-frosted', `${frostedRgb} / 0.2`);
  }, []);

  useEffect(() => {
    // --- Theme loading logic ---
    const urlParams = new URLSearchParams(window.location.search);
    const themeParam = urlParams.get('theme');

    if (themeParam) {
      try {
        const decodedTheme = JSON.parse(atob(themeParam));
        if (decodedTheme.primary && decodedTheme.accent) {
          localStorage.setItem('hs-custom-theme', JSON.stringify(decodedTheme));
          localStorage.setItem('hs-palette', 'custom');
          setTempCustomTheme(decodedTheme);
          setPalette('custom');
          applyCustomTheme(decodedTheme);
        }
      } catch (e) {
        console.error("Failed to parse theme from URL", e);
      }
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const savedPalette = localStorage.getItem('hs-palette') || 'slate';
      setPalette(savedPalette);

      if (savedPalette === 'custom') {
        const savedTheme = localStorage.getItem('hs-custom-theme');
        if (savedTheme) {
            try {
                const parsedTheme = JSON.parse(savedTheme);
                setTempCustomTheme(parsedTheme);
                applyCustomTheme(parsedTheme);
            } catch (e) { /* ignore */ }
        } else {
            // Migration from old single color system
            const oldColor = localStorage.getItem('hs-custom-color');
            if (oldColor) {
                const newTheme = { primary: oldColor, accent: lightenHex(oldColor, 20) };
                localStorage.setItem('hs-custom-theme', JSON.stringify(newTheme));
                setTempCustomTheme(newTheme);
                applyCustomTheme(newTheme);
            }
        }
      }
    }

    const hasVisited = localStorage.getItem('hs-has-visited');
    if (!hasVisited) {
        setIsTourOpen(true);
    }
  }, [applyCustomTheme]);
  
  const handlePaletteChange = (newPalette: string) => {
      unlockAchievement('colorist');
      setPalette(newPalette);
      setIsPaletteModalOpen(false);
  };

  useEffect(() => {
    const root = document.documentElement;
    // High contrast overrides everything else
    if (accessibilitySettings.highContrast) {
        root.dataset.theme = 'high-contrast';
        return;
    }

    if (palette === 'custom') {
        const savedTheme = localStorage.getItem('hs-custom-theme');
        if (savedTheme) {
            try {
                applyCustomTheme(JSON.parse(savedTheme));
            } catch(e) { /* ignore */ }
        }
    } else {
      root.style.removeProperty('--background-primary');
      root.style.removeProperty('--background-home');
      root.style.removeProperty('--background-about');
      root.style.removeProperty('--background-timeline');
      root.style.removeProperty('--background-contact');
      root.style.removeProperty('--background-frosted');
    }
    
    root.dataset.theme = palette;
    localStorage.setItem('hs-palette', palette);
  }, [palette, applyCustomTheme, accessibilitySettings.highContrast]);

  const palettes = [
      { id: 'slate', name: '默认', bg: 'bg-slate-200' },
      { id: 'rose', name: '玫瑰', bg: 'bg-rose-200' },
      { id: 'teal', name: '青色', bg: 'bg-teal-200' },
      { id: 'lavender', name: '薰衣草', bg: 'bg-violet-200' },
      { id: 'mint', name: '薄荷', bg: 'bg-green-100' },
      { id: 'deep-space', name: '深空', bg: 'bg-slate-800' },
      { id: 'forest', name: '森林', bg: 'bg-green-900' },
      { id: 'wine-red', name: '酒红', bg: 'bg-rose-900' },
  ];
  
  const handleSaveCustomTheme = () => {
    localStorage.setItem('hs-custom-theme', JSON.stringify(tempCustomTheme));
    setPalette('custom');
    unlockAchievement('colorist');
    unlockAchievement('personalization_master');
    setIsCustomThemeModalOpen(false);
  };
  
  const handleShareTheme = () => {
    try {
        const themeString = JSON.stringify(tempCustomTheme);
        const encodedTheme = btoa(themeString);
        const url = `${window.location.origin}${window.location.pathname}?theme=${encodedTheme}`;
        navigator.clipboard.writeText(url);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 3000);
        unlockAchievement('theme_architect');
    } catch(e) {
        console.error("Failed to share theme", e);
    }
  };

  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<number | null>(null);
  const [welcomeBackMessage, setWelcomeBackMessage] = useState<string | null>(null);

  useEffect(() => {
    const IDLE_TIMEOUT = 120000;

    const handleMouseMove = (e: MouseEvent) => {
      if (cursorOuterRef.current) {
        cursorOuterRef.current.style.left = `${e.clientX}px`;
        cursorOuterRef.current.style.top = `${e.clientY}px`;
      }
      setMouseState(prev => ({ ...prev, x: e.clientX, y: e.clientY }));

      if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
      }

      if (isIdle) {
          setIsIdle(false);
          setWelcomeBackMessage('欢迎回来～');
          setTimeout(() => {
              setWelcomeBackMessage(null);
          }, 3000);
      }

      idleTimerRef.current = window.setTimeout(() => {
          setIsIdle(true);
          unlockAchievement('astronomer');
      }, IDLE_TIMEOUT);
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
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setMouseState(prev => ({ ...prev, isShiftDown: true }));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setMouseState(prev => ({ ...prev, isShiftDown: false }));
    };

    const handleBlur = () => {
        setMouseState(prev => ({ ...prev, isLeftDown: false, isRightDown: false, isShiftDown: false }));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    const container = scrollContainerRef.current;
    
    const handleScroll = () => {
      if (container && container.scrollTop > 10) setHasScrolled(true);
    };

    container?.addEventListener('scroll', handleScroll);

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('contextmenu', handleContextMenu);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('blur', handleBlur);
        container?.removeEventListener('scroll', handleScroll);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isIdle, unlockAchievement]);

  useEffect(() => {
    if (mouseState.isLeftDown && mouseState.isShiftDown) {
        unlockAchievement('gravity_master');
    }
  }, [mouseState.isLeftDown, mouseState.isShiftDown, unlockAchievement]);

  const [hasScrolled, setHasScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const homeRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);
  const sectionRefs = useMemo(() => ({
      home: homeRef,
      about: aboutRef,
      timeline: timelineRef,
      contact: contactRef
  }), []);
  const sectionOrder = useMemo(() => ['home', 'about', 'timeline', 'contact'], []);

  const activeSectionRef = useRef('home');
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  const scrollToSection = useCallback((sectionId: string) => {
      const sectionRef = sectionRefs[sectionId as keyof typeof sectionRefs];
      if (sectionRef?.current && scrollContainerRef.current) {
          isScrollingRef.current = true;
          scrollContainerRef.current.scrollTo({
              top: sectionRef.current.offsetTop,
              behavior: 'smooth',
          });
          setTimeout(() => { isScrollingRef.current = false; }, 1000);
      }
  }, [sectionRefs]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        if (isScrollingRef.current) return;

        const currentSectionIndex = sectionOrder.indexOf(activeSectionRef.current);
        let nextSectionIndex = -1;

        if (e.deltaY > 20) {
            if (currentSectionIndex < sectionOrder.length - 1) nextSectionIndex = currentSectionIndex + 1;
        } else if (e.deltaY < -20) {
            if (currentSectionIndex > 0) nextSectionIndex = currentSectionIndex - 1;
        }

        if (nextSectionIndex !== -1) {
            isScrollingRef.current = true;
            const nextSectionKey = sectionOrder[nextSectionIndex] as keyof typeof sectionRefs;
            scrollToSection(nextSectionKey);
        }
    };

    const handleScrollEnd = () => {
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = window.setTimeout(() => { isScrollingRef.current = false; }, 150);
    };
    
    window.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('scroll', handleScrollEnd);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      container.removeEventListener('scroll', handleScrollEnd);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [sectionOrder, sectionRefs, scrollToSection]);
  
  const [activeSection, setActiveSection] = useState('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [earthquakeData, setEarthquakeData] = useState<EarthquakeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [toastInfo, setToastInfo] = useState<{ id: string; message: string; source: string; } | null>(null);
  const lastEventIdRef = useRef<Record<string, string | null>>({});
  const [eewRippleKey, setEewRippleKey] = useState(0);

  const parseEewData = useCallback((data: any, sourceIdentifier: string): EarthquakeInfo | null => {
    try {
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0 || data.type === 'heartbeat') return null;
      const eventId = data.EventID;
      const hypocenter = data.Hypocenter ?? data.HypoCenter;
      if (!eventId && !hypocenter) return null;
      const magnitude = data.Magunitude ?? data.Magnitude;
      
      let sourceName = '未知来源';
      switch(sourceIdentifier) {
        case 'jma_eew': sourceName = '日本气象厅 (JMA)'; break;
        case 'sc_eew': sourceName = '四川省地震局'; break;
        case 'cenc_eew': sourceName = '中国地震台网中心 (CENC)'; break;
        case 'fj_eew': sourceName = '福建省地震局'; break;
      }
      const intensityLabel = sourceIdentifier === 'jma_eew' ? '最大震度' : '最大烈度';
  
      return {
        source: sourceName, hypocenter, eventId, magnitude, intensityLabel,
        maxInt: data.MaxIntensity?.toString(),
        depth: data.Depth != null ? `${data.Depth}km` : undefined,
        originTime: data.OriginTime,
        reportTime: data.ReportTime ?? data.AnnouncedTime,
        isFinal: data.isFinal, isCancel: data.isCancel,
        tsunamiInfo: data.Title?.includes('津波') ? '有' : '无',
      };
    } catch (e) {
      console.error("Error parsing EEW data:", e, data);
      return null;
    }
  }, []);

  useEffect(() => {
    const eewSources = [ { name: 'jma_eew', tz: 9 }, { name: 'sc_eew', tz: 8 }, { name: 'cenc_eew', tz: 8 }, { name: 'fj_eew', tz: 8 } ];
    const poll = async () => {
        const requests = eewSources.map(source => 
            fetch(`https://api.wolfx.jp/${source.name}.json`)
                .then(res => res.ok ? res.json() : Promise.reject(`Failed to fetch ${source.name}`))
                .then(jsonData => ({ jsonData, sourceName: source.name, tz: source.tz }))
                .catch(error => null)
        );
        const results = await Promise.all(requests);
        const threeMinutesAgo = Date.now() - (3 * 60 * 1000);

        for (const result of results) {
            if (result) {
                const parsedData = parseEewData(result.jsonData, result.sourceName);
                if (parsedData?.eventId && parsedData.reportTime) {
                    if (lastEventIdRef.current[parsedData.source] !== parsedData.eventId) {
                        const reportDate = parseEewTime(parsedData.reportTime, result.tz);
                        if (reportDate && reportDate.getTime() > threeMinutesAgo) {
                            lastEventIdRef.current[parsedData.source] = parsedData.eventId;
                            const message = `${parsedData.hypocenter || 'N/A'} M${parsedData.magnitude || '?'} ${parsedData.intensityLabel}: ${parsedData.maxInt || 'N/A'}`;
                            setToastInfo({ id: parsedData.eventId, message, source: parsedData.source });
                            if (!accessibilitySettings.disableFlashes) {
                                setEewRippleKey(prev => prev + 1);
                            }
                            setEarthquakeData(parsedData);
                            trackModalOpen('eew');
                            setIsModalOpen(true);
                            setIsLoading(false);
                            setError(null);
                        }
                    }
                }
            }
        }
    };
    poll();
    const intervalId = setInterval(poll, 7000);
    return () => clearInterval(intervalId);
  }, [parseEewData, trackModalOpen, accessibilitySettings.disableFlashes]);

  useEffect(() => {
    if (toastInfo) {
      const timer = setTimeout(() => setToastInfo(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [toastInfo]);
  
  const [isGlitched, setIsGlitched] = useState(false);
  const [designColorIndex, setDesignColorIndex] = useState(0);

  const [showConfetti, setShowConfetti] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [uiIndicators, setUiIndicators] = useState<Record<string, { style: React.CSSProperties }>>({});
  const mainRef = useRef<HTMLElement>(null);

  const [generationTrigger, setGenerationTrigger] = useState(0);
  const [vignetteProgress, setVignetteProgress] = useState(0);
  const [showVignette, setShowVignette] = useState(false);
  const gestureRef = useRef({ points: [] as { x: number; y: number }[], totalAngle: 0, lastAngle: 0, isActivated: false });
  const progressTimeoutRef = useRef<number | null>(null);
  
  const [shapeCount, setShapeCount] = useState(0);
  useEffect(() => {
    if (shapeCount > 45) {
        unlockAchievement('core_overload');
    }
  }, [shapeCount, unlockAchievement]);

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [hoveredTimelineColor, setHoveredTimelineColor] = useState<string | null>(null);

  useEffect(() => {
    if (generationTrigger > 0) {
        unlockAchievement('shape_creator');
        setStats(prev => {
            const newStats = { ...prev, shapesCreated: prev.shapesCreated + 4 };
            localStorage.setItem('hs-user-stats', JSON.stringify(newStats));
            return newStats;
        });
    }
  }, [generationTrigger, unlockAchievement]);

  useEffect(() => {
    const handleGesture = (e: MouseEvent) => {
      const { clientX: x, clientY: y } = e;
      const g = gestureRef.current;

      if (progressTimeoutRef.current) clearTimeout(progressTimeoutRef.current);
      progressTimeoutRef.current = window.setTimeout(() => {
        setShowVignette(false);
        g.points = []; g.totalAngle = 0; g.isActivated = false; setVignetteProgress(0);
      }, 500);

      const lastPoint = g.points[g.points.length - 1];
      if (lastPoint && Math.hypot(x - lastPoint.x, y - lastPoint.y) < 10) return;
      g.points.push({ x, y });
      if (g.points.length > 20) g.points.shift();
      if (g.points.length < 5) return;

      const sample = g.points.slice(-10);
      const center = sample.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
      center.x /= sample.length; center.y /= sample.length;

      const currentAngle = Math.atan2(y - center.y, x - center.x);
      if (g.points.length > 5) {
        const delta = currentAngle - g.lastAngle;
        let wrappedDelta = delta;
        if (delta > Math.PI) wrappedDelta -= 2 * Math.PI;
        if (delta < -Math.PI) wrappedDelta += 2 * Math.PI;

        if (Math.sign(g.totalAngle) !== 0 && Math.sign(wrappedDelta) !== Math.sign(g.totalAngle) && Math.abs(wrappedDelta) > 1.0) {
          g.totalAngle = 0; g.isActivated = false; setShowVignette(false); setVignetteProgress(0);
        } else {
          g.totalAngle += wrappedDelta;
        }
      }
      g.lastAngle = currentAngle;
      const circles = Math.abs(g.totalAngle) / (2 * Math.PI);

      if (!g.isActivated) {
        if (circles >= 1.5) { g.isActivated = true; g.totalAngle = 0; }
      } else {
        setShowVignette(true);
        const progress = Math.min(1, circles / 1.0);
        setVignetteProgress(progress);
        if (circles >= 1.0) {
          setGenerationTrigger(prev => prev + 1);
          g.totalAngle = 0; g.points = []; g.isActivated = false; setVignetteProgress(0); setShowVignette(false);
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
    return () => { clearTimeout(timeoutId); observer.disconnect(); };
  }, []);
  
  const handleUiCollision = useCallback((id: string, angle: number, rect: DOMRect) => {
    const normalizedAngle = (angle + 360) % 360;
    const segmentWidth = Math.min(rect.width * 0.6, 200);
    const segmentHeight = Math.min(rect.height * 0.6, 150);
    const indicatorStyle: React.CSSProperties = { opacity: 1 };
    
    if (normalizedAngle >= 225 && normalizedAngle < 315) Object.assign(indicatorStyle, { top: `${rect.bottom}px`, left: `${rect.left + rect.width / 2 - segmentWidth / 2}px`, width: `${segmentWidth}px`, height: `3px` });
    else if (normalizedAngle >= 45 && normalizedAngle < 135) Object.assign(indicatorStyle, { top: `${rect.top - 3}px`, left: `${rect.left + rect.width / 2 - segmentWidth / 2}px`, width: `${segmentWidth}px`, height: `3px` });
    else if (normalizedAngle > 135 && normalizedAngle < 225) Object.assign(indicatorStyle, { top: `${rect.top + rect.height / 2 - segmentHeight / 2}px`, left: `${rect.left - 3}px`, width: `3px`, height: `${segmentHeight}px` });
    else Object.assign(indicatorStyle, { top: `${rect.top + rect.height / 2 - segmentHeight / 2}px`, left: `${rect.right}px`, width: `3px`, height: `${segmentHeight}px` });
    
    setUiIndicators(prev => ({ ...prev, [id]: { style: indicatorStyle } }));
    setTimeout(() => {
        setUiIndicators(prev => { const newIndicators = { ...prev }; delete newIndicators[id]; return newIndicators; });
    }, 500);
  }, []);

  const handleConfettiClick = () => {
    if (isCooldown) return;
    setShowConfetti(true); setIsCooldown(true);
    setTimeout(() => { setIsCooldown(false); }, 30000);
  };
  
  const onAnimationEnd = useCallback(() => { setShowConfetti(false); }, []);

  const handleEewSourceClick = async (source: 'jma' | 'sc' | 'cenc' | 'fj') => {
    setIsModalOpen(true); setIsLoading(true); setError(null); setEarthquakeData(null); unlockAchievement('eew_discoverer'); trackModalOpen('eew');
    try {
      const response = await fetch(`https://api.wolfx.jp/${source}_eew.json`);
      if (!response.ok) throw new Error('网络响应错误，请稍后重试。');
      const data = await response.json();
      const parsedData = parseEewData(data, `${source}_eew`);
      if (!parsedData) { setError("当前无最新地震速报。"); setEarthquakeData(null); return; }
      setEarthquakeData(parsedData);
    } catch (err) { setError('获取或解析数据时出错。');
    } finally { setIsLoading(false); }
  };

  const handleCodeCardClick = () => {
    if (!accessibilitySettings.disableFlashes) {
        setIsGlitched(true);
        setTimeout(() => setIsGlitched(false), 300);
    }
    setIsCodeSnippetModalOpen(true);
    unlockAchievement('code_resonance');
  };

  const handleDesignCardClick = () => {
    setDesignColorIndex((prevIndex) => (prevIndex + 1) % designColors.length);
  };

  useEffect(() => {
    const sections = [homeRef.current, aboutRef.current, timelineRef.current, contactRef.current];
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) { 
                const newActiveSection = entry.target.id ?? 'home';
                setActiveSection(newActiveSection);
                activeSectionRef.current = newActiveSection;
            } 
        });
      }, { root: scrollContainerRef.current, threshold: 0.5 });
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
      if (canvasConfetti) canvasConfetti({ particleCount: 150, spread: 90, zIndex: 100 });
      clickCount.current = 0;
      unlockAchievement('easter_egg_hunter');
    } else {
      clickTimer.current = window.setTimeout(() => { clickCount.current = 0; }, 800);
    }
  };

  const handleDownloadScreenshot = useCallback(() => {
      const mainElement = mainRef.current;
      if (mainElement && (window as any).html2canvas) {
          (window as any).html2canvas(mainElement, {
              useCORS: true,
              backgroundColor: null,
              scale: 2,
          }).then((canvas: HTMLCanvasElement) => {
              const link = document.createElement('a');
              link.download = `huo_sai_website_${Date.now()}.png`;
              link.href = canvas.toDataURL('image/png');
              link.click();
              setIsCaptureMode(false);
          });
      }
  }, []);

  const age = calculateAge(new Date('2013-01-01'));
  
  const hiddenFeatures = [
    { icon: <Icon name="auto_awesome" className="text-amber-500" />, title: "标题彩蛋", description: "连续点击主标题 “Huo_sai” 5次，触发礼花庆祝！" },
    { icon: <Icon name="autorenew" className="text-sky-500" />, title: "手势画圈", description: "在屏幕任意位置按住鼠标画一个完整的圆圈，可以生成新的形状。" },
    { icon: <Icon name="open_with" className="text-violet-500" />, title: "精准操控", description: "用鼠标右键点击任意形状，可以将其选中。拖动外围的圆环来改变它的飞行方向。" },
    { icon: <Icon name="mouse" className="text-rose-500" />, title: "力场交互", description: "按住鼠标左键会产生一个排斥力场，将周围的形状推开。" },
    { icon: <Icon name="attractions" className="text-blue-500" />, title: "引力力场", description: "按住 Shift + 鼠标左键，可以产生一个引力场，将周围的形状吸引过来。" },
    { icon: <Icon name="palette" className="text-emerald-500" />, title: "主题切换", description: "点击右上角的调色盘图标，可以自由切换网站的背景配色方案，包括自定义颜色。" },
    { icon: <Icon name="hub" className="text-teal-500" />, title: "智能聚集", description: "当鼠标静止2分钟后，相同颜色的形状会像家人一样，慢慢聚集在一起。" },
    { icon: <Icon name="timeline" className="text-indigo-500" />, title: "时间线互动", description: "浏览“编程之旅”时，将鼠标悬停在任意时间点上，背景会变成该主题的颜色。" }
  ];
  
  const timelineData = [
      { year: '2022', text: '开始学习编程 (Scratch)', color: 'bg-orange-400', hex: '#fb923c' },
      { year: '2023', text: '学习 Python', color: 'bg-sky-400', hex: '#38bdf8' },
      { year: '2024-2025', text: '专心学习 C++', color: 'bg-blue-500', hex: '#3b82f6' },
      { year: '未来', text: '深入学习算法与数据结构', color: 'bg-indigo-500', hex: '#6366f1' },
      { year: '未来', text: '为开源项目做出贡献', color: 'bg-emerald-500', hex: '#10b981' },
      { year: '目标', text: '成为一名创造有趣、有用东西的工程师', color: 'bg-rose-500', hex: '#f43f5e' },
  ];

  const aboutTitleRef = useRef<HTMLHeadingElement>(null);
  const contactLinksRef = useRef<HTMLDivElement>(null);

  const tourRefs = {
      step1: useRef<HTMLHeadingElement>(null),
      step2: useRef<HTMLDivElement>(null),
      step3: useRef<HTMLButtonElement>(null),
      step4: useRef<HTMLDivElement>(null),
      step5: useRef<HTMLDivElement>(null),
      step6: useRef<HTMLDivElement>(null),
      step7: useRef<HTMLButtonElement>(null),
      step8: useRef<HTMLButtonElement>(null),
      aboutTitleRef: aboutTitleRef,
      contactLinksRef: contactLinksRef,
  };

  const mainClasses = [
    'relative h-screen text-[rgb(var(--text-primary))] antialiased overflow-hidden',
    isCaptureMode ? 'capture-mode' : '',
    accessibilitySettings.largeCursor ? 'cursor-large' : '',
    accessibilitySettings.disableFlashes ? 'no-flashing-effects' : ''
  ].join(' ');

  return (
    <main 
      ref={mainRef} 
      className={mainClasses}
    >
      <div 
        className="fixed inset-0 z-0 transition-colors duration-700 ease-in-out"
        style={{ backgroundColor: `rgb(${sectionBgVars[activeSection]})` }}
      />

      {eewRippleKey > 0 && <div key={eewRippleKey} className="eew-ripple-effect"></div>}

      <div
        className="fixed pointer-events-none z-40 rounded-full border-2 border-dashed transition-all duration-300 ease-out hide-on-capture"
        style={{
          left: mouseState.x,
          top: mouseState.y,
          transform: 'translate(-50%, -50%)',
          width: mouseState.isLeftDown ? '300px' : '0px',
          height: mouseState.isLeftDown ? '300px' : '0px',
          opacity: mouseState.isLeftDown ? 0.7 : 0,
          borderColor: mouseState.isShiftDown ? 'rgba(59, 130, 246, 0.5)' : 'rgba(239, 68, 68, 0.5)'
        }}
      />
      
      <div
        ref={cursorOuterRef}
        className="fixed pointer-events-none z-[9999]"
        style={{ top: -100, left: -100 }}
      >
        <div
          className={`w-8 h-8 rounded-full transition-all duration-200 ease-in-out hide-on-capture ${
            isHoveringLink ? 'bg-blue-400 scale-150' : mouseState.isLeftDown || mouseState.isRightDown ? 'bg-blue-400/50 scale-125' : 'bg-transparent border-2 border-blue-400'
          }`}
          style={{ transform: 'translate(-50%, -50%)' }}
        />
      </div>

      <div
        className={`vignette-progress ${showVignette ? 'visible' : ''} hide-on-capture`}
        style={{ '--vignette-size': `${400 - vignetteProgress * 300}px` } as React.CSSProperties}
      />
      
      {showConfetti && <Confetti onAnimationEnd={onAnimationEnd} />}
      
      {currentToast && (
          <AchievementToast icon={currentToast.icon} title={currentToast.title} />
      )}
      
      {showShareToast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-full shadow-lg animate-fade-in-out">
            <Icon name="link" className="!text-lg mr-2" />
            链接已复制到剪贴板！
        </div>
      )}

      {isTourOpen && <GuidedTour tourRefs={tourRefs} onClose={() => {setIsTourOpen(false); localStorage.setItem('hs-has-visited', 'true')}} scrollToSection={scrollToSection} />}
      {isCodeSnippetModalOpen && <CodeSnippetModal onClose={() => setIsCodeSnippetModalOpen(false)} />}
      {isAccessibilityModalOpen && <AccessibilityModal settings={accessibilitySettings} onSettingsChange={handleAccessibilityChange} onClose={() => setIsAccessibilityModalOpen(false)} />}
      
      {isCaptureMode && (
        <div className="fixed inset-0 z-[1001] bg-black/50 flex flex-col items-center justify-center gap-6 animate-fadeIn">
            <h2 className="text-3xl font-bold text-white">定格艺术</h2>
            <p className="text-lg text-slate-300">已暂停动画。准备好下载这张独特的生成艺术作品了吗？</p>
            <div className="flex gap-4">
                <button
                    onClick={handleDownloadScreenshot}
                    className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors"
                >
                    下载截图
                </button>
                <button
                    onClick={() => setIsCaptureMode(false)}
                    className="px-6 py-3 bg-slate-600/50 text-white font-semibold rounded-md hover:bg-slate-500/50 transition-colors"
                >
                    取消
                </button>
            </div>
        </div>
      )}

      <div className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pointer-events-auto z-30 hide-on-capture" data-obstacle="true" data-id="countdown">
         <ProgrammerDayCountdown />
      </div>
      
      {!accessibilitySettings.hideShapes && <BackgroundShapes 
        obstacles={obstacles} 
        onUiCollision={handleUiCollision} 
        generationTrigger={generationTrigger}
        mouseState={mouseState}
        onShapeCountChange={setShapeCount}
        isIdle={isIdle && !accessibilitySettings.disableIdle}
        hoveredTimelineColor={hoveredTimelineColor}
        activeSection={activeSection}
        isPaused={isCaptureMode || accessibilitySettings.reduceMotion}
        onShapeRedirected={() => unlockAchievement('precision_guidance')}
        onShapePushedOffscreen={() => unlockAchievement('mighty_push')}
        onPairFormed={() => unlockAchievement('hand_in_hand')}
        githubEventTrigger={githubEventTrigger}
      />}
      
      {Object.entries(uiIndicators).map(([id, indicator]) => (
          <div key={id} className="ui-indicator-segment hide-on-capture" style={indicator.style} />
      ))}
      
      {toastInfo && (
        <div className="fixed top-5 right-5 z-50 w-full max-w-sm bg-[rgb(var(--background-card))] backdrop-blur-md rounded-lg shadow-lg pointer-events-auto ring-1 ring-[rgb(var(--ring-primary))] overflow-hidden animate-toast-in-right hide-on-capture">
          <div className="p-4"><div className="flex items-start"><div className="flex-shrink-0 pt-0.5"><Icon name="earthquake" className="text-blue-600 !text-2xl" /></div><div className="ml-3 w-0 flex-1"><p className="text-sm font-semibold text-[rgb(var(--text-primary))]">新地震速报 ({toastInfo.source})</p><p className="mt-1 text-sm text-[rgb(var(--text-tertiary))]">{toastInfo.message}</p></div><div className="ml-4 flex-shrink-0 flex"><button onClick={() => { setToastInfo(null); }} className="inline-flex text-[rgb(var(--text-quaternary))] rounded-md hover:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"><span className="sr-only">Close</span><Icon name="close" className="!text-xl" /></button></div></div></div>
        </div>
      )}
      
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-4 hide-on-capture">
        <button onClick={handleConfettiClick} disabled={isCooldown} className={`p-3 bg-[rgb(var(--background-button))] rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 pointer-events-auto ${isCooldown ? 'opacity-50' : 'hover:scale-110'}`} aria-label="撒花" onMouseDown={() => !isCooldown} onMouseEnter={() => { if (!isCooldown) { setIsHoveringLink(true); } }} onMouseLeave={() => setIsHoveringLink(false)} data-obstacle="true" data-id="confetti-button">
          {isCooldown ? <Icon name="schedule" className="text-[rgb(var(--text-tertiary))]" /> : <Icon name="celebration" className="text-rose-500" />}
        </button>
        <button onClick={() => { setIsHelpModalOpen(true); unlockAchievement('secret_revealer'); trackModalOpen('help'); }} className="p-3 bg-[rgb(var(--background-button))] rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 pointer-events-auto" aria-label="帮助" onMouseEnter={() => { setIsHoveringLink(true); }} onMouseLeave={() => setIsHoveringLink(false)} data-obstacle="true" data-id="help-button">
          <Icon name="help" className="text-[rgb(var(--text-secondary))]" />
        </button>
        <button ref={tourRefs.step7} onClick={() => { setIsAchievementsModalOpen(true); trackModalOpen('achievements'); }} className="p-3 bg-[rgb(var(--background-button))] rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 pointer-events-auto" aria-label="成就" onMouseEnter={() => { setIsHoveringLink(true); }} onMouseLeave={() => setIsHoveringLink(false)} data-obstacle="true" data-id="achievements-button">
          <Icon name="emoji_events" className="text-amber-500" />
        </button>
        <button ref={tourRefs.step8} onClick={() => setIsCaptureMode(true)} className="p-3 bg-[rgb(var(--background-button))] rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 pointer-events-auto" aria-label="截图" onMouseEnter={() => { setIsHoveringLink(true); }} onMouseLeave={() => setIsHoveringLink(false)} data-obstacle="true" data-id="capture-button">
            <Icon name="photo_camera" className="text-indigo-500" />
        </button>
      </div>

      <button ref={tourRefs.step3} className="fixed top-4 right-4 z-40 p-3 bg-[rgb(var(--background-button))] rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 pointer-events-auto hide-on-capture" aria-label="Toggle Theme" onClick={() => { setIsPaletteModalOpen(true); trackModalOpen('palette'); }} onMouseEnter={() => { setIsHoveringLink(true); }} onMouseLeave={() => setIsHoveringLink(false)} data-obstacle="true" data-id="theme-button">
          <Icon name="palette" className="text-[rgb(var(--text-secondary))]" />
      </button>

      {isPaletteModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-auto"><div className="absolute inset-0 bg-black/40 animate-fadeIn" onClick={() => { setIsPaletteModalOpen(false); }}></div><div className="relative flex flex-col items-center gap-4 bg-[rgb(var(--background-card))] p-6 sm:p-8 rounded-lg border border-[rgb(var(--border-primary))] shadow-lg text-left animate-scaleUp"><h3 className="text-lg font-semibold text-[rgb(var(--text-secondary))]">选择背景</h3><div className="grid grid-cols-4 sm:grid-cols-4 gap-4">{palettes.map(p => (<button key={p.id} onClick={() => handlePaletteChange(p.id)} onMouseEnter={() => { setIsHoveringLink(true); }} onMouseLeave={() => setIsHoveringLink(false)} className={`flex flex-col items-center gap-2 p-2 rounded-md transition-all ${palette === p.id ? 'ring-2 ring-blue-500' : 'hover:bg-slate-500/10'}`}><div className={`w-10 h-10 rounded-full ${p.bg}`}></div><span className="text-xs text-[rgb(var(--text-tertiary))]">{p.name}</span></button>))} <button onClick={() => { setIsPaletteModalOpen(false); setIsCustomThemeModalOpen(true); trackModalOpen('customTheme'); }} onMouseEnter={() => { setIsHoveringLink(true); }} onMouseLeave={() => setIsHoveringLink(false)} className={`flex flex-col items-center gap-2 p-2 rounded-md transition-all ${palette === 'custom' ? 'ring-2 ring-blue-500' : 'hover:bg-slate-500/10'}`}><div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 via-yellow-400 to-blue-400"></div><span className="text-xs text-[rgb(var(--text-tertiary))]">自定义</span></button></div></div></div>
      )}
      
      {isCustomThemeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto"><div className="absolute inset-0 bg-black/40 animate-fadeIn" onClick={() => setIsCustomThemeModalOpen(false)}></div><div className="relative flex flex-col items-center gap-6 bg-[rgb(var(--background-card))] p-6 sm:p-8 rounded-lg border border-[rgb(var(--border-primary))] shadow-lg text-left animate-scaleUp"><h3 className="text-lg font-semibold text-[rgb(var(--text-secondary))] mb-2">自定义主题</h3><div className="grid grid-cols-2 gap-6"><div className="flex flex-col items-center gap-2"><label htmlFor="primary-color" className="text-sm text-[rgb(var(--text-tertiary))]">主背景</label><input type="color" id="primary-color" value={tempCustomTheme.primary} onChange={(e) => setTempCustomTheme(t => ({...t, primary: e.target.value}))} className="w-20 h-20 p-0 border-none rounded-md" /></div><div className="flex flex-col items-center gap-2"><label htmlFor="accent-color" className="text-sm text-[rgb(var(--text-tertiary))]">强调背景</label><input type="color" id="accent-color" value={tempCustomTheme.accent} onChange={(e) => setTempCustomTheme(t => ({...t, accent: e.target.value}))} className="w-20 h-20 p-0 border-none rounded-md" /></div></div><div className="flex items-center gap-4 mt-4"><button onClick={handleSaveCustomTheme} onMouseEnter={() => { setIsHoveringLink(true); }} onMouseLeave={() => setIsHoveringLink(false)} className="px-5 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors">保存</button><button onClick={handleShareTheme} onMouseEnter={() => { setIsHoveringLink(true); }} onMouseLeave={() => setIsHoveringLink(false)} className="px-5 py-2 bg-slate-500/20 text-[rgb(var(--text-secondary))] font-semibold rounded-md hover:bg-slate-500/30 transition-colors flex items-center gap-2"><Icon name="share" className="!text-lg" /> 分享</button></div></div></div>
      )}
      
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-auto"><div className="absolute inset-0 bg-black/40 animate-fadeIn" onClick={() => setIsHelpModalOpen(false)}></div><div className="relative w-full max-w-4xl bg-[rgb(var(--background-card))] p-6 sm:p-8 rounded-lg border border-[rgb(var(--border-primary))] shadow-lg text-left animate-scaleUp"><button onClick={() => { setIsHelpModalOpen(false); }} className="absolute top-4 right-4 text-[rgb(var(--text-quaternary))] hover:text-[rgb(var(--text-tertiary))] transition-colors" aria-label="关闭"><Icon name="close" /></button><h2 className="text-2xl font-bold tracking-tight mb-6 text-center text-[rgb(var(--text-secondary))]">隐藏功能说明</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{hiddenFeatures.map((feature, index) => (<div key={index} className="bg-slate-400/10 p-4 rounded-lg flex flex-col items-center text-center backdrop-blur-sm"><div className="flex-shrink-0 mb-3 text-4xl">{feature.icon}</div><h3 className="text-md font-semibold text-[rgb(var(--text-secondary))] mb-1">{feature.title}</h3><p className="text-sm text-[rgb(var(--text-tertiary))]">{feature.description}</p></div>))}</div><div className="mt-6 pt-4 border-t border-[rgb(var(--border-primary))] flex flex-wrap justify-end items-center gap-4"><button onClick={() => { setIsHelpModalOpen(false); setIsAccessibilityModalOpen(true); }} className="help-modal-button"><Icon name="accessibility" /><span>无障碍设定</span></button><button onClick={() => { setIsHelpModalOpen(false); setIsTourOpen(true); }} className="help-modal-button"><Icon name="tour" /><span>开始引导</span></button></div></div></div>
      )}

      {isAchievementsModalOpen && (<AchievementsModal achievements={achievements} onClose={() => setIsAchievementsModalOpen(false)} />)}

      {shapeCount > 45 && !accessibilitySettings.hideShapes && (
         <div className="fixed bottom-4 right-4 z-[51] flex items-center gap-3 px-4 py-3 bg-[rgb(var(--background-button-refresh))] rounded-full shadow-lg backdrop-blur-md ring-1 ring-[rgb(var(--ring-primary))] transition-all duration-200 animate-slide-up-fade-in pointer-events-auto hide-on-capture" data-obstacle="true" data-id="refresh-prompt">
            <span className="text-sm text-[rgb(var(--text-secondary))] font-medium">是不是有点卡了？刷新一下试试吧</span>
         </div>
      )}

      <div ref={scrollContainerRef} className="relative z-20 h-screen w-full overflow-y-scroll pointer-events-none">
        <section ref={homeRef} id="home" className="relative h-screen w-full snap-start flex flex-col items-center justify-center text-center p-4 sm:p-8">
          <div ref={tourRefs.step2} className="relative flex flex-col items-center bg-[rgb(var(--background-frosted))] backdrop-blur-md px-12 py-8 pointer-events-auto relative z-30" data-obstacle="true" data-id="hero-title">
            <h1 ref={tourRefs.step1} className="text-6xl sm:text-8xl font-bold text-[rgb(var(--text-secondary))] tracking-tighter" onClick={handleTitleClick} role="button" tabIndex={0}>
              Huo_sai
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-[rgb(var(--text-tertiary))] tracking-wide">{welcomeBackMessage || dailyGreeting}</p>
            <p className="mt-2 text-base text-[rgb(var(--text-quaternary))]">({age}岁)</p>
          </div>
          <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 transition-opacity duration-500 pointer-events-auto z-30 ${hasScrolled ? 'opacity-0' : ''}`} aria-hidden="true"><div className="text-[rgb(var(--text-quaternary))]"><p className="mb-2 text-xs tracking-wider">滚动浏览</p><Icon name="south" className="mx-auto animate-bounce-slow" /></div></div>
        </section>

        <section ref={aboutRef} id="about" className="h-screen w-full snap-start flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="relative w-full max-w-4xl text-center pointer-events-auto z-30">
            <h2 ref={aboutTitleRef} className="text-4xl sm:text-5xl font-bold tracking-tight mb-12 text-[rgb(var(--text-secondary))]" data-obstacle="true" data-id="about-title">关于我</h2>
            <div ref={tourRefs.step4} className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left" data-obstacle="true" data-id="about-cards">
              <div className="bg-[rgb(var(--background-card))] p-6 rounded-lg border border-[rgb(var(--border-primary))] shadow-sm transition-transform hover:scale-105 duration-300 pointer-events-auto" onClick={handleCodeCardClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleCodeCardClick()} onMouseEnter={() => { setIsHoveringLink(true); }} onMouseLeave={() => setIsHoveringLink(false)}>
                <div className="flex items-center gap-4"><div className="bg-blue-100 p-3 rounded-full flex-shrink-0"><Icon name="code" className="text-blue-600" /></div><h3 className="text-xl font-semibold text-[rgb(var(--text-secondary))]">编程</h3></div>
                <p className={`mt-4 text-[rgb(var(--text-tertiary))] ${isGlitched ? 'animate-glitch' : ''}`}>主修 C++，享受用代码构建逻辑和解决问题的过程。</p>
              </div>
              <div className="bg-[rgb(var(--background-card))] p-6 rounded-lg border border-[rgb(var(--border-primary))] shadow-sm transition-transform duration-300 pointer-events-auto">
                <div className="flex items-center gap-4 mb-4"><div className="bg-red-100 p-3 rounded-full flex-shrink-0"><Icon name="bolt" className="text-red-600" /></div><h3 className="text-xl font-semibold text-[rgb(var(--text-secondary))]">EEW</h3></div>
                <div ref={tourRefs.step5}><div className="grid grid-cols-2 gap-2 text-center"><button onClick={() => handleEewSourceClick('jma')} onMouseEnter={() => { setIsHoveringLink(true); }} onMouseLeave={() => setIsHoveringLink(false)} className="text-sm bg-red-500/10 text-red-700 font-semibold py-2 px-2 rounded-md hover:bg-red-500/20 transition-colors">日本(JMA)</button><button onClick={() => handleEewSourceClick('sc')} onMouseEnter={() => { setIsHoveringLink(true); }} onMouseLeave={() => setIsHoveringLink(false)} className="text-sm bg-blue-500/10 text-blue-700 font-semibold py-2 px-2 rounded-md hover:bg-blue-500/20 transition-colors">四川</button><button onClick={() => handleEewSourceClick('cenc')} onMouseEnter={() => { setIsHoveringLink(true); }} onMouseLeave={() => setIsHoveringLink(false)} className="text-sm bg-green-500/10 text-green-700 font-semibold py-2 px-2 rounded-md hover:bg-green-500/20 transition-colors">中国(CENC)</button><button onClick={() => handleEewSourceClick('fj')} onMouseEnter={() => { setIsHoveringLink(true); }} onMouseLeave={() => setIsHoveringLink(false)} className="text-sm bg-amber-500/10 text-amber-700 font-semibold py-2 px-2 rounded-md hover:bg-amber-500/20 transition-colors">福建</button></div></div>
              </div>
              <div className="bg-[rgb(var(--background-card))] p-6 rounded-lg border border-[rgb(var(--border-primary))] shadow-sm transition-transform hover:scale-105 duration-300 pointer-events-auto" onClick={handleDesignCardClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleDesignCardClick()} onMouseEnter={() => { setIsHoveringLink(true); }} onMouseLeave={() => setIsHoveringLink(false)}>
                <div className="flex items-center gap-4"><div className={`p-3 rounded-full flex-shrink-0 transition-colors duration-300 ${designColors[designColorIndex].bg}`}><Icon name="design_services" className={`transition-colors duration-300 ${designColors[designColorIndex].text}`} /></div><h3 className="text-xl font-semibold text-[rgb(var(--text-secondary))]">设计</h3></div>
                <p className="mt-4 text-[rgb(var(--text-tertiary))]">热爱简洁、明快的设计风格，相信“少即是多”。</p>
              </div>
            </div>
          </div>
        </section>

        <section ref={timelineRef} id="timeline" className="h-screen w-full snap-start flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="relative w-full max-w-4xl text-center pointer-events-auto z-30"><h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-16 text-[rgb(var(--text-secondary))]" data-obstacle="true" data-id="timeline-title">编程之旅</h2><div ref={tourRefs.step6} className="relative w-full max-w-3xl mx-auto pointer-events-auto" data-obstacle="true" data-id="timeline-cards"><div className="absolute left-4 md:left-1/2 top-2 h-full w-0.5 bg-slate-300 -translate-x-1/2" />{timelineData.map((item, index) => (<div key={index} className={`relative flex items-center mb-12 ${index % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-row'}`} onMouseEnter={() => { setHoveredTimelineColor(item.hex); unlockAchievement('time_traveler'); }} onMouseLeave={() => setHoveredTimelineColor(null)}><div className={`w-full md:w-5/12 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}><div className="bg-[rgb(var(--background-card))] p-5 rounded-lg border border-[rgb(var(--border-primary))] shadow-sm ml-12 md:ml-0"><h3 className="font-bold text-lg text-[rgb(var(--text-secondary))]">{item.year}</h3><p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">{item.text}</p></div></div><div className="absolute left-4 md:left-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full -translate-x-1/2 ring-4 ring-white"><div className={`w-full h-full rounded-full ${item.color}`} /></div></div>))}</div></div>
        </section>
        
        <section ref={contactRef} id="contact" className="h-screen w-full snap-start flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="relative w-full max-w-4xl text-center pointer-events-auto z-30">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-8 text-[rgb(var(--text-secondary))]" data-obstacle="true" data-id="contact-title">联系我</h2>
            <div ref={contactLinksRef} className="flex justify-center items-center gap-8 pointer-events-auto" data-obstacle="true" data-id="contact-links">
              <a href="mailto:albert.tang_1a@hotmail.com" className="group" onMouseEnter={() => { setIsHoveringLink(true); }} onMouseLeave={() => setIsHoveringLink(false)}><div className="flex flex-col items-center gap-2"><Icon name="mail" className="text-4xl text-[rgb(var(--text-quaternary))] group-hover:text-[rgb(var(--text-link-hover))] transition-colors" /><span className="text-[rgb(var(--text-tertiary))] group-hover:text-[rgb(var(--text-link-hover))] transition-colors">邮箱</span><p className="text-sm text-[rgb(var(--text-quaternary))] mt-1">albert.tang_1a@hotmail.com</p></div></a>
              <a href="https://github.com/albertjiayou0423" target="_blank" rel="noopener noreferrer" className="group" onMouseEnter={() => { setIsHoveringLink(true); }} onMouseLeave={() => setIsHoveringLink(false)}><div className="flex flex-col items-center gap-2"><Icon name="github-original" provider="devicon" className="text-4xl text-[rgb(var(--text-quaternary))] group-hover:text-[rgb(var(--text-link-gh-hover))] transition-colors" /><span className="text-[rgb(var(--text-tertiary))] group-hover:text-[rgb(var(--text-link-gh-hover))] transition-colors">GitHub</span><p className="text-sm text-[rgb(var(--text-quaternary))] mt-1">albertjiayou0423</p></div></a>
            </div>
            <StatsDashboard stats={stats} achievementsUnlocked={achievements.filter(a => a.unlocked).length} totalAchievements={achievements.length} />
          </div>
        </section>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto"><div className="absolute inset-0 bg-black/50 animate-fadeIn" onClick={() => { setIsModalOpen(false); }}></div><div className="relative bg-[rgb(var(--background-card))] rounded-lg shadow-xl w-full max-w-md text-left overflow-hidden animate-scaleUp"><div className="bg-blue-500 text-white p-4 flex justify-between items-center"><div className="flex items-center gap-3"><Icon name="bolt" /> <h3 className="text-lg font-semibold">最新地震速报 ({earthquakeData?.source || ''})</h3></div></div><div className="p-6">{isLoading && <p className="text-[rgb(var(--text-tertiary))]">加载中...</p>}{error && <p className="text-[rgb(var(--text-tertiary))]">{error}</p>}{earthquakeData && (<div><div className="grid grid-cols-2 gap-4 mb-6 text-center"><div><p className="text-sm text-[rgb(var(--text-quaternary))]">{earthquakeData.intensityLabel || '最大烈度'}</p><p className="text-5xl font-bold text-[rgb(var(--text-primary))]">{earthquakeData.maxInt || 'N/A'}</p></div><div><p className="text-sm text-[rgb(var(--text-quaternary))]">震级</p><p className="text-5xl font-bold text-[rgb(var(--text-primary))]">{earthquakeData.magnitude ? `M${earthquakeData.magnitude}` : 'N/A'}</p></div></div><ul className="space-y-2 text-sm text-[rgb(var(--text-secondary))] border-t border-[rgb(var(--border-primary))] pt-4"><li><strong>震源地:</strong> {earthquakeData.hypocenter}</li>{earthquakeData.depth !== 'N/A' && <li><strong>深度:</strong> {earthquakeData.depth}</li>}<li><strong>发生时间:</strong> {earthquakeData.originTime}</li><li><strong>发布时间:</strong> {earthquakeData.reportTime}</li>{earthquakeData.tsunamiInfo && <li><strong>海啸情报:</strong> {earthquakeData.tsunamiInfo}</li>}{typeof earthquakeData.isFinal === 'boolean' && <li><strong>最终报:</strong> {earthquakeData.isFinal ? '是' : '否'}</li>}{typeof earthquakeData.isCancel === 'boolean' && <li className="font-bold text-red-500"><strong>取消报:</strong> {earthquakeData.isCancel ? '是' : '否'}</li>}<li className="text-xs text-[rgb(var(--text-quaternary))] pt-2">Event ID: {earthquakeData.eventId}</li></ul></div>)}</div><div className="px-6 pb-6 text-right"><button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2" onClick={() => { setIsModalOpen(false); }} onMouseEnter={() => { setIsHoveringLink(true); }} onMouseLeave={() => setIsHoveringLink(false)}>关闭</button></div></div></div>
        )}
      </div>
    </main>
  );
}
