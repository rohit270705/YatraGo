// YatraGo AI Chat Router — Vercel Serverless Function
// 4-Provider Privacy-First Architecture: Gemini 2.0 Flash (Primary), Groq Llama 3.3 70B (Speed Fallback), ChatGPT GPT-4o mini (Complex), Claude Haiku (Emergency Fallback)
// DeepSeek is permanently excluded for data privacy compliance (DPDP Act 2023).

// In-memory rate limit counters (reset per cold start, minute tracking)
const rateLimits = { 
  gemini: { count: 0, resetAt: 0 }, 
  groq: { count: 0, resetAt: 0 }, 
  openai: { count: 0, resetAt: 0 }, 
  claude: { count: 0, resetAt: 0 } 
};
const RATE_LIMITS = { gemini: 50, groq: 100, openai: 15, claude: 8 }; // conservative per-minute thresholds

// In-memory client IP rate limiter (20 requests per minute per IP to prevent abuse/DDoS)
const ipRateLimits = new Map();
const IP_RATE_LIMIT = 20;

function checkIpRateLimit(ip) {
  const now = Date.now();
  const record = ipRateLimits.get(ip);
  if (!record || now > record.resetAt) {
    ipRateLimits.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (record.count >= IP_RATE_LIMIT) return false;
  record.count++;
  return true;
}

function checkRateLimit(provider) {
  const now = Date.now();
  if (now > rateLimits[provider].resetAt) {
    rateLimits[provider] = { count: 0, resetAt: now + 60000 };
  }
  if (rateLimits[provider].count >= RATE_LIMITS[provider]) return false;
  rateLimits[provider].count++;
  return true;
}

// ============================================================
// DATA PRIVACY & SANITIZATION (DPDP Act 2023 Compliance)
// ============================================================
function sanitizeUserContext(rawContext) {
  if (!rawContext) return {};

  // Extract first name only
  let firstName = 'User';
  if (rawContext.userName) {
    firstName = rawContext.userName.split(' ')[0];
  } else if (rawContext.full_name) {
    firstName = rawContext.full_name.split(' ')[0];
  } else if (rawContext.firstName) {
    firstName = rawContext.firstName;
  }

  // Sanitize text context by redacting sensitive patterns if present in raw string
  let cleanText = rawContext.contextText || '';
  // Redact potential 12-digit Aadhar numbers
  cleanText = cleanText.replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, '[REDACTED_AADHAR]');
  // Redact potential 10-char PAN numbers (5 letters, 4 numbers, 1 letter)
  cleanText = cleanText.replace(/\b[A-Z]{5}\d{4}[A-Z]\b/gi, '[REDACTED_PAN]');
  // Redact UPI IDs (e.g., name@okaxis, name@ybl, name@upi)
  cleanText = cleanText.replace(/\b[a-zA-Z0-9.\-_]+@(okaxis|okicici|oksbi|okhdfcbank|ybl|upi|paytm|apl|axl|ibl)\b/gi, '[REDACTED_UPI]');
  // Redact potential bank account / IFSC codes
  cleanText = cleanText.replace(/\b[A-Z]{4}0[A-Z0-9]{6}\b/gi, '[REDACTED_IFSC]');

  return {
    firstName,
    role: rawContext.userRole || rawContext.role || 'passenger',
    contextText: cleanText
  };
}

// ============================================================
// QUERY CLASSIFICATION
// ============================================================
function classifyComplexity(message, messageCount, chatHistory = []) {
  const text = message.toLowerCase();
  
  // 1. Keyword check
  const complexTriggers = [
    'problem', 'complaint', 'dispute', 'samajh nahi', 'galat', 'wrong',
    'refund nahi', 'dobara', 'phir se', '2 baar', 'issue', 'shikayat',
    'takrar', 'chuk', 'cancel karke', 'fir se', 'nahi hua', 'kyu nahi',
    'escalate', 'manager', 'fraud', 'scam', 'cheat', 'tक्लेम', 'तक्रार'
  ];
  if (complexTriggers.some(t => text.includes(t))) return 'complex';

  // 2. Message length > 150 chars
  if (message.length > 150) return 'complex';

  // 3. 3+ messages without resolution
  if (messageCount >= 3) return 'complex';

  // 4. Check if previous AI response contained uncertainty phrases
  if (chatHistory && chatHistory.length > 0) {
    const lastMsg = chatHistory[chatHistory.length - 1];
    if (lastMsg && lastMsg.sender === 'ai' && lastMsg.content) {
      const lastText = lastMsg.content.toLowerCase();
      const uncertaintyPhrases = [
        "i'm not sure", "i don't know",
        "मुझे नहीं पता", "पक्का नहीं",
        "मला माहीत नाही", "नक्की नाही",
        "pata nahi", "sure nahi"
      ];
      if (uncertaintyPhrases.some(p => lastText.includes(p))) return 'complex';
    }
  }

  return 'simple';
}

// Generate quick reply chips based on response content
function generateQuickReplies(aiResponse, userRole) {
  const text = aiResponse.toLowerCase();
  const chips = [];

  if (text.includes('wallet') || text.includes('balance') || text.includes('पैसे') || text.includes('बैलेंस') || text.includes('रक्कम')) {
    chips.push('💰 Check wallet', '📋 View Transactions');
  }
  if (text.includes('booking') || text.includes('बुकिंग') || text.includes('trip') || text.includes('यात्रा') || text.includes('प्रवास') || text.includes('route')) {
    chips.push('🚗 Find cabs', '📍 Track Vehicle', '❌ Cancel Booking');
  }
  if (text.includes('package') || text.includes('holiday') || text.includes('tour') || text.includes('छुट्टी')) {
    chips.push('🎒 Book package', '🚗 Find cabs');
  }
  if (text.includes('ticket') || text.includes('support') || text.includes('help') || text.includes('मदद') || text.includes('मदत')) {
    chips.push('🎫 Raise Support Ticket');
  }
  if (text.includes('refund') || text.includes('रिफंड') || text.includes('वापसी')) {
    chips.push('📞 Contact Support', '🎫 Raise Ticket');
  }
  if (text.includes('vehicle') || text.includes('गाड़ी') || text.includes('वाहन') || text.includes('document') || text.includes('दस्तावेज')) {
    chips.push('🚗 My Vehicles', '📄 View Documents');
  }

  // Always offer default popular actions if less than 2 chips
  if (chips.length < 2) {
    chips.push('🚗 Find cabs', '🎒 Book package', '💰 Check wallet', '🎫 Raise Support Ticket');
  }

  return Array.from(new Set(chips)).slice(0, 4); // max 4 unique chips
}

// Build system prompt using sanitized user context
function buildSystemPrompt(sanitizedContext, detectedLanguage) {
  return `You are Yaara (meaning "friend" in Hindi/Urdu), YatraGo's friendly AI assistant — positioned as a warm, knowledgeable local travel buddy for India!
YatraGo is India's premier Tours and Travels platform serving passengers, travel agents, vehicle owners, drivers, and local hosts.

The user currently logged in is:
- First Name: ${sanitizedContext.firstName || 'User'}
- Role: ${sanitizedContext.role || 'passenger'}
- Language: ${detectedLanguage || 'en'}

Their current data summary (sanitized for privacy):
${sanitizedContext.contextText || 'No specific data available.'}

Language Instructions:
- Respond in the SAME language the user writes in
- Supported languages: English, Hindi, Marathi, Hinglish
- For Hindi: use Devanagari script (हिंदी में लिखें)
- For Marathi: use Devanagari script (मराठीत लिहा), use proper Marathi grammar and vocabulary — NOT just translated Hindi
- For Hinglish: use Roman script mix naturally (e.g. "Aapki booking confirm ho gayi hai Yaara! 🚗")
- For English: friendly, conversational, clear English
- NEVER mix scripts in one response

Core Behavior & Persona Rules:
1. Tone: Friendly, concise, helpful, and slightly informal. Use occasional travel emojis like 🚗 🏔️ 🎒 ✨ to feel like a warm local travel buddy.
2. Structure: Always keep responses under 3 short paragraphs. Be direct and easy to read on mobile.
3. Offerings: If the user asks about routes, cabs, rides, or trips, mention that YatraGo handles verified intercity rides and curated holiday packages across India.
4. Navigation Guidance: Proactively suggest checking the "Search Trips" tab for intercity cabs/buses or the "Holiday Packages" tab when relevant to their query.
5. No Fake Reference Numbers: Never invent or hallucinate fake booking reference numbers, ticket IDs, or PNRs. Direct users to use the app's official booking flow or check their "My Trips" section.
6. Support Escalation: If their issue involves complex disputes or refund requests that need human intervention, warmly offer to raise a support ticket.
7. Truthfulness: Never invent wallet balances or trip details not present in their data summary above. If data isn't available, suggest where they can view it inside the app.`;
}

// ============================================================
// AI PROVIDER API CALLS
// ============================================================

// 1. Google Gemini 2.0 Flash (Primary)
async function callGemini(systemPrompt, chatHistory, userMessage, apiKey) {
  const contents = [];
  for (const msg of chatHistory.slice(-6)) {
    contents.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  }
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 400, temperature: 0.7 }
      }),
      signal: AbortSignal.timeout(15000)
    }
  );
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}

// 2. Groq Llama 3.3 70B (Speed Fallback)
async function callGroq(systemPrompt, chatHistory, userMessage, apiKey) {
  const messages = [{ role: 'system', content: systemPrompt }];
  for (const msg of chatHistory.slice(-6)) {
    messages.push({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  }
  messages.push({ role: 'user', content: userMessage });

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 400,
      temperature: 0.7
    }),
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq returned empty response');
  return text;
}

// 3. ChatGPT GPT-4o mini (Complex Queries)
async function callOpenAI(systemPrompt, chatHistory, userMessage, apiKey) {
  const messages = [{ role: 'system', content: systemPrompt }];
  for (const msg of chatHistory.slice(-6)) {
    messages.push({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  }
  messages.push({ role: 'user', content: userMessage });

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 400,
      temperature: 0.7
    }),
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI returned empty response');
  return text;
}

// 4. Claude Haiku (Emergency Fallback)
async function callClaude(systemPrompt, chatHistory, userMessage, apiKey) {
  const messages = [];
  for (const msg of chatHistory.slice(-6)) {
    messages.push({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  }
  messages.push({ role: 'user', content: userMessage });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: systemPrompt,
      messages
    }),
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) throw new Error(`Claude HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Claude returned empty response');
  return text;
}

// ============================================================
// MAIN HANDLER
// ============================================================
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Check client IP rate limit (Priority 6 API Rate Limiting)
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!checkIpRateLimit(clientIp)) {
    console.warn(`[Rate Limit] IP ${clientIp} exceeded 20 req/min threshold.`);
    return res.status(429).json({ error: 'Too many requests. Please try again after a minute.' });
  }

  try {
    const { message, userContext, chatHistory = [], detectedLanguage = 'en', messageCount = 0 } = req.body;

    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Retrieve secret keys (supporting both GROQ_API_KEY and GROK_API_KEY alias)
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

    // Validate that at least ONE AI provider key is configured
    const allKeys = [GEMINI_API_KEY, GROQ_API_KEY, OPENAI_API_KEY, CLAUDE_API_KEY];
    if (!allKeys.some(key => Boolean(key))) {
      console.error('CRITICAL: No AI provider API keys found in environment variables.');
      return res.status(500).json({ 
        error: 'Service configuration error'
      });
    }

    // Log warnings server-side for any missing secondary fallback keys without failing the request
    if (!GEMINI_API_KEY) console.warn('Warning: GEMINI_API_KEY is missing. Gemini routing disabled.');
    if (!GROQ_API_KEY) console.warn('Warning: GROQ_API_KEY is missing. Groq fallback disabled.');
    if (!OPENAI_API_KEY) console.warn('Warning: OPENAI_API_KEY is missing. OpenAI routing disabled.');
    if (!CLAUDE_API_KEY) console.warn('Warning: CLAUDE_API_KEY is missing. Claude fallback disabled.');

    // 1. Sanitize user context for privacy (DPDP Act 2023)
    const sanitizedContext = sanitizeUserContext(userContext);
    const systemPrompt = buildSystemPrompt(sanitizedContext, detectedLanguage);

    // 2. Classify query complexity
    const complexity = classifyComplexity(message, messageCount, chatHistory);

    // 3. Define provider routing chain
    // Simple -> Gemini -> Groq -> OpenAI -> Claude
    // Complex -> OpenAI -> Gemini -> Groq -> Claude
    const providerOrder = complexity === 'complex'
      ? ['openai', 'gemini', 'groq', 'claude']
      : ['gemini', 'groq', 'openai', 'claude'];

    const providers = {
      gemini: { call: callGemini, key: GEMINI_API_KEY },
      groq: { call: callGroq, key: GROQ_API_KEY },
      openai: { call: callOpenAI, key: OPENAI_API_KEY },
      claude: { call: callClaude, key: CLAUDE_API_KEY }
    };

    let reply = null;
    let usedProvider = null;
    let fallbackUsed = false;
    let fallbackReason = null;
    let responseTimeMs = 0;

    // If query is complex, record complex_query as initial reason if OpenAI is picked
    if (complexity === 'complex') {
      fallbackReason = 'complex_query';
    }

    for (let i = 0; i < providerOrder.length; i++) {
      const providerName = providerOrder[i];
      const provider = providers[providerName];

      // Skip if no API key configured
      if (!provider.key) {
        if (i === 0 && complexity === 'complex') fallbackReason = 'error';
        continue;
      }
      // Skip if rate limited
      if (!checkRateLimit(providerName)) {
        if (!fallbackReason) fallbackReason = 'rate_limit';
        continue;
      }

      const startTime = Date.now();
      try {
        reply = await provider.call(systemPrompt, chatHistory, message, provider.key);
        responseTimeMs = Date.now() - startTime;
        usedProvider = providerName;
        if (i > 0) {
          fallbackUsed = true;
          if (!fallbackReason) fallbackReason = 'error';
        }
        break;
      } catch (err) {
        console.error(`[AI Router] ${providerName} failed:`, err.message);
        if (!fallbackReason) fallbackReason = 'error';
        continue;
      }
    }

    if (!reply) {
      // All providers failed
      const errorMessages = {
        en: "Yaara is busy right now. Please try again in a moment or raise a support ticket 🙏",
        hi: "यारा अभी व्यस्त है। कृपया थोड़ी देर बाद कोशिश करें या सपोर्ट टिकट बनाएं 🙏",
        mr: "यारा सध्या व्यस्त आहे। कृपया थोड्या वेळाने पुन्हा प्रयत्न करा 🙏",
        hinglish: "Abhi Yaara busy hai. Thodi der mein try karein ya support ticket raise karein 🙏"
      };
      return res.status(200).json({
        reply: errorMessages[detectedLanguage] || errorMessages.en,
        aiProvider: 'error',
        responseTimeMs: 0,
        fallbackUsed: true,
        fallbackReason: fallbackReason || 'error',
        quickReplies: ['🎫 Raise Support Ticket']
      });
    }

    const quickReplies = generateQuickReplies(reply, sanitizedContext.role);

    return res.status(200).json({
      reply,
      aiProvider: usedProvider,
      responseTimeMs,
      fallbackUsed,
      fallbackReason,
      quickReplies
    });

  } catch (err) {
    console.error('[AI Router] Unexpected error:', err);
    return res.status(500).json({
      reply: "Something went wrong. Please try again or raise a support ticket.",
      aiProvider: 'error',
      responseTimeMs: 0,
      fallbackUsed: true,
      fallbackReason: 'error',
      quickReplies: ['🎫 Raise Support Ticket']
    });
  }
}

