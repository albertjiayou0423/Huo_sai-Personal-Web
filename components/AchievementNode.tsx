import React from 'react';
import { AchievementNodeData } from './AchievementsModal';
import { Icon } from './Icons';

interface AchievementNodeProps {
  node: AchievementNodeData;
}

const AchievementNode: React.FC<AchievementNodeProps> = ({ node }) => {
  const isUnlocked = node.unlocked;

  return (
    <li>
      <div className={`p-3 rounded-lg flex flex-col items-center gap-2 transition-all duration-300 w-48 min-h-[120px] justify-center ${
        isUnlocked
          ? 'bg-amber-400/10 ring-1 ring-amber-400/20'
          : 'bg-slate-400/10 ring-1 ring-slate-400/20'
      }`}>
        <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-2xl ${
          isUnlocked ? 'bg-amber-400/20 text-amber-500' : 'bg-slate-500/20 text-slate-500'
        }`}>
          {isUnlocked ? React.cloneElement(node.icon) : <Icon name="help" />}
        </div>
        <div className="text-center">
          <h3 className={`font-semibold text-sm ${isUnlocked ? 'text-[rgb(var(--text-secondary))]' : 'text-[rgb(var(--text-quaternary))]'}`}>
            {isUnlocked ? node.title : '???'}
          </h3>
          <p className={`text-xs ${isUnlocked ? 'text-[rgb(var(--text-tertiary))]' : 'text-[rgb(var(--text-quaternary))]'}`}>
            {isUnlocked ? node.description : '保持探索...'}
          </p>
        </div>
      </div>
      {node.children && node.children.length > 0 && (
        <ul>
          {node.children.map(child => (
            <AchievementNode key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
};

export default AchievementNode;