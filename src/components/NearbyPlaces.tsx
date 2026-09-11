import { useState } from "react";
import { MapPin, Navigation, Star, Clock, Loader2, AlertCircle } from "lucide-react";
import {
  type PlaceCategory,
  type NearbyPlace,
  categoryInfo,
  fetchNearbyPlaces,
  getUserLocation,
  getDirectionsUrl,
} from "@/lib/nearbyPlaces";

interface NearbyPlacesProps {
  onClose?: () => void;
}

type Status = "idle" | "locating" | "searching" | "done" | "error";

const NearbyPlaces = ({ onClose }: NearbyPlacesProps) => {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");
  const [results, setResults] = useState<NearbyPlace[]>([]);
  const [activeCategory, setActiveCategory] = useState<PlaceCategory | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const categories = Object.entries(categoryInfo) as [PlaceCategory, { label: string; emoji: string }][];

  const handleCategoryClick = async (category: PlaceCategory) => {
    setActiveCategory(category);
    setError("");
    setResults([]);

    try {
      let loc = location;
      if (!loc) {
        setStatus("locating");
        loc = await getUserLocation();
        setLocation(loc);
      }

      setStatus("searching");
      const data = await fetchNearbyPlaces(loc.latitude, loc.longitude, category);
      setResults(data.results);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <span className="flex items-center gap-0.5 text-xs text-amber-500">
        <Star className="w-3 h-3 fill-current" />
        {rating.toFixed(1)}
      </span>
    );
  };

  const renderOpenStatus = (isOpen: boolean | null) => {
    if (isOpen === null) return null;
    return (
      <span className={`flex items-center gap-0.5 text-xs ${isOpen ? "text-green-500" : "text-red-400"}`}>
        <Clock className="w-3 h-3" />
        {isOpen ? "Open" : "Closed"}
      </span>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Category grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {categories.map(([key, { label, emoji }]) => (
          <button
            key={key}
            onClick={() => handleCategoryClick(key)}
            disabled={status === "locating" || status === "searching"}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-colors ${
              activeCategory === key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-foreground hover:bg-secondary"
            } disabled:opacity-50`}
          >
            <span className="text-lg">{emoji}</span>
            <span className="text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* Status messages */}
      {status === "locating" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Getting your location...
        </div>
      )}

      {status === "searching" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Searching nearby {activeCategory && categoryInfo[activeCategory].label.toLowerCase()}...
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 text-sm text-destructive py-4 justify-center">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Results */}
      {status === "done" && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No {activeCategory && categoryInfo[activeCategory].label.toLowerCase()} found nearby. Try expanding your search area.
        </p>
      )}

      {status === "done" && results.length > 0 && (
        <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
          {results.map((place, i) => (
            <div
              key={place.placeId || i}
              className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{place.name}</p>
                <p className="text-xs text-muted-foreground truncate">{place.address}</p>
                <div className="flex items-center gap-3 mt-1">
                  {renderStars(place.rating)}
                  {place.totalRatings > 0 && (
                    <span className="text-xs text-muted-foreground">({place.totalRatings})</span>
                  )}
                  {renderOpenStatus(place.isOpen)}
                </div>
              </div>
              <a
                href={getDirectionsUrl(place.location.lat, place.location.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                title="Get directions"
              >
                <Navigation className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbyPlaces;
