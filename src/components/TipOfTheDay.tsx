import { useState, useEffect } from "react";
import { Lightbulb, RefreshCw } from "lucide-react";

const tips = [
  "Check your tire pressure at least once a month — under-inflated tires waste fuel and wear unevenly.",
  "The 3-second rule: keep at least 3 seconds of following distance from the car ahead of you.",
  "Your dashboard warning lights use colors like a traffic light — green is good, yellow means caution, red means stop and check.",
  "Always check your mirrors before changing lanes, and glance over your shoulder for blind spots.",
  "Keep your windshield washer fluid topped up — you'll be glad you did on a rainy or dusty day!",
  "Park in gear (manual) or Park (automatic) and always use your parking brake, even on flat ground.",
  "Turn off your engine if you'll be idling for more than 60 seconds — it saves fuel and reduces emissions.",
  "Your owner's manual is your best friend. It has all the info specific to your car's maintenance schedule.",
  "Strange noises? Squealing usually means brakes or a belt, clicking could be CV joints. Don't ignore them!",
  "Check your oil level with the dipstick every few weeks — it's one of the easiest things you can do for your engine.",
  "Use your turn signals early — let other drivers know your intentions at least 3 seconds before turning.",
  "When it rains after a dry spell, roads are extra slippery for the first 15 minutes. Slow down!",
  "Headlights aren't just for night — use them in rain, fog, or dusk so others can see you.",
  "Never warm up a modern car by idling for minutes. Just drive gently for the first few minutes.",
  "Keep an emergency kit in your trunk: jumper cables, flashlight, first aid kit, and a blanket.",
];

const TipOfTheDay = () => {
  const [tipIndex, setTipIndex] = useState(() => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return seed % tips.length;
  });

  const rotateTip = () => {
    setTipIndex((prev) => (prev + 1) % tips.length);
  };

  return (
    <div className="w-full max-w-md mx-auto mt-6 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Tip of the Day</span>
        </div>
        <button
          onClick={rotateTip}
          className="flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Next tip"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{tips[tipIndex]}</p>
    </div>
  );
};

export default TipOfTheDay;
