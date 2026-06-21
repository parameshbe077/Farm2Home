import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProducts } from '../api/api';
import { placeOrder } from '../api/api';
import { formatPrice } from '../utils/formatPrice';
import { addTrackHistory } from '../utils/trackOrderStorage';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const CUSTOMER_KEY = 'farm2home_customer';

const EMPTY_CUSTOMER = {
  name: '',
  phone: '',
  address: '',
  area: '',
  pincode: '',
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
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [customer, setCustomer] = useState(loadSavedCustomer);

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

    const payload = { name, phone, address, area, pincode };

    setCheckingOut(true);
    try {
      const order = await placeOrder(cart, payload);
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(payload));
      const orderNumber = order.orderNumber || order.id.slice(-6).toUpperCase();
      addTrackHistory(orderNumber, phone);
      showToast(`Order placed! Your order #${orderNumber}`);
      clearCart();
      closeCart();
      navigate(`/track-order?order=${orderNumber}&phone=${encodeURIComponent(phone)}`);
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
              <span>🛒</span>
              <p>Your cart is empty</p>
            </div>
          ) : (
            cartLines.map(({ id, qty, product, lineTotal }) => (
              <div className="cart-item" key={id}>
                <div className="cart-item__emoji">{product.emoji}</div>
                <div className="cart-item__info">
                  <div className="cart-item__name">{product.name}</div>
                  <div className="cart-item__price">
                    {formatPrice(product.price)} × {qty} = {formatPrice(lineTotal)}
                  </div>
                  <div className="cart-item__controls">
                    <button className="qty-btn" onClick={() => updateQty(id, -1)}>−</button>
                    <span>{qty}</span>
                    <button className="qty-btn" onClick={() => updateQty(id, 1)}>+</button>
                    <button className="cart-item__remove" onClick={() => removeFromCart(id)}>Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}

          {cart.length > 0 && (
            <div className="cart-drawer__checkout cart-drawer__checkout--inline">
              <p className="cart-drawer__checkout-title">Delivery details</p>
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
              <div className="form-group">
                <label htmlFor="checkout-address">Delivery address</label>
                <textarea
                  id="checkout-address"
                  rows={2}
                  placeholder="House no., street, landmark"
                  value={customer.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  autoComplete="street-address"
                />
              </div>
              <div className="form-group">
                <label htmlFor="checkout-area">Area / city</label>
                <input
                  id="checkout-area"
                  type="text"
                  placeholder="e.g. Madurai"
                  value={customer.area}
                  onChange={(e) => updateField('area', e.target.value)}
                  autoComplete="address-level2"
                />
              </div>
              <div className="form-group">
                <label htmlFor="checkout-pincode">Pincode</label>
                <input
                  id="checkout-pincode"
                  type="text"
                  inputMode="numeric"
                  placeholder="6-digit pincode"
                  maxLength={6}
                  value={customer.pincode}
                  onChange={(e) => updateField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoComplete="postal-code"
                />
              </div>
            </div>
          )}
        </div>

        <div className="cart-drawer__footer">
          <div className="cart-drawer__total">
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <button
            className="btn btn--primary btn--full"
            onClick={handleCheckout}
            disabled={checkingOut || !cart.length}
          >
            {checkingOut ? 'Placing order…' : 'Place Order'}
          </button>
        </div>
      </aside>
    </>
  );
}
