import React from 'react';
import { Icon } from './Icons';

interface Stats {
    timeOnSite: number;
    shapesCreated: number;
}

interface StatsDashboardProps {
    stats: Stats;
    achievementsUnlocked: number;
    totalAchievements: number;
}

const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
};

const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats, achievementsUnlocked, totalAchievements }) => {
    return (
        <div 
            className="mt-12 w-full max-w-2xl mx-auto p-4 bg-[rgb(var(--background-card))] rounded-lg border border-[rgb(var(--border-primary))] shadow-sm pointer-events-auto"
            data-obstacle="true" data-id="stats-dashboard"
        >
            <h3 className="text-sm font-semibold text-center text-[rgb(var(--text-quaternary))] mb-4 tracking-wider">你的探索之旅</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center">
                    <Icon name="schedule" className="mb-1 text-sky-500 !text-2xl" />
                    <span className="text-xl font-bold text-[rgb(var(--text-secondary))]">{formatTime(stats.timeOnSite)}</span>
                    <span className="text-xs text-[rgb(var(--text-tertiary))]">探索时长</span>
                </div>
                <div className="flex flex-col items-center">
                    <Icon name="auto_awesome" className="mb-1 text-violet-500 !text-2xl" />
                    <span className="text-xl font-bold text-[rgb(var(--text-secondary))]">{stats.shapesCreated}</span>
                    <span className="text-xs text-[rgb(var(--text-tertiary))]">创造形状</span>
                </div>
                <div className="flex flex-col items-center">
                    <Icon name="emoji_events" className="mb-1 text-amber-500 !text-2xl" />
                    <span className="text-xl font-bold text-[rgb(var(--text-secondary))]">{achievementsUnlocked} / {totalAchievements}</span>
                    <span className="text-xs text-[rgb(var(--text-tertiary))]">解锁成就</span>
                </div>
            </div>
        </div>
    );
};

export default StatsDashboard;
