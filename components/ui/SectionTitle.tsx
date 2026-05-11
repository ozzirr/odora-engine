type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  as?: "h1" | "h2" | "h3";
};

export function SectionTitle({ eyebrow, title, subtitle, as = "h2" }: SectionTitleProps) {
  const HeadingTag = as;

  return (
    <div className="space-y-3">
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#907b66]">
          {eyebrow}
        </p>
      ) : null}
      <HeadingTag className="font-display text-xl leading-[1.12] text-[#1e1813] sm:text-[2.2rem] lg:text-[2.5rem]">{title}</HeadingTag>
      {subtitle ? <p className="max-w-xl text-sm leading-relaxed text-[#6b5a49] sm:text-[14.5px]">{subtitle}</p> : null}
    </div>
  );
}
