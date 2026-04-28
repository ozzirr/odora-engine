"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type ShareButtonsProps = {
  url: string;
  title: string;
  variant?: "primary" | "compact";
};

const baseButton =
  "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition";

export function CopyLinkButton({ url, variant = "primary" }: { url: string; variant?: "primary" | "compact" }) {
  const t = useTranslations("publicList.page");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  const className =
    variant === "primary"
      ? `${baseButton} bg-[#1f1914] text-white hover:bg-[#3a2e24]`
      : `${baseButton} border border-[#ddcfbe] bg-white text-[#1f1914] hover:bg-[#faf4eb]`;

  return (
    <button type="button" onClick={handleCopy} className={className} aria-live="polite">
      {copied ? `✓ ${t("copyLinkSuccess")}` : t("copyLink")}
    </button>
  );
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const t = useTranslations("publicList.page");
  const encodedText = encodeURIComponent(`${title} — ${url}`);
  const whatsappHref = `https://wa.me/?text=${encodedText}`;
  const telegramHref = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;

  return (
    <div className="flex flex-wrap gap-2">
      <CopyLinkButton url={url} variant="compact" />
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseButton} border border-[#ddcfbe] bg-white text-[#1f1914] hover:bg-[#faf4eb]`}
      >
        {t("shareWhatsapp")}
      </a>
      <a
        href={telegramHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseButton} border border-[#ddcfbe] bg-white text-[#1f1914] hover:bg-[#faf4eb]`}
      >
        {t("shareTelegram")}
      </a>
    </div>
  );
}

export function DisabledSocialButton({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <span
      title={tooltip}
      className={`${baseButton} cursor-not-allowed border border-[#e0d5c6] bg-[#faf4eb] text-[#a89889]`}
    >
      {label}
      <span className="ml-1 text-[10px] uppercase tracking-[0.14em] text-[#b09f8e]">{tooltip}</span>
    </span>
  );
}
