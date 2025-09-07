import React from 'react';
import { IconProps } from './Icons';

interface AchievementToastProps {
  // FIX: Use a more specific type for the icon to allow cloning with props.
  icon: React.ReactElement<IconProps>;
  title: string;
}

const AchievementToast: React.FC<AchievementToastProps> = ({ icon, title }) => {
  return (
    <div className="fixed bottom-24 right-5 z-[60] w-full max-w-sm bg-[rgb(var(--background-card))] backdrop-blur-md rounded-lg shadow-2xl pointer-events-auto ring-1 ring-amber-400/30 overflow-hidden animate-toast-in-br">
      <div className="p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 text-amber-400">
            {/* FIX: Clone the element here with the correct class name. */}
            {React.cloneElement(icon, { className: 'w-8 h-8' })}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-semibold text-amber-500">成就已解锁!</p>
            <p className="mt-1 text-md font-semibold text-[rgb(var(--text-primary))]">{title}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementToast;