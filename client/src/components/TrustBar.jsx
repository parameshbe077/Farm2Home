const items = [
  { icon: '🚚', title: 'Free Delivery', desc: 'On orders above ₹100' },
  { icon: '🌅', title: 'Fresh Harvest', desc: 'Every morning' },
  { icon: '✓', title: 'Farm Direct', desc: 'Quality assured' },
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
