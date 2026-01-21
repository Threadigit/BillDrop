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

// Fetch ALL emails from Gmail API for the last 30 days using pagination
export async function fetchGmailEmails(accessToken: string, maxEmails?: number): Promise<EmailMessage[]> {
  // Smart query - include common subscription services in from: patterns
  const searchQuery = encodeURIComponent(
    'newer_than:30d ' +
    '(' +
      'subject:(receipt OR subscription OR billing OR invoice OR payment OR charged OR renew OR renewal OR membership OR statement OR trial OR plan OR order) ' +
      'OR from:(noreply OR billing OR receipt OR invoice OR orders OR amazon OR prime OR netflix OR hbo OR spotify OR apple OR google OR adobe) ' +
      'OR "managed by billdrop"' + // Always include our own test emails if any
    ') ' +
    '-subject:(newsletter OR shipping OR shipped OR delivered OR tracking OR "verification code" OR "security alert" OR "password reset" OR refund OR return OR "job alert" OR "job recommendation" OR digest OR "new post" OR published) ' +
    '-category:(social OR promotions) ' + // Try to exclude social/promotions if possible (though Gmail's categorization isn't perfect)
    ''
  );
  try {
    
    // Step 1: Fetch ALL message IDs using pagination
    const allMessageIds: { id: string; threadId: string }[] = [];
    let nextPageToken: string | undefined = undefined;
    let pageCount = 0;
    const MAX_PAGES = 20; // Safety limit to prevent infinite loops (20 pages × 100 = 2000 emails max)
    
    do {
      pageCount++;
      const pageUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${searchQuery}&maxResults=100${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      
      
      const listResponse = await fetch(pageUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!listResponse.ok) {
        const errorText = await listResponse.text();
        console.error('[Gmail] List API error:', listResponse.status, errorText);
        break;
      }

      const listData: GmailListResponse = await listResponse.json();
      
      if (listData.messages && listData.messages.length > 0) {
        allMessageIds.push(...listData.messages);
      }
      
      nextPageToken = listData.nextPageToken;

      // Stop if we have enough emails
      if (maxEmails && allMessageIds.length >= maxEmails) {
        break;
      }
      
    } while (nextPageToken && pageCount < MAX_PAGES);
    
    // Apply strict limit if we over-fetched
    if (maxEmails && allMessageIds.length > maxEmails) {
      allMessageIds.splice(maxEmails);
    }
    
    
    if (allMessageIds.length === 0) {
      return [];
    }

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

    // Step 2: Fetch message details using Gmail Batch API (100 requests per HTTP call)
    const BATCH_SIZE = 25; // Adjusted to 25 to avoid rate limits (429 errors)
    const allEmails: EmailMessage[] = [];
    
    
    for (let i = 0; i < allMessageIds.length; i += BATCH_SIZE) {
      const batch = allMessageIds.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(allMessageIds.length / BATCH_SIZE);
      
      
      try {
        // Build multipart batch request body
        const boundary = 'batch_billdrop_' + Date.now();
        let batchBody = '';
        
        for (let j = 0; j < batch.length; j++) {
          const msg = batch[j];
          batchBody += `--${boundary}\r\n`;
          batchBody += 'Content-Type: application/http\r\n';
          batchBody += `Content-ID: <item${j}>\r\n\r\n`;
          batchBody += `GET /gmail/v1/users/me/messages/${msg.id}?format=full\r\n\r\n`;
        }
        batchBody += `--${boundary}--`;
        
        // Send batch request
        const batchResponse = await fetch('https://www.googleapis.com/batch/gmail/v1', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': `multipart/mixed; boundary=${boundary}`,
          },
          body: batchBody,
        });
        
        if (!batchResponse.ok) {
          console.error(`[Gmail] Batch request failed: ${batchResponse.status}`);
          continue;
        }
        
        // Parse multipart response
        const responseText = await batchResponse.text();
        const responseBoundary = batchResponse.headers.get('content-type')?.match(/boundary=(.+)/)?.[1];
        
        if (!responseBoundary) {
          console.error('[Gmail] Could not parse response boundary');
          continue;
        }
        
        // Split response into parts
        const parts = responseText.split(`--${responseBoundary}`).filter(part => {
          const trimmed = part.trim();
          // Filter out empty parts and the closing boundary marker "--"
          return trimmed.length > 0 && trimmed !== '--';
        });
        
        for (const part of parts) {
          try {
            // Find the start of the JSON body (it comes after the HTTP headers)
            // Look for the first opening brace after the HTTP status line
            const jsonStartIndex = part.indexOf('{');
            if (jsonStartIndex === -1) {
              continue;
            }
            
            // Extract and parse JSON
            const jsonStr = part.substring(jsonStartIndex);
            let msgData: GmailMessageResponse;
            try {
              msgData = JSON.parse(jsonStr);
            } catch (jsonErr) {
               // Sometimes the part might have trailing boundary markers, try to trim
               const lastBrace = jsonStr.lastIndexOf('}');
               if (lastBrace !== -1) {
                 try {
                   msgData = JSON.parse(jsonStr.substring(0, lastBrace + 1));
                 } catch (retryErr) {
                   continue;
                 }
               } else {
                 continue;
               }
            }
            
            if (!msgData.payload?.headers) {
              continue;
            }
            
            // Extract headers
            const headers = msgData.payload.headers;
            const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
            const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
            const date = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';

            // Extract body
            let body = '';
            
            if (msgData.payload.body?.data) {
              body = Buffer.from(msgData.payload.body.data, 'base64').toString('utf-8');
            } else if (msgData.payload.parts) {
              body = extractTextFromParts(msgData.payload.parts);
            }
            
            // ALWAYS prepend snippet - it's Gmail's clean pre-parsed text
            // This ensures we have actual text content even if body is mostly HTML/CSS
            if (msgData.snippet) {
              body = `SNIPPET: ${msgData.snippet} END_SNIPPET. ${body}`;
            }

            allEmails.push({
              id: msgData.id,
              threadId: msgData.threadId,
              snippet: msgData.snippet,
              subject,
              from,
              date,
              body: body.substring(0, 5000), // Limit body size
            });
          } catch (parseError) {
            // Skip malformed responses
            console.error('[Gmail] Parse loop error:', parseError);
            continue;
          }
        }
        
        
        
      } catch (batchError) {
        console.error(`[Gmail] Batch ${batchNum} error:`, batchError);
        // Continue with next batch
      }
    }
    // Safety net: Filter out any emails older than 30 days (in case Gmail search misses edge cases)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEmails = allEmails.filter(email => {
      try {
        const emailDate = new Date(email.date);
        return emailDate >= thirtyDaysAgo;
      } catch {
        // If date parsing fails, include the email (Gmail already filtered by date)
        return true;
      }
    });
    
    if (recentEmails.length < allEmails.length) {
    }
    
    return recentEmails;
  } catch (error) {
    console.error('[Gmail] API error:', error);
    return [];
  }
}

// Get Gmail access token from user's account (with automatic refresh)
export async function getGmailAccessToken(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      accounts: {
        where: { provider: 'google' },
      },
    },
  });

  
  const account = user?.accounts?.[0];
  
  if (!account?.access_token) {
    return null;
  }

  // Check if token is expired or about to expire (within 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = account.expires_at || 0;
  const isExpired = expiresAt < now + 300; // 5 minute buffer
  

  if (isExpired && account.refresh_token) {
    const newToken = await refreshGoogleToken(account.refresh_token, account.id);
    if (newToken) {
      return newToken;
    }
  }

  return account.access_token;
}
