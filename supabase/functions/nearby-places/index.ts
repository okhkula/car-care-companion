import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

// Search phrase used for each category in Places API (New) text search
const categoryQueryMap: Record<string, string> = {
  gas_station: "gas station",
  garage: "auto repair garage mechanic",
  car_accessories: "car accessories auto parts store",
  licensing: "vehicle licensing and registration office",
  showroom: "car dealership showroom",
  parking: "parking",
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

    if (typeof latitude !== "number" || typeof longitude !== "number" || !category) {
      return new Response(
        JSON.stringify({ error: "Missing latitude, longitude, or category" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const textQuery = categoryQueryMap[category];
    if (!textQuery) {
      return new Response(
        JSON.stringify({ error: "Invalid category" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const googleMapsApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!lovableApiKey || !googleMapsApiKey) {
      return new Response(
        JSON.stringify({ error: "Google Maps connection is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Keep the search area bounded (Places API allows up to 50km)
    const searchRadius = Math.min(Math.max(Number(radius) || 5000, 500), 50000);

    const placesResp = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "X-Connection-Api-Key": googleMapsApiKey,
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.currentOpeningHours.openNow,places.priceLevel",
      },
      body: JSON.stringify({
        textQuery,
        pageSize: 10,
        locationBias: {
          circle: {
            center: { latitude, longitude },
            radius: searchRadius,
          },
        },
      }),
    });

    if (!placesResp.ok) {
      const errorBody = await placesResp.text();
      console.error(`Places request failed [${placesResp.status}]: ${errorBody}`);
      return new Response(
        JSON.stringify({ error: "Could not search nearby places right now.", details: errorBody }),
        { status: placesResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const placesData = await placesResp.json();

    const priceLevelMap: Record<string, number> = {
      PRICE_LEVEL_FREE: 0,
      PRICE_LEVEL_INEXPENSIVE: 1,
      PRICE_LEVEL_MODERATE: 2,
      PRICE_LEVEL_EXPENSIVE: 3,
      PRICE_LEVEL_VERY_EXPENSIVE: 4,
    };

    const results = (placesData.places || []).map((place: any) => ({
      name: place.displayName?.text || "Unknown place",
      address: place.formattedAddress || "",
      rating: place.rating ?? null,
      totalRatings: place.userRatingCount ?? 0,
      isOpen: place.currentOpeningHours?.openNow ?? null,
      priceLevel: place.priceLevel ? priceLevelMap[place.priceLevel] ?? null : null,
      location: {
        lat: place.location?.latitude,
        lng: place.location?.longitude,
      },
      placeId: place.id,
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
