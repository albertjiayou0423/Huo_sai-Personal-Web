import React from 'react';

// REFACTORED: Create a single, reusable Icon component
export interface IconProps {
  name: string; // The name of the icon (e.g., 'code', 'palette')
  provider?: 'material' | 'devicon'; // The icon library to use
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, provider = 'material', className = '' }) => {
  if (provider === 'devicon') {
    // Devicon uses the 'devicon-' prefix
    return <i className={`devicon-${name} ${className}`}></i>;
  }

  // Default to Material Symbols
  return (
    <span className={`material-symbols-outlined ${className}`}>
      {name}
    </span>
  );
};
