import React, { useState, useEffect, useMemo } from 'react';

interface TourRefsType {
    [key: string]: React.RefObject<HTMLElement>;
}

interface GuidedTourProps {
    tourRefs: TourRefsType;
    onClose: () => void;
    scrollToSection: (sectionId: string) => void;
}

const tourSteps = [
    {
        refKey: 'step1',
        section: 'home',
        title: '欢迎！',
        text: '这里是我的交互式个人网站。让我们花一分钟快速了解一下这里的隐藏功能吧！',
        position: 'bottom',
    },
    {
        refKey: 'step2',
        section: 'home',
        title: '手势创造：画个圈',
        text: '网站的背景是可以互动的。试着在屏幕的空白区域按住鼠标左键并画一个完整的圆圈，看看会发生什么？',
        position: 'bottom',
    },
    {
        refKey: 'center',
        section: 'home',
        title: '力场交互：推',
        text: '很棒！现在，试着按住鼠标左键。你会产生一个排斥力场，将周围的形状推开。',
        position: 'center',
    },
    {
        refKey: 'center',
        section: 'home',
        title: '力场交互：吸',
        text: '想把它们吸过来？也很简单！按住 Shift 键的同时，再按住鼠标左键，就可以产生一个引力场。',
        position: 'center',
    },
    {
        refKey: 'step3',
        section: 'home',
        title: '个性化主题',
        text: '点击右上角的调色盘，可以自由切换网站的背景主题，甚至可以自定义你最喜欢的颜色。',
        position: 'bottom-right',
    },
    {
        refKey: 'aboutTitleRef',
        section: 'about',
        title: '关于我',
        text: '现在我们来到的“关于我”区域。这里有更多可以互动的地方。',
        position: 'bottom',
    },
    {
        refKey: 'step4',
        section: 'about',
        title: '可互动的卡片',
        text: '网站上的很多元素都可以点击互动。比如这里的“编程”和“设计”卡片，点击它们有惊喜哦！',
        position: 'top',
    },
    {
        refKey: 'step5',
        section: 'about',
        title: '地震速报 (EEW)',
        text: '我对防灾减灾很感兴趣。你可以在这里查询不同地区的最新地震速报信息。',
        position: 'right',
    },
    {
        refKey: 'step6',
        section: 'timeline',
        title: '我的编程之旅',
        text: '这是我的编程学习之旅。将鼠标悬停在任意时间点上，背景也会随之变化。',
        position: 'top',
    },
    {
        refKey: 'step7',
        section: 'timeline',
        title: '解锁成就',
        text: '你的每一次探索都会被记录。点击左下角的奖杯图标，可以查看你已经解锁了哪些隐藏成就。',
        position: 'top-left',
    },
    {
        refKey: 'step8',
        section: 'timeline',
        title: '定格艺术',
        text: '觉得当前动态的画面很美？可以点击相机图标，将它作为独特的艺术品截图保存下来。',
        position: 'top-left',
    },
    {
        refKey: 'contactLinksRef',
        section: 'contact',
        title: '保持联系',
        text: '欢迎通过邮件或 GitHub 与我联系，期待与你交流！',
        position: 'top',
    },
    {
        refKey: 'center',
        section: 'contact',
        title: '探索愉快！',
        text: '你已经了解了所有基础功能。现在，自由地探索吧！祝你玩得开心～',
        position: 'center',
    }
];

const GuidedTour: React.FC<GuidedTourProps> = ({ tourRefs, onClose, scrollToSection }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [style, setStyle] = useState({});
    const [tooltipStyle, setTooltipStyle] = useState({});

    const currentStep = useMemo(() => tourSteps[stepIndex], [stepIndex]);
    const isLastStep = stepIndex === tourSteps.length - 1;

    useEffect(() => {
        const updatePosition = () => {
            if (currentStep.refKey === 'center') {
                setStyle({
                    width: '0px',
                    height: '0px',
                    top: '50%',
                    left: '50%',
                    boxShadow: '0 0 0 9999px rgba(18, 24, 41, 0.7)',
                    borderRadius: '50%'
                });
                setTooltipStyle({
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                });
                return;
            }

            const element = tourRefs[currentStep.refKey]?.current;
            if (element) {
                const rect = element.getBoundingClientRect();
                const padding = 10;
                setStyle({
                    width: `${rect.width + padding * 2}px`,
                    height: `${rect.height + padding * 2}px`,
                    top: `${rect.top - padding}px`,
                    left: `${rect.left - padding}px`,
                });

                let ttStyle: React.CSSProperties = {};
                switch(currentStep.position) {
                    case 'bottom':
                        ttStyle = { top: `${rect.bottom + 15}px`, left: `${rect.left + rect.width / 2}px`, transform: 'translateX(-50%)' };
                        break;
                    case 'bottom-right':
                        ttStyle = { top: `${rect.bottom + 15}px`, right: `${window.innerWidth - rect.right}px`};
                        break;
                    case 'top':
                         ttStyle = { bottom: `${window.innerHeight - rect.top + 15}px`, left: `${rect.left + rect.width / 2}px`, transform: 'translateX(-50%)' };
                        break;
                    case 'right':
                        ttStyle = { left: `${rect.right + 15}px`, top: `${rect.top + rect.height / 2}px`, transform: 'translateY(-50%)' };
                        break;
                    case 'top-left':
                        ttStyle = { bottom: `${window.innerHeight - rect.top + 15}px`, left: `${rect.left}px`};
                        break;
                    default:
                        ttStyle = { top: `${rect.bottom + 15}px`, left: `${rect.left}px` };
                }
                setTooltipStyle(ttStyle);
            }
        };

        const timer = setTimeout(updatePosition, 50); // Small delay to ensure element is in place
        window.addEventListener('resize', updatePosition);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updatePosition);
        };

    }, [stepIndex, currentStep, tourRefs]);
    
    const handleNext = () => {
        if (isLastStep) {
            onClose();
            return;
        }

        const nextStepIndex = stepIndex + 1;
        const currentSection = tourSteps[stepIndex].section;
        const nextSection = tourSteps[nextStepIndex].section;

        if (currentSection !== nextSection) {
            scrollToSection(nextSection);
            // Wait for scroll to complete before showing next step
            setTimeout(() => {
                setStepIndex(nextStepIndex);
            }, 800);
        } else {
            setStepIndex(nextStepIndex);
        }
    };
    
    const handleSkip = () => {
        onClose();
    };

    return (
        // FIX: Add pointer-events-none to the root container to allow clicks to pass through
        <div className="fixed inset-0 z-[999] animate-fadeIn pointer-events-none">
            <div className="tour-highlight" style={style}></div>
            <div className="tour-tooltip animate-scaleUp" style={tooltipStyle}>
                <h3 className="text-lg font-bold mb-2 text-[rgb(var(--text-secondary))]">{currentStep.title}</h3>
                <p className="text-sm text-[rgb(var(--text-tertiary))] mb-4">{currentStep.text}</p>
                <div className="flex justify-between items-center">
                    <button onClick={handleSkip} className="text-xs text-[rgb(var(--text-quaternary))] hover:text-[rgb(var(--text-secondary))]">
                        跳过
                    </button>
                    <button onClick={handleNext} className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-md hover:bg-blue-600 transition-colors">
                        {isLastStep ? '完成！' : '下一步'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GuidedTour;