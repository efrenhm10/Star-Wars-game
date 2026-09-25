# Galactic Senate

A political history of the galaxy. You start in **32 BBY** as one politician
in a working Republic: a senator, a queen, a governor, a clan leader, a mayor
or an agitator on one of 25 worlds. The Star Wars timeline moves forward
around you while your own career runs alongside it.

> You are not the protagonist of Star Wars. You are a protagonist in the Star
> Wars galaxy.

It takes inspiration from **Democracy 3** (the policy web, delayed effects,
voter groups, situations) and **The Political Process** (whipping
legislators, district campaigns).

## Running it

Open `index.html` in a browser. There's no build step and no server. The game
autosaves every month.

## Two timelines

**The canon backbone** happens on schedule:

- 32 BBY: trade route taxation, the blockade of Naboo, the vote of no
  confidence, Palpatine becomes Chancellor.
- Separatist crisis: Dooku, the Military Creation Act, the Emergency Powers
  Act.
- 22 BBY: Geonosis.
- The Clone Wars: Christophsis, Ryloth, Kamino, banking deregulation, the
  Sector Governance Decree, the Petition of the 2,000.
- 19 BBY: Order 66 and the Empire.
- Ghorman, the Rebellion, the dissolution of the Senate, Alderaan, Yavin,
  Endor, the New Republic.

**Adaptive events** start from canon but follow what you've done. Mon Cala
can stay united, go neutral, fall into civil war or join the Separatists,
depending on the coalition you built between the Mon Calamari and the Quarren.
Onderon's coup and Mandalore's fall work the same way.

**Your own history**, meaning your laws, appropriations, votes, betrayals and
allegiances, is written into a record like this one:

> *Served as Senator of Corellia, 32–18 BBY. Introduced 47 pieces of
> legislation. Secured 8.2 billion credits in Republic appropriations.
> Supported the Clone Army Authorization. Opposed the Emergency Powers Act.
> Signed the Petition of the 2,000. Arrested: 19 BBY.*

## Canon characters

Padmé Amidala, Palpatine, Bail and Breha Organa, Mon Mothma, Mas Amedda, Sio
Bibble, Boss Nass, Jar Jar Binks, Garm Bel Iblis, Satine Kryze, Pre Vizsla,
Bo-Katan, King Yos Kolina, Prince Lee-Char, Nossor Ri, Tikkes, Meena Tills,
Orn Free Taa, Cham Syndulla, Tarfful, Poggle the Lesser, Lama Su, Mina
Bonteri, the Gerreras, Riyo Chuchi, Onaconda Farr, Lott Dod, Nute Gunray,
Count Dooku, San Hill, Jabba, Mother Talzin, Onara Kuat, Tarkin, and Jedi
generals in wartime.

Each has an ideology, objectives, fears and a loyalty. Each remembers what
you did: *"I remember how you voted during the Naboo emergency."* They speak to
you according to your relationship and your world's allegiance. Your role
decides which of them come into your life. If you take a canon character's
office (Queen of Naboo, say), they're still in the galaxy under another
title.

## Your character

You choose from the species that actually live on your world: Human, Gungan,
Mon Calamari, Quarren, Wookiee, Twi'lek, Togruta, Zabrak, Chagrian, Jawa,
Rodian, Ugnaught, Geonosian, Kaminoan, Mustafarian, Sullustan, Dathomirian or
Selkath. You set skin or fur, eyes, hair, horns or lekku, markings (including
Naboo royal face paint), accessories, attire and age, with a live portrait.
Your heirs inherit your look.

## Every role is a different game

Each role defines its powers, responsibilities, budget, legislative,
appointment, military and diplomatic authority, term rules and constitutional
constraints. Each has its own interface theme.

- **Senate Desk (senator).**
  - *Bring it home:* each world has pork projects, like "Corellia Shipyard
    Modernisation, 300M credits, +4,000 jobs". You request them, find
    cosponsors (who want votes in return), lobby the Finance Committee, and
    pitch the Chancellor before the Month 10 appropriations markup.
  - *Committees:* Finance, Defense, Intelligence, Foreign Affairs, Judiciary,
    Commerce. You can win seats and chairs. A hostile chair can bottle up
    your bill; as chair, you can fast-track or bury bills.
  - Oversight hearings, coalitions by region, and foreign affairs.
- **Executive (governor, first minister).**
  - Projects with real financing: "Projected cost 2.4B, available 0.8B". You
    raise taxes, borrow, cut a program, request Republic funding, or bring in
    private investment.
  - Executive orders, cabinet appointments, public safety, economic
    development.
- **Royal Court (monarch).**
  - Monarchies differ. Alderaan is constitutional: you appoint the Prime
    Minister and grant or withhold assent. Naboo's queen is elected and
    governs. Mon Cala, Onderon and Geonosis are absolute and hereditary.
- **Chancellery.** Cabinet, legislative agenda, deploying the military,
  treaties, sanctions, recognising governments.
- **City Hall (mayor, settlement representative).**
  - You run city services.
  - "Declare war" is greyed out: *you do not possess this authority. Petition
    the planetary government.*
- **Movement, opposition, and the underground after 19 BBY.**

**Information depends on your role.** A governor sees "food reserves: 11 days".
A senator gets "the government reports a critical shortage". The Chancellor
and the Intelligence Committee get classified forecasts, which they can
share, hide or leak.

**Your philosophy changes your toolbox.** In the same crisis, a Corporatist can
hire private security, a Social Reformer can impose price controls, and a
Militarist can censor wartime news.

## War comes home

- **Planetary opinion.** Republic loyalists, Separatists and neutrals shift
  with hardship, corruption, blockades, occupation and aid. That feeds the
  "Which side are we on?" crisis, decided by the legislature, a referendum or
  a decree.
- **Attacks and blockades.** Food, medicine and fuel run down; there's
  occupation and liberation.
- **Petitioning the Senate for help.** Sponsors attach conditions ("support
  our tariff bill", "humanitarian aid only", "the Chancellor's office is
  concerned about the cost") while the attack continues. If the Senate says
  no, you choose: defend yourselves, negotiate, ask another world, join the
  Separatists, declare neutrality, or evacuate.
- **Wartime measures.** Conscription, censorship, martial law, war taxes and
  nationalisation. Once the war ends, people ask: *"When are you giving our
  rights back?"*
- **War elections.** Your opponent runs on your failures. You can postpone
  the election, if your constitution allows it; otherwise it's a
  constitutional crisis.
- **19 BBY: the Empire.** You can accept the Empire, resist politically, try
  to keep your world's autonomy, collaborate publicly while resisting
  privately, or join the underground.

## Code layout

| File | Contents |
|---|---|
| `js/worlds.js` | The 25-world database (schema above) and background worlds |
| `js/species.js` | Species, appearance options, procedural SVG portraits, names |
| `js/canon.js` | Canon characters: ideology, objectives, fears, loyalty, voice |
| `js/timeline.js` | The calendar, historical events, opinion and allegiance, war, historical scenes, the Empire |
| `js/canon_events.js` | Encounters with canon characters, petition sponsors, Imperial-era dossiers |
| `js/powers.js` | Role schema, committees, pork, projects, court, chancellery, city hall, underground |
| `js/data.js` | Constituencies, factions, institutions, media, donors |
| `js/engine.js` | Game state and `applyEffects()`, the ripple through every system |
| `js/policy.js` | Policy web, wartime measures, situations, budget, districts |
| `js/legislature.js` | Bills, blocs, lobbying, votes, committee gates |
| `js/politics.js` | Monthly simulation, elections, constitution, careers, dynasty |
| `js/events.js`, `js/scenes.js` | Dossiers and full-screen scenes |
| `js/ui.js`, `js/ui_world.js`, `js/main.js` | Interface and input |
