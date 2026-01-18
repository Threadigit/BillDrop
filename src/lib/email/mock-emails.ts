// Mock email data for testing without real Gmail access

export interface MockEmail {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
  snippet: string;
  threadId: string;
}

export const mockEmails: MockEmail[] = [
  {
    id: 'mock-1',
    threadId: 'thread-1',
    subject: 'Your Netflix subscription receipt',
    from: 'Netflix <info@mailer.netflix.com>',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    snippet: 'Thank you for your Netflix subscription payment of $15.99',
    body: `
      Thank you for being a Netflix member!
      
      Your subscription has been renewed.
      
      Plan: Standard
      Amount charged: $15.99
      Next billing date: February 23, 2026
      
      You can manage your subscription at netflix.com/account
      
      Thank you,
      The Netflix Team
    `,
  },
  {
    id: 'mock-2',
    threadId: 'thread-2',
    subject: 'Spotify Premium - Payment Receipt',
    from: 'Spotify <no-reply@spotify.com>',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    snippet: 'Your Spotify Premium payment of $9.99 was successful',
    body: `
      Hi there,
      
      Your Spotify Premium payment was processed successfully.
      
      Receipt Details:
      - Plan: Spotify Premium Individual
      - Amount: $9.99 USD
      - Payment date: January 15, 2026
      - Next payment: February 15, 2026
      
      Listen on: spotify.com
      
      Thanks,
      Spotify
    `,
  },
  {
    id: 'mock-3',
    threadId: 'thread-3',
    subject: 'Adobe Creative Cloud - Invoice',
    from: 'Adobe <mail@email.adobe.com>',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    snippet: 'Your monthly subscription invoice for Adobe Creative Cloud',
    body: `
      Adobe Invoice
      
      Thank you for your subscription to Adobe Creative Cloud.
      
      Invoice Details:
      Product: Creative Cloud All Apps
      Billing period: Monthly
      Amount: $54.99 USD
      
      Next billing date: February 10, 2026
      
      Manage your plan: account.adobe.com
      
      Adobe Systems
    `,
  },
  {
    id: 'mock-4',
    threadId: 'thread-4',
    subject: 'Your ChatGPT Plus subscription is active',
    from: 'OpenAI <noreply@openai.com>',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    snippet: 'Thank you for subscribing to ChatGPT Plus at $20/month',
    body: `
      Hi,
      
      Your ChatGPT Plus subscription is now active!
      
      Subscription details:
      Plan: ChatGPT Plus
      Price: $20.00/month
      Started: January 5, 2026
      Auto-renews: February 5, 2026
      
      Access ChatGPT at: chat.openai.com
      
      - The OpenAI Team
    `,
  },
  {
    id: 'mock-5',
    threadId: 'thread-5',
    subject: 'Planet Fitness - Membership Renewal',
    from: 'Planet Fitness <members@planetfitness.com>',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    snippet: 'Your gym membership has been renewed for $45.00',
    body: `
      Planet Fitness
      
      Your membership has been successfully renewed!
      
      Member: John Doe
      Plan: Black Card Membership
      Monthly fee: $45.00
      
      Next billing date: February 17, 2026
      
      See you at the gym!
      Planet Fitness Team
    `,
  },
  {
    id: 'mock-6',
    threadId: 'thread-6',
    subject: 'Disney+ Monthly Subscription Receipt',
    from: 'Disney+ <disneyplus@mail.disneyplus.com>',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    snippet: 'Your Disney+ subscription payment of $13.99 was processed',
    body: `
      Disney+ Subscription Receipt
      
      Thank you for being a Disney+ subscriber!
      
      Plan: Disney+ (No Ads)
      Amount: $13.99/month
      Next renewal: February 20, 2026
      
      Stream at: disneyplus.com
      
      The Walt Disney Company
    `,
  },
  {
    id: 'mock-7',
    threadId: 'thread-7',
    subject: 'Your YouTube Premium membership',
    from: 'YouTube <yt-noreply@youtube.com>',
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    snippet: 'Thank you for your YouTube Premium payment',
    body: `
      YouTube Premium Membership
      
      Hi there,
      
      Your YouTube Premium subscription has been renewed.
      
      Amount charged: $13.99 USD
      Subscription type: Monthly
      Next billing: February 12, 2026
      
      Enjoy ad-free videos and YouTube Music!
      
      - YouTube Team
    `,
  },
];

// Function to get mock emails (simulates API delay)
export async function getMockEmails(delayMs = 1500): Promise<MockEmail[]> {
  await new Promise(resolve => setTimeout(resolve, delayMs));
  return mockEmails;
}
