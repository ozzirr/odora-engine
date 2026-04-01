import { useTranslations } from "next-intl";

import { Container } from "@/components/layout/Container";
import { Link } from "@/lib/navigation";

type LegalSection = {
  title: string;
  paragraphs: string[];
};

type LegalRelatedPathname = "/privacy" | "/cookie-policy" | "/terms" | "/affiliate-disclosure";

type LegalRelatedLink = {
  href: LegalRelatedPathname;
  label: string;
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  effectiveDate: string;
  sections: LegalSection[];
  relatedLinks?: LegalRelatedLink[];
};

export function LegalPage({
  eyebrow,
  title,
  intro,
  effectiveDate,
  sections,
  relatedLinks = [],
}: LegalPageProps) {
  const t = useTranslations("legal.common");

  return (
    <Container className="py-14 sm:py-18">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="rounded-3xl border border-[#ddcfbe] bg-[#fffdf9] p-6 shadow-[0_20px_46px_-34px_rgba(53,39,27,0.4)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7762]">{eyebrow}</p>
          <h1 className="mt-2 font-display text-4xl text-[#21180f]">{title}</h1>
          <p className="mt-4 text-sm leading-7 text-[#685747]">{intro}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7762]">
            {t("effectiveDate", { date: effectiveDate })}
          </p>
          {relatedLinks.length ? (
            <div className="mt-5 flex flex-wrap gap-2.5">
              {relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-[#dfcfbc] bg-[#fcfaf6] px-4 py-2.5 text-sm text-[#3f3126] transition-all hover:border-[#ceb89d] hover:bg-white hover:text-[#1f1914]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}
        </header>

        <div className="space-y-4">
          {sections.map((section) => (
            <section key={section.title} className="rounded-3xl border border-[#ddcfbe] bg-white p-6 sm:p-8">
              <h2 className="font-display text-3xl text-[#21180f]">{section.title}</h2>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[#685747]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Container>
  );
}
