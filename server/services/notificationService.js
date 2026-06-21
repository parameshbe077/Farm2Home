import 'dotenv/config';
import nodemailer from 'nodemailer';

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

function isSmtpConfigured() {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
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

  if (process.env.SMTP_HOST === 'smtp.gmail.com' || !process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
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
    console.warn('Order alert skipped: set ORDER_ALERT_EMAILS or ADMIN_EMAILS in .env');
    return;
  }

  if (!isSmtpConfigured()) {
    console.warn('Order alert skipped: set SMTP_USER and SMTP_PASS in server/.env');
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
