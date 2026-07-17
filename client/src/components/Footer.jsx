import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__promo">
        <div className="container footer__promo-inner">
          <span>Free delivery on orders above ₹500</span>
          <span className="footer__promo-divider">|</span>
          <span>Fresh harvest every morning</span>
        </div>
      </div>
      <div className="container footer__inner">
        <div className="footer__grid">
          <div className="footer__brand">
            <div className="footer__logo">
              <img src="/logo_f2h.png" alt="Farm2Home" className="logo__img" />
              <span>Farm2Home</span>
            </div>
            <p>Premium fruits, rice, vegetables, and flowers — grown with care and delivered fresh to your doorstep.</p>
          </div>
          <div className="footer__col">
            <h4>Shop</h4>
            <Link to="/products">All Products</Link>
            <Link to="/products?category=fruits">Fruits</Link>
            <Link to="/products?category=rice">Rice</Link>
            <Link to="/products?category=vegetables">Vegetables</Link>
            <Link to="/products?category=flowers">Flowers</Link>
          </div>
          <div className="footer__col">
            <h4>Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/track-order">Track Order</Link>
          </div>
          <div className="footer__col">
            <h4>Contact</h4>
            <span>Green Valley Farm</span>
            <a href="tel:+919963785421">+91 9963785421</a>
            <a href="mailto:farm2homesouth@gmail.com">farm2homesouth@gmail.com</a>
          </div>
        </div>
        <div className="footer__bottom">
          <p>&copy; 2026 Farm2Home. All rights reserved.</p>
          <p>Farm-fresh · Organic · Delivered daily</p>
        </div>
      </div>
    </footer>
  );
}
