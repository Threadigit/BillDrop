// Gmail API integration for scanning subscription emails

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface EmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
  body: string;
}

interface GmailListResponse {
  messages?: { id: string; threadId: string }[];
  nextPageToken?: string;
}

interface GmailMessagePart {
  mimeType: string;
  body?: { data?: string };
  parts?: GmailMessagePart[];
}

interface GmailMessageResponse {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: { name: string; value: string }[];
    parts?: GmailMessagePart[];
    body?: { data?: string };
  };
}

// Refresh the Google access token using the refresh token
async function refreshGoogleToken(refreshToken: string, accountId: string): Promise<string | null> {
  console.log('[Gmail] Refreshing access token...');
  
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gmail] Token refresh failed:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('[Gmail] Token refreshed successfully');

    // Update the access token in the database
    await prisma.account.update({
      where: { id: accountId },
      data: {
        access_token: data.access_token,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      },
    });

    return data.access_token;
  } catch (error) {
    console.error('[Gmail] Error refreshing token:', error);
    return null;
  }
}

// Fetch emails from Gmail API
export async function fetchGmailEmails(accessToken: string, maxResults = 150): Promise<EmailMessage[]> {
  const emails: EmailMessage[] = [];
  
  // Search for common billing/subscription keywords in the last 30 days
  const searchQuery = encodeURIComponent(
    'newer_than:30d (subject:receipt OR subject:subscription OR subject:billing OR subject:invoice OR subject:payment OR subject:order OR subject:confirmation OR subject:charged OR subject:statement OR from:noreply OR from:billing OR from:receipt OR from:invoice)'
  );
  
  try {
    console.log('[Gmail] Starting email fetch with query:', searchQuery.substring(0, 100) + '...');
    console.log('[Gmail] Access token present:', !!accessToken, 'Length:', accessToken?.length);
    
    // List messages matching our search
    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${searchQuery}&maxResults=${maxResults}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log('[Gmail] List API response status:', listResponse.status);
    
    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error('[Gmail] List API error:', listResponse.status, errorText);
      return [];
    }

    const listData: GmailListResponse = await listResponse.json();
    console.log('[Gmail] Messages found:', listData.messages?.length || 0);
    
    if (!listData.messages || listData.messages.length === 0) {
      console.log('[Gmail] No messages matched the search query');
      return [];
    }

    // Fetch each message's details
    for (const msg of listData.messages.slice(0, maxResults)) {
      try {
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!msgResponse.ok) continue;

        const msgData: GmailMessageResponse = await msgResponse.json();
        
        // Extract headers
        const headers = msgData.payload.headers;
        const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
        const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
        const date = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';

        // Extract body - more robust extraction for multi-part emails
        let body = '';
        
        // Helper to recursively find text content in parts
        const extractTextFromParts = (parts: GmailMessagePart[] | undefined): string => {
          if (!parts) return '';
          
          for (const part of parts) {
            // Check for nested parts (multipart/alternative, multipart/mixed, etc.)
            if (part.parts) {
              const nestedText = extractTextFromParts(part.parts);
              if (nestedText) return nestedText;
            }
            
            // Prefer text/plain
            if (part.mimeType === 'text/plain' && part.body?.data) {
              return Buffer.from(part.body.data, 'base64').toString('utf-8');
            }
          }
          
          // Fallback to HTML and strip tags
          for (const part of parts) {
            if (part.mimeType === 'text/html' && part.body?.data) {
              const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
              // Basic HTML to text conversion
              return html
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/\s+/g, ' ')
                .trim();
            }
          }
          
          return '';
        };

        if (msgData.payload.body?.data) {
          body = Buffer.from(msgData.payload.body.data, 'base64').toString('utf-8');
        } else if (msgData.payload.parts) {
          body = extractTextFromParts(msgData.payload.parts);
        }
        
        // If still no body, use the snippet as fallback
        if (!body && msgData.snippet) {
          body = msgData.snippet;
        }

        emails.push({
          id: msgData.id,
          threadId: msgData.threadId,
          snippet: msgData.snippet,
          subject,
          from,
          date,
          body: body.substring(0, 5000), // Limit body size
        });
      } catch (error) {
        console.error('Error fetching message:', msg.id, error);
      }
    }

    return emails;
  } catch (error) {
    console.error('[Gmail] API error:', error);
    return [];
  }
}

// Get Gmail access token from user's account (with automatic refresh)
export async function getGmailAccessToken(): Promise<string | null> {
  console.log('[Gmail] Getting access token...');
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    console.log('[Gmail] No session or user email found');
    return null;
  }
  console.log('[Gmail] Session user:', session.user.email);

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      accounts: {
        where: { provider: 'google' },
      },
    },
  });

  console.log('[Gmail] User found:', !!user);
  console.log('[Gmail] Google accounts found:', user?.accounts?.length || 0);
  
  const account = user?.accounts?.[0];
  
  if (!account?.access_token) {
    console.log('[Gmail] No Google access token in database');
    return null;
  }

  // Check if token is expired or about to expire (within 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = account.expires_at || 0;
  const isExpired = expiresAt < now + 300; // 5 minute buffer
  
  console.log('[Gmail] Token expires at:', expiresAt, 'Current time:', now, 'Is expired:', isExpired);

  if (isExpired && account.refresh_token) {
    console.log('[Gmail] Token is expired, attempting refresh...');
    const newToken = await refreshGoogleToken(account.refresh_token, account.id);
    if (newToken) {
      return newToken;
    }
    console.log('[Gmail] Token refresh failed, returning existing token anyway');
  }

  console.log('[Gmail] Access token found, length:', account.access_token.length);
  return account.access_token;
}
