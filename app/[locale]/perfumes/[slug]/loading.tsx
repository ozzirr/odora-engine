import { Container } from "@/components/layout/Container";
import { PerfumeDetailLoadingState } from "@/components/perfumes/PerfumeDetailLoadingState";
import { PerfumeDetailLoadingScrollCapture } from "@/components/perfumes/PerfumeDetailScrollMemory";

export default function PerfumeDetailRouteLoading() {
  return (
    <>
      <PerfumeDetailLoadingScrollCapture />
      <Container className="space-y-6 pt-4 pb-40 md:space-y-8 md:pt-6 md:pb-10">
        <PerfumeDetailLoadingState />
      </Container>
    </>
  );
}
