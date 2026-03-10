import { Button } from "@/components/ui/Button";

type AuthSocialButtonsProps = {
  mode: "login" | "signup";
};

export function AuthSocialButtons({ mode }: AuthSocialButtonsProps) {
  const ctaPrefix = mode === "login" ? "Accedi" : "Registrati";

  return (
    <div className="grid gap-2">
      <Button type="button" variant="secondary" className="w-full">
        {ctaPrefix} con Google (mock)
      </Button>
      <Button type="button" variant="secondary" className="w-full">
        {ctaPrefix} con Apple (mock)
      </Button>
      <Button type="button" variant="secondary" className="w-full">
        {ctaPrefix} con Facebook (mock)
      </Button>
    </div>
  );
}
