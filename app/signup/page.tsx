import type { Metadata } from "next";
import Link from "next/link";

import { AuthSocialButtons } from "@/components/auth/AuthSocialButtons";
import { SignupForm } from "@/components/auth/SignupForm";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Crea account | Odora",
  description:
    "Crea il tuo account Odora per sbloccare il catalogo completo e salvare la tua esperienza di scoperta profumi.",
};

type SignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parseValue(value: string | string[] | undefined) {
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

function mapAuthErrorToMessage(errorCode: string | undefined) {
  if (!errorCode) {
    return undefined;
  }

  return "Registrazione non completata. Riprova.";
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const resolvedSearchParams = await searchParams;
  const nextPath = parseValue(resolvedSearchParams.next);
  const errorCode = parseValue(resolvedSearchParams.error);

  return (
    <Container className="py-14 sm:py-18">
      <div className="mx-auto max-w-md rounded-3xl border border-[#ddcfbe] bg-[#fffdf9] p-6 shadow-[0_20px_46px_-34px_rgba(53,39,27,0.4)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7762]">Odora Account</p>
        <h1 className="mt-2 font-display text-4xl text-[#21180f]">Crea account</h1>
        <p className="mt-2 text-sm text-[#685747]">
          Registrati per continuare la scoperta delle fragranze senza limiti.
        </p>

        <SignupForm nextPath={nextPath} initialError={mapAuthErrorToMessage(errorCode)} />

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#e4d8c9]" />
          <span className="text-xs uppercase tracking-[0.1em] text-[#8b7762]">oppure</span>
          <span className="h-px flex-1 bg-[#e4d8c9]" />
        </div>

        <AuthSocialButtons mode="signup" />

        <p className="mt-6 text-sm text-[#675545]">
          Hai gia un account?{" "}
          <Link href="/login" className="font-semibold text-[#2b2118] underline-offset-2 hover:underline">
            Accedi
          </Link>
        </p>

        <p className="mt-3 text-xs text-[#8b7762]">
          I pulsanti social sono temporaneamente in modalita mock e verranno collegati a Supabase Auth nel prossimo
          step.
        </p>
      </div>
    </Container>
  );
}
