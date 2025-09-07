import React from 'react';
// FIX: Import IconProps to use for strong typing.
import { HelpIcon, IconProps } from './Icons'; // For locked achievements

export interface Achievement {
  id: string;
  title: string;
  description: string;
  // FIX: Specify the props type for the icon to fix cloneElement error.
  icon: React.ReactElement<IconProps>;
  unlocked: boolean;
}

interface AchievementsModalProps {
  achievements: Achievement[];
  onClose: () => void;
}

const AchievementsModal: React.FC<AchievementsModalProps> = ({ achievements, onClose }) => {
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-auto">
      <div className="absolute inset-0 bg-black/40 animate-fadeIn" onClick={onClose}></div>
      <div className="relative flex flex-col w-full max-w-4xl max-h-[80vh] bg-[rgb(var(--background-card))] p-6 sm:p-8 rounded-lg border border-[rgb(var(--border-primary))] shadow-lg text-left animate-scaleUp">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[rgb(var(--text-quaternary))] hover:text-[rgb(var(--text-tertiary))] transition-colors z-10"
          aria-label="关闭"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-[rgb(var(--text-secondary))]">成就列表</h2>
            <p className="text-md text-[rgb(var(--text-tertiary))]">已解锁: {unlockedCount} / {totalCount}</p>
        </div>
        <div className="overflow-y-auto pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                    <div
                        key={achievement.id}
                        className={`p-4 rounded-lg flex items-center gap-4 transition-all duration-300 ${
                            achievement.unlocked
                            ? 'bg-amber-400/10 backdrop-blur-sm'
                            : 'bg-slate-400/10'
                        }`}
                    >
                        <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full ${
                            achievement.unlocked ? 'bg-amber-400/20 text-amber-500' : 'bg-slate-500/20 text-slate-500'
                        }`}>
                            {achievement.unlocked ? React.cloneElement(achievement.icon, { className: "w-7 h-7" }) : <HelpIcon className="w-7 h-7" />}
                        </div>
                        <div className="flex-1">
                            <h3 className={`font-semibold ${achievement.unlocked ? 'text-[rgb(var(--text-secondary))]' : 'text-[rgb(var(--text-quaternary))]'}`}>
                                {achievement.unlocked ? achievement.title : '???'}
                            </h3>
                            <p className={`text-sm ${achievement.unlocked ? 'text-[rgb(var(--text-tertiary))]' : 'text-[rgb(var(--text-quaternary))]'}`}>
                                {achievement.unlocked ? achievement.description : '保持探索...'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementsModal;