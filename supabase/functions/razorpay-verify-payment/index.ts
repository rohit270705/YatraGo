// supabase/functions/razorpay-verify-payment/index.ts
// Verifies the Razorpay payment signature after checkout completes.
// This MUST run server-side — never verify signatures on the client.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId, is_demo } = await req.json();

    // Demo mode: skip signature check
    if (is_demo) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      await supabase.from('bookings').update({
        payment_status: 'paid',
        payment_id: razorpay_payment_id || 'DEMO_' + Date.now(),
        razorpay_order_id: razorpay_order_id || 'DEMO_ORDER',
      }).eq('id', bookingId);

      return new Response(JSON.stringify({ verified: true, demo: true }), { headers: CORS });
    }

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keySecret) {
      return new Response(JSON.stringify({ error: 'No secret configured' }), { status: 500, headers: CORS });
    }

    // HMAC-SHA256 verification
    const message = `${razorpay_order_id}|${razorpay_payment_id}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keySecret);
    const msgData = encoder.encode(message);
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const expectedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

    if (expectedSig !== razorpay_signature) {
      return new Response(JSON.stringify({ verified: false, error: 'Signature mismatch' }), { status: 400, headers: CORS });
    }

    // Update booking in DB
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    await supabase.from('bookings').update({
      payment_status: 'paid',
      payment_id: razorpay_payment_id,
      razorpay_order_id,
    }).eq('id', bookingId);

    return new Response(JSON.stringify({ verified: true }), { headers: CORS });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
});
