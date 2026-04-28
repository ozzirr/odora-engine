import { Container } from "@/components/layout/Container";
import { PerfumeDetailLoadingState } from "@/components/perfumes/PerfumeDetailLoadingState";

export default function PerfumeDetailRouteLoading() {
  return (
    <Container className="pt-4 pb-40 md:pt-6 md:pb-10">
      <PerfumeDetailLoadingState />
    </Container>
  );
}
