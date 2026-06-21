import ProductCard from './ProductCard';

export default function ProductGrid({ products, emptyMessage = 'No products found.' }) {
  if (!products.length) {
    return (
      <p className="products-empty">{emptyMessage}</p>
    );
  }

  return (
    <div className="products-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
