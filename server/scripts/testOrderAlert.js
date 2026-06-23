import 'dotenv/config';
import { sendOrderAlert } from '../services/notificationService.js';

const sampleOrder = {
  id: 'test123456',
  total: 350,
  status: 'pending',
  customer: {
    name: 'Test Customer',
    phone: '9963785421',
    address: '123 Test Street',
    area: 'Madurai',
    pincode: '625001',
  },
  items: [
    { name: 'Alphonso Mango', qty: 1, lineTotal: 200 },
    { name: 'Tomato', qty: 1, lineTotal: 150 },
  ],
};

console.log('Testing order alert email...');
console.log('Provider:', process.env.RESEND_API_KEY ? 'resend' : 'smtp');
console.log('ORDER_ALERT_EMAILS:', process.env.ORDER_ALERT_EMAILS);

sendOrderAlert(sampleOrder)
  .then(() => {
    console.log('Done — check your inbox (and spam folder).');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Test failed:', err.message);
    process.exit(1);
  });
