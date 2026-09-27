// ── THE GOVERNMENT DESK — cabinet, infrastructure, economy, debt, and Coruscant ──
//
// The Agenda is what comes to you. The Government desk is what you run.
// The money lives in Policy → Budget.

// ── Your cabinet ──────────────────────────────────────────────────

const CABINET_SEATS = {
    finance:  { title: "Finance Minister",               icon: "💰" },
    security: { title: "Security Chief",                  icon: "🚓" },
    health:   { title: "Minister of Health & Welfare",    icon: "🏥" },
    infra:    { title: "Minister of Infrastructure",      icon: "🏗️" },
    economy:  { title: "Minister of Economic Development", icon: "📈" }
};

function makeAdvisor(seat) {
    const f = chance(60) ? G.ideology : pick(Object.keys(FACTIONS));
    return { name: randomName(G.worldKey, pick(world().species)), faction: f, skill: ri(2, 4), seat, since: monthsNow() };
}

function initAdvisors() {
    if (!G.advisors) { G.advisors = {}; Object.keys(CABINET_SEATS).forEach(s => { G.advisors[s] = makeAdvisor(s); }); }
    return G.advisors;
}

function skill(seat) { const a = initAdvisors()[seat]; return a ? a.skill : 2; }

function advice(seat) {
    const p = G.planet;
    const pr = typeof projectBudget === "function" ? projectBudget(null) : { net: 0 };
    switch (seat) {
        case "finance":
            if (G.treasury < -20) return `“We are ${(-G.treasury).toFixed(0)}B in the red and paying ${(-G.treasury * 0.012 * 12).toFixed(1)}B a year in overdraft interest. Refinance with bonds, raise a tax, or ask Coruscant for help.”`;
            if (pr.net < -3) return `“Next year's budget runs a ${(-pr.net).toFixed(1)}B deficit. Raise the ${taxToRaise()} or trim the largest department.”`;
            if (pr.net > 5) return `“We're running a ${pr.net.toFixed(1)}B surplus. We could afford a bigger capital program — or cut a tax.”`;
            return "“The books are roughly balanced. Keep it that way.”";
        case "security": return p.crime > 60 ? `“Crime is at ${Math.round(p.crime)}. More constables or a security academy would help.”` : wartime() ? `“Defence strength is ${defenseStrength()}. Shelters and a militia would help if they come.”` : "“The streets are calm. For now.”";
        case "health": { const n = infraNeed("medcenters"); return n.gap > 0 ? `“We have ${n.have} of the ${n.need} medcenters this world needs. Every one we build shows up in the polls.”` : p.housing < 40 ? `“Housing is at ${Math.round(p.housing)}. Families are sleeping in hangars.”` : "“Our clinics are coping.”"; }
        case "infra": { const worst = INFRA.map(x => [x, infraNeed(x.key)]).sort((a, b) => (b[1].gap / b[1].need) - (a[1].gap / a[1].need))[0]; return worst && worst[1].gap > 0 ? `“Our worst gap is ${worst[0].name.toLowerCase()}: ${infraText(worst[0], worst[1])}.”` : "“The planet's infrastructure is in good shape.”"; }
        case "economy": { const fit = SECTORS_LIST().find(([k, s]) => sectorFit(k).ok); return fit ? `“We could attract ${fit[1].name.toLowerCase()} — we meet their requirements. Let's court a company.”` : `“Most investors want a better-educated workforce or better infrastructure. Education is ${Math.round(p.education)}, infrastructure ${Math.round(p.infrastructure)}.”`; }
    }
    return "";
}

function taxToRaise() {
    const t = Object.keys(POLICIES).filter(k => POLICIES[k].cat === "tax" && G.policies[k].level > 0 && G.policies[k].level < 0.8).sort((a, b) => POLICIES[a].cost - POLICIES[b].cost)[0];
    return t ? POLICIES[t].name : "a tax";
}

function replaceAdvisor(seat) {
    if (!spendAP(3)) return;
    const old = G.advisors[seat];
    const cand = makeAdvisor(seat);
    cand.skill = ri(1, 5);
    G.advisors[seat] = cand;
    applyEffects({ f: { [cand.faction]: 2, [old.faction]: -2 }, i: { civil: cand.skill >= old.skill ? 2 : -2 } });
    report(`${CABINET_SEATS[seat].icon} New ${CABINET_SEATS[seat].title}`, `${old.name} is out. ${cand.name} (${FACTIONS[cand.faction].name}, ${"★".repeat(cand.skill)}) takes over.`);
    render();
}


// ── Planetary infrastructure: what the world has, and what it needs ──

const INFRA = [
    { key: "medcenters", name: "Medcenters", unit: "medcenter", stat: "healthcare", per: 8, cost: 0.35, months: 8, g: { elders: 1.2, veterans: 0.6 } },
    { key: "housing", name: "Housing blocks", unit: "housing block", stat: "housing", per: 14, cost: 0.2, months: 8, g: { youth: 0.8, urban: 0.8 } },
    { key: "schools", name: "Schools & academies", unit: "school", stat: "education", per: 12, cost: 0.2, months: 8, g: { students: 0.8, youth: 0.5 } },
    { key: "stations", name: "Security stations", unit: "station", stat: "crime", per: 6, cost: 0.2, months: 6, g: { elders: 0.8 } },
    { key: "spaceport", name: "Spaceport modernisation", unit: "%", stat: "infrastructure", pct: true, cost: 3, months: 12, g: { business: 3 }, emp: 3 },
    { key: "grid", name: "Power & water grid", unit: "%", stat: "infrastructure", pct: true, cost: 2, months: 10, g: { rural: 3 } },
    { key: "transit", name: "Transit network", unit: "%", stat: "infrastructure", pct: true, cost: 2.5, months: 12, g: { urban: 3, workers: 1 } },
    { key: "defence", name: "Defence works", unit: "%", stat: null, pct: true, cost: 2.5, months: 12, g: { military: 3 }, defense: 15 }
];

function initInfra() {
    if (G.infra) return G.infra;
    G.infra = {};
    const pop = attr("population");
    INFRA.forEach(x => {
        if (x.pct) {
            const base = x.key === "defence" ? world().ratings.military * 12 : G.planet.infrastructure * (x.key === "spaceport" ? 0.9 : 0.8);
            G.infra[x.key] = { have: Math.round(clamp(base, 5, 90) / 5) * 5, need: 100 };
        } else {
            const need = x.per * pop;
            const v = x.stat === "crime" ? 100 - G.planet.crime : G.planet[x.stat];
            G.infra[x.key] = { have: Math.round(need * clamp(v, 10, 95) / 100), need };
        }
    });
    return G.infra;
}

function infraNeed(k) { const i = initInfra()[k]; return { have: i.have, need: i.need, gap: Math.max(0, i.need - i.have) }; }
function infraText(x, n) { return x.pct ? `${n.have}% complete` : `${n.have} of the ${n.need} ${x.unit}s it needs`; }

function infraOptions(x) {
    const n = infraNeed(x.key);
    if (x.pct) return n.gap > 0 ? [[Math.min(25, n.gap), `the next ${Math.min(25, n.gap)}%`]] : [];
    return [1, 5, 10].filter(u => u <= n.gap).map(u => [u, `${u} ${x.unit}${u > 1 ? "s" : ""}`]).concat(n.gap > 10 ? [[n.gap, `all ${n.gap} needed`]] : []);
}

function infraCost(x, units) {
    const discount = 1 - (skill("infra") - 3) * 0.05;
    return Math.round((x.pct ? x.cost * units / 25 : x.cost * units * (units >= 10 ? 0.85 : units >= 5 ? 0.92 : 1)) * discount * 10) / 10;
}

function buildInfra(key, units, how) {
    const x = INFRA.find(i => i.key === key);
    units = +units;
    const cost = infraCost(x, units);
    const name = x.pct ? `${x.name}: +${units}%` : `${units} new ${x.unit}${units > 1 ? "s" : ""}`;
    const item = { key: `infra_${key}_${monthsNow()}_${ri(0, 999)}`, name, fx: {}, g: Object.fromEntries(Object.entries(x.g).map(([k, v]) => [k, v * (x.pct ? units / 25 : Math.min(units, 8))])), cost, months: x.months + (x.pct ? 0 : Math.round(units / 4)), cat: x.stat === "healthcare" ? "health" : x.stat === "housing" ? "housing" : x.stat === "education" ? "education" : x.stat === "crime" ? "security" : "transit", infra: { key, units } };
    if (how === "now") {
        if (!spendAP(4)) return;
        G.treasury -= cost;
        G.projects.push({ ...item, monthsLeft: item.months, cost: Math.round(cost * 100) });
        report("Emergency appropriation", `${name}: ${cost.toFixed(1)}B from the treasury now, outside the budget. Construction begins.`);
        return render();
    }
    if (!spendAP(1)) return;
    addToCip(item);
}

// Called when any project finishes.
function infraComplete(p) {
    const x = INFRA.find(i => i.key === p.infra.key);
    const inf = initInfra()[x.key];
    const before = inf.have;
    inf.have = Math.min(inf.need, inf.have + p.infra.units);
    const share = (inf.have - before) / inf.need;
    if (x.stat === "crime") G.base.crime -= share * 45;
    else if (x.stat) G.base[x.stat] += share * (x.pct ? 25 : 45);
    if (x.emp) G.base.employment += x.emp * share * 4;
    if (x.defense) G.fortify = (G.fortify || 0) + x.defense * share * 4;
}


// ── Economic development: courting industry ──────────────────────

const SECTORS = {
    shipyards: { name: "Shipbuilding", icon: "🚀", req: { education: 50, infrastructure: 55 }, jobs: 12000, rev: 0.22, env: -3, firms: ["Corellian Engineering Corporation", "Kuat Drive Yards", "Incom Corporation", "Sienar Fleet Systems", "Rendili StarDrive"] },
    droids:    { name: "Droid manufacturing", icon: "🤖", req: { education: 45, infrastructure: 45 }, jobs: 8000, rev: 0.18, env: -1, firms: ["Industrial Automaton", "Cybot Galactica", "Arakyd Industries", "Serv-O-Droid"] },
    mining:    { name: "Mining", icon: "⛏️", req: { education: 20, infrastructure: 35 }, jobs: 9000, rev: 0.16, env: -6, firms: ["Czerka Corporation", "The Mining Guild", "Offworld Mining Corporation"], needs: () => attr("resources") >= 3 },
    agri:      { name: "Agriculture & food", icon: "🌾", req: { education: 15, infrastructure: 30 }, jobs: 7000, rev: 0.07, env: -1, firms: ["Galactic Food Combine", "Chandrilan Agricultural Cooperative", "Aratech Agri"] },
    finance:   { name: "Banking & finance", icon: "🏦", req: { education: 62, infrastructure: 50 }, jobs: 3000, rev: 0.28, env: 0, ineq: 2, firms: ["InterGalactic Banking Clan", "Aargau Holdings", "Muunilinst Trust"] },
    tourism:   { name: "Tourism", icon: "🏖️", req: { infrastructure: 50, environment: 55 }, jobs: 7000, rev: 0.12, env: -1, firms: ["Canto Bight Resorts", "Galactic Cruise Lines", "Chandrila Star Line"] },
    biotech:   { name: "Bacta & biotech", icon: "🧪", req: { education: 65, healthcare: 50 }, jobs: 4000, rev: 0.24, env: 0, firms: ["Zaltin Bacta", "Xucphra Corporation", "Kaminoan Genetics"] },
    energy:    { name: "Energy & fuel", icon: "⚡", req: { infrastructure: 40 }, jobs: 5000, rev: 0.18, env: -4, firms: ["Tibanna Gas Consortium", "Nubian Power Systems", "Rendili Power"] },
    logistics: { name: "Freight & logistics", icon: "📦", req: { infrastructure: 55 }, jobs: 6000, rev: 0.12, env: -1, firms: ["Tagge Company", "Corellian Merchants' Guild", "Trade Federation Freight"], spaceport: 50 },
    tech:      { name: "Computers & holonet", icon: "💻", req: { education: 60 }, jobs: 4000, rev: 0.2, env: 0, firms: ["SoroSuub", "HoloNet Communications", "Nubian Design Collective"] },
    arms:      { name: "Arms manufacturing", icon: "🔫", req: { education: 40, infrastructure: 45 }, jobs: 7000, rev: 0.18, env: -2, firms: ["BlasTech Industries", "Merr-Sonn Munitions", "Czerka Arms"] }
};
// Public investments that make an industry flourish.
const SECTOR_ASSETS = {
    shipyards: [["drydock", "Orbital drydock", 3, 14, { employment: 2 }], ["eng_academy", "Starship engineering academy", 1.5, 10, { education: 2 }]],
    droids:    [["robotics", "Robotics institute", 1.5, 10, { education: 2 }], ["fab_park", "Droid fabrication park", 2, 10, { employment: 2 }]],
    mining:    [["refinery", "Ore refinery", 2, 10, { employment: 2, environment: -2 }], ["rail_spur", "Mining rail spurs", 1.5, 8, { infrastructure: 2 }], ["mine_safety", "Mine safety college", 0.8, 8, { healthcare: 1 }]],
    agri:      [["irrigation", "Irrigation and vaporator farms", 1.5, 10, { employment: 1, healthcare: 1 }], ["agri_college", "Agricultural college", 1, 10, { education: 1 }], ["food_hub", "Food processing hub", 1.5, 10, { employment: 2 }]],
    finance:   [["exchange", "A planetary stock exchange", 2, 12, { employment: 1 }], ["fin_district", "A financial district", 3, 14, { infrastructure: 1 }]],
    tourism:   [["resorts", "Resort district", 2.5, 12, { employment: 2 }], ["heritage", "Heritage sites and museums", 1, 8, { education: 1 }], ["cruise_port", "A cruise-liner terminal", 2, 12, { infrastructure: 1 }]],
    biotech:   [["research_center", "Biotech research centre", 2, 12, { education: 2, healthcare: 1 }], ["med_school", "Medical school", 1.5, 12, { education: 2, healthcare: 2 }], ["bacta_labs", "Bacta synthesis labs", 2, 12, { employment: 1 }]],
    energy:    [["power_plant", "Fusion power plant", 3, 14, { infrastructure: 2 }], ["fuel_depot", "Fuel refinery and depot", 1.5, 10, { employment: 1 }]],
    logistics: [["freight_hub", "Freight hub", 2, 10, { employment: 2 }], ["orbital_lift", "Orbital lift", 3, 14, { infrastructure: 2 }]],
    tech:      [["tech_park", "Technology park", 2, 12, { employment: 1 }], ["holonet_backbone", "HoloNet backbone", 1.5, 10, { infrastructure: 1, education: 1 }], ["cs_institute", "Computing institute", 1.2, 10, { education: 2 }]],
    arms:      [["proving_ground", "Weapons proving grounds", 1.5, 10, { environment: -1 }], ["munitions", "Munitions works", 2, 10, { employment: 2 }]]
};

// ── What each world is naturally suited for ─────────────────────

const CLIMATE = {
    coruscant: "city", alderaan: "temperate", naboo: "temperate", corellia: "temperate", chandrila: "temperate", kuat: "industrial", fondor: "industrial",
    moncala: "ocean", mandalore: "desert", kashyyyk: "forest", ryloth: "desert", tatooine: "desert", ordmantell: "temperate", bespin: "gas", geonosis: "desert",
    kamino: "ocean", onderon: "jungle", jedha: "desert", mustafar: "lava", scarif: "ocean", sullust: "volcanic", dathomir: "swamp", hoth: "ice",
    manaan: "ocean", cantonica: "desert", pantora: "ice", taris: "city", scipio: "ice", umbara: "dark", rodia: "swamp", cato_neimoidia: "temperate"
};
const CLIMATE_NAME = { city: "a city-covered world", temperate: "a temperate world", industrial: "an industrial world", ocean: "an ocean world", desert: "a desert world", forest: "a forest world", gas: "a gas giant", jungle: "a jungle world", lava: "a lava world", volcanic: "a volcanic world", swamp: "a swamp world", ice: "an ice world", dark: "a world of permanent twilight" };

// [multiplier, reason]
const SECTOR_CLIMATE = {
    agri:      { temperate: [1.3, "fertile land and a mild climate"], forest: [1, "rich soil under the canopy"], jungle: [1.1, "year-round growing seasons"], swamp: [0.7, "wet, but workable"], ocean: [0.8, "aquaculture and kelp farms"], desert: [0.3, "deserts can't feed large farms without vaporators"], ice: [0.25, "nothing grows outdoors"], lava: [0.1, "nothing grows here at all"], volcanic: [0.35, "thin soil, underground farms only"], gas: [0.1, "there is no ground to farm"], city: [0.2, "no farmland left — only hydroponics"], industrial: [0.3, "the land is covered in foundries"], dark: [0.3, "almost no sunlight"] },
    tourism:   { temperate: [1.2, "beautiful landscapes"], ocean: [1.2, "islands and coral seas"], jungle: [1, "exotic wilderness"], forest: [1, "ancient forests"], city: [1.1, "the galaxy's great capital"], desert: [0.8, "dunes and canyons — for the adventurous"], ice: [0.5, "a harsh destination"], lava: [0.25, "few want to holiday on a lava world"], gas: [1, "floating cloud cities"], swamp: [0.4, "a hard sell"], volcanic: [0.4, "tunnels and ash"], industrial: [0.3, "smog and shipyards"], dark: [0.4, "a strange, dark world"] },
    mining:    { lava: [1.4, "rivers of molten ore"], volcanic: [1.3, "rich volcanic seams"], desert: [1.1, "exposed mineral beds"], ice: [1, "untouched deposits under the ice"], industrial: [1, "established extraction"], ocean: [0.7, "seabed mining only"], temperate: [0.8, "deposits, but people live on them"], city: [0.2, "the city covers the crust"], forest: [0.5, "the forests would have to go"], jungle: [0.6, "hard terrain"], swamp: [0.5, "difficult ground"], gas: [0.6, "no crust — but gas mining"], dark: [0.8, "unexplored deposits"] },
    energy:    { gas: [1.5, "Tibanna and gas layers made for refining"], lava: [1.4, "geothermal power everywhere"], volcanic: [1.2, "geothermal vents"], desert: [1.2, "endless sunlight for solar"], ocean: [1, "tidal power"], ice: [0.7, "hydrogen from the ice"], temperate: [0.9, "a mix of sources"], city: [0.7, "a huge market, no room"], industrial: [1, "existing grid"], forest: [0.6, "limited options"], jungle: [0.7, "biomass"], swamp: [0.8, "methane"], dark: [0.5, "no solar at all"] },
    biotech:   { ocean: [1.3, "marine biodiversity (and cloning know-how)"], jungle: [1.3, "the most biodiverse ecosystems in the sector"], forest: [1.1, "rare plants and fungi"], swamp: [1.1, "strange life in the bogs"], temperate: [1, "good labs, good living"], city: [1.1, "the best universities"], desert: [0.6, "little life to study"], ice: [0.7, "extremophiles only"], lava: [0.3, "nothing survives here"], volcanic: [0.6, "hardy microbes"], gas: [0.6, "airborne organisms"], industrial: [0.8, "pollution is a problem"], dark: [0.7, "unusual adaptations"] },
    finance:   { city: [1.4, "the heart of galactic finance"], temperate: [1, "a comfortable place for bankers"], ice: [1, "cold vaults and discretion"], industrial: [0.9, "money follows industry"], ocean: [0.8, "remote"], desert: [0.7, "frontier money"], lava: [0.4, "bankers don't like lava"], gas: [0.8, "floating counting-houses"], forest: [0.6, "far from the markets"], jungle: [0.6, "far from the markets"], swamp: [0.5, "not where bankers want to live"], volcanic: [0.6, "unappealing"], dark: [0.7, "secretive — which some like"] }
};

function climate() { return CLIMATE[G.worldKey] || "temperate"; }

function sectorSuit(k) {
    const w = world();
    const cl = climate();
    let [m, why] = (SECTOR_CLIMATE[k] && SECTOR_CLIMATE[k][cl]) || [1, "no particular advantage or handicap"];
    const tr = w.traits;
    const has = x => tr.includes(x);
    if (k === "shipyards" || k === "arms") {
        [m, why] = has("industry") || has("arms") ? [1.3, "foundries, drydocks and generations of skilled trades"] : has("mining") || w.ratings.resources >= 4 ? [1, "raw materials close at hand"] : has("core") ? [0.9, "capital and engineers, but little heavy industry"] : has("frontier") ? [0.4, "a frontier world with no industrial base"] : [0.65, "heavy industry would have to be built from scratch"];
        if (w.ratings.resources <= 1) { m *= 0.8; why += "; raw materials must be imported"; }
    }
    if (k === "droids") [m, why] = has("industry") || has("corporate") ? [1.2, "factories and corporate know-how"] : has("core") || has("urban") ? [1, "engineers and a huge market"] : has("frontier") ? [0.4, "no factories and no market"] : [0.7, "a modest industrial base"];
    if (k === "tech") [m, why] = has("core") || has("urban") || has("finance") ? [1.3, "universities, capital and the HoloNet's backbone"] : has("corporate") || has("biotech") ? [1.1, "research labs and technical staff"] : has("frontier") ? [0.4, "no universities, no network"] : [0.8, "some technical talent"];
    if (k === "logistics") { m = tr.some(t => ["trade", "finance"].includes(t)) || w.region === "core" ? 1.3 : w.region === "outer" ? 0.7 : 1; why = m > 1 ? "on the great trade routes" : m < 1 ? "far from the main hyperlanes" : "a reasonable position on the lanes"; }
    if (k === "mining") m *= 0.6 + w.ratings.resources * 0.15;
    const special = { kamino: { tourism: [0.4, "endless storms and no beaches"], agri: [0.5, "storm-lashed seas; aquaculture only"] }, scarif: { tourism: [1.3, "tropical islands"] }, jedha: { tourism: [1, "pilgrims come from across the galaxy"] }, hoth: { tourism: [0.2, "the coldest world anyone has heard of"] }, cantonica: { tourism: [1.5, "Canto Bight"] }, kashyyyk: { mining: [0.4, "the Wookiees will not allow the forests to be cut"] } }[G.worldKey];
    if (special && special[k]) [m, why] = special[k];
    // Public investments can work around nature.
    const st = G.sectors && G.sectors[k];
    if (st && k === "agri" && (st.assets.includes("irrigation") || G.policies.hydroponics && G.policies.hydroponics.level > 0)) { m = Math.max(m, 0.6); why += " — irrigation and hydroponics help"; }
    m = Math.round(m * 100) / 100;
    const label = m >= 1.2 ? "Excellent" : m >= 0.9 ? "Good" : m >= 0.55 ? "Fair" : m >= 0.35 ? "Poor" : "Unsuited";
    return { m, why, label };
}

// How strong each industry already is here.
const SECTOR_GOODS = { shipyards: "ships", droids: "droids", mining: "ore", agri: "food", finance: "finance", tourism: "luxuries", biotech: "medicine", energy: "fuel", logistics: "ships", tech: "tech", arms: "arms" };
function initSectors() {
    if (G.sectors) return G.sectors;
    G.sectors = {};
    const ex = typeof tradeProfile === "function" ? tradeProfile(G.worldKey)[0] : [];
    Object.keys(SECTORS).forEach(k => { G.sectors[k] = { str: ex.includes(SECTOR_GOODS[k]) ? 45 : 10, assets: [] }; });
    Object.keys(SECTORS).forEach(k => { G.sectors[k].str = Math.round(G.sectors[k].str * Math.min(1.2, sectorSuit(k).m)); });
    return G.sectors;
}

function sectorConditions(k) {
    const s = SECTORS[k], st = initSectors()[k];
    const out = Object.entries(s.req).map(([stat, v]) => ({ label: `${PLANET_STATS[stat].name} ${v}+`, ok: G.planet[stat] >= v, note: `you: ${Math.round(G.planet[stat])}` }));
    if (s.spaceport) out.push({ label: `Spaceport ${s.spaceport}% modernised`, ok: infraNeed("spaceport").have >= s.spaceport, note: `you: ${infraNeed("spaceport").have}%` });
    (SECTOR_ASSETS[k] || []).forEach(([ak, name]) => out.push({ label: name, ok: st.assets.includes(ak), asset: ak }));
    return out;
}

function buildSectorAsset(k, ak, how) {
    const a = (SECTOR_ASSETS[k] || []).find(x => x[0] === ak);
    if (!a) return;
    const [, name, cost, months, fx] = a;
    if (initSectors()[k].assets.includes(ak)) return toast("Already built", `${world().name} already has a ${name.toLowerCase()}.`);
    const item = { key: `sector_${k}_${ak}`, name, fx: {}, g: { business: 2, workers: 1 }, cost, months, cat: "industry", sectorAsset: { sector: k, key: ak, fx } };
    if (how === "now") { if (!spendAP(4)) return; G.treasury -= cost; G.projects.push({ ...item, monthsLeft: months, cost: Math.round(cost * 100) }); report("Emergency appropriation", `${name}: ${cost}B now. Construction begins.`); return render(); }
    if (!spendAP(1)) return;
    addToCip(item);
}

function sectorAssetComplete(p) {
    const { sector, key, fx } = p.sectorAsset;
    const st = initSectors()[sector];
    if (!st.assets.includes(key)) st.assets.push(key);
    st.str = clamp(st.str + 18 * sectorSuit(sector).m);
    Object.entries(fx).forEach(([k, v]) => { G.base[k] += v; });
    addStream(`${SECTORS[sector].name}: growth from the ${p.name.toLowerCase()}`, SECTORS[sector].rev * 0.02, 120);
}

const SECTORS_LIST = () => Object.entries(SECTORS).filter(([, s]) => !s.needs || s.needs());

function sectorFit(k) {
    const s = SECTORS[k];
    const gaps = Object.entries(s.req).filter(([stat, v]) => G.planet[stat] < v).map(([stat, v]) => ({ stat, have: Math.round(G.planet[stat]), need: v }));
    if (s.spaceport && infraNeed("spaceport").have < s.spaceport) gaps.push({ stat: "spaceport", have: infraNeed("spaceport").have, need: s.spaceport });
    return { ok: !gaps.length, gaps };
}

function courtCompany(k) {
    if (G.prospect) return toast("One at a time", `You're already negotiating with ${G.prospect.firm}.`);
    if (sectorSuit(k).m < 0.35) return toast("Not here", `No company will build ${SECTORS[k].name.toLowerCase()} on ${world().name}: ${sectorSuit(k).why}.`);
    if (!spendAP(3)) return;
    const s = SECTORS[k];
    const fit = sectorFit(k);
    const size = rnd(0.7, 1.4) * (0.7 + attr("population") * 0.12);
    G.prospect = { sector: k, firm: pick(s.firms), jobs: Math.round(s.jobs * size / 100) * 100, invest: Math.round(s.jobs * size / 2500 * 10) / 10,
        interest: clamp((sectorSuit(k).m - 1) * 30 + 40 + (attr("wealth") - 3) * 6 + (attr("stability") - 3) * 6 - fit.gaps.length * 15 + (wartime() ? -10 : 0) + initSectors()[k].assets.length * 10 + initSectors()[k].str * 0.2, 5, 92),
        offer: { tax: 5, grant: 0.5, hiring: 50, infra: false, waiver: false }, asks: { tax: pick([3, 5, 10]), grant: pick([0.5, 1, 2]) }, since: monthsNow() };
    report(`${s.icon} ${G.prospect.firm} is listening`, `Their scouts are touring ${world().name}. They're thinking of a ${G.prospect.invest}B facility employing ${G.prospect.jobs.toLocaleString()} people — if the terms are right. They'd like ${G.prospect.asks.tax} years without taxes and a ${G.prospect.asks.grant}B grant.`);
    render();
}

// ── Meeting the CEO ───────────────────────────────────────────────

const FIRM_HQ = { "Corellian Engineering Corporation": "corellia", "Kuat Drive Yards": "kuat", "Incom Corporation": "fondor", "Sienar Fleet Systems": "coruscant", "Rendili StarDrive": "coruscant",
    "Industrial Automaton": "coruscant", "Cybot Galactica": "coruscant", "Arakyd Industries": "coruscant", "Czerka Corporation": "coruscant", "SoroSuub": "sullust", "InterGalactic Banking Clan": "muunilinst",
    "Muunilinst Trust": "muunilinst", "Canto Bight Resorts": "cantonica", "Chandrila Star Line": "chandrila", "Kaminoan Genetics": "kamino", "Tibanna Gas Consortium": "bespin", "Nubian Power Systems": "naboo",
    "Nubian Design Collective": "naboo", "Tagge Company": "coruscant", "Corellian Merchants' Guild": "corellia", "Trade Federation Freight": "cato_neimoidia", "BlasTech Industries": "corellia", "Merr-Sonn Munitions": "coruscant", "Czerka Arms": "coruscant" };
const CEO_STYLES = {
    hardnosed: { name: "hard-nosed", open: "“I have forty minutes. Tell me why my shareholders should care about your planet.”" },
    visionary: { name: "a visionary", open: "“Every world says it's open for business. I'm looking for a world that wants to build something.”" },
    cautious:  { name: "cautious", open: "“We've been burned before — expropriations, strikes, wars. Convince me we won't be burned again.”" }
};
const CEO_WANTS = { workforce: "a skilled workforce", tax: "low, predictable taxes", infra: "the right infrastructure", stability: "stability and safety", speed: "speed — permits in months, not years" };

function ensureCeo(p) {
    if (!p.ceo) {
        const wants = shuffle(Object.keys(CEO_WANTS)).slice(0, 2);
        p.ceo = { name: randomName(FIRM_HQ[p.firm] || "coruscant"), style: pick(Object.keys(CEO_STYLES)), wants, met: false };
        p.demands = [];
    }
    return p.ceo;
}

function flyToCeo() {
    const p = G.prospect;
    if (!p) return;
    const ceo = ensureCeo(p);
    if (ceo.met) return toast("You've already met", `${ceo.name} has heard your pitch. Make them an offer.`);
    if (G.funds < 0.4) return toast("Not enough funds", "The trip costs 0.4M credits.");
    if (!spendAP(2)) return;
    applyEffects({ funds: -0.4 });
    ceo.met = true;
    frontScene("ceo_meeting", { round: 1, lines: [] });
    render();
}

function ceoReveal(p) {
    const fit = sectorFit(p.sector);
    const missing = sectorConditions(p.sector).filter(c => !c.ok);
    const d = [];
    if (p.ceo.wants.includes("workforce") && fit.gaps.some(g => g.stat === "education")) d.push("Raise education — build schools or fund workforce training");
    if (p.ceo.wants.includes("infra")) { const a = missing.find(c => c.asset); if (a) d.push(`Build a ${a.label.toLowerCase()}`); else if (fit.gaps.length) d.push(`Fix ${fit.gaps[0].stat}`); }
    if (p.ceo.wants.includes("tax")) d.push(`A tax holiday of at least ${p.asks.tax} years`);
    if (p.ceo.wants.includes("speed")) d.push("Site roads and power, built by you");
    if (p.ceo.wants.includes("stability")) d.push("No labour unrest — they'd love a labour-rules waiver");
    d.forEach(x => { if (!p.demands.includes(x)) p.demands.push(x); });
}

function ceoRespond(approach, ctx) {
    const p = G.prospect;
    if (!p) return;
    const ceo = p.ceo;
    const w = ceo.wants;
    const fit = sectorFit(p.sector);
    let d = 0, line = "";
    switch (approach) {
        case "workforce":
            if (!fit.gaps.some(g => g.stat === "education")) { d = w.includes("workforce") ? 12 : 5; line = "“Your graduates are good. We checked.”"; }
            else { d = w.includes("workforce") ? -6 : -2; line = `“Your schools don't produce what we need. Education is ${Math.round(G.planet.education)}; we need ${SECTORS[p.sector].req.education || 50}.”`; }
            break;
        case "tax": d = w.includes("tax") ? 12 : 3; line = w.includes("tax") ? `“Now you're speaking my language. ${p.asks.tax} years without taxes and we'll talk seriously.”` : "“Taxes matter. They're not everything.”"; break;
        case "infra": {
            const miss = sectorConditions(p.sector).filter(c => !c.ok);
            d = w.includes("infra") ? (miss.length ? 6 : 12) : 3;
            line = miss.length ? `“You'd need ${miss.slice(0, 2).map(c => c.label.toLowerCase()).join(" and ")} before we could operate properly.”` : "“You already have most of what we need. Good.”";
            break;
        }
        case "stability": {
            const stable = attr("stability") >= 3 && !wartime();
            d = w.includes("stability") ? (stable ? 12 : -8) : (stable ? 3 : -3);
            line = stable ? "“We've read the risk reports. You're a safe bet — for now.”" : "“With respect — there's a war on, and your streets aren't quiet.”";
            break;
        }
        case "speed": d = w.includes("speed") ? 12 : 2; line = w.includes("speed") ? "“If you can really clear the permits that fast, that's worth more than a tax break.”" : "“Speed is nice. Getting it right is better.”"; break;
        case "vision": d = ceo.style === "visionary" ? 12 : ceo.style === "hardnosed" ? -4 : 2; line = ceo.style === "visionary" ? "“Yes. That's the conversation I wanted to have.”" : ceo.style === "hardnosed" ? "“Spare me the speech.”" : "“Inspiring. Now, the details.”"; break;
        case "local": d = ceo.style === "hardnosed" ? -6 : -2; line = "“Local hiring quotas make my board nervous. We'll hire locally when your people are qualified.”"; p.offer.hiring = Math.max(p.offer.hiring, 50); break;
    }
    if (ceo.style === "hardnosed" && d > 0) d = Math.round(d * 0.8);
    if (ceo.style === "cautious" && approach === "stability") d += 4;
    p.interest = clamp(p.interest + d, 5, 95);
    ceoReveal(p);
    const next = { round: ctx.round + 1, lines: ctx.lines.concat([[CEO_APPROACHES[approach], line, d]]) };
    if (next.round > 3) { report(`🤝 Meeting with ${ceo.name}`, `Their interest is now ${Math.round(p.interest)}%. What they need: ${p.demands.join("; ") || "a good offer"}.`); render(); }
    else frontScene("ceo_meeting", next);
}

const CEO_APPROACHES = { workforce: "“Our workforce is ready for you.”", tax: "“We'll give you tax certainty.”", infra: "“We'll build what you need.”", stability: "“This world is stable and safe.”", speed: "“I'll clear your permits in months.”", vision: "“Imagine what we could build together.”", local: "“Our people must get these jobs.”" };

Object.assign(SCENES, {
    ceo_meeting: ctx => {
        const p = G.prospect;
        if (!p) return { tag: "", title: "", body: "", choices: [{ label: "Continue" }] };
        const ceo = ensureCeo(p);
        const hq = FIRM_HQ[p.firm] || "coruscant";
        const opener = ctx.round === 1 ? CEO_STYLES[ceo.style].open : ctx.round === 2 ? `“What matters to us is ${CEO_WANTS[ceo.wants[0]]}. And ${CEO_WANTS[ceo.wants[1]]}.”` : "“Last question. Why you — and not Kuat, or Corellia?”";
        const transcript = ctx.lines.map(([you, them, d]) => `<p class="small"><b>You:</b> ${esc(you)}</p><p class="small voice"><b>${esc(ceo.name)}:</b> ${esc(them)} <span class="${d >= 0 ? "c-for" : "c-against"}">${d >= 0 ? "▲" : "▼"}</span></p>`).join("");
        if (!ctx.offered) ctx.offered = shuffle(Object.keys(CEO_APPROACHES)).slice(0, 4);
        const offered = ctx.offered;
        return { tag: `${worldName(hq).toUpperCase()} · ${p.firm.toUpperCase()} HEADQUARTERS`, title: `Meeting ${ceo.name}`,
            body: `${ctx.round === 1 ? `<p class="small muted">You fly to ${esc(worldName(hq))}. The ${esc(p.firm)} tower is taller than anything on ${esc(world().name)}. The CEO is ${esc(CEO_STYLES[ceo.style].name)}.</p>` : ""}${transcript}
                <p class="voice"><b>${esc(ceo.name)}:</b> ${esc(opener)}</p><p class="small muted">Round ${ctx.round} of 3 · their interest: ${Math.round(p.interest)}%</p>`,
            choices: offered.map(a => ({ label: CEO_APPROACHES[a], go: () => ceoRespond(a, ctx) })).concat([{ label: "Thank them and leave", go: () => { ceoReveal(p); render(); } }]) };
    }
});

function evalOffer(p = G.prospect) {
    const s = SECTORS[p.sector], o = p.offer, fit = sectorFit(p.sector);
    const localShare = fit.gaps.some(g => g.stat === "education") ? 0.45 : 0.8;
    const local = Math.round(p.jobs * Math.max(localShare, o.hiring / 100));
    const annualTax = s.rev * 1.2 * (p.jobs / s.jobs);
    const foregone = annualTax * o.tax;
    const cost = o.grant + foregone + (o.infra ? 1 : 0);
    const perJob = cost * 1e9 / Math.max(1, local);
    const payback = cost / Math.max(0.01, annualTax);
    const metDemands = (p.demands || []).filter(d => (/tax holiday/.test(d) && o.tax >= p.asks.tax) || (/Site roads/.test(d) && o.infra) || (/waiver/.test(d) && o.waiver)).length;
    let chance_ = metDemands * 6 + p.interest + (o.tax - p.asks.tax) * 3 + (o.grant - p.asks.grant) * 12 + (o.infra ? 8 : 0) + (o.waiver ? 8 : 0) - Math.max(0, o.hiring - localShare * 100) * 0.35 + (skill("economy") - 3) * 5;
    return { local, annualTax, cost, perJob, payback, chance: Math.round(clamp(chance_, 3, 95)), localShare };
}

function setOffer(f, v) {
    if (!G.prospect) return;
    const o = G.prospect.offer;
    if (f === "infra" || f === "waiver") o[f] = !o[f]; else o[f] = +v;
    render();
}

function closeDeal() {
    const p = G.prospect;
    if (!p || !spendAP(4)) return;
    const e = evalOffer(p);
    const s = SECTORS[p.sector];
    if (!chance(e.chance)) {
        if (chance(40)) { report(`${s.icon} ${p.firm} goes elsewhere`, `${pick(["Kuat", "Corellia", "Fondor", "Sullust", "Scipio"])} made them a better offer.`); G.prospect = null; }
        else { p.interest = Math.max(5, p.interest - 8); report("Not yet", `${p.firm} wants a better deal. They're still at the table — for now.`); }
        return render();
    }
    G.prospect = null;
    G.firms = G.firms || [];
    initSectors()[p.sector].str = clamp(initSectors()[p.sector].str + 15);
    G.firms.push({ firm: p.firm, sector: p.sector, jobs: p.jobs, local: e.local, opens: monthsNow() + 12, taxFrom: monthsNow() + 12 + p.offer.tax * 12, rev: e.annualTax / 12, open: false });
    if (p.offer.grant) addStream(`Grant to ${p.firm}`, -p.offer.grant / 24, 24);
    if (p.offer.infra) addToCip({ key: `firm_infra_${monthsNow()}`, name: `Site roads and power for ${p.firm}`, fx: { infrastructure: 1 }, g: { business: 1 }, cost: 1, cat: "transit" });
    if (p.offer.waiver) applyEffects({ g: { unions: -5, workers: -2 }, f: { reformers: -3 } });
    if (p.offer.hiring >= 80) applyEffects({ g: { workers: 3 } });
    G.record.agreements.push(`Brought ${p.firm} to ${world().name} (${eraYear(currentBBY())})`);
    report(`🤝 ${p.firm} is coming`, `Construction starts now; the facility opens in a year with ${p.jobs.toLocaleString()} jobs (${e.local.toLocaleString()} local). ${p.offer.tax ? `They pay no taxes for ${p.offer.tax} years.` : ""}`, applyEffects({ g: { business: 4, workers: 2 }, f: { corporatists: 3 } }));
    render();
}

function tickFirms() {
    (G.firms || []).forEach(f => {
        const s = SECTORS[f.sector];
        if (!f.open && monthsNow() >= f.opens) {
            f.open = true;
            G.base.employment += f.jobs / 2500;
            G.base.environment += s.env;
            if (s.ineq) G.base.inequality += s.ineq;
            pushScene("opening", { name: `${f.firm}'s new facility`, g: { workers: 3, business: 3 } });
        }
        if (f.open && monthsNow() === f.taxFrom) { addStream(`Taxes from ${f.firm}`, f.rev, 240); report(`${s.icon} ${f.firm} starts paying taxes`, "The tax holiday is over."); }
    });
    if (G.prospect && monthsNow() - G.prospect.since > 8) { report("The prospect goes cold", `${G.prospect.firm} has stopped returning calls.`); G.prospect = null; }
}

function trainWorkforce() {
    if (!spendAP(3)) return;
    G.base.education += 2;
    addStream("Workforce training programme", -0.04, 36);
    report("🔧 Workforce training", "A three-year programme to retrain workers for the industries you want to attract.");
    render();
}


// ── Debt: bonds, credit and interest ──────────────────────────────

function initDebt() { if (!G.bonds) G.bonds = []; return G.bonds; }

function creditRating() {
    const debt = totalDebt(), rev = Math.max(1, budget().income * 12);
    const r = debt / rev + (G.treasury < -20 ? 0.3 : 0);
    return r < 0.3 ? "AAA" : r < 0.6 ? "AA" : r < 1 ? "A" : r < 1.5 ? "BBB" : r < 2.2 ? "BB" : "Junk";
}
function bondRate() { return { AAA: 0.03, AA: 0.04, A: 0.05, BBB: 0.065, BB: 0.085, Junk: 0.12 }[creditRating()] - (skill("finance") - 3) * 0.004; }
function totalDebt() { return initDebt().reduce((s, b) => s + b.balance, 0) + Math.max(0, -G.treasury); }
function debtService() { return initDebt().reduce((s, b) => s + b.payment, 0); }

function issueBond(amount, years, name, toTreasury = true) {
    const rate = bondRate();
    const months = years * 12;
    const r = rate / 12;
    const payment = amount * r / (1 - Math.pow(1 + r, -months));
    initDebt().push({ name, principal: amount, balance: amount, rate, payment, left: months });
    if (toTreasury) G.treasury += amount;
    return { rate, payment };
}

function sellBonds(amount) {
    if (!governing()) return;
    if (!spendAP(3)) return;
    const { rate, payment } = issueBond(+amount, 10, `${eraYear(currentBBY())} planetary bonds`);
    report("💵 Bonds sold", `${amount}B raised at ${(rate * 100).toFixed(1)}% over ten years: ${(payment * 12).toFixed(2)}B a year in debt service.`, applyEffects({ g: { business: -1 }, f: { corporatists: -1 } }));
    render();
}

function tickDebt() {
    initDebt().forEach(b => {
        const interest = b.balance * b.rate / 12;
        b.balance = Math.max(0, b.balance - (b.payment - interest));
        b.left--;
    });
    G.bonds = G.bonds.filter(b => b.left > 0 && b.balance > 0.01);
}


// ── Coruscant: grants, testimony and bailouts ─────────────────────

function openRequest(kind, amount, pkgId) {
    G.requests = G.requests || [];
    if (G.requests.some(r => r.kind === kind && r.pkgId === pkgId)) return;
    const sen = worldSenator(G.worldKey);
    const base = kind === "bailout" ? 20 : 30;
    G.requests.push({ kind, amount: Math.round(amount * 10) / 10, pkgId, support: Math.round(clamp(base + (sen ? sen.rel / 3 : 0) + (G.allegiance === "republic" ? 10 : -25) + (6 - attr("wealth")) * 3, 5, 80)), decideAt: monthsNow() + 4, done: [] });
}

function requestAction(i, t) {
    const r = (G.requests || [])[i];
    if (!r || r.done.includes(t)) return;
    const costs = { testify: 4, senator: 2, chancellor: 3, reforms: 2 };
    if (t === "testify" && G.funds < 0.3) return toast("Not enough funds", "The trip to Coruscant costs 0.3M credits.");
    if (!spendAP(costs[t])) return;
    r.done.push(t);
    const ch = chancellor();
    const sen = worldSenator(G.worldKey);
    const gain = { testify: 12 + Math.round(G.influence / 8), senator: sen ? Math.round(6 + sen.rel / 8) : 2, chancellor: ch ? Math.round(5 + ch.rel / 6) : 3, reforms: 10 }[t];
    r.support = clamp(r.support + gain, 5, 92);
    if (t === "testify") applyEffects({ funds: -0.3 });
    if (t === "reforms") r.conditions = true;
    report({ testify: "🏛️ Testimony before the Senate Finance Committee", senator: "🤝 Your senator lobbies for you", chancellor: "🎖️ An audience with the Chancellor", reforms: "📉 You offer reforms" }[t],
        { testify: `You fly to Coruscant and make ${world().name}'s case in person. Support: ${r.support}%.`, senator: `${sen ? sen.name : "Your senator"} works the cloakrooms. Support: ${r.support}%.`, chancellor: `The Chancellor listens politely. Support: ${r.support}%.`, reforms: `You promise spending discipline in return. Support: ${r.support}%.` }[t]);
    render();
}

function tickRequests() {
    // Severe distress opens the door to a bailout.
    if (governing() && G.treasury < -30 && !(G.requests || []).some(r => r.kind === "bailout") && monthsNow() - (G.lastBailout || -99) > 36) {
        G.canBailout = true;
    }
    (G.requests || []).filter(r => monthsNow() >= r.decideAt).forEach(r => {
        const ok = chance(r.support);
        const pkg = r.pkgId && (G.packages || []).find(p => p.id === r.pkgId);
        if (r.kind === "grant") {
            if (ok) { G.record.appropriations += Math.round(r.amount * 1000); report("✅ Republic grant approved", `Coruscant will pay ${r.amount}B toward ${pkg ? pkg.title : "your package"}.`); if (pkg) pkg.republicPaid = true; }
            else { if (pkg) { pkg.spec.funding.bonds += pkg.spec.funding.republic; pkg.spec.funding.republic = 0; issueBond(r.amount, pkg.years, `${pkg.title} (replacing a refused grant)`, false); } report("❌ Republic grant refused", "The Senate won't pay. The Republic's share will be borrowed instead."); }
        } else {
            G.lastBailout = monthsNow();
            if (ok) {
                G.treasury += r.amount;
                cutAutonomy(r.conditions ? 10 : 6, "A Republic bailout came with oversight");
                if (r.conditions && G.pbudget) SPEND_CATS.forEach(c => { G.pbudget.cats[c] = Math.min(G.pbudget.cats[c] || 1, 0.9); });
                report("✅ Bailout approved", `The Republic lends ${world().name} ${r.amount}B${r.conditions ? " — on condition that every department is held to 90% of its funding" : ""}. Republic auditors arrive next week.`, applyEffects({ trust: -2 }));
            } else report("❌ Bailout refused", "The Senate won't rescue you. Your creditors are circling.", applyEffects({ trust: -4 }));
        }
        r.resolved = true;
    });
    G.requests = (G.requests || []).filter(r => !r.resolved);
}

function askBailout() {
    if (!spendAP(4)) return;
    G.canBailout = false;
    openRequest("bailout", Math.round(-G.treasury + 10), null);
    report("🆘 A request for a bailout", "You formally ask the Senate for emergency assistance. The vote is in four months. Make your case.");
    render();
}

function requestsPanel() {
    const reqs = G.requests || [];
    if (!reqs.length && !G.canBailout) return "";
    return panel("🏛️ Coruscant", `${reqs.map((r, i) => `<div class="pipe"><div class="statrow"><b>${r.kind === "bailout" ? "Emergency bailout" : "Republic matching grant"} · ${r.amount}B</b><span class="small">decision in ${r.decideAt - monthsNow()} mo</span></div>
            ${statRow("Senate support", `${r.support}%`, r.support, "good")}
            <div class="row">${[["testify", "Testify on Coruscant", 4, "0.3M"], ["senator", "Lobby your senator", 2], ["chancellor", "Meet the Chancellor", 3], ...(r.kind === "bailout" ? [["reforms", "Offer spending reforms", 2]] : [])].map(([t, l, c]) => `<button class="mini" data-act="request" data-i="${i}" data-t="${t}" ${r.done.includes(t) || G.ap < c ? "disabled" : ""}>${l} · ${c}</button>`).join("")}</div></div>`).join("")}
        ${G.canBailout ? `<p class="small c-against">The treasury is ${(-G.treasury).toFixed(0)}B in the red.</p>${tact("bailout", "🆘 Ask the Senate for a bailout", 4, "Money now; Republic oversight later.")}` : ""}`, "danger");
}


// ── Opening ceremonies and capital-program priorities ────────────

Object.assign(SCENES, {
    opening: ctx => ({ tag: "RIBBON CUTTING", title: `${ctx.name} is finished`,
        body: `<p>The ${esc(ctx.name)} ${ctx.district ? `in ${esc(ctx.district)} ` : ""}is ready to open. The local press will be there either way.</p>`,
        choices: [
            { label: "Speak at the opening yourself", hint: "2 capital. The best photo you'll get all year.", disabled: G.ap < 2, go: () => { G.ap -= 2; const d = ctx.district && G.districts.find(x => x.name === ctx.district); if (d) d.boost = clamp(d.boost + 4, 0, 15); report("🎗️ You cut the ribbon", `A good speech, a big crowd, and your face on every HoloNet channel in ${ctx.district || world().name}.`, applyEffects({ trust: 3, rep: 2, g: ctx.g || {} })); } },
            { label: "Send a minister", hint: "Free. Nobody remembers who cut the ribbon.", go: () => report("A minister attends", "The opening goes smoothly.", applyEffects({ trust: 1, g: Object.fromEntries(Object.entries(ctx.g || {}).map(([k, v]) => [k, v * 0.4])) })) },
            { label: "No ceremony", hint: "Just open the doors.", go: () => {} }
        ] }),

    cip_overbudget: ctx => {
        const q = G.cip.queue.find(x => x.key === ctx.key);
        if (!q) return { tag: "", title: "", body: "", choices: [{ label: "Continue" }] };
        const rate = bondRate();
        return { tag: "CAPITAL IMPROVEMENT PROGRAM", title: `${q.name} doesn't fit this year`,
            body: `<p><b>${esc(q.name)}</b> costs <b>${q.cost.toFixed(1)}B</b>. This year's capital budget has <b>${G.cip.frozen ? "0" : G.cip.remaining.toFixed(1)}B</b> left.</p><p class="small">Treasury: ${G.treasury.toFixed(1)}B · credit rating ${creditRating()}.</p>`,
            choices: [
                { label: `Take it out of the treasury (${q.cost.toFixed(1)}B)`, hint: G.treasury < q.cost ? "The treasury will be overdrawn — overdraft interest is steep." : "Outside the capital budget.", go: () => cipDecide(q.key, "treasury") },
                { label: "Borrow: sell bonds for it", hint: `${q.cost.toFixed(1)}B at ${(rate * 100).toFixed(1)}% over ten years — about ${(q.cost * (rate + 0.1)).toFixed(2)}B a year.`, go: () => cipDecide(q.key, "borrow") },
                { label: "Push it to next year's program", hint: "First in line when the new capital budget arrives.", go: () => cipDecide(q.key, "defer") },
                { label: "Forget about it", hint: "Off the list. The need remains.", go: () => cipDecide(q.key, "drop") }
            ] };
    }

});

// ── The desk ──────────────────────────────────────────────────────

function govDesk() {
    initAdvisors(); initInfra();
    const pr = projectBudget(null);
    const pb = G.pbudget;
    const p = G.prospect;
    const ev = p ? evalOffer(p) : null;
    const seg = (f, vals, cur, fmtv) => `<div class="seg small-seg">${vals.map(v => `<button class="${String(cur) === String(v) ? "on" : ""}" data-act="offer" data-f="${f}" data-v="${v}">${fmtv(v)}</button>`).join("")}</div>`;
    const cabinet = Object.entries(CABINET_SEATS).map(([k, s]) => { const a = G.advisors[k]; return `<div class="advisor"><div class="statrow"><b>${s.icon} ${esc(a.name)}</b><span class="small muted">${esc(s.title)} · ${FACTIONS[a.faction].icon} ${"★".repeat(a.skill)}${"☆".repeat(5 - a.skill)}</span></div><p class="small">${esc(advice(k))}</p><button class="mini" data-act="advisor" data-k="${k}" ${G.ap < 3 ? "disabled" : ""}>Replace · 3</button></div>`; }).join("");
    const infra = INFRA.map(x => {
        const n = infraNeed(x.key);
        const building = G.cip.queue.filter(q => q.infra && q.infra.key === x.key && q.status !== "done").reduce((s, q) => s + q.infra.units, 0) + G.projects.filter(q => q.infra && q.infra.key === x.key && q.monthsLeft > 0 && !G.cip.queue.some(c => c.key === q.key)).reduce((s, q) => s + q.infra.units, 0);
        const opts = infraOptions(x);
        return `<div class="infra"><div class="statrow"><b>${esc(x.name)}</b><span class="small">${x.pct ? `${n.have}%` : `${n.have} / ${n.need}`}${building ? ` <span class="c-und">(+${building}${x.pct ? "%" : ""} coming)</span>` : ""}</span></div>${bar(n.have / n.need * 100, n.have / n.need > 0.7 ? "good" : "bad")}
            <p class="small muted">${n.gap ? (x.pct ? `${n.gap}% still to build.` : `Needs ${n.gap} more.`) : "Fully built out."}</p>
            ${opts.length ? `<div class="row">${opts.map(([u, l]) => `<button class="mini" data-act="infra" data-k="${x.key}" data-u="${u}" data-h="cip" ${G.ap < 1 ? "disabled" : ""}>${esc(l)} · ${infraCost(x, u).toFixed(1)}B</button>`).join("")}</div>` : ""}</div>`;
    }).join("");
    initSectors();
    const sectors = SECTORS_LIST().sort((a, b) => (G.sectors[b[0]].str + sectorSuit(b[0]).m * 40) - (G.sectors[a[0]].str + sectorSuit(a[0]).m * 40)).map(([k, s]) => {
        const st = G.sectors[k];
        const suit = sectorSuit(k);
        const present = (G.firms || []).filter(f => f.sector === k).length;
        const conds = sectorConditions(k);
        const pending = G.cip.queue.concat(G.projects).filter(q => q.sectorAsset && q.sectorAsset.sector === k && (q.status === "queued" || q.status === "building" || q.monthsLeft > 0)).map(q => q.sectorAsset.key);
        return `<details class="sector" ${ui.sectorOpen === k ? "open" : ""}><summary><div class="statrow"><b>${s.icon} ${esc(s.name)}</b><span class="small"><span class="${suit.m >= 0.9 ? "c-for" : suit.m >= 0.55 ? "c-und" : "c-against"}">${suit.label} fit</span> · ${present ? `<span class="c-for">${present} firm${present > 1 ? "s" : ""}</span> · ` : ""}strength ${Math.round(st.str)}</span></div>${bar(st.str, st.str >= 50 ? "good" : "")}</summary>
            <p class="small"><b>${esc(world().name)} is ${CLIMATE_NAME[climate()]}:</b> ${esc(suit.why)}.</p>
            <h4>To flourish, ${esc(s.name.toLowerCase())} needs</h4>
            <ul class="conds">${conds.map(c => `<li class="${c.ok ? "c-for" : pending.includes(c.asset) ? "c-und" : "muted"}">${c.ok ? "✅" : pending.includes(c.asset) ? "🏗️" : c.asset ? "⬜" : "⚠️"} ${esc(c.label)}${c.note ? ` <span class="muted">(${esc(c.note)})</span>` : ""}${c.asset && !c.ok && !pending.includes(c.asset) ? (() => { const a = SECTOR_ASSETS[k].find(x => x[0] === c.asset); return ` <button class="mini" data-act="sectorbuild" data-k="${k}" data-a="${c.asset}" ${G.ap < 1 ? "disabled" : ""}>Build · ${a[2]}B</button>`; })() : ""}</li>`).join("")}</ul>
            <p class="muted small">Missing education or infrastructure? Build schools and grid in the infrastructure panel, or fund workforce training. Each public investment raises this industry's strength and makes companies more interested.</p>
            ${suit.m < 0.35 ? `<p class="small c-against">No company will build this industry here.</p>` : `<button class="mini" data-act="courtfirm" data-k="${k}" ${G.ap < 3 || G.prospect ? "disabled" : ""}>Court a company · 3</button>`}</details>`;
    }).join("");
    return `<div class="era-banner"><b>YOUR GOVERNMENT</b> · What you run: your cabinet, the planet's infrastructure and its economy. Problems arrive in the <b>Agenda</b>; the money is in <b>Policy → Budget</b>.</div>
    <div class="cols"><div class="col-main">
        ${panel("💰 The money at a glance", `<div class="grid2"><div>${statRow("Planetary treasury", `${G.treasury.toFixed(1)}B`)}${statRow("This year", `${pr.net >= 0 ? "surplus" : "deficit"} ${Math.abs(pr.net).toFixed(1)}B`)}</div><div>${statRow("Total debt", `${totalDebt().toFixed(1)}B`)}${statRow("Credit rating", creditRating())}</div></div>
            <p class="small muted">Budget status: ${esc(pb.status)}. Capital program: ${pb.cip}B this year, ${G.cip.frozen ? "frozen" : `${G.cip.remaining.toFixed(1)}B uncommitted`}.</p>
            <button class="secondary" data-act="gobudget">Open the budget →</button>`)}
        ${requestsPanel()}
        ${cipPanel(true)}
        ${panel("🏗️ Planetary infrastructure", `<p class="small">What ${esc(world().name)} has, and what its population needs. Builds go into the capital program; you decide where they rank.</p><div class="infra-grid">${infra}</div>`)}
        ${panel("📈 Economic development", `<p class="small">Court companies to bring jobs and taxes. They weigh your workforce, your infrastructure and your offer.</p>
            ${p ? `<div class="bill-preview"><div class="record-title">NEGOTIATING</div><h3>${SECTORS[p.sector].icon} ${esc(p.firm)}</h3>
                <p class="small">A ${p.invest}B facility · ${p.jobs.toLocaleString()} jobs · they asked for ${p.asks.tax} tax-free years and a ${p.asks.grant}B grant.</p>
                ${p.demands && p.demands.length ? `<p class="small c-und"><b>${esc(p.ceo.name)} told you they need:</b> ${p.demands.map(esc).join("; ")}.</p>` : ""}
                ${!(p.ceo && p.ceo.met) ? `<button class="secondary" data-act="flyceo" ${G.ap < 2 ? "disabled" : ""}>✈️ Fly to ${esc(worldName(FIRM_HQ[p.firm] || "coruscant"))} and meet the CEO · 2 capital, 0.4M</button>` : ""}
                <div class="offer"><label>Tax holiday</label>${seg("tax", [0, 3, 5, 10], p.offer.tax, v => v ? `${v} yrs` : "none")}
                <label>Capital grant</label>${seg("grant", [0, 0.5, 1, 2, 3], p.offer.grant, v => v ? `${v}B` : "none")}
                <label>Local hiring requirement</label>${seg("hiring", [0, 50, 80], p.offer.hiring, v => v ? `${v}%` : "none")}
                <label>Extras</label><div class="seg small-seg"><button class="${p.offer.infra ? "on" : ""}" data-act="offer" data-f="infra">Build site roads & power (1B)</button><button class="${p.offer.waiver ? "on" : ""}" data-act="offer" data-f="waiver">Waive labour rules</button></div></div>
                <div class="grid2"><div>${statRow("Local jobs", ev.local.toLocaleString())}${statRow("Taxes once running", `${ev.annualTax.toFixed(2)}B/yr`)}</div><div>${statRow("Cost to you", `${ev.cost.toFixed(1)}B`)}${statRow("Cost per local job", `${Math.round(ev.perJob).toLocaleString()} cr`)}${statRow("Pays back in", ev.payback > 40 ? "never" : `${ev.payback.toFixed(1)} yrs`)}</div></div>
                ${ev.localShare < 0.6 ? '<p class="small c-und">Your workforce lacks the skills they need, so most jobs will go to offworlders — unless you require local hiring (which they dislike).</p>' : ""}
                <p>Chance they accept: <b>${ev.chance}%</b></p>
                <div class="row"><button class="primary" data-act="closedeal" ${G.ap < 4 ? "disabled" : ""}>Make the offer · 4</button><button class="secondary" data-act="dropdeal">Walk away</button></div></div>` : ""}
            <div class="sector-grid">${sectors}</div>
            <div class="row">${tact("train", "🔧 Fund workforce training", 3, "Education up; 0.5B over three years.")}<button class="secondary" data-act="gotrade">🚀 Trade missions & agreements →</button></div>
            ${(G.firms || []).length ? `<h4>Companies you brought here</h4>${G.firms.map(f => `<p class="small">${SECTORS[f.sector].icon} <b>${esc(f.firm)}</b> — ${f.open ? `${f.jobs.toLocaleString()} jobs${monthsNow() < f.taxFrom ? `, tax-free until ${eraYear(33 - Math.floor(f.taxFrom / 12))}` : ", paying taxes"}` : `opens in ${f.opens - monthsNow()} months`}</p>`).join("")}` : ""}`)}
    </div><div class="col-side">
        ${panel("🗂️ Your cabinet", cabinet)}
        ${panel("📜 Executive orders", `${tact("exec", "Declare a state of emergency", 5, "Unlocks wartime measures for 12 months.", 'data-t="emergency"')}${tact("exec", "Allocate emergency resources", 3, "2B from the treasury.", 'data-t="resources"')}${tact("exec", "Deploy planetary security", 3, "", 'data-t="security"')}`)}
    </div></div>`;
}


// ── The month ─────────────────────────────────────────────────────

function tickGovDesk() {
    initAdvisors(); initInfra(); initDebt();
    tickDebt();
    initSectors();
    tickFirms();
    tickRequests();
}
