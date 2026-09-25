// ── POLICY WEB — Democracy-style government simulation ──────────────
//
// Every policy has a level (0 = off … 1 = maximum). Its real, effective level
// lags behind: a change takes months to be felt. Policies push simulation
// values (the planetary stats) and voter groups; values crossing thresholds
// switch on situations, which push back on everything else.

const POLICY_CATS = {
    tax:      { name: "Taxation",        color: "#e0b050" },
    economy:  { name: "Economy",         color: "#57a6e6" },
    welfare:  { name: "Welfare",         color: "#e0709a" },
    services: { name: "Public Services", color: "#63c7a8" },
    law:      { name: "Law & Order",     color: "#9b87e8" },
    env:      { name: "Environment",     color: "#7cc25d" },
    society:  { name: "Society",         color: "#e88f58" }
};

// cost: billions of credits per month at full level (negative = revenue).
// fx: effect on simulation values at full level. g: voter group happiness.
const POLICIES = {
    income_tax:     { name: "Income Tax",            icon: "💳", cat: "tax",      cost: -2.4, fx: { inequality: -6, employment: -2 }, g: { workers: -4, elites: -8, business: -2, youth: -2 }, f: { corporatists: -2, reformers: 1 } },
    corporate_tax:  { name: "Corporate Tax",         icon: "🏢", cat: "tax",      cost: -2.0, fx: { employment: -5, inequality: -4 }, g: { business: -8, elites: -5, unions: 2 }, f: { corporatists: -3, reformers: 2 } },
    tariffs:        { name: "Trade Tariffs",         icon: "🚧", cat: "tax",      cost: -0.9, fx: { employment: 3 }, g: { farmers: 4, workers: 2, business: -4, elites: -2 }, f: { corporatists: -2, federalists: 1 } },
    mining:         { name: "Mining Licences",       icon: "⛏️", cat: "tax",      cost: -1.3, fx: { employment: 6, environment: -12 }, g: { workers: 3, business: 4, environmentalists: -9, traditional: -7 }, f: { corporatists: 2, traditionalists: -2 } },
    subsidies:      { name: "Industrial Subsidies",  icon: "🏭", cat: "economy",  cost: 1.5,  fx: { employment: 9, environment: -4, inequality: 2 }, g: { business: 5, workers: 4, environmentalists: -3 }, f: { corporatists: 2 } },
    min_wage:       { name: "Minimum Wage",          icon: "💵", cat: "economy",  cost: 0,    fx: { inequality: -9, employment: -4 }, g: { workers: 8, unions: 6, youth: 2, business: -7 }, f: { reformers: 2, corporatists: -2 } },
    labour:         { name: "Labour Protections",    icon: "🦺", cat: "economy",  cost: 0.2,  fx: { inequality: -4, employment: -2, healthcare: 2 }, g: { unions: 9, workers: 5, business: -6 }, f: { reformers: 2, corporatists: -2 } },
    spaceport:      { name: "Spaceport Expansion",   icon: "🛸", cat: "economy",  cost: 1.4,  fx: { infrastructure: 10, employment: 4, environment: -3 }, g: { business: 5, workers: 2, rural: 1 }, f: { corporatists: 1, centralists: 1 } },
    housing:        { name: "Public Housing",        icon: "🏘️", cat: "welfare",  cost: 1.7,  fx: { housing: 16, inequality: -4 }, g: { youth: 5, urban: 5, workers: 3, elites: -3 }, f: { reformers: 2 } },
    healthcare:     { name: "Public Healthcare",     icon: "🏥", cat: "welfare",  cost: 2.3,  fx: { healthcare: 20, inequality: -3 }, g: { elders: 8, veterans: 5, workers: 3, elites: -2 }, f: { reformers: 2 } },
    dividend:       { name: "Citizen's Dividend",    icon: "🪙", cat: "welfare",  cost: 2.6,  fx: { inequality: -13, employment: -3 }, g: { workers: 6, youth: 6, elites: -6, business: -3 }, f: { reformers: 3, corporatists: -3 } },
    veterans:       { name: "Veterans' Benefits",    icon: "🎖️", cat: "welfare",  cost: 0.8,  fx: { healthcare: 3 }, g: { veterans: 10, military: 4 }, f: { militarists: 1 } },
    schools:        { name: "State Schools",         icon: "🏫", cat: "services", cost: 1.8,  fx: { education: 16 }, g: { students: 7, youth: 4, elders: 1 }, f: { reformers: 1, centralists: 1 } },
    universities:   { name: "Universities",          icon: "🎓", cat: "services", cost: 1.2,  fx: { education: 9, employment: 2 }, g: { students: 8, elites: 2 }, f: { centralists: 1 } },
    transit:        { name: "Public Transit",        icon: "🚝", cat: "services", cost: 1.2,  fx: { infrastructure: 11, environment: 3 }, g: { urban: 5, workers: 2, rural: 1 }, f: { reformers: 1 } },
    rural_power:    { name: "Rural Power & Water",   icon: "💧", cat: "services", cost: 1.0,  fx: { infrastructure: 8, healthcare: 2 }, g: { rural: 8, farmers: 7 }, f: { federalists: 1 } },
    police:         { name: "Security Forces",       icon: "🚓", cat: "law",      cost: 1.3,  fx: { crime: -16 }, g: { elders: 5, business: 3, youth: -3 }, f: { militarists: 2 } },
    surveillance:   { name: "Surveillance",          icon: "📡", cat: "law",      cost: 0.6,  fx: { crime: -8 }, g: { youth: -6, students: -5, elders: 2 }, f: { militarists: 2, reformers: -3 } },
    sentencing:     { name: "Harsh Sentencing",      icon: "⛓️", cat: "law",      cost: 0.7,  fx: { crime: -6 }, g: { elders: 4, religious: 2, youth: -4 }, f: { traditionalists: 2, reformers: -2 } },
    legal_aid:      { name: "Legal Aid",             icon: "⚖️", cat: "law",      cost: 0.5,  fx: { crime: -3, inequality: -2 }, g: { workers: 2, youth: 2 }, f: { reformers: 1 } },
    defence_force:  { name: "Planetary Defence Force", icon: "🛡️", cat: "law",    cost: 1.5,  fx: { crime: -3, employment: 2 }, g: { military: 8, veterans: 4, youth: -2 }, f: { militarists: 3, reformers: -1 } },
    emissions:      { name: "Emission Controls",     icon: "🌫️", cat: "env",      cost: 0.3,  fx: { environment: 14, employment: -3 }, g: { environmentalists: 9, business: -5, workers: -1 }, f: { corporatists: -2, reformers: 1 } },
    protected:      { name: "Protected Lands",       icon: "🌲", cat: "env",      cost: 0.4,  fx: { environment: 10, employment: -2 }, g: { traditional: 8, environmentalists: 6, business: -3 }, f: { traditionalists: 2 } },
    migration:      { name: "Open Migration",        icon: "🧳", cat: "society",  cost: 0,    fx: { employment: 3, housing: -3 }, g: { urban: 2, religious: 2, traditional: -4 }, f: { reformers: 1, traditionalists: -2 } },
    heritage:       { name: "Heritage & Faith Funding", icon: "🏛️", cat: "society", cost: 0.5, fx: {}, g: { religious: 7, traditional: 6, elders: 3, youth: -1 }, f: { traditionalists: 3 } },
    arts:           { name: "Arts & Culture",        icon: "🎭", cat: "society",  cost: 0.4,  fx: { education: 2 }, g: { youth: 3, students: 3, urban: 2 }, f: { reformers: 1 } }
};

// Situations: they turn on when values cross thresholds, and push back.
const SITUATIONS = [
    { key: "housing_crisis",  name: "Housing Crisis",        icon: "🏚️", bad: true,  on: g => g.planet.housing < 28,       fx: { crime: 4 },                 g: { youth: -6, urban: -5 } },
    { key: "crime_wave",      name: "Crime Wave",            icon: "🚨", bad: true,  on: g => g.planet.crime > 70,         fx: { employment: -2 },           g: { elders: -6, business: -4 } },
    { key: "unemployment",    name: "Mass Unemployment",     icon: "📉", bad: true,  on: g => g.planet.employment < 35,    fx: { crime: 5, housing: -2 },    g: { workers: -8, unions: -6, youth: -5 } },
    { key: "brain_drain",     name: "Brain Drain",           icon: "🧠", bad: true,  on: g => g.planet.education < 32,     fx: { employment: -3 },           g: { students: -6, business: -2 } },
    { key: "eco_disaster",    name: "Ecological Collapse",   icon: "☣️", bad: true,  on: g => g.planet.environment < 15,   fx: { healthcare: -4 },           g: { environmentalists: -10, traditional: -6 } },
    { key: "health_crisis",   name: "Public Health Crisis",  icon: "🦠", bad: true,  on: g => g.planet.healthcare < 28,    fx: { employment: -2 },           g: { elders: -8, veterans: -5 } },
    { key: "inequality",      name: "Extreme Inequality",    icon: "🏰", bad: true,  on: g => g.planet.inequality > 78,    fx: { crime: 4 },                 g: { workers: -5, youth: -4 } },
    { key: "debt_crisis",     name: "Debt Crisis",           icon: "💸", bad: true,  on: g => g.treasury < -20,            fx: { employment: -3 },           g: { business: -6, elites: -4 } },
    { key: "unrest",          name: "Civil Unrest",          icon: "🔥", bad: true,  on: g => g.unrest > 70,               fx: { employment: -2, infrastructure: -1 }, g: { business: -5, elders: -4 } },
    { key: "refugee_camps",   name: "Refugee Camps",         icon: "⛺", bad: true,  on: g => g.gal.refugees > 60 && world().traits.some(t => ["frontier", "conflict"].includes(t)), fx: { housing: -4, crime: 3 }, g: { traditional: -3, religious: 2 } },
    { key: "boom",            name: "Economic Boom",         icon: "🚀", bad: false, on: g => g.planet.employment > 78,    fx: { housing: -2 },              g: { business: 5, workers: 4, youth: 3 } },
    { key: "golden_age",      name: "Educated Society",      icon: "✨", bad: false, on: g => g.planet.education > 80 && g.planet.healthcare > 70, fx: { employment: 2, crime: -2 }, g: { students: 3, elders: 3 } }
];

// Galactic policies, set by whoever is Supreme Chancellor.
const GAL_POLICIES = {
    fleet:        { name: "Fleet Budget",            icon: "🚀", cat: "law",      cost: 3.0,  fx: { military: 30, war: -6, diplomacy: -4 }, f: { militarists: 3, reformers: -2 } },
    trade_compact:{ name: "Free Trade Compact",      icon: "📦", cat: "economy",  cost: 0,    fx: { trade: 20 }, f: { corporatists: 3, federalists: 1 } },
    refugee_prog: { name: "Refugee Programme",       icon: "🧳", cat: "welfare",  cost: 1.5,  fx: { refugees: -25, diplomacy: 4 }, f: { reformers: 3, traditionalists: -2 } },
    grants:       { name: "Planetary Grants",        icon: "🪐", cat: "services", cost: 2.0,  fx: { diplomacy: 6 }, f: { federalists: 3, centralists: 1 } },
    security_bur: { name: "Security Bureau",         icon: "📡", cat: "law",      cost: 1.0,  fx: { war: -4, diplomacy: -3 }, f: { militarists: 2, centralists: 2, reformers: -3 } },
    diplo_corps:  { name: "Diplomatic Corps",        icon: "🕊️", cat: "society",  cost: 0.8,  fx: { diplomacy: 14, war: -8 }, f: { reformers: 1, federalists: 1 } },
    senate_tax:   { name: "Republic Levy",           icon: "💳", cat: "tax",      cost: -4.0, fx: { trade: -6, diplomacy: -4 }, f: { centralists: 2, federalists: -3 } }
};


// ── Setup ─────────────────────────────────────────────────────────

function defaultPolicyLevels(w) {
    const t = w.traits;
    const L = { income_tax: 0.4, corporate_tax: 0.3, tariffs: 0.2, schools: 0.4, healthcare: 0.3, police: 0.4, transit: 0.2, legal_aid: 0.2, labour: 0.2, arts: 0.2 };
    if (t.includes("industry")) { L.subsidies = 0.5; L.labour = 0.3; }
    if (t.includes("corporate")) { L.corporate_tax = 0.1; L.labour = 0.1; L.subsidies = 0.5; }
    if (t.includes("mining")) L.mining = 0.7;
    if (t.includes("indigenous") || t.includes("forest")) { L.protected = 0.6; L.heritage = 0.4; }
    if (t.includes("military")) { L.defence_force = 0.6; L.veterans = 0.4; }
    if (t.includes("religious")) L.heritage = 0.7;
    if (t.includes("core")) { L.universities = 0.5; L.healthcare = 0.5; L.transit = 0.5; L.spaceport = 0.4; }
    if (t.includes("pacifist")) { L.defence_force = 0; L.emissions = 0.5; }
    if (t.includes("frontier")) { Object.keys(L).forEach(k => { L[k] = L[k] * 0.4; }); L.income_tax = 0.1; }
    if (t.includes("clans")) { L.defence_force = 0.7; L.heritage = 0.4; }
    if (t.includes("finance") || t.includes("trade")) { L.tariffs = 0.05; L.spaceport = 0.6; }
    if (t.includes("caste")) { L.min_wage = 0; L.labour = 0; L.surveillance = 0.6; }
    const out = {};
    Object.keys(POLICIES).forEach(k => { out[k] = { level: L[k] || 0, eff: L[k] || 0 }; });
    return out;
}

function initPolicies() {
    const w = world();
    G.policies = defaultPolicyLevels(w);
    // Baselines are chosen so that the starting policies reproduce the world's starting values.
    G.base = {};
    Object.keys(PLANET_STATS).forEach(k => {
        let sum = 0;
        Object.entries(G.policies).forEach(([pk, p]) => { sum += (POLICIES[pk].fx[k] || 0) * p.eff; });
        G.base[k] = w.planet[k] - sum;
    });
    G.galPolicies = {};
    Object.keys(GAL_POLICIES).forEach(k => { G.galPolicies[k] = { level: 0.4, eff: 0.4 }; });
    G.galTreasury = 40;
    G.situations = [];
    G.districts = makeDistricts(w);
}


// ── Values ────────────────────────────────────────────────────────

function activeSituations() {
    return SITUATIONS.filter(s => G.situations.includes(s.key));
}

function statTarget(k) {
    let t = G.base[k];
    Object.entries(G.policies).forEach(([pk, p]) => { t += (POLICIES[pk].fx[k] || 0) * p.eff; });
    activeSituations().forEach(s => { t += s.fx[k] || 0; });
    G.programs.forEach(p => { t += (p.p[k] || 0) * (p.years - p.left + 1) * 0.5; });
    const tr = world().traits;
    if (k === "employment" && tr.some(x => ["trade", "finance", "industry"].includes(x))) t += (G.gal.trade - 55) * 0.25;
    if (k === "employment" && tr.includes("arms")) t += (G.gal.military - 45) * 0.3;
    if (k === "crime" && tr.includes("frontier")) t += (G.gal.war - 30) * 0.2;
    if (k === "housing" && tr.includes("frontier")) t -= Math.max(0, G.gal.refugees - 30) * 0.15;
    if (G.autocrat && k === "inequality") t += 6;
    return clamp(t, 1, 99);
}

// Who gets the credit (or blame) for the government's policies?
function governing() {
    return canDecree() && G.office.kind !== "chancellor";
}

function policyGroupEffect(gk) {
    let s = 0;
    Object.entries(G.policies).forEach(([pk, p]) => { s += (POLICIES[pk].g[gk] || 0) * p.eff; });
    return s;
}

function situationGroupEffect(gk) {
    return activeSituations().reduce((s, x) => s + (x.g[gk] || 0), 0);
}

function budget() {
    let income = 1 + (G.planet.employment - 40) * 0.03;
    let spend = 0;
    Object.entries(G.policies).forEach(([k, p]) => {
        const c = POLICIES[k].cost * p.level;
        if (c < 0) income -= c; else spend += c;
    });
    const interest = G.treasury < 0 ? -G.treasury * 0.012 : 0;
    return { income, spend, interest, net: income - spend - interest };
}

function galBudget() {
    let income = 5, spend = 0;
    Object.entries(G.galPolicies).forEach(([k, p]) => {
        const c = GAL_POLICIES[k].cost * p.level;
        if (c < 0) income -= c; else spend += c;
    });
    return { income, spend, net: income - spend };
}


// ── Monthly tick ──────────────────────────────────────────────────

function tickPolicies() {
    // Effects arrive gradually — roughly half a year for a full change.
    Object.values(G.policies).forEach(p => { p.eff += Math.sign(p.level - p.eff) * Math.min(Math.abs(p.level - p.eff), 0.17); });
    Object.values(G.galPolicies).forEach(p => { p.eff += Math.sign(p.level - p.eff) * Math.min(Math.abs(p.level - p.eff), 0.17); });

    Object.keys(PLANET_STATS).forEach(k => {
        G.planet[k] = clamp(G.planet[k] + (statTarget(k) - G.planet[k]) * 0.12 + rnd(-0.4, 0.4));
    });

    // The planetary treasury runs whether or not you run it.
    G.treasury = clamp(G.treasury + budget().net, -80, 999);

    // Galactic policy nudges the galaxy.
    Object.entries(G.galPolicies).forEach(([k, p]) => {
        Object.entries(GAL_POLICIES[k].fx).forEach(([s, v]) => { G.gal[s] = clamp(G.gal[s] + v * p.eff * 0.04); });
    });
    G.galTreasury = clamp(G.galTreasury + galBudget().net * 0.5, -100, 999);

    // Situations switch on and off (with a little hysteresis).
    SITUATIONS.forEach(s => {
        const active = G.situations.includes(s.key);
        const on = s.on(G);
        if (on && !active && chance(60)) {
            G.situations.push(s.key);
            report(`${s.icon} Situation: ${s.name}`, s.bad ? "A new crisis takes hold. It will shape everything until conditions change." : "Conditions have produced something to celebrate.");
        } else if (!on && active && chance(35)) {
            G.situations = G.situations.filter(x => x !== s.key);
            report(`${s.icon} ${s.name} ends`, s.bad ? "The crisis eases." : "The good times fade.");
        }
    });

    // Somebody else's government changes policy now and then.
    if (!governing() && chance(10)) npcGovernmentMove();
    if (G.office.kind !== "chancellor" && chance(8)) npcChancellorMove();
}

function npcGovernmentMove() {
    const k = pick(Object.keys(POLICIES));
    const p = G.policies[k];
    const d = pick([-0.2, 0.2]);
    const nl = clamp(p.level + d, 0, 1);
    if (nl === p.level) return;
    p.level = Math.round(nl * 100) / 100;
    report("Government policy change", `The planetary government ${d > 0 ? "expands" : "cuts back"} ${POLICIES[k].name} (now ${levelWord(p.level)}).`);
}

function npcChancellorMove() {
    const ch = chancellor();
    const keys = Object.keys(GAL_POLICIES);
    const liked = keys.filter(k => (GAL_POLICIES[k].f[ch ? ch.faction : "centralists"] || 0) > 0);
    const k = liked.length && chance(70) ? pick(liked) : pick(keys);
    const p = G.galPolicies[k];
    const up = (GAL_POLICIES[k].f[ch ? ch.faction : "centralists"] || 0) >= 0;
    p.level = Math.round(clamp(p.level + (up ? 0.2 : -0.2), 0, 1) * 100) / 100;
}

function levelWord(l) {
    if (l <= 0.001) return "off";
    if (l < 0.3) return "low";
    if (l < 0.6) return "moderate";
    if (l < 0.85) return "high";
    return "maximum";
}


// ── Changing policy ───────────────────────────────────────────────

function policyChangeCost(k, newLevel, galactic = false) {
    const p = (galactic ? G.galPolicies : G.policies)[k];
    const d = Math.abs(newLevel - p.level);
    if (d < 0.01) return 0;
    const intro = p.level === 0 && newLevel > 0 ? 4 : 0;
    const cancel = newLevel === 0 && p.level > 0 ? 3 : 0;
    return Math.round(3 + d * 10 + intro + cancel);
}

function setPolicy(k, newLevel, galactic = false) {
    const defs = galactic ? GAL_POLICIES : POLICIES;
    const store = galactic ? G.galPolicies : G.policies;
    const p = store[k];
    newLevel = Math.round(clamp(newLevel, 0, 1) * 100) / 100;
    const cost = policyChangeCost(k, newLevel, galactic);
    if (!cost) return;
    if (!spendAP(cost)) return;
    const d = newLevel - p.level;
    const verb = p.level === 0 ? "introduce" : newLevel === 0 ? "abolish" : d > 0 ? "expand" : "cut";
    p.level = newLevel;
    // Voters and factions react to the announcement straight away; the effects come later.
    const e = { f: {}, g: {} };
    Object.entries(defs[k].f || {}).forEach(([f, v]) => { e.f[f] = v * d * 6; });
    Object.entries(defs[k].g || {}).forEach(([gk, v]) => { e.g[gk] = v * d * 0.6; });
    const ch = applyEffects(e);
    report(`Policy: ${defs[k].name}`, `You ${verb} ${defs[k].name} (now ${levelWord(newLevel)}). Effects will build over the coming months.`, ch);
    publish(defs[k].name.toLowerCase(), e.f);
    render();
}

// The slower, legitimate route: put the change to the legislature as a bill.
function proposePolicyBill(k, newLevel) {
    const p = G.policies[k];
    const d = Math.round((newLevel - p.level) * 100) / 100;
    if (Math.abs(d) < 0.01) return;
    if (G.bills.some(b => b.policyKey === k)) return toast("Already on the floor", `A bill on ${POLICIES[k].name} is already before the legislature.`);
    if (!spendAP(4)) return;
    const def = POLICIES[k];
    const stance = {};
    Object.keys(FACTIONS).forEach(f => { stance[f] = clamp(Math.round((def.f[f] || 0) * Math.sign(d) * 1.2), -3, 3); });
    const g = {};
    Object.entries(def.g).forEach(([gk, v]) => { g[gk] = v * d; });
    const verb = p.level === 0 ? "Introduction" : newLevel === 0 ? "Abolition" : d > 0 ? "Expansion" : "Reduction";
    const b = createBill(`policy_${k}`, "player", { arena: "local", title: `${def.name} ${verb} Act`, desc: `Sets ${def.name} to ${levelWord(newLevel)}.`, stance, g });
    b.policyKey = k;
    b.policyLevel = newLevel;
    report("Bill tabled", `Your ${b.title} goes to the ${arenaName("local")}. Vote in three months.`);
    render();
}


// ── Districts — where elections are actually won ──────────────────

const DISTRICT_TEMPLATES = [
    { name: "Capital District",     mix: { urban: 3, elites: 2, business: 2, students: 1 } },
    { name: "Industrial Belt",      mix: { workers: 3, unions: 3, urban: 1 } },
    { name: "Outer Settlements",    mix: { rural: 3, farmers: 3, traditional: 1 } },
    { name: "Old Quarter",          mix: { elders: 3, religious: 2, traditional: 1 } },
    { name: "Spaceport Ward",       mix: { business: 2, workers: 2, youth: 1 } },
    { name: "University Heights",   mix: { students: 3, youth: 3, urban: 1 } },
    { name: "Garrison Townships",   mix: { military: 3, veterans: 3, elders: 1 } },
    { name: "Highlands",            mix: { traditional: 3, rural: 2, environmentalists: 1 } },
    { name: "Green Reaches",        mix: { environmentalists: 3, rural: 1, youth: 1 } }
];

function makeDistricts(w) {
    const scored = DISTRICT_TEMPLATES.map(t => {
        const fit = Object.entries(t.mix).reduce((s, [g, v]) => s + v * (w.groups[g] != null ? w.groups[g] : 1), 0);
        return { t, fit: fit + rnd(0, 3) };
    }).sort((a, b) => b.fit - a.fit).slice(0, 6);
    return scored.map(({ t, fit }) => ({ name: t.name, mix: t.mix, pop: Math.round(fit * 10) / 10, boost: 0 }));
}

function districtBase(d) {
    let s = 0, w = 0;
    Object.entries(d.mix).forEach(([g, v]) => {
        if (!G.groups[g] || G.groups[g].w <= 0) return;
        s += v * G.groups[g].a; w += v;
    });
    return w ? s / w : approval();
}

function districtShare(d, common = 0, noise = 0) {
    const mix = districtBase(d) * 0.6 + approval() * 0.4;
    return clamp(50 + (mix - G.opp) * 0.9 + d.boost + common + noise, 5, 95);
}

function electionCommon(bonus = 0) {
    const incumbent = isElected() ? 2 : 0;
    const money = Math.min(6, G.funds * 0.6);
    const corrupt = world().corruption ? (G.funds - 4) * 0.4 : 0;
    const endorse = Math.min(4, (G.endorsements || 0) * 1.5);
    return mediaMood() / 8 + money + (G.trust - 50) / 8 - G.heat / 8 + incumbent + corrupt + endorse + bonus;
}

function projectedShare() {
    const c = electionCommon();
    const tot = G.districts.reduce((s, d) => s + d.pop, 0);
    return G.districts.reduce((s, d) => s + districtShare(d, c) * d.pop, 0) / tot;
}

function tickDistricts() {
    G.districts.forEach(d => { d.boost *= 0.92; });
}

function campaignDistrict(i, type) {
    const d = G.districts[i];
    const opts = {
        canvass: { ap: 3, funds: 0.3, boost: 3, msg: "Volunteers knock on every door." },
        rally:   { ap: 4, funds: 1.0, boost: 5, msg: "A packed rally, a good speech, and good pictures." },
        ads:     { ap: 0, funds: 2.0, boost: 4, msg: "Your ads saturate the local HoloNet." }
    }[type];
    if (G.funds < opts.funds) return toast("Not enough funds", `This needs ${opts.funds}M credits.`);
    if (opts.ap && !spendAP(opts.ap)) return;
    d.boost = clamp(d.boost + opts.boost, 0, 15);
    const topGroup = Object.entries(d.mix).sort((a, b) => b[1] - a[1])[0][0];
    const ch = applyEffects({ funds: -opts.funds, g: { [topGroup]: 1 } });
    report(`Campaigning: ${d.name}`, opts.msg, ch);
    render();
}
