export const PUBLIC_CACHE_TAGS = {
  catalog: "catalog",
  homepage: "homepage",
  finderOptions: "finder-options",
  finderResults: "finder-results",
  perfumesPage: "perfumes-page",
  topPage: "top-page",
  perfumeDetail: "perfume-detail",
} as const;

const publicCacheTagValues = new Set<string>(Object.values(PUBLIC_CACHE_TAGS));

export function getPerfumeDetailTag(slug: string) {
  return `perfume:${slug}`;
}

export function isPublicCacheTag(value: string) {
  return publicCacheTagValues.has(value);
}
