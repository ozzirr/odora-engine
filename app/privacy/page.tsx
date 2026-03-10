import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Odora",
  description: "Learn how Odora collects, uses, and protects personal information.",
};

const sections = [
  {
    title: "What We Collect",
    paragraphs: [
      "Odora may collect information you provide directly, such as your name, email address, and account details when you sign up, log in, or update your profile.",
      "We may also collect technical and usage information needed to operate the site, including device and browser data, pages viewed, referral information, authentication status, and interactions with product or retailer links.",
    ],
  },
  {
    title: "How We Use Information",
    paragraphs: [
      "We use information to provide the service, secure accounts, personalize discovery features, improve the catalog experience, and understand how people use the site.",
      "We may also use information to maintain service quality, prevent abuse, investigate technical issues, and measure interest in pages, collections, and retailer links.",
    ],
  },
  {
    title: "Cookies, Sessions, and Similar Technologies",
    paragraphs: [
      "Odora uses cookies and similar technologies to keep you signed in, remember session state, and support essential site functionality.",
      "If analytics, affiliate tracking, or third-party scripts are added, this page should be updated to reflect those technologies and any choices available to users.",
    ],
  },
  {
    title: "When We Share Information",
    paragraphs: [
      "We may share information with service providers that help us host, secure, and operate Odora, including infrastructure, authentication, analytics, and storage providers.",
      "We may also disclose information if required by law, to protect users and the service, or in connection with a business transfer, merger, or restructuring.",
    ],
  },
  {
    title: "Retailers and External Links",
    paragraphs: [
      "Odora links to external retailer websites. When you leave Odora, the retailer's own privacy policy, terms, and tracking practices apply.",
      "We are not responsible for the content, pricing, availability, or privacy practices of third-party websites linked from Odora.",
    ],
  },
  {
    title: "Data Retention and Security",
    paragraphs: [
      "We keep personal information for as long as reasonably necessary to operate the service, maintain accounts, comply with legal obligations, resolve disputes, and enforce site policies.",
      "We take reasonable technical and organizational measures to protect information, but no internet-based service can guarantee absolute security.",
    ],
  },
  {
    title: "Your Rights and Choices",
    paragraphs: [
      "Depending on where you live, you may have rights to access, correct, delete, or restrict the use of your personal information, and to object to certain processing.",
      "If you contact Odora with a privacy request, we may ask for information needed to verify the request before taking action.",
    ],
  },
  {
    title: "Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. When we do, we will revise the effective date shown on this page.",
      "Material changes should be reflected on the site before they take effect.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This Privacy Policy explains how Odora handles personal information when you browse the site, create an account, use discovery features, or click through to external retailers."
      effectiveDate="March 10, 2026"
      sections={sections}
    />
  );
}
