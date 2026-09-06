const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// In-memory message store for customer inquiries
const inquiries = [];

// Disable Express fingerprinting header
app.disable('x-powered-by');

// -----------------------------------------------------------------------------
// Security Headers Middleware
// -----------------------------------------------------------------------------
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// -----------------------------------------------------------------------------
// Sensitive Files & Directory Traversal Protection
// Prevents unauthorized access to .env*, package.json, server.js, credentials, etc.
// -----------------------------------------------------------------------------
app.use((req, res, next) => {
  let safePath = '';
  try {
    safePath = path.normalize(decodeURIComponent(req.path)).toLowerCase();
  } catch (err) {
    return res.status(400).json({ error: 'Invalid request path' });
  }

  // Block any dotfile requests (.env, .git, .github, etc.)
  if (/(^|\/)\.[^.]/.test(safePath) || safePath.includes('.env')) {
    return res.status(403).json({ error: 'Access denied: protected system file.' });
  }

  // Block sensitive repository, database, and backend source files
  const forbiddenFiles = [
    'package.json',
    'package-lock.json',
    'bun.lock',
    'server.js',
    'metadata.json',
    'supabase-security.sql',
    'credentials.json',
    'readme.md'
  ];

  const fileName = path.basename(safePath);
  if (
    forbiddenFiles.includes(fileName) ||
    fileName.endsWith('.sql') ||
    fileName.endsWith('.key') ||
    fileName.endsWith('.pem') ||
    fileName.endsWith('.cert')
  ) {
    return res.status(403).json({ error: 'Access denied: sensitive resource.' });
  }

  next();
});

// Parse JSON request bodies with strict size limits to prevent DoS
app.use(express.json({ limit: '50kb' }));

// -----------------------------------------------------------------------------
// Dynamic Client Configuration Endpoint
// Safely provides only non-sensitive public configuration to the browser.
// Private secrets (RESEND_API_KEY, ADMIN_API_KEY) are NEVER exposed here.
// -----------------------------------------------------------------------------
app.get('/api/config.js', (req, res) => {
  res.type('application/javascript');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  const clientConfig = {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    adminEmails: (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)
  };
  res.send(`window.BANGLA_HAAT_CONFIG = ${JSON.stringify(clientConfig)};`);
});

app.get('/api/config', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    adminEmails: (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Bangla Haat' });
});

// -----------------------------------------------------------------------------
// Rate Limiter for Inquiries (prevents spam and abuse)
// -----------------------------------------------------------------------------
const rateLimitMap = new Map();
function inquiryRateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minute window
  const maxRequests = 10;

  const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count++;
  }
  rateLimitMap.set(ip, record);

  if (record.count > maxRequests) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please wait a few minutes before submitting another inquiry.'
    });
  }
  next();
}

// -----------------------------------------------------------------------------
// Customer inquiries endpoint (POST /api/messages)
// -----------------------------------------------------------------------------
app.post('/api/messages', inquiryRateLimiter, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim()) || email.length > 254) {
      return res.status(400).json({
        success: false,
        error: 'A valid email address is required.'
      });
    }

    if (!message || typeof message !== 'string' || message.trim().length < 3 || message.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be between 3 and 5000 characters.'
      });
    }

    const cleanName = typeof name === 'string' ? name.trim().slice(0, 100) : 'Customer';
    const cleanSubject = typeof subject === 'string' ? subject.trim().slice(0, 150) : 'Customer Inquiry';
    const cleanMessage = message.trim();

    const inquiry = {
      id: `inq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: cleanName,
      email: email.trim(),
      subject: cleanSubject,
      message: cleanMessage,
      createdAt: new Date().toISOString()
    };

    inquiries.unshift(inquiry);
    // Keep in-memory store bounded
    if (inquiries.length > 200) inquiries.pop();

    console.log(`[Bangla Haat] New inquiry received from ${inquiry.name} <${inquiry.email}>: "${inquiry.subject}"`);

    // Optional dispatch via Resend if RESEND_API_KEY is configured in backend environment
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Bangla Haat <onboarding@resend.dev>',
            to: ['ankitmajumdar27@gmail.com'],
            reply_to: inquiry.email,
            subject: `[Bangla Haat] ${inquiry.subject}`,
            text: `From: ${inquiry.name} (${inquiry.email})\nSubject: ${inquiry.subject}\n\n${inquiry.message}`
          })
        });
      } catch (mailErr) {
        console.warn('[Bangla Haat] Resend email dispatch failed:', mailErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Message delivered successfully to store team.',
      id: inquiry.id
    });
  } catch (err) {
    console.error('[Bangla Haat] Error processing inquiry:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to process inquiry. Please try again later.'
    });
  }
});

// -----------------------------------------------------------------------------
// Retrieve inquiries (Protected admin endpoint)
// -----------------------------------------------------------------------------
app.get('/api/messages', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const adminKey = process.env.ADMIN_API_KEY;

  // If an ADMIN_API_KEY is set in the environment, require matching authorization
  if (adminKey && token !== adminKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Admin authorization token required.'
    });
  }

  res.json({
    success: true,
    total: inquiries.length,
    messages: inquiries
  });
});

// -----------------------------------------------------------------------------
// Static Asset Serving (Hardened & Cache-Busted)
// -----------------------------------------------------------------------------
app.use(
  express.static(__dirname, {
    dotfiles: 'ignore',
    index: 'index.html',
    maxAge: 0,
    etag: false,
    setHeaders: (res, filePath) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  })
);

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Bangla Haat secured server running at http://${HOST}:${PORT}`);
});
