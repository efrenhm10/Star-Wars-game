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
function lastName(full) {
    const parts = full.split(" ");
    return parts[parts.length - 1];
}
