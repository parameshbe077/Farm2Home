import { useEffect, useRef, useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from '../../api/adminApi';
import { formatPrice } from '../../utils/formatPrice';
import ProductImage from '../../components/ProductImage';
import { uploadProductImage, validateProductImage } from '../../utils/uploadProductImage';

const EMPTY_FORM = {
  name: '',
  category: 'fruits',
  emoji: '🌾',
  price: '',
  unit: 'per kg',
  featured: false,
  stock: '10',
  imageUrl: '',
};

function stockLabel(stock) {
  if (stock <= 0) return 'Out of stock';
  return `${stock} left`;
}

export default function AdminProducts() {
  const { getToken } = useAdminAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStep, setSaveStep] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [removeImage, setRemoveImage] = useState(false);
  const previewUrlRef = useRef('');

  const clearImageState = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = '';
    }
    setImageFile(null);
    setImagePreview('');
    setRemoveImage(false);
  };

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

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    clearImageState();
    setShowForm(true);
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    clearImageState();
    setForm({
      name: product.name,
      category: product.category,
      emoji: product.emoji,
      price: String(product.price),
      unit: product.unit,
      featured: Boolean(product.featured),
      stock: String(product.stock ?? 0),
      imageUrl: product.imageUrl || '',
    });
    setImagePreview(product.imageUrl || '');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    clearImageState();
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const validationError = validateProductImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setImageFile(file);
    setImagePreview(objectUrl);
    setRemoveImage(false);
    setError('');
  };

  const handleRemoveImage = () => {
    clearImageState();
    setRemoveImage(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveStep('Saving product…');
    setError('');
    try {
      const token = await getToken();
      const pastedUrl = form.imageUrl?.trim();
      const payload = {
        name: form.name,
        category: form.category,
        emoji: form.emoji,
        unit: form.unit,
        featured: form.featured,
        price: Number(form.price),
        stock: Number(form.stock),
      };

      if (removeImage) {
        payload.imageUrl = null;
      } else if (pastedUrl && !imageFile) {
        payload.imageUrl = pastedUrl;
      }

      let productId = editingId;

      if (editingId) {
        await updateAdminProduct(token, editingId, payload);
      } else {
        const saved = await createAdminProduct(token, payload);
        productId = saved.id;
      }

      if (imageFile && productId) {
        setSaveStep('Uploading photo…');
        const imageUrl = await uploadProductImage(productId, imageFile);
        await updateAdminProduct(token, productId, { imageUrl });
      }

      closeForm();
      await loadProducts();
    } catch (err) {
      setError(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
      setSaveStep('');
    }
  };

  const handleToggleStock = async (product) => {
    try {
      const token = await getToken();
      const stock = (product.stock ?? 0) > 0 ? 0 : 10;
      await updateAdminProduct(token, product.id, { stock });
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
              <div className="form-group admin-form-group--full">
                <label htmlFor="product-photo">Product photo</label>
                <div className="admin-image-upload">
                  <div className={`admin-image-upload__preview${imagePreview ? ' admin-image-upload__preview--has-image' : ''}`}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Product preview" />
                    ) : (
                      <ProductImage product={{ name: form.name || 'Product', emoji: form.emoji }} variant="admin" />
                    )}
                  </div>
                  <div className="admin-image-upload__actions">
                    <label className="admin-btn admin-btn--outline admin-btn--sm">
                      {imagePreview ? 'Change photo' : 'Upload photo'}
                      <input
                        id="product-photo"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="admin-image-upload__input"
                        onChange={handleImageSelect}
                      />
                    </label>
                    {imagePreview && (
                      <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={handleRemoveImage}>
                        Remove photo
                      </button>
                    )}
                  </div>
                  <p className="form-hint">JPG, PNG, or WebP · max 5 MB. Emoji shows if no photo is uploaded.</p>
                </div>
              </div>
              <div className="form-group admin-form-group--full">
                <label htmlFor="product-image-url">Or paste image URL</label>
                <input
                  id="product-image-url"
                  type="url"
                  placeholder="https://example.com/mango.jpg"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  disabled={Boolean(imageFile)}
                />
                <p className="form-hint">Optional. Use if file upload fails — paste a direct image link.</p>
              </div>
              <div className="form-group">
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Emoji fallback</label>
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
              <div className="form-group">
                <label>Stock quantity</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  required
                />
                <p className="form-hint">How many units are available to sell right now.</p>
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
              </div>
            </div>
            <div className="admin-modal__actions">
              <button type="button" className="admin-btn admin-btn--ghost" onClick={closeForm}>Cancel</button>
              <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
                {saving ? (saveStep || 'Saving…') : editingId ? 'Update' : 'Create'}
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
                  <div className="admin-product-card__thumb">
                    <ProductImage product={p} variant="admin" />
                  </div>
                  <div>
                    <strong>{p.name}</strong>
                    <span className="admin-product-card__meta">
                      <span className={`admin-tag admin-tag--${p.category}`}>{p.category}</span>
                      {formatPrice(p.price)} · {p.unit}
                      {p.featured && <span className="admin-product-card__featured">Featured</span>}
                      <span className={`admin-stock-tag${(p.stock ?? 0) > 0 ? ' admin-stock-tag--in' : ' admin-stock-tag--out'}`}>
                        {stockLabel(p.stock ?? 0)}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="admin-product-card__actions">
                  <button
                    type="button"
                    className={`admin-btn admin-btn--sm${(p.stock ?? 0) > 0 ? ' admin-btn--warn' : ' admin-btn--primary'}`}
                    onClick={() => handleToggleStock(p)}
                  >
                    {(p.stock ?? 0) > 0 ? 'Mark out of stock' : 'Restock (+10)'}
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
                      <span className="admin-table__thumb">
                        <ProductImage product={p} variant="admin" />
                      </span>
                      {p.name}
                      <small>{p.unit}</small>
                    </td>
                    <td><span className={`admin-tag admin-tag--${p.category}`}>{p.category}</span></td>
                    <td>{formatPrice(p.price)}</td>
                    <td>
                      <button
                        type="button"
                        className={`admin-stock-btn${(p.stock ?? 0) > 0 ? ' admin-stock-btn--in' : ' admin-stock-btn--out'}`}
                        onClick={() => handleToggleStock(p)}
                        title="Click to toggle out of stock / quick restock"
                      >
                        {stockLabel(p.stock ?? 0)}
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
