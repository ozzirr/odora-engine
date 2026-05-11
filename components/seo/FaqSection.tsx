import { SectionTitle } from "@/components/ui/SectionTitle";

export type FaqItem = {
  question: string;
  answer: string;
};

type FaqSectionProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  items: FaqItem[];
};

export function FaqSection({ eyebrow, title, subtitle, items }: FaqSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3 sm:space-y-4">
      <SectionTitle eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <div className="space-y-1.5 rounded-2xl border border-[#ddcfbc] bg-white p-2 shadow-[0_18px_42px_-36px_rgba(53,39,27,0.22)]">
        {items.map((item, idx) => (
          <details
            key={idx}
            className="group rounded-2xl px-3 py-2.5 transition-colors open:bg-[#f8f1e6] sm:px-4 sm:py-3"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[#1f1914] sm:text-[15px]">
              <span>{item.question}</span>
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0e8dd] text-[#907b66] transition-transform duration-200 group-open:rotate-180">
                <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16">
                  <path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                </svg>
              </span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-[#3d2e20] sm:text-[14.5px]">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
