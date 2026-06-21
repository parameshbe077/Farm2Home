# Order Alerts Setup

Get an email when a customer places an order.

## 1. Gmail app password (recommended)

If you use Gmail (`farm2homesouth@gmail.com`):

1. Enable [2-Step Verification](https://myaccount.google.com/signinoptions/two-step-verification) on your Google account
2. Go to [App passwords](https://myaccount.google.com/apppasswords)
3. Create an app password for **Mail** → **Other (Farm2Home)**
4. Copy the 16-character password

## 2. Add to `server/.env`

```env
ORDER_ALERT_EMAILS=farm2homesouth@gmail.com

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=farm2homesouth@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
```

`ORDER_ALERT_EMAILS` can be comma-separated for multiple recipients. If omitted, alerts go to `ADMIN_EMAILS`.

## 3. Restart the server

```bash
npm run dev
```

## 4. Test

Place a test order from the store. You should receive an email with:

- Customer name, phone, delivery address
- Order items and total
- Order ID

If SMTP is not configured, orders still save — the server logs a warning instead of sending email.

## Other email providers

| Provider | SMTP_HOST | Port |
|----------|-----------|------|
| Gmail | smtp.gmail.com | 587 |
| Outlook | smtp.office365.com | 587 |
| Zoho | smtp.zoho.in | 587 |

Use your provider's SMTP username and password (or app password).
