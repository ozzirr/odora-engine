"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { getSupabaseEnvOrNull } from "@/lib/supabase/config";

type UseAuthStatusOptions = {
  refreshOnChange?: boolean;
};

export function useAuthStatus(
  initialIsAuthenticated = false,
  options: UseAuthStatusOptions = {},
) {
  const { refreshOnChange = false } = options;
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(initialIsAuthenticated);
  const authRef = useRef(initialIsAuthenticated);

  useEffect(() => {
    if (!getSupabaseEnvOrNull()) {
      return;
    }

    const supabase = createClient();
    let isMounted = true;

    const applyAuthState = (nextIsAuthenticated: boolean) => {
      if (!isMounted || authRef.current === nextIsAuthenticated) {
        return;
      }

      authRef.current = nextIsAuthenticated;
      setIsAuthenticated(nextIsAuthenticated);

      if (refreshOnChange) {
        startTransition(() => {
          router.refresh();
        });
      }
    };

    const syncAuthState = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        return;
      }

      applyAuthState(Boolean(data.user));
    };

    void syncAuthState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applyAuthState(Boolean(session?.user));
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncAuthState();
      }
    };

    const handleFocus = () => {
      void syncAuthState();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [pathname, refreshOnChange, router]);

  return isAuthenticated;
}
