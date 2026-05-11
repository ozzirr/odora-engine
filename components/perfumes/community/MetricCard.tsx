import { cn } from "@/lib/utils";

const widthClasses = [
  "w-0",
  "w-[10%]",
  "w-[20%]",
  "w-[30%]",
  "w-[40%]",
  "w-[50%]",
  "w-[60%]",
  "w-[70%]",
  "w-[80%]",
  "w-[90%]",
  "w-full",
];

function clampScore(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.min(10, Math.max(0, Math.round(value)));
}

type MetricCardProps = {
  label: string;
  value: string;
  score?: number | null;
  icon?: string;
  muted?: boolean;
};

export function MetricCard({ label, value, score, icon, muted = false }: MetricCardProps) {
  const normalizedScore = clampScore(score);

  return (
    <article className="rounded-2xl border border-[#eadfce] bg-white p-3 shadow-[0_16px_34px_-30px_rgba(53,39,27,0.26)] transition-all duration-200 active:scale-[0.99] sm:p-4 sm:hover:-translate-y-0.5 sm:hover:shadow-[0_22px_42px_-32px_rgba(53,39,27,0.34)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8b7762]">{label}</p>
          <p className={cn("mt-1 truncate text-xl font-semibold text-[#21180f] sm:text-2xl", muted && "text-[#8b7762]")}>
            {value}
          </p>
        </div>
        {icon ? (
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f5efe6] text-sm sm:h-9 sm:w-9 sm:text-base">
            {icon}
          </span>
        ) : null}
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#efe6d9] sm:mt-4 sm:h-2">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-[#1e4b3b] via-[#6d8f5f] to-[#c9a15d] transition-all duration-200",
            normalizedScore == null ? "w-[35%] opacity-35" : widthClasses[normalizedScore],
          )}
        />
      </div>
    </article>
  );
}
