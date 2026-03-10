import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signOut } from "@/app/profile/actions";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Container } from "@/components/layout/Container";
import { buttonStyles } from "@/components/ui/Button";
import { getCurrentUserSummary } from "@/lib/supabase/auth-state";

export const metadata: Metadata = {
  title: "Profilo | Odora",
  description: "Gestisci il tuo profilo Odora e la sessione di accesso.",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUserSummary();

  if (!user.isAuthenticated || !user.email) {
    redirect("/login?next=/profile");
  }

  return (
    <Container className="py-14 sm:py-18">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-[#ddcfbe] bg-[#fffdf9] p-6 shadow-[0_20px_46px_-34px_rgba(53,39,27,0.4)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7762]">Odora Account</p>
          <h1 className="mt-2 font-display text-4xl text-[#21180f]">Il tuo profilo</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#685747]">
            Qui puoi aggiornare i dati base del tuo account e gestire la sessione attiva.
          </p>

          <div className="mt-8">
            <ProfileForm email={user.email} initialName={user.displayName ?? ""} />
          </div>
        </section>

        <aside className="rounded-3xl border border-[#ddcfbe] bg-[#f8f2e8] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7762]">Sessione</p>
          <h2 className="mt-2 font-display text-3xl text-[#21180f]">Accesso attivo</h2>
          <p className="mt-3 text-sm text-[#685747]">
            Sei autenticato come <span className="font-medium text-[#2c2219]">{user.email}</span>.
          </p>

          <form action={signOut} className="mt-6">
            <button type="submit" className={buttonStyles({ variant: "secondary", className: "w-full" })}>
              Logout
            </button>
          </form>
        </aside>
      </div>
    </Container>
  );
}
