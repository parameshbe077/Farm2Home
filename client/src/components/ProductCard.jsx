import { CATEGORY_LABELS } from '../constants/categories';
import { formatPrice } from '../utils/formatPrice';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const inStock = product.inStock !== false;

  const handleAdd = () => {
    if (!inStock) {
      showToast(`${product.name} is out of stock`);
      return;
    }
    addToCart(product.id);
    showToast(`${product.name} added to cart`);
  };

  return (
    <article className={`product-card product-card--${product.category}${!inStock ? ' product-card--out-of-stock' : ''}`}>
      <div className="product-card__image">
        <span className="product-card__emoji">{product.emoji}</span>
        {!inStock ? (
          <span className="product-card__badge product-card__badge--stock">Out of stock</span>
        ) : product.featured ? (
          <span className="product-card__badge">Popular</span>
        ) : null}
      </div>
      <div className="product-card__body">
        <span className="product-card__category">{CATEGORY_LABELS[product.category]}</span>
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__unit">{product.unit}</p>
        <div className="product-card__footer">
          <div className="product-card__price">{formatPrice(product.price)}</div>
          <button className="add-btn" onClick={handleAdd} disabled={!inStock}>
            {inStock ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add
              </>
            ) : (
              'Unavailable'
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
