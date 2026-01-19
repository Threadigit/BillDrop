// Mock AI parser for testing without OpenAI API key

import { ParsedSubscription } from './parser';

// Map of known services to mock parsed data
const MOCK_SUBSCRIPTIONS: Record<string, Partial<ParsedSubscription>> = {
  netflix: {
    serviceName: 'Netflix',
    description: 'Standard Plan',
    amount: 15.99,
    billingCycle: 'monthly',
  },
  spotify: {
    serviceName: 'Spotify',
    description: 'Premium Individual',
    amount: 9.99,
    billingCycle: 'monthly',
  },
  adobe: {
    serviceName: 'Adobe Creative Cloud',
    description: 'Creative Cloud All Apps',
    amount: 54.99,
    billingCycle: 'monthly',
  },
  openai: {
    serviceName: 'ChatGPT Plus',
    description: 'ChatGPT Plus Subscription',
    amount: 20.00,
    billingCycle: 'monthly',
  },
  chatgpt: {
    serviceName: 'ChatGPT Plus',
    description: 'ChatGPT Plus Subscription',
    amount: 20.00,
    billingCycle: 'monthly',
  },
  gym: {
    serviceName: 'Gym Membership',
    description: 'Monthly Access',
    amount: 45.00,
    billingCycle: 'monthly',
  },
  'planet fitness': {
    serviceName: 'Planet Fitness',
    description: 'Black Card Membership',
    amount: 45.00,
    billingCycle: 'monthly',
  },
  disney: {
    serviceName: 'Disney+',
    description: 'Disney+ Basic',
    amount: 13.99,
    billingCycle: 'monthly',
  },
  youtube: {
    serviceName: 'YouTube Premium',
    description: 'Individual Membership',
    amount: 13.99,
    billingCycle: 'monthly',
  },
  amazon: {
    serviceName: 'Amazon Prime',
    description: 'Prime Membership',
    amount: 14.99,
    billingCycle: 'monthly',
  },
  hulu: {
    serviceName: 'Hulu',
    description: 'Hulu (No Ads)',
    amount: 17.99,
    billingCycle: 'monthly',
  },
  hbo: {
    serviceName: 'HBO Max',
    description: 'Ad-Free Plan',
    amount: 15.99,
    billingCycle: 'monthly',
  },
};

// Extract amount from text
function extractAmount(text: string): number | null {
  const match = text.match(/\$(\d+\.?\d*)/);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
}

// Extract billing date from text
function extractDate(text: string): string | null {
  // Try various date formats
  const patterns = [
    /(\d{4}-\d{2}-\d{2})/,
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i,
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const date = new Date(match[0]);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch {
        continue;
      }
    }
  }
  
  return null;
}

// Extract currency and amount from text
function extractCurrencyAmount(text: string): { amount: number; currency: string } | null {
  const patterns = [
    { regex: /\$\s*([\d,]+\.?\d*)/, currency: 'USD' },
    { regex: /£\s*([\d,]+\.?\d*)/, currency: 'GBP' },
    { regex: /€\s*([\d,]+\.?\d*)/, currency: 'EUR' },
    { regex: /₦\s*([\d,]+\.?\d*)/, currency: 'NGN' },
    { regex: /¥\s*([\d,]+\.?\d*)/, currency: 'JPY' },
    { regex: /₹\s*([\d,]+\.?\d*)/, currency: 'INR' },
    { regex: /([\d,]+\.?\d*)\s*USD/i, currency: 'USD' },
    { regex: /([\d,]+\.?\d*)\s*GBP/i, currency: 'GBP' },
    { regex: /([\d,]+\.?\d*)\s*EUR/i, currency: 'EUR' },
    { regex: /([\d,]+\.?\d*)\s*NGN/i, currency: 'NGN' },
  ];
  
  for (const { regex, currency } of patterns) {
    const match = text.match(regex);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(amount) && amount > 0) {
        return { amount, currency };
      }
    }
  }
  return null;
}

// Extract cancellation URL from text
function extractCancellationUrl(text: string): string | null {
  const urlPatterns = [
    /https?:\/\/[^\s<>"]+cancel[^\s<>"]*/i,
    /https?:\/\/[^\s<>"]+unsubscribe[^\s<>"]*/i,
    /https?:\/\/[^\s<>"]+manage[^\s<>"]*subscription[^\s<>"]*/i,
    /https?:\/\/[^\s<>"]+account[^\s<>"]*settings[^\s<>"]*/i,
  ];
  
  for (const pattern of urlPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return null;
}

// Calculate next billing date from billing cycle
function calculateNextBillingDate(billingCycle: 'monthly' | 'yearly' | 'weekly'): string {
  const today = new Date();
  if (billingCycle === 'monthly') {
    today.setMonth(today.getMonth() + 1);
  } else if (billingCycle === 'yearly') {
    today.setFullYear(today.getFullYear() + 1);
  } else if (billingCycle === 'weekly') {
    today.setDate(today.getDate() + 7);
  }
  return today.toISOString().split('T')[0];
}

// Extract domain from sender email for fallback service name
function extractDomainFromSender(from: string): string | null {
  const emailMatch = from.match(/[\w.-]+@([\w.-]+)/);
  if (emailMatch) {
    const domain = emailMatch[1].split('.')[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  }
  return null;
}

export async function mockParseEmail(
  subject: string,
  from: string,
  body: string
): Promise<ParsedSubscription | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const content = `${subject} ${from} ${body}`.toLowerCase();
  
  // Find matching service
  for (const [key, data] of Object.entries(MOCK_SUBSCRIPTIONS)) {
    if (content.includes(key)) {
      // Try to extract actual amount and currency from email
      const extracted = extractCurrencyAmount(body) || extractCurrencyAmount(subject);
      const extractedDate = extractDate(body);
      const cancellationUrl = extractCancellationUrl(body);
      
      const billingCycle = data.billingCycle as 'monthly' | 'yearly' | 'weekly';
      
      return {
        serviceName: data.serviceName!,
        description: data.description || null,
        amount: extracted?.amount || data.amount!,
        currency: extracted?.currency || 'USD',
        billingCycle: billingCycle,
        nextBillingDate: extractedDate || calculateNextBillingDate(billingCycle),
        cancellationUrl: cancellationUrl,
        confidence: extracted ? 0.9 : 0.7,
      };
    }
  }
  
  // Fallback: Try to extract from unknown service
  const extracted = extractCurrencyAmount(body) || extractCurrencyAmount(subject);
  if (extracted && extracted.amount > 0) {
    const serviceName = extractDomainFromSender(from) || 'Unknown Service';
    const billingCycle: 'monthly' | 'yearly' | 'weekly' = 
      content.includes('year') || content.includes('annual') ? 'yearly' :
      content.includes('week') ? 'weekly' : 'monthly';
    
    return {
      serviceName,
      description: null,
      amount: extracted.amount,
      currency: extracted.currency,
      billingCycle,
      nextBillingDate: extractDate(body) || calculateNextBillingDate(billingCycle),
      cancellationUrl: extractCancellationUrl(body),
      confidence: 0.5,
    };
  }
  
  return null;
}

export async function mockParseEmails(
  emails: { subject: string; from: string; body: string }[]
): Promise<ParsedSubscription[]> {
  const results: ParsedSubscription[] = [];
  
  for (const email of emails) {
    const parsed = await mockParseEmail(email.subject, email.from, email.body);
    if (parsed) {
      // Skip zero-amount non-trials (same as AI path)
      const isTrial = (parsed.description?.toLowerCase().includes('trial') || 
                      parsed.serviceName.toLowerCase().includes('trial'));
      if (parsed.amount === 0 && !isTrial) {
        continue;
      }
      results.push(parsed);
    }
  }
  
  return results;
}
