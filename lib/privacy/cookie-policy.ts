import {
  PRIVACY_DISCLOSURE_UPDATED_AT,
  getPrivacyServices,
  privacyCategories,
} from "@/lib/privacy/consent";

type LegalDocument = {
  eyebrow: string;
  title: string;
  intro: string;
  effectiveDate: string;
  sections: Array<{
    title: string;
    paragraphs: string[];
  }>;
};

function listServices(category: (typeof privacyCategories)[number]["key"]) {
  return getPrivacyServices(category).map((service) => {
    const cookies = service.cookieNames.length
      ? `Identificativi tecnici: ${service.cookieNames.join(", ")}.`
      : "Non risultano cookie marketing o di remarketing associati a questo strumento nel progetto.";

    return `${service.label} (${service.provider}): ${service.purpose} ${cookies}`;
  });
}

export const cookiePolicyContent: LegalDocument = {
  eyebrow: "Legale",
  title: "Cookie Policy",
  intro:
    "Questa Cookie Policy descrive in modo semplice quali cookie e tecnologie simili usa Odora oggi. L'obiettivo è mantenere il setup essenziale: cookie tecnici per il funzionamento del sito e analytics privacy-friendly, senza strumenti di marketing o profilazione attivi.",
  effectiveDate: "1 aprile 2026",
  sections: [
    {
      title: "Panoramica",
      paragraphs: [
        "Odora usa un set ridotto di tecnologie lato browser per far funzionare login, sessioni, lingua del sito e, quando necessario, l'accesso a una preview privata.",
        "Nel progetto è attivo anche Vercel Web Analytics per leggere trend aggregati di utilizzo. Non risultano nel repository Google Analytics, Google Tag Manager, Meta Pixel, Hotjar, Microsoft Clarity, widget chat o tag di remarketing caricati nel frontend.",
      ],
    },
    {
      title: "Cookie tecnici e necessari",
      paragraphs: [
        "Questi cookie restano sempre attivi perché servono a fornire funzioni richieste dall'utente, come autenticazione, mantenimento della sessione, scelta della lingua e protezione delle aree riservate.",
        ...listServices("necessary"),
      ],
    },
    {
      title: "Analytics privacy-friendly",
      paragraphs: [
        "Usiamo Vercel Web Analytics per capire in modo aggregato quali pagine vengono consultate e dove l'esperienza può essere migliorata. Questo setup non viene usato per pubblicità comportamentale, audience building o remarketing.",
        ...listServices("analytics"),
      ],
    },
    {
      title: "Cookie di marketing e profilazione",
      paragraphs: [
        "Al momento Odora non carica cookie o script di marketing/profilazione nel sito. Nessun pixel pubblicitario o tag manager marketing viene eseguito prima o dopo un'azione dell'utente, perché questi strumenti non sono presenti nel progetto.",
        "Se in futuro verranno introdotti strumenti opzionali come analytics non essenziali, remarketing o widget terzi con finalità promozionali, il setup privacy verrà aggiornato prima dell'attivazione con un meccanismo di consenso dedicato.",
      ],
    },
    {
      title: "Preferenze e controlli",
      paragraphs: [
        "Nel footer del sito trovi sempre il controllo “Preferenze privacy”, che riassume le categorie attive e rimanda a questa Cookie Policy e alla Privacy Policy.",
        "Puoi anche gestire o cancellare i cookie dal browser. Tieni presente che bloccare i cookie tecnici può compromettere accesso, sessione, cambio lingua o altre funzioni essenziali del sito.",
      ],
    },
    {
      title: "Link esterni e retailer",
      paragraphs: [
        "Quando lasci Odora e visiti un retailer o un sito terzo, si applicano i cookie e le policy di quel soggetto. Odora non controlla i cookie impostati da siti esterni dopo il click in uscita.",
        `La presente versione della Cookie Policy riflette il setup tecnico revisionato il ${new Date(PRIVACY_DISCLOSURE_UPDATED_AT).toLocaleDateString("it-IT")}.`,
      ],
    },
  ],
};
