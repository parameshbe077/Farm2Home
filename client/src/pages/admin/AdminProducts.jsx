import { useEffect, useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from '../../api/adminApi';
import { formatPrice } from '../../utils/formatPrice';

const EMPTY_FORM = {
  name: '',
  category: 'fruits',
  emoji: '🌾',
  price: '',
  unit: 'per kg',
  featured: false,
  inStock: true,
};

export default function AdminProducts() {
  const { getToken } = useAdminAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      setProducts(await fetchAdminProducts(token));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      emoji: product.emoji,
      price: String(product.price),
      unit: product.unit,
      featured: Boolean(product.featured),
      inStock: product.inStock !== false,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const token = await getToken();
      const payload = {
        ...form,
        price: Number(form.price),
      };
      if (editingId) {
        await updateAdminProduct(token, editingId, payload);
      } else {
        await createAdminProduct(token, payload);
      }
      closeForm();
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStock = async (product) => {
    try {
      const token = await getToken();
      await updateAdminProduct(token, product.id, { inStock: product.inStock === false });
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      const token = await getToken();
      await deleteAdminProduct(token, id);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page__header admin-page__header--row">
        <div>
          <h1>Products</h1>
          <p>{products.length} items in catalog</p>
        </div>
        <button type="button" className="admin-btn admin-btn--primary" onClick={openAdd}>
          + Add product
        </button>
      </header>

      {error && <p className="admin-error">{error}</p>}

      {showForm && (
        <div className="admin-modal-overlay" onClick={closeForm}>
          <form className="admin-modal" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit product' : 'Add product'}</h2>
            <div className="admin-form-grid">
              <div className="form-group">
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Emoji</label>
                <input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} maxLength={4} />
              </div>
              <div className="form-group">
                <label htmlFor="product-category">Category</label>
                <select
                  id="product-category"
                  className="form-select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="fruits">Fruits</option>
                  <option value="rice">Rice</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="flowers">Flowers</option>
                </select>
              </div>
              <div className="form-group">
                <label>Price (₹)</label>
                <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Unit</label>
                <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="per kg" />
              </div>
              <div className="admin-checkbox-row">
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  />
                  <span>Featured on homepage</span>
                </label>
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={form.inStock}
                    onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                  />
                  <span>In stock (available to order)</span>
                </label>
              </div>
            </div>
            <div className="admin-modal__actions">
              <button type="button" className="admin-btn admin-btn--ghost" onClick={closeForm}>Cancel</button>
              <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="admin-empty">Loading products…</p>
      ) : (
        <>
          <div className="admin-product-list">
            {products.map((p) => (
              <article className="admin-product-card" key={p.id}>
                <div className="admin-product-card__info">
                  <span className="admin-product-card__emoji">{p.emoji}</span>
                  <div>
                    <strong>{p.name}</strong>
                    <span className="admin-product-card__meta">
                      <span className={`admin-tag admin-tag--${p.category}`}>{p.category}</span>
                      {formatPrice(p.price)} · {p.unit}
                      {p.featured && <span className="admin-product-card__featured">Featured</span>}
                      <span className={`admin-stock-tag${p.inStock !== false ? ' admin-stock-tag--in' : ' admin-stock-tag--out'}`}>
                        {p.inStock !== false ? 'In stock' : 'Out of stock'}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="admin-product-card__actions">
                  <button
                    type="button"
                    className={`admin-btn admin-btn--sm${p.inStock !== false ? ' admin-btn--warn' : ' admin-btn--primary'}`}
                    onClick={() => handleToggleStock(p)}
                  >
                    {p.inStock !== false ? 'Mark out of stock' : 'Mark in stock'}
                  </button>
                  <button type="button" className="admin-btn admin-btn--outline admin-btn--sm" onClick={() => openEdit(p)}>
                    Edit
                  </button>
                  <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDelete(p.id, p.name)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="admin-table-wrap admin-table-wrap--desktop">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Featured</th>
                  <th className="admin-table__cell--center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="admin-table__emoji">{p.emoji}</span>
                      {p.name}
                      <small>{p.unit}</small>
                    </td>
                    <td><span className={`admin-tag admin-tag--${p.category}`}>{p.category}</span></td>
                    <td>{formatPrice(p.price)}</td>
                    <td>
                      <button
                        type="button"
                        className={`admin-stock-btn${p.inStock !== false ? ' admin-stock-btn--in' : ' admin-stock-btn--out'}`}
                        onClick={() => handleToggleStock(p)}
                      >
                        {p.inStock !== false ? 'In stock' : 'Out of stock'}
                      </button>
                    </td>
                    <td>{p.featured ? 'Yes' : '—'}</td>
                    <td className="admin-table__cell--center">
                      <div className="admin-table__actions">
                        <button type="button" className="admin-btn admin-btn--outline admin-btn--sm" onClick={() => openEdit(p)}>Edit</button>
                        <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDelete(p.id, p.name)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
