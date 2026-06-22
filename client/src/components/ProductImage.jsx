import { useState } from 'react';

export default function ProductImage({ product, variant = 'card', className = '' }) {
  const [failed, setFailed] = useState(false);
  const url = product?.imageUrl;
  const showPhoto = Boolean(url) && !failed;
  const classes = `product-image product-image--${variant}${className ? ` ${className}` : ''}`;

  if (showPhoto) {
    return (
      <img
        src={url}
        alt={product.name}
        className={classes}
        onError={() => setFailed(true)}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <span className={`${classes} product-image--emoji`} aria-hidden>
      {product?.emoji || '🌾'}
    </span>
  );
}
