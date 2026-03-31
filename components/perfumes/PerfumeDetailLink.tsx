"use client";

import type { ComponentProps, MouseEvent } from "react";

import { usePerfumeDetailNavigation } from "@/components/perfumes/PerfumeDetailNavigation";
import { Link } from "@/lib/navigation";

type PerfumeDetailLinkProps = ComponentProps<typeof Link> & {
  perfumeName?: string | null;
};

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey || event.button !== 0;
}

export function PerfumeDetailLink({
  onClick,
  perfumeName,
  scroll,
  target,
  ...props
}: PerfumeDetailLinkProps) {
  const { startNavigation } = usePerfumeDetailNavigation();

  return (
    <Link
      {...props}
      scroll={scroll ?? true}
      target={target}
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented || isModifiedClick(event) || target === "_blank") {
          return;
        }

        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        startNavigation(perfumeName);
      }}
    />
  );
}
