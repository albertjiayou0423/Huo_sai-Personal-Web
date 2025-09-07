import React from 'react';

// FIX: Export IconProps to allow strong typing of icon elements.
export interface IconProps {
  className?: string;
}

export const CodeIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

export const ZapIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

export const DesignIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
  </svg>
);

export const MailIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

export const GithubIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.492.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.942.359.308.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
  </svg>
);

export const EarthquakeIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3l3-9 6 18 3-9h3" />
  </svg>
);

export const PartyPopperIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.5L17.5 9H6.5L12 21.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9L11 6h2l-1 3z" />
        <path d="M15 6.5 a.5 .5 0 1 0 -1 0a.5 .5 0 1 0 1 0z" fill="currentColor"/>
        <path d="M9 6.5 a.5 .5 0 1 0 -1 0a.5 .5 0 1 0 1 0z" fill="currentColor"/>
        <path d="M12 4.5 a.5 .5 0 1 0 -1 0a.5 .5 0 1 0 1 0z" fill="currentColor"/>
    </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const PaletteIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
);

export const HelpIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 00-1.423-1.423L13.25 18.75l1.188-.648a2.25 2.25 0 001.423-1.423L16.25 15.5l.648 1.188a2.25 2.25 0 001.423 1.423l1.188.648-1.188.648a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

export const CircleArrowIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.182-3.182m0-4.991v4.99" />
  </svg>
);

export const MoveIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25a8.25 8.25 0 00-8.25 8.25c0 1.832.723 3.535 1.942 4.793l.288-.288A5.25 5.25 0 0112 7.5a5.25 5.25 0 015.02 4.017l.24.003a8.25 8.25 0 00-5.26-9.27z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 18.75a2.75 2.75 0 00-5.5 0" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 13.5a.75.75 0 00-1.5 0v2.25a.75.75 0 001.5 0v-2.25z" />
  </svg>
);

export const MouseClickIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25a8.25 8.25 0 00-8.25 8.25c0 1.832.723 3.535 1.942 4.793l.288-.288A5.25 5.25 0 0112 7.5a5.25 5.25 0 015.02 4.017l.24.003a8.25 8.25 0 00-5.26-9.27z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 13.5a.75.75 0 00-1.5 0v2.25a.75.75 0 001.5 0v-2.25z" />
  </svg>
);

export const MagnetIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8.25 21.75c.166 0 .33.003.493.008a6 6 0 0010.514-4.253C19.25 16.32 18.75 12 18.75 12S18 7.679 17.007 6.508a6 6 0 00-10.514 4.253C6.5 11.936 6 15.67 6 17.25c0 .331.003.662.008.988S6.082 21 6.25 21.75m1.992-1.258a6.002 6.002 0 008.016 0M12 2.25v4.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 2.25v3M15.75 2.25v3" />
  </svg>
);

export const ConstellationIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path d="M9 11.25a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z" fill="currentColor" />
        <path d="M15 5.25a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z" fill="currentColor" />
        <path d="M15 19.25a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z" fill="currentColor" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5.25L9 11.25l6 8" />
    </svg>
);

export const TimelineIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18" />
        <path d="M12 6.75a.75.75 0 100-1.5.75.75 0 000 1.5z" fill="currentColor" />
        <path d="M12 12.75a.75.75 0 100-1.5.75.75 0 000 1.5z" fill="currentColor" />
        <path d="M12 18.75a.75.75 0 100-1.5.75.75 0 000 1.5z" fill="currentColor" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 12h10" />
    </svg>
);

export const TrophyIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 011.05-4.333m-1.05 4.333c-2.435-.333-4.5-2.25-4.5-4.5V12c0-2.828 2.25-5.25 5.25-5.25h3.75c3 0 5.25 2.422 5.25 5.25v2.25c0 2.25-2.065 4.167-4.5 4.5m-1.05-4.333c.333 2.436 2.25 4.5 4.5 4.5h.75c.621 0 1.125-.504 1.125-1.125V12a9 9 0 00-9-9H9.375a9 9 0 00-9 9v.75c0 .621.504 1.125 1.125 1.125h.75c2.25 0 4.167-2.064 4.5-4.5m0 0v-2.25" />
  </svg>
);

// --- NEW: Camera Icon ---
export const CameraIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.211 2.211 0 016.827 6.175a2.211 2.211 0 012.211-2.211H12m0 0A2.211 2.211 0 0112 3.964a2.211 2.211 0 01-2.211 2.211m2.211-2.211v1.513M12 12a3.316 3.316 0 01-3.316-3.316 3.316 3.316 0 013.316-3.316 3.316 3.316 0 013.316 3.316 3.316 3.316 0 01-3.316 3.316m-4.576 0a4.576 4.576 0 00-4.576 4.576V18m4.576-4.576a4.576 4.576 0 014.576-4.576m0 0a4.576 4.576 0 014.576 4.576m-4.576 4.576V18" />
  </svg>
);