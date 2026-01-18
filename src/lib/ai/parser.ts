// OpenAI GPT-4 integration for parsing subscription emails

import OpenAI from 'openai';

export interface ParsedSubscription {
  serviceName: string;
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

const SYSTEM_PROMPT = `You are an AI that extracts subscription/billing information from emails.

Your job: Determine if this email is about a recurring subscription or one-time purchase, and extract details.

IMPORTANT RULES:
1. Look for ANY payment, receipt, invoice, or billing email
2. Pay attention to CURRENCY symbols: $ (USD), £ (GBP), € (EUR), ₦ (NGN), ¥ (JPY), ₹ (INR)
3. Extract the service/company name from the sender or email content
4. If you see "monthly", "annual", "subscription", "recurring", "renews" - it's likely a subscription
5. Even one-time purchases from subscription services (like Suno, Spotify, Netflix) should be reported

Return ONLY valid JSON:
{
  "isSubscription": true/false,
  "serviceName": "Company Name",
  "amount": 9.99,
  "currency": "USD",
  "billingCycle": "monthly" | "yearly" | "weekly",
  "nextBillingDate": "YYYY-MM-DD" | null,
  "cancellationUrl": "url" | null,
  "confidence": 0.0 to 1.0
}

If NOT a subscription or billing email, return: {"isSubscription": false}`;

export async function parseEmailWithAI(
  subject: string,
  from: string,
  body: string
): Promise<ParsedSubscription | null> {
  try {
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
      amount: parseFloat(parsed.amount) || 0,
      currency: String(parsed.currency || 'USD').toUpperCase(),
      billingCycle: (parsed.billingCycle || 'monthly') as 'monthly' | 'yearly' | 'weekly',
      nextBillingDate: parsed.nextBillingDate || null,
      cancellationUrl: parsed.cancellationUrl || null,
      confidence: parseFloat(parsed.confidence) || 0.8,
    };
    
    console.log(`[AI Parser] Extracted: ${result.serviceName} - ${result.currency} ${result.amount}`);
    return result;
  } catch (error) {
    console.error('[AI Parser] Error:', error);
    return null;
  }
}

// Fallback parser when AI is unavailable or fails
export function parseEmailFallback(
  subject: string,
  from: string,
  body: string,
  extractedServiceName?: string
): ParsedSubscription | null {
  const content = `${subject} ${from} ${body}`.toLowerCase();
  
  // Try to extract service name
  let serviceName = extractedServiceName;
  if (!serviceName) {
    // Try to extract from sender email
    const senderMatch = from.match(/@([a-z0-9]+)\./i);
    if (senderMatch) {
      serviceName = senderMatch[1].charAt(0).toUpperCase() + senderMatch[1].slice(1);
    }
  }
  
  if (!serviceName) return null;
  
  // Try to extract amount
  const amountPatterns = [
    /\$([0-9,]+\.?\d*)/,
    /₦([0-9,]+\.?\d*)/,
    /€([0-9,]+\.?\d*)/,
    /£([0-9,]+\.?\d*)/,
    /USD\s*([0-9,]+\.?\d*)/i,
    /NGN\s*([0-9,]+\.?\d*)/i,
  ];
  
  let amount = 0;
  let currency = 'USD';
  
  for (const pattern of amountPatterns) {
    const match = content.match(pattern);
    if (match) {
      amount = parseFloat(match[1].replace(/,/g, ''));
      // Determine currency from the pattern
      if (pattern.source.includes('₦') || pattern.source.includes('NGN')) currency = 'NGN';
      else if (pattern.source.includes('€') || pattern.source.includes('EUR')) currency = 'EUR';
      else if (pattern.source.includes('£') || pattern.source.includes('GBP')) currency = 'GBP';
      break;
    }
  }
  
  if (amount === 0) return null;
  
  // Determine billing cycle
  let billingCycle: 'monthly' | 'yearly' | 'weekly' = 'monthly';
  if (content.includes('annual') || content.includes('yearly') || content.includes('year')) {
    billingCycle = 'yearly';
  } else if (content.includes('weekly') || content.includes('week')) {
    billingCycle = 'weekly';
  }
  
  return {
    serviceName,
    amount,
    currency,
    billingCycle,
    nextBillingDate: null,
    cancellationUrl: null,
    confidence: 0.5, // Lower confidence for fallback
  };
}
