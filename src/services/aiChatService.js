// YatraGo AI Chat Service — Frontend module
// Handles context building, language detection, API calls, and session management

import { supabase } from '../supabaseClient';

// ============================================================
// LANGUAGE DETECTION
// ============================================================
export function detectLanguage(text) {
  if (!text) return 'en';
  
  // Check for Devanagari script
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  
  if (hasDevanagari) {
    // Distinguish Marathi from Hindi using characteristic Marathi words/endings
    const marathiMarkers = /(?:आहे|आहेत|नाही|करा|पाहा|सांगा|तुमची|तुमच्या|माझ्या|माझी|माझे|होते|झाले|असेल|असतो|कसे|कसा|कशी|काय|कुठे|केव्हा|आम्ही|आमच्या|त्यांच|म्हण)/;
    if (marathiMarkers.test(text)) return 'mr';
    return 'hi';
  }
  
  // Check for Hinglish (Roman script Hindi words mixed with English)
  const hinglishMarkers = /\b(mera|meri|mere|tumhara|aapka|aapki|kaise|kaise|kitna|kitne|kab|kya|hai|hain|tha|thi|the|chahiye|karein|kariye|karna|hoga|hogi|nahi|aur|lekin|abhi|yahan|wahan|kal|aaj|paise|gaadi|wala|sahab|bhai|yaar|accha|theek|sahi|galat|bahut|thoda|jaldi|baad|pehle|samajh|bata|bolo|dekho|suno|chalo|jao|aao|mujhe|tujhe|humko|unko|isko|usko|unhe|inhe|sabko)\b/i;
  if (hinglishMarkers.test(text)) return 'hinglish';
  
  return 'en';
}

// ============================================================
// BUILD ROLE-SPECIFIC CONTEXT FROM SUPABASE
// ============================================================
export async function buildUserContext(user) {
  if (!user) return { userName: 'Guest', userRole: 'passenger', contextText: 'User is not logged in.' };

  const context = {
    userName: user.name || 'User',
    userRole: user.role || 'passenger',
    contextText: ''
  };

  const lines = [];

  try {
    switch (user.role) {
      case 'passenger': {
        // Wallet balance
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .maybeSingle();
        if (walletData) lines.push(`Wallet Balance: ₹${walletData.balance || 0}`);

        // Active bookings
        const { data: bookings } = await supabase
          .from('bookings')
          .select('id, route_from, route_to, travel_date, status, total_amount, passengers')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        if (bookings?.length) {
          lines.push(`\nRecent Bookings (last 5):`);
          bookings.forEach(b => {
            lines.push(`  - ${b.route_from} → ${b.route_to} | Date: ${b.travel_date} | Status: ${b.status} | Amount: ₹${b.total_amount} | Passengers: ${b.passengers}`);
          });
        } else {
          lines.push('No bookings found.');
        }

        // Recent wallet transactions
        const { data: txns } = await supabase
          .from('wallet_transactions')
          .select('type, amount, description, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        if (txns?.length) {
          lines.push(`\nRecent Wallet Transactions:`);
          txns.forEach(t => {
            lines.push(`  - ${t.type}: ₹${t.amount} — ${t.description} (${new Date(t.created_at).toLocaleDateString()})`);
          });
        }

        // Active parcels
        const { data: parcels } = await supabase
          .from('parcels')
          .select('id, from_city, to_city, status, created_at')
          .eq('sender_id', user.id)
          .in('status', ['pending', 'in_transit', 'dispatched'])
          .limit(3);
        if (parcels?.length) {
          lines.push(`\nActive Parcels:`);
          parcels.forEach(p => {
            lines.push(`  - ${p.from_city} → ${p.to_city} | Status: ${p.status}`);
          });
        }
        break;
      }

      case 'agent': {
        // Commission/wallet
        const { data: agentWallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .maybeSingle();
        if (agentWallet) lines.push(`Commission Wallet Balance: ₹${agentWallet.balance || 0}`);

        // Recent bookings made by agent
        const { data: agentBookings } = await supabase
          .from('bookings')
          .select('id, route_from, route_to, travel_date, status, total_amount')
          .eq('booked_by', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        if (agentBookings?.length) {
          lines.push(`\nRecent Bookings Made:`);
          agentBookings.forEach(b => {
            lines.push(`  - ${b.route_from} → ${b.route_to} | ${b.travel_date} | ${b.status} | ₹${b.total_amount}`);
          });
          const pending = agentBookings.filter(b => b.status === 'pending').length;
          lines.push(`Pending bookings: ${pending}`);
        }

        // KYC status
        lines.push(`KYC Verified: ${user.kyc_verified ? 'Yes ✅' : 'No ❌'}`);
        break;
      }

      case 'owner': {
        // Vehicles
        const { data: vehicles } = await supabase
          .from('vehicles')
          .select('id, name, type, number_plate, status, puc_expiry, insurance_expiry, fitness_expiry')
          .eq('owner_id', user.id)
          .limit(10);
        if (vehicles?.length) {
          lines.push(`Registered Vehicles (${vehicles.length}):`);
          vehicles.forEach(v => {
            lines.push(`  - ${v.name} (${v.number_plate}) | Type: ${v.type} | Status: ${v.status}`);
            if (v.puc_expiry) lines.push(`    PUC Expiry: ${v.puc_expiry}`);
            if (v.insurance_expiry) lines.push(`    Insurance Expiry: ${v.insurance_expiry}`);
            if (v.fitness_expiry) lines.push(`    Fitness Expiry: ${v.fitness_expiry}`);
          });
        }

        // Earnings
        const { data: ownerWallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .maybeSingle();
        if (ownerWallet) lines.push(`\nEarnings Wallet: ₹${ownerWallet.balance || 0}`);

        // Upcoming trips
        const { data: ownerBookings } = await supabase
          .from('bookings')
          .select('id, route_from, route_to, travel_date, status')
          .eq('owner_id', user.id)
          .in('status', ['confirmed', 'pending'])
          .order('travel_date', { ascending: true })
          .limit(5);
        if (ownerBookings?.length) {
          lines.push(`\nUpcoming Trips:`);
          ownerBookings.forEach(b => {
            lines.push(`  - ${b.route_from} → ${b.route_to} | ${b.travel_date} | ${b.status}`);
          });
        }
        break;
      }

      case 'driver': {
        // Driver profile
        const { data: driverProfile } = await supabase
          .from('driver_profiles')
          .select('license_number, license_expiry, license_category, vehicle_ownership, approval_status')
          .eq('user_id', user.id)
          .maybeSingle();
        if (driverProfile) {
          lines.push(`License Number: ${driverProfile.license_number || 'Not set'}`);
          lines.push(`License Expiry: ${driverProfile.license_expiry || 'Not set'}`);
          lines.push(`License Category: ${driverProfile.license_category || 'Not set'}`);
          lines.push(`Vehicle Ownership: ${driverProfile.vehicle_ownership || 'Not set'}`);
          lines.push(`Approval Status: ${driverProfile.approval_status || 'pending'}`);
        }

        // Earnings
        const { data: driverWallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .maybeSingle();
        if (driverWallet) lines.push(`\nEarnings: ₹${driverWallet.balance || 0}`);

        // Linked owners
        const { data: links } = await supabase
          .from('driver_owner_link')
          .select('owner_id, relationship_type, status')
          .eq('driver_id', user.id)
          .limit(5);
        if (links?.length) {
          lines.push(`\nLinked Vehicle Owners: ${links.length}`);
          links.forEach(l => lines.push(`  - Owner ${l.owner_id.slice(0, 8)}… | ${l.relationship_type} | ${l.status}`));
        }
        break;
      }

      case 'host': {
        // Homestay listings
        const { data: homestays } = await supabase
          .from('homestays')
          .select('id, name, location, status, price_per_night')
          .eq('host_id', user.id)
          .limit(5);
        if (homestays?.length) {
          lines.push(`Your Homestay Listings:`);
          homestays.forEach(h => {
            lines.push(`  - ${h.name} at ${h.location} | Status: ${h.status} | ₹${h.price_per_night}/night`);
          });
        }

        // Guest bookings
        const { data: guestBookings } = await supabase
          .from('homestay_bookings')
          .select('id, guest_name, check_in, check_out, status')
          .eq('host_id', user.id)
          .order('check_in', { ascending: true })
          .limit(5);
        if (guestBookings?.length) {
          lines.push(`\nUpcoming Guest Bookings:`);
          guestBookings.forEach(b => {
            lines.push(`  - ${b.guest_name} | ${b.check_in} to ${b.check_out} | ${b.status}`);
          });
        }

        // Reviews
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating, comment, created_at')
          .eq('target_type', 'homestay')
          .order('created_at', { ascending: false })
          .limit(3);
        if (reviews?.length) {
          lines.push(`\nRecent Reviews:`);
          reviews.forEach(r => {
            lines.push(`  - ⭐${r.rating}/5: "${r.comment?.slice(0, 60) || 'No comment'}"`);
          });
        }
        break;
      }

      default:
        lines.push('Role-specific data not available.');
    }
  } catch (err) {
    console.error('Error building user context:', err);
    lines.push('(Some data could not be loaded)');
  }

  context.contextText = lines.join('\n');
  return context;
}

// ============================================================
// CALL AI ROUTER API
// ============================================================
export async function sendAiMessage(message, userContext, chatHistory, detectedLanguage, messageCount) {
  try {
    // Determine API URL — in production it's relative, in dev we need full URL
    const apiUrl = '/api/ai-chat';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        userContext,
        chatHistory: chatHistory.map(m => ({ sender: m.sender, content: m.content })),
        detectedLanguage,
        messageCount
      })
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error('Error calling AI router:', err);
    // Return offline fallback
    const fallbacks = {
      en: "Our assistant is busy right now. Please try again in a moment or raise a support ticket 🙏",
      hi: "हमारा असिस्टेंट अभी व्यस्त है। कृपया थोड़ी देर बाद कोशिश करें या सपोर्ट टिकट बनाएं 🙏",
      mr: "आमचा असिस्टंट सध्या व्यस्त आहे। कृपया थोड्या वेळाने पुन्हा प्रयत्न करा 🙏",
      hinglish: "Abhi assistant busy hai. Thodi der mein try karein ya support ticket raise karein 🙏"
    };
    return {
      reply: fallbacks[detectedLanguage] || fallbacks.en,
      aiProvider: 'error',
      responseTimeMs: 0,
      fallbackUsed: true,
      fallbackReason: 'error',
      quickReplies: ['🎫 Raise Support Ticket']
    };
  }
}

// ============================================================
// SUPABASE SESSION & MESSAGE PERSISTENCE
// ============================================================
export async function createChatSession(userId, role, language = 'en') {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([{ user_id: userId, role, detected_language: language }])
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error creating chat session:', err);
    // Return a local fallback session
    return { id: `local-${Date.now()}`, user_id: userId, role, detected_language: language, started_at: new Date().toISOString() };
  }
}

export async function saveChatMessage(sessionId, sender, content, metadata = {}) {
  // Don't try to save to DB if session is local-only
  if (sessionId?.startsWith('local-')) return;
  
  try {
    await supabase.from('chat_messages').insert([{
      session_id: sessionId,
      sender,
      content,
      ai_provider: metadata.aiProvider || null,
      response_time_ms: metadata.responseTimeMs || null,
      fallback_used: metadata.fallbackUsed || false,
      fallback_reason: metadata.fallbackReason || null,
      quick_replies: metadata.quickReplies || []
    }]);
  } catch (err) {
    console.error('Error saving chat message:', err);
  }
}

export async function raiseSupportTicket(userId, role, chatSessionId, issueSummary) {
  try {
    const ticketData = {
      user_id: userId,
      subject: `AI Chat Escalation — ${issueSummary.slice(0, 60)}`,
      category: 'chat_escalation',
      priority: 'medium',
      status: 'open',
      chat_session_id: chatSessionId?.startsWith('local-') ? null : chatSessionId,
      messages_json: [{
        sender_role: 'system',
        content: `Auto-escalated from AI Chat.\n\nIssue Summary: ${issueSummary}`,
        timestamp: new Date().toISOString()
      }]
    };

    const { data, error } = await supabase
      .from('support_tickets')
      .insert([ticketData])
      .select()
      .single();

    if (error) throw error;
    return { success: true, ticketId: data.id };
  } catch (err) {
    console.error('Error raising support ticket:', err);
    return { success: false, error: err.message };
  }
}
