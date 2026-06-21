import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useState } from 'react';

export default function Header() {
  const { cartCount, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header">
      <div className="header__top">
        <div className="container header__top-inner">
          <span>Free delivery on orders above ₹500</span>
          <span className="header__top-divider">|</span>
          <span>Fresh harvest every morning</span>
        </div>
      </div>
      <div className="container header__inner">
        <Link to="/" className="logo" onClick={closeMenu}>
          <span className="logo__icon">🌾</span>
          <span className="logo__text">Farm2Home</span>
        </Link>

        <nav className={`nav ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/" className="nav__link" end onClick={closeMenu}>Home</NavLink>
          <NavLink to="/products" className="nav__link" onClick={closeMenu}>Products</NavLink>
          <NavLink to="/about" className="nav__link" onClick={closeMenu}>About</NavLink>
          <NavLink to="/contact" className="nav__link" onClick={closeMenu}>Contact</NavLink>
          <NavLink to="/track-order" className="nav__link" onClick={closeMenu}>Track Order</NavLink>
        </nav>

        <div className="header__actions">
          <button className="cart-btn" onClick={openCart} aria-label="Open cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && <span className="cart-btn__count">{cartCount}</span>}
          </button>
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
