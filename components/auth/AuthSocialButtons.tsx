import { Button } from "@/components/ui/Button";

type AuthSocialButtonsProps = {
  mode: "login" | "signup";
};

export function AuthSocialButtons({ mode }: AuthSocialButtonsProps) {
  const labelPrefix = mode === "login" ? "Accesso" : "Registrazione";

  return (
    <div className="grid gap-2">
      <Button type="button" variant="secondary" className="w-full" disabled>
        {labelPrefix} Google presto disponibile
      </Button>
      <Button type="button" variant="secondary" className="w-full" disabled>
        {labelPrefix} Apple presto disponibile
      </Button>
      <Button type="button" variant="secondary" className="w-full" disabled>
        {labelPrefix} Facebook presto disponibile
      </Button>
    </div>
  );
}
