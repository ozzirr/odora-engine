const CURATED_BRAND_LOGOS: Record<string, string> = {
  casamorati: "/images/brand-logos/xerjoff.png",
  chanel: "/images/brand-logos/chanel.png",
  dior: "/images/brand-logos/dior.png",
  guerlain: "/images/brand-logos/guerlain.png",
  hermes: "/images/brand-logos/hermes.png",
  prada: "/images/brand-logos/prada.png",
  tomford: "/images/brand-logos/tom-ford.png",
  xerjoff: "/images/brand-logos/xerjoff.png",
};

const CURATED_BRAND_DOMAINS: Record<string, string> = {
  aaronterencehughes: "aaronterencehughes.co.uk",
  acquadiparma: "acquadiparma.com",
  aedesdevenustas: "aedes.com",
  afnanperfumes: "afnan.com",
  alharamain: "alharamainperfumes.com",
  alrehab: "alrehab.com",
  alwataniah: "alwataniahperfumes.com",
  amouage: "amouage.com",
  anfas: "anfas.com",
  arabianoud: "arabianoud.com",
  arabiyatprestige: "arabiyat.com",
  aramis: "aramis.com",
  argos: "argosfragrances.com",
  armaf: "armaf.ae",
  atkinsons: "atkinsons1799.com",
  attarcollection: "attarcollection.com",
  aura: "auraperfume.com",
  auraperfume: "auraperfume.com",
  azzaro: "azzaro.com",
  bdkparfums: "bdkparfums.com",
  bentley: "bentley-fragrances.com",
  birkholz: "birkholz-perfumes.com",
  boadiceathevictorious: "boadiceaperfume.com",
  bondno9: "bondno9.com",
  boucheron: "boucheron.com",
  bvlgari: "bulgari.com",
  byredo: "byredo.com",
  caline: "caline.com",
  carolinaaherrera: "carolinaherrera.com",
  carolinaherrera: "carolinaherrera.com",
  caron: "parfumscaron.com",
  cartier: "cartier.com",
  celine: "celine.com",
  chloe: "chloe.com",
  chopard: "chopard.com",
  clivechristian: "clivechristian.com",
  commedesgarcons: "commedesgarcons.com",
  creed: "creedfragrances.com",
  danieljosier: "danieljosier.com",
  davidbeckham: "davidbeckhamfragrances.com",
  davidoff: "davidoff.com",
  diptyque: "diptyqueparis.com",
  dolceandgabbana: "dolcegabbana.com",
  driesvannoten: "driesvannoten.com",
  editionsdeparfumsfredericmalle: "fredericmalle.com",
  electimuss: "electimuss.com",
  essentialparfums: "essentialparfums.com",
  esteelauder: "esteelauder.com",
  exnihilo: "ex-nihilo-paris.com",
  fendi: "fendi.com",
  fragonard: "fragonard.com",
  frapin: "frapin.com",
  fredericmalle: "fredericmalle.com",
  frenchavenue: "frenchavenue.com",
  giorgioarmani: "armani.com",
  givenchy: "givenchybeauty.com",
  goldfieldandbanks: "goldfieldandbanks.com",
  grautonparfums: "grautonparfums.com",
  gritti: "grittifragrances.com",
  grossmith: "grossmithlondon.com",
  gucci: "gucci.com",
  guess: "guess.com",
  histoiresdeparfums: "histoiresdeparfums.com",
  houbigant: "houbigant-parfum.com",
  hugoboss: "hugoboss.com",
  indult: "indult-paris.com",
  initio: "initio-parfums.com",
  isseymiyake: "isseymiyakeparfums.com",
  jeanpaulgaultier: "jeanpaulgaultier.com",
  jeanlouisscherrer: "jeanlouisscherrer.com",
  jilsander: "jilsander.com",
  jomalone: "jomalone.com",
  joop: "joop.com",
  jovoy: "jovoyparis.com",
  karllagerfeld: "karllagerfeldparis.com",
  kayali: "kayali.com",
  kenzo: "kenzoparfums.com",
  khadlaj: "khadlaj-perfumes.com",
  kilian: "bykilian.com",
  kineticperfumes: "kineticperfumes.com",
  lalique: "lalique.com",
  lancaster: "lancaster-beauty.com",
  lancome: "lancome-usa.com",
  lattafa: "lattafa.com",
  lattafapride: "lattafa.com",
  lelabo: "lelabofragrances.com",
  leseauxprimordiales: "leseauxprimordiales.com",
  lesindemodables: "lesindemodables.com",
  lignestbarth: "lignestbarth.com",
  liquidesimaginaires: "liquidesimaginaires.com",
  loccitaneenprovence: "loccitane.com",
  loewe: "loewe.com",
  loudepre: "loudepre.com",
  louisvuitton: "louisvuitton.com",
  lubin: "lubin.eu",
  leonard: "leonardparfums.com",
  maisonalhambra: "lattafa.com",
  maisoncrivelli: "maisoncrivelli.com",
  maisonfranciskurkdjian: "maisonfranciskurkdjian.com",
  mancera: "manceraparfums.com",
  marcantoinebarrois: "marcantoinebarrois.com",
  marcgebauer: "marcgebauer.com",
  masque: "masquemilano.com",
  matierepremiere: "matiere-premiere.com",
  memoparis: "memoparis.com",
  mercedesbenz: "mercedes-benz.com",
  mindgames: "mindgamesfragrance.com",
  missoni: "missoni.com",
  molinard: "molinard.com",
  montale: "montaleparfums.com",
  mugler: "mugler.com",
  narcisorodriguez: "narcisorodriguezparfums.com",
  nasomatto: "nasomatto.com",
  nicolai: "pnicolai.com",
  nikos: "nikos.com",
  nishane: "nishane.com",
  nobile1942: "nobile1942.it",
  nusuk: "nusuk.com",
  ojar: "ojarofficial.com",
  ormondejayne: "ormondejayne.com",
  ortoparisi: "ortoparisi.com",
  pacorabanne: "rabanne.com",
  panadora: "panadora.se",
  parfumsdelmar: "parfumsdelmar.com",
  parfumsdemarly: "parfums-de-marly.com",
  parfumsmdci: "parfumsmdci.com",
  penhaligons: "penhaligons.com",
  pernoire: "pernoire.com",
  profumumroma: "profumum.com",
  puredistance: "puredistance.com",
  rabanne: "rabanne.com",
  ralphlauren: "ralphlauren.com",
  rasasi: "rasasi.com",
  rayhaan: "rayhaanperfumes.com",
  reinvented: "reinventedparfums.com",
  reyanetradition: "reyane.com",
  robertougolini: "robertougolini.com",
  rochas: "rochas.com",
  rogue: "rogueperfumery.com",
  rojaparfums: "rojaparfums.com",
  rosendomateuolfactiveexpressions: "rosendomateu.com",
  ruebroca: "ruebroca.com",
  sergelutens: "sergelutens.com",
  shiseido: "shiseido.com",
  simoneandreoli: "simoneandreoli.com",
  slumberhouse: "slumberhouse.com",
  soradora: "soradora.com",
  sospiro: "sospirointernational.com",
  stendhal: "stendhalparis.com",
  stephanehumbertlucas: "stephanehumbertlucas.com",
  swissarabian: "swissarabian.com",
  tauerperfumes: "tauerperfumes.com",
  thameen: "thameenfragrance.com",
  theduabrand: "theduabrand.com",
  thehouseofoud: "thoo.it",
  themerchantofvenice: "themerchantofvenice.com",
  thespiritofdubai: "thespiritofdubai.com",
  thewoodscollection: "thewoodscollection.com",
  tizianaterenzi: "tizianaterenzi.com",
  unenuitnomade: "unenuitnomade.com",
  valentino: "valentino-beauty.us",
  vancleefandarpels: "vancleefarpels.com",
  versace: "versace.com",
  victoriassecret: "victoriassecret.com",
  viktorandrolf: "viktor-rolf.com",
  widian: "widianofficial.com",
  yvessaintlaurent: "yslbeautyus.com",
  zadigandvoltaire: "zadig-et-voltaire.com",
  zara: "zara.com",
  zimaya: "zimayaperfumes.com",
};

const BRAND_LOGO_ALIASES: Record<string, string> = {
  bulgari: "bvlgari",
  christiandior: "dior",
  dolcegabbana: "dolceandgabbana",
  hermes: "hermes",
  hermesparis: "hermes",
  kilianparis: "kilian",
  lattafapride: "lattafa",
  lancomeparis: "lancome",
  tomfordbeauty: "tomford",
  viktorrolf: "viktorandrolf",
  xerjoffcasamorati: "casamorati",
};

function brandDomainLogoUrl(domain: string) {
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
}

function normalizeBrandLogoKey(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const key = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");

  return BRAND_LOGO_ALIASES[key] ?? key;
}

export function getCuratedBrandLogoUrl(brandName: string | null | undefined, brandSlug?: string | null) {
  const keys = [normalizeBrandLogoKey(brandName), normalizeBrandLogoKey(brandSlug)];

  for (const key of keys) {
    if (key && CURATED_BRAND_LOGOS[key]) {
      return CURATED_BRAND_LOGOS[key];
    }
  }

  for (const key of keys) {
    if (key && CURATED_BRAND_DOMAINS[key]) {
      return brandDomainLogoUrl(CURATED_BRAND_DOMAINS[key]);
    }
  }

  return null;
}

export function resolveBrandLogoUrl(
  logoUrl: string | null | undefined,
  brandName: string | null | undefined,
  brandSlug?: string | null,
) {
  const cleanLogoUrl = logoUrl?.trim();
  return cleanLogoUrl || getCuratedBrandLogoUrl(brandName, brandSlug);
}
