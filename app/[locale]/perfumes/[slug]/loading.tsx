import { Container } from "@/components/layout/Container";
import { PerfumeDetailLoadingState } from "@/components/perfumes/PerfumeDetailLoadingState";

export default function PerfumeDetailRouteLoading() {
  return (
    <Container className="flex min-h-[calc(100dvh-12rem)] items-start justify-center pt-8 pb-40 sm:pt-12 md:pb-16">
      <PerfumeDetailLoadingState />
    </Container>
  );
}
