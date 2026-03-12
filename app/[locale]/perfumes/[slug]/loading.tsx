import { PerfumeDetailLoadingState } from "@/components/perfumes/PerfumeDetailLoadingState";

export default function PerfumeDetailRouteLoading() {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(24,20,16,0.24)] px-4 py-6 backdrop-blur-[18px] sm:px-6">
      <PerfumeDetailLoadingState />
    </div>
  );
}
