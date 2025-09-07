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
        text: '这里是我的交互式个人网站。让我们快速了解一下这里的隐藏功能吧！',
        position: 'bottom',
    },
    {
        refKey: 'step2',
        section: 'home',
        title: '手势创造',
        text: '试着在屏幕的空白区域按住鼠标画一个完整的圆圈，看看会发生什么？',
        position: 'bottom',
    },
    {
        refKey: 'step3',
        section: 'home',
        title: '个性化主题',
        text: '点击这里的调色盘，可以自由切换网站的背景主题，甚至可以自定义颜色。',
        position: 'bottom-right',
    },
    {
        refKey: 'step4',
        section: 'about',
        title: '互动卡片',
        text: '网站上的很多元素都可以点击互动，比如这里的“编程”卡片，点击它有惊喜哦！',
        position: 'top',
    },
    {
        refKey: 'step5',
        section: 'about',
        title: '地震速报',
        text: '对地震速报感兴趣？可以在这里查询不同地区的最新信息。',
        position: 'right',
    },
    {
        refKey: 'step6',
        section: 'timeline',
        title: '编程之旅',
        text: '这是我的编程学习之旅。将鼠标悬停在时间点上，背景也会随之变化哦。',
        position: 'top',
    },
    {
        refKey: 'step7',
        section: 'timeline',
        title: '发现成就',
        text: '网站中隐藏了许多成就，点击这里查看你已经解锁了哪些。',
        position: 'top-left',
    },
    {
        refKey: 'step8',
        section: 'timeline',
        title: '定格艺术',
        text: '觉得当前画面很美？可以点击这里，将它作为独特的艺术品保存下来。祝你玩得愉快！',
        position: 'top-left',
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
        <div className="fixed inset-0 z-[999] animate-fadeIn">
            <div className="tour-highlight" style={style}></div>
            <div className="tour-tooltip animate-scaleUp" style={tooltipStyle}>
                <h3 className="text-lg font-bold mb-2 text-[rgb(var(--text-secondary))]">{currentStep.title}</h3>
                <p className="text-sm text-[rgb(var(--text-tertiary))] mb-4">{currentStep.text}</p>
                <div className="flex justify-between items-center">
                    <button onClick={handleSkip} className="text-xs text-[rgb(var(--text-quaternary))] hover:text-[rgb(var(--text-secondary))]">
                        跳过
                    </button>
                    <button onClick={handleNext} className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-md hover:bg-blue-600 transition-colors">
                        {isLastStep ? '完成' : '下一步'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GuidedTour;