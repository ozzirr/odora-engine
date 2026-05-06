import { CatalogStatus, type Gender, type PriceRange, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const REVIEW_SOURCE = "user";
const USER_ID_PREFIX = "odora-synthetic-reviewer-";
const DEFAULT_REVIEWS_PER_PERFUME = 3;

type PerfumeForReview = {
  id: number;
  name: string;
  gender: Gender;
  fragranceFamily: string;
  priceRange: PriceRange;
  isArabic: boolean;
  isNiche: boolean;
  longevityScore: number | null;
  sillageScore: number | null;
  versatilityScore: number | null;
  ratingInternal: number | null;
  notes: Array<{
    intensity: number | null;
    note: {
      name: string;
    };
  }>;
  brand: {
    name: string;
  };
};

type ReviewerPersona = {
  slug: string;
  name: string;
  countryCode: string;
  habit: "office" | "evening" | "daily" | "collector" | "minimal" | "value" | "seasonal" | "social";
  tone: "direct" | "warm" | "critical" | "short" | "detailed";
};

const reviewers: ReviewerPersona[] = [
  { slug: "alessia-milano", name: "Alessia M.", countryCode: "IT", habit: "office", tone: "direct" },
  { slug: "marco-roma", name: "Marco R.", countryCode: "IT", habit: "daily", tone: "critical" },
  { slug: "giulia-torino", name: "Giulia T.", countryCode: "IT", habit: "seasonal", tone: "warm" },
  { slug: "luca-bologna", name: "Luca B.", countryCode: "IT", habit: "evening", tone: "short" },
  { slug: "sofia-napoli", name: "Sofia N.", countryCode: "IT", habit: "social", tone: "warm" },
  { slug: "davide-firenze", name: "Davide F.", countryCode: "IT", habit: "collector", tone: "detailed" },
  { slug: "chiara-verona", name: "Chiara V.", countryCode: "IT", habit: "minimal", tone: "direct" },
  { slug: "matteo-bari", name: "Matteo B.", countryCode: "IT", habit: "value", tone: "critical" },
  { slug: "elena-genova", name: "Elena G.", countryCode: "IT", habit: "office", tone: "warm" },
  { slug: "francesco-padova", name: "Francesco P.", countryCode: "IT", habit: "daily", tone: "short" },
  { slug: "martina-catania", name: "Martina C.", countryCode: "IT", habit: "seasonal", tone: "detailed" },
  { slug: "andrea-parma", name: "Andrea P.", countryCode: "IT", habit: "evening", tone: "direct" },
  { slug: "valentina-lecce", name: "Valentina L.", countryCode: "IT", habit: "social", tone: "critical" },
  { slug: "nicolo-bergamo", name: "Nicolo B.", countryCode: "IT", habit: "collector", tone: "direct" },
  { slug: "sara-palermo", name: "Sara P.", countryCode: "IT", habit: "minimal", tone: "warm" },
  { slug: "riccardo-trento", name: "Riccardo T.", countryCode: "IT", habit: "value", tone: "short" },
  { slug: "federica-modena", name: "Federica M.", countryCode: "IT", habit: "office", tone: "detailed" },
  { slug: "lorenzo-vicenza", name: "Lorenzo V.", countryCode: "IT", habit: "daily", tone: "direct" },
  { slug: "camilla-monza", name: "Camilla M.", countryCode: "IT", habit: "seasonal", tone: "critical" },
  { slug: "gabriele-perugia", name: "Gabriele P.", countryCode: "IT", habit: "evening", tone: "warm" },
  { slug: "alice-udine", name: "Alice U.", countryCode: "IT", habit: "social", tone: "short" },
  { slug: "tommaso-pisa", name: "Tommaso P.", countryCode: "IT", habit: "collector", tone: "critical" },
  { slug: "beatrice-siena", name: "Beatrice S.", countryCode: "IT", habit: "minimal", tone: "detailed" },
  { slug: "simone-rimini", name: "Simone R.", countryCode: "IT", habit: "value", tone: "direct" },
];

const noteNameTranslations: Record<string, string> = {
  amber: "ambra",
  apple: "mela",
  bergamot: "bergamotto",
  cardamom: "cardamomo",
  cedar: "cedro",
  cinnamon: "cannella",
  citrus: "agrumi",
  grapefruit: "pompelmo",
  incense: "incenso",
  iris: "iris",
  jasmine: "gelsomino",
  lavender: "lavanda",
  lemon: "limone",
  mandarin: "mandarino",
  musk: "muschio",
  oakmoss: "muschio di quercia",
  orange: "arancia",
  oud: "oud",
  patchouli: "patchouli",
  rose: "rosa",
  saffron: "zafferano",
  sandalwood: "sandalo",
  tobacco: "tabacco",
  tonka: "fava tonka",
  vanilla: "vaniglia",
  vetiver: "vetiver",
};

const days = ["lunedi", "martedi", "mercoledi", "giovedi", "venerdi", "sabato", "domenica"];
const moments = [
  "uscendo di casa",
  "prima di una cena",
  "per una giornata in ufficio",
  "dopo la doccia",
  "nel weekend",
  "per un aperitivo",
  "durante un viaggio breve",
  "in una mattina fredda",
  "con una camicia pulita",
  "su una giacca leggera",
  "in una serata tranquilla",
  "mentre faceva abbastanza caldo",
];

const bannedFragments = [
  "coerente con la famiglia",
  "dopo l'asciugatura",
  "un profumo da giudicare solo",
  "impressione abbastanza precisa",
  "non l'ho trovato eccessivo, anche usandolo fuori casa",
];

class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed || 1;
  }

  next() {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state / 4294967296;
  }

  int(max: number) {
    return Math.floor(this.next() * max);
  }

  chance(probability: number) {
    return this.next() < probability;
  }

  pick<T>(items: readonly T[]) {
    return items[this.int(items.length)];
  }

  sample<T>(items: readonly T[], count: number) {
    const pool = [...items];
    const output: T[] = [];

    while (pool.length > 0 && output.length < count) {
      output.push(pool.splice(this.int(pool.length), 1)[0]);
    }

    return output;
  }
}

function hashNumber(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clampScore(score: number) {
  return Math.max(1, Math.min(10, score));
}

function scoreWithVariation(base: number | null, fallback: number, seed: number) {
  const variation = (seed % 3) - 1;
  return clampScore((base ?? fallback) + variation);
}

function ratingFallback(perfume: PerfumeForReview) {
  if (perfume.ratingInternal == null) return 7;
  return Math.round(perfume.ratingInternal * 2);
}

function translatedNoteName(rawName: string) {
  const normalized = rawName.toLowerCase();
  return noteNameTranslations[normalized] ?? normalized;
}

function mainNotes(perfume: PerfumeForReview, count = 3) {
  return perfume.notes
    .slice()
    .sort((left, right) => (right.intensity ?? 0) - (left.intensity ?? 0))
    .slice(0, count)
    .map((item) => translatedNoteName(item.note.name));
}

function joinWords(words: string[]) {
  if (words.length === 0) return "";
  if (words.length === 1) return words[0];
  if (words.length === 2) return `${words[0]} e ${words[1]}`;
  return `${words.slice(0, -1).join(", ")} e ${words[words.length - 1]}`;
}

function familyTag(perfume: PerfumeForReview) {
  const family = perfume.fragranceFamily.toLowerCase();
  if (family.includes("vanilla") || family.includes("gourmand")) return "gourmand";
  if (family.includes("citrus") || family.includes("fresh")) return "fresh";
  if (family.includes("aquatic") || family.includes("marine")) return "aquatic";
  if (family.includes("woody") || family.includes("wood")) return "woody";
  if (family.includes("amber") || family.includes("oriental")) return "amber";
  if (family.includes("floral") || family.includes("white")) return "floral";
  if (family.includes("leather")) return "leather";
  if (family.includes("oud") || perfume.isArabic) return "oud";
  if (family.includes("chypre")) return "chypre";
  if (family.includes("spicy")) return "spicy";
  return perfume.isNiche ? "niche" : "easy";
}

function openingSentence(perfume: PerfumeForReview, reviewer: ReviewerPersona, rng: Rng) {
  const moment = rng.pick(moments);
  const day = rng.pick(days);
  const noteText = joinWords(mainNotes(perfume, rng.chance(0.35) ? 2 : 1));
  const options = [
    `Ho provato ${perfume.name} ${moment} e la prima cosa che ho notato e stata ${noteText || "la pulizia dell'accordo"}.`,
    `${perfume.name} mi e arrivato addosso in modo ${rng.pick(["morbido", "diretto", "pulito", "caldo", "asciutto", "luminoso"])} gia dai primi minuti.`,
    `Su di me ${perfume.name} parte ${rng.pick(["piu secco che dolce", "abbastanza rotondo", "molto pulito", "con un lato speziato", "senza fare troppo rumore", "con parecchia presenza"])}.`,
    `L'ho indossato di ${day}: non e stato il classico test su cartoncino, quindi l'ho capito meglio mentre cambiava.`,
    `La cosa buona di ${perfume.name} e che non resta fermo al primo spray: sulla pelle si muove abbastanza.`,
    `Con ${perfume.brand.name} mi aspettavo un certo stile, ma ${perfume.name} mi ha dato una lettura un po' diversa dal solito.`,
  ];

  if (reviewer.tone === "short") {
    options.push(`${perfume.name} e immediato: lo spruzzi e capisci subito se e nella tua zona.`);
  }

  if (reviewer.tone === "critical") {
    options.push(`Non mi ha convinto al 100% all'inizio, pero ${perfume.name} migliora quando si scalda sulla pelle.`);
  }

  return rng.pick(options);
}

function familySentence(perfume: PerfumeForReview, rng: Rng) {
  const tag = familyTag(perfume);
  const byTag: Record<string, string[]> = {
    amber: [
      "La parte calda e resinosa e quella che rimane piu addosso.",
      "Lo sento piu adatto a sera o a temperature basse.",
      "Ha un lato avvolgente, ma non diventa per forza dolcissimo.",
    ],
    aquatic: [
      "La parte acquatica resta salata e pulita, non troppo da docciaschiuma.",
      "Lo userei quando voglio qualcosa di aperto e arioso.",
      "Ha un effetto fresco che funziona bene all'aperto.",
    ],
    chypre: [
      "C'e una base un po' classica che lo rende piu elegante di quanto sembri all'inizio.",
      "La parte verde-terrosa mi piace perche non e scontata.",
      "Lo trovo piu maturo che facile, in senso buono.",
    ],
    easy: [
      "Non richiede troppa attenzione: lo metti e fa il suo lavoro.",
      "E una scelta abbastanza semplice da portare, senza risultare vuota.",
      "Lo vedo bene per chi vuole qualcosa di chiaro e poco complicato.",
    ],
    floral: [
      "Il floreale qui non mi sembra polveroso in modo pesante.",
      "La parte fiorita resta curata e abbastanza moderna.",
      "Mi piace perche non vira subito in qualcosa di troppo dolce.",
    ],
    fresh: [
      "La freschezza e ordinata, piu pulita che aggressiva.",
      "Lo vedo bene di giorno, soprattutto quando serve discrezione.",
      "La parte agrumata o fresca alleggerisce parecchio il profumo.",
    ],
    gourmand: [
      "La dolcezza si sente, ma non mi e sembrata sempre uguale dall'inizio alla fine.",
      "Ha un lato confortevole, da usare quando vuoi qualcosa di morbido.",
      "Se non ami i profumi dolci va provato con calma, perche la parte golosa c'e.",
    ],
    leather: [
      "Il lato cuoiato gli da carattere e puo dividere.",
      "Non lo metterei in automatico ogni mattina: ha bisogno del momento giusto.",
      "La pelle/cuoio lo rende piu adulto e meno accomodante.",
    ],
    niche: [
      "Ha qualche spigolo, ed e proprio quello che lo rende interessante.",
      "Non lo definirei un profumo da complimenti facili.",
      "Si sente che cerca una direzione precisa, non solo piacevolezza.",
    ],
    oud: [
      "La parte scura si sente e va dosata.",
      "Ha una presenza orientale evidente, meglio con poche spruzzate.",
      "Non lo consiglierei come acquisto alla cieca se non ami accordi intensi.",
    ],
    spicy: [
      "Le spezie gli danno movimento e lo rendono meno piatto.",
      "La parte speziata scalda bene senza coprire tutto.",
      "Lo trovo piu interessante quando le spezie si fondono col fondo.",
    ],
    woody: [
      "Il lato legnoso gli da una struttura abbastanza elegante.",
      "Lo sento piu asciutto che dolce, cosa che apprezzo.",
      "La parte legnosa resta ordinata e aiuta molto la portabilita.",
    ],
  };

  return rng.pick(byTag[tag] ?? byTag.easy);
}

function noteSentence(perfume: PerfumeForReview, rng: Rng) {
  const notes = mainNotes(perfume, rng.chance(0.5) ? 2 : 3);
  if (notes.length === 0) {
    return rng.pick([
      "Non riesco a separare benissimo le note, ma l'insieme e leggibile.",
      "Piu che una nota singola, mi resta in mente l'accordo generale.",
    ]);
  }

  const text = joinWords(rng.sample(notes, Math.min(notes.length, rng.chance(0.45) ? 1 : 2)));
  return rng.pick([
    `Sul mio polso esce soprattutto ${text}.`,
    `A me rimane in mente ${text}, piu del resto della piramide.`,
    `La parte di ${text} e quella che sento piu naturale.`,
    `Dopo un po' si fa vedere meglio ${text}.`,
    `Se lo annuso da vicino, la parte di ${text} e la piu chiara.`,
    `Non direi che la parte di ${text} copra tutto, pero torna spesso durante la giornata.`,
  ]);
}

function performanceSentence(perfume: PerfumeForReview, reviewer: ReviewerPersona, rng: Rng) {
  const longevity = perfume.longevityScore ?? ratingFallback(perfume);
  const sillage = perfume.sillageScore ?? Math.max(5, ratingFallback(perfume) - 1);
  const high = longevity >= 8 || sillage >= 8;
  const low = longevity <= 5 && sillage <= 5;

  if (reviewer.habit === "office" && sillage >= 8) {
    return rng.pick([
      "In ufficio lo doserei: una spruzzata in meno cambia parecchio.",
      "Per spazi chiusi ha abbastanza scia, quindi meglio andarci piano.",
      "Non e il tipo di profumo che metterei a caso prima di una riunione.",
    ]);
  }

  if (low) {
    return rng.pick([
      "La durata su di me e stata tranquilla, non da giornata intera.",
      "Dopo poche ore devo cercarlo sulla pelle.",
      "Non lo compro per la performance: lo userei quando posso riapplicarlo.",
      "La scia resta molto vicina, cosa positiva se vuoi discrezione.",
    ]);
  }

  if (high) {
    return rng.pick([
      "La tenuta e seria: a fine giornata lo sentivo ancora sui vestiti.",
      "Proietta abbastanza nelle prime ore, poi resta piu controllato.",
      "Con due spruzzi mi copre tranquillamente la serata.",
      "La scia non passa inosservata, soprattutto all'inizio.",
      "Su tessuto rimane molto piu di quanto pensassi.",
    ]);
  }

  return rng.pick([
    "La durata e corretta, senza miracoli.",
    "Mi accompagna per diverse ore, poi diventa piu personale.",
    "La proiezione e media: si sente se qualcuno e vicino.",
    "Su pelle resta educato, su vestiti guadagna un po'.",
    "Non invade, ma non sparisce subito.",
  ]);
}

function usageSentence(perfume: PerfumeForReview, reviewer: ReviewerPersona, rng: Rng) {
  const byHabit: Record<ReviewerPersona["habit"], string[]> = {
    collector: [
      `Nel mio armadio ${perfume.name} avrebbe senso quando voglio cambiare rispetto ai soliti.`,
      "Non lo vedo come unico profumo, ma come scelta mirata.",
      "Ha abbastanza personalita da non finire dimenticato dopo due prove.",
    ],
    daily: [
      "Lo porterei anche in una giornata normale, senza dover costruire l'occasione intorno.",
      "Per tutti i giorni funziona, purche non si esageri con gli spray.",
      "E facile da rimettere nella rotazione settimanale.",
    ],
    evening: [
      "Secondo me rende meglio di sera che al mattino presto.",
      "Lo vedo bene per cena, non tanto per palestra o commissioni.",
      "Ha piu senso quando vuoi essere notato un minimo.",
    ],
    minimal: [
      "Mi piace di piu con poche spruzzate, quasi sottovoce.",
      "Non serve caricarlo: quando resta pulito funziona meglio.",
      "Lo userei in modo molto misurato.",
    ],
    office: [
      "Per lavoro va bene solo se dosato bene.",
      "In ufficio lo metterei, ma non prima di una stanza piccola.",
      "E abbastanza curato per un contesto formale.",
    ],
    seasonal: [
      "Con la stagione giusta rende molto di piu.",
      "Lo terrei per quei giorni in cui il clima aiuta il fondo a uscire.",
      "Secondo me cambia parecchio tra caldo e freddo.",
    ],
    social: [
      "E uno di quelli che qualcuno nota, ma non sempre in modo invadente.",
      "Lo metterei quando so di uscire, piu che per stare in casa.",
      "Ha un lato abbastanza comunicativo.",
    ],
    value: [
      "Lo giudicherei anche in base al prezzo a cui lo trovi.",
      "Se lo trovi scontato diventa molto piu interessante.",
      "Non pagherei qualsiasi cifra, ma al prezzo giusto ha senso.",
    ],
  };

  return rng.pick(byHabit[reviewer.habit]);
}

function priceSentence(perfume: PerfumeForReview, rng: Rng) {
  const byRange: Record<PriceRange, string[]> = {
    BUDGET: [
      "Per il prezzo, fa piu di quanto mi aspettassi.",
      "Lo trovo furbo: costa poco e non sembra buttato li.",
      "Qui il rapporto qualita/prezzo e davvero il motivo per provarlo.",
      "A questa fascia gli perdono qualche limite.",
    ],
    MID: [
      "Come prezzo medio ci sta, ma lo proverei comunque prima.",
      "Non e un acquisto automatico, pero non mi sembra fuori scala.",
      "Se piace sulla pelle, la spesa ha senso.",
      "Lo metterei nella lista dei profumi da aspettare in promo.",
    ],
    PREMIUM: [
      "A prezzo pieno ci penserei, perche la concorrenza e tanta.",
      "La fascia e gia alta: deve convincere proprio sulla tua pelle.",
      "Qui paghi anche il carattere, non solo la performance.",
      "Mi piace, ma prima di comprarlo farei almeno un secondo test.",
    ],
    LUXURY: [
      "Con questo prezzo non basta che sia piacevole: deve sembrarti necessario.",
      "Lo considero piu un acquisto meditato che un capriccio.",
      "La fattura c'e, ma la cifra richiede una prova seria.",
      "Non lo prenderei alla cieca, anche se capisco il fascino.",
      "E bello, ma a questa fascia divento molto piu severo.",
    ],
  };

  return rng.pick(byRange[perfume.priceRange]);
}

function criticismSentence(perfume: PerfumeForReview, rng: Rng) {
  const tag = familyTag(perfume);
  const generic = [
    "Il limite, per me, e che non sorprende in ogni fase.",
    "Avrei voluto un passaggio centrale un po' piu netto.",
    "Non mi ha dato fastidio, ma nemmeno lo definirei indispensabile.",
    "Sulla carta mi aspettavo piu contrasto.",
    "Il primo impatto e migliore del cuore, almeno sulla mia pelle.",
  ];
  const byTag: Record<string, string[]> = {
    gourmand: ["La dolcezza potrebbe stancare se ne metti troppo.", "Quando fa caldo rischia di diventare pesante."],
    fresh: ["La freschezza e gradevole, ma non aspettarti troppa profondita.", "Dopo qualche ora perde un po' di brillantezza."],
    oud: ["La parte scura puo risultare impegnativa.", "Se non ami profumi densi, qui serve prudenza."],
    leather: ["Il lato cuoiato non e per tutti.", "In certi momenti diventa un po' rigido."],
    floral: ["Il floreale puo sembrare molto presente nei primi minuti.", "Avrei preferito un fondo meno prevedibile."],
  };

  return rng.pick([...(byTag[tag] ?? []), ...generic]);
}

function closingSentence(reviewer: ReviewerPersona, rng: Rng) {
  const byTone: Record<ReviewerPersona["tone"], string[]> = {
    critical: [
      "Lo promuovo, ma non lo comprerei senza provarlo due volte.",
      "Buono, ma non per tutti.",
      "Mi piace a tratti: quando funziona, funziona bene.",
      "Lo consiglio solo a chi cerca proprio questo tipo di resa.",
    ],
    detailed: [
      "E uno di quei profumi che capisci meglio portandolo, non annusandolo per trenta secondi.",
      "La parte piu interessante arriva quando smette di voler impressionare.",
      "Non e perfetto, ma ha una costruzione piu curata della media.",
      "Lo terrei per momenti precisi, non come scelta automatica.",
    ],
    direct: [
      "Per me e promosso.",
      "Lo userei di nuovo senza problemi.",
      "Nel complesso mi ha convinto.",
      "Non mi ha cambiato la vita, ma lo rispetto.",
    ],
    short: [
      "Semplice: mi piace.",
      "Funziona, punto.",
      "Da riprovare.",
      "Non male davvero.",
    ],
    warm: [
      "Mi ha lasciato una bella sensazione addosso.",
      "Lo trovo piacevole senza essere anonimo.",
      "Mi e rimasto in mente piu di quanto pensassi.",
      "Lo vedo facile da amare se ti prende nel momento giusto.",
    ],
  };

  return rng.pick(byTone[reviewer.tone]);
}

function stripFinalPeriod(sentence: string) {
  return sentence.trim().replace(/\.$/, "");
}

function contextualizeSentence(sentence: string, perfume: PerfumeForReview, rng: Rng) {
  if (sentence.includes(perfume.name) || sentence.includes(perfume.brand.name)) {
    return sentence;
  }

  const base = stripFinalPeriod(sentence);
  const modifiers = [
    "sulla mia pelle",
    "nelle prime ore",
    "con mano leggera",
    "su tessuto",
    "in una giornata fresca",
    "quando non fa troppo caldo",
    "dopo un paio di prove",
    "da vicino",
    "senza caricarlo troppo",
    "nel passaggio verso il fondo",
    "piu all'aperto che in casa",
    "se lo metto al mattino",
    "quando si calma il primo spray",
    "con due spruzzi",
    "sulla sciarpa",
    "nelle uscite serali",
    "in modo abbastanza naturale",
    "senza diventare invadente",
    "con un vestito semplice",
    "dopo circa un'ora",
  ];
  const opinions = ["secondo me", "per i miei gusti", "nei miei test", "a naso", "per come lo porto io"];

  return rng.pick([
    `${base}, ${rng.pick(opinions)}.`,
    `${base}, almeno ${rng.pick(modifiers)}.`,
    `${base}; lo noto soprattutto ${rng.pick(modifiers)}.`,
    `${base}, piu che altro ${rng.pick(modifiers)}.`,
    `${base}, ma lo preferisco ${rng.pick(modifiers)}.`,
    `${base}, senza diventare strano ${rng.pick(modifiers)}.`,
  ]);
}

function buildReviewText(perfume: PerfumeForReview, reviewer: ReviewerPersona, index: number) {
  const rng = new Rng(hashNumber(`${perfume.id}:${reviewer.slug}:${index}:v4`));
  const possibleSentences = [
    openingSentence(perfume, reviewer, rng),
    noteSentence(perfume, rng),
    familySentence(perfume, rng),
    performanceSentence(perfume, reviewer, rng),
    usageSentence(perfume, reviewer, rng),
    rng.chance(0.58) ? priceSentence(perfume, rng) : undefined,
    rng.chance(reviewer.tone === "critical" ? 0.72 : 0.38) ? criticismSentence(perfume, rng) : undefined,
    closingSentence(reviewer, rng),
  ].filter((sentence): sentence is string => Boolean(sentence));

  const sentenceCount =
    reviewer.tone === "short" ? 3 + rng.int(2) : reviewer.tone === "detailed" ? 5 + rng.int(2) : 4 + rng.int(2);
  const selected = rng
    .sample(possibleSentences, Math.min(sentenceCount, possibleSentences.length))
    .map((sentence) => contextualizeSentence(sentence, perfume, rng));
  const text = selected.join(" ");

  for (const fragment of bannedFragments) {
    if (text.toLowerCase().includes(fragment)) {
      throw new Error(`Generated banned review fragment "${fragment}" for ${perfume.name}`);
    }
  }

  return text;
}

function reviewerFor(perfumeId: number, reviewIndex: number) {
  const offset = hashNumber(`${perfumeId}:reviewer:v2`);
  return reviewers[(offset + reviewIndex * 5) % reviewers.length];
}

function createdAtFor(perfumeId: number, reviewIndex: number) {
  const daysAgo = 7 + (hashNumber(`${perfumeId}:date:${reviewIndex}`) % 240);
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  date.setUTCHours(8 + reviewIndex * 3, 15 + (perfumeId % 35), 0, 0);
  return date;
}

function parseReviewsPerPerfume() {
  const arg = process.argv.find((item) => item.startsWith("--reviews-per-perfume="));
  const rawValue = arg?.split("=")[1] ?? process.env.ODORA_SYNTHETIC_REVIEWS_PER_PERFUME;
  const parsed = rawValue ? Number.parseInt(rawValue, 10) : DEFAULT_REVIEWS_PER_PERFUME;

  return Number.isFinite(parsed) ? Math.max(1, Math.min(6, parsed)) : DEFAULT_REVIEWS_PER_PERFUME;
}

function normalizeForSimilarity(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function maxRepeatedSentenceCount(reviewRows: Prisma.PerfumeReviewCreateManyInput[]) {
  const counts = new Map<string, number>();

  for (const row of reviewRows) {
    const text = typeof row.text === "string" ? row.text : "";
    for (const sentence of text.split(".")) {
      const normalized = normalizeForSimilarity(sentence);
      if (normalized.length < 42) continue;
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }

  return Math.max(0, ...counts.values());
}

async function main() {
  const reviewsPerPerfume = parseReviewsPerPerfume();

  await prisma.perfumeReview.deleteMany({
    where: {
      userId: {
        startsWith: USER_ID_PREFIX,
      },
    },
  });

  for (const reviewer of reviewers) {
    await prisma.user.upsert({
      where: { id: `${USER_ID_PREFIX}${reviewer.slug}` },
      create: {
        id: `${USER_ID_PREFIX}${reviewer.slug}`,
        name: reviewer.name,
        countryCode: reviewer.countryCode,
      },
      update: {
        name: reviewer.name,
        countryCode: reviewer.countryCode,
      },
    });
  }

  const perfumes = await prisma.perfume.findMany({
    where: {
      catalogStatus: {
        in: [CatalogStatus.VERIFIED, CatalogStatus.IMPORTED_UNVERIFIED, CatalogStatus.DEMO],
      },
    },
    select: {
      id: true,
      name: true,
      gender: true,
      fragranceFamily: true,
      priceRange: true,
      isArabic: true,
      isNiche: true,
      longevityScore: true,
      sillageScore: true,
      versatilityScore: true,
      ratingInternal: true,
      notes: {
        select: {
          intensity: true,
          note: {
            select: {
              name: true,
            },
          },
        },
      },
      brand: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
  });

  const reviewRows: Prisma.PerfumeReviewCreateManyInput[] = [];

  for (const perfume of perfumes) {
    const fallback = ratingFallback(perfume);

    for (let index = 0; index < reviewsPerPerfume; index += 1) {
      const reviewer = reviewerFor(perfume.id, index);
      const userId = `${USER_ID_PREFIX}${reviewer.slug}`;
      const seed = hashNumber(`${perfume.id}:${userId}:${index}:score`);
      const createdAt = createdAtFor(perfume.id, index);

      reviewRows.push({
        userId,
        perfumeId: perfume.id,
        source: REVIEW_SOURCE,
        longevityScore: scoreWithVariation(perfume.longevityScore, fallback, seed),
        sillageScore: scoreWithVariation(perfume.sillageScore, fallback - 1, seed >> 2),
        versatilityScore: scoreWithVariation(perfume.versatilityScore, fallback - 1, seed >> 4),
        text: buildReviewText(perfume, reviewer, index),
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  const uniqueTexts = new Set(reviewRows.map((row) => row.text)).size;
  if (uniqueTexts !== reviewRows.length) {
    throw new Error(`Generated duplicate full review texts: ${reviewRows.length - uniqueTexts}`);
  }

  const maxRepeatedSentence = maxRepeatedSentenceCount(reviewRows);
  if (maxRepeatedSentence > 18) {
    throw new Error(`Repeated sentence count is too high: ${maxRepeatedSentence}`);
  }

  const chunkSize = 250;
  let insertedReviews = 0;

  for (let index = 0; index < reviewRows.length; index += chunkSize) {
    const chunk = reviewRows.slice(index, index + chunkSize);
    const result = await prisma.perfumeReview.createMany({
      data: chunk,
      skipDuplicates: true,
    });

    insertedReviews += result.count;
  }

  const totalSyntheticReviews = await prisma.perfumeReview.count({
    where: {
      userId: {
        startsWith: USER_ID_PREFIX,
      },
    },
  });

  console.log(
    JSON.stringify(
      {
        perfumes: perfumes.length,
        reviewers: reviewers.length,
        reviewsPerPerfume,
        intendedReviews: reviewRows.length,
        insertedReviews,
        totalSyntheticReviews,
        uniqueTexts,
        maxRepeatedSentence,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
