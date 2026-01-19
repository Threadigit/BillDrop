import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { fetchGmailEmails, getGmailAccessToken } from '@/lib/email/gmail';
import { filterSubscriptionEmails } from '@/lib/email/filter';
import { getMockEmails } from '@/lib/email/mock-emails';
import { parseEmailWithAI } from '@/lib/ai/parser';
import { mockParseEmail } from '@/lib/ai/mock-parser';

// Vercel serverless function config
export const maxDuration = 60;

const USE_MOCK_EMAILS = process.env.USE_MOCK_EMAILS === 'true';
const USE_MOCK_AI = process.env.USE_MOCK_AI === 'true' || !process.env.OPENAI_API_KEY;
const MAX_EMAILS_TO_FETCH = 50;
const MAX_EMAILS_TO_PARSE = 20;

export async function POST(request: NextRequest) {
  try {
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

    // Create email scan record
    const emailScan = await prisma.emailScan.create({
      data: {
        userId: user.id,
        provider: 'gmail',
        status: 'scanning',
      },
    });

    let emails;
    
    if (USE_MOCK_EMAILS) {
      // Use mock emails for testing
      console.log('[Scan] Using mock emails');
      emails = await getMockEmails();
    } else {
      // Fetch real emails from Gmail
      console.log('[Scan] Fetching real Gmail emails...');
      const accessToken = await getGmailAccessToken();
      console.log('[Scan] Access token retrieved:', !!accessToken);
      
      if (!accessToken) {
        await prisma.emailScan.update({
          where: { id: emailScan.id },
          data: { status: 'error', error: 'No Gmail access token' },
        });
        return NextResponse.json({ 
          error: 'Gmail access token not found. Please reconnect your Google account.' 
        }, { status: 401 });
      }
      
      emails = await fetchGmailEmails(accessToken);
      console.log('[Scan] Emails fetched:', emails.length);
    }

    // Filter for subscription-related emails
    let filteredEmails = filterSubscriptionEmails(emails);
    
    // Limit emails to parse to stay within timeout
    if (filteredEmails.length > MAX_EMAILS_TO_PARSE) {
      filteredEmails = filteredEmails.slice(0, MAX_EMAILS_TO_PARSE);
    }

    // Parse emails for subscription data
    const pendingSubscriptions: Array<{
      id: string;
      serviceName: string;
      amount: number;
      currency: string;
      billingCycle: string;
      confidence: number | null;
    }> = [];
    const parseFunc = USE_MOCK_AI ? mockParseEmail : parseEmailWithAI;

    for (const email of filteredEmails) {
      const parsed = await parseFunc(email.subject, email.from, email.body);
      if (parsed) {
        // Check if subscription already exists (case insensitive via lowercase)
        const serviceNameLower = parsed.serviceName.toLowerCase();
        const existing = await prisma.subscription.findFirst({
          where: {
            userId: user.id,
            serviceSlug: serviceNameLower.replace(/\s+/g, '-'),
            status: 'active',
          },
        });

        if (!existing) {
          // ALL subscriptions go to pending review - user decides what to accept
          const subscription = await prisma.subscription.create({
            data: {
              userId: user.id,
              serviceName: parsed.serviceName,
              serviceSlug: parsed.serviceName.toLowerCase().replace(/\s+/g, '-'),
              amount: parsed.amount,
              currency: parsed.currency,
              billingCycle: parsed.billingCycle,
              nextBillingDate: parsed.nextBillingDate ? new Date(parsed.nextBillingDate) : null,
              cancellationUrl: parsed.cancellationUrl,
              confidence: parsed.confidence,
              detectedFrom: 'email',
              confirmed: false, // ALL require user confirmation
            },
          });
          
          pendingSubscriptions.push(subscription);
        }
      }
    }

    // Update email scan record
    await prisma.emailScan.update({
      where: { id: emailScan.id },
      data: {
        status: 'completed',
        emailsFound: emails.length,
        subsFound: pendingSubscriptions.length,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      emailsScanned: emails.length,
      subscriptionsFound: pendingSubscriptions.length,
      confirmedCount: 0, // All go to review now
      pendingCount: pendingSubscriptions.length,
      subscriptions: [],
      pendingReview: pendingSubscriptions,
    });
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
  }
}

// GET endpoint to check scan status
export async function GET() {
  try {
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

    // Get most recent scan
    const latestScan = await prisma.emailScan.findFirst({
      where: { userId: user.id },
      orderBy: { startedAt: 'desc' },
    });

    return NextResponse.json({ scan: latestScan });
  } catch (error) {
    console.error('Error fetching scan status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
