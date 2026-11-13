import { useEffect, useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  fetchAdminRiders,
  createAdminRider,
  setAdminRiderPassword,
  deleteAdminRider,
} from '../../api/adminApi';

const EMPTY_FORM = { name: '', email: '', password: '' };

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function AdminRiders() {
  const { getToken } = useAdminAuth();
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [passwordFor, setPasswordFor] = useState(null);
  const [nextPassword, setNextPassword] = useState('');

  const loadRiders = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      setRiders(await fetchAdminRiders(token));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRiders(); }, []);

  const closeForm = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const rider = await createAdminRider(token, {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setRiders((current) => [rider, ...current.filter((entry) => entry.id !== rider.id)]);
      setNotice(rider.reusedAccount
        ? `${rider.name} can shop and deliver with ${rider.email}. The password you set replaces their old one.`
        : `${rider.name} can shop and deliver with ${rider.email}.`);
      closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (event) => {
    event.preventDefault();
    if (!passwordFor) return;
    if (nextPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const token = await getToken();
      await setAdminRiderPassword(token, passwordFor.id, nextPassword);
      setNotice(`Password updated for ${passwordFor.name}.`);
      setPasswordFor(null);
      setNextPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rider) => {
    const message = `Remove ${rider.name} from deliveries? They can still sign in and shop.`;
    if (!window.confirm(message)) return;
    setError('');
    setNotice('');
    try {
      const token = await getToken();
      await deleteAdminRider(token, rider.id);
      setRiders((current) => current.filter((entry) => entry.id !== rider.id));
      if (passwordFor?.id === rider.id) {
        setPasswordFor(null);
        setNextPassword('');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page__header admin-page__header--row">
        <div>
          <h1>Riders</h1>
          <p>The same email can shop and deliver. They open deliveries from the Delivery page.</p>
        </div>
        <button type="button" className="admin-btn admin-btn--primary" onClick={() => { setError(''); setShowForm(true); }}>
          + Add rider
        </button>
      </header>

      {error && <p className="admin-error">{error}</p>}
      {notice && <p className="admin-login__success">{notice}</p>}

      {loading ? (
        <p className="admin-empty">Loading riders…</p>
      ) : riders.length === 0 ? (
        <p className="admin-empty">No riders yet. Add one to give them an email and password.</p>
      ) : (
        <div className="admin-messages">
          {riders.map((rider) => (
            <article className="admin-message-card" key={rider.id}>
              <div className="admin-message-card__header">
                <div>
                  <strong>{rider.name}</strong>
                  <span className="admin-message-card__email">{rider.email}</span>
                </div>
                <span className="admin-message-card__date">Added {formatDate(rider.createdAt)}</span>
              </div>
              {passwordFor?.id === rider.id ? (
                <form className="admin-rider-password" onSubmit={handlePassword}>
                  <div className="form-group">
                    <label htmlFor={`rider-password-${rider.id}`}>New password</label>
                    <input
                      id={`rider-password-${rider.id}`}
                      type="password"
                      value={nextPassword}
                      onChange={(e) => setNextPassword(e.target.value)}
                      minLength={6}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="admin-message-card__actions">
                    <button type="submit" className="admin-btn admin-btn--primary admin-btn--sm" disabled={saving}>
                      {saving ? 'Saving…' : 'Save password'}
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--outline admin-btn--sm"
                      onClick={() => { setPasswordFor(null); setNextPassword(''); }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="admin-message-card__actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn--outline admin-btn--sm"
                    onClick={() => { setPasswordFor(rider); setNextPassword(''); setError(''); }}
                  >
                    New password
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--danger admin-btn--sm"
                    onClick={() => handleDelete(rider)}
                  >
                    Remove
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {showForm && (
        <div className="admin-modal-overlay" onClick={closeForm}>
          <form className="admin-modal" onSubmit={handleCreate} onClick={(e) => e.stopPropagation()}>
            <h2>Add rider</h2>
            <div className="admin-form-grid">
              <div className="form-group admin-form-group--full">
                <label htmlFor="rider-name">Name</label>
                <input
                  id="rider-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={40}
                  required
                  autoComplete="name"
                />
              </div>
              <div className="form-group admin-form-group--full">
                <label htmlFor="rider-email">Email</label>
                <input
                  id="rider-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="form-group admin-form-group--full">
                <label htmlFor="rider-password">Password</label>
                <input
                  id="rider-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
                <p className="form-hint">At least 6 characters. A customer email keeps shopping, and can also deliver. This password replaces their old one.</p>
              </div>
            </div>
            <div className="admin-modal__actions">
              <button type="button" className="admin-btn admin-btn--ghost" onClick={closeForm}>
                Cancel
              </button>
              <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
                {saving ? 'Saving…' : 'Add rider'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
