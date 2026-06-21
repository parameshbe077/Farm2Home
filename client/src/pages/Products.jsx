import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts } from '../api/api';
import { CATEGORY_LABELS, FILTERS } from '../constants/categories';
import ProductGrid from '../components/ProductGrid';
import PageBanner from '../components/PageBanner';

const PRODUCE_CATEGORIES = ['fruits', 'rice', 'vegetables'];
const ALL_SECTIONS = [...PRODUCE_CATEGORIES, 'flowers'];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || 'all';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = category !== 'all' ? { category } : {};
    fetchProducts(params)
      .then(setProducts)
      .catch((err) => {
        setError(err.message);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [category]);

  const setFilter = (filter) => {
    if (filter === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: filter });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const count = products.length;

  const groupedProducts = useMemo(() => {
    if (category !== 'all') return null;
    return ALL_SECTIONS.map((id) => ({
      id,
      label: CATEGORY_LABELS[id],
      items: products.filter((p) => p.category === id),
    })).filter((section) => section.items.length > 0);
  }, [category, products]);

  return (
    <div className="page">
      <PageBanner
        label="Shop"
        title="Our Products"
        subtitle="Fresh from the farm, delivered to you"
      />
      <div className="container">
        <div className="products-toolbar">
          <div className="filters">
            {FILTERS.map(({ id, label }) => (
              <button
                key={id}
                className={`filter-btn ${category === id ? 'active' : ''}`}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {!loading && !error && (
            <span className="products-count">{count} product{count !== 1 ? 's' : ''}</span>
          )}
        </div>
        {loading && <p className="products-empty">Loading products…</p>}
        {error && <p className="products-empty products-empty--error">{error}</p>}
        {!loading && !error && category === 'all' && groupedProducts && (
          <div className="products-sections">
            {groupedProducts.map((section) => (
              <section key={section.id} className="products-section">
                <h2 className="products-section__title">{section.label}</h2>
                <ProductGrid products={section.items} />
              </section>
            ))}
            {groupedProducts.length === 0 && (
              <p className="products-empty">No products found.</p>
            )}
          </div>
        )}
        {!loading && !error && category !== 'all' && <ProductGrid products={products} />}
      </div>
    </div>
  );
}
