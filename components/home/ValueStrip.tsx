import { useTranslations } from "next-intl";

import { Container } from "@/components/layout/Container";

const STRIP_ITEMS = ["curated", "stores", "guides", "compare"] as const;

export function ValueStrip() {
  const t = useTranslations("home.valueStrip");

  return (
    <Container>
      <div className="mt-4 py-1">
        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
          {STRIP_ITEMS.map((key) => (
            <li key={key}>
              <span className="text-[12px] font-medium tracking-[0.04em] text-[#7a6a58]">
                {t(key)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
