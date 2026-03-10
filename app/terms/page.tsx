import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use | Odora",
  description: "Read the terms that govern use of Odora.",
};

const sections = [
  {
    title: "Using Odora",
    paragraphs: [
      "By accessing or using Odora, you agree to use the site lawfully and in accordance with these Terms of Use.",
      "You must not misuse the site, attempt to interfere with its operation, scrape restricted areas without permission, or use the service in a way that harms Odora, its users, or connected retailers.",
    ],
  },
  {
    title: "Content, Pricing, and Availability",
    paragraphs: [
      "Odora provides fragrance discovery content, product information, and price comparisons for general informational purposes.",
      "Prices, shipping costs, availability, and retailer information can change at any time. Final pricing and purchase terms are always determined by the retailer you choose.",
    ],
  },
  {
    title: "Accounts",
    paragraphs: [
      "If you create an account, you are responsible for keeping your login credentials secure and for activity that occurs under your account.",
      "Odora may suspend or restrict accounts that are used fraudulently, abusively, or in violation of these terms.",
    ],
  },
  {
    title: "Retailers and Third-Party Services",
    paragraphs: [
      "Odora may link to third-party retailers and services. Those sites operate independently and have their own terms, policies, and commercial conditions.",
      "Any purchase, return, shipment, or customer service issue relating to a retailer order must be resolved with that retailer.",
    ],
  },
  {
    title: "Affiliate Relationships",
    paragraphs: [
      "Some outbound links on Odora may be affiliate links. If you click one of those links and complete a qualifying purchase, Odora may earn a commission.",
      "Affiliate relationships do not change the price you pay, and they do not create a direct sales relationship between Odora and the retailer transaction.",
    ],
  },
  {
    title: "Intellectual Property",
    paragraphs: [
      "The Odora brand, site design, original copy, editorial selections, and other original materials on the site are protected by applicable intellectual property laws.",
      "You may not copy, republish, or commercially exploit Odora content without prior written permission, except where permitted by law.",
    ],
  },
  {
    title: "Disclaimers and Liability",
    paragraphs: [
      "Odora is provided on an as-is and as-available basis. We do not guarantee uninterrupted access, perfect accuracy, or that every listing, offer, or ranking will always be complete or current.",
      "To the maximum extent permitted by law, Odora is not liable for indirect, incidental, consequential, or retailer-side losses arising from your use of the site or reliance on third-party retailer information.",
    ],
  },
  {
    title: "Changes",
    paragraphs: [
      "We may update these Terms of Use from time to time. Continued use of the site after changes become effective means you accept the revised terms.",
      "The effective date at the top of this page reflects the latest version.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Use"
      intro="These Terms of Use govern access to Odora and explain the basic rules that apply when you browse fragrances, compare offers, create an account, or follow links to external retailers."
      effectiveDate="March 10, 2026"
      sections={sections}
    />
  );
}
