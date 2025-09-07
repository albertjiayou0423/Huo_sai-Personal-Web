import React from 'react';

interface IconProps {
  className?: string;
}

export const CodeIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

export const ZapIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

export const DesignIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
  </svg>
);

export const MailIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

export const GithubIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19c-4.3 1.4 -4.3-2.5 -6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 00-1.3-3.2 4.2 4.2 0 00-.1-3.2s-1-.3-3.3 1.3a12 12 0 00-6 0c-2.3-1.6-3.3-1.3-3.3-1.3a4.2 4.2 0 00-.1 3.2A4.6 4.6 0 002 9.5c0 4.6 2.7 5.7 5.5 6-.6.5-.5 1.4-.5 2V21" />
  </svg>
);

export const EarthquakeIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3l3-9 6 18 3-9h3" />
  </svg>
);

export const PaletteIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
);

export const HelpIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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