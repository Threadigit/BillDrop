import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { fetchGmailEmails, getGmailAccessToken } from '@/lib/email/gmail';
import { filterSubscriptionEmails, FilteredEmail } from '@/lib/email/filter';
import { parseEmailWithAI, parseEmailFallback } from '@/lib/ai/parser';

export const dynamic = 'force-dynamic';

// Vercel serverless function config - extend timeout
export const maxDuration = 60; // Max 60 seconds for Vercel Pro, 10 for Hobby

// Limit emails to process to stay within timeout
const MAX_EMAILS_TO_FETCH = 50;
const MAX_EMAILS_TO_PARSE = 25;

// Process multiple emails in parallel for speed
async function processEmailBatch(
  emails: FilteredEmail[],
  userId: string,
  sendEvent: (data: object) => void,
  processedCount: { value: number },
  totalCount: number,
  progressStart: number,
  progressEnd: number
): Promise<number> {
  let subscriptionsFound = 0;
  
  // Process emails in parallel batches of 5
  const BATCH_SIZE = 5;
  
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    
    const results = await Promise.allSettled(
      batch.map(async (email) => {
        try {
          
          // Try AI parser first
          let parsed = await parseEmailWithAI(email.subject, email.from, email.body);
          
          // If AI fails, try fallback parser
          if (!parsed && email.extractedServiceName) {
            parsed = parseEmailFallback(email.subject, email.from, email.body, email.extractedServiceName);
          }
          
          if (parsed) {
            
            // Check if subscription already exists
            const existing = await prisma.subscription.findFirst({
              where: {
                userId: userId,
                serviceSlug: parsed.serviceName.toLowerCase().replace(/\s+/g, '-'),
              },
            });

            if (existing) {
              return {
                id: existing.id,
                serviceName: existing.serviceName,
                description: existing.description,
                amount: existing.amount,
                currency: existing.currency,
                billingCycle: existing.billingCycle,
                confidence: existing.confidence,
              };
            }

            // Skip zero-amount subscriptions unless it's a trial
            const isTrial = (parsed.description?.toLowerCase().includes('trial') || 
                            parsed.serviceName.toLowerCase().includes('trial'));
            if (parsed.amount === 0 && !isTrial) {
              return null;
            }

            // Calculate next billing date if not provided
            let nextBillingDate: Date | null = null;
            if (parsed.nextBillingDate) {
              nextBillingDate = new Date(parsed.nextBillingDate);
            } else {
              // Calculate based on billing cycle from today
              const today = new Date();
              if (parsed.billingCycle === 'monthly') {
                nextBillingDate = new Date(today.setMonth(today.getMonth() + 1));
              } else if (parsed.billingCycle === 'yearly') {
                nextBillingDate = new Date(today.setFullYear(today.getFullYear() + 1));
              } else if (parsed.billingCycle === 'weekly') {
                nextBillingDate = new Date(today.setDate(today.getDate() + 7));
              }
            }

            // Create new subscription (all start as unconfirmed for review)
            const subscription = await prisma.subscription.create({
              data: {
                userId: userId,
                serviceName: parsed.serviceName,
                serviceSlug: parsed.serviceName.toLowerCase().replace(/\s+/g, '-'),
                description: parsed.description,
                amount: parsed.amount,
                currency: parsed.currency,
                billingCycle: parsed.billingCycle,
                nextBillingDate: nextBillingDate,
                cancellationUrl: parsed.cancellationUrl,
                confidence: parsed.confidence,
                detectedFrom: 'email',
                confirmed: false, // All require user confirmation
              },
            });

            return subscription;
          }
          return null;
        } catch (parseError) {
          console.error('[Scan] Parse error for email:', parseError);
          // Skip warnings, we just want to process what we can
        }
      })
    );
    
    // Process results and send events
    for (const result of results) {
      processedCount.value++;
      const progress = progressStart + ((progressEnd - progressStart) * (processedCount.value / totalCount));
      
      sendEvent({ 
        type: 'status', 
        message: `Analyzing email ${processedCount.value}/${totalCount}...`, 
        progress: Math.round(progress)
      });
      
      if (result.status === 'fulfilled' && result.value) {
        const subscription = result.value;
        subscriptionsFound++;
        
        // Send the found subscription immediately
        sendEvent({ 
          type: 'subscription', 
          subscription: {
            id: subscription.id,
            serviceName: subscription.serviceName,
            amount: subscription.amount,
            currency: subscription.currency,
            billingCycle: subscription.billingCycle,
            confidence: subscription.confidence,
          },
          count: subscriptionsFound
        });
      }
    }
  }
  
  return subscriptionsFound;
}

// Streaming scan endpoint - sends subscription data as it's found
export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      const sendEvent = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Step 1: Get access token
        sendEvent({ type: 'status', message: 'Connecting to Gmail...', progress: 5 });
        
        const accessToken = await getGmailAccessToken();
        if (!accessToken) {
          sendEvent({ type: 'error', message: 'Gmail access token not found. Please reconnect your Google account.' });
          controller.close();
          return;
        }

        // Step 2: Fetch emails (limited to prevent timeout)
        sendEvent({ type: 'status', message: 'Fetching emails...', progress: 10 });
        
        const emails = await fetchGmailEmails(accessToken, MAX_EMAILS_TO_FETCH);
        
        sendEvent({ type: 'status', message: `Found ${emails.length} emails to analyze...`, progress: 20, emailsFound: emails.length });

        if (emails.length === 0) {
          sendEvent({ type: 'complete', message: 'No subscription emails found', subscriptionsFound: 0 });
          controller.close();
          return;
        }

        // Step 3: Filter emails
        sendEvent({ type: 'status', message: 'Filtering subscription emails...', progress: 25 });
        
        let filteredEmails = filterSubscriptionEmails(emails);
        
        // Limit the number of emails to parse to stay within timeout
        if (filteredEmails.length > MAX_EMAILS_TO_PARSE) {
          filteredEmails = filteredEmails.slice(0, MAX_EMAILS_TO_PARSE);
        }
        
        // Log why emails passed the filter
        for (const email of filteredEmails.slice(0, 5)) {
        }
        
        sendEvent({ type: 'status', message: `Analyzing ${filteredEmails.length} potential subscriptions...`, progress: 30 });

        if (filteredEmails.length === 0) {
          sendEvent({ type: 'complete', message: `Scanned ${emails.length} emails, found 0 subscriptions`, subscriptionsFound: 0 });
          controller.close();
          return;
        }

        // Step 4: Parse emails in parallel batches
        const processedCount = { value: 0 };
        const progressStart = 30;
        const progressEnd = 95;

        const subscriptionsFound = await processEmailBatch(
          filteredEmails,
          user.id,
          sendEvent,
          processedCount,
          filteredEmails.length,
          progressStart,
          progressEnd
        );

        // Step 5: Complete
        sendEvent({ 
          type: 'complete', 
          message: `Found ${subscriptionsFound} subscription${subscriptionsFound !== 1 ? 's' : ''} in ${emails.length} emails`,
          progress: 100,
          subscriptionsFound,
          emailsScanned: emails.length
        });

        // Create scan record
        await prisma.emailScan.create({
          data: {
            userId: user.id,
            provider: 'gmail',
            status: 'completed',
            emailsFound: emails.length,
            subsFound: subscriptionsFound,
            completedAt: new Date(),
          },
        });

      } catch (error) {
        console.error('[Scan] Streaming scan error:', error);
        sendEvent({ type: 'error', message: 'Scan failed. Please try again.' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
