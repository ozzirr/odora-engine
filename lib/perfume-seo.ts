import { isLikelySyntheticPerfumeDescription } from "@/lib/perfume-text";

type PerfumeSeoSource = {
  descriptionShort?: string | null;
  descriptionLong?: string | null;
  imageUrl?: string | null;
  dataQuality?: string | null;
  catalogStatus?: string | null;
  officialSourceUrl?: string | null;
  sourceConfidence?: number | null;
  notes?: Array<unknown> | null;
};

const MIN_EDITORIAL_DESCRIPTION_LENGTH = 180;
const MIN_SHORT_DESCRIPTION_LENGTH = 80;

function hasSubstantialEditorialText(perfume: PerfumeSeoSource) {
  const longDescription = perfume.descriptionLong?.trim() ?? "";
  const shortDescription = perfume.descriptionShort?.trim() ?? "";

  if (
    longDescription.length >= MIN_EDITORIAL_DESCRIPTION_LENGTH &&
    !isLikelySyntheticPerfumeDescription(longDescription)
  ) {
    return true;
  }

  return (
    shortDescription.length >= MIN_SHORT_DESCRIPTION_LENGTH &&
    !isLikelySyntheticPerfumeDescription(shortDescription)
  );
}

export function isPerfumeEligibleForSearchIndex(perfume: PerfumeSeoSource) {
  const hasTrustedCatalogStatus = perfume.catalogStatus === "VERIFIED";
  const hasStrongDataQuality = perfume.dataQuality === "HIGH";
  const hasEnoughNotes = (perfume.notes?.length ?? 0) >= 3;
  const hasImage = Boolean(perfume.imageUrl?.trim());
  const hasSourceSignal = Boolean(perfume.officialSourceUrl?.trim()) || (perfume.sourceConfidence ?? 0) >= 0.75;

  return (
    hasTrustedCatalogStatus &&
    hasStrongDataQuality &&
    hasImage &&
    hasEnoughNotes &&
    hasSourceSignal &&
    hasSubstantialEditorialText(perfume)
  );
}
