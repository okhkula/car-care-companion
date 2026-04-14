const NEARBY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nearby-places`;

export type PlaceCategory =
  | "gas_station"
  | "garage"
  | "car_accessories"
  | "licensing"
  | "showroom"
  | "parking";

export interface NearbyPlace {
  name: string;
  address: string;
  rating: number | null;
  totalRatings: number;
  isOpen: boolean | null;
  priceLevel: number | null;
  location: { lat: number; lng: number };
  placeId: string;
}

export interface NearbyPlacesResult {
  category: PlaceCategory;
  categoryLabel: string;
  results: NearbyPlace[];
  totalFound: number;
}

export const categoryInfo: Record<PlaceCategory, { label: string; emoji: string }> = {
  gas_station: { label: "Gas Stations", emoji: "⛽" },
  garage: { label: "Garages & Mechanics", emoji: "🔧" },
  car_accessories: { label: "Car Accessory Stores", emoji: "🛒" },
  licensing: { label: "Licensing & Registration", emoji: "📋" },
  showroom: { label: "Car Showrooms", emoji: "🏪" },
  parking: { label: "Parking Options", emoji: "🅿️" },
};

export async function fetchNearbyPlaces(
  latitude: number,
  longitude: number,
  category: PlaceCategory,
  radius = 5000
): Promise<NearbyPlacesResult> {
  const resp = await fetch(NEARBY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ latitude, longitude, category, radius }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch nearby places");
  }

  return resp.json();
}

/** Request the user's current location */
export function getUserLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Location permission denied. Please enable location access in your browser settings."));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Location information is unavailable."));
            break;
          case error.TIMEOUT:
            reject(new Error("Location request timed out. Please try again."));
            break;
          default:
            reject(new Error("Unable to get your location."));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  });
}

/** Build a Google Maps directions URL */
export function getDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
