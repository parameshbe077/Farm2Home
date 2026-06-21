export default function SectionHeader({ label, title, subtitle, align = 'center' }) {
  return (
    <div className={`section-header section-header--${align}`}>
      {label && <span className="section-header__label">{label}</span>}
      <h2 className="section-header__title">{title}</h2>
      {subtitle && <p className="section-header__subtitle">{subtitle}</p>}
    </div>
  );
}
