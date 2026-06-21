import PageBanner from '../components/PageBanner';
import { useState } from 'react';
import { sendContact } from '../api/api';
import { useToast } from '../context/ToastContext';

const contactInfo = [
  { label: 'Address', value: 'Green Valley Farm, Rural District' },
  { label: 'Phone', value: '+91 9963785421' },
  { label: 'Email', value: 'farm2homesouth@gmail.com' },
  { label: 'Hours', value: 'Mon–Sat, 6 AM – 6 PM' },
];

export default function Contact() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await sendContact(form);
      showToast(res.message || 'Message sent!');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      showToast(err.message || 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <PageBanner
        label="Support"
        title="Get in Touch"
        subtitle="Questions about orders or wholesale? We'd love to hear from you."
      />
      <div className="container">
        <div className="contact">
          <div className="contact__info">
            <div className="contact__cards">
              {contactInfo.map((item) => (
                <div className="contact-card" key={item.label}>
                  <strong>{item.label}</strong>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <form className="contact__form" onSubmit={handleSubmit}>
            <h3>Send us a message</h3>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Your name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                rows="4"
                value={form.message}
                onChange={handleChange}
                required
                placeholder="How can we help?"
              />
            </div>
            <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
