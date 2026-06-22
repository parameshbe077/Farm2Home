import { useEffect, useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { fetchAdminContactMessages } from '../../api/adminApi';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function buildGmailReplyUrl(msg) {
  const to = encodeURIComponent(msg.email.trim());
  const subject = encodeURIComponent('Re: Farm2Home enquiry');
  const body = encodeURIComponent(
    `Hi ${msg.name},\n\nThank you for contacting Farm2Home.\n\n---\nYour message:\n${msg.message}\n`,
  );
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
}

function buildMailtoUrl(msg) {
  const subject = encodeURIComponent('Re: Farm2Home enquiry');
  const body = encodeURIComponent(
    `Hi ${msg.name},\n\nThank you for contacting Farm2Home.\n\n---\nYour message:\n${msg.message}\n`,
  );
  return `mailto:${msg.email.trim()}?subject=${subject}&body=${body}`;
}

export default function AdminMessages() {
  const { getToken } = useAdminAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const token = await getToken();
        const data = await fetchAdminContactMessages(token);
        if (!cancelled) setMessages(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [getToken]);

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>Contact messages</h1>
        <p>{messages.length} message{messages.length !== 1 ? 's' : ''} from the website form</p>
      </header>

      {error && <p className="admin-error">{error}</p>}

      {loading ? (
        <p className="admin-empty">Loading messages…</p>
      ) : messages.length === 0 ? (
        <p className="admin-empty">No contact messages yet.</p>
      ) : (
        <div className="admin-messages">
          {messages.map((msg) => (
            <article className="admin-message-card" key={msg.id}>
              <div className="admin-message-card__header">
                <div>
                  <strong>{msg.name}</strong>
                  <a href={`mailto:${msg.email}`} className="admin-message-card__email">
                    {msg.email}
                  </a>
                </div>
                <span className="admin-message-card__date">{formatDate(msg.createdAt)}</span>
              </div>
              <p className="admin-message-card__body">{msg.message}</p>
              <div className="admin-message-card__actions">
                <a
                  href={buildGmailReplyUrl(msg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-btn admin-btn--primary admin-btn--sm"
                >
                  Reply in Gmail
                </a>
                <a
                  href={buildMailtoUrl(msg)}
                  className="admin-btn admin-btn--outline admin-btn--sm"
                >
                  Open in mail app
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
