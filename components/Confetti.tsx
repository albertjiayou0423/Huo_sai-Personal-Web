import React, { useEffect } from 'react';

interface ConfettiProps {
  onAnimationEnd: () => void;
}

const Confetti: React.FC<ConfettiProps> = ({ onAnimationEnd }) => {
  useEffect(() => {
    // Access the confetti function from the window object
    const canvasConfetti = (window as any).confetti;

    // If the library isn't loaded, exit gracefully
    if (!canvasConfetti) {
      console.error('canvas-confetti library is not loaded.');
      onAnimationEnd();
      return;
    }

    // Function to launch a burst of confetti from both sides
    const launchConfetti = () => {
      // Fire from left side
      canvasConfetti({
        particleCount: 50,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.6 },
        zIndex: 100, // Make sure it's on top
      });
      // Fire from right side
      canvasConfetti({
        particleCount: 50,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.6 },
        zIndex: 100,
      });
    };

    // Create a "shower" or "rain" effect by launching multiple bursts
    setTimeout(launchConfetti, 0);
    setTimeout(launchConfetti, 200);

    // Set a timer to call the onAnimationEnd callback after the animation is visually complete
    const timer = setTimeout(() => {
      onAnimationEnd();
    }, 2000); // Animation visually lasts for 2 seconds

    // Cleanup function to clear the timer if the component unmounts early
    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  // This component doesn't render any visible elements itself
  return null;
};

export default Confetti;