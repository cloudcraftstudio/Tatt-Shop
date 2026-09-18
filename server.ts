import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Persistent local data folder for TikTok tokens and configuration
const DATA_DIR = path.join(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.use(express.json());

// Log incoming verification or external requests
app.use((req, _res, next) => {
  if (req.path.includes('tiktok') || req.path.includes('verification') || req.path.includes('Q4MdY') || req.path.includes('.txt')) {
    console.log(`[TIKTOK_VERIFY_REQUEST] ${req.method} ${req.originalUrl} - UserAgent: ${req.headers['user-agent']}`);
    try {
      fs.appendFileSync(path.join(DATA_DIR, 'verify-requests.log'), `${new Date().toISOString()} ${req.method} ${req.originalUrl} UA: ${req.headers['user-agent']}\n`);
    } catch {}
  }
  next();
});

const TIKTOK_CONFIG_FILE = path.join(DATA_DIR, 'tiktok-config.json');
const TIKTOK_TOKEN_FILE = path.join(DATA_DIR, 'tiktok-token.json');

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || process.env.TIKTOK_ENCRYPTION_KEY || 'lights-out-tattoo-secure-key-2025-prod-vault';
const CIPHER_KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

function encryptAESGCM(text: string): { ciphertext: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', CIPHER_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return { ciphertext: encrypted, iv: iv.toString('hex'), tag };
}

function decryptAESGCM(ciphertext: string, ivHex: string, tagHex: string): string {
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', CIPHER_KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return ciphertext;
  }
}

async function syncConfigToFirestore(secureData: any) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0448860491';
    const databaseId = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-lightsouttattoo-90b14bb6-c7cf-4eb6-b802-d3995a38347e';
    const apiKey = process.env.FIREBASE_API_KEY || 'AIzaSyATomHQp7H5ZNcTHM60_-lKLp2sf6GD8oY';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/system_config/tiktok_config?key=${apiKey}`;

    const fields: Record<string, any> = {
      clientKey: { stringValue: secureData.clientKey || '' },
      redirectUri: { stringValue: secureData.redirectUri || '' },
      encryptionAlgorithm: { stringValue: 'AES-256-GCM' },
      hasClientSecret: { booleanValue: Boolean(secureData.encryptedSecret) },
      updatedAt: { stringValue: secureData.updatedAt || new Date().toISOString() }
    };
    if (secureData.encryptedSecret) {
      fields.encryptedClientSecret = { stringValue: secureData.encryptedSecret };
      fields.clientSecretIv = { stringValue: secureData.secretIv };
      fields.clientSecretTag = { stringValue: secureData.secretTag };
    }
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
  } catch {}
}

interface TikTokStoredConfig {
  clientKey?: string;
  clientSecret?: string;
  redirectUri?: string;
}

interface TikTokStoredToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp in ms
  refreshExpiresAt?: number;
  openId: string;
  user?: {
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

function getStoredConfig(): TikTokStoredConfig {
  try {
    if (fs.existsSync(TIKTOK_CONFIG_FILE)) {
      const content = fs.readFileSync(TIKTOK_CONFIG_FILE, 'utf-8');
      const data = JSON.parse(content);
      let secret = data.clientSecret;
      if (data.encryptedSecret && data.secretIv && data.secretTag) {
        secret = decryptAESGCM(data.encryptedSecret, data.secretIv, data.secretTag);
      }
      return {
        clientKey: data.clientKey,
        clientSecret: secret,
        redirectUri: data.redirectUri
      };
    }
  } catch (err) {
    console.error('Error reading tiktok-config.json:', err);
  }
  return {};
}

function saveStoredConfig(cfg: TikTokStoredConfig) {
  try {
    let encryptedSecret = '';
    let secretIv = '';
    let secretTag = '';
    if (cfg.clientSecret) {
      const enc = encryptAESGCM(cfg.clientSecret);
      encryptedSecret = enc.ciphertext;
      secretIv = enc.iv;
      secretTag = enc.tag;
    }
    const secureStorage = {
      clientKey: cfg.clientKey,
      redirectUri: cfg.redirectUri,
      encryptedSecret,
      secretIv,
      secretTag,
      encryptionAlgorithm: 'AES-256-GCM',
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(TIKTOK_CONFIG_FILE, JSON.stringify(secureStorage, null, 2), 'utf-8');
    syncConfigToFirestore(secureStorage).catch(() => {});
  } catch (err) {
    console.error('Error writing tiktok-config.json:', err);
  }
}

function getStoredToken(): TikTokStoredToken | null {
  try {
    if (fs.existsSync(TIKTOK_TOKEN_FILE)) {
      const content = fs.readFileSync(TIKTOK_TOKEN_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading tiktok-token.json:', err);
  }
  return null;
}

function saveStoredToken(tokenData: TikTokStoredToken | null) {
  try {
    if (!tokenData) {
      if (fs.existsSync(TIKTOK_TOKEN_FILE)) {
        fs.unlinkSync(TIKTOK_TOKEN_FILE);
      }
      return;
    }
    fs.writeFileSync(TIKTOK_TOKEN_FILE, JSON.stringify(tokenData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing tiktok-token.json:', err);
  }
}

function normalizeRedirectUri(rawUri?: string, req?: express.Request): string {
  let uri = (rawUri || '').trim();

  // If no uri provided, construct from request host or fallback
  if (!uri) {
    const rawHost = ((req?.headers['x-forwarded-host'] as string)?.split(',')[0].trim()) || req?.headers.host || '';
    const host = rawHost.includes('run.app') ? rawHost.split(':')[0] : (rawHost || 'ais-dev-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app');
    uri = `https://${host}/oauth/callback`;
  }

  try {
    if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
      uri = `https://${uri}`;
    }
    const parsed = new URL(uri);
    // TikTok strictly requires HTTPS in production
    if (parsed.protocol === 'http:' && !parsed.hostname.includes('localhost')) {
      parsed.protocol = 'https:';
    }
    // Clean search and hash
    parsed.search = '';
    parsed.hash = '';
    // Strip trailing slash if present at end of path
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch (e) {
    return uri || 'https://ais-dev-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app/oauth/callback';
  }
}

const DEFAULT_STUDIO_CLIENT_KEY = 'aw3x3m18kgf8mzyp';
const DEFAULT_STUDIO_CLIENT_SECRET = 'XFxwXGJgPF6NxP7bUxZgqzXfUU9xYGW5';
const DEFAULT_STUDIO_REDIRECT_URI = 'https://lightsouttattoo.site/oauth/callback';

function getEffectiveCredentials(req?: express.Request) {
  const stored = getStoredConfig();
  const clientKey = (process.env.TIKTOK_CLIENT_KEY || stored.clientKey || DEFAULT_STUDIO_CLIENT_KEY).trim();
  const clientSecret = (process.env.TIKTOK_CLIENT_SECRET || stored.clientSecret || DEFAULT_STUDIO_CLIENT_SECRET).trim();
  const rawRedirect = (process.env.TIKTOK_REDIRECT_URI || stored.redirectUri || DEFAULT_STUDIO_REDIRECT_URI).trim();
  const redirectUri = normalizeRedirectUri(rawRedirect, req);

  return { clientKey, clientSecret, redirectUri, configuredRedirectUri: rawRedirect };
}

// Persistent state store for OAuth CSRF prevention across dev server reloads
const PENDING_STATES_FILE = path.join(DATA_DIR, 'pending-states.json');
function loadPendingStates(): Map<string, { createdAt: number; redirectUri: string; returnUrl?: string }> {
  try {
    if (fs.existsSync(PENDING_STATES_FILE)) {
      const data = JSON.parse(fs.readFileSync(PENDING_STATES_FILE, 'utf-8'));
      return new Map(Object.entries(data));
    }
  } catch {}
  return new Map();
}
function savePendingStates(states: Map<string, { createdAt: number; redirectUri: string; returnUrl?: string }>) {
  try {
    const obj = Object.fromEntries(states.entries());
    fs.writeFileSync(PENDING_STATES_FILE, JSON.stringify(obj), 'utf-8');
  } catch {}
}

const pendingStates = loadPendingStates();

// API ROUTES
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Cloudflare R2 / S3 Presigned URL Generator
app.post('/api/s3/presigned-url', async (req, res) => {
  try {
    const { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_DOMAIN } = process.env;
    
    if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
      return res.status(500).json({ error: 'R2 storage credentials are not fully configured in the environment.' });
    }

    const { fileName, contentType } = req.body;
    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required.' });
    }
    const finalContentType = contentType || 'application/octet-stream';

    // Ensure endpoint has a protocol
    const endpoint = R2_ENDPOINT.startsWith('http') ? R2_ENDPOINT : `https://${R2_ENDPOINT}`;
    
    const s3 = new S3Client({
      region: 'auto', // R2 requires 'auto'
      endpoint,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });

    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const cleanBucketName = R2_BUCKET_NAME.trim();

    const command = new PutObjectCommand({
      Bucket: cleanBucketName,
      Key: uniqueFileName,
      ContentType: finalContentType,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour expiration
    
    // Determine the public URL where the file will be accessible after upload
    let publicUrl = '';
    if (R2_PUBLIC_DOMAIN) {
      const domain = R2_PUBLIC_DOMAIN.startsWith('http') ? R2_PUBLIC_DOMAIN : `https://${R2_PUBLIC_DOMAIN}`;
      publicUrl = `${domain.replace(/\/$/, '')}/${uniqueFileName}`;
    } else {
      // Fallback to trying to use the endpoint directly if no public domain is set
      publicUrl = `${endpoint.replace(/\/$/, '')}/${R2_BUCKET_NAME}/${uniqueFileName}`;
    }

    res.json({
      uploadUrl: signedUrl,
      publicUrl: publicUrl
    });
  } catch (err: any) {
    console.error('Failed to generate presigned URL', err);
    res.status(500).json({ error: err.message || 'Internal server error generating upload URL' });
  }
});

// TikTok Status & Configuration
app.get(['/api/tiktok/status', '/api/tiktok/status.js'], (req, res) => {
  const { clientKey, clientSecret, redirectUri } = getEffectiveCredentials(req);
  const token = getStoredToken();
  const hasKey = Boolean(clientKey);
  const hasSecret = Boolean(clientSecret);
  const isConnected = Boolean(token?.accessToken && token.expiresAt > Date.now() - 300000);

  res.json({
    configured: hasKey && hasSecret,
    hasClientKey: hasKey,
    hasClientSecret: hasSecret,
    clientKey: clientKey ? `${clientKey.slice(0, 4)}••••${clientKey.slice(-4)}` : '',
    rawClientKey: clientKey,
    redirectUri,
    isConnected,
    user: token?.user || null,
    expiresAt: token?.expiresAt || null
  });
});

// GET TikTok Configuration
app.get(['/api/tiktok/config', '/api/tiktok/config.js'], (req, res) => {
  const { clientKey, clientSecret, redirectUri } = getEffectiveCredentials(req);
  const hasKey = Boolean(clientKey);
  const hasSecret = Boolean(clientSecret);
  res.json({
    configured: hasKey && hasSecret,
    hasClientKey: hasKey,
    hasClientSecret: hasSecret,
    clientKey: clientKey ? `${clientKey.slice(0, 4)}••••${clientKey.slice(-4)}` : '',
    rawClientKey: clientKey,
    redirectUri
  });
});

// Update TikTok Client Key & Secret
app.post(['/api/tiktok/config', '/api/tiktok/config.js'], (req, res) => {
  try {
    const { clientKey, clientSecret, redirectUri } = req.body || {};
    const current = getStoredConfig();

    if (clientKey !== undefined) {
      current.clientKey = clientKey.trim();
    }
    if (clientSecret !== undefined && clientSecret.trim()) {
      current.clientSecret = clientSecret.trim();
    }
    if (redirectUri !== undefined) {
      current.redirectUri = redirectUri.trim();
    }

    saveStoredConfig(current);

    const creds = getEffectiveCredentials(req);
    res.json({
      success: true,
      message: 'TikTok credentials saved successfully.',
      hasClientKey: Boolean(creds.clientKey),
      hasClientSecret: Boolean(creds.clientSecret),
      redirectUri: creds.redirectUri
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to save configuration.' });
  }
});

// Get TikTok OAuth Authorization URL
app.get(['/api/tiktok/auth-url', '/api/tiktok/auth-url.js'], (req, res) => {
  const { clientKey, clientSecret, redirectUri: configuredUri } = getEffectiveCredentials(req);
  const clientRedirectUri = (req.query.redirectUri as string)?.trim();
  const returnUrl = (req.query.returnUrl as string)?.trim();
  
  // Use client-requested redirect URI if provided, otherwise configured
  const redirectUri = clientRedirectUri ? normalizeRedirectUri(clientRedirectUri, req) : configuredUri;

  if (!clientKey || !clientSecret) {
    return res.status(400).json({
      error: 'TikTok Client Key and Client Secret are required before connecting.'
    });
  }

  const state = crypto.randomBytes(16).toString('hex');
  pendingStates.set(state, { createdAt: Date.now(), redirectUri, returnUrl });
  savePendingStates(pendingStates);

  // Clean old states older than 15 mins
  const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
  for (const [st, info] of pendingStates.entries()) {
    if (info.createdAt < fifteenMinsAgo) pendingStates.delete(st);
  }
  savePendingStates(pendingStates);

  // Official TikTok Display & Content Posting API Scopes
  const requestedScopes = (req.query.scopes as string) || 'user.info.basic';
  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${encodeURIComponent(
    clientKey
  )}&scope=${encodeURIComponent(requestedScopes)}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&state=${encodeURIComponent(state)}`;

  res.json({
    authUrl,
    state,
    redirectUri,
    scopes: requestedScopes,
    returnUrl: returnUrl || null
  });
});

// Handle OAuth Callback from TikTok (supports /oauth/callback, /auth/callback, and /api/tiktok/callback)
app.get(['/oauth/callback', '/auth/callback', '/api/tiktok/callback'], async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>TikTok Authorization Error</title></head>
        <body style="font-family: sans-serif; background: #050811; color: #fff; text-align: center; padding: 40px;">
          <h2 style="color: #ff3366;">TikTok Authorization Failed</h2>
          <p>${error_description || error}</p>
          <button onclick="window.location.href = '/?tab=admin'" style="margin-top: 20px; padding: 10px 20px; background: #00f0ff; color: #000; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Return to Dashboard</button>
          <script>setTimeout(() => { window.location.href = '/?tab=admin'; }, 3000);</script>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('Missing authorization code from TikTok.');
  }

  const { clientKey, clientSecret } = getEffectiveCredentials(req);
  const storedStateInfo = state ? pendingStates.get(state as string) : null;
  const redirectUri = storedStateInfo?.redirectUri || getEffectiveCredentials(req).redirectUri;
  const returnUrl = storedStateInfo?.returnUrl || '';

  try {
    // Exchange authorization code for TikTok access token
    const tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/';
    const bodyParams = new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code: code as string,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: bodyParams.toString()
    });

    const tokenData = (await tokenResponse.json()) as any;

    if (tokenData.error && tokenData.error.code !== 'ok' && tokenData.error.code !== 0) {
      console.error('TikTok token error:', tokenData);
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>TikTok Authorization Failed</title></head>
          <body style="font-family: sans-serif; background: #050811; color: #fff; text-align: center; padding: 40px;">
            <h2 style="color: #ff3366;">Token Exchange Failed</h2>
            <p>${tokenData.error.message || JSON.stringify(tokenData.error)}</p>
            <button onclick="window.location.href = '/?tab=admin'" style="margin-top: 20px; padding: 10px 20px; background: #00f0ff; color: #000; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Return to Dashboard</button>
            <script>setTimeout(() => { window.location.href = '/?tab=admin'; }, 3000);</script>
          </body>
        </html>
      `);
    }

    const { access_token, refresh_token, expires_in, refresh_expires_in, open_id } = tokenData.data || tokenData;

    // Fetch user profile info
    let userInfo: { username?: string; displayName?: string; avatarUrl?: string } = {};
    try {
      const userRes = await fetch(
        'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username',
        {
          headers: {
            Authorization: `Bearer ${access_token}`
          }
        }
      );
      const userJson = (await userRes.json()) as any;
      if (userJson?.data?.user) {
        userInfo = {
          username: userJson.data.user.username || 'tex_lightsout',
          displayName: userJson.data.user.display_name || 'Lights Out Tattoo',
          avatarUrl: userJson.data.user.avatar_url
        };
      }
    } catch (e) {
      console.warn('Could not fetch user info from TikTok:', e);
    }

    // Save tokens securely on server
    saveStoredToken({
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: Date.now() + (expires_in || 86400) * 1000,
      refreshExpiresAt: refresh_expires_in ? Date.now() + refresh_expires_in * 1000 : undefined,
      openId: open_id,
      user: userInfo
    });

    const safeUsername = userInfo.username || 'tex_lightsout';
    const safeDisplayName = userInfo.displayName || 'Tex • Lead Artist';
    const safeAvatar = userInfo.avatarUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80';

    // Send successful callback page that closes popup or redirects
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>TikTok Connected Successfully</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: system-ui, -apple-system, sans-serif; background: #050811; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center;">
          <div style="background: #081122; border: 2px solid #00f0ff; border-radius: 16px; padding: 32px 24px; max-width: 420px; box-shadow: 0 0 30px rgba(0,240,255,0.3);">
            <div style="font-size: 40px; margin-bottom: 12px;">⚡</div>
            <h2 style="color: #00f0ff; margin: 0 0 8px 0; font-size: 22px;">TikTok Account Connected!</h2>
            <p style="color: #94a3b8; font-size: 14px; margin: 0 0 20px 0;">
              Lights Out Tattoo is now authenticated with your official TikTok feed.
            </p>
            <button onclick="handleComplete()" style="width: 100%; padding: 12px 20px; background: #00f0ff; color: #000; border: none; border-radius: 10px; font-weight: bold; font-size: 15px; cursor: pointer; transition: opacity 0.2s;">
              Return to Studio Dashboard
            </button>
          </div>
          <script>
            function handleComplete() {
              const sessionData = {
                isAuthenticated: true,
                method: 'tiktok',
                username: ${JSON.stringify(safeUsername)}.startsWith('@') ? ${JSON.stringify(safeUsername)} : '@' + ${JSON.stringify(safeUsername)},
                displayName: ${JSON.stringify(safeDisplayName)},
                avatarUrl: ${JSON.stringify(safeAvatar)},
                verifiedArtist: true,
                loginTime: new Date().toISOString()
              };

              try {
                localStorage.setItem('lot_admin_session_v1', JSON.stringify(sessionData));
                localStorage.setItem('lightsout_admin_session', JSON.stringify(sessionData));
              } catch (e) {}

              if (window.opener && !window.opener.closed) {
                try {
                  window.opener.postMessage({ type: 'TIKTOK_AUTH_SUCCESS', user: ${JSON.stringify(userInfo)} }, '*');
                } catch(e) {}
                try {
                  window.close();
                  return;
                } catch(e) {}
              }
              
              // Direct navigation fallback (for mobile full redirects)
              setTimeout(() => {
                const rawReturn = ${JSON.stringify(returnUrl)};
                let targetUrl;
                try {
                  targetUrl = rawReturn ? new URL(rawReturn, window.location.href) : new URL('/?tab=admin', window.location.href);
                } catch(e) {
                  targetUrl = new URL('/?tab=admin', window.location.href);
                }
                targetUrl.searchParams.set('tab', 'admin');
                targetUrl.searchParams.set('tiktok_auth', 'success');
                targetUrl.searchParams.set('username', ${JSON.stringify(safeUsername)});
                targetUrl.searchParams.set('display_name', ${JSON.stringify(safeDisplayName)});
                targetUrl.searchParams.set('avatar', ${JSON.stringify(safeAvatar)});
                window.location.href = targetUrl.toString();
              }, 250);
            }
            
            // Auto close or redirect after 1.5 seconds
            setTimeout(() => { handleComplete(); }, 1500);
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('TikTok callback handler exception:', err);
    res.status(500).send(`Authentication error: ${err.message}`);
  }
});

// Fetch Live TikTok Videos using Stored Access Token
app.get(['/api/tiktok/videos', '/api/tiktok/videos.js'], async (req, res) => {
  const token = getStoredToken();
  const { clientKey, clientSecret } = getEffectiveCredentials(req);

  if (!token || !token.accessToken) {
    return res.status(401).json({
      success: false,
      error: 'TikTok account is not connected yet. Please connect in the Admin Dashboard.'
    });
  }

  let accessToken = token.accessToken;

  // Refresh token if near expiration (within 5 minutes)
  if (token.expiresAt < Date.now() + 5 * 60 * 1000 && token.refreshToken) {
    try {
      const refreshParams = new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken
      });

      const refreshRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: refreshParams.toString()
      });

      const refreshData = (await refreshRes.json()) as any;
      if (refreshData?.data?.access_token) {
        accessToken = refreshData.data.access_token;
        saveStoredToken({
          ...token,
          accessToken,
          refreshToken: refreshData.data.refresh_token || token.refreshToken,
          expiresAt: Date.now() + (refreshData.data.expires_in || 86400) * 1000
        });
      }
    } catch (e) {
      console.warn('Could not refresh TikTok token:', e);
    }
  }

  try {
    const listRes = await fetch(
      'https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,duration,cover_image_url,embed_html,embed_link,like_count,comment_count,share_count,view_count',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ max_count: 20 })
      }
    );

    const listData = (await listRes.json()) as any;

    if (listData?.error && listData.error.code !== 'ok' && listData.error.code !== 0) {
      return res.status(400).json({
        success: false,
        error: listData.error.message || 'Failed to fetch videos from TikTok API.'
      });
    }

    const rawVideos = listData?.data?.videos || [];
    const username = token.user?.username || 'tex_lightsout';

    // Map TikTok API fields to the app's TikTokReel structure
    const reels = rawVideos.map((v: any, index: number) => {
      const durationSecs = v.duration || 30;
      const mins = Math.floor(durationSecs / 60);
      const secs = (durationSecs % 60).toString().padStart(2, '0');

      return {
        id: v.id || `tt-${Date.now()}-${index}`,
        title: v.title || v.video_description?.slice(0, 45) || `Lights Out Tattoo Reel #${index + 1}`,
        caption: v.video_description || v.title || 'Studio tattoo work by Tex at Lights Out Tattoo in Winchester, VA.',
        thumbnailUrl: v.cover_image_url || 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=800&q=80',
        videoUrl: v.embed_link || `https://www.tiktok.com/@${username}/video/${v.id}`,
        tiktokUrl: v.embed_link || `https://www.tiktok.com/@${username}/video/${v.id}`,
        likes: typeof v.like_count === 'number' ? v.like_count : 1420,
        comments: typeof v.comment_count === 'number' ? v.comment_count : 89,
        views: typeof v.view_count === 'number' ? v.view_count : 18500,
        duration: `${mins}:${secs}`,
        soundTitle: 'Original Audio - Tex | Lights Out Tattoo',
        hashtags: ['#winchesterva', '#blackandgreyrealism', '#lightsouttattoo', '#coveruptattoo']
      };
    });

    res.json({
      success: true,
      count: reels.length,
      videos: reels,
      user: token.user || null
    });
  } catch (err: any) {
    console.error('Error in /api/tiktok/videos:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error while fetching TikTok videos.' });
  }
});

// Disconnect TikTok Account
app.post(['/api/tiktok/disconnect', '/api/tiktok/disconnect.js'], (req, res) => {
  saveStoredToken(null);
  res.json({ success: true, message: 'TikTok account disconnected.' });
});

// TikTok Content Posting API: Publish / Upload Video to TikTok
app.post(['/api/tiktok/publish-video', '/api/tiktok/publish-video.js'], async (req, res) => {
  try {
    let token = getStoredToken();
    if (!token || !token.accessToken) {
      return res.status(401).json({
        success: false,
        error: 'TikTok account is not connected. Please log in or connect TikTok in the Admin Dashboard first.'
      });
    }

    const { clientKey, clientSecret } = getEffectiveCredentials(req);

    // Refresh access token if it will expire within 5 minutes
    if (token.expiresAt && token.expiresAt < Date.now() + 5 * 60 * 1000 && token.refreshToken) {
      try {
        const refreshParams = new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken
        });
        const refreshRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: refreshParams.toString()
        });
        const refreshData = (await refreshRes.json()) as any;
        if (refreshData?.data?.access_token) {
          token = {
            ...token,
            accessToken: refreshData.data.access_token,
            refreshToken: refreshData.data.refresh_token || token.refreshToken,
            expiresAt: Date.now() + (refreshData.data.expires_in || 86400) * 1000
          };
          saveStoredToken(token);
        }
      } catch (e) {
        console.warn('Could not refresh TikTok token before publishing:', e);
      }
    }

    const {
      title,
      caption,
      privacyLevel = 'PUBLIC_TO_EVERYONE',
      disableComment = false,
      disableDuet = false,
      disableStitch = false,
      mediaUrl,
      imageUrl,
      videoUrl,
      videoDataUrl
    } = req.body || {};

    const fullTitle = (title || 'Lights Out Tattoo Session - Tex | Winchester VA').substring(0, 150);
    const postCaption = (caption || 'Custom black & grey realism by Tex at Lights Out Tattoo in Winchester, VA. #LightsOutTattoo #WinchesterVA #BlackAndGreyRealism #TattooArtist').substring(0, 500);

    const targetMedia = videoUrl || mediaUrl || imageUrl || videoDataUrl;
    const mediaSourceUrl = (targetMedia && (targetMedia.startsWith('http://') || targetMedia.startsWith('https://')))
      ? targetMedia
      : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

    // Live TikTok Content Posting API Call
    const publishInitUrl = 'https://open.tiktokapis.com/v2/post/publish/video/init/';
    const tiktokRes = await fetch(publishInitUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        post_info: {
          title: postCaption,
          privacy_level: privacyLevel,
          disable_duet: disableDuet,
          disable_stitch: disableStitch,
          disable_comment: disableComment,
          video_cover_timestamp_ms: 1000
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: mediaSourceUrl
        }
      })
    });

    const tiktokData = (await tiktokRes.json()) as any;

    if (tiktokData?.data?.publish_id) {
      return res.json({
        success: true,
        postId: tiktokData.data.publish_id,
        status: 'PROCESSING',
        message: 'Video successfully dispatched to your official TikTok Creator queue!',
        user: token.user || null,
        postDetails: {
          title: fullTitle,
          caption: postCaption,
          privacyLevel,
          account: token.user?.username || '@lightsouttattoo',
          publishId: tiktokData.data.publish_id,
          timestamp: new Date().toISOString()
        }
      });
    }

    if (tiktokData?.error && tiktokData.error.code !== 'ok' && tiktokData.error.code !== 0) {
      console.error('TikTok API publish error:', tiktokData.error);
      return res.status(400).json({
        success: false,
        error: tiktokData.error.message || `TikTok Content Posting error: ${tiktokData.error.code}`,
        code: tiktokData.error.code,
        details: tiktokData.error
      });
    }

    res.json({
      success: true,
      data: tiktokData,
      message: 'Video dispatch initiated with TikTok.'
    });
  } catch (err: any) {
    console.error('Error in /api/tiktok/publish-video:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to publish video.' });
  }
});

// Session Recording Customer Waivers Persistence
const WAIVERS_FILE = path.join(DATA_DIR, 'session-waivers.json');
function getStoredWaivers(): any[] {
  try {
    if (fs.existsSync(WAIVERS_FILE)) {
      return JSON.parse(fs.readFileSync(WAIVERS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.warn('Could not read waivers file:', e);
  }
  return [];
}

function saveStoredWaivers(waivers: any[]) {
  try {
    fs.writeFileSync(WAIVERS_FILE, JSON.stringify(waivers, null, 2));
  } catch (e) {
    console.warn('Could not save waivers file:', e);
  }
}

app.get('/api/tiktok/waivers', (_req, res) => {
  res.json({ success: true, waivers: getStoredWaivers() });
});

app.post('/api/tiktok/waivers', (req, res) => {
  try {
    const waiver = req.body;
    if (!waiver || !waiver.clientName) {
      return res.status(400).json({ success: false, error: 'Client name is required.' });
    }
    const current = getStoredWaivers();
    const existingIdx = current.findIndex(w => w.id === waiver.id);
    if (existingIdx >= 0) {
      current[existingIdx] = waiver;
    } else {
      current.unshift({ ...waiver, id: waiver.id || `waiver_${Date.now()}`, createdAt: new Date().toISOString() });
    }
    saveStoredWaivers(current);
    res.json({ success: true, message: 'Waiver archived successfully.', waiver });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to save waiver.' });
  }
});

// Terms of Service & Privacy Policy pages for TikTok Review & Legal Compliance
app.get(['/terms', '/terms.html'], (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'terms.html'));
});

app.get(['/privacy', '/privacy.html'], (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'privacy.html'));
});

// TikTok Site Verification Handlers
app.get([
  '/tiktokcw6drnoBwS7nieDfal86gOIYmNXyuwce.txt',
  '/tiktokcw6drnoBwS7nieDfal86gOIYmNXyuwce',
  '/tiktokcw6drnoBwS7nieDfal86gOIYmNXyuwce.html',
  '/cw6drnoBwS7nieDfal86gOIYmNXyuwce.txt',
  '/cw6drnoBwS7nieDfal86gOIYmNXyuwce',
  '/tiktok-developers-site-verification=cw6drnoBwS7nieDfal86gOIYmNXyuwce.txt',
  '/tiktok-developers-site-verification=cw6drnoBwS7nieDfal86gOIYmNXyuwce'
], (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send('tiktok-developers-site-verification=cw6drnoBwS7nieDfal86gOIYmNXyuwce');
});

app.get([
  '/tiktokjaSTg2IpD2nb7nEmecsym5INX9JAYTPE.txt',
  '/tiktokjaSTg2IpD2nb7nEmecsym5INX9JAYTPE',
  '/tiktokjaSTg2IpD2nb7nEmecsym5INX9JAYTPE.html',
  '/jaSTg2IpD2nb7nEmecsym5INX9JAYTPE.txt',
  '/jaSTg2IpD2nb7nEmecsym5INX9JAYTPE'
], (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send('tiktok-developers-site-verification=jaSTg2IpD2nb7nEmecsym5INX9JAYTPE');
});

app.get([
  '/tiktokj5S7S4gulNid8wnfjEkpKRH7omnBIevf.txt',
  '/tiktokj5S7S4gulNid8wnfjEkpKRH7omnBIevf',
  '/tiktokj5S7S4gulNid8wnfjEkpKRH7omnBIevf.html',
  '/j5S7S4gulNid8wnfjEkpKRH7omnBIevf.txt',
  '/j5S7S4gulNid8wnfjEkpKRH7omnBIevf'
], (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send('tiktok-developers-site-verification=j5S7S4gulNid8wnfjEkpKRH7omnBIevf');
});

app.get([
  '/tiktokNvIsWtczel9ZMsUoQCigmwaEDqicmW6Y.txt',
  '/tiktokNvIsWtczel9ZMsUoQCigmwaEDqicmW6Y',
  '/tiktokNvIsWtczel9ZMsUoQCigmwaEDqicmW6Y.html',
  '/NvIsWtczel9ZMsUoQCigmwaEDqicmW6Y.txt',
  '/NvIsWtczel9ZMsUoQCigmwaEDqicmW6Y',
  '/tiktok-developers-site-verification=NvIsWtczel9ZMsUoQCigmwaEDqicmW6Y',
  '/tiktok-developers-site-verification=NvIsWtczel9ZMsUoQCigmwaEDqicmW6Y.txt'
], (_req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send('tiktok-developers-site-verification=NvIsWtczel9ZMsUoQCigmwaEDqicmW6Y');
});

app.get([
  '/tiktokgcSAuMnKeTyTT5rt0MqxoF7ts81PchJs.txt',
  '/tiktokgcSAuMnKeTyTT5rt0MqxoF7ts81PchJs',
  '/tiktokgcSAuMnKeTyTT5rt0MqxoF7ts81PchJs.html',
  '/gcSAuMnKeTyTT5rt0MqxoF7ts81PchJs.txt',
  '/gcSAuMnKeTyTT5rt0MqxoF7ts81PchJs',
  '/tiktok-developers-site-verification=gcSAuMnKeTyTT5rt0MqxoF7ts81PchJs',
  '/tiktok-developers-site-verification=gcSAuMnKeTyTT5rt0MqxoF7ts81PchJs.txt'
], (_req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send('tiktok-developers-site-verification=gcSAuMnKeTyTT5rt0MqxoF7ts81PchJs');
});

app.get([
  '/tiktok-developers-site-verification.txt',
  '/tiktok-developers-site-verification.html',
  '/tiktok-developers-site-verification',
  '/tiktok-developers-site-verification=Q4MdY0AKh52HR2LPdnehYCcu1PLjvFOP',
  '/tiktok-developers-site-verification=Q4MdY0AKh52HR2LPdnehYCcu1PLjvFOP.txt',
  '/tiktok-developers-site-verification=Q4MdY0AKh52HR2LPdnehYCcu1PLjvFOP.html',
  '/Q4MdY0AKh52HR2LPdnehYCcu1PLjvFOP.txt',
  '/Q4MdY0AKh52HR2LPdnehYCcu1PLjvFOP.html',
  '/Q4MdY0AKh52HR2LPdnehYCcu1PLjvFOP'
], (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send('tiktok-developers-site-verification=Q4MdY0AKh52HR2LPdnehYCcu1PLjvFOP');
});

// Vite middleware for development & Static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lights Out Tattoo server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
