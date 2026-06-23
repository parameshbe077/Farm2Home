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

export function getOrderAlertStatus() {
  const recipients = getAlertRecipients();
  return {
    configured: isSmtpConfigured() && recipients.length > 0,
    smtpUser: process.env.SMTP_USER?.trim() || null,
    recipientCount: recipients.length,
    smtpHost: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
  };
}

function isSmtpConfigured() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s/g, '');
  return !!(user && pass);
}

function getFromAddress() {
  const user = process.env.SMTP_USER?.trim();
  const custom = process.env.SMTP_FROM?.trim();

  if (custom && custom.includes('@')) {
    return custom;
  }

  return `"Farm2Home" <${user}>`;
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

  // Gmail on Render: use STARTTLS on 587 (port 465 / IPv6 often fails on free tier)
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

export async function sendOrderAlert(order) {
  const recipients = getAlertRecipients();
  if (!recipients.length) {
    console.warn('Order alert skipped: set ORDER_ALERT_EMAILS or ADMIN_EMAILS');
    return;
  }

  if (!isSmtpConfigured()) {
    console.warn('Order alert skipped: set SMTP_USER and SMTP_PASS');
    return;
  }

  const transporter = createTransporter();
  const { subject, text } = buildOrderEmail(order);

  try {
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to: recipients.join(', '),
      subject,
      text,
    });
    console.log(`Order alert email sent to ${recipients.join(', ')} (${info.messageId})`);
  } catch (err) {
    console.error('Order alert failed:', err.message);
    if (err.code) console.error('  code:', err.code);
    if (err.response) console.error('  response:', err.response);
    throw err;
  }
}
