const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// In-memory message store for customer inquiries
const inquiries = [];

// Parse JSON request bodies
app.use(express.json());

// Serve static assets from project root
app.use(express.static(__dirname));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Bangla Haat' });
});

// Customer inquiries endpoint
app.post('/api/messages', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};

    if (!email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Email address and message are required.'
      });
    }

    const inquiry = {
      id: `inq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: (name || 'Customer').trim(),
      email: email.trim(),
      subject: (subject || 'Customer Inquiry').trim(),
      message: message.trim(),
      createdAt: new Date().toISOString()
    };

    inquiries.unshift(inquiry);
    console.log(`[Bangla Haat] New inquiry received from ${inquiry.name} <${inquiry.email}>: "${inquiry.subject}"`);

    // Optional dispatch via Resend if RESEND_API_KEY is configured
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
      error: 'Failed to process inquiry. Please try again or use direct mail.'
    });
  }
});

// Retrieve inquiries (for store management)
app.get('/api/messages', (req, res) => {
  res.json({
    success: true,
    total: inquiries.length,
    messages: inquiries
  });
});

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Bangla Haat server running at http://${HOST}:${PORT}`);
});
