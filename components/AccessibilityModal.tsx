import React from 'react';
import { Icon } from './Icons';

interface AccessibilitySettings {
    reduceMotion: boolean;
    disableIdle: boolean;
    highContrast: boolean;
    hideShapes: boolean;
    largeCursor: boolean;
    largeText: boolean;
    disableFlashes: boolean;
}

interface AccessibilityModalProps {
    settings: AccessibilitySettings;
    onSettingsChange: (newSettings: AccessibilitySettings) => void;
    onClose: () => void;
}

const AccessibilityModal: React.FC<AccessibilityModalProps> = ({ settings, onSettingsChange, onClose }) => {

    const handleToggle = (key: keyof AccessibilitySettings) => {
        onSettingsChange({ ...settings, [key]: !settings[key] });
    };

    const options: {key: keyof AccessibilitySettings, title: string, description: string}[] = [
        { key: 'highContrast', title: '高对比度模式', description: '切换至黑底白字主题，提升可读性。' },
        { key: 'hideShapes', title: '隐藏背景形状', description: '移除背景中的所有动态形状。' },
        { key: 'reduceMotion', title: '减少动态效果', description: '停止背景中所有形状的动画。' },
        { key: 'largeCursor', title: '更大光标', description: '将自定义的鼠标光标尺寸放大。' },
        { key: 'largeText', title: '更大字体', description: '一键增大整个网站的文本字号。' },
        { key: 'disableFlashes', title: '禁用闪烁效果', description: '禁用所有可能引起不适的闪烁动画。' },
        { key: 'disableIdle', title: '禁用静置效果', description: '禁用鼠标静置2分钟后形状聚集的效果。' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto">
            <div className="absolute inset-0 bg-black/50 animate-fadeIn" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl bg-[rgb(var(--background-card))] p-6 sm:p-8 rounded-lg border border-[rgb(var(--border-primary))] shadow-lg text-left animate-scaleUp">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[rgb(var(--text-quaternary))] hover:text-[rgb(var(--text-tertiary))] transition-colors z-10"
                    aria-label="关闭"
                >
                    <Icon name="close" />
                </button>
                <div className="flex items-center gap-3 mb-6">
                    <Icon name="accessibility_new" className="text-2xl text-blue-500" />
                    <h2 className="text-2xl font-bold tracking-tight text-[rgb(var(--text-secondary))]">无障碍设定</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {options.map(({ key, title, description }) => (
                         <label key={key} htmlFor={key} className="flex items-center justify-between cursor-pointer py-2">
                            <div>
                                <p className="font-semibold text-[rgb(var(--text-secondary))]">{title}</p>
                                <p className="text-sm text-[rgb(var(--text-tertiary))]">{description}</p>
                            </div>
                            <div className="relative flex-shrink-0 ml-4">
                                <input id={key} type="checkbox" className="sr-only" checked={settings[key]} onChange={() => handleToggle(key)} />
                                <div className={`block w-14 h-8 rounded-full transition ${settings[key] ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${settings[key] ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </label>
                    ))}
                </div>
                <p className="text-xs text-[rgb(var(--text-quaternary))] mt-6 text-center">
                    你的偏好设置会自动保存在本地浏览器中。
                </p>
            </div>
        </div>
    );
};

export default AccessibilityModal;