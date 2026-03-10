import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Affiliate Disclosure | Odora",
  description: "Understand how affiliate links work on Odora.",
};

const sections = [
  {
    title: "How Affiliate Links Work",
    paragraphs: [
      "Some links from Odora to external retailers may be affiliate links. If you click one of those links and complete a qualifying purchase, Odora may earn a commission from the retailer or affiliate network.",
      "This commission helps support the operation of the site, including product research, editorial curation, and maintenance of price comparison features.",
    ],
  },
  {
    title: "What This Means for You",
    paragraphs: [
      "Using an affiliate link generally does not increase the price you pay. The purchase is completed on the retailer's website, under that retailer's own pricing and commercial terms.",
      "Availability, final pricing, shipping, returns, and customer support are all handled by the retailer you choose.",
    ],
  },
  {
    title: "Editorial Independence",
    paragraphs: [
      "Odora aims to keep editorial selection, product discovery, and comparison design independent from affiliate relationships.",
      "When we highlight a fragrance, a collection, or a retailer, the goal is to improve discovery and comparison clarity, not to guarantee a purchase recommendation for every user.",
    ],
  },
  {
    title: "Retailer Coverage",
    paragraphs: [
      "Not every retailer shown on Odora will necessarily be monetized through an affiliate relationship at all times. Retailer coverage can change as programs open, close, or update approval status.",
      "Where affiliate links are available, Odora may prioritize them over standard product links for the same retailer destination.",
    ],
  },
  {
    title: "Price and Availability",
    paragraphs: [
      "Retailer prices and stock status can change quickly. Odora may display the latest known pricing, but the retailer page is always the final source of truth before purchase.",
      "If a retailer changes pricing or availability after you click through, that change is outside Odora's control.",
    ],
  },
];

export default function AffiliateDisclosurePage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Affiliate Disclosure"
      intro="Odora may participate in affiliate programs with selected retailers and networks. This page explains how that relationship works and how it affects outbound product links."
      effectiveDate="March 10, 2026"
      sections={sections}
    />
  );
}
