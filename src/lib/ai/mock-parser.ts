// Mock AI parser for testing without OpenAI API key

import { ParsedSubscription } from './parser';

// Map of known services to mock parsed data
const MOCK_SUBSCRIPTIONS: Record<string, Partial<ParsedSubscription>> = {
  netflix: {
    serviceName: 'Netflix',
    amount: 15.99,
    billingCycle: 'monthly',
  },
  spotify: {
    serviceName: 'Spotify',
    amount: 9.99,
    billingCycle: 'monthly',
  },
  adobe: {
    serviceName: 'Adobe Creative Cloud',
    amount: 54.99,
    billingCycle: 'monthly',
  },
  openai: {
    serviceName: 'ChatGPT Plus',
    amount: 20.00,
    billingCycle: 'monthly',
  },
  chatgpt: {
    serviceName: 'ChatGPT Plus',
    amount: 20.00,
    billingCycle: 'monthly',
  },
  gym: {
    serviceName: 'Gym Membership',
    amount: 45.00,
    billingCycle: 'monthly',
  },
  'planet fitness': {
    serviceName: 'Planet Fitness',
    amount: 45.00,
    billingCycle: 'monthly',
  },
  disney: {
    serviceName: 'Disney+',
    amount: 13.99,
    billingCycle: 'monthly',
  },
  youtube: {
    serviceName: 'YouTube Premium',
    amount: 13.99,
    billingCycle: 'monthly',
  },
  amazon: {
    serviceName: 'Amazon Prime',
    amount: 14.99,
    billingCycle: 'monthly',
  },
  hulu: {
    serviceName: 'Hulu',
    amount: 17.99,
    billingCycle: 'monthly',
  },
  hbo: {
    serviceName: 'HBO Max',
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
      // Try to extract actual amount from email
      const extractedAmount = extractAmount(body) || extractAmount(subject);
      const extractedDate = extractDate(body);
      
      return {
        serviceName: data.serviceName!,
        amount: extractedAmount || data.amount!,
        currency: 'USD',
        billingCycle: data.billingCycle as 'monthly' | 'yearly' | 'weekly',
        nextBillingDate: extractedDate,
        cancellationUrl: null,
        confidence: extractedAmount ? 0.9 : 0.7,
      };
    }
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
      results.push(parsed);
    }
  }
  
  return results;
}
