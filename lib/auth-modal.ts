export type AuthMode = "login" | "signup";

type SearchParamsLike = Pick<URLSearchParams, "toString">;

function toMutableSearchParams(searchParams: SearchParamsLike) {
  return new URLSearchParams(searchParams.toString());
}

export function getAuthMode(value: string | null): AuthMode | null {
  return value === "login" || value === "signup" ? value : null;
}

export function buildPathWithoutAuthModal(
  pathname: string,
  searchParams: SearchParamsLike,
  hash: string,
) {
  const params = toMutableSearchParams(searchParams);
  params.delete("auth");
  params.delete("authNext");
  params.delete("error");

  const search = params.toString();
  return `${pathname}${search ? `?${search}` : ""}${hash}`;
}

export function buildAuthModalUrl(
  pathname: string,
  searchParams: SearchParamsLike,
  mode: AuthMode,
  hash: string,
) {
  const params = toMutableSearchParams(searchParams);
  const nextPath = params.get("authNext") || buildPathWithoutAuthModal(pathname, params, hash);

  params.delete("error");
  params.set("auth", mode);
  params.set("authNext", nextPath);

  return `${pathname}?${params.toString()}${hash}`;
}
