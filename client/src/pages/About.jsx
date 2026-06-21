import PageBanner from '../components/PageBanner';

const values = [
  { icon: '🌱', title: 'Sustainable Farming', desc: 'Eco-friendly practices that protect our land for future generations.' },
  { icon: '🚜', title: 'Family-Owned', desc: 'Three generations of farming expertise, passed down with pride.' },
  { icon: '📦', title: 'Eco Packaging', desc: 'Minimal, recyclable packaging that keeps produce fresh.' },
  { icon: '🤝', title: 'Fair Pricing', desc: 'Honest prices for farmers and customers — no hidden markups.' },
];

export default function About() {
  return (
    <div className="page">
      <PageBanner
        label="Our Story"
        title="About Farm2Home"
        subtitle="From our fields to your family table"
      />
      <div className="container">
        <div className="about">
          <div className="about__content">
            <p className="about__lead">
              We are a family-run farm dedicated to growing the finest fruits, rice,
              vegetables, and flowers — and bringing them directly to your table.
            </p>
            <p>
              Founded on the belief that everyone deserves access to fresh, honest food,
              Farm2Home skips the middlemen. We plant, harvest, and deliver ourselves, so you
              know exactly where your food comes from.
            </p>
            <div className="values-grid">
              {values.map((v) => (
                <div className="value-card" key={v.title}>
                  <span className="value-card__icon">{v.icon}</span>
                  <div>
                    <strong>{v.title}</strong>
                    <p>{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="about__visual">
            <div className="about__image">
              <span>🌻</span>
              <p>Est. 2010 · Green Valley Farm</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
