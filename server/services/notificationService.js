import 'dotenv/config';
import dns from 'node:dns';
import nodemailer from 'nodemailer';

function ipv4Lookup(hostname, options, callback) {
  dns.lookup(hostname, { family: 4 }, callback);
}

function formatInr(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getAlertRecipients() {
  const raw = process.env.ORDER_ALERT_EMAILS || process.env.ADMIN_EMAILS || '';
  return raw.split(',').map((e) => e.trim()).filter(Boolean);
}

function isResendConfigured() {
  return !!process.env.RESEND_API_KEY?.trim();
}

function isSmtpConfigured() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s/g, '');
  return !!(user && pass);
}

function isEmailConfigured() {
  return getAlertRecipients().length > 0 && (isResendConfigured() || isSmtpConfigured());
}

export function getOrderAlertStatus() {
  const recipients = getAlertRecipients();
  const provider = isResendConfigured() ? 'resend' : (isSmtpConfigured() ? 'smtp' : null);
  return {
    configured: isEmailConfigured(),
    provider,
    recipientCount: recipients.length,
    smtpUser: process.env.SMTP_USER?.trim() || null,
    resendFrom: process.env.RESEND_FROM?.trim() || null,
  };
}

function getSmtpFromAddress() {
  const user = process.env.SMTP_USER?.trim();
  const custom = process.env.SMTP_FROM?.trim();

  if (custom && custom.includes('@')) {
    return custom;
  }

  return `"Farm2Home" <${user}>`;
}

function getResendFromAddress() {
  return process.env.RESEND_FROM?.trim() || 'Farm2Home <onboarding@resend.dev>';
}

function createTransporter() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s/g, '');
  const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';

  const base = {
    auth: { user, pass },
    lookup: ipv4Lookup,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000,
  };

  if (host === 'smtp.gmail.com') {
    return nodemailer.createTransport({
      ...base,
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      tls: { minVersion: 'TLSv1.2' },
    });
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true';
  return nodemailer.createTransport({
    ...base,
    host,
    port,
    secure,
  });
}

function buildOrderEmail(order) {
  const c = order.customer || {};
  const shortId = order.id.slice(-6).toUpperCase();
  const itemsList = (order.items || [])
    .map((i) => `  - ${i.name} x ${i.qty} — ${formatInr(i.lineTotal)}`)
    .join('\n');

  const text = `New Farm2Home order received!

Order #${shortId}
Total: ${formatInr(order.total)}
Payment: Cash on Delivery
Status: ${order.status || 'pending'}

Customer
  Name: ${c.name || '—'}
  Phone: ${c.phone || '—'}

Delivery address
  ${c.address || '—'}
  ${c.area || '—'} — ${c.pincode || '—'}

Items
${itemsList}

Manage this order in your admin panel → Orders.`;

  return {
    subject: `New order #${shortId} — ${formatInr(order.total)}`,
    text,
  };
}

async function sendViaResend(recipients, subject, text) {
  const apiKey = process.env.RESEND_API_KEY.trim();
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getResendFromAddress(),
      to: recipients,
      subject,
      text,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.message || data.error || JSON.stringify(data);
    throw new Error(`Resend: ${detail}`);
  }

  console.log(`Order alert email sent via Resend to ${recipients.join(', ')} (${data.id})`);
}

async function sendViaSmtp(recipients, subject, text) {
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: getSmtpFromAddress(),
    to: recipients.join(', '),
    subject,
    text,
  });
  console.log(`Order alert email sent via SMTP to ${recipients.join(', ')} (${info.messageId})`);
}

export async function sendOrderAlert(order) {
  const recipients = getAlertRecipients();
  if (!recipients.length) {
    console.warn('Order alert skipped: set ORDER_ALERT_EMAILS or ADMIN_EMAILS');
    return;
  }

  if (!isResendConfigured() && !isSmtpConfigured()) {
    console.warn('Order alert skipped: set RESEND_API_KEY (Render) or SMTP_USER + SMTP_PASS (local)');
    return;
  }

  const { subject, text } = buildOrderEmail(order);

  try {
    if (isResendConfigured()) {
      await sendViaResend(recipients, subject, text);
      return;
    }
    await sendViaSmtp(recipients, subject, text);
  } catch (err) {
    console.error('Order alert failed:', err.message);
    if (err.code) console.error('  code:', err.code);
    if (err.response) console.error('  response:', err.response);
    throw err;
  }
}
