

import { useState, useEffect, useCallback, useRef } from 'react';

// --- NEW: Using real, lightweight, base64 encoded audio files ---
const sounds = {
  click: "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAEBAPw==",
  pop: "data:audio/wav;base64,UklGRlAAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhSAAAAEBA/v8/gD+APwA/AD8APwA/AD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+APwA/AD8APwA/gD8AP4A/Pz8/Pz8/v7+/gICAgAEBAQ==",
  whoosh: "data:audio/wav;base64,UklGRmAAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhSAAAAABAAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0w=",
  hum: "data:audio/wav;base64,UklGRlwAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhVAAAAEhJSktMTU5PUFFSU1RVVldYWVpbXF1eX2BhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX5/gIGCg4SFhoeIiYqLjA==",
  open: "data:audio/wav;base64,UklGRlAAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhSAAAAAABAQICAwMEBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCQ0RFRg==",
  generate: "data:audio/wav;base64,UklGRkIAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhPgAAAElOU1ZcaW1vcXV5dnp8foCEhYeJjI2PkpOUlpianJ2en6Gio6Soq62wtLi8vb/DxMnLzM3P0NHS1NXW19na3N7g4uXm6g==",
  hover: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAEBA/v8/",
};

// --- Reworked sound management ---
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

const loopingNodes: { [key: string]: { source: AudioBufferSourceNode, gain: GainNode } } = {};
// --- NEW: Define which sounds should have pitch variation ---
const variablePitchSounds = ['click', 'pop', 'whoosh', 'hover'];


// --- FIX: Helper to decode base64 without fetch to avoid network errors ---
const base64ToArrayBuffer = (base64: string) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

// --- MODIFIED: playOneShot now accepts soundName for pitch variation ---
const playOneShot = (buffer: AudioBuffer, isMuted: boolean, soundName: string) => {
  if (isMuted || audioContext.state === 'suspended') return;
  const source = audioContext.createBufferSource();
  source.buffer = buffer;

  // --- NEW: Add pitch variation to certain sounds to make them less monotonous ---
  if (variablePitchSounds.includes(soundName)) {
    const pitchVariation = 0.15; // Results in playbackRate between 0.85 and 1.15
    source.playbackRate.value = 1 + (Math.random() - 0.5) * 2 * pitchVariation;
  }

  source.connect(audioContext.destination);
  source.start();
};

const playLoop = (soundName: string, buffer: AudioBuffer, isMuted: boolean, volume: number = 0.5) => {
  if (isMuted || loopingNodes[soundName] || audioContext.state === 'suspended') return;
  
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0, audioContext.currentTime);
  gain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.1);

  source.connect(gain);
  gain.connect(audioContext.destination);
  source.start();
  
  loopingNodes[soundName] = { source, gain };
};

const stopLoop = (soundName: string) => {
  if (loopingNodes[soundName]) {
    const { source, gain } = loopingNodes[soundName];
    gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
    source.stop(audioContext.currentTime + 0.1);
    delete loopingNodes[soundName];
  }
};


export function useSound() {
  const [isMuted, setIsMuted] = useState(false);
  const audioBuffers = useRef<Record<string, AudioBuffer>>({});
  const lastHoverTime = useRef(0);

  useEffect(() => {
    // Decode all audio files on mount
    Object.entries(sounds).forEach(([name, dataUri]) => {
      try {
        const base64String = dataUri.split(',')[1];
        if (!base64String) {
            console.error(`Invalid data URI for sound: ${name}`);
            return;
        }
        const arrayBuffer = base64ToArrayBuffer(base64String);
        
        audioContext.decodeAudioData(arrayBuffer)
          .then(decodedBuffer => {
            audioBuffers.current[name] = decodedBuffer;
          })
          .catch(err => console.error(`Error decoding audio data for ${name}:`, err));
      } catch (error) {
        console.error(`Error processing data URI for ${name}:`, error);
      }
    });

    // Handle browser's autoplay policy
    const resumeContext = () => {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      window.removeEventListener('click', resumeContext);
      window.removeEventListener('keydown', resumeContext);
    };
    window.addEventListener('click', resumeContext);
    window.addEventListener('keydown', resumeContext);

    return () => {
        window.removeEventListener('click', resumeContext);
        window.removeEventListener('keydown', resumeContext);
        Object.keys(loopingNodes).forEach(stopLoop);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
        if (!prev) { // if turning mute on
            Object.keys(loopingNodes).forEach(stopLoop);
        }
        return !prev;
    });
  }, []);

  const playSound = useCallback((soundName: 'click' | 'pop' | 'whoosh' | 'hum' | 'open' | 'generate' | 'hover', options?: { loop?: boolean }) => {
    if (soundName === 'hover') {
        const now = Date.now();
        if (now - lastHoverTime.current < 75) return; // 75ms cooldown
        lastHoverTime.current = now;
    }
    
    const buffer = audioBuffers.current[soundName];
    if (!buffer) return;

    if (options?.loop) {
      // Lower volume for the looping 'hum' sound to be more subtle.
      const volume = soundName === 'hum' ? 0.2 : 0.5;
      playLoop(soundName, buffer, isMuted, volume);
    } else {
      // --- MODIFIED: Pass soundName to playOneShot for potential pitch variation ---
      playOneShot(buffer, isMuted, soundName);
    }
  }, [isMuted]);
  
  const stopSound = useCallback((soundName: 'hum') => {
    stopLoop(soundName);
  }, []);

  return { isMuted, toggleMute, playSound, stopSound };
}