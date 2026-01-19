// Regex-based email filtering for subscription detection

export interface FilteredEmail {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
  matchedKeywords: string[];
  confidence: number;
  extractedServiceName?: string;
}

// Common subscription service patterns - expanded list
const SERVICE_PATTERNS: Record<string, RegExp[]> = {
  // Streaming & Entertainment
  netflix: [/netflix/i, /nflx/i],
  spotify: [/spotify/i],
  youtube: [/youtube premium/i, /youtube music/i, /youtube tv/i],
  apple: [/apple music/i, /icloud/i, /apple tv\+/i, /apple one/i, /apple\.com\/bill/i],
  disney: [/disney\+/i, /disney plus/i],
  hbo: [/hbo max/i, /max\.com/i],
  hulu: [/hulu/i],
  amazon: [/amazon prime/i, /prime video/i, /prime membership/i, /audible/i, /kindle unlimited/i],
  
  // Developer & Tech Tools
  github: [/github/i],
  namecheap: [/namecheap/i],
  godaddy: [/godaddy/i],
  cloudflare: [/cloudflare/i],
  digitalocean: [/digitalocean/i],
  heroku: [/heroku/i],
  vercel: [/vercel/i],
  netlify: [/netlify/i],
  mongodb: [/mongodb/i, /atlas/i],
  aws: [/amazon web services/i, /aws\.amazon/i],
  
  // AI & Creative Tools
  openai: [/openai/i, /chatgpt/i],
  suno: [/suno/i, /suno\.ai/i, /suno\.com/i],
  midjourney: [/midjourney/i],
  runway: [/runway/i, /runwayml/i],
  elevenlabs: [/elevenlabs/i, /eleven labs/i],
  anthropic: [/anthropic/i, /claude/i],
  adobe: [/adobe/i, /creative cloud/i],
  figma: [/figma/i],
  canva: [/canva/i],
  
  // Productivity & Work
  notion: [/notion/i],
  slack: [/slack/i],
  zoom: [/zoom/i],
  microsoft: [/microsoft 365/i, /office 365/i, /onedrive/i, /xbox game pass/i],
  google: [/google one/i, /google workspace/i, /google play/i, /your google play order/i, /google play receipt/i, /payments-noreply@google/i, /googleplay-noreply@google/i],
  dropbox: [/dropbox/i],
  evernote: [/evernote/i],
  todoist: [/todoist/i],
  calendly: [/calendly/i],
  
  // Communication
  linkedin: [/linkedin premium/i],
  twitter: [/twitter/i, /x premium/i, /twitter blue/i],
  discord: [/discord nitro/i],
  telegram: [/telegram premium/i],
  
  // Finance & Business
  stripe: [/stripe/i],
  paypal: [/paypal/i],
  quickbooks: [/quickbooks/i, /intuit/i],
  freshbooks: [/freshbooks/i],
  esusu: [/esusu/i],
  
  // Fitness & Health
  gym: [/gym/i, /fitness/i, /planet fitness/i, /24 hour fitness/i, /anytime fitness/i],
  peloton: [/peloton/i],
  headspace: [/headspace/i],
  calm: [/calm/i],
  luminishealth: [/luminis/i, /luminis health/i],
  
  // VPN & Security
  nordvpn: [/nordvpn/i],
  expressvpn: [/expressvpn/i],
  lastpass: [/lastpass/i],
  onepassword: [/1password/i],
  
  // News & Learning
  medium: [/medium/i],
  substack: [/substack/i],
  coursera: [/coursera/i],
  udemy: [/udemy/i],
  skillshare: [/skillshare/i],
  masterclass: [/masterclass/i],
  
  // Telecom & Utilities
  xfinity: [/xfinity/i, /comcast/i],
  att: [/at&t/i, /att\.com/i],
  verizon: [/verizon/i],
  tmobile: [/t-mobile/i, /tmobile/i],
};

// Keywords that indicate subscription/billing emails - expanded
const SUBSCRIPTION_KEYWORDS = [
  'subscription',
  'recurring',
  'renewal',
  'billing',
  'invoice',
  'receipt',
  'payment',
  'charged',
  'charge',
  'monthly',
  'yearly',
  'annual',
  'membership',
  'premium',
  'plan',
  'auto-renew',
  'next billing',
  'your order',
  'order confirmation',
  'payment received',
  'payment successful',
  'thank you for your purchase',
  'thank you for your order',
  'renews on',
  'will be charged',
  'credit card',
  'debit card',
  'transaction',
  'pro plan',
  'plus plan',
  'starter plan',
  'business plan',
  'your account',
  'confirmation',
  'statement',
  'trial',
  'free trial',
  'started',
  'signed up',
  'activated',
  'welcome to',
  'thanks for subscribing',
  'total',
  'amount',
  'price',
];

// Patterns to extract amounts - multi-currency support
const AMOUNT_PATTERNS = [
  // USD
  /\$[\d,]+\.?\d*/g,
  /USD\s*[\d,]+\.?\d*/gi,
  // Nigerian Naira
  /₦[\d,]+\.?\d*/g,
  /NGN\s*[\d,]+\.?\d*/gi,
  /naira\s*[\d,]+\.?\d*/gi,
  // Euro
  /€[\d,]+\.?\d*/g,
  /EUR\s*[\d,]+\.?\d*/gi,
  // British Pound
  /£[\d,]+\.?\d*/g,
  /GBP\s*[\d,]+\.?\d*/gi,
  // Generic
  /[\d,]+\.?\d*\s*dollars?/gi,
  /[\d,]+\.?\d*\s*(per month|\/month|\/mo)/gi,
];

// Patterns to extract dates
const DATE_PATTERNS = [
  /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/gi,
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}/g,
  /\b\d{4}-\d{2}-\d{2}/g,
];

// Dynamic patterns to extract service names from email subjects/senders
const DYNAMIC_SERVICE_PATTERNS = [
  // "Receipt from Suno", "Receipt from Netflix", etc.
  /receipt\s+from\s+([a-z0-9\s]+)/i,
  // "Your Suno receipt", "Your Netflix invoice"
  /your\s+([a-z0-9\s]+?)\s+(receipt|invoice|payment|subscription|order)/i,
  // "Payment to Spotify", "Charge from Apple"
  /(payment|charge)\s+(to|from)\s+([a-z0-9\s]+)/i,
  // "Thanks for your Xfinity payment"
  /thanks\s+for\s+your\s+([a-z0-9\s]+?)\s+payment/i,
  // "[Service] subscription", "[Service] membership"
  /([a-z0-9\s]+?)\s+(subscription|membership|plan|premium)/i,
];

// Extract service name from "Receipt from X" type patterns
function extractDynamicServiceName(subject: string, from: string): string | null {
  const text = `${subject} ${from}`;
  
  for (const pattern of DYNAMIC_SERVICE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      // Get the last captured group (service name)
      const serviceName = match[match.length >= 3 ? 3 : 1] || match[1];
      if (serviceName) {
        // Clean up and capitalize
        const cleaned = serviceName.trim().replace(/\s+/g, ' ');
        // Skip if it's just common words
        if (!['your', 'our', 'the', 'a', 'an', 'of', 'for'].includes(cleaned.toLowerCase())) {
          return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        }
      }
    }
  }
  
  return null;
}

// Extract domain name from sender email as a fallback
function extractDomainFromSender(from: string): string | null {
  // Match domain from email: billing@google.com -> google
  const domainMatch = from.match(/@([a-z0-9-]+)\.(?:com|io|ai|co|org|net|dev|app)/i);
  if (domainMatch) {
    const domain = domainMatch[1].replace(/-/g, ' ');
    // Skip generic domains
    if (['gmail', 'yahoo', 'outlook', 'hotmail', 'mail', 'email'].includes(domain.toLowerCase())) {
      return null;
    }
    // Capitalize
    return domain.charAt(0).toUpperCase() + domain.slice(1).toLowerCase();
  }
  return null;
}

// Keywords that strongly indicate non-subscription emails (one-off purchases/shipping)
const EXCLUSION_KEYWORDS = [
  'shipped',
  'shipping',
  'tracking number',
  'track your package',
  'out for delivery',
  'arriving',
  'delivered',
  'shipment',
  'verification code',
  'password reset',
  'login alert',
  'security alert',
  'refund issued',
  'refund processed',
  'refund sent',
  'return started',
  'return label',
  'return processed',
  'job alert',
  'job recommendation',
  'new position',
  'opportunities',
  'apply now',
  'linkedin', // Unless it's LinkedIn Premium (which usually says "Receipt" or "Subscription")
  // Newsletter/Content specific
  'daily digest',
  'weekly digest',
  'monthly digest',
  'new post',
  'published',
  'read online',
  'view in browser',
  'story from',
  // Bank statements (exclude these, but keep single "statement" for billing statements)
  'account statement',
  'bank statement',
  'available balance',
  'checking account',
  'savings account',
];

export function filterSubscriptionEmails(
  emails: { id: string; subject: string; from: string; date: string; body: string }[]
): FilteredEmail[] {
  const filtered: FilteredEmail[] = [];

  for (const email of emails) {
    const content = `${email.subject} ${email.from} ${email.body}`.toLowerCase();
    
    // 0. Negative Filter: Exclude shipping/physical goods/alerts immediately
    if (EXCLUSION_KEYWORDS.some(kw => content.includes(kw))) {
      continue;
    }

    // 0b. Exclude bank statements with combination patterns
    if (content.includes('monthly statement') && content.includes('account balance')) {
      continue;
    }

    const matchedKeywords: string[] = [];
    let confidence = 0;
    let extractedServiceName: string | null = null;

    // Check for subscription keywords
    for (const keyword of SUBSCRIPTION_KEYWORDS) {
      if (content.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
        confidence += 0.1;
      }
    }

    // Check for known service patterns
    let knownServiceFound = false;
    for (const [service, patterns] of Object.entries(SERVICE_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          matchedKeywords.push(service);
          extractedServiceName = service.charAt(0).toUpperCase() + service.slice(1);
          confidence += 0.3;
          knownServiceFound = true;
          break;
        }
      }
      if (knownServiceFound) break;
    }

    if (!knownServiceFound) {
      const dynamicName = extractDynamicServiceName(email.subject, email.from);
      if (dynamicName) {
        extractedServiceName = dynamicName;
        matchedKeywords.push(`dynamic:${dynamicName}`);
        confidence += 0.25; // Slightly lower confidence for unknown services
      } else {
        // Fallback: Extract domain from sender email
        const domainName = extractDomainFromSender(email.from);
        if (domainName) {
          extractedServiceName = domainName;
          matchedKeywords.push(`domain:${domainName}`);
          confidence += 0.15; // Lower confidence for domain-only extraction
        }
      }
    }

    // Check for amount patterns (strong indicator of billing email)
    let hasAmount = false;
    for (const pattern of AMOUNT_PATTERNS) {
      pattern.lastIndex = 0; // Reset regex state
      if (pattern.test(content)) {
        hasAmount = true;
        confidence += 0.2;
        break;
      }
    }

    // Check for payment processors/stores
    // FIXED: email.from does not contain "from:", it just has the name/email
    const isPaymentProvider = /(apple|google|paypal|stripe|amazon|prime|klarna)/i.test(email.from);

    // Check for strong keywords
    const hasStrongKeyword = matchedKeywords.some(k => 
      ['subscription', 'recurring', 'renewal', 'membership', 'plan', 'billing', 'trial', 'order receipt', 'your transaction'].includes(k)
    );
    
    // Check for medium keywords (receipt, invoice) which need corroboration
    const hasMediumKeyword = matchedKeywords.some(k => 
      ['receipt', 'invoice', 'order', 'payment', 'transaction'].includes(k)
    );

    // OPTIMIZED LOGIC:
    // 1. Known Service (High Confidence)
    // 2. Extracted Service Name (Medium Confidence)
    // 3. Strong Keyword (Subscription/Recurring) AND (Amount OR Payment Provider)
    // 4. Medium Keyword (Receipt) AND Payment Provider AND Amount
    
    const shouldInclude = 
      knownServiceFound || 
      !!extractedServiceName ||
      hasStrongKeyword || // Relaxed: Just a strong keyword is usually enough for a potential list
      (isPaymentProvider && hasAmount) || // Apple Receipt: $5.99
      (isPaymentProvider && hasMediumKeyword) || // Payment Provider + "Order"/"Receipt" (catches $0.00 trials)
      (hasMediumKeyword && hasAmount && matchedKeywords.length >= 2); // Receipt + Amount + one other hint 
      knownServiceFound || // Known streaming/software service
      extractedServiceName !== null || // Found a service name
      (hasAmount && matchedKeywords.length > 0) || // Has $ and keywords
      matchedKeywords.length >= 2 || // Multiple billing keywords
      (hasStrongKeyword) || // Single strong keyword (captures zero-sum trials)
      (isPaymentProvider && hasAmount); // From Apple/Google + Money involved

    if (shouldInclude) {
      filtered.push({
        id: email.id,
        subject: email.subject,
        from: email.from,
        date: email.date,
        body: email.body,
        matchedKeywords: [...new Set(matchedKeywords)], // Remove duplicates
        confidence: Math.min(confidence, 1.0),
        extractedServiceName: extractedServiceName || undefined,
      });
    }
  }

  // Sort by confidence (highest first)
  filtered.sort((a, b) => b.confidence - a.confidence);

  return filtered;
}

// Extract potential subscription data from email content
export function extractSubscriptionHints(email: FilteredEmail): {
  possibleService: string | null;
  possibleAmount: number | null;
  possibleDate: string | null;
} {
  const content = `${email.subject} ${email.body}`;
  
  // Use extracted service name if available
  let possibleService: string | null = email.extractedServiceName || null;
  
  // If not, find service name from patterns
  if (!possibleService) {
    for (const [service, patterns] of Object.entries(SERVICE_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          // Capitalize first letter
          possibleService = service.charAt(0).toUpperCase() + service.slice(1);
          break;
        }
      }
      if (possibleService) break;
    }
  }

  // Find amount
  let possibleAmount: number | null = null;
  for (const pattern of AMOUNT_PATTERNS) {
    pattern.lastIndex = 0;
    const match = content.match(pattern);
    if (match) {
      const amountStr = match[0].replace(/[^\d.]/g, '');
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount >= 0) {
        possibleAmount = amount;
        break;
      }
    }
  }

  // Find date
  let possibleDate: string | null = null;
  for (const pattern of DATE_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      possibleDate = match[0];
      break;
    }
  }

  return { possibleService, possibleAmount, possibleDate };
}
