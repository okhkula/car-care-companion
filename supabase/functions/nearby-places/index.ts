import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_maps';

// Maps our app categories to Google Places types / text queries
const categorySearch: Record<string, { types?: string[]; textQuery?: string }> = {
  gas: { types: ['gas_station'] },
  gas_station: { types: ['gas_station'] },
  garage: { types: ['car_repair'] },
  repair: { types: ['car_repair'] },
  accessories: { types: ['auto_parts_store'] },
  parts: { types: ['auto_parts_store'] },
  licensing: { textQuery: 'vehicle licensing and registration center' },
  registration: { textQuery: 'vehicle licensing and registration center' },
  showroom: { types: ['car_dealer'] },
  dealer: { types: ['car_dealer'] },
  parking: { types: ['parking'] },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Google Maps connection is not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const latitude = Number(body?.latitude);
    const longitude = Number(body?.longitude);
    const category = String(body?.category ?? 'gas');
    // Keep the radius sensible to control cost (500 m - 20 km)
    const radius = Math.min(Math.max(Number(body?.radius) || 5000, 500), 20000);

    const isValidCoordinate =
      Number.isFinite(latitude) && Math.abs(latitude) <= 90 &&
      Number.isFinite(longitude) && Math.abs(longitude) <= 180;

    if (!isValidCoordinate) {
      return new Response(
        JSON.stringify({ error: 'A valid latitude and longitude are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const search = categorySearch[category] ?? { textQuery: `${category} near me` };

    const useTextSearch = Boolean(search.textQuery);
    const endpoint = useTextSearch
      ? `${GATEWAY_URL}/places/v1/places:searchText`
      : `${GATEWAY_URL}/places/v1/places:searchNearby`;

    const requestBody = useTextSearch
      ? {
          textQuery: search.textQuery,
          pageSize: 12,
          locationBias: { circle: { center: { latitude, longitude }, radius } },
        }
      : {
          includedTypes: search.types,
          maxResultCount: 12,
          locationRestriction: { circle: { center: { latitude, longitude }, radius } },
        };

    const googleResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': GOOGLE_MAPS_API_KEY,
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.location',
          'places.rating',
          'places.userRatingCount',
          'places.currentOpeningHours.openNow',
        ].join(','),
      },
      body: JSON.stringify(requestBody),
    });

    if (!googleResponse.ok) {
      const errorBody = await googleResponse.text();
      console.error(`Places request failed [${googleResponse.status}]: ${errorBody}`);
      return new Response(
        JSON.stringify({ error: 'Could not load nearby places right now.', status: googleResponse.status, details: errorBody }),
        { status: googleResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await googleResponse.json();

    const places = (data.places ?? []).map((place: any) => ({
      id: place.id,
      placeId: place.id,
      name: place.displayName?.text ?? 'Unknown place',
      address: place.formattedAddress ?? '',
      vicinity: place.formattedAddress ?? '',
      rating: place.rating ?? null,
      userRatingCount: place.userRatingCount ?? null,
      openNow: place.currentOpeningHours?.openNow ?? null,
      location: place.location ?? null,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        place.displayName?.text ?? '',
      )}&query_place_id=${place.id}`,
    }));

    return new Response(JSON.stringify({ places, results: places }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('nearby-places error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
