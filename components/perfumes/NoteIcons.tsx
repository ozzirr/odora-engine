type NoteIconProps = {
  className?: string;
};

function CitrusIcon({ className }: NoteIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 4.5v15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4.5 12h15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.8 6.8L17.2 17.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17.2 6.8L6.8 17.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 3.2c.6-1 2-1.2 3-.4.4.3.7.8.8 1.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FlowerIcon({ className }: NoteIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M12 6c0-1.7 1.3-3 3-3 1.4 0 2.5 1.1 2.5 2.5 0 2.7-2.5 4.2-5.5 4.5V6Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M18 12c1.7 0 3 1.3 3 3 0 1.4-1.1 2.5-2.5 2.5-2.7 0-4.2-2.5-4.5-5.5H18Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 18c0 1.7-1.3 3-3 3-1.4 0-2.5-1.1-2.5-2.5 0-2.7 2.5-4.2 5.5-4.5V18Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 12c-1.7 0-3-1.3-3-3 0-1.4 1.1-2.5 2.5-2.5 2.7 0 4.2 2.5 4.5 5.5H6Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function LeafIcon({ className }: NoteIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M19.5 5.5c-6 .3-10.8 3.3-13.2 8.1-.7 1.5-.8 3.4-.3 4.9 1.6.5 3.5.4 4.9-.3 4.8-2.4 7.8-7.2 8.1-13.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 16c1.5-2.3 4.3-5.1 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function WavesIcon({ className }: NoteIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 9c1.2 0 1.8-.6 2.5-1.1C6.2 7.4 7 7 8.3 7s2.1.4 2.8.9c.7.5 1.3 1.1 2.5 1.1s1.8-.6 2.5-1.1C16.8 7.4 17.6 7 18.9 7S21 7.4 21 7.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 13c1.2 0 1.8-.6 2.5-1.1.7-.5 1.5-.9 2.8-.9s2.1.4 2.8.9c.7.5 1.3 1.1 2.5 1.1s1.8-.6 2.5-1.1c.7-.5 1.5-.9 2.8-.9s2.1.4 2.1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 17c1.2 0 1.8-.6 2.5-1.1.7-.5 1.5-.9 2.8-.9s2.1.4 2.8.9c.7.5 1.3 1.1 2.5 1.1s1.8-.6 2.5-1.1c.7-.5 1.5-.9 2.8-.9s2.1.4 2.1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ResinIcon({ className }: NoteIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3c3.4 3.8 5.5 6.7 5.5 10A5.5 5.5 0 1 1 6.5 13c0-3.3 2.1-6.2 5.5-10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 14.2c.5.6 1.2 1 2 1 1.5 0 2.4-1 2.8-2.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function WoodIcon({ className }: NoteIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 5v14" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 9.5c.8-.7 2.2-.8 3.1-.1.8.6.9 1.7.4 2.5-.5.9-1.7 1.5-3.5 1.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 14.5c-.7.7-2 .9-2.9.4-.8-.4-1.2-1.3-.9-2.2.3-1 .9-1.6 2.8-2.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SpiceIcon({ className }: NoteIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M8 6.5c0-1.9 1.3-3 4-3s4 1.1 4 3-1.3 3-4 3-4-1.1-4-3Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 9.5v11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8.5 14c1 .4 2.2.6 3.5.6s2.5-.2 3.5-.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9.5 18c.8.3 1.7.5 2.5.5s1.7-.2 2.5-.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MuskIcon({ className }: NoteIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 8.5c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5c0 2.1-1 3.7-2.8 5.4L12 20l-2.2-6.1C8 12.2 7 10.6 7 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 9.5c.4-.8 1.1-1.4 2-1.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function GenericIcon({ className }: NoteIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8.5v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8.5 12h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

type NoteIconKind =
  | "citrus"
  | "flower"
  | "leaf"
  | "waves"
  | "resin"
  | "wood"
  | "spice"
  | "musk"
  | "generic";

function getNoteIconKind(slug: string): NoteIconKind {
  if (/(bergamot|grapefruit|lemon|lime|orange|mandarin|citrus|neroli|yuzu)/.test(slug)) return "citrus";
  if (/(marine|sea|ocean|salt|water|aquatic)/.test(slug)) return "waves";
  if (/(rose|geranium|jasmine|lavender|iris|violet|ylang|peony|magnolia|flower|blossom)/.test(slug)) return "flower";
  if (/(rosemary|sage|mint|basil|leaf|green|fig-leaf|tea)/.test(slug)) return "leaf";
  if (/(incense|amber|benzoin|myrrh|frankincense|resin)/.test(slug)) return "resin";
  if (/(sandalwood|cedar|oud|wood|patchouli|vetiver|oakmoss)/.test(slug)) return "wood";
  if (/(cardamom|pepper|cinnamon|ginger|spice)/.test(slug)) return "spice";
  if (/(musk|vanilla|tonka|cashmeran)/.test(slug)) return "musk";
  return "generic";
}

const iconMap: Record<NoteIconKind, (props: NoteIconProps) => JSX.Element> = {
  citrus: CitrusIcon,
  flower: FlowerIcon,
  leaf: LeafIcon,
  waves: WavesIcon,
  resin: ResinIcon,
  wood: WoodIcon,
  spice: SpiceIcon,
  musk: MuskIcon,
  generic: GenericIcon,
};

export function NoteIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = iconMap[getNoteIconKind(slug)];
  return <Icon className={className} />;
}
