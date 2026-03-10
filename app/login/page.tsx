import type { Metadata } from "next";
import Link from "next/link";

import { AuthSocialButtons } from "@/components/auth/AuthSocialButtons";
import { LoginForm } from "@/components/auth/LoginForm";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Accedi | Odora",
  description:
    "Accedi al tuo account Odora per continuare la scoperta delle fragranze e sbloccare il catalogo completo.",
};

type LoginPageProps = {
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

  if (errorCode === "auth_callback_failed") {
    return "Accesso non completato. Riprova.";
  }

  if (errorCode === "email_verification_failed") {
    return "Verifica email non completata. Richiedi un nuovo link.";
  }

  if (errorCode === "invalid_auth_callback") {
    return "Link di autenticazione non valido.";
  }

  return "Operazione di autenticazione non riuscita.";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const nextPath = parseValue(resolvedSearchParams.next);
  const errorCode = parseValue(resolvedSearchParams.error);

  return (
    <Container className="py-14 sm:py-18">
      <div className="mx-auto max-w-md rounded-3xl border border-[#ddcfbe] bg-[#fffdf9] p-6 shadow-[0_20px_46px_-34px_rgba(53,39,27,0.4)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7762]">Odora Account</p>
        <h1 className="mt-2 font-display text-4xl text-[#21180f]">Accedi</h1>
        <p className="mt-2 text-sm text-[#685747]">
          Continua l&apos;esplorazione del catalogo con il tuo profilo Odora.
        </p>

        <LoginForm nextPath={nextPath} initialError={mapAuthErrorToMessage(errorCode)} />

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#e4d8c9]" />
          <span className="text-xs uppercase tracking-[0.1em] text-[#8b7762]">oppure</span>
          <span className="h-px flex-1 bg-[#e4d8c9]" />
        </div>

        <AuthSocialButtons mode="login" />

        <p className="mt-6 text-sm text-[#675545]">
          Non hai ancora un account?{" "}
          <Link href="/signup" className="font-semibold text-[#2b2118] underline-offset-2 hover:underline">
            Crea account
          </Link>
        </p>

        <p className="mt-3 text-xs text-[#8b7762]">
          I pulsanti social sono temporaneamente in modalita mock e verranno collegati all&apos;autenticazione reale
          nel prossimo step.
        </p>
      </div>
    </Container>
  );
}
