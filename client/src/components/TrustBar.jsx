const items = [
  { icon: '🚚', title: 'Free Delivery', desc: 'On local orders' },
  { icon: '🌿', title: '100% Organic', desc: 'No pesticides' },
  { icon: '⏱️', title: 'Same-day Harvest', desc: 'Peak freshness' },
  { icon: '✓', title: 'Quality Assured', desc: 'Farm-direct' },
];

export default function TrustBar() {
  return (
    <div className="trust-bar">
      <div className="container trust-bar__inner">
        {items.map((item) => (
          <div className="trust-bar__item" key={item.title}>
            <span className="trust-bar__icon">{item.icon}</span>
            <div>
              <strong>{item.title}</strong>
              <span>{item.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
