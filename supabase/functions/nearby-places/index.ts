import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map our category keys to Google Places API types
const categoryTypeMap: Record<string, { types: string[]; keyword?: string }> = {
  gas_station: { types: ["gas_station"], keyword: "gas station fuel" },
  garage: { types: ["car_repair"], keyword: "auto repair mechanic garage" },
  car_accessories: { types: ["car_repair", "store"], keyword: "car accessories auto parts" },
  licensing: { types: ["local_government_office"], keyword: "vehicle registration licensing DMV" },
  showroom: { types: ["car_dealer"], keyword: "car dealership showroom" },
  parking: { types: ["parking"], keyword: "parking lot garage" },
};

const categoryLabels: Record<string, string> = {
  gas_station: "Gas Stations",
  garage: "Garages & Mechanics",
  car_accessories: "Car Accessory Stores",
  licensing: "Vehicle Licensing & Registration",
  showroom: "Car Showrooms & Dealers",
  parking: "Parking Options",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, category, radius = 5000 } = await req.json();

    if (!latitude || !longitude || !category) {
      return new Response(
        JSON.stringify({ error: "Missing latitude, longitude, or category" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const categoryConfig = categoryTypeMap[category];
    if (!categoryConfig) {
      return new Response(
        JSON.stringify({ error: "Invalid category" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_PLACES_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Google Places Nearby Search (legacy endpoint, widely available)
    const type = categoryConfig.types[0];
    const keyword = categoryConfig.keyword || "";
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`;

    const placesResp = await fetch(url);
    const placesData = await placesResp.json();

    if (placesData.status !== "OK" && placesData.status !== "ZERO_RESULTS") {
      console.error("Google Places error:", placesData.status, placesData.error_message);
      return new Response(
        JSON.stringify({ error: `Places API error: ${placesData.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = (placesData.results || []).slice(0, 10).map((place: any) => ({
      name: place.name,
      address: place.vicinity || place.formatted_address || "",
      rating: place.rating || null,
      totalRatings: place.user_ratings_total || 0,
      isOpen: place.opening_hours?.open_now ?? null,
      priceLevel: place.price_level ?? null,
      location: {
        lat: place.geometry?.location?.lat,
        lng: place.geometry?.location?.lng,
      },
      placeId: place.place_id,
    }));

    return new Response(
      JSON.stringify({
        category,
        categoryLabel: categoryLabels[category] || category,
        results,
        totalFound: results.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("nearby-places error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
