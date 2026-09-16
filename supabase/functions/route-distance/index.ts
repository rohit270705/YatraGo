import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { origin_label, destination_label, origin_place_id, destination_place_id } = await req.json();

    if (!origin_label || !destination_label) {
      return new Response(JSON.stringify({ error: 'Missing origin_label or destination_label' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Check cache first
    let cacheQuery = supabaseAdmin
      .from('route_distance_cache')
      .select('*')
      .gte('expires_at', new Date().toISOString());

    if (origin_place_id && destination_place_id) {
      cacheQuery = cacheQuery
        .eq('origin_place_id', origin_place_id)
        .eq('destination_place_id', destination_place_id);
    } else {
      cacheQuery = cacheQuery
        .ilike('origin_label', origin_label)
        .ilike('destination_label', destination_label);
    }

    const { data: cacheData, error: cacheError } = await cacheQuery.limit(1).maybeSingle();

    if (cacheData) {
      return new Response(JSON.stringify({
        distance_km: cacheData.distance_km,
        duration_min: cacheData.duration_min,
        cached: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Fetch from Google Maps API
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      // Fallback if API key is not set
      return new Response(JSON.stringify({ error: 'GOOGLE_MAPS_API_KEY is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const origin = origin_place_id ? `place_id:${origin_place_id}` : origin_label;
    const destination = destination_place_id ? `place_id:${destination_place_id}` : destination_label;

    const googleRes = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`
    );
    const googleData = await googleRes.json();

    if (googleData.status !== 'OK' || googleData.rows[0].elements[0].status !== 'OK') {
      return new Response(JSON.stringify({ error: 'Failed to calculate distance from Google Maps', details: googleData }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const element = googleData.rows[0].elements[0];
    const distance_km = +(element.distance.value / 1000).toFixed(2);
    const duration_min = +(element.duration.value / 60).toFixed(2);

    // 3. Save to cache
    const { error: insertError } = await supabaseAdmin
      .from('route_distance_cache')
      .insert({
        origin_label,
        destination_label,
        origin_place_id: origin_place_id || null,
        destination_place_id: destination_place_id || null,
        distance_km,
        duration_min
      });

    if (insertError) {
      console.error('Failed to cache distance:', insertError);
    }

    return new Response(JSON.stringify({
      distance_km,
      duration_min,
      cached: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
