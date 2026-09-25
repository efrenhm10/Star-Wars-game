// ── WORLDS — 25 political societies at 32 BBY ───────────────────────
//
// Each world follows one schema: government type, institutions, ratings
// (wealth, inequality, population, industry, military, infrastructure,
// influence, stability, environment — 1 to 5), industries, resources,
// cultural groups, political conflicts, Republic relationship, Separatist
// sentiment, problems, advantages, native species, canon facts, roles and
// the pork projects its senator can try to bring home.
//
// Ratings and percentages are game-design values derived from canon
// characteristics, not canon statistics. None of it is frozen: history
// changes these societies once the game begins.

function C(o) {
    return Object.assign({
        gov: "Representative democracy",
        legislature: "Elected planetary assembly",
        executive: "Elected first minister",
        senateTerm: 4, senateLimit: 2,
        execTerm: 4, execLimit: 2,
        amendment: "Difficult",
        legThreshold: 0.67, referendum: true, refThreshold: 0.6,
        courtReview: true, judicial: 70,
        militaryControl: "Civilian",
        elections: "District + planetary representation",
        stability: 70,
        recall: false, publicFinancing: false, emergency: false,
        monarchy: null, warPostpone: false
    }, o);
}

const SEN = (desc, extra = {}) => Object.assign({ title: "Senator", kind: "senator", desc }, extra);

// Planetary values derived from ratings, with per-world overrides.
function P(r, o = {}) {
    return Object.assign({
        housing: clamp(22 + r.wealth * 10 - r.inequality * 4),
        employment: clamp(28 + r.industry * 6 + r.wealth * 4),
        crime: clamp(8 + r.inequality * 7 + (5 - r.stability) * 6),
        healthcare: clamp(14 + r.wealth * 12),
        education: clamp(12 + r.wealth * 12),
        environment: clamp(r.environment * 18),
        infrastructure: clamp(8 + r.infrastructure * 17),
        inequality: clamp(8 + r.inequality * 16)
    }, o);
}

// pork: [name, cost in millions, planet effects, voter effects, headline]
const WORLDS = {

    coruscant: {
        name: "Coruscant", region: "core", difficulty: 5,
        tagline: "Political capital • Extremely influential • Extremely difficult",
        govType: "Galactic capital",
        institutions: ["Galactic Senate", "Office of the Supreme Chancellor", "Coruscant planetary administration", "Senate Bureau of Intelligence", "The Jedi Temple"],
        ratings: { wealth: 5, inequality: 5, population: 5, industry: 5, military: 5, infrastructure: 5, influence: 5, stability: 4, environment: 1 },
        industries: ["Government", "Finance", "Technology", "Services"],
        resources: ["None of its own — it imports everything"],
        culture: ["Upper-level elites", "Lower-level workers", "Underworld communities", "Every species in the galaxy"],
        conflicts: ["Upper levels vs lower levels", "Lobbyists vs reformers", "Bureaucracy vs results"],
        problems: ["Lower-level poverty", "Organised crime", "Corruption", "Housing"],
        advantages: ["Seat of galactic power", "Unmatched wealth", "Media and finance hub"],
        republic: 90, sep: 4, canonAlign: "republic",
        species: ["human", "zabrak", "twilek", "chagrian", "togruta"],
        facts: ["A planet-wide city and the Republic's capital", "Enormous disparities between the gleaming upper levels and the lightless lower levels"],
        traits: ["core", "finance", "urban"],
        const: C({ gov: "Galactic capital — Republic federal district", legislature: "Coruscant Metropolitan Assembly", executive: "Planetary administrator", senateLimit: 0, judicial: 80, publicFinancing: true, elections: "Level-by-level districts" }),
        groups: { urban: 5, elites: 3, business: 3, workers: 2, unions: 2, students: 2, youth: 2, rural: 0, farmers: 0, traditional: 0.3 },
        planet: P({ wealth: 5, inequality: 5, industry: 5, stability: 4, environment: 1, infrastructure: 5 }, { housing: 32 }),
        lean: { centralists: 3, corporatists: 3, reformers: 2, militarists: 1 },
        powers: ["Senators", "Ministers", "Corporations", "Lobbyists", "Journalists", "Judges", "Unions", "Military officials", "Planetary delegations"],
        intro: "You don't have to build a government. You have the opposite problem: too many people already have power.",
        roles: [
            SEN("Senator for the galactic capital. Billions of constituents, crushing lobbying, labyrinthine bureaucracy.", { influence: 42, funds: 7 }),
            { title: "Lower-Levels District Councillor", kind: "local", desc: "Represent the levels where sunlight is a rumour. Start at the bottom of the ladder.", term: 2, limit: 0 }
        ],
        pork: [
            ["Lower-Levels Housing Renewal", 180, { housing: 6, crime: -2 }, { urban: 6, workers: 3 }, "−12% housing shortage in the lower levels"],
            ["Level 1313 Security Program", 120, { crime: -7 }, { elders: 3, business: 3 }, "More patrols where the police never go"],
            ["Senate District Transit Upgrade", 450, { infrastructure: 5, employment: 2 }, { urban: 4, business: 3 }, "+tax revenue, +regional influence"],
            ["Galactic City University Expansion", 200, { education: 6 }, { students: 6, youth: 2 }, "Thousands of new places for lower-level students"]
        ]
    },

    alderaan: {
        name: "Alderaan", region: "core", difficulty: 2,
        tagline: "Diplomatic • Wealthy • Pacifist",
        govType: "Constitutional monarchy",
        institutions: ["The Crown (House Organa)", "High Council", "Viceroy", "Alderaanian Senate delegation"],
        ratings: { wealth: 5, inequality: 2, population: 4, industry: 2, military: 1, infrastructure: 4, influence: 5, stability: 5, environment: 5 },
        industries: ["Culture & the arts", "Education", "Diplomatic services", "Agriculture"],
        resources: ["Fertile land", "Pristine wilderness"],
        culture: ["Noble houses", "Academics", "Pacifist societies", "Farming communities"],
        conflicts: ["Pacifism vs rearmament", "Noble privilege vs reform"],
        problems: ["Almost no military", "Dependent on Republic protection"],
        advantages: ["Diplomatic prestige", "Wealth", "Stability", "Education"],
        republic: 88, sep: 3, canonAlign: "republic",
        species: ["human"],
        facts: ["Ruled by Queen Breha Organa; her consort Bail Organa is Viceroy and Senator", "Renowned for pacifism, culture and humanitarian work"],
        traits: ["core", "pacifist"],
        const: C({ gov: "Constitutional monarchy — the Crown and the High Council", legislature: "High Council", executive: "First Minister of the High Council", monarchy: "constitutional", judicial: 85, legThreshold: 0.75, amendment: "Very difficult", stability: 88, publicFinancing: true, militaryControl: "Civilian (minimal forces)" }),
        groups: { elites: 2, business: 2, students: 2, urban: 2, environmentalists: 2, military: 0.3 },
        planet: P({ wealth: 5, inequality: 2, industry: 2, stability: 5, environment: 5, infrastructure: 4 }),
        lean: { reformers: 2, federalists: 2, centralists: 2, traditionalists: 2, militarists: 0.2 },
        powers: ["The Royal House", "High Council", "Universities", "Pacifist societies", "Diplomatic corps"],
        intro: "How do you remain a peaceful society when everyone else is militarising?",
        roles: [
            SEN("Senator and Viceroy's delegation. The conscience of the Senate — whether you like it or not."),
            { title: "Queen of Alderaan", kind: "monarch", desc: "Constitutional monarch. Enormous prestige, limited direct power: you appoint, assent, advise and represent.", canonHolder: "breha" },
            { title: "First Minister of the High Council", kind: "executive", desc: "Lead Alderaan's elected government under the Crown." }
        ],
        pork: [
            ["Aldera University Endowment", 150, { education: 6 }, { students: 6, elites: 2 }, "Alderaan's universities remain the galaxy's best"],
            ["Alderaanian Relief Corps", 200, {}, { religious: 4, students: 3 }, "Humanitarian ships under the Alderaanian flag", { diplomacy: 4 }],
            ["Planetary Defence Survey", 120, { crime: -1 }, { military: 5, elders: 2 }, "A first, cautious step towards defence"],
            ["Crevasse City Infrastructure", 220, { infrastructure: 5, employment: 2 }, { urban: 4, business: 3 }, "Modern transit for the old cities"]
        ]
    },

    naboo: {
        name: "Naboo", region: "mid", difficulty: 2,
        tagline: "Monarchy • Democracy • Tradition",
        govType: "Elective monarchy",
        institutions: ["Elected Queen", "Royal Advisory Council", "Governor", "Gungan High Council", "Royal Naboo Security Forces"],
        ratings: { wealth: 4, inequality: 2, population: 3, industry: 2, military: 2, infrastructure: 3, influence: 4, stability: 4, environment: 5 },
        industries: ["Agriculture", "Plasma export", "Art & architecture"],
        resources: ["Plasma", "Fertile lands", "Oceans and swamps"],
        culture: ["Naboo humans", "Gungans"],
        conflicts: ["Naboo vs Gungan representation", "Theed vs the countryside", "Dependence on Trade Federation shipping"],
        problems: ["Plasma exports controlled by the Trade Federation", "Weak defences"],
        advantages: ["Diplomatic skill", "Political sophistication", "A beautiful, fertile world"],
        republic: 75, sep: 5, canonAlign: "republic",
        species: ["human", "gungan"],
        facts: ["An elected Queen governs with the Royal Advisory Council; Sio Bibble serves as Governor", "Naboo humans and Gungans coexist uneasily; Boss Nass leads the Gungan High Council"],
        traits: ["monarchy", "farming"],
        const: C({ gov: "Elective monarchy with representative institutions", legislature: "Royal Advisory Council + elected assembly", executive: "Elected Queen + Governor", monarchy: "elective", judicial: 75, stability: 80 }),
        groups: { traditional: 2, rural: 2, farmers: 1.5, religious: 1.5, youth: 1.5, elites: 1 },
        planet: P({ wealth: 4, inequality: 2, industry: 2, stability: 4, environment: 5, infrastructure: 3 }),
        lean: { traditionalists: 3, federalists: 2, reformers: 2, centralists: 1 },
        powers: ["The Crown", "Royal Advisory Council", "Gungan High Council", "Plasma exporters"],
        intro: "Two peoples, one planet, an elected crown — and the Trade Federation's warships about to arrive.",
        roles: [
            SEN("Represent Naboo in the Galactic Senate. Two years left in your term, 62% approval, limited influence, factions wanting your support.", { startLeft: 24, approval: 62, canonHolder: "palpatine_seat" }),
            { title: "Queen of Naboo", kind: "monarch", desc: "Elected head of state with real executive power. A fixed term, a two-term limit, and the whole weight of tradition.", canonHolder: "amidala" },
            { title: "Governor of Naboo", kind: "council", desc: "Run planetary administration under the Crown. You serve while the Royal Advisory Council trusts you.", canonHolder: "bibble" },
            { title: "Boss of the Gungan High Council", kind: "traditional", desc: "Lead the Gungans — in partnership with the Naboo, or against them.", canonHolder: "nass" },
            { title: "Opposition Leader", kind: "opposition", desc: "Unseat the government at the next election.", target: 1 }
        ],
        pork: [
            ["Theed Plasma Refinery Upgrade", 220, { employment: 4, infrastructure: 2 }, { workers: 4, business: 3 }, "Break the Trade Federation's grip on plasma"],
            ["Gungan–Naboo Integration Program", 90, { inequality: -2 }, { traditional: 5, youth: 2 }, "Shared schools and councils for both peoples"],
            ["Royal Naboo Security Modernisation", 160, { crime: -2 }, { military: 5, elders: 2 }, "Never again defenceless"],
            ["Lake Country Agricultural Grants", 110, { employment: 2 }, { farmers: 6, rural: 4 }, "Keep the farms that feed the planet"]
        ]
    },

    corellia: {
        name: "Corellia", region: "core", difficulty: 3,
        tagline: "Industrial • Populous • Labour politics",
        govType: "Constitutional republic (elected Diktat)",
        institutions: ["Diktat", "Corellian Assembly", "Corellian Engineering Corporation board", "CorSec"],
        ratings: { wealth: 5, inequality: 3, population: 4, industry: 5, military: 3, infrastructure: 5, influence: 4, stability: 4, environment: 2 },
        industries: ["Shipbuilding", "Heavy industry", "Trade"],
        resources: ["Shipyards", "Skilled labour"],
        culture: ["Corellian humans", "Selonians", "Drall", "Shipyard workers"],
        conflicts: ["Unions vs the shipbuilders", "Isolationism vs Republic duty"],
        problems: ["Labour unrest", "Smuggling", "Corporate capture"],
        advantages: ["Industrial might", "Shipbuilding", "Fierce independence"],
        republic: 60, sep: 14, canonAlign: "republic",
        species: ["human"],
        facts: ["Famous for its shipyards and the Corellian Engineering Corporation", "Senator Garm Bel Iblis speaks for Corellia's independent streak"],
        traits: ["core", "industry", "arms"],
        const: C({ gov: "Constitutional republic under an elected Diktat", executive: "Diktat", execLimit: 3, judicial: 60 }),
        groups: { workers: 4, unions: 4, business: 2, urban: 2, veterans: 1.5 },
        planet: P({ wealth: 5, inequality: 3, industry: 5, stability: 4, environment: 2, infrastructure: 5 }, { housing: 48 }),
        lean: { reformers: 3, corporatists: 3, federalists: 2, militarists: 1 },
        powers: ["Shipyard unions", "The shipbuilding conglomerates", "Smuggler networks", "CorSec"],
        intro: "Shipyards, strikes, and a population that trusts its unions more than its politicians.",
        roles: [
            SEN("Represent the galaxy's great shipbuilding world.", { canonHolder: "belIblis" }),
            { title: "Diktat of Corellia", kind: "executive", desc: "The elected executive. Corporations fund you; unions can stop you." },
            { title: "Mayor of Coronet City", kind: "local", desc: "Run the capital's city hall and climb from there.", term: 3, limit: 0, rung: 1 }
        ],
        pork: [
            ["Corellia Shipyard Modernisation", 300, { employment: 4, infrastructure: 2 }, { workers: 5, unions: 2, business: 3 }, "+4,000 jobs, +8% industrial output"],
            ["Outer District Housing Program", 180, { housing: 6, inequality: -1 }, { workers: 3, urban: 4 }, "−12% housing shortage"],
            ["Coronet Planetary Hospital", 90, { healthcare: 5 }, { elders: 4, workers: 2 }, "+healthcare capacity"],
            ["Corellian Run Hyperlane Expansion", 450, { infrastructure: 4, employment: 3 }, { business: 5, elites: 2 }, "+trade, +tax revenue, +regional influence", { trade: 3 }]
        ]
    },

    chandrila: {
        name: "Chandrila", region: "core", difficulty: 2,
        tagline: "Democratic • Reform-minded • Politically sophisticated",
        govType: "Representative democracy",
        institutions: ["Parliament", "Prime Minister", "Hanna City Council", "Civic assemblies"],
        ratings: { wealth: 4, inequality: 2, population: 3, industry: 2, military: 1, infrastructure: 4, influence: 4, stability: 4, environment: 4 },
        industries: ["Agriculture", "Education", "Civil service"],
        resources: ["Farmland", "Temperate seas"],
        culture: ["Chandrilan humans", "Farming communities", "Academics"],
        conflicts: ["Reformers vs tradition", "Civil liberties vs security"],
        problems: ["Military weakness", "Idealism about to be tested by war"],
        advantages: ["Democratic culture", "High political participation", "Reputation for integrity"],
        republic: 82, sep: 4, canonAlign: "republic",
        species: ["human"],
        facts: ["A beautiful, tradition-rich Core world", "Home of Senator Mon Mothma"],
        traits: ["core", "farming"],
        const: C({ gov: "Parliamentary democracy", executive: "Prime Minister (requires confidence)", execLimit: 0, legThreshold: 0.6, amendment: "Moderate", recall: true, publicFinancing: true, elections: "Mixed-member proportional" }),
        groups: { students: 2, youth: 2, urban: 2, farmers: 1.5, environmentalists: 1.5 },
        planet: P({ wealth: 4, inequality: 2, industry: 2, stability: 4, environment: 4, infrastructure: 4 }),
        lean: { reformers: 3, federalists: 2, centralists: 2 },
        powers: ["Coalition partners", "Civic associations", "Farming cooperatives"],
        intro: "An electorate that punishes cynicism. Parliament can remove a leader who loses its confidence.",
        roles: [
            SEN("Represent the Republic's most reform-minded democracy.", { canonHolder: "mothma" }),
            { title: "Prime Minister of Chandrila", kind: "executive", desc: "Govern while parliament keeps its confidence in you." },
            { title: "Mayor of Hanna City", kind: "local", desc: "Run the capital's council.", term: 3, limit: 0, rung: 1 }
        ],
        pork: [
            ["Hanna Civic Institute", 80, { education: 3 }, { students: 4, youth: 3 }, "Training the next generation of public servants"],
            ["Chandrilan Farm Cooperative Fund", 140, { employment: 2 }, { farmers: 7, rural: 4 }, "Cheap credit for family farms"],
            ["Silver Sea Conservation", 70, { environment: 5 }, { environmentalists: 6 }, "Protect the Silver Sea"],
            ["Public Broadcasting Charter", 60, {}, { students: 3, urban: 2 }, "Independent public HoloNet"]
        ]
    },

    kuat: {
        name: "Kuat", region: "core", difficulty: 3,
        tagline: "Military industry • Ruling houses • Corporate power",
        govType: "Corporate-influenced planetary government",
        institutions: ["Kuat Drive Yards board", "The ruling Kuati houses", "Planetary Governor", "Orbital Security"],
        ratings: { wealth: 5, inequality: 4, population: 3, industry: 5, military: 5, infrastructure: 5, influence: 4, stability: 4, environment: 2 },
        industries: ["Warship construction", "Orbital drydocks", "Engineering"],
        resources: ["The orbital ring of drydocks"],
        culture: ["Kuati nobility", "Shipyard engineers", "Contract labourers"],
        conflicts: ["The houses vs the workers", "Republic contracts vs corporate independence"],
        problems: ["Corporate capture of government", "Labour tension", "Dependence on war"],
        advantages: ["The military-industrial complex itself", "Enormous wealth"],
        republic: 70, sep: 8, canonAlign: "republic",
        species: ["human"],
        facts: ["Kuat Drive Yards, led by the Kuat family, builds the Republic's warships", "What happens when the military-industrial complex becomes a political faction?"],
        traits: ["core", "industry", "arms", "corporate"],
        const: C({ gov: "Corporate-influenced government of the ruling houses", legislature: "Board-weighted assembly", executive: "Governor appointed by the ruling houses", judicial: 40, referendum: false, legThreshold: 0.6, militaryControl: "KDY security forces", amendment: "Corporate resistance" }),
        groups: { workers: 3, business: 3, elites: 3, military: 2, unions: 1 },
        planet: P({ wealth: 5, inequality: 4, industry: 5, stability: 4, environment: 2, infrastructure: 5 }),
        lean: { corporatists: 5, militarists: 3, centralists: 1, reformers: 0.5 },
        powers: ["KDY board", "The ruling houses", "Security contractors", "Naval procurement office"],
        intro: "The drive yards pay for everything — including the government.",
        roles: [
            SEN("Represent the shipyards that arm the Republic."),
            { title: "Governor of Kuat", kind: "council", desc: "Appointed by the ruling houses. Keep the board happy, or it will find someone who does." }
        ],
        pork: [
            ["Republic Star Destroyer Contract", 600, { employment: 7 }, { workers: 5, business: 6, military: 4 }, "The biggest contract in Republic history", { military: 4 }],
            ["Drydock Worker Safety Program", 80, { healthcare: 2 }, { workers: 6, unions: 6 }, "Fewer deaths in the orbital yards"],
            ["Kuati Engineering Academy", 150, { education: 5 }, { students: 5 }, "Train the next generation of shipwrights"],
            ["Orbital Ring Expansion", 380, { infrastructure: 5, employment: 3 }, { business: 5, elites: 3 }, "More docks, more contracts"]
        ]
    },

    fondor: {
        name: "Fondor", region: "core", difficulty: 3,
        tagline: "Shipbuilding • Strategic industry",
        govType: "Planetary government with powerful industrial interests",
        institutions: ["Planetary Administrator", "Shipyard guilds", "Orbital authority"],
        ratings: { wealth: 4, inequality: 3, population: 3, industry: 5, military: 5, infrastructure: 4, influence: 3, stability: 4, environment: 2 },
        industries: ["Shipbuilding", "Naval repair", "Armaments"],
        resources: ["Orbital shipyards"],
        culture: ["Shipwright guilds", "Orbital workers", "Naval families"],
        conflicts: ["How much of our economy should depend on war?", "Guilds vs corporations"],
        problems: ["Boom-and-bust war economy", "Industrial pollution"],
        advantages: ["Strategic shipyards", "Skilled workforce"],
        republic: 72, sep: 8, canonAlign: "republic",
        species: ["human"],
        facts: ["One of the Core's great shipbuilding centres, with a strategic, military identity"],
        traits: ["core", "industry", "arms"],
        const: C({ gov: "Guild-dominated planetary government", legislature: "Guild assembly", executive: "Planetary Administrator", judicial: 50, referendum: false, legThreshold: 0.6 }),
        groups: { workers: 4, unions: 3, business: 2, military: 1.5 },
        planet: P({ wealth: 4, inequality: 3, industry: 5, stability: 4, environment: 2, infrastructure: 4 }),
        lean: { corporatists: 3, militarists: 3, reformers: 2 },
        powers: ["Shipwright guilds", "Naval contracts office", "Orbital unions"],
        intro: "When the Republic builds a fleet, Fondor eats. When it doesn't, Fondor strikes.",
        roles: [
            SEN("Every appropriations bill is a jobs bill here."),
            { title: "Planetary Administrator", kind: "council", desc: "Chosen by the guild assembly. Keep orders flowing and the guilds united." }
        ],
        pork: [
            ["Naval Repair Yard Contract", 350, { employment: 6 }, { workers: 6, unions: 3 }, "+6,000 jobs", { military: 3 }],
            ["Orbital Pollution Clean-up", 120, { environment: 6, healthcare: 2 }, { environmentalists: 6, elders: 2 }, "Clear the orbital haze"],
            ["Guild Pension Fund", 100, {}, { unions: 6, elders: 4 }, "Security for retired shipwrights"],
            ["Fondor Civilian Shipyard", 250, { employment: 4 }, { business: 5, workers: 3 }, "Peacetime work for wartime yards"]
        ]
    },

    moncala: {
        name: "Mon Cala", region: "outer", difficulty: 4,
        tagline: "Monarchy • Two peoples • Naval power",
        govType: "Monarchy with a representative council",
        institutions: ["The King of Mon Cala", "Calamari Council", "Quarren Isolation League", "Mon Cala Mercantile Fleet"],
        ratings: { wealth: 4, inequality: 3, population: 4, industry: 4, military: 4, infrastructure: 3, influence: 4, stability: 3, environment: 5 },
        industries: ["Starship construction", "Aquaculture", "Mining"],
        resources: ["Oceans", "Seabed minerals"],
        culture: ["Mon Calamari", "Quarren"],
        conflicts: ["Mon Calamari vs Quarren", "Republic loyalty vs Separatist sympathy"],
        problems: ["Ethnic division", "Quarren resentment of Mon Calamari rule"],
        advantages: ["Naval shipbuilding", "Ocean resources", "Strategic location"],
        republic: 66, sep: 22, canonAlign: "republic",
        species: ["moncal", "quarren"],
        facts: ["King Yos Kolina rules with the Calamari Council; his heir is Prince Lee-Char", "In the Clone Wars, Separatists back a Quarren uprising and civil war follows"],
        traits: ["multispecies", "monarchy"],
        const: C({ gov: "Hereditary monarchy with the Calamari Council", legislature: "Calamari Council (Mon Calamari and Quarren seats)", executive: "The King", monarchy: "absolute", execLimit: 0, judicial: 50, referendum: false, legThreshold: 0.6, stability: 60, militaryControl: "Royal Mon Calamari Guard" }),
        groups: { workers: 2, traditional: 2, environmentalists: 2, urban: 1.5, military: 1 },
        planet: P({ wealth: 4, inequality: 3, industry: 4, stability: 3, environment: 5, infrastructure: 3 }),
        lean: { federalists: 3, traditionalists: 2, independence: 2, reformers: 1, centralists: 1 },
        powers: ["The Crown", "Calamari Council", "Quarren chieftains", "The shipwrights"],
        intro: "Your choices before the war decide whether Mon Cala stays united — or tears itself apart.",
        roles: [
            { title: "King of Mon Cala", kind: "hereditary", desc: "Hereditary monarch. You rule — but the Quarren never agreed to be ruled.", canonHolder: "kolina" },
            SEN("Represent both peoples in a Senate that barely knows either.", { canonHolder: "tills" }),
            { title: "Quarren Chieftain", kind: "traditional", desc: "Speak for the Quarren. Partnership, autonomy — or rebellion.", canonHolder: "nossor" },
            { title: "Calamari Council Member", kind: "local", desc: "Start in the council chamber and climb.", term: 3, limit: 0, rung: 1 }
        ],
        pork: [
            ["Dac Shipyard Expansion", 320, { employment: 5 }, { workers: 5, business: 3 }, "Mon Cal cruisers for the Republic", { military: 3 }],
            ["Quarren Deep-City Development", 140, { inequality: -3, housing: 3 }, { traditional: 5, workers: 2 }, "Invest in the Quarren depths"],
            ["Reef Conservation Trust", 90, { environment: 5 }, { environmentalists: 6 }, "Protect the reefs both peoples depend on"],
            ["Coral City Hospital", 110, { healthcare: 5 }, { elders: 4 }, "+healthcare capacity"]
        ]
    },

    mandalore: {
        name: "Mandalore", region: "outer", difficulty: 4,
        tagline: "Clans • Pacifists vs warriors • Contested authority",
        govType: "Duchy — authority contested by clans and factions",
        institutions: ["The Duchess", "Ruling Council", "Prime Minister", "Clan houses", "Death Watch (underground)"],
        ratings: { wealth: 3, inequality: 3, population: 3, industry: 3, military: 3, infrastructure: 3, influence: 3, stability: 2, environment: 1 },
        industries: ["Domed-city services", "Beskar mining", "Mercenary tradition"],
        resources: ["Beskar"],
        culture: ["New Mandalorians (pacifists)", "Warrior traditionalists", "The great clans"],
        conflicts: ["Pacifism vs the warrior heritage", "Neutrality vs taking sides", "Clan vs state"],
        problems: ["Black-market economy", "Death Watch terrorism", "Clan feuds"],
        advantages: ["Warrior heritage", "Leadership of the Council of Neutral Systems"],
        republic: 45, sep: 18, canonAlign: "neutral",
        species: ["human"],
        facts: ["Duchess Satine Kryze leads the pacifist New Mandalorian government", "Death Watch, under Pre Vizsla, wants the warrior ways restored"],
        traits: ["clans", "military"],
        const: C({ gov: "Duchy under the New Mandalorian government; clans retain power", legislature: "Ruling Council", executive: "Duchess + Prime Minister", judicial: 45, referendum: false, legThreshold: 0.6, militaryControl: "Clan militias", stability: 45, amendment: "Possible — dramatically", elections: "Council acclamation" }),
        groups: { military: 3, veterans: 3, traditional: 3, youth: 2, urban: 1.5, workers: 1.5 },
        planet: P({ wealth: 3, inequality: 3, industry: 3, stability: 2, environment: 1, infrastructure: 3 }),
        lean: { traditionalists: 3, militarists: 3, independence: 3, reformers: 1 },
        powers: ["The Duchess", "Great clans", "New Mandalorians", "Death Watch", "Black marketeers"],
        clans: ["Kryze", "Vizsla", "Saxon", "Wren", "Ordo", "Rook"],
        intro: "Your legitimacy may not come from an election at all. It comes from the clans — and from whoever holds the most blasters.",
        roles: [
            { title: "Duchess of Mandalore", kind: "executive", desc: "Lead the New Mandalorian government. The clans tolerate you — for now.", canonHolder: "satine" },
            { title: "Clan Leader", kind: "clan", desc: "Your power rests on the loyalty of the great clans, not the ballot." },
            SEN("Speak for a proud, divided, officially neutral people."),
            { title: "Death Watch Commander", kind: "movement", desc: "Restore the warrior ways. By any means.", canonHolder: "vizsla" }
        ],
        pork: [
            ["Sundari Dome Repairs", 150, { infrastructure: 5, housing: 2 }, { urban: 5 }, "Keep the domes standing"],
            ["Black-Market Crackdown Fund", 90, { crime: -6 }, { elders: 3, business: 3 }, "Choke the smugglers"],
            ["Mandalorian Veterans' Fund", 80, { healthcare: 2 }, { veterans: 7, military: 3 }, "Honour the warriors"],
            ["Beskar Mine Modernisation", 200, { employment: 4 }, { workers: 5 }, "Jobs in the mines"]
        ]
    },

    kashyyyk: {
        name: "Kashyyyk", region: "mid", difficulty: 3,
        tagline: "Wookiee sovereignty • Forests • Resource pressure",
        govType: "Traditional leadership — Council of Chieftains",
        institutions: ["Council of Chieftains", "Clan elders", "Wookiee Senate delegation"],
        ratings: { wealth: 3, inequality: 2, population: 3, industry: 3, military: 3, infrastructure: 2, influence: 3, stability: 4, environment: 5 },
        industries: ["Wroshyr timber", "Technology crafts", "Starship components"],
        resources: ["Wroshyr forests", "Rare woods"],
        culture: ["Wookiee clans", "Forest villages"],
        conflicts: ["Sovereignty vs Republic obligations", "Timber revenue vs preservation"],
        problems: ["Trandoshan slavers", "Offworld logging interests"],
        advantages: ["Natural resources", "Technological skill", "Formidable warriors"],
        republic: 75, sep: 6, canonAlign: "republic",
        species: ["wookiee"],
        facts: ["The heavily forested Wookiee homeworld, technologically sophisticated and strategically vital in the Clone Wars", "Later brutally occupied by the Empire, its people enslaved"],
        traits: ["indigenous", "forest"],
        const: C({ gov: "Council of Chieftains", legislature: "Council of Elders", executive: "Chieftain chosen by the council", execLimit: 0, judicial: 40, referendum: false, legThreshold: 0.75, amendment: "Very difficult", elections: "Council selection" }),
        groups: { traditional: 5, rural: 3, environmentalists: 3, elders: 2, business: 0.5, urban: 0.5 },
        planet: P({ wealth: 3, inequality: 2, industry: 3, stability: 4, environment: 5, infrastructure: 2 }),
        lean: { traditionalists: 4, federalists: 3, independence: 2 },
        powers: ["Council of Chieftains", "Clan elders", "Offworld logging interests", "Slaver remnants"],
        intro: "Do we allow outsiders to exploit our resources?",
        roles: [
            SEN("Defend Wookiee sovereignty in a Senate that sees timber and labour.", { canonHolder: "yarua" }),
            { title: "Chieftain of Kachirho", kind: "traditional", desc: "Chosen by the Council of Elders. Custom is patient but unforgiving.", canonHolder: "tarfful" },
            { title: "Sovereignty Movement Leader", kind: "movement", desc: "Push for full self-rule over Kashyyyk's forests." }
        ],
        pork: [
            ["Anti-Slaver Patrol Fleet", 180, { crime: -5 }, { traditional: 5, military: 3 }, "End the Trandoshan raids", { military: 1 }],
            ["Kachirho Tree-City Clinic", 80, { healthcare: 5 }, { elders: 5 }, "+healthcare capacity"],
            ["Wroshyr Protection Accord", 60, { environment: 4 }, { traditional: 6, environmentalists: 4 }, "The forests are not for sale"],
            ["Wookiee Technical Institute", 120, { education: 5, employment: 2 }, { youth: 4, students: 4 }, "Wookiee engineers for Wookiee industry"]
        ]
    },

    ryloth: {
        name: "Ryloth", region: "outer", difficulty: 4,
        tagline: "Twi'lek clans • Poverty • Caught between powers",
        govType: "Clan-based planetary leadership",
        institutions: ["Clan leaders", "Senator's delegation", "Local councils", "Freedom fighters (later)"],
        ratings: { wealth: 2, inequality: 4, population: 3, industry: 2, military: 2, infrastructure: 2, influence: 2, stability: 2, environment: 3 },
        industries: ["Ryll mining", "Agriculture", "Trade"],
        resources: ["Ryll", "Minerals"],
        culture: ["Twi'lek clans", "Rural villages", "Lessu city dwellers"],
        conflicts: ["Autonomy vs Republic protection", "Clan rivalry", "Slavery's long shadow"],
        problems: ["Poverty", "Slavery and the spice trade", "Strategic vulnerability"],
        advantages: ["Cultural identity", "Resilience", "Mineral wealth"],
        republic: 45, sep: 30, canonAlign: "republic",
        species: ["twilek"],
        facts: ["Senator Orn Free Taa represents Ryloth in the Senate", "Cham Syndulla will lead Ryloth's freedom fighters"],
        traits: ["frontier", "conflict"],
        const: C({ gov: "Clan-based planetary leadership", legislature: "Council of clans", executive: "Head of the Clan Council", judicial: 45, refThreshold: 0.55, legThreshold: 0.6, stability: 40 }),
        groups: { rural: 3, traditional: 3, veterans: 2, workers: 2, farmers: 2, elites: 0.5 },
        planet: P({ wealth: 2, inequality: 4, industry: 2, stability: 2, environment: 3, infrastructure: 2 }),
        lean: { independence: 3, federalists: 3, traditionalists: 2, reformers: 2 },
        powers: ["Clan elders", "Freedom fighters", "Spice cartels", "Slavers"],
        intro: "A frontier world repeatedly caught between larger powers. Republic neglect breeds Separatists.",
        roles: [
            SEN("Win money from a Senate that forgets the Outer Rim.", { canonHolder: "freeTaa" }),
            { title: "Head of the Clan Council", kind: "traditional", desc: "Lead Ryloth's clans — by consensus, when you can get it." },
            { title: "Freedom Movement Leader", kind: "movement", desc: "Your people want to be free — of slavers, of occupiers, perhaps of everyone.", canonHolder: "syndulla" }
        ],
        pork: [
            ["Lessu Reconstruction Fund", 200, { infrastructure: 5, housing: 3 }, { rural: 3, workers: 3 }, "Rebuild the capital"],
            ["Anti-Slavery Enforcement Office", 90, { crime: -5 }, { traditional: 5, youth: 3 }, "Hunt the slavers"],
            ["Ryll Mining Safety Program", 100, { employment: 2, healthcare: 2 }, { workers: 6 }, "Safer mines"],
            ["Clan Schools Initiative", 110, { education: 6 }, { youth: 5, traditional: 2 }, "Every child in school"]
        ]
    },

    tatooine: {
        name: "Tatooine", region: "outer", difficulty: 5,
        tagline: "Crime • Poverty • Water",
        govType: "Fragmented local governments under Hutt power",
        institutions: ["Settlement councils", "The Hutt cartels", "Moisture farmers' associations"],
        ratings: { wealth: 1, inequality: 5, population: 1, industry: 1, military: 1, infrastructure: 1, influence: 1, stability: 1, environment: 1 },
        industries: ["Moisture farming", "Smuggling", "Podracing", "Salvage"],
        resources: ["Almost none — water is the only wealth"],
        culture: ["Moisture farmers", "Spaceport traders", "Jawas", "Tusken clans"],
        conflicts: ["Who actually controls the territory?", "Farmers vs spaceports", "The Hutts vs everyone"],
        problems: ["Slavery", "Water scarcity", "No real government", "Crime"],
        advantages: ["Nobody expects anything of you", "Spaceport trade"],
        republic: 10, sep: 0, canonAlign: "hutt",
        species: ["human", "twilek", "jawa"],
        facts: ["An Outer Rim world in Hutt Space, outside the Republic", "Jabba the Hutt's cartel is the closest thing to a planetary government"],
        traits: ["frontier", "desert", "crime"],
        const: C({ gov: "Fragmented local governance under Hutt influence", legislature: "Settlement councils (no planetary body)", executive: "None", senateLimit: 0, execLimit: 0, judicial: 15, refThreshold: 0.5, legThreshold: 0.5, courtReview: false, militaryControl: "Contested (Hutt enforcers)", stability: 20, amendment: "Could create one", elections: "Settlement-level only" }),
        groups: { farmers: 4, rural: 4, workers: 2, elites: 0.5, business: 1.5, students: 0.3, urban: 0.6 },
        planet: P({ wealth: 1, inequality: 5, industry: 1, stability: 1, environment: 1, infrastructure: 1 }, { employment: 35, crime: 80 }),
        lean: { independence: 3, federalists: 3, corporatists: 1, traditionalists: 1 },
        powers: ["Hutt cartels", "Moisture farmers", "Merchants", "Criminal gangs", "Offworld corporations"],
        intro: "Can you build a functioning state where almost nobody has built one before? Your biggest opponent may not even hold office.",
        roles: [
            { title: "Settlement Representative", kind: "local", desc: "Represent one dusty settlement. There's no planetary government. You could build one.", term: 2, limit: 0 },
            { title: "Mos Espa Town Administrator", kind: "local", desc: "Run the spaceport town — under Jabba's watchful eye.", term: 3, limit: 0, rung: 1 },
            { title: "Moisture Farmers' Alliance Leader", kind: "movement", desc: "Organise the farmers against the Hutts, the droughts and the slavers." }
        ],
        pork: []
    },

    ordmantell: {
        name: "Ord Mantell", region: "mid", difficulty: 4,
        tagline: "Corruption • Crime • Trade",
        govType: "Governor-led planetary government",
        institutions: ["Planetary Governor", "Worlport authority", "Bribable courts", "Bounty guilds"],
        ratings: { wealth: 3, inequality: 4, population: 3, industry: 3, military: 2, infrastructure: 3, influence: 2, stability: 2, environment: 3 },
        industries: ["Trade", "Salvage", "Gambling", "Illicit services"],
        resources: ["Strategic hyperspace position"],
        culture: ["Every species passing through", "Spacers", "Scrap workers"],
        conflicts: ["Reformers vs the syndicates", "Who pays the governor?"],
        problems: ["Corruption", "Crime", "Captured institutions"],
        advantages: ["Trade position", "Diversity", "Adaptability"],
        republic: 50, sep: 15, canonAlign: "republic",
        species: ["human", "zabrak", "twilek", "rodian"],
        facts: ["Governed by planetary governors, with corruption and illicit activity deeply embedded in its politics"],
        traits: ["frontier", "crime", "trade"],
        const: C({ gov: "Governor-led planetary government, captured institutions", executive: "Governor", judicial: 25, stability: 35, execLimit: 0, elections: "Easily purchased" }),
        groups: { workers: 3, business: 2, urban: 2, elites: 1.5 },
        planet: P({ wealth: 3, inequality: 4, industry: 3, stability: 2, environment: 3, infrastructure: 3 }, { crime: 76 }),
        lean: { corporatists: 3, federalists: 2, independence: 1, reformers: 1 },
        powers: ["Port cartels", "Scrap barons", "Bribable judges", "Bounty guilds"],
        corruption: 70,
        intro: "Every institution works. They just work for whoever pays.",
        roles: [
            { title: "Governor of Ord Mantell", kind: "executive", desc: "Reformer, crook, populist or strongman — every choice changes who supports you." },
            SEN("Represent a world where votes are a commodity."),
            { title: "Port Magistrate", kind: "local", desc: "Run the Worlport — the only thing everyone agrees matters.", term: 3, limit: 0, rung: 1 }
        ],
        pork: [
            ["Worlport Anti-Smuggling Unit", 110, { crime: -6 }, { business: 3, elders: 3 }, "Customs officers who can't be bought (probably)"],
            ["Scrap Quarter Renewal", 140, { housing: 5 }, { workers: 5, urban: 3 }, "Homes where the junkyards were"],
            ["Independent Courts Fund", 70, { crime: -2 }, { students: 3 }, "Judges paid enough to refuse bribes", { }],
            ["Spaceport Expansion", 260, { employment: 4, infrastructure: 3 }, { business: 5 }, "+trade"]
        ]
    },

    bespin: {
        name: "Bespin", region: "outer", difficulty: 2,
        tagline: "Tibanna gas • Floating cities • One-resource economy",
        govType: "Corporate-chartered city administration",
        institutions: ["Baron Administrator", "Mining guild", "City charter"],
        ratings: { wealth: 4, inequality: 3, population: 2, industry: 4, military: 1, infrastructure: 4, influence: 2, stability: 3, environment: 4 },
        industries: ["Tibanna gas mining", "Luxury tourism"],
        resources: ["Tibanna gas"],
        culture: ["City residents", "Ugnaught workers", "Mining families"],
        conflicts: ["What happens when the price collapses?", "Corporate buyers vs city independence"],
        problems: ["Resource dependence", "Economic vulnerability"],
        advantages: ["Valuable gas", "Wealthy tourism"],
        republic: 50, sep: 12, canonAlign: "neutral",
        species: ["human", "ugnaught"],
        facts: ["Cloud cities float above a gas giant, their economy tied to tibanna gas"],
        traits: ["mining", "trade"],
        const: C({ gov: "Chartered city administration", executive: "Baron Administrator", judicial: 50, execLimit: 0 }),
        groups: { workers: 3, business: 3, urban: 3, elites: 1 },
        planet: P({ wealth: 4, inequality: 3, industry: 4, stability: 3, environment: 4, infrastructure: 4 }),
        lean: { corporatists: 3, federalists: 3 },
        powers: ["Gas mining corporations", "The city charter", "Tibanna buyers", "Ugnaught guilds"],
        intro: "One resource, one economy. What happens when a corporation buys the whole industry?",
        roles: [
            { title: "Baron Administrator", kind: "executive", desc: "Keep the city flying and the miners paid." },
            SEN("Every tibanna contract matters.")
        ],
        pork: [
            ["Tibanna Price Stabilisation Fund", 150, { employment: 3 }, { workers: 4, business: 4 }, "Protect against price collapses"],
            ["Ugnaught Workers' Housing", 90, { housing: 5 }, { workers: 5 }, "Decent homes below the city"],
            ["Repulsorlift Safety Program", 120, { infrastructure: 5 }, { urban: 4 }, "Keep the city in the sky"],
            ["Tourism Promotion Grant", 60, { employment: 2 }, { business: 4 }, "Visit Cloud City"]
        ]
    },

    geonosis: {
        name: "Geonosis", region: "outer", difficulty: 3,
        tagline: "Hive monarchy • Droid foundries • Separatist heartland",
        govType: "Hive monarchy (Archduke)",
        institutions: ["The Archduke", "Hive aristocracy", "Worker castes", "Droid foundries"],
        ratings: { wealth: 3, inequality: 5, population: 4, industry: 5, military: 5, infrastructure: 3, influence: 3, stability: 3, environment: 1 },
        industries: ["Droid manufacturing", "Weapons", "Mining"],
        resources: ["Ore", "Vast foundries"],
        culture: ["Aristocrat caste", "Warrior caste", "Drone workers"],
        conflicts: ["Caste privilege vs the drones", "Corporate clients vs sovereignty"],
        problems: ["Rigid castes", "Dependence on Separatist contracts"],
        advantages: ["Unmatched manufacturing", "Military power"],
        republic: 25, sep: 65, canonAlign: "separatist",
        species: ["geonosian"],
        facts: ["Archduke Poggle the Lesser rules the hives", "Birthplace of the Separatist droid army; the Clone Wars begin here"],
        traits: ["industry", "arms", "caste"],
        const: C({ gov: "Hive monarchy under the Archduke", legislature: "Hive council", executive: "Archduke", monarchy: "absolute", execLimit: 0, judicial: 20, referendum: false, legThreshold: 0.6, stability: 55, amendment: "Extremely difficult" }),
        groups: { workers: 6, elites: 2, military: 2, traditional: 1.5 },
        planet: P({ wealth: 3, inequality: 5, industry: 5, stability: 3, environment: 1, infrastructure: 3 }, { employment: 80 }),
        lean: { corporatists: 3, traditionalists: 3, militarists: 2, independence: 3 },
        powers: ["Hive aristocracy", "Worker castes", "Techno Union clients", "Foundry cartels"],
        intro: "Your world is about to build the droid army that starts a galactic war.",
        roles: [
            { title: "Archduke of Geonosis", kind: "hereditary", desc: "Absolute ruler of the hives. The foundries answer to you.", canonHolder: "poggle" },
            SEN("Speak for the foundries — and maybe the drones who work in them."),
            { title: "Drone Caste Agitator", kind: "movement", desc: "The drones build everything and own nothing. Change that." }
        ],
        pork: [
            ["Foundry Automation Grant", 200, { employment: 3 }, { business: 5, elites: 3 }, "More foundry output"],
            ["Drone Caste Relief", 80, { healthcare: 3, inequality: -2 }, { workers: 6 }, "Food and medicine for the drones"],
            ["Hive Infrastructure Program", 150, { infrastructure: 5 }, { workers: 3 }, "Stronger hives"],
            ["Arena Restoration", 60, {}, { traditional: 5 }, "Honour the old spectacles"]
        ]
    },

    kamino: {
        name: "Kamino", region: "outer", difficulty: 3,
        tagline: "Cloning • Secrecy • A war economy waiting to happen",
        govType: "Ruling council under a Prime Minister",
        institutions: ["Ruling Council", "Prime Minister", "Cloning facilities"],
        ratings: { wealth: 4, inequality: 3, population: 1, industry: 4, military: 5, infrastructure: 4, influence: 2, stability: 4, environment: 3 },
        industries: ["Cloning", "Genetic engineering"],
        resources: ["Oceans", "Scientific expertise"],
        culture: ["Kaminoans", "Laboratory castes"],
        conflicts: ["Profit vs ethics", "Secrecy vs transparency"],
        problems: ["Tiny population", "No political transparency", "Dependence on one client"],
        advantages: ["Unmatched science", "Military importance"],
        republic: 70, sep: 8, canonAlign: "republic",
        species: ["kaminoan"],
        facts: ["Prime Minister Lama Su leads the ruling council; Halle Burtoni is Kamino's senator", "Kamino builds the Grand Army of the Republic"],
        traits: ["biotech", "corporate"],
        const: C({ gov: "Ruling council under a Prime Minister", legislature: "Ruling Council", executive: "Prime Minister", execLimit: 0, judicial: 45, referendum: false, legThreshold: 0.6 }),
        groups: { elites: 3, business: 3, students: 2, religious: 0.5 },
        planet: P({ wealth: 4, inequality: 3, industry: 4, stability: 4, environment: 3, infrastructure: 4 }),
        lean: { corporatists: 3, centralists: 2, traditionalists: 1 },
        powers: ["Cloning laboratories", "Ruling council", "Ethics tribunals"],
        intro: "The Republic is about to order millions of clones from your world. Suddenly your economy depends on a war.",
        roles: [
            { title: "Prime Minister of Kamino", kind: "council", desc: "Lead the ruling council. The labs expect efficiency.", canonHolder: "lamaSu" },
            SEN("Defend (or restrain) the galaxy's cloning capital.", { canonHolder: "burtoni" })
        ],
        pork: [
            ["Tipoca City Storm Defences", 180, { infrastructure: 5 }, { urban: 4 }, "Keep the ocean out"],
            ["Genetics Research Institute", 220, { education: 4, employment: 3 }, { students: 5, business: 3 }, "Kamino's science for civilian use"],
            ["Bioethics Review Board", 50, {}, { religious: 5, students: 2 }, "Somebody should ask questions"],
            ["Ocean Harvest Program", 90, { employment: 2 }, { workers: 3 }, "Food from the sea"]
        ]
    },

    onderon: {
        name: "Onderon", region: "mid", difficulty: 4,
        tagline: "Monarchy • Civil conflict • Separatist pressure",
        govType: "Monarchy",
        institutions: ["The Crown", "Royal Guard", "Iziz city council", "Jungle partisans"],
        ratings: { wealth: 3, inequality: 3, population: 3, industry: 3, military: 4, infrastructure: 3, influence: 2, stability: 2, environment: 4 },
        industries: ["Agriculture", "Beast-riding traditions", "Trade"],
        resources: ["Jungle resources"],
        culture: ["Iziz city dwellers", "Rural highlanders", "Old noble houses"],
        conflicts: ["Monarchy vs opposition", "Republic vs Separatists", "City vs countryside", "Military vs civilian rule"],
        problems: ["Factionalism", "Separatist infiltration", "A walled capital"],
        advantages: ["Warrior tradition", "Strategic location"],
        republic: 40, sep: 38, canonAlign: "separatist",
        species: ["human"],
        facts: ["King Ramsis Dendup rules; Senator Mina Bonteri sympathises with the Separatists", "The Gerrera siblings, Steela and Saw, will lead a rebellion"],
        traits: ["monarchy", "conflict"],
        const: C({ gov: "Hereditary monarchy", legislature: "Royal court + noble council", executive: "The Monarch", monarchy: "absolute", execLimit: 0, judicial: 35, referendum: false, legThreshold: 0.6, militaryControl: "Royal Guard", stability: 45, amendment: "Very difficult" }),
        groups: { traditional: 2, rural: 2, military: 2, youth: 2, elites: 1.5 },
        planet: P({ wealth: 3, inequality: 3, industry: 3, stability: 2, environment: 4, infrastructure: 3 }),
        lean: { traditionalists: 4, militarists: 3, independence: 2, reformers: 1 },
        powers: ["The throne", "Royal Guard", "Noble houses", "Jungle partisans"],
        intro: "A city behind walls, a jungle full of partisans, and a crown only as strong as its guard.",
        roles: [
            { title: "King of Onderon", kind: "hereditary", desc: "Rule by birthright. Legitimacy can still run out.", canonHolder: "dendup" },
            SEN("Represent a monarchy torn between Republic and Separatists.", { canonHolder: "bonteri" }),
            { title: "Partisan Leader", kind: "movement", desc: "Lead the resistance in the jungle.", canonHolder: "steela" }
        ],
        pork: [
            ["Iziz Wall Modernisation", 150, { crime: -2, infrastructure: 3 }, { elders: 3, military: 3 }, "Stronger walls"],
            ["Highland Roads Program", 120, { infrastructure: 5 }, { rural: 6 }, "Connect the highlands"],
            ["Royal Guard Pension Fund", 70, {}, { veterans: 6, military: 3 }, "Loyalty rewarded"],
            ["Jungle Farmers' Credit", 90, { employment: 2 }, { farmers: 6 }, "Credit for the countryside"]
        ]
    },

    jedha: {
        name: "Jedha", region: "mid", difficulty: 3,
        tagline: "Holy city • Pilgrims • Kyber",
        govType: "Religious and civic authorities of the Holy City",
        institutions: ["Council of the Holy City", "The orders (Church of the Force, Guardians of the Whills)", "Pilgrim guilds"],
        ratings: { wealth: 3, inequality: 3, population: 2, industry: 2, military: 1, infrastructure: 2, influence: 3, stability: 3, environment: 2 },
        industries: ["Pilgrimage", "Kyber trade", "Archaeology"],
        resources: ["Kyber crystals"],
        culture: ["Many faiths", "Pilgrims from across the galaxy", "Temple orders"],
        conflicts: ["Faith vs commerce", "Competing religious orders", "Preservation vs kyber mining"],
        problems: ["Factionalism", "A moon every army covets"],
        advantages: ["Religious and cultural importance", "Tourism"],
        republic: 60, sep: 10, canonAlign: "republic",
        species: ["human", "zabrak", "togruta", "twilek"],
        facts: ["A cold moon whose Holy City draws pilgrims from across the galaxy", "Its kyber will one day draw the Empire"],
        traits: ["religious"],
        const: C({ gov: "Council of the Holy City", legislature: "Council of elders and orders", executive: "First Elder", execLimit: 0, judicial: 40, referendum: false, legThreshold: 0.67 }),
        groups: { religious: 6, traditional: 3, elders: 2, business: 1.5 },
        planet: P({ wealth: 3, inequality: 3, industry: 2, stability: 3, environment: 2, infrastructure: 2 }),
        lean: { traditionalists: 4, federalists: 2, independence: 2 },
        powers: ["Religious orders", "Pilgrim guilds", "Kyber traders"],
        intro: "Keep the faiths at peace — and the armies away from the kyber.",
        roles: [
            { title: "First Elder of the Holy City", kind: "traditional", desc: "Chosen by the council of orders." },
            SEN("Represent pilgrims, orders, and a moon every army covets.")
        ],
        pork: [
            ["Temple Restoration Grant", 90, {}, { religious: 7, traditional: 4 }, "Preserve the ancient temples"],
            ["Pilgrim Infrastructure", 140, { infrastructure: 5, employment: 2 }, { business: 4 }, "Room for a million pilgrims"],
            ["Holy City Water Works", 80, { healthcare: 3 }, { elders: 3 }, "Clean water in the old city"],
            ["Archaeological Survey", 50, { education: 3 }, { students: 3, religious: 2 }, "Study before the diggers arrive"]
        ]
    },

    mustafar: {
        name: "Mustafar", region: "outer", difficulty: 4,
        tagline: "Lava mining • Environmental devastation",
        govType: "Industrial administration",
        institutions: ["Mining commission", "Techno Union contractors", "Mustafarian clans"],
        ratings: { wealth: 2, inequality: 4, population: 2, industry: 5, military: 2, infrastructure: 3, influence: 1, stability: 3, environment: 1 },
        industries: ["Lava mining", "Rare metals"],
        resources: ["Rare minerals from the lava"],
        culture: ["Northern and southern Mustafarians", "Offworld mining overseers"],
        conflicts: ["Economic survival vs environmental destruction", "Native clans vs offworld companies"],
        problems: ["A planet being mined to death", "Poverty", "Pollution"],
        advantages: ["Rare metals", "Remote, defensible position"],
        republic: 35, sep: 45, canonAlign: "separatist",
        species: ["mustafarian", "human"],
        facts: ["A volcanic world whose mining industry serves the Techno Union — and later hides the Separatist Council"],
        traits: ["industry", "mining", "corporate"],
        const: C({ gov: "Mining commission", legislature: "Commission board", executive: "Mining Commissioner", judicial: 35, referendum: false, legThreshold: 0.6 }),
        groups: { workers: 5, traditional: 2, business: 2, environmentalists: 1 },
        planet: P({ wealth: 2, inequality: 4, industry: 5, stability: 3, environment: 1, infrastructure: 3 }, { environment: 5 }),
        lean: { corporatists: 4, independence: 2, traditionalists: 1, reformers: 1 },
        powers: ["Mining guilds", "Mustafarian clans", "Offworld ore buyers"],
        intro: "Economic survival depends on destroying the environment.",
        roles: [
            { title: "Mining Commissioner", kind: "council", desc: "Appointed by the mining board. Balance quotas against catastrophe." },
            { title: "Mustafarian Clan Speaker", kind: "traditional", desc: "Speak for the native Mustafarians against the companies." }
        ],
        pork: []
    },

    scarif: {
        name: "Scarif", region: "outer", difficulty: 3,
        tagline: "Military administration • Security • Secrecy",
        govType: "Republic military administration",
        institutions: ["Garrison command", "Archive bureau", "Island communities"],
        ratings: { wealth: 3, inequality: 2, population: 1, industry: 2, military: 5, infrastructure: 4, influence: 2, stability: 5, environment: 5 },
        industries: ["Military logistics", "Secure archives"],
        resources: ["Tropical islands", "A planetary shield (later)"],
        culture: ["Soldiers and their families", "Island natives"],
        conflicts: ["Security vs civilian freedom", "Secrecy vs oversight"],
        problems: ["Little civilian freedom", "Dependent on military budgets"],
        advantages: ["Security", "Strategic importance"],
        republic: 85, sep: 3, canonAlign: "republic",
        species: ["human"],
        facts: ["A tropical fortress world — and one day the Empire's archive citadel"],
        traits: ["military"],
        const: C({ gov: "Republic military administration", legislature: "Civil-military council", executive: "Garrison Governor", judicial: 30, referendum: false, legThreshold: 0.6, militaryControl: "Military", stability: 70 }),
        groups: { military: 6, veterans: 3, workers: 2, elders: 1 },
        planet: P({ wealth: 3, inequality: 2, industry: 2, stability: 5, environment: 5, infrastructure: 4 }),
        lean: { militarists: 5, centralists: 3 },
        powers: ["Garrison command", "Archive bureau", "Island communities"],
        intro: "The extreme security state: classified information, defence spending, surveillance — and the question of civilian oversight.",
        roles: [
            { title: "Garrison Governor", kind: "council", desc: "Appointed by high command. The military runs this world; you run the military's world." },
            SEN("Represent the Republic's fortress world.")
        ],
        pork: [
            ["Naval Logistics Base", 300, { employment: 5 }, { military: 5, workers: 3 }, "+jobs, +strategic value", { military: 3 }],
            ["Island Communities Fund", 80, { housing: 3 }, { traditional: 5 }, "Civilians matter too"],
            ["Military Hospital", 120, { healthcare: 6 }, { veterans: 6 }, "+healthcare capacity"],
            ["Civilian Oversight Board", 40, {}, { students: 3, youth: 2 }, "Somebody watching the watchers"]
        ]
    },

    sullust: {
        name: "Sullust", region: "outer", difficulty: 3,
        tagline: "Industry • Corporate state • Environmental collapse",
        govType: "Planetary government dominated by SoroSuub",
        institutions: ["SoroSuub Corporation", "Planetary council", "Tunnel unions"],
        ratings: { wealth: 3, inequality: 4, population: 3, industry: 5, military: 3, infrastructure: 3, influence: 3, stability: 3, environment: 1 },
        industries: ["Starship and electronics manufacturing"],
        resources: ["Volcanic minerals"],
        culture: ["Sullustans", "Tunnel-city workers", "Corporate managers"],
        conflicts: ["Industrialisation vs environmental collapse", "SoroSuub vs the government"],
        problems: ["Poisoned surface", "Corporate dominance"],
        advantages: ["Industrial capacity", "Strategic position"],
        republic: 40, sep: 40, canonAlign: "separatist",
        species: ["sullustan"],
        facts: ["SoroSuub dominates the economy and politics; Sian Tevv is Sullust's senator", "Sullust's corporate leadership leans towards the Separatists"],
        traits: ["industry", "corporate"],
        const: C({ gov: "Planetary government under SoroSuub's dominance", legislature: "Council of shareholders and districts", executive: "Planetary Chair", judicial: 40, refThreshold: 0.55 }),
        groups: { workers: 4, business: 3, elites: 2, urban: 2 },
        planet: P({ wealth: 3, inequality: 4, industry: 5, stability: 3, environment: 1, infrastructure: 3 }),
        lean: { corporatists: 5, reformers: 2, independence: 2, federalists: 1 },
        powers: ["SoroSuub board", "Tunnel unions", "Starship designers"],
        intro: "The corporation is the government. Some would like to reverse that.",
        roles: [
            SEN("Represent a planet that is, in most senses, a company.", { canonHolder: "tevv" }),
            { title: "Planetary Chair", kind: "executive", desc: "Elected — with the SoroSuub board watching every vote." }
        ],
        pork: [
            ["Surface Remediation Program", 200, { environment: 6, healthcare: 2 }, { environmentalists: 6, workers: 2 }, "Begin healing the surface"],
            ["Tunnel City Housing", 130, { housing: 5 }, { workers: 5, urban: 3 }, "Decent homes underground"],
            ["Sullustan Technical College", 100, { education: 5 }, { students: 5 }, "Engineers who don't work for SoroSuub"],
            ["Spaceport Upgrade", 180, { infrastructure: 5, employment: 2 }, { business: 5 }, "+trade"]
        ]
    },

    dathomir: {
        name: "Dathomir", region: "outer", difficulty: 4,
        tagline: "Clans • Spiritual authority • Isolation",
        govType: "Traditional clan-based leadership",
        institutions: ["Clan mothers", "The Nightsisters", "Nightbrother villages"],
        ratings: { wealth: 2, inequality: 3, population: 1, industry: 1, military: 4, infrastructure: 1, influence: 1, stability: 3, environment: 4 },
        industries: ["Subsistence", "Hunting"],
        resources: ["Wild jungles"],
        culture: ["Nightsisters", "Nightbrothers", "Isolated clans"],
        conflicts: ["Sisters vs brothers", "Isolation vs contact", "Old magic vs outsiders"],
        problems: ["Poverty", "Isolation", "Feared by the galaxy"],
        advantages: ["Military and spiritual strength", "Nobody dares interfere"],
        republic: 15, sep: 10, canonAlign: "neutral",
        species: ["dathomirian", "zabrak"],
        facts: ["Mother Talzin leads the Nightsisters", "Legitimacy comes from clans, tradition, spiritual authority and strength"],
        traits: ["indigenous", "clans"],
        const: C({ gov: "Traditional clan leadership", legislature: "Council of clan mothers", executive: "Clan Mother", execLimit: 0, judicial: 25, referendum: false, legThreshold: 0.8, amendment: "Extremely difficult", elections: "Customary", courtReview: false }),
        groups: { traditional: 6, rural: 3, religious: 2, youth: 1 },
        planet: P({ wealth: 2, inequality: 3, industry: 1, stability: 3, environment: 4, infrastructure: 1 }),
        lean: { traditionalists: 5, independence: 3 },
        powers: ["Clan mothers", "Customary law", "Nightbrother villages"],
        clans: ["Nightsisters", "Singing Mountain", "Frenzied River", "Nightbrothers"],
        intro: "This isn't a Republic democracy at all.",
        roles: [
            { title: "Clan Mother", kind: "clan", desc: "Hold authority by custom, alliance and strength.", canonHolder: "talzin" },
            { title: "Nightbrother Chieftain", kind: "clan", desc: "Lead the brothers — who have always served the sisters." }
        ],
        pork: []
    },

    hoth: {
        name: "Hoth", region: "outer", difficulty: 4,
        tagline: "Frontier • Ice • Military value",
        govType: "Minimal frontier administration",
        institutions: ["Republic frontier administrator", "Research outposts", "Settlers' council"],
        ratings: { wealth: 1, inequality: 2, population: 1, industry: 1, military: 3, infrastructure: 1, influence: 1, stability: 3, environment: 4 },
        industries: ["Research", "Mining surveys", "Waystation services"],
        resources: ["Ice", "Remote location"],
        culture: ["Researchers", "Settlers", "Garrison crews"],
        conflicts: ["How do we convince the Republic we're worth protecting?"],
        problems: ["Almost no infrastructure", "Tiny population", "Brutal climate"],
        advantages: ["Remoteness", "Strategic hiding place"],
        republic: 60, sep: 10, canonAlign: "republic",
        species: ["human"],
        facts: ["A frozen, remote world with almost no settled population"],
        traits: ["frontier", "military"],
        const: C({ gov: "Minimal frontier administration", legislature: "Settlers' council", executive: "Frontier Administrator", judicial: 30, referendum: true, refThreshold: 0.5, legThreshold: 0.5 }),
        groups: { rural: 3, workers: 2, military: 2, students: 1 },
        planet: P({ wealth: 1, inequality: 2, industry: 1, stability: 3, environment: 4, infrastructure: 1 }),
        lean: { federalists: 2, militarists: 2, centralists: 1 },
        powers: ["The administrator", "Research outposts", "Settlers"],
        intro: "A frontier survival government.",
        roles: [
            { title: "Frontier Administrator", kind: "council", desc: "Appointed by the Republic to run a frozen outpost world." },
            { title: "Settlers' Representative", kind: "local", desc: "Speak for the handful who chose to live here.", term: 2, limit: 0 }
        ],
        pork: []
    },

    manaan: {
        name: "Manaan", region: "mid", difficulty: 2,
        tagline: "Trade • Neutrality • Kolto",
        govType: "Selkath government — neutral planetary administration",
        institutions: ["Selkath Council", "Ahto City administration", "Kolto harvesters"],
        ratings: { wealth: 4, inequality: 2, population: 2, industry: 3, military: 2, infrastructure: 4, influence: 3, stability: 4, environment: 5 },
        industries: ["Kolto medicine", "Trade"],
        resources: ["Kolto", "Oceans"],
        culture: ["Selkath", "Offworld traders"],
        conflicts: ["Neutrality vs pressure from every side"],
        problems: ["Everyone wants your kolto", "Small military"],
        advantages: ["Valuable medicine", "Trade", "Neutral reputation"],
        republic: 50, sep: 12, canonAlign: "neutral",
        species: ["selkath"],
        facts: ["The Selkath govern from Ahto City and guard their kolto — and their neutrality — jealously"],
        traits: ["trade", "finance"],
        const: C({ gov: "Selkath council government", legislature: "Selkath Council", executive: "Council Speaker", execLimit: 0, judicial: 70, referendum: false, stability: 78 }),
        groups: { business: 3, workers: 2, elites: 2, traditional: 1.5, military: 0.4 },
        planet: P({ wealth: 4, inequality: 2, industry: 3, stability: 4, environment: 5, infrastructure: 4 }),
        lean: { corporatists: 3, federalists: 3, traditionalists: 1 },
        powers: ["Trade houses", "Kolto harvesters", "The neutrality council"],
        intro: "The Republic wants access. The Separatists want access. Corporations want access. You want everyone to leave you alone.",
        roles: [
            { title: "Speaker of the Selkath Council", kind: "council", desc: "Guard Manaan's neutrality and its kolto." },
            SEN("Protect Manaan's neutrality — and its exports.")
        ],
        pork: [
            ["Kolto Research Center", 150, { healthcare: 5, employment: 2 }, { business: 3, elders: 3 }, "Better medicine"],
            ["Ahto City Harbour Expansion", 180, { infrastructure: 5, employment: 3 }, { business: 5 }, "+trade"],
            ["Ocean Conservation", 60, { environment: 3 }, { environmentalists: 5, traditional: 3 }, "Protect the kolto beds"],
            ["Neutral Port Security", 90, { crime: -4 }, { business: 3 }, "Keep the peace in Ahto"]
        ]
    },

    cantonica: {
        name: "Cantonica", region: "outer", difficulty: 3,
        tagline: "Canto Bight • Finance • Extreme wealth",
        govType: "Corporate-planetary government",
        institutions: ["Planetary Chair", "Canto Bight city council", "Casino consortium", "Arms dealers' circle"],
        ratings: { wealth: 5, inequality: 5, population: 2, industry: 2, military: 2, infrastructure: 4, influence: 4, stability: 3, environment: 2 },
        industries: ["Gambling", "Finance", "Luxury", "Arms dealing"],
        resources: ["Money"],
        culture: ["The ultra-rich", "Casino workers", "Desert labourers"],
        conflicts: ["Who is the government actually working for?"],
        problems: ["Extreme inequality", "Arms profiteering", "Exploited labour"],
        advantages: ["Enormous wealth", "Financial influence"],
        republic: 55, sep: 10, canonAlign: "neutral",
        species: ["human", "twilek", "zabrak"],
        facts: ["A desert world whose city, Canto Bight, is a playground for the galaxy's wealthiest — many of them war profiteers"],
        traits: ["finance", "crime"],
        const: C({ gov: "Corporate-planetary government", executive: "Planetary Chair", judicial: 45, elections: "Property-weighted districts" }),
        groups: { elites: 4, business: 3, workers: 3, urban: 2 },
        planet: P({ wealth: 5, inequality: 5, industry: 2, stability: 3, environment: 2, infrastructure: 4 }),
        lean: { corporatists: 5, reformers: 1, federalists: 1 },
        powers: ["The casino consortium", "Arms dealers", "Financiers"],
        intro: "You can build enormous wealth while the people around it grow ever more alienated.",
        roles: [
            { title: "Mayor of Canto Bight", kind: "local", desc: "Run the galaxy's most glamorous city — and its forgotten back streets.", term: 3, limit: 0, rung: 1 },
            { title: "Planetary Chair", kind: "executive", desc: "Elected, with the consortium's money behind — or against — you." },
            SEN("Represent money itself.")
        ],
        pork: [
            ["Desert Workers' Housing", 120, { housing: 6, inequality: -2 }, { workers: 6 }, "Homes for the people who clean the casinos"],
            ["Canto Bight Casino Expansion", 250, { employment: 4 }, { business: 5, elites: 4 }, "More tables, more taxes"],
            ["Financial Regulation Office", 50, { crime: -3 }, { students: 3, workers: 2 }, "Follow the money"],
            ["Desert Water Project", 100, { healthcare: 3, infrastructure: 3 }, { rural: 4 }, "Water beyond the city"]
        ]
    }
};

// Worlds you can't play but which still have politics — and canon roles in history.
const BACKGROUND_WORLDS = {
    endor:          { name: "Endor",          region: "outer", traits: ["forest", "indigenous"], canonAlign: "neutral" },
    rodia:          { name: "Rodia",          region: "mid",   traits: ["frontier", "trade"], canonAlign: "republic" },
    neimoidia:      { name: "Neimoidia",      region: "mid",   traits: ["trade", "corporate"], canonAlign: "separatist" },
    pantora:        { name: "Pantora",        region: "outer", traits: [], canonAlign: "republic" },
    raxus:          { name: "Raxus",          region: "outer", traits: [], canonAlign: "separatist" },
    serenno:        { name: "Serenno",        region: "outer", traits: [], canonAlign: "separatist" },
    muunilinst:     { name: "Muunilinst",     region: "outer", traits: ["finance"], canonAlign: "separatist" },
    skako:          { name: "Skako",          region: "core",  traits: ["industry"], canonAlign: "separatist" },
    utapau:         { name: "Utapau",         region: "outer", traits: ["frontier"], canonAlign: "neutral" },
    christophsis:   { name: "Christophsis",   region: "outer", traits: ["trade"], canonAlign: "republic" },
    umbara:         { name: "Umbara",         region: "mid",   traits: [], canonAlign: "separatist" },
    kessel:         { name: "Kessel",         region: "outer", traits: ["mining", "crime"], canonAlign: "neutral" },
    lothal:         { name: "Lothal",         region: "outer", traits: ["frontier", "farming"], canonAlign: "republic" },
    felucia:        { name: "Felucia",        region: "outer", traits: ["frontier"], canonAlign: "separatist" },
    brentaal:       { name: "Brentaal",       region: "core",  traits: ["trade"], canonAlign: "republic" },
    scipio:         { name: "Scipio",         region: "mid",   traits: ["finance"], canonAlign: "neutral" },
    ghorman:        { name: "Ghorman",        region: "mid",   traits: ["industry"], canonAlign: "republic" }
};

const REGIONS = [
    { key: "core",  name: "🏛️ THE CORE" },
    { key: "mid",   name: "⚙️ INNER & MID RIM" },
    { key: "outer", name: "🌵 THE OUTER RIM" }
];
