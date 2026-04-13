import { Car, Wrench, Gauge, ParkingCircle } from "lucide-react";
import { Link } from "react-router-dom";
import TipOfTheDay from "./TipOfTheDay";

interface UserCarBasic {
  make: string;
  model: string;
  year: number;
  nickname: string | null;
}

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
  userName?: string;
  userCars?: UserCarBasic[];
}

const defaultSuggestions = [
  { icon: Car, text: "I just bought my first car", color: "text-primary" },
  { icon: Wrench, text: "Explain oil change like I'm new", color: "text-accent-foreground" },
  { icon: Gauge, text: "What do dashboard lights mean?", color: "text-primary" },
  { icon: ParkingCircle, text: "Help me with parallel parking", color: "text-accent-foreground" },
];

const WelcomeScreen = ({ onSuggestionClick, userName, userCars = [] }: WelcomeScreenProps) => {
  const hasCars = userCars.length > 0;
  const firstCar = userCars[0];

  const personalizedSuggestions = hasCars && firstCar
    ? [
        { icon: Wrench, text: `Maintenance tips for my ${firstCar.year} ${firstCar.make} ${firstCar.model}`, color: "text-primary" },
        { icon: Gauge, text: `Common issues with the ${firstCar.make} ${firstCar.model}`, color: "text-accent-foreground" },
        { icon: Car, text: `Best accessories for a ${firstCar.make} ${firstCar.model}`, color: "text-primary" },
        { icon: ParkingCircle, text: "Help me with parallel parking", color: "text-accent-foreground" },
      ]
    : defaultSuggestions;

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 animate-fade-in-up">
      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
        <Car className="w-8 h-8 text-primary-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-1">
        {userName ? `Hey ${userName}! 👋` : "CarsGPT"}
      </h1>
      <p className="text-muted-foreground text-center max-w-sm mb-2">
        {userName
          ? hasCars
            ? `Ready to help with your ${firstCar!.nickname || `${firstCar!.make} ${firstCar!.model}`}!`
            : "What would you like to learn about today?"
          : "Your friendly AI car guide for beginner drivers. Ask me anything about cars, driving, or maintenance!"}
      </p>

      {userName && !hasCars && (
        <Link
          to="/my-car"
          className="text-xs text-primary hover:underline mb-4"
        >
          + Add your car for personalized tips
        </Link>
      )}

      {hasCars && (
        <div className="flex items-center gap-2 mb-6">
          {userCars.slice(0, 3).map((car, i) => (
            <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {car.nickname || `${car.year} ${car.make} ${car.model}`}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
        {personalizedSuggestions.map((s) => (
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

      <TipOfTheDay />
    </div>
  );
};

export default WelcomeScreen;
