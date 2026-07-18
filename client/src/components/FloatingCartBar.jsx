import { useCart } from '../context/CartContext';

export default function FloatingCartBar() {
  const { cartCount, isOpen, openCart } = useCart();

  if (cartCount <= 0 || isOpen) return null;

  const itemLabel = cartCount === 1 ? '1 item' : `${cartCount} items`;

  return (
    <div className="floating-cart" role="region" aria-label="Cart shortcut">
      <button
        type="button"
        className="floating-cart__btn"
        onClick={openCart}
        aria-label={`View cart, ${itemLabel}`}
      >
        <span className="floating-cart__icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </span>
        <span className="floating-cart__label">View cart</span>
        <span className="floating-cart__count">{itemLabel}</span>
      </button>
    </div>
  );
}
