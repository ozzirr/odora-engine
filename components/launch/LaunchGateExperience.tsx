"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { type AppLocale } from "@/lib/i18n";

type LaunchGateExperienceProps = {
  locale: AppLocale;
};

const copy = {
  en: {
    eyebrow: "Odora is almost here",
    title: "Perfume discovery is opening soon.",
    subtitle:
      "Odora is currently in a private pre-launch phase while we finish the catalog, pricing flows, and member experience.",
    waitlistTitle: "Join the waitlist",
    waitlistBody:
      "Leave your email and we will let you know when the public launch is ready.",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    joinWaitlist: "Join waitlist",
    waitlistSuccess: "You are on the list. We will be in touch when access opens.",
    waitlistError: "We could not save your email right now. Try again in a moment.",
    accessTitle: "Private access",
    accessBody:
      "If you already have access, enter the password to continue into the current preview.",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter password",
    unlock: "Enter preview",
    passwordError: "Password not valid.",
    highlights: [
      "Coming soon page for public visitors",
      "Early-access preview behind password",
      "Waitlist form with email input",
    ],
  },
  it: {
    eyebrow: "Odora sta arrivando",
    title: "La scoperta dei profumi apre presto.",
    subtitle:
      "Odora e in una fase di pre-lancio privata mentre chiudiamo catalogo, pricing e esperienza riservata ai membri.",
    waitlistTitle: "Entra in waiting list",
    waitlistBody:
      "Lascia la tua email e ti avviseremo appena apriremo al pubblico.",
    emailLabel: "Indirizzo email",
    emailPlaceholder: "tuo@email.com",
    joinWaitlist: "Entra in lista",
    waitlistSuccess: "Sei in lista. Ti scriveremo appena apriamo l'accesso.",
    waitlistError: "Non siamo riusciti a salvare la tua email adesso. Riprova tra poco.",
    accessTitle: "Accesso privato",
    accessBody:
      "Se hai gia accesso, inserisci la password per entrare nella preview corrente.",
    passwordLabel: "Password",
    passwordPlaceholder: "Inserisci password",
    unlock: "Entra nella preview",
    passwordError: "Password non valida.",
    highlights: [
      "Coming soon per i visitatori pubblici",
      "Preview privata protetta da password",
      "Waiting list con campo email",
    ],
  },
} as const;

function Card({
  title,
  body,
  children,
  className,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[2rem] border border-[#d8cab6] bg-white/88 p-6 shadow-[0_24px_48px_-34px_rgba(46,34,22,0.38)] backdrop-blur",
        className,
      )}
    >
      <h2 className="font-display text-2xl text-[#1f1710]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#645443]">{body}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function LaunchGateExperience({ locale }: LaunchGateExperienceProps) {
  const text = copy[locale];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false);
  const [isSubmittingAccess, setIsSubmittingAccess] = useState(false);
  const [waitlistState, setWaitlistState] = useState<"idle" | "success" | "error">("idle");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleWaitlistSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmittingWaitlist(true);
    setWaitlistState("idle");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, locale }),
      });

      if (!response.ok) {
        throw new Error("waitlist_failed");
      }

      setEmail("");
      setWaitlistState("success");
    } catch {
      setWaitlistState("error");
    } finally {
      setIsSubmittingWaitlist(false);
    }
  }

  async function handleAccessSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmittingAccess(true);
    setPasswordError(null);

    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ password, locale }),
      });

      if (!response.ok) {
        throw new Error("invalid_password");
      }

      const payload = (await response.json()) as { redirectPath?: string };
      window.location.assign(payload.redirectPath || `/${locale}`);
    } catch {
      setPasswordError(text.passwordError);
    } finally {
      setIsSubmittingAccess(false);
    }
  }

  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#f8efe3_0%,#f2e6d8_28%,#eadbc9_55%,#e0cdb7_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.62),rgba(255,255,255,0)_45%)]" />
      <div className="absolute left-[-8rem] top-[-6rem] h-64 w-64 rounded-full bg-white/35 blur-3xl" />
      <div className="absolute bottom-[-7rem] right-[-5rem] h-72 w-72 rounded-full bg-[#bf9d7a]/28 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-14 sm:px-10">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#866d55]">
            {text.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-[clamp(3rem,7vw,6rem)] leading-[0.95] text-[#1e1711]">
            {text.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#5f4d3d] sm:text-lg">
            {text.subtitle}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-sm text-[#5f4f40]">
          {text.highlights.map((item) => (
            <span
              key={item}
              className="rounded-full border border-[#d9cab6] bg-white/72 px-4 py-2 shadow-[0_18px_30px_-28px_rgba(46,34,22,0.45)]"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
          <Card title={text.waitlistTitle} body={text.waitlistBody}>
            <form className="space-y-4" onSubmit={handleWaitlistSubmit}>
              <label className="block text-sm font-medium text-[#3a2e23]">
                <span className="mb-2 block">{text.emailLabel}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder={text.emailPlaceholder}
                  className="h-12 w-full rounded-2xl border border-[#d8cab7] bg-[#fdfaf6] px-4 text-sm text-[#1f1710] outline-none transition focus:border-[#1e4b3b] focus:ring-2 focus:ring-[#1e4b3b]/15"
                />
              </label>

              <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmittingWaitlist}>
                {isSubmittingWaitlist ? "..." : text.joinWaitlist}
              </Button>

              {waitlistState === "success" ? (
                <p className="text-sm text-[#1e4b3b]">{text.waitlistSuccess}</p>
              ) : null}
              {waitlistState === "error" ? (
                <p className="text-sm text-[#9a4236]">{text.waitlistError}</p>
              ) : null}
            </form>
          </Card>

          <Card title={text.accessTitle} body={text.accessBody} className="bg-[#fffaf2]/92">
            <form className="space-y-4" onSubmit={handleAccessSubmit}>
              <label className="block text-sm font-medium text-[#3a2e23]">
                <span className="mb-2 block">{text.passwordLabel}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  placeholder={text.passwordPlaceholder}
                  className="h-12 w-full rounded-2xl border border-[#d8cab7] bg-[#fdfaf6] px-4 text-sm text-[#1f1710] outline-none transition focus:border-[#1e4b3b] focus:ring-2 focus:ring-[#1e4b3b]/15"
                />
              </label>

              <Button type="submit" size="lg" className="w-full" disabled={isSubmittingAccess}>
                {isSubmittingAccess ? "..." : text.unlock}
              </Button>

              {passwordError ? (
                <p className="text-sm text-[#9a4236]">{passwordError}</p>
              ) : null}
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
