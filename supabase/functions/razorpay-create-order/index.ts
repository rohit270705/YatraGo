// supabase/functions/razorpay-create-order/index.ts
// Creates a Razorpay order server-side so the API key never reaches the browser.
// Set secrets: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET via:
//   npx supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxx RAZORPAY_KEY_SECRET=xxx

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { amount, currency = 'INR', bookingRef, userEmail } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400, headers: CORS });
    }

    const keyId     = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      // Return a mock order for development/demo
      const mockOrder = {
        id: 'order_DEMO_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        amount: Math.round(amount * 100), // paise
        currency,
        status: 'created',
        receipt: bookingRef || 'YG-' + Date.now(),
        is_demo: true,
      };
      return new Response(JSON.stringify(mockOrder), { headers: CORS });
    }

    // Create real Razorpay order
    const credentials = btoa(`${keyId}:${keySecret}`);
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // convert to paise
        currency,
        receipt: bookingRef || 'YG-' + Date.now(),
        notes: { userEmail: userEmail || '', source: 'YatraGo' },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return new Response(JSON.stringify({ error: err.error?.description || 'Razorpay error' }), { status: 502, headers: CORS });
    }

    const order = await response.json();
    return new Response(JSON.stringify(order), { headers: CORS });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
});
