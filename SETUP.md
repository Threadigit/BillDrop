# SubTracker Setup Guide

This guide walks you through setting up the required credentials for SubTracker.

## Required Credentials

1. **Google OAuth** (for Gmail login & email scanning)
2. **Microsoft OAuth** (for Outlook login & email scanning)  
3. **OpenAI API Key** (optional - for AI-powered subscription detection)

---

## 1. Google OAuth Setup

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "SubTracker" and create

### Step 2: Enable Gmail API
1. Go to "APIs & Services" → "Library"
2. Search for "Gmail API" and enable it

### Step 3: Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type
3. Fill in:
   - App name: `SubTracker`
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `email`
   - `profile`
   - `openid`
   - `https://www.googleapis.com/auth/gmail.readonly`
5. Add your email as a test user

### Step 4: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "SubTracker Web"
5. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
6. Copy the **Client ID** and **Client Secret**

### Step 5: Add to .env
```
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

---

## 2. Microsoft OAuth Setup

### Step 1: Register an Application
1. Go to [Azure Portal](https://portal.azure.com/)
2. Search for "App registrations" and click it
3. Click "New registration"
4. Fill in:
   - Name: `SubTracker`
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: Web → `http://localhost:3000/api/auth/callback/microsoft-entra-id`
5. Click "Register"

### Step 2: Copy Application ID
1. On the Overview page, copy the **Application (client) ID**

### Step 3: Create Client Secret
1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Description: "SubTracker Auth"
4. Expiry: Choose based on your needs
5. Copy the **Value** (not the Secret ID)

### Step 4: Configure API Permissions
1. Go to "API permissions"
2. Click "Add a permission" → "Microsoft Graph"
3. Select "Delegated permissions"
4. Add these permissions:
   - `email`
   - `openid`
   - `profile`
   - `User.Read`
   - `Mail.Read`
5. Click "Grant admin consent" if you have admin access

### Step 5: Add to .env
```
MICROSOFT_CLIENT_ID="your-application-client-id"
MICROSOFT_CLIENT_SECRET="your-client-secret-value"
```

---

## 3. OpenAI API Key (Optional)

For AI-powered subscription detection from email content.

### Step 1: Get API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key

### Step 2: Add to .env
```
OPENAI_API_KEY="sk-your-api-key"
```

---

## Final .env File

Your `.env` file should look like this:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-random-secret-key-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Microsoft OAuth
MICROSOFT_CLIENT_ID="your-microsoft-application-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"

# OpenAI (optional)
OPENAI_API_KEY="sk-your-openai-key"
```

---

## Running the App

After adding your credentials:

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Visit `http://localhost:3000` and try signing in!

---

## Troubleshooting

### "redirect_uri_mismatch" Error
- Make sure your redirect URIs in Google/Microsoft match exactly:
  - Google: `http://localhost:3000/api/auth/callback/google`
  - Microsoft: `http://localhost:3000/api/auth/callback/microsoft-entra-id`

### "access_denied" Error  
- For Google: Make sure you've added your email as a test user
- For Microsoft: Make sure you've granted admin consent for the permissions

### Database Issues
```bash
npx prisma migrate reset
npx prisma generate
```
