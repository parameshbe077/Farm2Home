import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchProducts, fetchMyProfile, placeOrder } from '../api/api';
import { formatPrice } from '../utils/formatPrice';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useToast } from '../context/ToastContext';

import DeliveryAddressPicker from './maps/DeliveryAddressPicker';
import ProductImage from './ProductImage';

const CUSTOMER_KEY = 'farm2home_customer_guest';
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

export default function CartDrawer() {
  const {
    cart,
    isOpen,
    closeCart,
    updateQty,
    removeFromCart,
    clearCart,
  } = useCart();
  const { showToast } = useToast();
  const { user, loading: authLoading, getToken } = useCustomerAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [customer, setCustomer] = useState(loadSavedCustomer);

  useEffect(() => {
    if (!isOpen || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const profile = await fetchMyProfile(token);
        if (cancelled) return;
        setCustomer((c) => ({
          ...c,
          name: profile.name || c.name,
          phone: profile.phone || c.phone,
          address: profile.address || c.address,
          area: profile.area || c.area,
          pincode: profile.pincode || c.pincode,
          lat: profile.lat ?? c.lat,
          lng: profile.lng ?? c.lng,
        }));
      } catch { /* use saved/local fields */ }
    })();
    return () => { cancelled = true; };
  }, [isOpen, user, getToken]);

  useEffect(() => {
    if (isOpen && cart.length > 0) {
      fetchProducts().then(setProducts).catch(() => setProducts([]));
    }
  }, [isOpen, cart.length]);

  const cartLines = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((p) => p.id === item.id);
        if (!product) return null;
        return { ...item, product, lineTotal: product.price * item.qty };
      })
      .filter(Boolean);
  }, [cart, products]);

  const total = cartLines.reduce((sum, line) => sum + line.lineTotal, 0);

  const updateField = (field, value) => {
    setCustomer((c) => ({ ...c, [field]: value }));
  };

  const handleCheckout = async () => {
    if (!cart.length) {
      showToast('Your cart is empty');
      return;
    }

    if (!user) {
      showToast('Please sign in to place your order');
      closeCart();
      navigate('/login', { state: { from: '/products' } });
      return;
    }

    const name = customer.name.trim();
    const phone = customer.phone.trim();
    const address = customer.address.trim();
    const area = customer.area.trim();
    const pincode = customer.pincode.trim().replace(/\D/g, '');
    const phoneDigits = phone.replace(/\D/g, '');

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

    const payload = {
      name,
      phone,
      address,
      area,
      pincode,
    };
    if (customer.lat != null && customer.lng != null) {
      payload.lat = customer.lat;
      payload.lng = customer.lng;
    }

    setCheckingOut(true);
    try {
      const token = await getToken();
      const order = await placeOrder(cart, payload, token);
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ ...customer, ...payload }));
      const orderNumber = order.orderNumber || order.id.slice(-6).toUpperCase();
      showToast(`Order placed! Your order #${orderNumber}`);
      clearCart();
      closeCart();
      navigate('/my-orders');
    } catch (err) {
      showToast(err.message || 'Failed to place order');
    } finally {
      setCheckingOut(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={closeCart} />
      <aside className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-drawer__header">
          <h2>Your Cart</h2>
          <button className="cart-drawer__close" onClick={closeCart} aria-label="Close cart">✕</button>
        </div>

        <div className="cart-drawer__body">
          {!cart.length ? (
            <div className="cart-empty">
              <span className="cart-empty__icon" aria-hidden>🛒</span>
              <p className="cart-empty__title">Your cart is empty</p>
              <p className="cart-empty__text">Add fresh produce from our shop to get started.</p>
            </div>
          ) : (
            <>
              <div className="cart-drawer__items">
                {cartLines.map(({ id, qty, product, lineTotal }) => {
                  const stock = typeof product.stock === 'number' ? product.stock : 0;
                  const remaining = Math.max(0, stock - qty);
                  const atMax = remaining <= 0;
                  return (
                    <article className="cart-item" key={id}>
                      <div className="cart-item__thumb">
                        <ProductImage product={product} variant="thumb" />
                      </div>
                      <div className="cart-item__content">
                        <div className="cart-item__top">
                          <h3 className="cart-item__name">{product.name}</h3>
                          <button type="button" className="cart-item__remove" onClick={() => removeFromCart(id)}>
                            Remove
                          </button>
                        </div>
                        <p className="cart-item__price">
                          {formatPrice(product.price)} × {qty}
                          <span className="cart-item__line-total">{formatPrice(lineTotal)}</span>
                        </p>
                        {stock > 0 && (
                          <span className={`cart-item__stock${atMax ? ' cart-item__stock--max' : ''}`}>
                            {atMax ? 'Max in cart' : `${remaining} left`}
                          </span>
                        )}
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
                    </article>
                  );
                })}
              </div>

              {!authLoading && !user && (
                <div className="cart-drawer__auth-banner">
                  <span className="cart-drawer__auth-icon" aria-hidden>🔐</span>
                  <div>
                    <p className="cart-drawer__auth-title">Sign in to checkout</p>
                    <p className="cart-drawer__auth-text">Save your order history and place delivery orders.</p>
                  </div>
                  <Link to="/login" className="cart-drawer__auth-btn" onClick={closeCart}>
                    Sign in
                  </Link>
                </div>
              )}

              {user && (
                <div className="cart-drawer__checkout cart-drawer__checkout--inline">
                  <p className="cart-drawer__checkout-title">Delivery details</p>
                  <p className="cart-drawer__checkout-hint">
                    Delivery available for pincodes {ALLOWED_PINCODES.join(', ')}.
                  </p>
                  <div className="form-group">
                    <label htmlFor="checkout-name">Your name</label>
                    <input
                      id="checkout-name"
                      type="text"
                      placeholder="Full name"
                      value={customer.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      autoComplete="name"
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
                    />
                  </div>
                  <DeliveryAddressPicker
                    value={customer}
                    onChange={(patch) => setCustomer((c) => ({ ...c, ...patch }))}
                    disabled={checkingOut}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-drawer__footer">
            <div className="cart-drawer__summary">
              <div className="cart-drawer__payment">
                <span className="cart-drawer__payment-label">Payment</span>
                <strong>Cash on Delivery</strong>
                <p className="cart-drawer__payment-hint">Pay when your order arrives.</p>
              </div>
              <div className="cart-drawer__total">
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>
            </div>
            <button
              className="btn btn--primary btn--full cart-drawer__submit"
              onClick={handleCheckout}
              disabled={checkingOut || !user || authLoading}
            >
              {!user ? 'Sign in to order' : checkingOut ? 'Placing order…' : 'Place order'}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
