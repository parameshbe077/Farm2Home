import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProducts } from '../api/api';
import { formatPrice } from '../utils/formatPrice';
import { useCart } from '../context/CartContext';
import ProductImage from './ProductImage';

export default function CartDrawer() {
  const {
    cart,
    isOpen,
    closeCart,
    updateQty,
    removeFromCart,
  } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

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

  const goToCheckout = () => {
    closeCart();
    navigate('/checkout');
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
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-drawer__footer">
            <div className="cart-drawer__summary">
              <div className="cart-drawer__total">
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>
            </div>
            <button
              type="button"
              className="btn btn--primary btn--full cart-drawer__submit"
              onClick={goToCheckout}
              disabled={cartLines.length === 0}
            >
              Checkout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
