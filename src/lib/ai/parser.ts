// OpenAI GPT-4 integration for parsing subscription emails

import OpenAI from 'openai';

export interface ParsedSubscription {
  serviceName: string;
  description: string | null;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly' | 'weekly';
  nextBillingDate: string | null;
  cancellationUrl: string | null;
  confidence: number;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiting config - reduced for Vercel 60s timeout
const RETRY_DELAYS = [3000, 5000, 8000]; // Faster retries for serverless
const MIN_DELAY_BETWEEN_REQUESTS = 500; // 500ms between requests

// Simple delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Track last request time for rate limiting
let lastRequestTime = 0;

const SYSTEM_PROMPT = `You are an AI that extracts subscription/billing information from emails.

Your job: Determine if this email is about a recurring subscription or one-time purchase, and extract details.

IMPORTANT RULES:
1. Look for ANY payment, receipt, invoice, or billing email
2. Pay attention to CURRENCY symbols: $ (USD), £ (GBP), € (EUR), ₦ (NGN), ¥ (JPY), ₹ (INR)
3. Extract the service/company name (e.g. "Spotify", "Apple", "Google").
4. Extract the SPECIFIC product or plan name as "description" (e.g. "Premium Duo", "iCloud+ 50GB", "Google One (100GB)").
5. If you see "monthly", "annual", "subscription", "recurring", "renews" - it's likely a subscription
6. Even one-time purchases from subscription services (like Suno, Spotify, Netflix) should be reported

DATE EXTRACTION:
- Look for "renews on", "next payment", "billing date", "will be charged on"
- Format as YYYY-MM-DD

CANCELLATION URL EXTRACTION:
- Look for links with text: "Cancel", "Unsubscribe", "Manage Subscription", "Cancel Subscription", "Manage Account"
- Extract the full URL

Return ONLY valid JSON:
{
  "isSubscription": true/false,
  "serviceName": "Company Name",
  "description": "Plan Name or Product Details",
  "amount": 9.99,
  "currency": "USD",
  "billingCycle": "monthly" | "yearly" | "weekly",
  "nextBillingDate": "YYYY-MM-DD" | null,
  "cancellationUrl": "https://..." | null,
  "confidence": 0.0 to 1.0
}

If NOT a subscription or billing email, return: {"isSubscription": false}`;

export async function parseEmailWithAI(
  subject: string,
  from: string,
  body: string
): Promise<ParsedSubscription | null> {
  // Clean and truncate body
  const cleanBody = body
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 2000);
  
  const userPrompt = `Email:
Subject: ${subject}
From: ${from}
Content: ${cleanBody}

Extract subscription/billing info and return JSON.`;

  console.log(`[AI Parser] Parsing email: "${subject.substring(0, 50)}..."`);

  // Rate limiting: ensure minimum delay between requests
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_DELAY_BETWEEN_REQUESTS) {
    const waitTime = MIN_DELAY_BETWEEN_REQUESTS - timeSinceLastRequest;
    console.log(`[AI Parser] Rate limiting: waiting ${waitTime}ms`);
    await delay(waitTime);
  }
  lastRequestTime = Date.now();

  // Retry loop with exponential backoff
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content?.trim();
      console.log(`[AI Parser] Response: ${content?.substring(0, 200)}`);
      
      if (!content) {
        console.log('[AI Parser] No content in response');
        return null;
      }

      // Parse the JSON response
      const parsed = JSON.parse(content);
      
      // Check if it's a subscription
      if (!parsed.isSubscription || parsed.isSubscription === false) {
        console.log('[AI Parser] Not identified as subscription');
        return null;
      }
      
      if (!parsed.serviceName || !parsed.amount) {
        console.log('[AI Parser] Missing serviceName or amount');
        return null;
      }

      const result = {
        serviceName: String(parsed.serviceName),
        description: parsed.description || null,
        amount: parseFloat(parsed.amount) || 0,
        currency: String(parsed.currency || 'USD').toUpperCase(),
        billingCycle: (parsed.billingCycle || 'monthly') as 'monthly' | 'yearly' | 'weekly',
        nextBillingDate: parsed.nextBillingDate || null,
        cancellationUrl: parsed.cancellationUrl || null,
        confidence: parseFloat(parsed.confidence) || 0.8,
      };
      
      console.log(`[AI Parser] Extracted: ${result.serviceName} - ${result.currency} ${result.amount}`);
      return result;
    } catch (error: unknown) {
      // Check if it's a rate limit error
      const isRateLimit = error instanceof Error && 
        (error.message.includes('429') || error.message.includes('rate limit'));
      
      if (isRateLimit && attempt < RETRY_DELAYS.length) {
        const retryDelay = RETRY_DELAYS[attempt];
        console.log(`[AI Parser] Rate limited, retrying in ${retryDelay}ms (attempt ${attempt + 1}/${RETRY_DELAYS.length})`);
        await delay(retryDelay);
        continue;
      }
      
      // Log error and return null to trigger fallback
      console.error('[AI Parser] Error (will use fallback):', error instanceof Error ? error.message : error);
      return null;
    }
  }
  
  return null;
}

// =============================================================================
// BATCHED AI PARSER - Process 5 emails per API call to reduce RPM usage
// =============================================================================

interface EmailInput {
  id: string;
  subject: string;
  from: string;
  body: string;
}

interface BatchedResult {
  id: string;
  parsed: ParsedSubscription | null;
}

const BATCH_SYSTEM_PROMPT = `You extract subscription/billing info from emails. You will receive 1-5 emails.

BE LENIENT - if unsure, mark as subscription with needsReview=true. Better to include than miss.

For EACH email, extract:
- serviceName: Company name (from sender or content)
- description: Plan name or product details (e.g. "Premium", "100GB", "Family Plan")
- amount: The cost (number only, e.g. 9.99 or 28500). Use 0 if not found.
- currency: USD, GBP, EUR, NGN, JPY, INR
- billingCycle: monthly, yearly, or weekly
- nextBillingDate: Look for phrases like "renews on", "next payment", "billing date", "will be charged on". Format as YYYY-MM-DD. If not found, use null.
- cancellationUrl: Look for links with text like "cancel", "unsubscribe", "manage subscription", "cancel subscription", "manage account". Extract the URL. If not found, use null.
- isSubscription: true if ANY billing indicator (receipt, payment, invoice, subscription, charged, etc.)
- needsReview: true if uncertain, false if confident

CURRENCY RULES:
- $ = USD, £ = GBP, € = EUR, ₦ = NGN, ¥ = JPY, ₹ = INR
- For "₦28,500.00/month" → amount=28500, currency=NGN

DATE EXTRACTION:
- Look for "renews on January 15, 2024" → nextBillingDate: "2024-01-15"
- Look for "next billing: 02/15/2024" → nextBillingDate: "2024-02-15"
- Look for "will be charged on 2024-03-01" → nextBillingDate: "2024-03-01"

CANCELLATION URL EXTRACTION:
- Look for links with anchor text: "Cancel", "Unsubscribe", "Manage Subscription", "Cancel Subscription"
- Common patterns: "https://example.com/cancel", "https://example.com/account/subscription"

IMPORTANT: 
- ANY email about payment, billing, subscription, or receipt should be marked isSubscription=true
- If you can identify a service name but not amount, still include it with amount=0 and needsReview=true
- Only mark isSubscription=false for clearly non-billing emails (newsletters, shipping, security alerts)

Return JSON:
{"results": [
  {"id": "...", "isSubscription": true, "serviceName": "...", "description": "...", "amount": 9.99, "currency": "USD", "billingCycle": "monthly", "nextBillingDate": "2024-01-15", "cancellationUrl": "https://...", "needsReview": false},
  {"id": "...", "isSubscription": false}
]}`;

export async function parseEmailsBatchAI(
  emails: EmailInput[]
): Promise<BatchedResult[]> {
  if (emails.length === 0) return [];
  
  console.log(`[AI Batch] Processing batch of ${emails.length} emails`);
  
  // Build the user prompt with all emails
  const emailsText = emails.map((email, i) => {
    const cleanBody = email.body
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 1500); // Shorter per email since we're batching
    
    return `--- EMAIL ${i + 1} (id: ${email.id}) ---
Subject: ${email.subject}
From: ${email.from}
Content: ${cleanBody}`;
  }).join('\n\n');
  
  const userPrompt = `Extract subscription info from these ${emails.length} emails:\n\n${emailsText}\n\nReturn JSON array with ${emails.length} objects.`;
  
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_DELAY_BETWEEN_REQUESTS) {
    await delay(MIN_DELAY_BETWEEN_REQUESTS - timeSinceLastRequest);
  }
  lastRequestTime = Date.now();
  
  // Retry loop
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: BATCH_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 500, // Enough for 5 small JSON objects
        response_format: { type: 'json_object' },
      });
      
      const content = response.choices[0]?.message?.content?.trim();
      console.log(`[AI Batch] Response received (${content?.length || 0} chars)`);
      
      if (!content) {
        console.log('[AI Batch] No content in response');
        return emails.map(e => ({ id: e.id, parsed: null }));
      }
      
      // Parse JSON - might be wrapped in {"results": [...]} or just [...]
      let parsed = JSON.parse(content);
      if (parsed.results) parsed = parsed.results;
      if (!Array.isArray(parsed)) parsed = [parsed];
      
      // Map results back to emails
      const results: BatchedResult[] = emails.map(email => {
        const match = parsed.find((p: { id?: string }) => p.id === email.id);
        if (!match || !match.isSubscription) {
          return { id: email.id, parsed: null };
        }
        
        return {
          id: email.id,
          parsed: {
            serviceName: String(match.serviceName || 'Unknown'),
            description: match.description || null,
            amount: parseFloat(match.amount) || 0,
            currency: String(match.currency || 'USD').toUpperCase(),
            billingCycle: (match.billingCycle || 'monthly') as 'monthly' | 'yearly' | 'weekly',
            nextBillingDate: match.nextBillingDate || null,
            cancellationUrl: match.cancellationUrl || null,
            confidence: parseFloat(match.confidence) || 0.8,
          },
        };
      });
      
      const found = results.filter(r => r.parsed !== null).length;
      console.log(`[AI Batch] Found ${found}/${emails.length} subscriptions`);
      return results;
      
    } catch (error: unknown) {
      const isRateLimit = error instanceof Error && 
        (error.message.includes('429') || error.message.includes('rate limit'));
      
      if (isRateLimit && attempt < RETRY_DELAYS.length) {
        const retryDelay = RETRY_DELAYS[attempt];
        console.log(`[AI Batch] Rate limited, retrying in ${retryDelay}ms`);
        await delay(retryDelay);
        continue;
      }
      
      console.error('[AI Batch] Error:', error instanceof Error ? error.message : error);
      return emails.map(e => ({ id: e.id, parsed: null }));
    }
  }
  
  return emails.map(e => ({ id: e.id, parsed: null }));
}

// =============================================================================
// COMPREHENSIVE REGEX PARSER - No AI, Pure Pattern Matching
// =============================================================================

// Known subscription services - used to identify and name services accurately
const KNOWN_SERVICES: Record<string, { patterns: RegExp[], displayName: string }> = {
  // Streaming & Entertainment
  netflix: { patterns: [/netflix/i], displayName: 'Netflix' },
  spotify: { patterns: [/spotify/i], displayName: 'Spotify' },
  youtube: { patterns: [/youtube\s*(premium|music|tv)?/i, /yt\s*premium/i], displayName: 'YouTube' },
  apple: { patterns: [/apple\s*(music|tv\+?|one|arcade)?/i, /icloud/i, /apple\.com\/bill/i], displayName: 'Apple' },
  disney: { patterns: [/disney\s*\+?/i], displayName: 'Disney+' },
  hbo: { patterns: [/hbo\s*(max)?/i, /max\.com/i], displayName: 'HBO Max' },
  hulu: { patterns: [/hulu/i], displayName: 'Hulu' },
  amazon: { patterns: [/amazon\s*prime/i, /prime\s*video/i, /audible/i, /kindle\s*unlimited/i], displayName: 'Amazon' },
  
  // Developer & Tech
  github: { patterns: [/github/i], displayName: 'GitHub' },
  namecheap: { patterns: [/namecheap/i], displayName: 'Namecheap' },
  godaddy: { patterns: [/godaddy/i], displayName: 'GoDaddy' },
  cloudflare: { patterns: [/cloudflare/i], displayName: 'Cloudflare' },
  digitalocean: { patterns: [/digitalocean/i, /digital\s*ocean/i], displayName: 'DigitalOcean' },
  vercel: { patterns: [/vercel/i], displayName: 'Vercel' },
  netlify: { patterns: [/netlify/i], displayName: 'Netlify' },
  heroku: { patterns: [/heroku/i], displayName: 'Heroku' },
  aws: { patterns: [/amazon\s*web\s*services/i, /aws/i], displayName: 'AWS' },
  
  // AI & Creative
  openai: { patterns: [/openai/i, /chatgpt/i, /chat\s*gpt/i], displayName: 'OpenAI' },
  suno: { patterns: [/suno/i], displayName: 'Suno' },
  midjourney: { patterns: [/midjourney/i, /mid\s*journey/i], displayName: 'Midjourney' },
  runway: { patterns: [/runway/i, /runwayml/i], displayName: 'Runway' },
  elevenlabs: { patterns: [/elevenlabs/i, /eleven\s*labs/i], displayName: 'ElevenLabs' },
  anthropic: { patterns: [/anthropic/i, /claude/i], displayName: 'Anthropic' },
  adobe: { patterns: [/adobe/i, /creative\s*cloud/i], displayName: 'Adobe' },
  figma: { patterns: [/figma/i], displayName: 'Figma' },
  canva: { patterns: [/canva/i], displayName: 'Canva' },
  
  // Productivity
  notion: { patterns: [/notion/i], displayName: 'Notion' },
  slack: { patterns: [/slack/i], displayName: 'Slack' },
  zoom: { patterns: [/zoom/i], displayName: 'Zoom' },
  microsoft: { patterns: [/microsoft\s*(365)?/i, /office\s*365/i, /onedrive/i, /xbox/i], displayName: 'Microsoft' },
  google: { patterns: [/google\s*(one|workspace|play)/i, /payments-noreply@google/i, /googleplay/i], displayName: 'Google' },
  dropbox: { patterns: [/dropbox/i], displayName: 'Dropbox' },
  
  // Social & Communication
  linkedin: { patterns: [/linkedin\s*premium/i], displayName: 'LinkedIn' },
  twitter: { patterns: [/twitter/i, /x\s*premium/i], displayName: 'Twitter/X' },
  discord: { patterns: [/discord\s*nitro/i], displayName: 'Discord' },
  
  // Finance
  stripe: { patterns: [/stripe/i], displayName: 'Stripe' },
  paypal: { patterns: [/paypal/i], displayName: 'PayPal' },
  quickbooks: { patterns: [/quickbooks/i, /intuit/i], displayName: 'QuickBooks' },
  esusu: { patterns: [/esusu/i], displayName: 'Esusu' },
  wise: { patterns: [/wise\.com/i, /transferwise/i], displayName: 'Wise' },
  
  // Health & Fitness
  peloton: { patterns: [/peloton/i], displayName: 'Peloton' },
  headspace: { patterns: [/headspace/i], displayName: 'Headspace' },
  calm: { patterns: [/calm/i], displayName: 'Calm' },
  luminis: { patterns: [/luminis/i], displayName: 'Luminis Health' },
  
  // VPN & Security
  nordvpn: { patterns: [/nordvpn/i], displayName: 'NordVPN' },
  expressvpn: { patterns: [/expressvpn/i], displayName: 'ExpressVPN' },
  lastpass: { patterns: [/lastpass/i], displayName: 'LastPass' },
  onepassword: { patterns: [/1password/i, /one\s*password/i], displayName: '1Password' },
  
  // News & Education
  medium: { patterns: [/medium\.com/i, /@medium/i], displayName: 'Medium' },
  substack: { patterns: [/substack/i], displayName: 'Substack' },
  coursera: { patterns: [/coursera/i], displayName: 'Coursera' },
  udemy: { patterns: [/udemy/i], displayName: 'Udemy' },
  
  // Telecom
  xfinity: { patterns: [/xfinity/i, /comcast/i], displayName: 'Xfinity' },
  att: { patterns: [/at&t/i, /att\.com/i], displayName: 'AT&T' },
  verizon: { patterns: [/verizon/i], displayName: 'Verizon' },
  tmobile: { patterns: [/t-?mobile/i], displayName: 'T-Mobile' },
};

// Amount extraction patterns - comprehensive multi-currency
const AMOUNT_PATTERNS = [
  // Currency symbol first: $10.99, £20, €15.00, ₦5000
  { regex: /\$\s*([\d,]+\.?\d{0,2})/, currency: 'USD' },
  { regex: /£\s*([\d,]+\.?\d{0,2})/, currency: 'GBP' },
  { regex: /€\s*([\d,]+\.?\d{0,2})/, currency: 'EUR' },
  { regex: /₦\s*([\d,]+\.?\d{0,2})/, currency: 'NGN' },
  { regex: /¥\s*([\d,]+\.?\d{0,2})/, currency: 'JPY' },
  { regex: /₹\s*([\d,]+\.?\d{0,2})/, currency: 'INR' },
  
  // Currency code after: 10.99 USD, 5000 NGN
  { regex: /([\d,]+\.?\d{0,2})\s*USD/i, currency: 'USD' },
  { regex: /([\d,]+\.?\d{0,2})\s*GBP/i, currency: 'GBP' },
  { regex: /([\d,]+\.?\d{0,2})\s*EUR/i, currency: 'EUR' },
  { regex: /([\d,]+\.?\d{0,2})\s*NGN/i, currency: 'NGN' },
  
  // Currency code before: USD 10.99
  { regex: /USD\s*([\d,]+\.?\d{0,2})/i, currency: 'USD' },
  { regex: /GBP\s*([\d,]+\.?\d{0,2})/i, currency: 'GBP' },
  { regex: /EUR\s*([\d,]+\.?\d{0,2})/i, currency: 'EUR' },
  { regex: /NGN\s*([\d,]+\.?\d{0,2})/i, currency: 'NGN' },
  
  // Contextual: "Total: $10.99", "Amount: £20.00" 
  { regex: /(?:total|amount|charged?|paid|price|cost)[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i, currency: 'USD' },
];

// Subject patterns to extract service names dynamically
const SUBJECT_PATTERNS = [
  // "Receipt from Suno" -> Suno
  /receipt\s+from\s+([A-Za-z0-9][A-Za-z0-9\s]{1,20}?)(?:\s*[-#]|$|\s+for)/i,
  // "Your Suno receipt" -> Suno  
  /your\s+([A-Za-z0-9][A-Za-z0-9\s]{1,20}?)\s+(?:receipt|invoice|payment|subscription|order|bill)/i,
  // "Payment to Spotify" -> Spotify
  /(?:payment|charge)\s+(?:to|from)\s+([A-Za-z0-9][A-Za-z0-9\s]{1,20})/i,
  // "Thanks for your Netflix payment" -> Netflix
  /thanks\s+(?:for\s+)?your\s+([A-Za-z0-9][A-Za-z0-9\s]{1,20}?)\s+(?:payment|subscription|order)/i,
  // "Netflix subscription" -> Netflix
  /^([A-Za-z0-9][A-Za-z0-9\s]{1,20}?)\s+(?:subscription|membership|renewal|billing|invoice)/i,
  // "Order confirmation for Suno" -> Suno
  /(?:order|payment|subscription)\s+confirmation\s+(?:for|from)\s+([A-Za-z0-9][A-Za-z0-9\s]{1,20})/i,
  // "Suno - Your receipt" -> Suno
  /^([A-Za-z0-9]+)\s*[-:|]\s*(?:your\s+)?(?:receipt|invoice|order|payment|subscription)/i,
  // "Your order from Amazon" -> Amazon
  /your\s+(?:order|purchase)\s+from\s+([A-Za-z0-9][A-Za-z0-9\s]{1,20})/i,
];

// Sender email patterns
const SENDER_PATTERNS = [
  // billing@netflix.com -> Netflix
  /(?:billing|noreply|no-reply|receipt|invoice|payments?)@([a-z0-9]+)\./i,
  // support@company.com -> Company
  /@([a-z0-9]+)\.(com|io|ai|co|org|net)/i,
];

// =============================================================================
// HTML-TO-TEXT HELPER - AGGRESSIVE VERSION
// =============================================================================
function parseHtmlToText(html: string): string {
  let text = html;
  
  // Remove style blocks (including malformed ones)
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  
  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // CRITICAL: Remove CSS-like content that leaked through
  // Matches patterns like: property: value; or property { ... }
  text = text.replace(/[a-z-]+\s*:\s*[^;$\n]+;/gi, ' '); // property: value;
  text = text.replace(/[a-z-]+\s*\{[^}]*\}/gi, ' '); // selector { rules }
  text = text.replace(/@media[^{]*\{[^}]*\}/gi, ' '); // @media queries
  
  // Remove common email noise patterns
  text = text.replace(/\b(mso-|webkit-|ms-)[a-z-]+/gi, ' '); // Microsoft/Webkit prefixes
  text = text.replace(/\b\d+px\b/gi, ' '); // pixel values
  text = text.replace(/\b#[a-f0-9]{3,8}\b/gi, ' '); // hex colors
  text = text.replace(/\brgba?\([^)]+\)/gi, ' '); // rgb/rgba colors
  text = text.replace(/\b(border|padding|margin|font|line|text|background|color|table|width|height)[a-z-]*\b/gi, ' '); // CSS property names
  text = text.replace(/\b(auto|inherit|none|solid|collapse|hidden|visible|important|normal)\b/gi, ' '); // CSS values
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
  
  // Collapse all whitespace
  text = text.replace(/\s+/g, ' ');
  
  return text.trim();
}

// =============================================================================
// SUBSCRIPTION VERIFICATION
// =============================================================================
function isLikelySubscription(text: string): boolean {
  const lower = text.toLowerCase();
  
  // Reject shipping, password, newsletter emails
  if (/\b(shipping|delivered|tracking|password reset|security alert|newsletter)\b/i.test(lower)) {
    return false;
  }
  
  // Must have billing indicators
  return /\b(receipt|invoice|billing|subscription|charged?|payment|renewal|membership|order confirmation)\b/i.test(lower);
}

// =============================================================================
// CONTEXTUAL AMOUNT EXTRACTION
// =============================================================================
function extractAmount(text: string): { amount: number; currency: string } | null {
  const currencySymbols: Record<string, string> = {
    '$': 'USD', '£': 'GBP', '€': 'EUR', '₦': 'NGN', '¥': 'JPY', '₹': 'INR'
  };
  
  console.log(`[Parser] Searching for amount in: "${text.substring(0, 300).replace(/\n/g, ' ')}..."`);
  
  // PRIORITY 1: Amount with /month or /year suffix (MOST SPECIFIC for subscriptions)
  // Matches: ₦28,500.00/month, $9.99/month, €15/year
  const perPeriodPattern = /([£$€₦¥₹])\s*([\d,]+(?:\.\d{1,2})?)\s*\/\s*(month|mo|year|yr)/gi;
  const perPeriodMatches = [...text.matchAll(perPeriodPattern)];
  
  console.log(`[Parser] Per-period matches found: ${perPeriodMatches.length}`);
  
  for (const match of perPeriodMatches) {
    const amount = parseFloat(match[2].replace(/,/g, ''));
    // Skip zero amounts - likely free trials
    if (amount > 0) {
      const currency = currencySymbols[match[1]] || 'USD';
      console.log(`[Parser] FOUND subscription amount: ${currency} ${amount}/${match[3]}`);
      return { amount, currency };
    }
  }
  
  // PRIORITY 2: Collect ALL currency amounts and pick the first NON-ZERO one
  const symbolFirstPattern = /([£$€₦¥₹])\s*([\d,]+(?:\.\d{1,2})?)/g;
  const symbolMatches = [...text.matchAll(symbolFirstPattern)];
  
  console.log(`[Parser] Symbol-first matches found: ${symbolMatches.length}`);
  
  // Find the first non-zero amount
  for (const match of symbolMatches) {
    const amount = parseFloat(match[2].replace(/,/g, ''));
    console.log(`[Parser] Checking amount: ${match[1]}${match[2]} = ${amount}`);
    // Skip zero amounts and out-of-range amounts
    if (amount > 0) {
      const currency = currencySymbols[match[1]] || 'USD';
      console.log(`[Parser] FOUND valid amount: ${currency} ${amount}`);
      return { amount, currency };
    }
  }
  
  // PRIORITY 3: Amount followed by currency code (10.99 USD)
  const codeAfterPattern = /([\d,]+(?:\.\d{1,2})?)\s*(USD|GBP|EUR|NGN|JPY|INR)\b/gi;
  const codeMatches = [...text.matchAll(codeAfterPattern)];
  
  for (const match of codeMatches) {
    const amount = parseFloat(match[1].replace(/,/g, ''));
    if (amount > 0) {
      console.log(`[Parser] FOUND valid amount: ${match[2].toUpperCase()} ${amount}`);
      return { amount, currency: match[2].toUpperCase() };
    }
  }
  
  // PRIORITY 4: Currency code before amount (USD 10.99)
  const codeBeforePattern = /\b(USD|GBP|EUR|NGN|JPY|INR)\s*([\d,]+(?:\.\d{1,2})?)/gi;
  const codeBeforeMatches = [...text.matchAll(codeBeforePattern)];
  
  for (const match of codeBeforeMatches) {
    const amount = parseFloat(match[2].replace(/,/g, ''));
    if (amount > 0) {
      console.log(`[Parser] FOUND valid amount: ${match[1].toUpperCase()} ${amount}`);
      return { amount, currency: match[1].toUpperCase() };
    }
  }
  
  console.log(`[Parser] No valid non-zero amount found`);
  return null;
}

// =============================================================================
// MAIN PARSER FUNCTION
// =============================================================================
// Simple regex fallback if AI fails completely (runs locally)
export function parseEmailFallback(
  subject: string,
  from: string,
  body: string,
  extractedServiceName?: string
): ParsedSubscription {
  
  // Try to find amount
  const amountMatch = body.match(/(\$|₦|€|£)\s*(\d+(\.\d{2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[2]) : 0;
  const currency = amountMatch ? 
    (amountMatch[1] === '$' ? 'USD' : 
     amountMatch[1] === '₦' ? 'NGN' : 
     amountMatch[1] === '€' ? 'EUR' : 
     amountMatch[1] === '£' ? 'GBP' : 'USD') 
    : 'USD';

  return {
    serviceName: extractedServiceName || 'Unknown Service',
    description: subject, // Use subject as description fallback
    amount,
    currency,
    billingCycle: 'monthly',
    nextBillingDate: null,
    cancellationUrl: null,
    confidence: 0.3
  };
}

