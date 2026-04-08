import { useTranslations } from "next-intl";

import { Container } from "@/components/layout/Container";

const STRIP_ITEMS = ["curated", "stores", "guides", "compare"] as const;

export function ValueStrip() {
  const t = useTranslations("home.valueStrip");

  return (
    <Container>
      <div className="mt-5 py-2">
        <ul className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5">
          {STRIP_ITEMS.map((key, i) => (
            <li key={key} className="flex items-center gap-2">
              {i > 0 && (
                <span className="h-[3px] w-[3px] rounded-full bg-[#c8bba8]" aria-hidden="true" />
              )}
              <span className="text-[11.5px] font-medium tracking-[0.06em] text-[#8a7a68]">
                {t(key)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
