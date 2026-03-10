"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type AuthMode = "login" | "signup";

type AuthModalTriggerProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  mode: AuthMode;
  onOpen?: () => void;
};

function buildBasePath(pathname: string, searchParams: URLSearchParams, hash: string) {
  const params = new URLSearchParams(searchParams);
  params.delete("auth");
  params.delete("authNext");
  params.delete("error");
  const search = params.toString();
  return `${pathname}${search ? `?${search}` : ""}${hash}`;
}

export function AuthModalTrigger({
  children,
  mode,
  onClick,
  onOpen,
  type = "button",
  ...props
}: AuthModalTriggerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <button
      {...props}
      type={type}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) {
          return;
        }

        const hash = window.location.hash;
        const currentParams = new URLSearchParams(searchParams.toString());
        const nextPath = buildBasePath(pathname, currentParams, hash);
        currentParams.delete("error");
        currentParams.set("auth", mode);
        currentParams.set("authNext", nextPath);
        router.push(`${pathname}?${currentParams.toString()}${hash}`, { scroll: false });
        onOpen?.();
      }}
    >
      {children}
    </button>
  );
}
