"use client";

import { useEffect, useRef, useState } from "react";

import type { CommunityActionState } from "@/app/perfume-community/actions";
import { buttonStyles } from "@/components/ui/Button";
import { Slider } from "@/components/perfumes/community/Slider";

type ContributionSlidersProps = {
  perfumeId: number;
  detailPath: string;
  isAuthenticated: boolean;
  isItalian: boolean;
  reviewAction: (formData: FormData) => void;
  reviewPending: boolean;
  reviewState: CommunityActionState;
  onAuthRequired: () => void;
};

export function ContributionSliders({
  perfumeId,
  detailPath,
  isAuthenticated,
  isItalian,
  reviewAction,
  reviewPending,
  reviewState,
  onAuthRequired,
}: ContributionSlidersProps) {
  const [scores, setScores] = useState({
    longevityScore: 7,
    sillageScore: 6,
    versatilityScore: 7,
  });
  const [reviewOpen, setReviewOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const scheduleAuthIntercept = () => {
    if (isAuthenticated) {
      return;
    }

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(onAuthRequired, 800);
  };

  const updateScore = (name: keyof typeof scores, value: number) => {
    setScores((current) => ({ ...current, [name]: value }));
    scheduleAuthIntercept();
  };

  return (
    <div className="rounded-2xl border border-[#b8cfbd] bg-[#eee2d2] p-4 shadow-lg shadow-[#2f2418]/10 transition-all duration-200 ease-out sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7762]">
            {isItalian ? "Contribuisci" : "Contribute"}
          </p>
          <h3 className="mt-1 font-display text-xl text-[#21180f] sm:text-2xl">
            {isItalian ? "Valuta questa fragranza" : "Rate this fragrance"}
          </h3>
        </div>
        <p className="max-w-sm text-sm leading-6 text-[#685747]">
          {isItalian
            ? "Aiuta la community in pochi secondi."
            : "Help the community in a few seconds."}
        </p>
      </div>

      <div className="mt-4 grid gap-2.5 sm:mt-5 sm:gap-3">
        <Slider
          label={isItalian ? "Persistenza" : "Longevity"}
          name="longevitySlider"
          value={scores.longevityScore}
          onChange={(value) => updateScore("longevityScore", value)}
          onIntent={scheduleAuthIntercept}
        />
        <Slider
          label={isItalian ? "Scia" : "Sillage"}
          name="sillageSlider"
          value={scores.sillageScore}
          onChange={(value) => updateScore("sillageScore", value)}
          onIntent={scheduleAuthIntercept}
        />
        <Slider
          label={isItalian ? "Versatilita" : "Versatility"}
          name="versatilitySlider"
          value={scores.versatilityScore}
          onChange={(value) => updateScore("versatilityScore", value)}
          onIntent={scheduleAuthIntercept}
        />
      </div>

      {reviewOpen ? (
        <form action={isAuthenticated ? reviewAction : undefined} className="mt-4">
          <input type="hidden" name="perfumeId" value={perfumeId} />
          <input type="hidden" name="detailPath" value={detailPath} />
          <input type="hidden" name="longevityScore" value={scores.longevityScore} />
          <input type="hidden" name="sillageScore" value={scores.sillageScore} />
          <input type="hidden" name="versatilityScore" value={scores.versatilityScore} />
          <textarea
            name="text"
            rows={3}
            maxLength={500}
            disabled={!isAuthenticated}
            placeholder={
              isItalian
                ? "Racconta come si evolve sulla tua pelle..."
                : "Tell us how it evolves on your skin..."
            }
            className="w-full rounded-2xl border-0 bg-neutral-50 p-3 text-sm text-[#21180f] shadow-inner shadow-[#6b5847]/5 outline-none transition-all duration-200 ease-out placeholder:text-[#9a8977] focus:bg-white focus:ring-2 focus:ring-[#1e4b3b]/30 disabled:bg-neutral-50 disabled:text-[#9a8977] sm:p-4"
          />

          {reviewState.error ? <p className="mt-3 text-sm text-[#7c3f35]">{reviewState.error}</p> : null}
          {reviewState.message ? <p className="mt-3 text-sm text-[#4d6340]">{reviewState.message}</p> : null}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-[#8b7762]">
              {isAuthenticated
                ? isItalian
                  ? "Il tuo contributo aggiorna la media community."
                  : "Your contribution updates the community average."
                : isItalian
                  ? "Puoi provare gli slider prima di accedere."
                  : "You can try the sliders before logging in."}
            </p>
          <button
            type={isAuthenticated ? "submit" : "button"}
            disabled={reviewPending}
            onClick={isAuthenticated ? undefined : onAuthRequired}
            className={buttonStyles({
              size: "lg",
              className:
                "w-full rounded-2xl bg-green-700 shadow-md shadow-green-900/20 transition-all duration-200 ease-out hover:bg-green-800 active:scale-95 sm:w-auto",
            })}
          >
            {reviewPending
              ? isItalian
                ? "Salvataggio..."
                : "Saving..."
              : isItalian
                ? "Pubblica recensione"
                : "Submit review"}
          </button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-[#8b7762]">
            {isAuthenticated
              ? isItalian
                ? "Il tuo contributo aggiorna la media community."
                : "Your contribution updates the community average."
              : isItalian
                ? "Puoi provare gli slider prima di accedere."
                : "You can try the sliders before logging in."}
          </p>
          <button
            type="button"
            onClick={() => (isAuthenticated ? setReviewOpen(true) : onAuthRequired())}
            className={buttonStyles({
              variant: "secondary",
              className: "w-full rounded-2xl sm:w-auto",
            })}
          >
            {isItalian ? "Scrivi una breve recensione" : "Write a short review"}
          </button>
        </div>
      )}
    </div>
  );
}
