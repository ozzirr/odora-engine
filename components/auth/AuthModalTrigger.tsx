"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { buildAuthModalUrl, type AuthMode } from "@/lib/auth-modal";

type AuthModalTriggerProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  mode: AuthMode;
  onOpen?: () => void;
  resolveNextPath?: (pathname: string, searchParams: URLSearchParams, hash: string) => string;
};

export function AuthModalTrigger({
  children,
  mode,
  onClick,
  onOpen,
  resolveNextPath,
  type = "button",
  ...props
}: AuthModalTriggerProps) {
  return (
    <button
      {...props}
      type={type}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) {
          return;
        }

        const { pathname, search, hash } = window.location;
        const mutableSearchParams = new URLSearchParams(search);
        window.history.pushState(
          null,
          "",
          buildAuthModalUrl(
            pathname,
            mutableSearchParams,
            mode,
            hash,
            resolveNextPath?.(pathname, mutableSearchParams, hash),
          ),
        );
        onOpen?.();
      }}
    >
      {children}
    </button>
  );
}
