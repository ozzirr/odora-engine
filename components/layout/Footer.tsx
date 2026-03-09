import Link from "next/link";

import { Container } from "@/components/layout/Container";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/perfumes", label: "Perfumes" },
  { href: "/finder", label: "Finder" },
  { href: "/top", label: "Top" },
];

const legalLinks = [
  { href: "#", label: "Privacy" },
  { href: "#", label: "Terms" },
  { href: "#", label: "Affiliate Disclosure" },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[#e8dfd2] bg-[#f5efe4]">
      <Container className="py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <p className="font-display text-3xl text-[#1f1914]">Odora</p>
            <p className="max-w-sm text-sm text-[#5e4f40]">
              Italian-first fragrance discovery platform to compare perfumes, notes,
              moods, and the best available offers.
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
              Navigation
            </p>
            <ul className="space-y-2 text-sm text-[#4f3f31]">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-[#1f1914]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
              Legal
            </p>
            <ul className="space-y-2 text-sm text-[#4f3f31]">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-[#1f1914]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </footer>
  );
}
