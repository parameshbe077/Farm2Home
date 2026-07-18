import { CATEGORY_LABELS } from '../constants/categories';
import { formatPrice } from '../utils/formatPrice';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ProductImage from './ProductImage';

export default function ProductCard({ product }) {
  const { addToCart, updateQty, cart } = useCart();
  const { showToast } = useToast();
  const stock = typeof product.stock === 'number' ? product.stock : 0;
  const inStock = product.inStock !== false && stock > 0;
  const inCart = cart.find((item) => item.id === product.id)?.qty || 0;
  const remaining = Math.max(0, stock - inCart);
  const canAddMore = inStock && remaining > 0;
  const atMax = inStock && inCart > 0 && remaining === 0;

  const handleAdd = () => {
    if (!inStock) {
      showToast(`${product.name} is out of stock`);
      return;
    }
    if (!canAddMore) {
      showToast(`Only ${stock} available for ${product.name}`);
      return;
    }
    addToCart(product.id, stock);
    showToast(`${product.name} added to cart`);
  };

  const handleIncrease = () => {
    if (!canAddMore) {
      showToast(`Only ${stock} available for ${product.name}`);
      return;
    }
    updateQty(product.id, 1, stock);
  };

  const handleDecrease = () => {
    updateQty(product.id, -1);
  };

  return (
    <article className={`product-card product-card--${product.category}${!inStock ? ' product-card--out-of-stock' : ''}`}>
      <div className={`product-card__image${product.imageUrl ? ' product-card__image--has-photo' : ''}`}>
        <ProductImage product={product} variant="card" />
        {!inStock ? (
          <span className="product-card__badge product-card__badge--stock">Out of stock</span>
        ) : product.featured ? (
          <span className="product-card__badge">Popular</span>
        ) : null}
      </div>
      <div className="product-card__body">
        <span className="product-card__category">{CATEGORY_LABELS[product.category]}</span>
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__unit">
          {product.unit}
          {inStock && remaining > 0 && remaining < 10 && (
            <span className={`product-card__stock${remaining <= 5 ? ' product-card__stock--low' : ''}`}>
              {remaining} left
            </span>
          )}
        </p>
        <div className="product-card__footer">
          <div className="product-card__price">{formatPrice(product.price)}</div>
          {!inStock ? (
            <button type="button" className="add-btn" disabled>
              Unavailable
            </button>
          ) : inCart > 0 ? (
            <div className="product-card__qty" aria-label={`${product.name} quantity in cart`}>
              <button
                type="button"
                className="qty-btn"
                onClick={handleDecrease}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="product-card__qty-value">{inCart}</span>
              <button
                type="button"
                className="qty-btn"
                onClick={handleIncrease}
                disabled={atMax}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          ) : (
            <button type="button" className="add-btn" onClick={handleAdd}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
