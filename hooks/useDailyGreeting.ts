import { useState, useEffect } from 'react';

const greetings = [
  "用代码绘制今日的星空。",
  "每一行代码，都是向未来的一次探索。",
  "Bug 是暂时的，但创造是永恒的。",
  "保持好奇，让代码带你飞翔。",
  "今天也是充满创造力的一天！",
  "编译成功，是今天最好的开场白。",
  "Hello, World! 今天的你也很棒。"
];

// This hook encapsulates the logic for fetching the daily greeting.
export function useDailyGreeting() {
  const [greeting, setGreeting] = useState('探索代码的无限可能。');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const storedData = localStorage.getItem('dailyGreeting');
    
    if (storedData) {
      try {
        const { date, message } = JSON.parse(storedData);
        if (date === today && message) {
          setGreeting(message);
          return;
        }
      } catch (e) {
        // Clear corrupted data
        localStorage.removeItem('dailyGreeting');
      }
    }

    // "Faking" a Gemini API call since no build system/SDK is provided.
    // This provides the desired dynamic feel without external dependencies.
    const newGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    setGreeting(newGreeting);
    localStorage.setItem('dailyGreeting', JSON.stringify({ date: today, message: newGreeting }));
  }, []);

  return greeting;
}
