import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { fetchGmailEmails, getGmailAccessToken } from '@/lib/email/gmail';
import { filterSubscriptionEmails, FilteredEmail } from '@/lib/email/filter';
import { parseEmailsBatchAI, parseEmailFallback } from '@/lib/ai/parser';

// Vercel serverless function config - needs enough time to fetch emails
export const maxDuration = 60;

interface StoredEmail {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
  extractedServiceName?: string;
  matchedKeywords: string[];
}

// Step 1: Initialize scan - fetch and filter emails, return list for batching
// GET /api/scan/batch
// Returns: { success: true, emails: StoredEmail[] }
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    // Get access token
    console.log('[Batch Scan] Getting access token...');
    const accessToken = await getGmailAccessToken();
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Gmail access token not found. Please reconnect your Google account.' 
      }, { status: 401 });
    }

    // Fetch emails from last 30 days
    console.log('[Batch Scan] Fetching emails...');
    const emails = await fetchGmailEmails(accessToken);
    console.log(`[Batch Scan] Fetched ${emails.length} emails`);
    
    // Filter for subscription-related emails
    const filteredEmails = filterSubscriptionEmails(emails);
    console.log(`[Batch Scan] Filtered to ${filteredEmails.length} potential subscriptions`);
    
    // Return email metadata for client to batch
    const emailList: StoredEmail[] = filteredEmails.map(email => ({
      id: email.id,
      subject: email.subject,
      from: email.from,
      date: email.date,
      body: email.body.substring(0, 3000), // Limit body size
      extractedServiceName: email.extractedServiceName,
      matchedKeywords: email.matchedKeywords,
    }));

    return NextResponse.json({
      success: true,
      totalEmails: emails.length,
      filteredCount: emailList.length,
      emails: emailList,
      userId: user.id,
    });
  } catch (error) {
    console.error('[Batch Scan] Init error:', error);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}

// Step 2: Process a batch of emails
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { emails } = body as { emails: StoredEmail[] };

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'No emails provided' }, { status: 400 });
    }

    // Limit emails per request to prevent timeout (Vercel 60s limit)
    const MAX_EMAILS_PER_REQUEST = 10; // Reduced from 15
    const emailsToProcess = emails.slice(0, MAX_EMAILS_PER_REQUEST);
    
    if (emails.length > MAX_EMAILS_PER_REQUEST) {
      console.log(`[Batch Scan] Limiting from ${emails.length} to ${MAX_EMAILS_PER_REQUEST} emails per request`);
    }

    console.log(`[Batch Scan] Processing batch of ${emailsToProcess.length} emails`);

    const foundSubscriptions: Array<{
      id: string;
      serviceName: string;
      amount: number;
      currency: string;
      billingCycle: string;
      confidence: number | null;
    }> = [];

    // Process emails in batches of 5 using AI
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < emailsToProcess.length; i += BATCH_SIZE) {
      const batch = emailsToProcess.slice(i, i + BATCH_SIZE);
      console.log(`[Batch Scan] Processing AI batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} emails)`);
      
      // Send batch to AI
      const aiResults = await parseEmailsBatchAI(
        batch.map(e => ({ id: e.id, subject: e.subject, from: e.from, body: e.body }))
      );
      
      // Process each result
      for (let j = 0; j < batch.length; j++) {
        const email = batch[j];
        let parsed = aiResults[j]?.parsed;
        
        // DEBUG: Log AI results for HBO/Google Play
        const debugTargets = ['hbo', 'google play', 'prime video'];
        const emailContent = `${email.subject} ${email.from}`.toLowerCase();
        for (const target of debugTargets) {
          if (emailContent.includes(target)) {
            console.log(`\n[DEBUG] 🤖 AI RESULT for ${target.toUpperCase()}:`);
            console.log(`[DEBUG] Subject: ${email.subject}`);
            console.log(`[DEBUG] AI parsed: ${parsed ? JSON.stringify(parsed) : 'null'}`);
          }
        }
        
        // Fallback to regex if AI didn't find anything
        if (!parsed) {
          console.log(`[Batch Scan] AI missed, trying regex for: "${email.subject.substring(0, 30)}..."`);
          parsed = parseEmailFallback(email.subject, email.from, email.body, email.extractedServiceName);
        }
        
        // Accept ANY subscription found (even with amount=0 for human review)
        if (parsed) {
          console.log(`[Batch Scan] Found: ${parsed.serviceName} - ${parsed.currency} ${parsed.amount} (confidence: ${parsed.confidence})`);
          
          // Check if subscription already exists
          const serviceSlug = parsed.serviceName.toLowerCase().replace(/\s+/g, '-');
          const existing = await prisma.subscription.findFirst({
            where: {
              userId: user.id,
              OR: [
                { serviceSlug: serviceSlug },
                { 
                  serviceName: { contains: parsed.serviceName, mode: 'insensitive' },
                  amount: parsed.amount 
                }
              ]
            },
          });

          if (!existing) {
            // Skip zero-amount subscriptions unless it's a trial
            const isTrial = (parsed.description?.toLowerCase().includes('trial') || 
                            parsed.serviceName.toLowerCase().includes('trial'));
            if (parsed.amount === 0 && !isTrial) {
              console.log(`[Batch Scan] Skipped ${parsed.serviceName}: $0 and not a trial`);
              continue;
            }

            const subscription = await prisma.subscription.create({
              data: {
                userId: user.id,
                serviceName: parsed.serviceName,
                serviceSlug: serviceSlug,
                description: parsed.description,
                amount: parsed.amount,
                currency: parsed.currency,
                billingCycle: parsed.billingCycle,
                nextBillingDate: parsed.nextBillingDate ? new Date(parsed.nextBillingDate) : null,
                cancellationUrl: parsed.cancellationUrl,
                confidence: parsed.confidence,
                detectedFrom: 'email',
                confirmed: false,
              },
            });

            foundSubscriptions.push({
              id: subscription.id,
              serviceName: subscription.serviceName,
              amount: subscription.amount,
              currency: subscription.currency,
              billingCycle: subscription.billingCycle,
              confidence: subscription.confidence,
            });
            
            console.log(`[Batch Scan] Created: ${subscription.serviceName}`);
          } else {
            console.log(`[Batch Scan] Already exists: ${parsed.serviceName}`);
          }
        }
      }
    }

    console.log(`[Batch Scan] Found ${foundSubscriptions.length} subscriptions in batch`);

    return NextResponse.json({
      success: true,
      processed: emailsToProcess.length,
      remaining: Math.max(0, emails.length - MAX_EMAILS_PER_REQUEST),
      subscriptions: foundSubscriptions,
    });
  } catch (error) {
    console.error('[Batch Scan] Batch error:', error);
    return NextResponse.json({ error: 'Failed to process batch' }, { status: 500 });
  }
}
