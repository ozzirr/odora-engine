type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  as?: "h1" | "h2" | "h3";
};

export function SectionTitle({ eyebrow, title, subtitle, as = "h2" }: SectionTitleProps) {
  const HeadingTag = as;

  return (
    <div className="space-y-2">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
          {eyebrow}
        </p>
      ) : null}
      <HeadingTag className="font-display text-3xl text-[#1e1813] sm:text-4xl">{title}</HeadingTag>
      {subtitle ? <p className="max-w-2xl text-sm text-[#685848]">{subtitle}</p> : null}
    </div>
  );
}
