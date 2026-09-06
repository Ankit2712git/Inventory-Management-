# Bangla Haat — Inventory & Store Management

Modern artisan inventory, billing, and customer storefront crafted for Bangla Haat.

---

## 🔒 Security Architecture & Secret Protection

This repository is hardened to ensure **no API keys, database credentials, or secret tokens** can be leaked or stolen:

### 1. Zero Credentials in Source Code
- All sensitive credentials (`RESEND_API_KEY`, `ADMIN_API_KEY`, Supabase secrets) are strictly managed via server environment variables.
- The frontend code (`supabase-client.js`, `app.js`) contains **zero hardcoded tokens or keys**.
- Public client configuration is served dynamically via the protected `/api/config.js` endpoint only when configured by the store owner.

### 2. GitHub Repository Protection (`.gitignore`)
The `.gitignore` file blocks all potential leaks from being committed to git:
- `.env`, `.env.*`, `*.env`, `.env.local`
- Private keys and certificates (`*.pem`, `*.key`, `*.cert`, `*.p12`, `*.crt`)
- Cloud credential files (`credentials.json`, `serviceAccountKey*.json`, `client_secret*.json`, `token.json`)
- OS files (`.DS_Store`, `Thumbs.db`)
- Logs and dependency folders (`node_modules/`, `*.log`)

### 3. Backend Hardening (`server.js`)
- **Sensitive File Blocking**: Attempts to access `.env`, `package.json`, `server.js`, `bun.lock`, `metadata.json`, or `.git` return `403 Forbidden`.
- **HTTP Security Headers**: Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin`.
- **Fingerprinting Protection**: Disables `X-Powered-By` header.
- **Abuse Prevention**: Implements IP-based rate limiting (max 10 requests per 5 minutes) and payload size limits on contact/inquiry submissions.
- **Input Validation**: Sanitizes and enforces strict character limits on contact form inputs.

---

## ⚙️ Environment Configuration

To configure credentials locally or in production, copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Define your keys in `.env` (never commit this file):

```env
# Server-side email forwarding
RESEND_API_KEY=re_your_api_key_here

# Protected admin retrieval token
ADMIN_API_KEY=your_secure_admin_token

# Supabase synchronization (optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```
