
import { useState, useEffect, useCallback, useRef } from 'react';

// Using a tiny, valid, silent MP3 file for maximum browser compatibility.
const silentMp3 = "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSUNSAAAAAAASAAAAlabelTextQwAAAAESAAAAAZYNztJb4pY0K+gr60r6axvBAnKRdJ3r+8lU7M5d4qL2U2Yxr8+yD60bCHNZNItkTNMXMpfprrF4soJv41a+Y1WLatxO3XELsZTMao2fviFz8aEu3f_";

// Only the looping sound needs a persistent audio element.
const humSound = new Audio(silentMp3);
humSound.loop = true;

// A map to hold the audio sources for one-shot sounds.
const oneShotSources: { [key: string]: string } = {
  click: silentMp3,
  pop: silentMp3,
  whoosh: silentMp3,
};

export function useSound() {
  const [isMuted, setIsMuted] = useState(false);
  
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  useEffect(() => {
    humSound.muted = isMuted;
    if (isMuted) {
      humSound.pause();
    }
  }, [isMuted]);

  const playSound = useCallback((soundName: 'click' | 'pop' | 'whoosh' | 'hum', options?: { loop?: boolean }) => {
    if (isMuted) return;

    if (soundName === 'hum') {
      // Play the persistent, looping hum sound
      humSound.play().catch(() => {}); // Silently catch any play errors
    } else {
      // For one-shot sounds, create a new Audio object on demand.
      // This is more robust than cloning and prevents many browser errors.
      const source = oneShotSources[soundName];
      if (source) {
        const audio = new Audio(source);
        audio.play().catch(() => {}); // Silently catch any play errors
      }
    }
  }, [isMuted]);
  
  const stopSound = useCallback((soundName: 'hum') => {
    if (soundName === 'hum') {
        humSound.pause();
        humSound.currentTime = 0;
    }
  }, []);

  return { isMuted, toggleMute, playSound, stopSound };
}
