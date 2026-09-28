// ── DILEMMAS — disasters, windfalls, pressure groups, and multi-year packages ──

// ── Disasters ─────────────────────────────────────────────────────

const OCEAN = ["kamino", "moncala", "manaan", "naboo", "scarif"];
const DESERT = ["tatooine", "geonosis", "jedha", "ryloth"];
const FOREST = ["kashyyyk", "dathomir", "onderon", "naboo", "rodia"];
const CITY = ["coruscant", "taris"];

const DISASTERS = [
    { key: "quake", name: "The Great Quake", icon: "🌋", cost: 3, dmg: { infrastructure: -8, housing: -6 }, where: () => true,
      text: w => `A massive quake tears through ${w.name}'s most populated region. Whole districts are rubble.` },
    { key: "surge", name: "Storm Surge", icon: "🌊", cost: 3, dmg: { infrastructure: -6, housing: -7, employment: -2 }, where: k => OCEAN.includes(k),
      text: w => `A storm system the size of a continent drives the sea into ${w.name}'s cities.` },
    { key: "sandstorm", name: "The Great Sandstorm", icon: "🏜️", cost: 2, dmg: { infrastructure: -5, healthcare: -3, employment: -3 }, where: k => DESERT.includes(k),
      text: w => `A sandstorm that lasts for weeks buries vaporators, landing pads and whole settlements on ${w.name}.` },
    { key: "wildfire", name: "Wildfires", icon: "🔥", cost: 2.5, dmg: { environment: -10, housing: -3 }, where: k => FOREST.includes(k),
      text: w => `Fires race through ${w.name}'s forests. The smoke can be seen from orbit.` },
    { key: "lava", name: "Lava Surge", icon: "🌋", cost: 3.5, dmg: { infrastructure: -8, employment: -4 }, where: k => k === "mustafar",
      text: () => "A lava river breaks its channel and swallows two mining complexes." },
    { key: "ice", name: "The Long Storm", icon: "❄️", cost: 2, dmg: { infrastructure: -5, healthcare: -3 }, where: k => ["hoth", "pantora"].includes(k),
      text: w => `A months-long ice storm cuts ${w.name}'s settlements off from each other.` },
    { key: "meltdown", name: "Reactor Meltdown", icon: "☢️", cost: 4, dmg: { environment: -10, healthcare: -5, employment: -3 }, where: k => ((WORLDS[k] || {}).traits || []).some(t => ["industry", "arms"].includes(t)),
      text: w => `A power-core reactor at one of ${w.name}'s great foundries goes critical.` },
    { key: "collapse", name: "Undercity Collapse", icon: "🏚️", cost: 3.5, dmg: { housing: -8, infrastructure: -6, crime: 4 }, where: k => CITY.includes(k),
      text: w => `Forty levels of ancient ${w.name} infrastructure give way. Tens of thousands are trapped below.` },
    { key: "mine", name: "Mine Collapse", icon: "⛏️", cost: 1.5, dmg: { employment: -4, healthcare: -2 }, where: k => ((WORLDS[k] || {}).traits || []).includes("mining"),
      text: w => `A deep mine on ${w.name} collapses with a full shift below.` },
    { key: "plague", name: "Plague Outbreak", icon: "🦠", cost: 2.5, dmg: { healthcare: -10, employment: -3 }, where: () => true,
      text: w => `A virus arrives on a freighter from the Outer Rim. ${w.name}'s medcenters are overflowing within a week.` },
    { key: "blight", name: "Crop Blight", icon: "🥀", cost: 2, dmg: { employment: -3, healthcare: -2, inequality: 2 }, where: k => ((WORLDS[k] || {}).traits || []).includes("farming") || k === "rodia",
      text: w => `A blight spreads across ${w.name}'s farmland. The harvest will fail.` },
    { key: "crash", name: "Starliner Crash", icon: "💥", cost: 1.5, dmg: { infrastructure: -3 }, where: () => true,
      text: w => `A starliner loses its repulsors on approach and comes down on ${w.name}'s main spaceport.` }
];

function disasterDamageMult() {
    const dc = G.policies.disaster_corps;
    return 1 - (dc ? dc.eff * 0.5 : 0);
}

function applyDamage(dmg, mult) {
    Object.entries(dmg).forEach(([k, v]) => { G.planet[k] = clamp(G.planet[k] + v * mult); G.base[k] += v * mult * 0.35; });
}


// ── Windfalls ─────────────────────────────────────────────────────

const WINDFALLS = [
    { key: "hyperdrive", name: "A Better Hyperdrive Motivator", icon: "🚀", value: 0.35, where: k => ((WORLDS[k] || {}).traits || []).some(t => ["industry", "arms", "corporate"].includes(t)),
      text: w => `Engineers on ${w.name} develop a hyperdrive motivator that is cheaper and faster than anything in the galaxy. Shipyards everywhere want it.` },
    { key: "deposit", name: "A Mineral Strike", icon: "💎", value: 0.4, where: k => (WORLDS[k] || { ratings: {} }).ratings.resources >= 3,
      text: w => `Surveyors find a rich deposit of ${pick(["doonium", "quadanium", "bronzium", "baradium", "durasteel ore"])} under ${w.name}'s crust.` },
    { key: "tourism", name: "A Tourism Boom", icon: "🏖️", value: 0.25, where: k => ["naboo", "cantonica", "scipio", "alderaan", "manaan", "onderon", "pantora", "chandrila"].includes(k),
      text: w => `A holodrama filmed on ${w.name} becomes a galactic sensation. Liners full of tourists are arriving.` },
    { key: "bacta", name: "A Medical Breakthrough", icon: "🧪", value: 0.3, where: () => G.planet.education > 50,
      text: w => `Researchers on ${w.name} synthesise a cheap substitute for bacta. Every medcenter in the Republic wants a licence.` },
    { key: "hyperlane", name: "A New Hyperlane", icon: "🛰️", value: 0.3, where: k => (WORLDS[k] || {}).region !== "core",
      text: w => `Scouts chart a new hyperlane through the ${w.name} system. Freight traffic could triple.` },
    { key: "grain", name: "A Hardy Grain", icon: "🌾", value: 0.2, where: k => ((WORLDS[k] || {}).traits || []).includes("farming") || ["tatooine", "rodia", "ryloth"].includes(k),
      text: w => `Agronomists on ${w.name} breed a grain that grows almost anywhere.` },
    { key: "droid", name: "A Hit Droid Model", icon: "🤖", value: 0.3, where: () => G.planet.employment > 45,
      text: w => `A small firm on ${w.name} releases a droid model that sells out across three sectors.` }
];

function addStream(name, perMonth, months) {
    G.streams.push({ name, perMonth: Math.round(perMonth * 100) / 100, left: months });
}


// ── Pressure groups ───────────────────────────────────────────────

const PRESSURE_GROUPS = [
    { key: "guild", name: "The Merchants' Guild", icon: "💼", group: "business", faction: "corporatists", hates: ["corporate_tax", "guild_charters", "min_wage", "labour", "docking_duties", "droid_tax", "rent_control", "banking_reg"], loves: ["corp_incentives", "subsidies", "small_business", "freight"], strike: "a capital strike" },
    { key: "union", name: "The Dockworkers' & Miners' Union", icon: "✊", group: "unions", faction: "reformers", hates: ["droid_automation", "autopilot", "med_droids", "droid_patrols", "head_tax"], loves: ["labour", "min_wage", "guild_charters", "work_safety", "droid_tax"], strike: "a general strike" },
    { key: "green", name: "The Green Circle", icon: "🌿", group: "environmentalists", faction: "reformers", hates: ["mining", "shipyard", "subsidies", "penal_colony"], loves: ["emissions", "protected", "clean_energy", "salvage"], strike: "blockades of the mining rigs" },
    { key: "veterans", name: "The Veterans' League", icon: "🎖️", group: "veterans", faction: "militarists", hates: ["republic_relief"], loves: ["veterans", "injury_benefit", "defence_force", "militia"], strike: "a march on the capital" },
    { key: "elders", name: "The Council of Elders", icon: "🪶", group: "traditional", faction: "traditionalists", hates: ["droid_rights", "species_equality", "migration", "cloning_research", "spice_tax", "gambling"], loves: ["heritage", "temple_protection", "protected", "citizenship"], strike: "a boycott of the government" },
    { key: "students", name: "The Student Union", icon: "📚", group: "students", faction: "reformers", hates: ["surveillance", "holocams", "curfews", "detention", "loyalty_oaths", "id_chits", "censorship"], loves: ["universities", "press_charter", "holo_archives", "free_transit"], strike: "occupations of the universities" },
    { key: "farmers", name: "The Farmers' Cooperative", icon: "🌾", group: "farmers", faction: "federalists", hates: ["tariffs", "hydroponics"], loves: ["agri_subsidies", "rural_power", "water_purif", "landing_pads", "settlement_grants"], strike: "a harvest strike" },
    { key: "order", name: "The Law & Order League", icon: "🚓", group: "elders", faction: "militarists", hates: ["legal_aid", "spice_tax", "gambling"], loves: ["police", "droid_patrols", "holocams", "sentencing", "constables"], strike: "vigilante patrols" },
    { key: "antidroid", name: "The Anti-Droid League", icon: "🔩", group: "workers", faction: "traditionalists", hates: ["droid_automation", "droid_rights", "med_droids", "droid_patrols", "autopilot"], loves: ["droid_tax"], strike: "droid-smashing riots" },
    { key: "tenants", name: "The Tenants' Alliance", icon: "🏘️", group: "urban", faction: "reformers", hates: ["property_tax", "head_tax"], loves: ["housing", "rent_control", "free_transit"], strike: "a rent strike" },
    { key: "faithful", name: "The Temple Faithful", icon: "🕯️", group: "religious", faction: "traditionalists", hates: ["cloning_research", "spice_tax", "gambling", "species_registry"], loves: ["heritage", "temple_protection", "spice_ban"], strike: "mass vigils outside government buildings" },
    { key: "free", name: "The Sovereignty Front", icon: "🔥", group: "traditional", faction: "independence", hates: ["republic_relief", "id_chits", "loyalty_oaths", "patriotic_broadcasts"], loves: ["border_controls", "militia"], strike: "a campaign of civil disobedience" }
];

function pgActive(p) {
    if (p.key === "free") return G.indep > 15 || attr("identity") >= 4;
    return G.groups[p.group] && G.groups[p.group].w > 0.5;
}

function pgState(k) {
    if (!G.pgroups[k]) G.pgroups[k] = { anger: 30, members: 20, last: -99 };
    return G.pgroups[k];
}

function pgTarget(p) {
    const a = G.groups[p.group] ? G.groups[p.group].a : 50;
    let t = 50 - (a - 50) * 1.3;
    p.hates.forEach(k => { if (G.policies[k]) t += G.policies[k].level * 22; });
    p.loves.forEach(k => { if (G.policies[k]) t -= G.policies[k].level * 16; });
    if (p.key === "free") t += (G.indep - 20) * 0.8;
    return clamp(t, 0, 100);
}

function pgStage(s) { return s.anger >= 90 && s.members >= 45 ? "militant" : s.anger >= 75 ? "striking" : s.anger >= 60 ? "protesting" : s.anger >= 40 ? "lobbying" : "quiet"; }

function pgAction(key, t) {
    const p = PRESSURE_GROUPS.find(x => x.key === key);
    const s = pgState(key);
    const costs = { meet: 3, concede: 4, crackdown: 4, discredit: 3 };
    if (!spendAP(costs[t])) return;
    let ch = [];
    switch (t) {
        case "meet": s.anger = clamp(s.anger - 10); ch = applyEffects({ g: { [p.group]: 2 }, f: { [p.faction]: 2 } }); report(`${p.icon} Meeting ${p.name}`, "You listen. They notice.", ch); break;
        case "concede": {
            s.anger = clamp(s.anger - 25);
            PRESSURE_GROUPS.filter(o => o.key !== key && o.faction !== p.faction && pgActive(o)).slice(0, 2).forEach(o => { pgState(o.key).anger = clamp(pgState(o.key).anger + 8); });
            ch = applyEffects({ g: { [p.group]: 5 }, f: { [p.faction]: 4 }, consistency: -2 });
            report(`${p.icon} A concession to ${p.name}`, "You give ground. Their rivals take note.", ch);
            break;
        }
        case "crackdown": {
            if ((G.policies.police ? G.policies.police.level : 0) < 0.2) { G.ap += 4; return toast("No force to do it", "Your security forces are too weak to break a movement."); }
            s.members = clamp(s.members - 15); s.anger = clamp(s.anger + 10);
            ch = applyEffects({ unrest: 4, f: { reformers: -4, militarists: 3 }, g: { [p.group]: -5, students: -2 } });
            report(`🚓 Crackdown on ${p.name}`, "Arrests at dawn. The movement goes quiet — and bitter.", ch);
            break;
        }
        case "discredit": {
            if (chance(55)) { s.members = clamp(s.members - 10); report(`🗞️ ${p.name} discredited`, "A scandal about their leadership fills the HoloNet."); }
            else { s.anger = clamp(s.anger + 12); ch = applyEffects({ trust: -3 }); report("It backfires", "The smear is traced to your office.", ch); }
            break;
        }
    }
    render();
}

function tickPressureGroups() {
    if (G.scenes.length > 2) return;
    let acted = false;
    PRESSURE_GROUPS.filter(pgActive).forEach(p => {
        const s = pgState(p.key);
        s.anger = clamp(s.anger + (pgTarget(p) - s.anger) * 0.1);
        s.members = clamp(s.members + (s.anger - 45) * 0.08 + (G.groups[p.group] ? G.groups[p.group].w - 1 : 0) * 0.2);
        if (acted || !governing() || monthsNow() - s.last < 8) return;
        const st = pgStage(s);
        if (st === "protesting" && chance(8)) { s.last = monthsNow(); acted = true; report(`${p.icon} ${p.name} protests`, `Thousands march against your government. Their demands: ${p.hates.filter(k => G.policies[k] && G.policies[k].level > 0).slice(0, 2).map(k => POLICIES[k].name).join(" and ") || "to be heard"}.`, applyEffects({ g: { [p.group]: -2 }, unrest: 2 })); }
        if (st === "striking" && chance(10)) { s.last = monthsNow(); acted = true; pushScene("pg_strike", { key: p.key }); }
        if (st === "militant" && chance(8)) { s.last = monthsNow(); acted = true; pushScene("pg_militant", { key: p.key }); }
    });
}


// ── Multi-year investment packages ────────────────────────────────

const PACKAGE_TYPES = {
    transport: { name: "Transportation Investment Package", icon: "🚝", cat: "transport", components: [
        { key: "rail", name: "Repulsorlift rail lines", cost: 6, fx: { infrastructure: 6, environment: 2, employment: 2 }, g: { urban: 4, workers: 2 } },
        { key: "skylanes", name: "Skylane control and speeder corridors", cost: 3, fx: { infrastructure: 4, crime: -1 }, g: { urban: 2, business: 2 } },
        { key: "spaceport", name: "A new spaceport terminal", cost: 5, fx: { infrastructure: 4, employment: 4 }, g: { business: 4 } },
        { key: "rural", name: "Rural roads and landing pads", cost: 3, fx: { infrastructure: 3 }, g: { rural: 5, farmers: 4 } },
        { key: "freight", name: "Freight hub and orbital lift", cost: 4, fx: { employment: 3, infrastructure: 3 }, g: { workers: 3, business: 3 } },
        { key: "fares", name: "Fare-free transit for five years", cost: 2, fx: { inequality: -2 }, g: { youth: 3, workers: 2 } } ] },
    education: { name: "Education Investment Package", icon: "🎓", cat: "services", components: [
        { key: "schools", name: "New schools in every district", cost: 5, fx: { education: 6 }, g: { youth: 3, workers: 2 } },
        { key: "teachers", name: "A teacher corps", cost: 3, fx: { education: 4 }, g: { students: 2, youth: 2 } },
        { key: "academies", name: "Technical academies", cost: 3, fx: { education: 3, employment: 3 }, g: { workers: 3, business: 2 } },
        { key: "campus", name: "A university research campus", cost: 5, fx: { education: 4, employment: 2 }, g: { students: 5, elites: 2 } },
        { key: "rural_schools", name: "Rural schools and holo-classrooms", cost: 2, fx: { education: 3 }, g: { rural: 4, farmers: 2 } } ] },
    health: { name: "Health Investment Package", icon: "🏥", cat: "services", components: [
        { key: "hospitals", name: "Bacta hospitals", cost: 6, fx: { healthcare: 7 }, g: { elders: 4, veterans: 3 } },
        { key: "clinics", name: "A clinic in every district", cost: 3, fx: { healthcare: 4, inequality: -1 }, g: { workers: 3, rural: 2 } },
        { key: "droids", name: "Medical droid fleet", cost: 3, fx: { healthcare: 3 }, g: { rural: 2 } },
        { key: "disease", name: "A disease control centre", cost: 2, fx: { healthcare: 2 }, g: { elders: 2 } },
        { key: "eldercare", name: "Elder care homes", cost: 3, fx: { healthcare: 2 }, g: { elders: 5 } } ] },
    housing: { name: "Housing Investment Package", icon: "🏘️", cat: "welfare", components: [
        { key: "towers", name: "Public housing towers", cost: 6, fx: { housing: 8, inequality: -2 }, g: { urban: 4, youth: 3, elites: -2 } },
        { key: "renewal", name: "Old-district renewal", cost: 4, fx: { housing: 4, crime: -2 }, g: { urban: 3, elders: 2 } },
        { key: "settlements", name: "Settlement homesteads", cost: 3, fx: { housing: 4 }, g: { rural: 4, farmers: 2 } },
        { key: "assistance", name: "Rent assistance for five years", cost: 3, fx: { inequality: -2 }, g: { workers: 3, youth: 2 } } ] },
    energy: { name: "Energy & Water Investment Package", icon: "⚡", cat: "economy", components: [
        { key: "fusion", name: "A fusion power plant", cost: 7, fx: { infrastructure: 5, employment: 3, environment: 2 }, g: { business: 3, workers: 2 } },
        { key: "vaporators", name: "A planetary vaporator network", cost: 4, fx: { healthcare: 3, infrastructure: 3 }, g: { rural: 4, farmers: 5 } },
        { key: "grid", name: "A new power grid", cost: 4, fx: { infrastructure: 4 }, g: { urban: 2, business: 2 } },
        { key: "solar", name: "Orbital solar collectors", cost: 5, fx: { environment: 5, infrastructure: 2 }, g: { environmentalists: 5 } } ] },
    defense: { name: "Planetary Defence Package", icon: "🔰", cat: "defense", components: [
        { key: "shield", name: "A planetary shield generator", cost: 7, fx: { employment: 1 }, g: { military: 3, elders: 2 }, defense: 25 },
        { key: "platforms", name: "Orbital defence platforms", cost: 6, fx: { employment: 2 }, g: { military: 4 }, defense: 25 },
        { key: "bunkers", name: "Civil defence shelters", cost: 3, fx: { housing: 1 }, g: { elders: 3 }, defense: 8 },
        { key: "militia", name: "Militia training and armouries", cost: 2, fx: { employment: 1 }, g: { military: 3, youth: -2 }, defense: 10 } ] }
};

const PKG_FUNDING = {
    bonds:    { name: "Planetary bonds",              note: "No money now; 40% more over time in interest." },
    general:  { name: "The general fund",             note: "Paid from the operating budget each year." },
    levy:     { name: "A dedicated levy",             note: "A new tax pays for it. Taxpayers notice." },
    republic: { name: "A Republic matching grant",    note: "Needs Senate support. May be refused." },
    ppp:      { name: "Public–private partnership",   note: "15% cheaper; private owners, tolls and profits." }
};

function pkgDefaults(type) {
    return { type, comps: PACKAGE_TYPES[type].components.slice(0, 3).map(c => c.key), years: 10, funding: { bonds: 50, general: 50, levy: 0, republic: 0, ppp: 0 }, levyTax: "sales_tax" };
}

function compilePackage(spec) {
    const T = PACKAGE_TYPES[spec.type];
    const comps = T.components.filter(c => spec.comps.includes(c.key));
    let total = comps.reduce((s, c) => s + c.cost, 0) + (spec.sweeteners || []).reduce((s, x) => s + x.cost, 0);
    const f = spec.funding;
    const cover = Object.values(f).reduce((s, v) => s + v, 0);
    const pppSave = total * f.ppp / 100 * 0.15;
    total = Math.round((total - pppSave) * 10) / 10;
    const annual = total / spec.years;
    const monthlyCost = (annual * (f.general + f.ppp) / 100) / 12;
    const bondDebtService = total * f.bonds / 100 * 1.35 / (spec.years * 12);
    const levyPerMonth = annual * f.levy / 100 / 12;
    const st = { reformers: 1, centralists: 1, corporatists: 0, federalists: 0, militarists: 0, independence: 0, traditionalists: 0 };
    if (f.bonds >= 50) { st.corporatists -= 2; st.traditionalists -= 1; }
    if (f.levy > 0) st.corporatists -= 1 + Math.round(f.levy / 50);
    if (f.ppp > 0) { st.corporatists += 2; st.reformers -= 1; }
    if (f.republic > 0) { st.centralists += 1; st.independence -= 2; }
    if (spec.type === "defense") { st.militarists += 3; st.reformers -= 1; }
    if (total > 25) st.federalists -= 1;
    if ((spec.sweeteners || []).length) st.federalists += 1;
    if (spec.hawks) { st.corporatists += 1; st.traditionalists += 1; }
    Object.keys(st).forEach(k => { st[k] = clamp(st[k], -3, 3); });
    const g = {};
    comps.forEach(c => Object.entries(c.g).forEach(([k, v]) => { g[k] = (g[k] || 0) + v; }));
    if (f.levy) { g.business = (g.business || 0) - 2; g.workers = (g.workers || 0) - 1; }
    const fundingText = Object.entries(f).filter(([, v]) => v).map(([k, v]) => `${v}% ${PKG_FUNDING[k].name.toLowerCase()}`).join(", ");
    return { title: `The ${world().name} ${T.name}`, comps, total, annual, monthlyCost, bondDebtService, levyPerMonth, cover, stance: st, g, fundingText, years: spec.years };
}

function submitPackage(spec) {
    const t = compilePackage(spec);
    if (!t.comps.length) return toast("Nothing in it", "Choose at least one component.");
    if (t.cover !== 100) return toast("The money doesn't add up", `Your funding covers ${t.cover}% of the cost. It must cover exactly 100%.`);
    if (G.packages.some(p => p.type === spec.type && p.status === "active")) return toast("Already under way", "You already have a package of this kind in progress.");
    const id = `pkg${Date.now().toString(36)}`;
    const pkg = { id, spec: JSON.parse(JSON.stringify(spec)), ...t, type: spec.type, status: "proposed", year: 0 };
    if (rulesByDecree()) {
        if (!spendAP(6)) return;
        G.packages.push(pkg); activatePackage(pkg);
        ui.pkg = null;
        return render();
    }
    if (!spendAP(6)) return;
    G.packages.push(pkg);
    const b = createBill(`package_${id}`, "player", { arena: "local", title: t.title, desc: `${t.comps.map(c => c.name).join(", ")}. ${t.total.toFixed(1)}B over ${t.years} years. Funded by ${t.fundingText}.`, stance: t.stance, g: t.g });
    b.packageBill = true; b.packageId = id; b.voteIn = 5; b.pkgSpec = pkg;
    ui.pkg = null;
    report("🏗️ Package introduced", `${t.title} goes to the ${arenaName("local")}. The vote is in five months — enough time to negotiate. Legislators will want something for their districts.`);
    view = "chamber"; ui.bill = b.id; ui.arenaSel = "local";
    render();
}

// Negotiating a package on the floor.
function pkgNegotiate(b, how, district) {
    const pkg = G.packages.find(p => p.id === b.packageId);
    if (!pkg) return;
    if (!spendAP(how === "sweetener" ? 3 : 2)) return;
    const spec = pkg.spec;
    if (how === "sweetener") {
        spec.sweeteners = spec.sweeteners || [];
        const d = G.districts[+district] || pick(G.districts);
        spec.sweeteners.push({ name: `a project for ${d.name}`, cost: 0.8, district: d.name });
        d.boost = clamp(d.boost + 2, 0, 15);
        b.momentum += 5;
        report("A project for the district", `You add a project in ${d.name} to the package. Its legislators come around. The price goes up 0.8B.`);
    } else if (how === "trim") {
        const last = spec.comps[spec.comps.length - 1];
        if (spec.comps.length <= 1) { G.ap += 2; return toast("Nothing to trim", "The package needs at least one component."); }
        spec.comps = spec.comps.slice(0, -1);
        b.momentum += 2; b.stance.corporatists = clamp((b.stance.corporatists || 0) + 1, -3, 3);
        report("Trimmed", `You cut ${PACKAGE_TYPES[spec.type].components.find(c => c.key === last).name} to win over the fiscal hawks.`);
    } else if (how === "sunset") {
        spec.hawks = true; b.momentum += 3; b.stance.corporatists = clamp((b.stance.corporatists || 0) + 1, -3, 3); b.stance.traditionalists = clamp((b.stance.traditionalists || 0) + 1, -3, 3);
        report("A sunset clause", "You promise the package's taxes and borrowing end when the work is done. The hawks soften.");
    }
    Object.assign(pkg, compilePackage(spec));
    b.desc = `${pkg.comps.map(c => c.name).join(", ")}. ${pkg.total.toFixed(1)}B over ${pkg.years} years. Funded by ${pkg.fundingText}.`;
    render();
}

function activatePackage(pkg) {
    Object.assign(pkg, compilePackage(pkg.spec));
    const f = pkg.spec.funding;
    // The Republic's share must be won on Coruscant.
    if (f.republic > 0) { openRequest("grant", pkg.total * f.republic / 100, pkg.id); report("🏛️ Now win the Republic's share", `The Senate will decide on a ${(pkg.total * f.republic / 100).toFixed(1)}B matching grant in four months. Go to Coruscant and make your case (Government desk).`); }
    // The bond share is real debt.
    if (f.bonds > 0) issueBond(pkg.total * f.bonds / 100, pkg.years, `${pkg.title} bonds`, false);
    if (f.levy > 0 && G.policies[pkg.spec.levyTax]) {
        const tax = pkg.spec.levyTax, def = POLICIES[tax];
        G.policies[tax].level = clamp(G.policies[tax].level + pkg.levyPerMonth / -def.cost, 0, 1);
        pkg.levyTax = tax;
    }
    if (f.ppp > 0) applyEffects({ p: { inequality: 1 }, g: { business: 3 }, f: { corporatists: 2 } });
    pkg.monthly = pkg.monthlyCost;
    pkg.status = "active"; pkg.year = 1; pkg.started = monthsNow();
    const n = pkg.comps.length;
    pkg.schedule = pkg.comps.map((c, i) => ({ key: c.key, name: c.name, due: Math.max(1, Math.ceil((i + 1) * pkg.years / n)), done: false }));
    G.record.agreements.push(`Launched ${pkg.title} (${eraYear(currentBBY())})`);
    report(`${PACKAGE_TYPES[pkg.type].icon} ${pkg.title}`, `Year 1 of ${pkg.years}. ${pkg.total.toFixed(1)}B of work begins.`, applyEffects({ g: Object.fromEntries(Object.entries(pkg.g).map(([k, v]) => [k, v * 0.5])) }));
}

function packageRejected(b) {
    const pkg = G.packages.find(p => p.id === b.packageId);
    if (pkg) pkg.status = "rejected";
    report("❌ Package defeated", "The legislature votes your package down. You can rebuild it and try again.");
}

function tickPackages() {
    G.packages.filter(p => p.status === "active").forEach(p => {
        const years = Math.floor((monthsNow() - p.started) / 12) + 1;
        if (years !== p.year && years <= p.years + (p.delay || 0)) {
            p.year = years;
            p.schedule.filter(s => !s.done && s.due + (p.delay || 0) <= p.year - 1).forEach(s => completeComponent(p, s));
        }
        if ((monthsNow() - p.started) % 12 === 6 && chance(15) && G.scenes.length < 2) pushScene("pkg_overrun", { id: p.id });
        if (p.schedule.every(s => s.done) || monthsNow() - p.started >= (p.years + (p.delay || 0)) * 12) {
            p.schedule.filter(s => !s.done).forEach(s => completeComponent(p, s));
            p.status = "complete"; p.monthly = 0;
            if (p.spec.hawks && p.levyTax && G.policies[p.levyTax]) G.policies[p.levyTax].level = clamp(G.policies[p.levyTax].level - p.levyPerMonth / -POLICIES[p.levyTax].cost, 0, 1);
            G.record.agreements.push(`Completed ${p.title} (${eraYear(currentBBY())})`);
            report(`🎉 ${p.title} complete`, "Every piece of the package is finished. It will outlast your career.", applyEffects({ trust: 4, rep: 4 }));
            log(`🏗️ ${p.title} completed.`, "legacy");
        }
    });
}

function completeComponent(p, s) {
    s.done = true;
    const c = PACKAGE_TYPES[p.type].components.find(x => x.key === s.key);
    Object.entries(c.fx).forEach(([k, v]) => { G.base[k] += v; });
    if (c.defense) G.fortify = (G.fortify || 0) + c.defense;
    packageInfra(c.key, p.title);
    report(`${PACKAGE_TYPES[p.type].icon} Year ${p.year} of ${p.years}: ${c.name}`, `Part of the ${p.title} opens.`, applyEffects({ g: c.g, trust: 1 }));
}


// ── Views ─────────────────────────────────────────────────────────

function packagesView() {
    initLawbook();
    const b = ui.pkg;
    const gov = governing();
    const list = G.packages.filter(p => ["active", "proposed"].includes(p.status)).map(p => `<div class="pipe"><div class="statrow"><b>${PACKAGE_TYPES[p.type].icon} ${esc(p.title)}</b><span class="small">${p.status === "active" ? `Year ${p.year} of ${p.years}${p.delay ? ` (+${p.delay} delay)` : ""}` : "before the legislature"}</span></div>
        ${p.status === "active" ? `<div class="stages">${p.schedule.map(s => `<span class="${s.done ? "done" : ""}">${esc(s.name)} · yr ${s.due + (p.delay || 0)}</span>`).join("")}</div><p class="small muted">${(p.monthly * 12).toFixed(1)}B a year from the budget · funded by ${esc(p.fundingText)}</p>` : ""}</div>`).join("");
    const done = G.packages.filter(p => p.status === "complete").map(p => `<p class="small c-for">✓ ${esc(p.title)}</p>`).join("");
    let builder = "";
    if (gov && !b) builder = panel("🏗️ Build a package", `<p class="small">A multi-year package bundles big investments, finds the money, and needs a coalition to pass. Pick a sector to start.</p>
        <div class="row">${Object.entries(PACKAGE_TYPES).map(([k, t]) => `<button class="secondary" data-act="pkgnew" data-t="${k}">${t.icon} ${t.name.replace(" Investment Package", "").replace(" Package", "")}</button>`).join("")}</div>`);
    if (gov && b) {
        const T = PACKAGE_TYPES[b.type];
        const t = compilePackage(b);
        const taxes = Object.keys(POLICIES).filter(k => POLICIES[k].cat === "tax" && G.policies[k].level > 0);
        builder = panel(`${T.icon} ${T.name}`, `<div class="builder">
            <h4>What's in it</h4><div class="provisions">${T.components.map(c => `<label class="prov"><input type="checkbox" data-pkc="${c.key}" ${b.comps.includes(c.key) ? "checked" : ""}> ${esc(c.name)} — ${c.cost}B</label>`).join("")}</div>
            <div class="bgrid"><label>Over how many years?<select data-pkf="years">${[5, 10, 15].map(y => `<option value="${y}" ${b.years === y ? "selected" : ""}>${y} years</option>`).join("")}</select></label>
            ${taxes.length ? `<label>Dedicated levy on<select data-pkf="levyTax">${taxes.map(k => `<option value="${k}" ${b.levyTax === k ? "selected" : ""}>${esc(POLICIES[k].name)}</option>`).join("")}</select></label>` : ""}</div>
            <h4>Where the money comes from (must total 100%)</h4>
            <div class="bgrid">${Object.entries(PKG_FUNDING).map(([k, f]) => `<label>${f.name}<select data-pkf="fund:${k}">${[0, 25, 50, 75, 100].map(v => `<option value="${v}" ${b.funding[k] === v ? "selected" : ""}>${v}%</option>`).join("")}</select><span class="muted small">${f.note}</span></label>`).join("")}</div>
            <div class="bill-preview"><div class="record-title">THE PACKAGE</div><h3 class="bill-title">${esc(t.title)}</h3>
                <div class="statrow"><span>Total cost</span><b>${t.total.toFixed(1)}B over ${t.years} years</b></div>
                <div class="statrow"><span>From the budget each year</span><b>${(t.monthlyCost * 12).toFixed(1)}B</b></div>
                ${t.bondDebtService ? `<div class="statrow"><span>Bond payments each year (≈)</span><b>${(t.bondDebtService * 12).toFixed(1)}B</b></div>` : ""}
                <div class="statrow"><span>Funding covered</span><b class="${t.cover === 100 ? "c-for" : "c-against"}">${t.cover}%</b></div>
                <h4>How the legislature will see it</h4><div class="stances">${Object.entries(t.stance).filter(([, v]) => v).map(([f, v]) => `<span class="stance s${v}">${FACTIONS[f].icon} ${FACTIONS[f].name}: ${LEAN_WORDS[v]}</span>`).join("")}</div>
                <div class="row"><button class="primary" data-act="pkgsubmit" ${G.ap < 6 || t.cover !== 100 ? "disabled" : ""}>${rulesByDecree() ? "Decree it · 6" : "Send to the legislature · 6"}</button><button class="secondary" data-act="pkgcancel">Discard</button></div></div></div>`);
    }
    return `<div class="era-banner"><b>INVESTMENT PACKAGES</b> · Big, multi-year commitments. Find the money, build a coalition, and deliver year after year.</div>
        <div class="cols"><div class="col-main">${builder}${!gov ? '<p class="muted">Only the planetary government can propose investment packages.</p>' : ""}</div>
        <div class="col-side">${panel("Packages", list || '<p class="muted small">No packages under way.</p>')}${done ? panel("Completed", done) : ""}</div></div>`;
}

function pressureView() {
    initLawbook();
    const gov = governing();
    const rows = PRESSURE_GROUPS.filter(pgActive).map(p => {
        const s = pgState(p.key);
        const st = pgStage(s);
        const angry = p.hates.filter(k => G.policies[k] && G.policies[k].level > 0).map(k => POLICIES[k].name);
        const happy = p.loves.filter(k => G.policies[k] && G.policies[k].level > 0).map(k => POLICIES[k].name);
        return `<article class="issue sev${st === "militant" ? 3 : st === "striking" ? 2 : 1}"><header><span class="src">${p.icon} ${esc(p.name)}</span><span class="small ${s.anger >= 60 ? "c-against" : s.anger >= 40 ? "c-und" : "c-for"}">${st}</span></header>
            ${statRow("Anger", Math.round(s.anger), s.anger, "bad")}${statRow("Membership", Math.round(s.members), s.members, "good")}
            <p class="small">${angry.length ? `Opposes: ${esc(angry.slice(0, 3).join(", "))}. ` : ""}${happy.length ? `Supports: ${esc(happy.slice(0, 3).join(", "))}. ` : ""}Backed by ${GROUPS[p.group].name.toLowerCase()}. Escalates to ${esc(p.strike)}.</p>
            ${gov ? `<div class="row issue-acts"><button class="mini" data-act="pg" data-k="${p.key}" data-t="meet" ${G.ap < 3 ? "disabled" : ""}>Meet their leaders · 3</button><button class="mini" data-act="pg" data-k="${p.key}" data-t="concede" ${G.ap < 4 ? "disabled" : ""}>Make a concession · 4</button><button class="mini" data-act="pg" data-k="${p.key}" data-t="discredit" ${G.ap < 3 ? "disabled" : ""}>Discredit them · 3</button><button class="mini" data-act="pg" data-k="${p.key}" data-t="crackdown" ${G.ap < 4 ? "disabled" : ""}>Crack down · 4</button></div>` : ""}</article>`;
    }).join("");
    return `<div class="era-banner"><b>PRESSURE GROUPS</b> · Organised interests watch every law you pass. Anger turns into lobbying, protests, strikes — and, at the extreme, violence.</div>
        <div class="pg-grid">${rows}</div>`;
}


// ── Scenes ────────────────────────────────────────────────────────

Object.assign(SCENES, {
    disaster: ctx => {
        const d = DISASTERS.find(x => x.key === ctx.key);
        const w = world();
        const gov = governing();
        const m = disasterDamageMult();
        const cost = Math.round(d.cost * (0.8 + attr("population") * 0.1) * 10) / 10;
        const body = `<p>${esc(d.text(w))}</p><p class="small">Estimated cost of a full response: <b>${cost}B</b>. Treasury: ${G.treasury.toFixed(1)}B.${m < 1 ? " Your Disaster Preparedness Corps is already on the ground." : ""}</p>`;
        const done = (mult, e, msg) => { applyDamage(d.dmg, mult * m); report(`${d.icon} ${d.name}`, msg, applyEffects(e)); };
        const choices = gov ? [
            { label: `Full emergency response (${cost}B)`, hint: "Rescue, shelter, rebuild. Expensive — and it shows you care.", go: () => done(0.4, { treasury: -cost, trust: 4, g: { elders: 3, urban: 2, rural: 2 } }, "Rescue teams, field hospitals and rebuilding crews are everywhere within days.") },
            { label: "Request Republic disaster relief", hint: "If the Senate says yes, the Republic pays most of it.", go: () => { const sen = worldSenator(G.worldKey); if (chance(30 + (sen ? sen.rel / 2 : 0) + (G.allegiance === "republic" ? 15 : -30) + (6 - attr("wealth")) * 4)) done(0.5, { treasury: -cost * 0.3, trust: 2 }, "Republic relief ships arrive within a week."); else done(0.9, { treasury: -cost * 0.2, trust: -3 }, "The Republic sends condolences and nothing else. The damage spreads."); } },
            { label: `An emergency levy (${(cost * 0.4).toFixed(1)}B from the treasury)`, hint: "A one-off tax pays for most of it.", go: () => done(0.5, { treasury: -cost * 0.4, g: { business: -3, elites: -3, workers: -1 }, f: { corporatists: -3 } }, "A temporary tax funds the response. Nobody enjoys paying it.") },
            { label: "A minimal response", hint: "Cheap now. The damage lingers — and so does the anger.", go: () => { done(1.4, { treasury: -cost * 0.2, trust: -6, rep: -3, unrest: 5 }, "The government's response is slow and thin. The survivors will remember."); addIssue(makeIssue(Object.keys(d.dmg)[0] === "healthcare" ? "health" : "housing", { title: `Rebuilding after the ${d.name.toLowerCase()}`, text: "Survivors are still living in shelters.", source: "event", severity: 3 })); } }
        ] : G.office.kind === "senator" ? [
            { label: "Win an emergency relief appropriation", hint: "3 capital.", disabled: G.ap < 3, go: () => { G.ap -= 3; if (chance(45 + G.influence * 0.3)) { applyDamage(d.dmg, 0.5 * m); G.approPool = Math.max(0, G.approPool - 150); report("Relief appropriated", `You push a disaster relief package for ${w.name} through the Senate.`, applyEffects({ trust: 5, rep: 3 })); } else { applyDamage(d.dmg, m); report("Relief stalls", "The Senate sends thoughts and prayers."); } } },
            { label: "Fly home and tour the damage", go: () => { applyDamage(d.dmg, m); report("You go home", "You walk through the rubble with the survivors.", applyEffects({ trust: 3 })); } }
        ] : [
            { label: "Organise volunteers", go: () => { applyDamage(d.dmg, 0.9 * m); report("Volunteers", "Neighbours dig neighbours out.", applyEffects({ rep: 3, trust: 2 })); } },
            { label: "Criticise the government's response", go: () => { applyDamage(d.dmg, m); applyEffects({ opp: -2, rep: 1 }); } }
        ];
        return { tag: "DISASTER", title: `${d.icon} ${d.name}`, body, choices };
    },

    windfall: ctx => {
        const wf = WINDFALLS.find(x => x.key === ctx.key);
        const w = world();
        const v = wf.value * (0.8 + attr("wealth") * 0.1);
        const gov = governing();
        const body = `<p>${esc(wf.text(w))}</p><p class="small">What the government does next decides who gets rich.</p>`;
        const choices = gov ? [
            { label: "Tax it: royalties to the treasury", hint: `About ${(v * 12).toFixed(1)}B a year for five years.`, go: () => { addStream(wf.name, v, 60); report(`${wf.icon} Royalties`, "The treasury takes its share.", applyEffects({ g: { business: -2 }, f: { reformers: 2 } })); } },
            { label: "Let the private sector run with it", hint: "Jobs and growth; a smaller tax take; the rich get richer.", go: () => { addStream(wf.name, v * 0.4, 72); G.base.employment += 3; G.base.inequality += 2; report(`${wf.icon} A private boom`, "New firms spring up overnight.", applyEffects({ g: { business: 5, elites: 3 }, f: { corporatists: 4 } })); } },
            { label: "Make it a public enterprise", hint: "Bigger returns later; the corporations will fight you.", go: () => { addStream(`${wf.name} (public enterprise)`, v * 1.3, 96); G.base.inequality -= 2; report(`${wf.icon} A public enterprise`, "The planetary government takes ownership.", applyEffects({ g: { business: -5, workers: 3 }, f: { reformers: 4, corporatists: -5 } })); } },
            { label: `Invest to scale it up (${(v * 20).toFixed(1)}B now)`, hint: "Costs now; pays much more for much longer.", go: () => { applyEffects({ treasury: -v * 20 }); addStream(`${wf.name} (scaled up)`, v * 1.8, 120); G.base.employment += 2; report(`${wf.icon} Scaling up`, "Factories, labs and launch pads are built to make the most of it."); } }
        ] : [
            { label: "Champion it", go: () => { G.base.employment += 1; report(`${wf.icon} ${wf.name}`, "You make sure everyone knows about it.", applyEffects({ rep: 2 })); } },
            { label: "Demand that ordinary people share in it", go: () => applyEffects({ g: { workers: 3 }, f: { reformers: 3 } }) }
        ];
        return { tag: "OPPORTUNITY", title: `${wf.icon} ${wf.name}`, body, choices };
    },

    pg_strike: ctx => {
        const p = PRESSURE_GROUPS.find(x => x.key === ctx.key);
        const s = pgState(p.key);
        return { tag: "PRESSURE GROUP", title: `${p.icon} ${p.name}: ${p.strike}`,
            body: `<p>${esc(p.name)} launches ${esc(p.strike)}. Their members — ${Math.round(s.members)}% of ${GROUPS[p.group].name.toLowerCase()} — have had enough.</p>`,
            choices: [
                { label: "Negotiate a settlement", hint: "Give them something real.", go: () => { s.anger = clamp(s.anger - 30); applyEffects({ g: { [p.group]: 5 }, f: { [p.faction]: 3 }, treasury: -0.8 }); } },
                { label: "Wait it out", hint: "It will cost the economy.", go: () => { applyDamage({ employment: -4, infrastructure: -2 }, 1); applyEffects({ g: { business: -3 } }); s.anger = clamp(s.anger - 5); } },
                { label: "Break it", hint: "Security forces. Unrest.", go: () => { s.members = clamp(s.members - 12); s.anger = clamp(s.anger + 8); applyEffects({ unrest: 8, f: { reformers: -4, militarists: 3 }, g: { [p.group]: -6 } }); } }
            ] };
    },

    pg_militant: ctx => {
        const p = PRESSURE_GROUPS.find(x => x.key === ctx.key);
        const s = pgState(p.key);
        return { tag: "RADICALS", title: `${p.icon} A militant wing`,
            body: `<p>A radical wing of ${esc(p.name)} has turned to violence: ${pick(["a bomb at a government office", "sabotage at the spaceport", "an attack on a minister's speeder", "riots in the capital"])}. Moderates in the movement are horrified — but not all of them.</p>`,
            choices: [
                { label: "Hunt down the radicals, talk to the moderates", go: () => { s.members = clamp(s.members - 10); s.anger = clamp(s.anger - 10); applyEffects({ treasury: -0.5, rep: 3 }); } },
                { label: "Ban the whole movement", go: () => { s.members = clamp(s.members - 25); s.anger = clamp(s.anger + 15); applyEffects({ unrest: 10, f: { reformers: -6, militarists: 4 } }); } },
                { label: "Give in to their main demand", go: () => { s.anger = clamp(s.anger - 40); applyEffects({ rep: -6, trust: -4, consistency: -5 }); } }
            ] };
    },

    pkg_overrun: ctx => {
        const p = G.packages.find(x => x.id === ctx.id);
        if (!p) return { tag: "", title: "", body: "", choices: [{ label: "Continue" }] };
        return { tag: "INVESTMENT PACKAGE", title: `${PACKAGE_TYPES[p.type].icon} Cost overrun`,
            body: `<p>${pick(["The contractor's estimates were fantasy.", "Durasteel prices have doubled.", "The site turned out to sit on an ancient ruin.", "A key supplier went bankrupt."])} The ${esc(p.title)} is running over budget.</p>`,
            choices: [
                { label: "Pay the overrun", hint: "The package costs 10% more each year.", go: () => { p.monthly *= 1.1; p.total *= 1.1; } },
                { label: "Delay the schedule a year", hint: "Cheaper now; everything opens later.", go: () => { p.delay = (p.delay || 0) + 1; applyEffects({ trust: -2 }); } },
                { label: "Cut the last component", go: () => { const left = p.schedule.filter(s => !s.done); if (left.length > 1) { p.schedule = p.schedule.filter(s => s !== left[left.length - 1]); p.monthly *= 0.85; applyEffects({ trust: -3 }); } } }
            ] };
    }
});


// ── The month ─────────────────────────────────────────────────────

function tickDilemmas() {
    initLawbook();
    tickPackages();
    tickPressureGroups();
    G.lastDilemma = G.lastDilemma == null ? monthsNow() : G.lastDilemma;
    if (monthsNow() - G.lastDilemma < 8 || G.scenes.length) return;
    if (chance(3)) {
        const opts = DISASTERS.filter(d => d.where(G.worldKey));
        const specific = opts.filter(d => !["quake", "plague", "crash"].includes(d.key));
        const d = specific.length && chance(65) ? pick(specific) : pick(opts);
        G.lastDilemma = monthsNow();
        pushScene("disaster", { key: d.key });
    } else if (chance(2.5)) {
        const opts = WINDFALLS.filter(x => x.where(G.worldKey));
        if (!opts.length) return;
        G.lastDilemma = monthsNow();
        pushScene("windfall", { key: pick(opts).key });
    }
}
