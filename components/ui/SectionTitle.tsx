type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export function SectionTitle({ eyebrow, title, subtitle }: SectionTitleProps) {
  return (
    <div className="space-y-2">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-3xl text-[#1e1813] sm:text-4xl">{title}</h2>
      {subtitle ? <p className="max-w-2xl text-sm text-[#685848]">{subtitle}</p> : null}
    </div>
  );
}
