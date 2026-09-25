// ── UTILITIES ───────────────────────────────────────────────────

const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const chance = pct => Math.random() * 100 < pct;
const shuffle = arr => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]);
const sign = n => (n > 0 ? "+" : n < 0 ? "−" : "±");
const fmt = n => `${sign(n)}${Math.abs(Math.round(n * 10) / 10)}`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const bar = (v, cls = "") => `<div class="meter ${cls}"><span style="width:${clamp(v)}%"></span></div>`;


// ── THE PUBLIC — constituencies, not one approval number ────────

const GROUPS = {
    workers:           { name: "Workers",                 icon: "🔧" },
    farmers:           { name: "Farmers",                 icon: "🌾" },
    business:          { name: "Business owners",         icon: "💼" },
    elites:            { name: "Wealthy elites",          icon: "💎" },
    students:          { name: "Students",                icon: "📚" },
    veterans:          { name: "Veterans",                icon: "🎖️" },
    traditional:       { name: "Traditional communities", icon: "🪶" },
    religious:         { name: "Religious groups",        icon: "🕯️" },
    environmentalists: { name: "Environmentalists",       icon: "🌿" },
    military:          { name: "Military",                icon: "🛡️" },
    unions:            { name: "Unions",                  icon: "✊" },
    rural:             { name: "Rural communities",       icon: "🏜️" },
    urban:             { name: "Urban communities",       icon: "🏙️" },
    youth:             { name: "Youth",                   icon: "⚡" },
    elders:            { name: "Older voters",            icon: "🧓" }
};

// What each group actually cares about in the state of the planet.
// Negative weights mean "higher is worse" (crime, inequality).
const GROUP_NEEDS = {
    workers:           { employment: 1, inequality: -0.7, housing: 0.5 },
    farmers:           { infrastructure: 0.6, environment: 0.4, employment: 0.4 },
    business:          { employment: 0.6, infrastructure: 0.7, crime: -0.4 },
    elites:            { inequality: 0.3, crime: -0.5, infrastructure: 0.4 },
    students:          { education: 1, housing: 0.5 },
    veterans:          { healthcare: 0.8, employment: 0.5 },
    traditional:       { environment: 0.8, inequality: -0.3 },
    religious:         { crime: -0.5, inequality: -0.4 },
    environmentalists: { environment: 1.2 },
    military:          { infrastructure: 0.4, crime: -0.4 },
    unions:            { employment: 0.8, inequality: -0.8 },
    rural:             { infrastructure: 0.8, healthcare: 0.4 },
    urban:             { housing: 0.8, crime: -0.6, infrastructure: 0.4 },
    youth:             { education: 0.6, housing: 0.7, employment: 0.5 },
    elders:            { healthcare: 1, crime: -0.6 }
};

const PLANET_STATS = {
    housing:        { name: "Housing",        icon: "🏠" },
    employment:     { name: "Employment",     icon: "🏭" },
    crime:          { name: "Crime",          icon: "🚨", bad: true },
    healthcare:     { name: "Healthcare",     icon: "🏥" },
    education:      { name: "Education",      icon: "🎓" },
    environment:    { name: "Environment",    icon: "🌳" },
    infrastructure: { name: "Infrastructure", icon: "🛤️" },
    inequality:     { name: "Inequality",     icon: "⚖️", bad: true }
};

const GAL_STATS = {
    trade:     { name: "Galactic trade",     icon: "📦" },
    war:       { name: "War tension",        icon: "⚔️", bad: true },
    military:  { name: "Military spending",  icon: "🚀" },
    refugees:  { name: "Refugee pressure",   icon: "🧳", bad: true },
    diplomacy: { name: "Diplomatic stability", icon: "🕊️" }
};


// ── POLITICS — philosophies, institutions, the press ────────────

const FACTIONS = {
    centralists:     { name: "Centralists",           icon: "🏛️", seats: 70, motto: "The Republic needs a stronger central government." },
    federalists:     { name: "Federalists",           icon: "🗺️", seats: 62, motto: "Planetary governments must retain sovereignty." },
    corporatists:    { name: "Corporatists",          icon: "💰", seats: 66, motto: "Economic growth requires private enterprise." },
    reformers:       { name: "Social Reformers",      icon: "✊", seats: 58, motto: "The Republic has failed ordinary citizens." },
    militarists:     { name: "Militarists",           icon: "🛡️", seats: 52, motto: "Security must come before civil liberties." },
    independence:    { name: "Independence Movement", icon: "🔥", seats: 25, motto: "Our planet should govern itself." },
    traditionalists: { name: "Traditionalists",       icon: "📜", seats: 40, motto: "The old institutions are being destroyed." }
};

const SENATE_SIZE = 433;

const INSTITUTIONS = {
    courts:      { name: "Courts",                  icon: "⚖️" },
    legislature: { name: "Legislature",             icon: "🏛️" },
    civil:       { name: "Civil Service",           icon: "🗂️" },
    military:    { name: "Military",                icon: "🛡️" },
    planetary:   { name: "Planetary Government",    icon: "🪐" },
    local:       { name: "Local Governments",       icon: "🏘️" },
    agencies:    { name: "Independent Agencies",    icon: "🔍" },
    traditional: { name: "Traditional Authorities", icon: "🪶" }
};

const OUTLETS = [
    { key: "herald",   name: "Galactic Herald",       lean: "reformers",       audience: ["workers", "students", "youth", "urban"] },
    { key: "cbj",      name: "Core Business Journal", lean: "corporatists",    audience: ["business", "elites"] },
    { key: "sentinel", name: "HoloNet Sentinel",      lean: "militarists",     audience: ["military", "veterans", "elders"] },
    { key: "dispatch", name: "Outer Rim Dispatch",    lean: "federalists",     audience: ["rural", "farmers", "traditional"] },
    { key: "courier",  name: "Capital Courier",       lean: "centralists",     audience: ["urban", "elites", "elders"] },
    { key: "voice",    name: "Free Worlds Voice",     lean: "independence",    audience: ["youth", "traditional"] },
    { key: "chronicle",name: "Heritage Chronicle",    lean: "traditionalists", audience: ["religious", "elders", "rural"] }
];

const HEADLINES_POS = [
    "{name} delivers on {topic}",
    "A win on {topic}: {name} stands firm",
    "{name}'s gamble on {topic} pays off",
    "Quiet competence: {name} handles {topic}",
    "Praise for {name} over {topic}"
];

const HEADLINES_NEG = [
    "{name} under fire over {topic}",
    "Critics savage {name}'s {topic} decision",
    "{topic}: has {name} lost the plot?",
    "{name} betrays voters on {topic}",
    "Who does {name} really work for? Questions over {topic}"
];


// ── CAMPAIGN FINANCE — every credit comes with a relationship ────

const DONOR_SOURCES = {
    small:      { name: "Small donors",          icon: "🪙", amount: [0.4, 1.0], note: "Clean money, slowly raised. Builds public trust." },
    corporate:  { name: "Corporations",          icon: "🏢", amount: [2.0, 4.0], note: "Big money. They will ask for something later." },
    unions:     { name: "Unions",                icon: "✊", amount: [1.0, 2.0], note: "Organised labour expects you to stand with it." },
    wealthy:    { name: "Wealthy individuals",   icon: "💎", amount: [1.5, 3.0], note: "Discreet patrons. Some have things they'd rather nobody knew." },
    party:      { name: "Your party / faction",  icon: "🎗️", amount: [1.0, 2.0], note: "Requires standing with your own faction. Expects loyalty on votes." },
    grassroots: { name: "Grassroots fundraising",icon: "📣", amount: [0.3, 0.8], note: "Exhausting, but the young and idealistic love it." },
    grant:      { name: "Public campaign grant", icon: "🏛️", amount: [1.5, 1.5], note: "Only where the constitution provides public financing. Once per term." }
};

const CORPORATIONS = [
    { name: "Kuat Drive Consortium",    bill: "kuat_shipping" },
    { name: "Fondor Orbital Works",     bill: "military_approps" },
    { name: "Mustafar Minerals Trust",  bill: "mining_rights" },
    { name: "Capital Commerce League",  bill: "tariff_cut" },
    { name: "Outer Rim Water Holdings", bill: "mining_rights" },
    { name: "Bespin Gas Syndicate",     bill: "tariff_cut" },
    { name: "Sullust Fabrication Combine", bill: "kuat_shipping" }
];


// ── CONSTITUTIONS — every world inherits a political system ─────

function C(o) {
    return Object.assign({
        gov: "Representative democracy",
        legislature: "Elected planetary assembly",
        executive: "Elected first minister",
        senateTerm: 4,
        senateLimit: 2,
        execTerm: 4,
        execLimit: 2,
        amendment: "Difficult",
        legThreshold: 0.67,
        referendum: true,
        refThreshold: 0.6,
        courtReview: true,
        judicial: 70,
        militaryControl: "Civilian",
        elections: "District + planetary representation",
        stability: 70,
        recall: false,
        publicFinancing: false,
        emergency: false
    }, o);
}

const SEN = (desc, extra = {}) => Object.assign({ title: "Senator", kind: "senator", desc }, extra);

const WORLDS = {

    coruscant: {
        name: "Coruscant", region: "core", difficulty: 5,
        tagline: "Political capital • Extremely influential • Extremely difficult",
        traits: ["core", "finance", "urban"],
        const: C({ gov: "Capital district of the Republic", legislature: "Metropolitan assembly", executive: "Planetary mayor", senateLimit: 0, execLimit: 2, judicial: 80, publicFinancing: true, elections: "1,000-district proportional" }),
        groups: { urban: 5, elites: 3, business: 3, workers: 2, unions: 2, students: 2, youth: 2, rural: 0, farmers: 0, traditional: 0.3 },
        planet: { housing: 32, employment: 62, crime: 58, healthcare: 60, education: 70, environment: 18, infrastructure: 86, inequality: 78 },
        lean: { centralists: 3, corporatists: 3, reformers: 2, militarists: 1 },
        powers: ["Senators", "Ministers", "Corporations", "Lobbyists", "Journalists", "Judges", "Unions", "Military officials", "Planetary delegations"],
        intro: "You don't have to build a government. You have the opposite problem: there are too many people who already have power. Your power comes from coalition-building.",
        roles: [
            SEN("Senator for the Galactic Capital. Represents billions. Massive influence, crushing lobbying, labyrinthine bureaucracy.", { influence: 45, funds: 7 }),
            { title: "Underworks District Councillor", kind: "local", desc: "Represent the lower levels, where sunlight is a rumour. Start at the bottom of the career ladder.", term: 2, limit: 0 }
        ]
    },

    alderaan: {
        name: "Alderaan", region: "core", difficulty: 2,
        tagline: "Diplomatic • Wealthy • Pacifist",
        traits: ["core", "pacifist"],
        const: C({ gov: "Representative democracy", executive: "First Minister", judicial: 85, legThreshold: 0.75, amendment: "Very difficult", stability: 88, publicFinancing: true }),
        groups: { elites: 2, business: 2, students: 2, urban: 2, environmentalists: 2, military: 0.3 },
        planet: { housing: 68, employment: 72, crime: 18, healthcare: 80, education: 85, environment: 82, infrastructure: 76, inequality: 38 },
        lean: { reformers: 2, federalists: 2, centralists: 2, traditionalists: 2, militarists: 0.2 },
        powers: ["Royal house", "Diplomatic corps", "Universities", "Pacifist societies"],
        intro: "Highly institutional government. You'll spend your career building coalitions, passing legislation, and guarding public trust.",
        roles: [
            SEN("A four-year term, two-term limit, and a planet that expects its senator to be the conscience of the Senate."),
            { title: "First Minister", kind: "executive", desc: "Lead Alderaan's elected government. Pacifists, universities, and a demanding public." }
        ]
    },

    chandrila: {
        name: "Chandrila", region: "core", difficulty: 2,
        tagline: "Democratic • Reform-oriented • Politically sophisticated",
        traits: ["core"],
        const: C({ gov: "Parliamentary democracy", executive: "Prime Minister (requires confidence)", execLimit: 0, legThreshold: 0.6, amendment: "Moderate", recall: true, publicFinancing: true, elections: "Mixed-member proportional" }),
        groups: { students: 2, youth: 2, urban: 2, farmers: 1.5, environmentalists: 1.5 },
        planet: { housing: 60, employment: 68, crime: 22, healthcare: 75, education: 82, environment: 70, infrastructure: 70, inequality: 40 },
        lean: { reformers: 3, federalists: 2, centralists: 2 },
        powers: ["Coalition partners", "Civic associations", "Farming cooperatives"],
        intro: "A politically sophisticated electorate that punishes cynicism. Parliament can remove a leader who loses its confidence.",
        roles: [
            SEN("Represent the Republic's most reform-minded democracy."),
            { title: "Prime Minister", kind: "executive", desc: "Govern as long as parliament keeps its confidence in you. No term limit — but no guarantee either." }
        ]
    },

    naboo: {
        name: "Naboo", region: "core", difficulty: 2,
        tagline: "Monarchy • Democracy • Tradition",
        traits: ["core", "monarchy"],
        const: C({ gov: "Constitutional monarchy (elected monarch)", legislature: "Royal Advisory Council + elected assembly", executive: "Monarch + Government Ministry", elections: "District + planetary representation", judicial: 75, stability: 80 }),
        groups: { traditional: 2, rural: 2, farmers: 1.5, religious: 1.5, youth: 1.5, elites: 1 },
        planet: { housing: 64, employment: 66, crime: 20, healthcare: 70, education: 72, environment: 80, infrastructure: 62, inequality: 42 },
        lean: { traditionalists: 3, federalists: 2, reformers: 2, centralists: 1 },
        powers: ["The Crown", "Royal Advisory Council", "Gungan leadership", "Plasma exporters"],
        intro: "Two peoples, one planet, an elected crown and a jealous tradition of both monarchy and democracy.",
        roles: [
            SEN("Represents Naboo in the Galactic Senate. Two years left in your term, limited influence, several factions wanting your support.", { startLeft: 24, approval: 62 }),
            { title: "Queen", kind: "monarch", desc: "Elected head of state. A fixed term, a two-term limit, and the whole weight of tradition on your shoulders." },
            { title: "Governor", kind: "council", desc: "Appointed by the Crown to run planetary administration. You serve while the Royal Advisory Council trusts you." },
            { title: "Opposition Leader", kind: "opposition", desc: "You are trying to unseat the government. Win the next election and the palace is yours.", target: 1 }
        ]
    },

    corellia: {
        name: "Corellia", region: "core", difficulty: 3,
        tagline: "Industrial • Populous • Labor politics",
        traits: ["core", "industry", "arms"],
        const: C({ gov: "Representative democracy", executive: "Diktat (elected premier)", execLimit: 3, judicial: 60 }),
        groups: { workers: 4, unions: 4, business: 2, urban: 2, veterans: 1.5 },
        planet: { housing: 48, employment: 70, crime: 45, healthcare: 55, education: 58, environment: 35, infrastructure: 72, inequality: 58 },
        lean: { reformers: 3, corporatists: 3, federalists: 2, militarists: 1 },
        powers: ["Shipyard unions", "Shipbuilding conglomerates", "Smuggler networks", "Security forces"],
        intro: "Shipyards, strikes, and a population that trusts its unions more than its politicians.",
        roles: [
            SEN("Represent the galaxy's great shipbuilding world."),
            { title: "Coronet City Mayor", kind: "local", desc: "Run the capital's city hall and climb from there. Unions made you; they can unmake you.", term: 3, limit: 0, rung: 1 }
        ]
    },

    kuat: {
        name: "Kuat", region: "core", difficulty: 3,
        tagline: "Military industry • Corporate-influenced government",
        traits: ["core", "industry", "arms", "corporate"],
        const: C({ gov: "Corporate-influenced oligarchy", legislature: "Board-weighted assembly", executive: "Board-appointed Governor", judicial: 40, referendum: false, legThreshold: 0.6, militaryControl: "Corporate security", amendment: "Corporate resistance" }),
        groups: { workers: 3, business: 3, elites: 3, military: 2, unions: 1 },
        planet: { housing: 55, employment: 78, crime: 25, healthcare: 58, education: 60, environment: 30, infrastructure: 80, inequality: 70 },
        lean: { corporatists: 5, militarists: 3, centralists: 1, reformers: 0.5 },
        powers: ["Drive yard board", "Security contractors", "Engineering guilds", "Naval procurement office"],
        intro: "The drive yards pay for everything — including the government.",
        roles: [
            SEN("Represent the shipyards that arm the Republic."),
            { title: "Governor", kind: "council", desc: "Appointed by the corporate board. Keep the board happy, or it will find someone who does." }
        ]
    },

    moncala: {
        name: "Mon Cala", region: "mid", difficulty: 3,
        tagline: "Multi-species government • Ocean world",
        traits: ["multispecies"],
        const: C({ gov: "Multi-species representative government", legislature: "Joint species assembly", executive: "Speaker of the Assembly", judicial: 72, elections: "Species-weighted districts" }),
        groups: { workers: 2, traditional: 2, environmentalists: 2, urban: 1.5, military: 0.6 },
        planet: { housing: 58, employment: 60, crime: 28, healthcare: 66, education: 64, environment: 74, infrastructure: 60, inequality: 48 },
        lean: { federalists: 3, reformers: 2, traditionalists: 2, centralists: 1 },
        powers: ["Species councils", "Shipwrights", "Deep-sea communities"],
        intro: "Two peoples share one ocean and one constitution — and neither ever quite trusts the other with it.",
        roles: [
            SEN("Represent a multi-species world where every vote must satisfy two peoples."),
            { title: "Speaker of the Assembly", kind: "executive", desc: "Hold together a government of two peoples." }
        ]
    },

    onderon: {
        name: "Onderon", region: "mid", difficulty: 4,
        tagline: "Civil conflict • Monarchy",
        traits: ["monarchy", "conflict"],
        const: C({ gov: "Hereditary monarchy", legislature: "Royal court + noble council", executive: "Hereditary monarch", execLimit: 0, judicial: 35, referendum: false, legThreshold: 0.6, militaryControl: "Royal guard", stability: 45, amendment: "Very difficult" }),
        groups: { traditional: 2, rural: 2, military: 2, youth: 2, elites: 1.5 },
        planet: { housing: 45, employment: 50, crime: 48, healthcare: 45, education: 48, environment: 60, infrastructure: 45, inequality: 62 },
        lean: { traditionalists: 4, militarists: 3, independence: 2, reformers: 1 },
        powers: ["The throne", "Jungle insurgents", "Noble houses", "Royal guard"],
        intro: "A city behind walls, a jungle full of insurgents, and a crown that is only as strong as the guard around it.",
        roles: [
            SEN("Represent a monarchy on the edge of civil war."),
            { title: "Monarch", kind: "hereditary", desc: "Rule by birthright. No elections — but legitimacy can still run out." },
            { title: "Insurgent Leader", kind: "movement", desc: "Lead the resistance in the jungle. Your goal: force the crown to accept self-government." }
        ]
    },

    ryloth: {
        name: "Ryloth", region: "mid", difficulty: 4,
        tagline: "Post-conflict reconstruction",
        traits: ["conflict", "frontier"],
        const: C({ gov: "Transitional clan-council government", legislature: "Council of clans", executive: "Reconstruction Governor", judicial: 45, referendum: true, refThreshold: 0.55, legThreshold: 0.6, stability: 40 }),
        groups: { rural: 3, traditional: 3, veterans: 2, workers: 2, farmers: 2, elites: 0.5 },
        planet: { housing: 30, employment: 40, crime: 55, healthcare: 35, education: 38, environment: 50, infrastructure: 30, inequality: 64 },
        lean: { independence: 3, federalists: 3, traditionalists: 2, reformers: 2 },
        powers: ["Clan elders", "Freedom fighters", "Reconstruction contractors", "Slavers in retreat"],
        intro: "The war is over. Almost nothing is rebuilt, and everyone remembers who stayed and who fled.",
        roles: [
            SEN("Win reconstruction money from a Senate that has moved on."),
            { title: "Reconstruction Governor", kind: "executive", desc: "Rebuild a shattered world with borrowed money and scarce trust." },
            { title: "Freedom Movement Leader", kind: "movement", desc: "Your fighters won the war. Now they want a country." }
        ]
    },

    manaan: {
        name: "Manaan", region: "mid", difficulty: 2,
        tagline: "Trade • Neutrality • Resources",
        traits: ["trade", "finance"],
        const: C({ gov: "Neutral trading republic", executive: "Trade Consul", judicial: 70, stability: 78 }),
        groups: { business: 3, workers: 2, elites: 2, traditional: 1.5, military: 0.4 },
        planet: { housing: 60, employment: 70, crime: 25, healthcare: 65, education: 60, environment: 68, infrastructure: 66, inequality: 50 },
        lean: { corporatists: 3, federalists: 3, traditionalists: 1 },
        powers: ["Trade houses", "Medicinal exporters", "Neutrality council"],
        intro: "Everyone wants what Manaan sells. Staying neutral is a full-time job.",
        roles: [
            SEN("Protect Manaan's neutrality — and its exports."),
            { title: "Trade Consul", kind: "executive", desc: "Run a neutral trading republic that every side wants to pull into its orbit." }
        ]
    },

    fondor: {
        name: "Fondor", region: "mid", difficulty: 3,
        tagline: "Shipbuilding • Guild politics",
        traits: ["industry", "arms", "corporate"],
        const: C({ gov: "Guild republic", legislature: "Guild assembly", executive: "Shipyard Guild Chair", judicial: 50, referendum: false, legThreshold: 0.6 }),
        groups: { workers: 4, unions: 3, business: 2, military: 1.5 },
        planet: { housing: 50, employment: 74, crime: 30, healthcare: 55, education: 55, environment: 28, infrastructure: 74, inequality: 55 },
        lean: { corporatists: 3, militarists: 3, reformers: 2 },
        powers: ["Shipwright guilds", "Naval contracts office", "Orbital unions"],
        intro: "When the Republic builds a fleet, Fondor eats. When it doesn't, Fondor strikes.",
        roles: [
            SEN("Every appropriations bill is a jobs bill here."),
            { title: "Shipyard Guild Chair", kind: "council", desc: "Chosen by the guild assembly. Keep the orders flowing and the guilds united." }
        ]
    },

    kashyyyk: {
        name: "Kashyyyk", region: "mid", difficulty: 3,
        tagline: "Indigenous sovereignty • Resource extraction",
        traits: ["indigenous", "forest"],
        const: C({ gov: "Traditional council leadership", legislature: "Council of Elders", executive: "Chieftain chosen by the council", execLimit: 0, judicial: 40, referendum: false, legThreshold: 0.75, amendment: "Very difficult", elections: "Council selection" }),
        groups: { traditional: 5, rural: 3, environmentalists: 3, elders: 2, business: 0.5, urban: 0.5 },
        planet: { housing: 60, employment: 50, crime: 18, healthcare: 48, education: 45, environment: 88, infrastructure: 35, inequality: 35 },
        lean: { traditionalists: 4, federalists: 3, independence: 2 },
        powers: ["Council of Elders", "Clan chieftains", "Offworld logging interests", "Slaving remnants"],
        intro: "Outside corporations want the wroshyr forests. The elders want them to stay a forest.",
        roles: [
            SEN("Defend Wookiee sovereignty in a Senate that sees timber and labour."),
            { title: "Chieftain", kind: "traditional", desc: "Chosen by the Council of Elders. Your legitimacy is custom, and custom is patient but unforgiving." },
            { title: "Sovereignty Movement Leader", kind: "movement", desc: "Push for full self-rule over Kashyyyk's forests." }
        ]
    },

    tatooine: {
        name: "Tatooine", region: "outer", difficulty: 5,
        tagline: "Crime • Poverty • Water",
        traits: ["frontier", "desert", "crime"],
        const: C({ gov: "Fragmented local governance", legislature: "Settlement councils (no planetary body)", executive: "None", senateLimit: 0, execLimit: 0, judicial: 15, referendum: true, refThreshold: 0.5, legThreshold: 0.5, courtReview: false, militaryControl: "Contested (Hutt enforcers)", stability: 20, amendment: "Could create one", elections: "Settlement-level only" }),
        groups: { farmers: 4, rural: 4, workers: 2, elites: 0.5, business: 1.5, students: 0.3, urban: 0.6 },
        planet: { housing: 30, employment: 35, crime: 80, healthcare: 25, education: 22, environment: 25, infrastructure: 15, inequality: 88 },
        lean: { independence: 3, federalists: 3, corporatists: 1, traditionalists: 1 },
        powers: ["Hutt organisations", "Moisture farmers", "Merchants", "Mining interests", "Criminal gangs", "Offworld corporations"],
        intro: "Your biggest political problem isn't the Senate. It's: who actually controls the territory?",
        roles: [
            { title: "Settlement Representative", kind: "local", desc: "Represent one dusty settlement. There's no planetary government. You could build one from nothing.", term: 2, limit: 0 },
            SEN("A Senate seat with almost no government behind it, and the Hutts watching every vote.", { influence: 15, funds: 3 })
        ]
    },

    mandalore: {
        name: "Mandalore", region: "outer", difficulty: 4,
        tagline: "Clans • Honour • Contested sovereignty",
        traits: ["clans", "military"],
        const: C({ gov: "Clan-based government under a planetary leader", legislature: "Clan council", executive: "Duchess / planetary leader", judicial: 45, referendum: false, legThreshold: 0.6, militaryControl: "Clan militias", stability: 45, amendment: "Possible — dramatically", elections: "Clan acclamation" }),
        groups: { military: 3, veterans: 3, traditional: 3, youth: 2, urban: 1.5, workers: 1.5 },
        planet: { housing: 50, employment: 52, crime: 40, healthcare: 50, education: 55, environment: 30, infrastructure: 55, inequality: 50 },
        lean: { traditionalists: 3, militarists: 3, independence: 3, reformers: 1 },
        powers: ["Great clans", "Pacifist New Mandalorians", "Warrior traditionalists", "Republic observers"],
        clans: ["Kryze", "Vizsla", "Saxon", "Wren", "Ordo", "Rook"],
        intro: "Your legitimacy may not come from an election at all — it comes from the clans. Reform could turn clan rule into democracy. Or the opposite.",
        roles: [
            { title: "Duchess", kind: "executive", desc: "Lead Mandalore as planetary leader. The clans tolerate you — for now." },
            { title: "Clan Leader", kind: "clan", desc: "Your power rests on the loyalty of the great clans, not the ballot." },
            SEN("Speak for a proud, divided people in a Senate they barely trust."),
            { title: "Independence Movement Leader", kind: "movement", desc: "Mandalore answers to no Senate. Prove it." }
        ]
    },

    ordmantell: {
        name: "Ord Mantell", region: "outer", difficulty: 4,
        tagline: "Corruption • Crime • Trade",
        traits: ["frontier", "crime", "trade"],
        const: C({ gov: "Nominal democracy, captured institutions", executive: "Port Magistrate", judicial: 25, stability: 35, execLimit: 0, elections: "Easily purchased" }),
        groups: { workers: 3, business: 2, urban: 2, elites: 1.5 },
        planet: { housing: 38, employment: 48, crime: 76, healthcare: 38, education: 40, environment: 40, infrastructure: 50, inequality: 72 },
        lean: { corporatists: 3, federalists: 2, independence: 1, reformers: 1 },
        powers: ["Port cartels", "Scrap barons", "Bribable judges", "Bounty guilds"],
        corruption: 70,
        intro: "Every institution works. They just work for whoever pays.",
        roles: [
            SEN("Represent a world where votes are a commodity."),
            { title: "Port Magistrate", kind: "local", desc: "Run the spaceport — the only thing on Ord Mantell that everyone agrees matters.", term: 3, limit: 0, rung: 1 }
        ]
    },

    geonosis: {
        name: "Geonosis", region: "outer", difficulty: 3,
        tagline: "Manufacturing • Hive hierarchy",
        traits: ["industry", "arms", "caste"],
        const: C({ gov: "Hive caste hierarchy", legislature: "Hive council", executive: "Hive Overseer", execLimit: 0, judicial: 20, referendum: false, legThreshold: 0.6, stability: 55, amendment: "Extremely difficult" }),
        groups: { workers: 6, elites: 2, military: 2, traditional: 1.5 },
        planet: { housing: 40, employment: 80, crime: 20, healthcare: 35, education: 30, environment: 20, infrastructure: 65, inequality: 85 },
        lean: { corporatists: 3, traditionalists: 3, militarists: 2 },
        powers: ["Hive aristocracy", "Worker castes", "Foundry cartels"],
        intro: "Factories that never sleep, a caste system nobody questions — yet.",
        roles: [
            SEN("Speak for the foundries — and, maybe, the drones who work in them."),
            { title: "Hive Overseer", kind: "council", desc: "Hold power at the pleasure of the hive council." }
        ]
    },

    mustafar: {
        name: "Mustafar", region: "outer", difficulty: 4,
        tagline: "Industry • Environmental devastation",
        traits: ["industry", "mining", "corporate"],
        const: C({ gov: "Mining commission", legislature: "Commission board", executive: "Mining Commissioner", judicial: 35, referendum: false, legThreshold: 0.6 }),
        groups: { workers: 5, traditional: 2, business: 2, environmentalists: 1 },
        planet: { housing: 35, employment: 66, crime: 40, healthcare: 30, education: 30, environment: 5, infrastructure: 55, inequality: 75 },
        lean: { corporatists: 4, traditionalists: 1, reformers: 1 },
        powers: ["Mining guilds", "Native tribes", "Offworld ore buyers"],
        intro: "The lava pays. The people breathing its fumes do not get a vote on the board.",
        roles: [
            SEN("Represent a world that is literally being mined to death."),
            { title: "Mining Commissioner", kind: "council", desc: "Appointed by the mining board. Balance quotas against catastrophe." }
        ]
    },

    bespin: {
        name: "Bespin", region: "outer", difficulty: 2,
        tagline: "Resource extraction • Floating cities",
        traits: ["mining", "trade"],
        const: C({ gov: "Chartered city administration", executive: "City Administrator", judicial: 50, execLimit: 0 }),
        groups: { workers: 3, business: 3, urban: 3, elites: 1 },
        planet: { housing: 58, employment: 66, crime: 35, healthcare: 58, education: 52, environment: 60, infrastructure: 70, inequality: 55 },
        lean: { corporatists: 3, federalists: 3 },
        powers: ["Gas mining corporations", "City charter", "Tibanna buyers"],
        intro: "Charming cloud cities kept aloft by gas contracts and quiet deals.",
        roles: [
            SEN("Every tibanna contract matters."),
            { title: "City Administrator", kind: "executive", desc: "Keep the cloud city flying and the mining guild paid." }
        ]
    },

    kamino: {
        name: "Kamino", region: "specialized", difficulty: 3,
        tagline: "Biotechnology • Ethics",
        traits: ["biotech", "corporate"],
        const: C({ gov: "Ruling council", legislature: "Ruling council", executive: "Prime Minister of the council", execLimit: 0, judicial: 45, referendum: false, legThreshold: 0.6 }),
        groups: { elites: 3, business: 3, students: 2, religious: 0.5 },
        planet: { housing: 62, employment: 70, crime: 10, healthcare: 80, education: 80, environment: 55, infrastructure: 70, inequality: 55 },
        lean: { corporatists: 3, centralists: 2, traditionalists: 1 },
        powers: ["Cloning laboratories", "Ruling council", "Ethics tribunals"],
        intro: "The most advanced biotechnology in the galaxy, and the fewest questions asked about it.",
        roles: [
            SEN("Defend (or restrain) the galaxy's biotech capital."),
            { title: "Prime Minister", kind: "council", desc: "Lead the ruling council. The labs expect efficiency." }
        ]
    },

    jedha: {
        name: "Jedha", region: "specialized", difficulty: 3,
        tagline: "Pilgrimage • Faith • Occupation risk",
        traits: ["religious"],
        const: C({ gov: "Holy city council", legislature: "Council of elders and orders", executive: "First Elder", execLimit: 0, judicial: 40, referendum: false, legThreshold: 0.67 }),
        groups: { religious: 6, traditional: 3, elders: 2, business: 1.5 },
        planet: { housing: 45, employment: 42, crime: 38, healthcare: 40, education: 50, environment: 45, infrastructure: 40, inequality: 55 },
        lean: { traditionalists: 4, federalists: 2, independence: 2 },
        powers: ["Religious orders", "Pilgrim guilds", "Kyber traders"],
        intro: "A holy city that every faith claims, sitting on crystals every military wants.",
        roles: [
            SEN("Represent pilgrims, orders, and a moon every army covets."),
            { title: "First Elder", kind: "traditional", desc: "Chosen by the council of orders. Keep the faiths at peace." }
        ]
    },

    dathomir: {
        name: "Dathomir", region: "specialized", difficulty: 4,
        tagline: "Cultural sovereignty • Clan tradition",
        traits: ["indigenous", "clans"],
        const: C({ gov: "Traditional clan leadership", legislature: "Council of clan mothers", executive: "Clan Mother", execLimit: 0, judicial: 25, referendum: false, legThreshold: 0.8, amendment: "Extremely difficult", elections: "Customary" }),
        groups: { traditional: 6, rural: 3, religious: 2, youth: 1 },
        planet: { housing: 50, employment: 40, crime: 30, healthcare: 35, education: 35, environment: 70, infrastructure: 20, inequality: 40 },
        lean: { traditionalists: 5, independence: 3 },
        powers: ["Clan mothers", "Customary law", "Offworld researchers"],
        clans: ["Red Mist", "Singing Mountain", "Frenzied River", "Blue Desert"],
        intro: "The Republic barely reaches here. Custom rules, and custom does not hurry.",
        roles: [
            { title: "Clan Mother", kind: "clan", desc: "Hold authority among the clans by custom and alliance." },
            SEN("Represent a people who never asked to join a Senate.")
        ]
    },

    endor: {
        name: "Endor", region: "specialized", difficulty: 2,
        tagline: "Environmental politics • Indigenous tribes",
        traits: ["indigenous", "forest"],
        const: C({ gov: "Republic protectorate with tribal councils", executive: "Conservation Commissioner", judicial: 55, referendum: true }),
        groups: { traditional: 5, environmentalists: 4, rural: 3, business: 0.6 },
        planet: { housing: 55, employment: 35, crime: 12, healthcare: 35, education: 30, environment: 92, infrastructure: 15, inequality: 30 },
        lean: { traditionalists: 3, federalists: 2, reformers: 2 },
        powers: ["Tribal councils", "Timber prospectors", "Conservation agencies"],
        intro: "Pristine forests, tribes who never asked for a Commissioner, and loggers circling in orbit.",
        roles: [
            SEN("Defend an untouched world from people who want to touch it."),
            { title: "Conservation Commissioner", kind: "executive", desc: "Administer the protectorate. Development or preservation — both have lobbies." }
        ]
    },

    scarif: {
        name: "Scarif", region: "specialized", difficulty: 3,
        tagline: "Military • Archives • Isolation",
        traits: ["military"],
        const: C({ gov: "Military administration", legislature: "Civil-military council", executive: "Garrison Governor", judicial: 30, referendum: false, legThreshold: 0.6, militaryControl: "Military", stability: 70 }),
        groups: { military: 6, veterans: 3, workers: 2, elders: 1 },
        planet: { housing: 60, employment: 65, crime: 8, healthcare: 70, education: 60, environment: 78, infrastructure: 70, inequality: 45 },
        lean: { militarists: 5, centralists: 3 },
        powers: ["Garrison command", "Archive bureau", "Island communities"],
        intro: "Tropical beaches, a planetary shield, and a population of soldiers and their families.",
        roles: [
            SEN("Represent the Republic's fortress world."),
            { title: "Garrison Governor", kind: "council", desc: "Appointed by high command. The military runs this world; you run the military's world." }
        ]
    },

    sullust: {
        name: "Sullust", region: "specialized", difficulty: 3,
        tagline: "Manufacturing • Corporate state",
        traits: ["industry", "corporate"],
        const: C({ gov: "Corporate state", legislature: "Council of shareholders and districts", executive: "Planetary Chair", judicial: 40, referendum: true, refThreshold: 0.55 }),
        groups: { workers: 4, business: 3, elites: 2, urban: 2 },
        planet: { housing: 50, employment: 72, crime: 30, healthcare: 55, education: 55, environment: 25, infrastructure: 68, inequality: 65 },
        lean: { corporatists: 5, reformers: 2, federalists: 1 },
        powers: ["The combine board", "Tunnel unions", "Starship designers"],
        intro: "The corporation is the government. Some would like to reverse that.",
        roles: [
            SEN("Represent a planet that is, in most senses, a company."),
            { title: "Planetary Chair", kind: "executive", desc: "Elected — with the board watching every vote." }
        ]
    }
};

// Worlds you can't play, but which still have politics of their own.
const BACKGROUND_WORLDS = {
    hoth:      { name: "Hoth",      region: "outer", traits: ["military", "frontier"] },
    cantonica: { name: "Cantonica", region: "outer", traits: ["finance", "crime"] },
    kessel:    { name: "Kessel",    region: "outer", traits: ["mining", "crime"] },
    lothal:    { name: "Lothal",    region: "outer", traits: ["frontier", "farming"] },
    dantooine: { name: "Dantooine", region: "mid",   traits: ["farming"] },
    utapau:    { name: "Utapau",    region: "outer", traits: ["frontier"] },
    brentaal:  { name: "Brentaal",  region: "core",  traits: ["trade"] },
    rodia:     { name: "Rodia",     region: "mid",   traits: ["frontier", "trade"] }
};

const REGIONS = [
    { key: "core",        name: "🏛️ THE CORE" },
    { key: "mid",         name: "⚙️ INNER / MID RIM" },
    { key: "outer",       name: "🌵 THE OUTER RIM" },
    { key: "specialized", name: "🔭 SPECIALIZED WORLDS" }
];

const KIND_INFO = {
    senator:     { arena: "senate", elected: true,  label: "Elected senator" },
    executive:   { arena: "local",  elected: true,  label: "Elected executive", decree: true },
    monarch:     { arena: "local",  elected: true,  label: "Elected monarch", decree: true },
    hereditary:  { arena: "local",  elected: false, label: "Hereditary ruler", decree: true, legit: "hereditary" },
    council:     { arena: "local",  elected: false, label: "Appointed by a council", decree: true, legit: "council" },
    traditional: { arena: "local",  elected: false, label: "Chosen by custom", legit: "council" },
    clan:        { arena: "local",  elected: false, label: "Clan-backed leader", legit: "clans" },
    opposition:  { arena: "local",  elected: false, label: "Opposition — campaigning", candidate: true },
    movement:    { arena: "local",  elected: false, label: "Movement leader", legit: "movement" },
    local:       { arena: "local",  elected: true,  label: "Local office" },
    minister:    { arena: "senate", elected: false, label: "Appointed minister", legit: "appointed" },
    chancellor:  { arena: "senate", elected: true,  label: "Supreme Chancellor", decree: true },
    candidate:   { arena: "local",  elected: false, label: "Candidate", candidate: true },
    outsider:    { arena: "none",   elected: false, label: "Out of office" }
};

// The career ladder for those who start small.
const LADDER = ["Local Council Member", "Mayor", "Planetary Representative", "Senator"];

const GALACTIC_CONST = { gov: "Galactic Republic", execTerm: 4, execLimit: 2, legThreshold: 0.67, referendum: false, refThreshold: 0.6, courtReview: true, judicial: 75, militaryControl: "Civilian", recall: false, emergency: false, amendment: "Very difficult" };

const MINISTRIES = [
    { key: "finance",  name: "Minister of Finance",  faction: "corporatists" },
    { key: "defense",  name: "Minister of Defense",  faction: "militarists" },
    { key: "interior", name: "Minister of the Interior", faction: "centralists" },
    { key: "welfare",  name: "Minister of Health & Welfare", faction: "reformers" },
    { key: "planetary",name: "Minister of Planetary Affairs", faction: "federalists" }
];


// ── NAMES ───────────────────────────────────────────────────────

const FIRST_NAMES = ["Varo", "Mira", "Tessa", "Orn", "Kael", "Sira", "Dorn", "Jessa", "Talon", "Ileen", "Ryn", "Voss", "Amara", "Cato", "Nell", "Oris", "Pell", "Quin", "Rhea", "Teo", "Ulla", "Vex", "Wen", "Yara", "Zev", "Halle", "Fenn", "Garm", "Ilo", "Lira", "Mako", "Neva", "Osk", "Pax", "Rella", "Soren", "Tamsin", "Juno", "Ansel", "Brisa", "Corin", "Delta", "Eron", "Faye", "Gideon", "Hesper", "Isolde", "Jaron", "Kira", "Lucan"];
const LAST_NAMES = ["Denn", "Ossary", "Kell", "Thorne", "Maddox", "Vantis", "Rhyce", "Salo", "Drenn", "Ekko", "Farr", "Garrow", "Hallis", "Ister", "Jorrin", "Kaask", "Loor", "Merro", "Nabrun", "Orrin", "Palo", "Quell", "Rostek", "Sarn", "Umbra", "Vell", "Wyse", "Yorl", "Zent", "Aster", "Brannis", "Coldry", "Dravic", "Estemar", "Fallow", "Grenn", "Holloway", "Ivane", "Jast", "Korvane"];
const SPECIES_NAMES = {
    kashyyyk: ["Rrowkarr", "Tarrwyk", "Kallorr", "Grraaw", "Wookarra", "Chalyyk", "Rarrkyn", "Lowwokk"],
    moncala: ["Rae Tundo", "Kellsa Vorr", "Oonai Lass", "Terrec Ul", "Amila Qor"],
    geonosis: ["Tuk'aar", "Ssi'kran", "Vok Zeen", "Kli'tar", "Poggun Ra"],
    ryloth: ["Hera Tavi", "Numa Seln", "Cham Doro", "Isvaal Tenn", "Orra Bey"],
    kamino: ["Taun Weel", "Lama Ko", "Nala Vee", "Ko Sai-Ren", "Ti Wen"],
    sullust: ["Nien Barr", "Sian Tew", "Dar Nunb", "Aven Tuur"]
};

function randomName(worldKey) {
    const pool = SPECIES_NAMES[worldKey];
    if (pool && chance(70)) return pick(pool);
    return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function lastName(full) {
    const parts = full.split(" ");
    return parts[parts.length - 1];
}
