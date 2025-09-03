import React, { useState, useEffect } from 'react';

const getProgrammersDay = (year: number) => {
  // In China, Programmer's Day is often celebrated on October 24th (1024).
  // Month is 0-indexed, so October is 9.
  return new Date(year, 9, 24);
};

const ProgrammerDayCountdown: React.FC = () => {
  const [targetDate, setTargetDate] = useState(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    let target = getProgrammersDay(currentYear);
    if (now > target) {
      target = getProgrammersDay(currentYear + 1);
    }
    return target;
  });
  
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0,
  });
  const [isToday, setIsToday] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      
      const programmersDayThisYear = getProgrammersDay(now.getFullYear());
      if (
        now.getDate() === programmersDayThisYear.getDate() &&
        now.getMonth() === programmersDayThisYear.getMonth()
      ) {
        setIsToday(true);
        if(timer) clearInterval(timer); // Stop the countdown
        return;
      }

      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        // Time is up, set target for next year
        setTargetDate(getProgrammersDay(now.getFullYear() + 1));
      }
    };
    
    // Calculate immediately on mount
    calculateTimeLeft();

    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (isToday) {
    return (
      <div className="text-center text-lg text-emerald-600 font-semibold bg-emerald-100/80 px-4 py-2 rounded-lg shadow mb-8">
        🎉 祝你程序员节快乐！ 🎉
      </div>
    );
  }

  return (
    <div className="text-center text-slate-600 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md mb-8">
      <p className="text-xs font-semibold tracking-wider mb-1">程序员节倒计时</p>
      <div className="flex items-baseline justify-center space-x-2">
        <div>
          <span className="text-2xl font-bold">{String(timeLeft.days).padStart(2, '0')}</span>
          <span className="text-xs ml-1">天</span>
        </div>
        <div>
          <span className="text-2xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="text-xs ml-1">时</span>
        </div>
        <div>
          <span className="text-2xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="text-xs ml-1">分</span>
        </div>
        <div>
          <span className="text-2xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className="text-xs ml-1">秒</span>
        </div>
      </div>
    </div>
  );
};

export default ProgrammerDayCountdown;