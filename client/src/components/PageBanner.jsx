export default function PageBanner({ label, title, subtitle }) {
  return (
    <div className="page-banner">
      <div className="container page-banner__inner">
        {label && <span className="page-banner__label">{label}</span>}
        <h1 className="page-banner__title">{title}</h1>
        {subtitle && <p className="page-banner__subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}
