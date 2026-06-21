import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../api/api';
import ProductGrid from '../components/ProductGrid';

const heroCards = [
  { className: 'hero__card--1', emoji: '🍎', label: 'Fruits', tint: 'fruits' },
  { className: 'hero__card--2', emoji: '🌾', label: 'Rice', tint: 'rice' },
  { className: 'hero__card--3', emoji: '🥬', label: 'Vegetables', tint: 'veg' },
  { className: 'hero__card--4', emoji: '🌸', label: 'Flowers', tint: 'flowers' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts({ featured: true })
      .then(setFeatured)
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <section className="hero">
        <div className="hero__bg" aria-hidden="true">
          <div className="hero__orb hero__orb--1" />
          <div className="hero__orb hero__orb--2" />
          <div className="hero__orb hero__orb--3" />
        </div>

        <div className="container hero__inner">
          <div className="hero__content">
            <p className="hero__badge">
              <span className="hero__badge-dot" />
              Direct from our farm
            </p>
            <h1 className="hero__title">
              Fresh produce,
              <br />
              <span className="hero__title-accent">straight to your home</span>
            </h1>
            <p className="hero__desc">
              We grow premium fruits, rice, vegetables, and flowers with care — and deliver them fresh
              so your family eats the best nature has to offer.
            </p>
            <div className="hero__actions">
              <Link to="/products" className="btn btn--primary btn--hero">
                Shop Now
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link to="/about" className="btn btn--outline btn--hero">Our Story</Link>
            </div>
            <div className="hero__stats">
              <div className="stat">
                <span className="stat__icon">🌿</span>
                <div>
                  <strong>100%</strong>
                  <span>Organic</span>
                </div>
              </div>
              <div className="stat">
                <span className="stat__icon">☀️</span>
                <div>
                  <strong>Same-day</strong>
                  <span>Harvest</span>
                </div>
              </div>
              <div className="stat">
                <span className="stat__icon">🚚</span>
                <div>
                  <strong>Free</strong>
                  <span>Local delivery</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hero__visual">
            <div className="hero__grid">
              {heroCards.map((card) => (
                <div className={`hero__card ${card.className} hero__card--${card.tint}`} key={card.label}>
                  <span className="hero__card-emoji">{card.emoji}</span>
                  <span className="hero__card-label">{card.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <section className="categories">
          <h2 className="section-title">What We Grow</h2>
          <p className="section-subtitle">Farm-fresh fruits, rice, vegetables, and flowers</p>
          <div className="categories__grid">
            <article className="category-card category-card--fruits">
              <div className="category-card__icon">🍇</div>
              <h3>Fruits</h3>
              <p>Seasonal fruits picked at peak ripeness — sweet, juicy, and full of flavor.</p>
              <Link to="/products?category=fruits" className="category-card__link">Browse fruits →</Link>
            </article>
            <article className="category-card category-card--rice">
              <div className="category-card__icon">🌾</div>
              <h3>Rice</h3>
              <p>Premium rice varieties grown in our fields — aromatic, nutritious, and pure.</p>
              <Link to="/products?category=rice" className="category-card__link">Browse rice →</Link>
            </article>
            <article className="category-card category-card--vegetables">
              <div className="category-card__icon">🥕</div>
              <h3>Vegetables</h3>
              <p>Crisp, colorful vegetables harvested daily for maximum freshness.</p>
              <Link to="/products?category=vegetables" className="category-card__link">Browse vegetables →</Link>
            </article>
            <article className="category-card category-card--flowers">
              <div className="category-card__icon">🌹</div>
              <h3>Flowers</h3>
              <p>Fresh-cut flowers and garlands for pooja, gifts, and special occasions.</p>
              <Link to="/products?category=flowers" className="category-card__link">Browse flowers →</Link>
            </article>
          </div>
        </section>

        <section className="featured">
          <h2 className="section-title">Popular This Week</h2>
          {loading ? (
            <p className="products-empty">Loading products…</p>
          ) : (
            <ProductGrid products={featured} />
          )}
        </section>
      </div>
    </div>
  );
}
