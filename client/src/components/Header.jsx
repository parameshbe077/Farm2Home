import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useState } from 'react';

export default function Header() {
  const { cartCount, openCart } = useCart();
  const { user, logout } = useCustomerAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    closeMenu();
    await logout();
  };

  return (
    <header className="header">
      {menuOpen && (
        <button type="button" className="nav-backdrop" aria-label="Close menu" onClick={closeMenu} />
      )}

      <div className="container header__inner">
        <Link to="/" className="logo" onClick={closeMenu}>
          <span className="logo__icon">🌾</span>
          <span className="logo__text">Farm2Home</span>
        </Link>

        <nav className={`nav ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
          <NavLink to="/" className="nav__link" end onClick={closeMenu}>Home</NavLink>
          <NavLink to="/products" className="nav__link" onClick={closeMenu}>Products</NavLink>
          <NavLink to="/about" className="nav__link" onClick={closeMenu}>About</NavLink>
          <NavLink to="/contact" className="nav__link" onClick={closeMenu}>Contact</NavLink>
          <NavLink to="/track-order" className="nav__link" onClick={closeMenu}>Track Order</NavLink>
          {user ? (
            <>
              <NavLink to="/my-orders" className="nav__link" onClick={closeMenu}>My Orders</NavLink>
              <button type="button" className="nav__link nav__link--button nav__link--mobile-only" onClick={handleLogout}>
                Sign out
              </button>
            </>
          ) : (
            <NavLink to="/login" className="nav__link nav__link--mobile-only" onClick={closeMenu}>Sign in</NavLink>
          )}
        </nav>

        <div className="header__actions">
          {user ? (
            <button type="button" className="header__account-btn" onClick={handleLogout}>
              Sign out
            </button>
          ) : (
            <Link to="/login" className="header__account-btn header__account-btn--link" onClick={closeMenu}>
              Sign in
            </Link>
          )}
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
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
