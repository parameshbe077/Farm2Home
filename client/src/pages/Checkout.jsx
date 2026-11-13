import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchMyProfile, fetchProducts, placeOrder } from '../api/api';
import DeliveryAddressPicker from '../components/maps/DeliveryAddressPicker';
import PageBanner from '../components/PageBanner';
import ProductImage from '../components/ProductImage';
import ProtectedCustomerRoute from '../components/ProtectedCustomerRoute';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/formatPrice';

const CUSTOMER_KEY = 'farm2home_customer_guest';
const NOTE_LIMIT = 200;
const ALLOWED_PINCODES = (import.meta.env.VITE_DELIVERY_PINCODES || '509208')
  .split(',')
  .map((code) => code.trim())
  .filter(Boolean);

const EMPTY_CUSTOMER = {
  name: '',
  phone: '',
  address: '',
  area: '',
  pincode: '',
  lat: null,
  lng: null,
};

function loadSavedCustomer() {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY));
    if (saved) return { ...EMPTY_CUSTOMER, ...saved };
  } catch { /* ignore */ }
  return { ...EMPTY_CUSTOMER };
}

function createClientOrderId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `order-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function CheckoutContent() {
  const { cart, updateQty, removeFromCart, clearCart } = useCart();
  const { user, getToken } = useCustomerAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [customer, setCustomer] = useState(loadSavedCustomer);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const profile = await fetchMyProfile(token);
        if (cancelled) return;
        setCustomer((current) => ({
          ...current,
          name: profile.name || current.name,
          phone: profile.phone || current.phone,
          address: profile.address || current.address,
          area: profile.area || current.area,
          pincode: profile.pincode || current.pincode,
          lat: profile.lat ?? current.lat,
          lng: profile.lng ?? current.lng,
        }));
      } catch { /* use saved fields */ }
    })();
    return () => { cancelled = true; };
  }, [user, getToken]);

  useEffect(() => {
    if (!cart.length) {
      setProducts([]);
      setLoadingProducts(false);
      return;
    }
    let cancelled = false;
    setLoadingProducts(true);
    fetchProducts()
      .then((list) => { if (!cancelled) setProducts(list); })
      .catch(() => { if (!cancelled) setProducts([]); })
      .finally(() => { if (!cancelled) setLoadingProducts(false); });
    return () => { cancelled = true; };
  }, [cart.length]);

  const cartLines = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((entry) => entry.id === item.id);
        if (!product) return null;
        return { ...item, product, lineTotal: product.price * item.qty };
      })
      .filter(Boolean);
  }, [cart, products]);

  const total = cartLines.reduce((sum, line) => sum + line.lineTotal, 0);

  const updateField = (field, value) => {
    setCustomer((current) => ({ ...current, [field]: value }));
  };

  const handleCheckout = async (event) => {
    event.preventDefault();
    if (!cart.length) {
      showToast('Your cart is empty');
      return;
    }

    const name = customer.name.trim();
    const phone = customer.phone.trim();
    const address = customer.address.trim();
    const area = customer.area.trim();
    const pincode = customer.pincode.trim().replace(/\D/g, '');
    const phoneDigits = phone.replace(/\D/g, '');
    const deliveryNote = note.trim();

    if (!name) {
      showToast('Please enter your name');
      return;
    }
    if (phoneDigits.length < 10) {
      showToast('Please enter a valid 10-digit phone number');
      return;
    }
    if (!address) {
      showToast('Please enter your delivery address');
      return;
    }
    if (!area) {
      showToast('Please enter your area / city');
      return;
    }
    if (pincode.length !== 6) {
      showToast('Please enter a valid 6-digit pincode');
      return;
    }
    if (!ALLOWED_PINCODES.includes(pincode)) {
      showToast(`Sorry, delivery is available only for pincode ${ALLOWED_PINCODES.join(', ')}`);
      return;
    }
    if (deliveryNote.length > NOTE_LIMIT) {
      showToast(`Delivery note must be ${NOTE_LIMIT} characters or less`);
      return;
    }

    const payload = { name, phone, address, area, pincode };
    if (customer.lat != null && customer.lng != null) {
      payload.lat = customer.lat;
      payload.lng = customer.lng;
    }

    setCheckingOut(true);
    const requestOrderId = pendingOrderId || createClientOrderId();
    setPendingOrderId(requestOrderId);

    try {
      let order;
      let lastError;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const token = await getToken(attempt > 0);
          if (!token) throw new Error('Please sign in to continue');
          order = await placeOrder(cart, payload, token, requestOrderId, deliveryNote);
          lastError = null;
          break;
        } catch (err) {
          lastError = err;
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      }

      if (!order) throw lastError || new Error('Failed to place order');

      localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ ...customer, ...payload }));
      const orderNumber = order.orderNumber || order.id.slice(-6).toUpperCase();
      showToast(`Order placed! Your order #${orderNumber}`);
      setPendingOrderId(null);
      clearCart();
      navigate('/my-orders');
    } catch (err) {
      showToast(err.message || 'Failed to place order');
    } finally {
      setCheckingOut(false);
    }
  };

  if (!cart.length) {
    return (
      <div className="page">
        <PageBanner label="Checkout" title="Your cart is empty" subtitle="Add produce before checkout" />
        <div className="container checkout-empty">
          <Link to="/products" className="btn btn--primary">Browse products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <PageBanner
        label="Checkout"
        title="Delivery details"
        subtitle={`Cash on delivery for pincodes ${ALLOWED_PINCODES.join(', ')}`}
      />
      <div className="container">
        <form className="checkout" onSubmit={handleCheckout}>
          <div className="checkout__panel">
            <h2 className="checkout__title">Where should we deliver?</h2>
            <div className="form-group">
              <label htmlFor="checkout-name">Your name</label>
              <input
                id="checkout-name"
                type="text"
                placeholder="Full name"
                value={customer.name}
                onChange={(e) => updateField('name', e.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="checkout-phone">Phone number</label>
              <input
                id="checkout-phone"
                type="tel"
                placeholder="10-digit mobile number"
                value={customer.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                autoComplete="tel"
                required
              />
            </div>
            <DeliveryAddressPicker
              value={customer}
              onChange={(patch) => setCustomer((current) => ({ ...current, ...patch }))}
              disabled={checkingOut}
            />
            <div className="form-group">
              <label htmlFor="checkout-note">Delivery note</label>
              <textarea
                id="checkout-note"
                className="checkout__note"
                placeholder="Leave at the gate, call on arrival…"
                value={note}
                maxLength={NOTE_LIMIT}
                onChange={(e) => setNote(e.target.value)}
                disabled={checkingOut}
              />
              <p className="form-hint">{note.trim().length}/{NOTE_LIMIT} characters. Optional.</p>
            </div>
          </div>

          <aside className="checkout__panel checkout__summary">
            <h2 className="checkout__title">Your order</h2>
            {loadingProducts && <p className="products-empty">Loading your cart…</p>}
            {!loadingProducts && cartLines.length === 0 && (
              <p className="products-empty products-empty--error">
                These items are no longer available. Go back to the shop and add them again.
              </p>
            )}
            <ul className="checkout__items">
              {cartLines.map(({ id, qty, product, lineTotal }) => {
                const stock = typeof product.stock === 'number' ? product.stock : 0;
                const atMax = qty >= stock;
                return (
                  <li key={id} className="checkout__item">
                    <div className="checkout__thumb">
                      <ProductImage product={product} variant="thumb" />
                    </div>
                    <div className="checkout__item-body">
                      <div className="checkout__item-top">
                        <strong>{product.name}</strong>
                        <button type="button" className="cart-item__remove" onClick={() => removeFromCart(id)}>
                          Remove
                        </button>
                      </div>
                      <span>{formatPrice(product.price)} each</span>
                      <div className="cart-item__qty">
                        <button type="button" className="qty-btn" onClick={() => updateQty(id, -1)} aria-label="Decrease quantity">−</button>
                        <span className="cart-item__qty-value">{qty}</span>
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => updateQty(id, 1, stock)}
                          disabled={atMax}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <strong className="checkout__line-total">{formatPrice(lineTotal)}</strong>
                  </li>
                );
              })}
            </ul>
            <div className="checkout__total">
              <div>
                <span>Payment</span>
                <strong>Cash on Delivery</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>
            </div>
            <button
              type="submit"
              className="btn btn--primary btn--full"
              disabled={checkingOut || loadingProducts || cartLines.length === 0}
            >
              {checkingOut ? 'Placing order…' : 'Place order'}
            </button>
            <p className="checkout__legal">
              By placing this order you agree to our <Link to="/privacy">privacy and cancellation policy</Link>.
              You can cancel from My Orders while the order is still pending.
            </p>
          </aside>
        </form>
      </div>
    </div>
  );
}

export default function Checkout() {
  return (
    <ProtectedCustomerRoute>
      <CheckoutContent />
    </ProtectedCustomerRoute>
  );
}
