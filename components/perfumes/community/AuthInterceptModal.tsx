"use client";

import { AuthModalTrigger } from "@/components/auth/AuthModalTrigger";
import { buttonStyles } from "@/components/ui/Button";

type AuthInterceptModalProps = {
  open: boolean;
  onClose: () => void;
  loginNextPath: string;
};

export function AuthInterceptModal({ open, onClose, loginNextPath }: AuthInterceptModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center bg-[rgba(26,20,15,0.38)] px-0 backdrop-blur-sm sm:items-center sm:px-4 sm:py-8">
      <div className="w-full max-w-md rounded-t-3xl border border-[#ddcfbe] bg-[#fffdf9]/98 p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-[0_34px_90px_-42px_rgba(36,25,16,0.65)] transition-all duration-200 sm:rounded-2xl sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7762]">Odora</p>
        <h3 className="mt-2 font-display text-3xl text-[#21180f]">Join Odora</h3>
        <p className="mt-3 text-sm leading-6 text-[#685747]">
          Save perfumes, build your collection and share your experience with the community.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <AuthModalTrigger
            mode="login"
            resolveNextPath={() => loginNextPath}
            onOpen={onClose}
            className={buttonStyles({ className: "w-full rounded-2xl sm:w-auto" })}
          >
            Log in
          </AuthModalTrigger>
          <button
            type="button"
            className={buttonStyles({ variant: "secondary", className: "w-full rounded-2xl sm:w-auto" })}
            onClick={onClose}
          >
            Continue browsing
          </button>
        </div>
      </div>
    </div>
  );
}
