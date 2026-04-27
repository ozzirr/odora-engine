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
    <section className="space-y-4">
      <SectionTitle eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <div className="space-y-2 rounded-2xl border border-[#ddcfbc] bg-white p-2">
        {items.map((item, idx) => (
          <details
            key={idx}
            className="group rounded-xl px-4 py-3 open:bg-[#f8f1e6] transition-colors"
          >
            <summary className="cursor-pointer list-none text-[15px] font-semibold text-[#1f1914] flex items-center justify-between gap-4">
              <span>{item.question}</span>
              <span className="text-[#907b66] transition-transform group-open:rotate-45 text-xl leading-none">
                +
              </span>
            </summary>
            <p className="mt-3 text-[14.5px] leading-[1.7] text-[#3d2e20]">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
