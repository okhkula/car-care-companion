import { Car, Wrench, Gauge, ParkingCircle } from "lucide-react";

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
  userName?: string;
}

const suggestions = [
  { icon: Car, text: "I just bought my first car", color: "text-primary" },
  { icon: Wrench, text: "Explain oil change like I'm new", color: "text-accent-foreground" },
  { icon: Gauge, text: "What do dashboard lights mean?", color: "text-primary" },
  { icon: ParkingCircle, text: "Help me with parallel parking", color: "text-accent-foreground" },
];

const WelcomeScreen = ({ onSuggestionClick, userName }: WelcomeScreenProps) => (
  <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 animate-fade-in-up">
    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
      <Car className="w-8 h-8 text-primary-foreground" />
    </div>
    <h1 className="text-2xl font-bold text-foreground mb-1">
      {userName ? `Hey ${userName}! 👋` : "CarsGPT"}
    </h1>
    <p className="text-muted-foreground text-center max-w-sm mb-8">
      {userName
        ? "What would you like to learn about today?"
        : "Your friendly AI car guide for beginner drivers. Ask me anything about cars, driving, or maintenance!"}
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
      {suggestions.map((s) => (
        <button
          key={s.text}
          onClick={() => onSuggestionClick(s.text)}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground hover:bg-secondary transition-colors"
        >
          <s.icon className={`w-5 h-5 flex-shrink-0 ${s.color}`} />
          <span>{s.text}</span>
        </button>
      ))}
    </div>
  </div>
);

export default WelcomeScreen;
