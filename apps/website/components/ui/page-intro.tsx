export function PageIntro({
  label,
  title,
  accent,
  description,
}: {
  label: string;
  title: string;
  accent?: string;
  description: string;
}) {
  return (
    <section className="page-intro container">
      <p className="eyebrow">
        <span className="tiny-star">✳︎</span>
        {label}
      </p>
      <h1>
        {title}
        {accent && (
          <>
            <br />
            <span className="blue-text">{accent}</span>
          </>
        )}
      </h1>
      <p>{description}</p>
    </section>
  );
}
