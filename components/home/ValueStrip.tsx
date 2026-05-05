import { useTranslations } from "next-intl";

import { Container } from "@/components/layout/Container";

const STRIP_ITEMS = ["curated", "stores", "guides", "compare"] as const;

export function ValueStrip() {
  const t = useTranslations("home.valueStrip");

  return (
    <Container>
      <div className="mt-5 rounded-[1.4rem] border border-[#eadfce] bg-white/72 px-4 py-3 shadow-[0_12px_30px_-26px_rgba(50,35,20,0.2)] sm:px-6">
        <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          {STRIP_ITEMS.map((key, i) => (
            <li key={key} className="flex items-center gap-2">
              {i > 0 && (
                <span className="h-[4px] w-[4px] rounded-full bg-[#cfbda5]" aria-hidden="true" />
              )}
              <span className="text-[11.5px] font-medium tracking-[0.08em] text-[#7e6b58]">
                {t(key)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
