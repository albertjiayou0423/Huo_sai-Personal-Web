import React, { useState, useMemo } from 'react';
import { Icon, IconProps } from './Icons';
import AchievementNode from './AchievementNode';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactElement<IconProps>;
  unlocked: boolean;
  parent?: string | null;
}

interface AchievementsModalProps {
  achievements: Achievement[];
  onClose: () => void;
}

// --- NEW: Type for the tree node structure ---
export interface AchievementNodeData extends Achievement {
    children: AchievementNodeData[];
}

const AchievementsModal: React.FC<AchievementsModalProps> = ({ achievements, onClose }) => {
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  // --- NEW: Memoized function to build the tree structure ---
  const achievementTree = useMemo(() => {
    const map = new Map<string, AchievementNodeData>();
    const roots: AchievementNodeData[] = [];

    achievements.forEach(ach => {
      map.set(ach.id, { ...ach, children: [] });
    });

    achievements.forEach(ach => {
      if (ach.parent && map.has(ach.parent)) {
        const parentNode = map.get(ach.parent);
        const currentNode = map.get(ach.id);
        if (parentNode && currentNode) {
            parentNode.children.push(currentNode);
        }
      } else {
        const rootNode = map.get(ach.id);
        if(rootNode) roots.push(rootNode);
      }
    });
    return roots;
  }, [achievements]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-auto">
      <div className="absolute inset-0 bg-black/40 animate-fadeIn" onClick={onClose}></div>
      <div className="relative flex flex-col w-full max-w-4xl max-h-[80vh] bg-[rgb(var(--background-card))] p-6 sm:p-8 rounded-lg border border-[rgb(var(--border-primary))] shadow-lg text-left animate-scaleUp">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[rgb(var(--text-quaternary))] hover:text-[rgb(var(--text-tertiary))] transition-colors z-20"
          aria-label="关闭"
        >
          <Icon name="close" />
        </button>
        <div className="flex justify-between items-center mb-6 z-10">
            <div className="text-center flex-1">
                <h2 className="text-2xl font-bold tracking-tight text-[rgb(var(--text-secondary))]">成就</h2>
                <p className="text-md text-[rgb(var(--text-tertiary))]">已解锁: {unlockedCount} / {totalCount}</p>
            </div>
            <div className="absolute top-6 left-6 flex items-center bg-slate-100 rounded-lg p-1">
                <button onClick={() => setViewMode('list')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow' : 'text-slate-500 hover:bg-slate-200'}`}><Icon name="list" className="!text-lg" /></button>
                <button onClick={() => setViewMode('tree')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'tree' ? 'bg-white shadow' : 'text-slate-500 hover:bg-slate-200'}`}><Icon name="account_tree" className="!text-lg" /></button>
            </div>
        </div>
        
        <div className="overflow-y-auto pr-2">
            {viewMode === 'list' && (
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
                            <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full text-3xl ${
                                achievement.unlocked ? 'bg-amber-400/20 text-amber-500' : 'bg-slate-500/20 text-slate-500'
                            }`}>
                                {achievement.unlocked ? React.cloneElement(achievement.icon) : <Icon name="help" />}
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
            )}
            {viewMode === 'tree' && (
                <div className="achievement-tree">
                    <ul>
                        {achievementTree.map(node => (
                            <AchievementNode key={node.id} node={node} />
                        ))}
                    </ul>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AchievementsModal;