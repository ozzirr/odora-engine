import { BlogPostStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedPost = {
  slug: string;
  locale: "it" | "en";
  title: string;
  excerpt: string;
  tldr: string[];
  content: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  publishedAt: Date;
};

const dates = [
  "2026-04-24T08:00:00.000Z",
  "2026-04-25T08:00:00.000Z",
  "2026-04-26T08:00:00.000Z",
  "2026-04-27T08:00:00.000Z",
  "2026-04-28T08:00:00.000Z",
  "2026-04-29T08:00:00.000Z",
].map((value) => new Date(value));

const posts: SeedPost[] = [
  {
    slug: "migliori-profumi-uomo-2026-ogni-stagione",
    locale: "it",
    title: "I migliori profumi da uomo 2026 per ogni stagione",
    excerpt:
      "Una guida pratica per scegliere un profumo maschile adatto a primavera, estate, autunno e inverno senza comprare a caso.",
    tldr: [
      "In primavera funzionano aromatici verdi, agrumi morbidi e muschi puliti.",
      "In estate conviene preferire profumi freschi, trasparenti e poco dolci.",
      "In autunno e inverno rendono meglio legni, ambra, spezie e vaniglia se dosati bene.",
    ],
    seoTitle: "Migliori profumi uomo 2026: guida per ogni stagione",
    seoDescription:
      "Come scegliere i migliori profumi da uomo 2026 per primavera, estate, autunno e inverno: note, intensita e occasioni d'uso.",
    tags: ["uomo", "stagionale", "guida"],
    publishedAt: dates[0],
    content: `
## Come scegliere senza farsi guidare solo dalla moda

Il miglior profumo da uomo non e necessariamente quello piu virale o piu costoso. Una fragranza funziona davvero quando si adatta alla temperatura, alla pelle, al contesto e alla quantita che usi. Per questo ha piu senso ragionare per stagioni e occasioni, non solo per classifiche.

Su Odora puoi partire dal [catalogo profumi](/it/profumi) e filtrare per famiglia olfattiva, prezzo, note e stile. Se invece vuoi restringere il campo in pochi passaggi, il [Finder Odora](/it/trova-profumo) e utile per tradurre gusti e contesto in una selezione piu concreta.

## Primavera: pulito, aromatico, luminoso

In primavera funzionano bene profumi aromatici, agrumati morbidi, muschi puliti e legni chiari. L'obiettivo e avere una scia presente ma non pesante. Lavanda, bergamotto, neroli, vetiver e muschio bianco sono note molto versatili per ufficio, giornate fuori casa e appuntamenti informali.

Se vuoi un profumo maschile primaverile, evita composizioni troppo zuccherine o dense. Con i primi caldi possono risultare stancanti, anche se in inverno erano perfette.

## Estate: freschezza e controllo

Con il caldo, meno e meglio. Agrumi, note marine, te, zenzero, menta, ginepro e legni asciutti rendono il profumo piu arioso. La durata puo sembrare inferiore, ma questo e normale: molte molecole fresche evaporano prima.

Per l'estate conviene scegliere fragranze che non saturino gli spazi chiusi. Due spruzzi ben posizionati bastano spesso piu di quattro. Se lavori in ufficio, cerca profumi con apertura fresca e fondo pulito, non composizioni troppo dolci o speziate.

## Autunno: legni, spezie e profondita

L'autunno e la stagione ideale per profumi legnosi, ambrati e speziati. Cedro, sandalo, patchouli, cardamomo, pepe rosa e tabacco possono dare carattere senza diventare eccessivi. Qui puoi salire di intensita, soprattutto per la sera.

Un buon profumo autunnale maschile dovrebbe avere equilibrio: abbastanza struttura da durare, ma non cosi tanto zucchero da coprire tutto il resto.

## Inverno: calore, persistenza, personalita

In inverno la pelle e gli abiti reggono meglio note come ambra, vaniglia, oud, cuoio, incenso e resine. Sono profumi piu memorabili, ma anche piu rischiosi se usati male. La regola e semplice: piu la fragranza e intensa, meno spruzzi servono.

Per una selezione rapida puoi consultare anche le [classifiche Odora](/it/classifiche), ma usale come punto di partenza. La prova sulla pelle resta decisiva, perche la stessa vaniglia puo diventare elegante su una persona e troppo dolce su un'altra.

## La formula piu sicura

Se vuoi costruire una piccola rotazione, bastano tre profumi: uno fresco per il caldo, uno pulito per lavoro e quotidiano, uno piu caldo per sera e stagione fredda. Questa strategia evita acquisti impulsivi e ti permette di usare ogni fragranza nel momento in cui rende meglio.
`.trim(),
  },
  {
    slug: "migliori-profumi-uomo-2026-ogni-stagione",
    locale: "en",
    title: "The best men's fragrances for every season in 2026",
    excerpt:
      "A practical guide to choosing men's fragrances for spring, summer, autumn and winter without buying blindly.",
    tldr: [
      "Spring works best with aromatic greens, soft citrus and clean musks.",
      "Summer calls for fresh, transparent fragrances with controlled sweetness.",
      "Autumn and winter can carry woods, amber, spices and vanilla more comfortably.",
    ],
    seoTitle: "Best men's fragrances 2026: a seasonal guide",
    seoDescription:
      "How to choose the best men's fragrances for spring, summer, autumn and winter: notes, intensity and occasions.",
    tags: ["men", "seasonal", "guide"],
    publishedAt: dates[0],
    content: `
## Start with context, not hype

The best men's fragrance is not always the loudest, newest or most expensive one. A scent works when it fits the weather, your skin, the room you are in and the amount you apply. That is why seasonal thinking is more useful than following a generic ranking.

You can browse the [Odora perfume catalog](/en/perfumes) by notes, style, price and family. If you want a faster route, the [Odora Finder](/en/finder) turns taste and occasion into a more focused shortlist.

## Spring: clean, aromatic and bright

Spring is ideal for aromatic herbs, soft citrus, clean musks and light woods. Lavender, bergamot, neroli, vetiver and white musk can feel polished without becoming heavy. They work especially well for office days, daytime plans and casual dates.

Avoid fragrances that are too sweet or dense as temperatures rise. A scent that felt perfect in winter can become tiring in spring.

## Summer: freshness with restraint

In warm weather, less usually works better. Citrus, marine notes, tea, ginger, mint, juniper and dry woods make a fragrance feel airy. Longevity may be shorter, but that is normal: many fresh materials evaporate faster.

For summer, choose fragrances that do not crowd indoor spaces. Two well-placed sprays often work better than four. If you need something for work, look for a fresh opening and a clean base rather than heavy sweetness.

## Autumn: woods, spices and depth

Autumn is the right moment for woody, ambery and spicy compositions. Cedar, sandalwood, patchouli, cardamom, pink pepper and tobacco can add personality without feeling too formal.

A strong autumn fragrance should still be balanced. You want enough structure to last, but not so much sugar or spice that everything else disappears.

## Winter: warmth and character

Cold weather supports amber, vanilla, oud, leather, incense and resins. These notes can be memorable, but they also require discipline. The stronger the fragrance, the fewer sprays you need.

The [Odora top rankings](/en/top) can help you discover popular options, but use them as a starting point. Skin testing matters because the same vanilla accord can feel elegant on one person and too sweet on another.

## A simple rotation

A useful fragrance wardrobe can start with three bottles: one fresh scent for heat, one clean daily scent for work, and one warmer fragrance for evenings and cold weather. This keeps purchases intentional and helps each scent perform in the setting where it makes sense.
`.trim(),
  },
  {
    slug: "profumi-vaniglia-migliori-guida",
    locale: "it",
    title: "Profumi alla vaniglia: come scegliere quelli migliori",
    excerpt:
      "La vaniglia non e sempre dolce allo stesso modo: puo essere gourmand, ambrata, legnosa, speziata o pulita.",
    tldr: [
      "La vaniglia gourmand ricorda dessert, crema e caramello.",
      "La vaniglia ambrata o legnosa e piu adulta e meno zuccherina.",
      "Per il giorno meglio vaniglie morbide; per la sera puoi scegliere versioni piu dense.",
    ],
    seoTitle: "Profumi vaniglia migliori: guida a note e occasioni",
    seoDescription:
      "Guida ai profumi con vaniglia: differenze tra vaniglia gourmand, ambrata, legnosa e speziata, con consigli d'uso.",
    tags: ["vaniglia", "gourmand", "guida"],
    publishedAt: dates[1],
    content: `
## Perche la vaniglia piace cosi tanto

La vaniglia e una delle note piu riconoscibili della profumeria, ma ridurla a "profumo dolce" e un errore. A seconda della composizione puo sembrare crema, zucchero bruciato, baccello secco, liquore, ambra calda o legno morbido.

Se cerchi idee, puoi partire dai filtri del [catalogo Odora](/it/profumi) o usare il [Finder Odora](/it/trova-profumo) quando vuoi indicare direttamente atmosfera, intensita e occasione.

## Vaniglia gourmand

La vaniglia gourmand e quella piu golosa: richiama pasticceria, caramello, crema, cacao, mandorla o zucchero. E avvolgente e immediata, ma va scelta con attenzione se vuoi usarla ogni giorno.

Funziona molto bene in autunno, inverno e sera. In estate o in ufficio puo diventare troppo presente, soprattutto se la composizione contiene anche pralina, miele o frutti molto dolci.

## Vaniglia ambrata

La vaniglia ambrata e piu calda e rotonda. Spesso convive con benzoino, labdano, resine e muschi. Rispetto alla vaniglia gourmand e meno "dessert" e piu elegante, quindi si presta meglio a contesti serali o a chi vuole sensualita senza effetto zucchero.

Questa famiglia e una buona scelta per chi ama profumi persistenti ma non necessariamente rumorosi.

## Vaniglia legnosa o speziata

Quando la vaniglia incontra sandalo, cedro, patchouli, pepe, cardamomo o tabacco, il risultato diventa piu asciutto e adulto. E una direzione ideale per chi teme le vaniglie troppo dolci.

Le versioni legnose sono spesso piu versatili anche su pelle maschile o in fragranze unisex. La dolcezza rimane, ma viene bilanciata da struttura e profondita.

## Come provarla sulla pelle

La vaniglia cambia molto con la temperatura corporea. Su alcune pelli diventa cremosa, su altre piu secca o piu zuccherina. Per valutarla bene, non fermarti ai primi dieci minuti: aspetta almeno due ore e controlla come evolve il fondo.

Un test utile e questo: se dopo due ore senti ancora solo zucchero, forse non e la vaniglia giusta per te. Se invece emergono legni, ambra, muschi o spezie, la composizione ha piu equilibrio.

## Quando usarla

Per il giorno scegli vaniglie morbide, muschiate o legnose. Per appuntamenti e sera puoi spingerti verso ambra, tabacco e gourmand. Per trovare alternative simili per budget o intensita, le [classifiche Odora](/it/classifiche) sono un buon punto di partenza.
`.trim(),
  },
  {
    slug: "profumi-vaniglia-migliori-guida",
    locale: "en",
    title: "Vanilla fragrances: how to choose the best ones",
    excerpt:
      "Vanilla is not always sweet in the same way: it can be gourmand, ambery, woody, spicy or clean.",
    tldr: [
      "Gourmand vanilla suggests desserts, cream and caramel.",
      "Ambery or woody vanilla feels more mature and less sugary.",
      "Soft vanilla works by day; denser versions suit evenings and cold weather.",
    ],
    seoTitle: "Best vanilla fragrances: notes, styles and occasions",
    seoDescription:
      "A guide to vanilla fragrances: gourmand, ambery, woody and spicy vanilla styles, with practical wearing tips.",
    tags: ["vanilla", "gourmand", "guide"],
    publishedAt: dates[1],
    content: `
## Why vanilla is so popular

Vanilla is one of the most recognizable notes in perfumery, but calling it simply "sweet" misses the point. Depending on the composition, it can suggest cream, caramel, dry vanilla pod, liqueur, warm amber or soft woods.

You can start with the [Odora catalog](/en/perfumes) or use the [Odora Finder](/en/finder) when you want to describe mood, intensity and occasion directly.

## Gourmand vanilla

Gourmand vanilla is the edible style: pastry, caramel, cream, cocoa, almond or sugar. It is comforting and easy to understand, but it should be chosen carefully if you want an everyday scent.

It works best in autumn, winter and evenings. In summer or in close office settings, it can feel too present, especially when paired with praline, honey or very sweet fruits.

## Ambery vanilla

Ambery vanilla is warmer and rounder. It often appears with benzoin, labdanum, resins and musks. Compared with gourmand vanilla, it feels less like dessert and more polished.

This style is useful if you want a long-lasting fragrance without making sweetness the whole story.

## Woody or spicy vanilla

When vanilla meets sandalwood, cedar, patchouli, pepper, cardamom or tobacco, the result becomes drier and more mature. This direction is ideal if you enjoy warmth but dislike sugary perfumes.

Woody vanilla is often more versatile in unisex and masculine fragrances. The sweetness remains, but structure and depth keep it balanced.

## Testing it properly

Vanilla changes a lot with body temperature. On some skin it becomes creamy; on other skin it turns dry or sugary. Do not judge it from the first ten minutes. Wait at least two hours and notice the base.

A simple test helps: if after two hours you only smell sugar, it may not be your vanilla. If woods, amber, musk or spice appear, the composition has more balance.

## When to wear it

For daytime, choose soft, musky or woody vanilla. For dates and evenings, amber, tobacco and gourmand vanilla can feel more expressive. The [Odora rankings](/en/top) are useful for finding related options by style, price and popularity.
`.trim(),
  },
  {
    slug: "profumi-estivi-freschi-agrumati",
    locale: "it",
    title: "Profumi estivi freschi: agrumi, muschi e note marine",
    excerpt:
      "Come scegliere un profumo estivo che resti piacevole anche con caldo, umidita e spazi chiusi.",
    tldr: [
      "Agrumi, muschi puliti, te e note marine sono i territori piu sicuri.",
      "Con il caldo evita scie troppo dolci, dense o resinose.",
      "Meglio riapplicare poco che partire con troppi spruzzi.",
    ],
    seoTitle: "Profumi estivi freschi: guida a note agrumate e marine",
    seoDescription:
      "Consigli per scegliere profumi estivi freschi, agrumati, muschiati e marini adatti al caldo e all'uso quotidiano.",
    tags: ["estate", "fresco", "agrumato"],
    publishedAt: dates[2],
    content: `
## Il profumo estivo deve respirare

Un buon profumo estivo non deve solo profumare di vacanza. Deve funzionare con caldo, sudore, umidita, mezzi pubblici, uffici e ristoranti. Per questo la parola chiave e leggerezza: una fragranza puo essere riconoscibile senza diventare invadente.

Nel [catalogo profumi](/it/profumi) puoi cercare note agrumate, marine, muschiate o aromatiche. Se vuoi una scorciatoia, prova il percorso fresco nel [Finder Odora](/it/trova-profumo).

## Agrumi: luminosi ma non eterni

Bergamotto, limone, mandarino, pompelmo e yuzu danno apertura, energia e pulizia. Il loro limite e la durata: spesso evaporano prima di altre note. Questo non e per forza un difetto. In estate una fragranza troppo persistente puo diventare pesante.

Per avere piu tenuta, cerca agrumi abbinati a muschi, vetiver, cedro o ambra chiara. Questi materiali sostengono la freschezza senza trasformarla in dolcezza.

## Note marine e acquatiche

Le note marine comunicano aria, sale, pelle pulita e acqua. Sono facili da indossare e spesso piacciono anche a chi non ama i profumi complessi. Il rischio e scegliere formule troppo sintetiche o metalliche.

Per evitarlo, cerca composizioni marine con agrumi naturali, lavanda, erbe aromatiche o legni asciutti. Il risultato sara piu elegante e meno "deodorante".

## Muschi puliti

I muschi bianchi sono tra gli alleati migliori dell'estate. Danno sensazione di pelle pulita, bucato, crema leggera e ordine. Sono perfetti per lavoro, viaggi e situazioni in cui vuoi profumare bene senza attirare troppa attenzione.

Un muschio estivo riuscito non deve essere piatto: puo avere una partenza agrumata, un cuore floreale trasparente o un fondo legnoso.

## Cosa evitare

Con temperature alte, fai attenzione a miele, pralina, vaniglia densa, oud molto scuro, incenso pesante e ambre troppo resinose. Non sono note vietate, ma richiedono dosaggio minimo e contesti serali.

La regola pratica: se una fragranza e gia molto intensa su cartoncino, sulla pelle al caldo sara ancora piu evidente. Meglio partire con uno o due spruzzi e riapplicare piu tardi.
`.trim(),
  },
  {
    slug: "profumi-estivi-freschi-agrumati",
    locale: "en",
    title: "Fresh summer fragrances: citrus, musk and marine notes",
    excerpt:
      "How to choose a summer fragrance that stays pleasant in heat, humidity and close spaces.",
    tldr: [
      "Citrus, clean musks, tea and marine notes are the safest summer territories.",
      "Avoid very sweet, dense or resinous trails in high heat.",
      "It is better to reapply lightly than to start with too many sprays.",
    ],
    seoTitle: "Fresh summer fragrances: citrus, musk and marine notes",
    seoDescription:
      "How to choose fresh summer fragrances with citrus, musk and marine notes for heat, daily wear and close spaces.",
    tags: ["summer", "fresh", "citrus"],
    publishedAt: dates[2],
    content: `
## A summer fragrance needs air

A good summer fragrance should do more than smell like vacation. It needs to work with heat, humidity, commuting, offices and restaurants. The key is lightness: a scent can be recognizable without becoming intrusive.

In the [Odora perfume catalog](/en/perfumes), look for citrus, marine, musky and aromatic notes. For a faster route, use the fresh direction in the [Odora Finder](/en/finder).

## Citrus: bright but not endless

Bergamot, lemon, mandarin, grapefruit and yuzu give energy, clarity and lift. Their limitation is longevity: they often evaporate faster than heavier notes. In summer, that can be a strength rather than a weakness.

For better staying power, look for citrus paired with musk, vetiver, cedar or light amber. These materials support freshness without turning it sugary.

## Marine and aquatic notes

Marine notes suggest air, salt, clean skin and water. They are easy to wear and often suit people who do not enjoy heavy perfumes. The risk is choosing something too synthetic or metallic.

To avoid that, look for marine compositions with natural citrus, lavender, herbs or dry woods. The result feels more polished and less like a generic shower gel.

## Clean musks

White musks are among the best summer materials. They suggest clean skin, fresh laundry and soft cream. They are excellent for work, travel and moments when you want to smell good without taking over the room.

A good summer musk does not have to be flat. It can include a citrus opening, a transparent floral heart or a light woody base.

## What to avoid

In high heat, be careful with honey, praline, dense vanilla, dark oud, heavy incense and resinous amber. They are not forbidden, but they require minimal dosing and better suit evenings.

The practical rule is simple: if a fragrance already feels loud on paper, it will be louder on warm skin. Start with one or two sprays and reapply later if needed.
`.trim(),
  },
  {
    slug: "profumi-da-ufficio-discreti-eleganti",
    locale: "it",
    title: "Profumi da ufficio: discreti, eleganti e non invasivi",
    excerpt:
      "Una guida per scegliere profumi da lavoro che comunichino cura personale senza disturbare colleghi e clienti.",
    tldr: [
      "Per l'ufficio funzionano muschi, agrumi morbidi, vetiver, lavanda e legni chiari.",
      "Evita scie molto dolci, oud intensi e proiezione eccessiva.",
      "La quantita conta quanto la fragranza: spesso bastano uno o due spruzzi.",
    ],
    seoTitle: "Profumi da ufficio: guida a fragranze discrete ed eleganti",
    seoDescription:
      "Come scegliere profumi da ufficio non invasivi: note consigliate, errori da evitare e regole di applicazione.",
    tags: ["ufficio", "elegante", "guida"],
    publishedAt: dates[3],
    content: `
## In ufficio il profumo deve avere misura

Un profumo da ufficio non deve impressionare tutti appena entri in una stanza. Deve comunicare pulizia, cura e presenza senza occupare lo spazio degli altri. La differenza tra elegante e invadente spesso e una questione di proiezione.

Puoi cercare fragranze adatte al quotidiano nel [catalogo Odora](/it/profumi), filtrando per famiglie fresche, aromatiche, muschiate e legnose.

## Le note piu sicure

Le note piu facili per il lavoro sono bergamotto, neroli, te, lavanda, vetiver, iris leggero, muschi bianchi, cedro e sandalo pulito. Sono materiali che suggeriscono ordine e professionalita senza risultare troppo sensuali o notturni.

Anche alcune rose pulite e alcuni fiori bianchi trasparenti possono funzionare bene, se non sono troppo dolci o narcotici.

## Cosa evitare

In ufficio e meglio usare prudenza con oud molto scuri, cuoio intenso, incenso pesante, zucchero, pralina, miele e tuberosa molto cremosa. Non sono note sbagliate in assoluto, ma in ambienti chiusi possono dominare.

Attenzione anche agli extrait molto potenti. Una fragranza elegante puo diventare fastidiosa se applicata come se fosse una colonia leggera.

## Dose e punti di applicazione

Per il lavoro, uno o due spruzzi sono spesso sufficienti. Polsi e petto sotto la camicia creano una scia piu controllata rispetto al collo. Se devi stare molte ore vicino ad altre persone, evita di spruzzare direttamente su sciarpe o giacche: il tessuto trattiene molto.

Una buona prova e questa: se una persona deve avvicinarsi per sentire il profumo, sei nella zona corretta. Se lo percepisce da metri di distanza per ore, probabilmente e troppo.

## Una firma personale, non una dichiarazione

Il profumo da ufficio ideale puo diventare una firma discreta. Non deve essere anonimo, ma deve lasciare spazio alla situazione. Se vuoi selezioni piu mirate per contesto, parti dal [Finder Odora](/it/trova-profumo) e scegli un profilo pulito, fresco o elegante.
`.trim(),
  },
  {
    slug: "profumi-da-ufficio-discreti-eleganti",
    locale: "en",
    title: "Office fragrances: discreet, elegant and non-invasive",
    excerpt:
      "A guide to choosing work fragrances that communicate care without disturbing colleagues or clients.",
    tldr: [
      "Office-friendly notes include musks, soft citrus, vetiver, lavender and light woods.",
      "Avoid very sweet trails, intense oud and excessive projection.",
      "Application matters as much as the scent: one or two sprays are often enough.",
    ],
    seoTitle: "Office fragrances: discreet and elegant work scents",
    seoDescription:
      "How to choose non-invasive office fragrances: recommended notes, common mistakes and application rules.",
    tags: ["office", "elegant", "guide"],
    publishedAt: dates[3],
    content: `
## Office fragrance is about restraint

An office fragrance should not announce itself before you do. It should suggest cleanliness, care and presence without taking over the room. The difference between elegant and intrusive is often projection.

You can search daily scents in the [Odora catalog](/en/perfumes), focusing on fresh, aromatic, musky and woody families.

## The safest notes

Bergamot, neroli, tea, lavender, vetiver, light iris, white musk, cedar and clean sandalwood are reliable choices for work. They feel polished and professional without becoming too sensual or evening-oriented.

Some clean roses and transparent white florals can also work, as long as they are not too sweet or narcotic.

## What to avoid

In offices, be careful with very dark oud, heavy leather, dense incense, sugar, praline, honey and creamy tuberose. These notes are not wrong, but they can dominate enclosed spaces.

Also watch extrait concentrations. An elegant fragrance can become annoying if applied like a light cologne.

## Application and placement

For work, one or two sprays are often enough. Wrists and chest under a shirt create a more controlled scent bubble than the neck. If you sit close to others, avoid spraying scarves or jackets directly because fabric holds scent for a long time.

A useful test: if someone needs to come closer to notice your fragrance, you are in the right range. If people smell it from several meters away for hours, it is probably too much.

## A personal signature, not a statement

The ideal office fragrance can become a subtle signature. It does not need to be boring, but it should leave room for the situation. For more targeted suggestions, start with the [Odora Finder](/en/finder) and choose a clean, fresh or elegant profile.
`.trim(),
  },
  {
    slug: "profumi-arabi-oud-ambra-rosa",
    locale: "it",
    title: "Profumi arabi: oud, ambra, rosa e spezie",
    excerpt:
      "Cosa distingue molte fragranze arabe e come scegliere oud, ambra e rosa senza puntare solo sull'intensita.",
    tldr: [
      "L'oud puo essere animale, legnoso, affumicato o levigato.",
      "Ambra e rosa rendono molte fragranze arabe piu calde e sensuali.",
      "La qualita si valuta dall'equilibrio, non solo dalla potenza.",
    ],
    seoTitle: "Profumi arabi: guida a oud, ambra, rosa e spezie",
    seoDescription:
      "Guida ai profumi arabi: come riconoscere oud, ambra, rosa e spezie e scegliere fragranze intense ma equilibrate.",
    tags: ["arabo", "oud", "orientale"],
    publishedAt: dates[4],
    content: `
## Perche i profumi arabi attirano cosi tanto

Negli ultimi anni i profumi arabi sono diventati molto cercati per intensita, rapporto qualita-prezzo e carattere. Ma non sono tutti uguali. Alcuni sono dolci e moderni, altri piu tradizionali, resinosi, speziati o centrati sull'oud.

Su Odora puoi esplorare le fragranze per stile dal [catalogo profumi](/it/profumi) e confrontarle con alternative simili nelle [classifiche](/it/classifiche).

## Oud: non una sola nota

L'oud puo avere molte sfumature. In alcune composizioni e scuro, animale e affumicato. In altre e legnoso, secco, quasi cuoiato. Nelle interpretazioni piu moderne viene spesso addolcito con vaniglia, ambra o frutti.

Se sei all'inizio, cerca oud bilanciati da rosa, muschio o legni puliti. Gli oud piu estremi sono affascinanti, ma non sempre facili da indossare.

## Ambra e resine

Ambra, benzoino, labdano e resine danno calore e profondita. Sono materiali che rendono un profumo persistente e avvolgente. Il rischio e la pesantezza: se la base e troppo densa, la fragranza puo diventare faticosa dopo qualche ora.

Una buona ambra deve avere aria. Spezie, agrumi o fiori possono aprire la composizione e impedire che sembri piatta.

## Rosa e spezie

La rosa nei profumi arabi non e sempre romantica o delicata. Spesso e scura, vellutata, speziata, abbinata a zafferano, pepe, cannella o oud. Questa combinazione crea un profilo ricco e riconoscibile.

Per il giorno scegli rose piu pulite o muschiate. Per la sera puoi osare con versioni piu resinose e speziate.

## Come scegliere bene

Non valutare un profumo arabo solo dalla durata. La vera qualita e equilibrio: apertura piacevole, evoluzione chiara, fondo persistente ma non soffocante. Provalo su pelle e aspetta almeno tre ore.

Se vuoi partire da preferenze semplici, usa il [Finder Odora](/it/trova-profumo) indicando intensita alta, note ambrate o legnose e uso serale.
`.trim(),
  },
  {
    slug: "profumi-arabi-oud-ambra-rosa",
    locale: "en",
    title: "Arabic perfumes: oud, amber, rose and spices",
    excerpt:
      "What defines many Arabic fragrances and how to choose oud, amber and rose without focusing only on intensity.",
    tldr: [
      "Oud can be animalic, woody, smoky or polished.",
      "Amber and rose make many Arabic fragrances warmer and more sensual.",
      "Quality is about balance, not just power.",
    ],
    seoTitle: "Arabic perfumes: oud, amber, rose and spices guide",
    seoDescription:
      "A guide to Arabic perfumes: oud, amber, rose and spices, with practical tips for choosing intense but balanced fragrances.",
    tags: ["arabic", "oud", "oriental"],
    publishedAt: dates[4],
    content: `
## Why Arabic perfumes attract attention

Arabic perfumes have become popular for their intensity, value and character. But they are not all the same. Some are sweet and modern, while others are more traditional, resinous, spicy or centered on oud.

On Odora, you can explore fragrance styles through the [catalog](/en/perfumes) and compare related options in the [rankings](/en/top).

## Oud is not one single smell

Oud can take many directions. In some compositions it is dark, animalic and smoky. In others it is woody, dry and almost leathery. In modern interpretations it is often softened with vanilla, amber or fruit.

If you are new to oud, look for versions balanced by rose, musk or clean woods. Extreme oud can be fascinating, but it is not always easy to wear.

## Amber and resins

Amber, benzoin, labdanum and resins give warmth and depth. They help a fragrance feel enveloping and long-lasting. The risk is heaviness: if the base is too dense, the scent can become tiring after a few hours.

A good amber accord needs air. Spices, citrus or florals can open the composition and keep it from feeling flat.

## Rose and spices

Rose in Arabic perfumery is not always delicate or romantic. It is often dark, velvety and spicy, paired with saffron, pepper, cinnamon or oud. This creates a rich and recognizable profile.

For daytime, choose cleaner or muskier roses. For evenings, resinous and spicy versions can feel more expressive.

## How to choose well

Do not judge an Arabic perfume only by longevity. Real quality is balance: a pleasant opening, clear development and a persistent base that does not suffocate. Test it on skin and wait at least three hours.

If you want a simple starting point, use the [Odora Finder](/en/finder) and select higher intensity, ambery or woody notes and evening use.
`.trim(),
  },
  {
    slug: "come-far-durare-profumo-piu-a-lungo",
    locale: "it",
    title: "Come far durare il profumo piu a lungo sulla pelle",
    excerpt:
      "Applicazione, idratazione, punti giusti e conservazione: le regole pratiche per migliorare la durata del profumo.",
    tldr: [
      "La pelle idratata trattiene meglio le molecole profumate.",
      "Non strofinare i polsi: altera l'apertura e disperde il profumo.",
      "Calore, luce e aria rovinano le fragranze nel tempo.",
    ],
    seoTitle: "Come far durare il profumo piu a lungo: guida pratica",
    seoDescription:
      "Consigli pratici per far durare il profumo piu a lungo su pelle e vestiti: applicazione, idratazione e conservazione.",
    tags: ["guida", "applicazione", "consigli"],
    publishedAt: dates[5],
    content: `
## La durata non dipende solo dal profumo

Quando un profumo dura poco, non sempre il problema e la fragranza. Contano concentrazione, famiglia olfattiva, tipo di pelle, clima, dose e conservazione. Agrumi e note fresche evaporano piu velocemente; ambre, legni e muschi restano piu a lungo.

Per confrontare profumi per stile e intensita puoi partire dal [catalogo Odora](/it/profumi), ma ci sono abitudini che migliorano la resa di quasi ogni fragranza.

## Idrata la pelle

La pelle secca trattiene meno il profumo. Applicare una crema neutra prima della fragranza puo aumentare la percezione e la durata. Non serve usare prodotti molto profumati: anzi, una crema senza odore evita conflitti con la composizione.

Anche una piccola quantita di vaselina cosmetica sui punti di applicazione puo aiutare, ma va usata con misura.

## Scegli i punti giusti

Polsi, collo, petto e interno gomiti sono zone classiche perche leggermente piu calde. Il calore aiuta la diffusione. Se vuoi una scia piu discreta, spruzza sul petto sotto i vestiti. Se vuoi piu presenza, usa collo e nuca.

Evita di strofinare i polsi dopo l'applicazione. Lo sfregamento non "attiva" il profumo: lo scalda e lo disperde, alterando soprattutto le note di testa.

## Vestiti: si, ma con attenzione

I tessuti trattengono molto bene le fragranze, ma possono macchiarsi. Spruzza da distanza e fai attenzione a seta, pelle, capi chiari e materiali delicati. Sciarpe e cappotti possono conservare il profumo per giorni.

Questa tecnica e utile con fragranze leggere, ma rischiosa con profumi molto intensi: potresti stancarti prima che il tessuto smetta di profumare.

## Conservazione

Luce, calore e aria rovinano il profumo. Evita bagno, davanzali e auto. Meglio un armadio fresco, asciutto e buio. Chiudi sempre bene il tappo: l'ossidazione cambia colore e odore nel tempo.

Se dopo mesi un profumo sembra piu alcolico, acido o piatto, potrebbe essere stato conservato male. Una buona cura della bottiglia e parte della durata.
`.trim(),
  },
  {
    slug: "come-far-durare-profumo-piu-a-lungo",
    locale: "en",
    title: "How to make your fragrance last longer on skin",
    excerpt:
      "Application, hydration, placement and storage: practical rules to improve fragrance longevity.",
    tldr: [
      "Moisturized skin holds fragrance molecules better.",
      "Do not rub wrists together: it disrupts the opening and disperses scent.",
      "Heat, light and air damage fragrances over time.",
    ],
    seoTitle: "How to make perfume last longer: practical guide",
    seoDescription:
      "Practical tips to make perfume last longer on skin and clothes: application, hydration, placement and storage.",
    tags: ["guide", "application", "tips"],
    publishedAt: dates[5],
    content: `
## Longevity is not only about the perfume

When a fragrance disappears quickly, the scent itself is not always the only reason. Concentration, fragrance family, skin type, weather, dosage and storage all matter. Citrus and fresh notes evaporate faster; amber, woods and musks tend to last longer.

You can compare fragrances by style and intensity in the [Odora catalog](/en/perfumes), but a few habits improve the performance of almost any scent.

## Moisturize your skin

Dry skin holds fragrance less effectively. Applying an unscented moisturizer before perfume can improve both perception and longevity. A neutral cream is best because it does not conflict with the fragrance.

A tiny amount of cosmetic petrolatum on pulse points can also help, but use it sparingly.

## Choose the right spots

Wrists, neck, chest and inner elbows are classic application points because they are slightly warmer. Heat helps diffusion. If you want a more discreet scent bubble, spray the chest under clothing. If you want more presence, use the neck or back of the neck.

Avoid rubbing wrists together after spraying. Rubbing does not activate perfume. It warms and disperses the opening, especially the top notes.

## Clothes can help, carefully

Fabric holds fragrance well, but it can stain. Spray from a distance and be careful with silk, leather, light clothing and delicate materials. Scarves and coats can keep scent for days.

This is helpful with light fragrances, but risky with intense perfumes. You may get tired of the scent before the fabric lets it go.

## Storage matters

Light, heat and air damage perfume. Avoid bathrooms, windowsills and cars. A cool, dry, dark cabinet is better. Always close the cap properly because oxidation changes color and smell over time.

If a fragrance becomes more alcoholic, sour or flat after a few months, storage may be the reason. Taking care of the bottle is part of making the scent last.
`.trim(),
  },
];

async function main() {
  for (const post of posts) {
    await prisma.blogPost.upsert({
      where: { slug_locale: { slug: post.slug, locale: post.locale } },
      create: {
        ...post,
        status: BlogPostStatus.PUBLISHED,
        coverImageUrl: null,
      },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        tldr: post.tldr,
        content: post.content,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        tags: post.tags,
        status: BlogPostStatus.PUBLISHED,
        publishedAt: post.publishedAt,
        coverImageUrl: null,
      },
    });
  }

  console.log(`[blog:seed] upserted ${posts.length} posts`);
}

main()
  .catch((error) => {
    console.error("[blog:seed] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
