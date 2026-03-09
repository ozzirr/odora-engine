import { Gender } from "@prisma/client";

import { cleanString } from "./normalize";

export function mapGender(value: string | undefined): Gender {
  const normalized = cleanString(value).toLowerCase();

  if (!normalized) {
    return Gender.UNISEX;
  }

  if (
    normalized.includes("unisex") ||
    normalized.includes("all genders") ||
    normalized.includes("shared")
  ) {
    return Gender.UNISEX;
  }

  if (
    normalized === "m" ||
    normalized.includes("male") ||
    normalized.includes("men") ||
    normalized.includes("masculine")
  ) {
    return Gender.MEN;
  }

  if (
    normalized === "f" ||
    normalized.includes("female") ||
    normalized.includes("women") ||
    normalized.includes("feminine")
  ) {
    return Gender.WOMEN;
  }

  return Gender.UNISEX;
}

