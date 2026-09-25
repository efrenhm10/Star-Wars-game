// ── ENGINE — game state, derived values, and how effects ripple ─────
//
// Everything the player does goes through applyEffects(). A single decision
// can move constituencies, planetary conditions, galactic conditions, faction
// standing, institutions, the press and individual relationships at once —
// that is the whole point of the game.

let G = null;

const SAVE_KEY = "galactic-senate/v1";

const world = () => WORLDS[G.worldKey];
const office = () => G.office;
const kindInfo = () => KIND_INFO[G.office.kind];
const arena = () => {
    if (G.office.kind === "outsider") return G.office.sub === "Lobbyist" ? "senate" : "none";
    return kindInfo().arena;
};
const isElected = () => kindInfo().elected;
const canDecree = () => !!kindInfo().decree && !(G.office.kind === "monarch" && G.const.monarchy === "constitutional");
const constitution = () => (G.office.kind === "chancellor" || G.office.kind === "minister") ? G.galConst : G.const;
const dateStr = (y = G.year, m = G.month) => `${eraYear(33 - y)} · Month ${m}`;
const npc = id => G.npcs.find(n => n.id === id);
const livingNpcs = () => G.npcs.filter(n => n.alive);
const chancellor = () => G.chancellorId === "player" ? null : npc(G.chancellorId);
const monthsNow = () => (G.year - 1) * 12 + G.month;


// ── Derived values ─────────────────────────────────────────────────

function groupEntries() {
    return Object.entries(G.groups).filter(([, g]) => g.w > 0);
}

function approval() {
    let sum = 0, w = 0;
    groupEntries().forEach(([, g]) => { sum += g.a * g.w; w += g.w; });
    return w ? sum / w : 50;
}

function groupShare(key) {
    const total = groupEntries().reduce((s, [, g]) => s + g.w, 0);
    return total ? G.groups[key].w / total * 100 : 0;
}

// What a group *would* think of you, given only the state of the world.
function groupTarget(key) {
    const needs = GROUP_NEEDS[key];
    let s = 0, wsum = 0;
    Object.entries(needs).forEach(([stat, w]) => {
        s += w * (G.planet[stat] - 50);
        wsum += Math.abs(w);
    });
    let t = 50 + (s / wsum) * 0.6;
    if (key === "military" || key === "veterans") t += (G.gal.military - 50) * 0.25;
    if (key === "elders" || key === "youth") t -= Math.max(0, G.gal.war - 50) * 0.2;
    if (key === "traditional") t += (G.factions.traditionalists) * 0.05;
    // Challengers profit from bad conditions; incumbents are blamed for them.
    if (!G.office) return clamp(t, 5, 95);
    if (["opposition", "candidate", "movement", "outsider"].includes(G.office.kind)) t = 50 - (t - 50) * 0.5;
    // Governments are judged on their policies and the situations they preside over.
    if (governing()) t += policyGroupEffect(key) + situationGroupEffect(key);
    else if (G.situations) t += situationGroupEffect(key) * 0.4;
    t += (G.trust - 50) * 0.15;
    return clamp(t, 5, 95);
}

function influenceLabel(v = G.influence) {
    if (v < 20) return "limited";
    if (v < 40) return "modest";
    if (v < 60) return "considerable";
    if (v < 80) return "formidable";
    return "commanding";
}

function allies() { return livingNpcs().filter(n => n.rel >= 35); }
function rivals() { return livingNpcs().filter(n => n.rel <= -30); }

function termLeftLabel() {
    const o = G.office;
    if (o.termLeft == null) return KIND_INFO[o.kind].label;
    const left = Math.max(0, o.termLeft);
    const y = Math.floor(left / 12), m = left % 12;
    const parts = [];
    if (y) parts.push(`${y} yr${y > 1 ? "s" : ""}`);
    if (m) parts.push(`${m} mo`);
    return parts.join(" ") || "ends now";
}

// Political capital accumulates month to month (up to a cap), Democracy-style.
function capitalIncome() {
    const k = G.office.kind;
    if (k === "outsider" && ["Prisoner", "Exile"].includes(G.office.sub)) return 2;
    let inc = 6 + G.influence / 10;
    if (canDecree()) inc += G.inst.civil / 25;
    if (k === "chancellor") inc += 4;
    return Math.round(inc);
}

function capitalCap() { return G.office.kind === "chancellor" ? 40 : 30; }


// ── Effects ─────────────────────────────────────────────────────────

const SCALARS = {
    influence:   { name: "Influence" },
    funds:       { name: "Campaign funds", unit: "M cr", max: 999 },
    treasury:    { name: "Planetary treasury", unit: "B cr", max: 999, min: -50 },
    rep:         { name: "Reputation" },
    trust:       { name: "Public trust" },
    legitimacy:  { name: "Legitimacy" },
    indep:       { name: "Independence support" },
    unrest:      { name: "Unrest", bad: true },
    health:      { name: "Health" },
    consistency: { name: "Ideological consistency" },
    heat:        { name: "Scandal heat", bad: true },
    opp:         { name: "Opponent strength", bad: true }
};

function applyEffects(e, mult = 1) {
    if (!e) return [];
    const changes = [];
    const note = (label, d, bad = false) => {
        const r = Math.round(d * 10) / 10;
        if (Math.abs(r) >= 0.5) changes.push({ label, d: r, good: bad ? r < 0 : r > 0 });
    };

    Object.entries(e.g || {}).forEach(([k, v]) => {
        if (!G.groups[k] || G.groups[k].w <= 0) return;
        const before = G.groups[k].a;
        G.groups[k].a = clamp(before + v * mult, 2, 98);
        note(`${GROUPS[k].icon} ${GROUPS[k].name}`, G.groups[k].a - before);
    });

    Object.entries(e.p || {}).forEach(([k, v]) => {
        const before = G.planet[k];
        G.planet[k] = clamp(before + v * mult);
        note(`${PLANET_STATS[k].icon} ${PLANET_STATS[k].name}`, G.planet[k] - before, PLANET_STATS[k].bad);
    });

    Object.entries(e.gal || {}).forEach(([k, v]) => {
        const before = G.gal[k];
        G.gal[k] = clamp(before + v * mult);
        note(`${GAL_STATS[k].icon} ${GAL_STATS[k].name}`, G.gal[k] - before, GAL_STATS[k].bad);
    });

    Object.entries(e.f || {}).forEach(([k, v]) => {
        const before = G.factions[k];
        G.factions[k] = clamp(before + v * mult, -100, 100);
        note(`${FACTIONS[k].icon} ${FACTIONS[k].name}`, G.factions[k] - before);
        // The people in a faction feel it too.
        livingNpcs().filter(n => n.faction === k).forEach(n => { n.rel = clamp(n.rel + v * mult * 0.3, -100, 100); });
        // Acting against your own philosophy costs you consistency.
        if (k === G.ideology && v < 0) G.consistency = clamp(G.consistency + v * mult * 0.5);
        if (k === G.ideology && v > 0) G.consistency = clamp(G.consistency + v * mult * 0.15);
    });

    Object.entries(e.i || {}).forEach(([k, v]) => {
        const before = G.inst[k];
        G.inst[k] = clamp(before + v * mult);
        note(`${INSTITUTIONS[k].icon} ${INSTITUTIONS[k].name} trust`, G.inst[k] - before);
    });

    Object.entries(e.media || {}).forEach(([k, v]) => {
        const o = OUTLETS.find(x => x.key === k);
        G.media[k] = clamp(G.media[k] + v * mult, -50, 50);
        note(`📰 ${o.name}`, v * mult);
    });

    Object.entries(SCALARS).forEach(([k, def]) => {
        if (e[k] == null) return;
        const before = G[k];
        G[k] = clamp(before + e[k] * mult, def.min ?? (def.max ? 0 : 0), def.max ?? 100);
        const label = def.unit ? `${def.name} (${def.unit})` : def.name;
        note(label, G[k] - before, def.bad);
    });

    if (e.world) {
        const list = Array.isArray(e.world) ? e.world : [e.world];
        list.forEach(wd => {
            const s = G.galaxy[wd.key];
            if (!s) return;
            ["stability", "prosperity", "indep"].forEach(k => {
                if (wd[k] == null) return;
                const before = s[k];
                s[k] = clamp(before + wd[k] * mult);
                note(`🪐 ${worldName(wd.key)} ${k === "indep" ? "independence" : k}`, s[k] - before);
            });
        });
    }

    if (e.clans && G.clans) {
        G.clans.forEach(c => {
            const d = typeof e.clans === "number" ? e.clans : (e.clans[c.name] || 0);
            c.loyalty = clamp(c.loyalty + d * mult);
        });
        if (typeof e.clans === "number") note("⚔️ Clan loyalty", e.clans * mult);
        syncClanLegitimacy();
    }

    if (e.secret) addSecret(e.secret, e.secretHeat || 12);
    if (e.program) addProgram(e.program);

    return changes;
}

function worldName(key) {
    return (WORLDS[key] || BACKGROUND_WORLDS[key] || { name: key }).name;
}

function addSecret(text, heat = 12) {
    if (G.secrets.some(s => s.text === text)) return;
    G.secrets.push({ text, since: monthsNow(), exposed: false });
    G.heat = clamp(G.heat + heat);
}

function addProgram(p) {
    G.programs.push({ name: p.name, p: p.p || {}, g: p.g || {}, years: p.years || 10, left: p.years || 10, founder: G.name, started: G.year });
    log(`📐 Programme founded: ${p.name}. Its effects will be felt for ${p.years || 10} years.`, "legacy");
}

function syncClanLegitimacy() {
    if (!G.clans || G.office.kind !== "clan") return;
    const avg = G.clans.reduce((s, c) => s + c.loyalty, 0) / G.clans.length;
    G.legitimacy = clamp(G.legitimacy * 0.5 + avg * 0.5);
}


// ── The chronicle and consequence reports ──────────────────────────

function log(text, type = "event") {
    G.chronicle.unshift({ date: dateStr(), text, type });
    if (G.chronicle.length > 400) G.chronicle.length = 400;
}

function report(title, text, changes = []) {
    G.reports.unshift({ date: dateStr(), title, text, changes, month: monthsNow() });
    if (G.reports.length > 40) G.reports.length = 40;
    log(`${title}: ${text}`);
    // During the monthly simulation, reports are gathered rather than popped up one by one.
    if (quietReports) quietReports.push(title);
    else if (typeof toast === "function") toast(title, text, changes);
}

let quietReports = null;


// ── The press ──────────────────────────────────────────────────────

// After a decision, outlets react according to their own politics — the same
// act can be "historic" in one paper and "reckless" in another.
function publish(topic, fDelta = {}, force = false) {
    const who = G.name;
    OUTLETS.forEach(o => {
        const s = fDelta[o.lean] || 0;
        if (!s) return;
        if (!force && Math.abs(s) < 4 && !chance(35)) return;
        const tpl = pick(s > 0 ? HEADLINES_POS : HEADLINES_NEG);
        const text = tpl.replace("{name}", `${office().kind === "outsider" ? "" : office().title + " "}${lastName(who)}`).replace("{topic}", topic);
        G.news.unshift({ outlet: o.name, text, good: s > 0, date: dateStr() });
        G.media[o.key] = clamp(G.media[o.key] + s * 0.35, -50, 50);
        o.audience.forEach(a => { if (G.groups[a]) G.groups[a].a = clamp(G.groups[a].a + Math.sign(s) * 0.8, 2, 98); });
    });
    if (G.news.length > 60) G.news.length = 60;
}

function mediaMood() {
    const vals = Object.values(G.media);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
}


// ── NPCs ───────────────────────────────────────────────────────────

let npcCounter = 1;

function leanPick(lean) {
    const entries = Object.keys(FACTIONS).map(k => [k, (lean && lean[k] != null ? lean[k] : 0.6) + Math.random() * 1.2]);
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
}

function makeNpc(o) {
    const w = WORLDS[o.world];
    const sp = w ? pick(w.species) : pick(["human", "human", "human", "twilek", "zabrak", "rodian"]);
    const app = randomAppearance(sp);
    app.age = pick(["prime", "prime", "elder", "young"]);
    if (sp === "human" || sp === "zabrak") app.hair = pick(["short", "short", "bun", "long", "none", "curly"]);
    return Object.assign({
        app,
        id: `n${npcCounter++}`,
        name: randomName(o.world, sp),
        faction: leanPick((WORLDS[o.world] || {}).lean),
        rel: ri(-15, 15),
        influence: ri(20, 70),
        votes: ri(2, 4),
        memory: [],
        alive: true,
        endorsedTerm: -1
    }, o);
}

function remember(n, text) {
    n.memory.unshift(`${dateStr()}: ${text}`);
    if (n.memory.length > 8) n.memory.length = 8;
}

function changeRel(n, d, memory) {
    n.rel = clamp(n.rel + d, -100, 100);
    if (memory) remember(n, memory);
}

function worldSenator(key) {
    const id = G.galaxy[key] && G.galaxy[key].senatorId;
    return id && id !== "player" ? npc(id) : null;
}


// ── New career ─────────────────────────────────────────────────────

function newCareer({ worldKey, roleIndex, name, ideology, app }) {
    const w = WORLDS[worldKey];
    const role = w.roles[roleIndex];
    npcCounter = 1;

    G = {
        v: 1,
        worldKey, name, ideology, app: app || randomAppearance(WORLDS[worldKey].species[0]),
        year: 1, month: 1,
        age: ri(34, 48),
        health: ri(80, 95),
        influence: role.influence ?? (role.kind === "local" ? 10 : 28),
        funds: role.funds ?? 4,
        treasury: 20,
        rep: 60, trust: 55, consistency: 75, legitimacy: 60, heat: 0,
        indep: w.traits.includes("frontier") || w.traits.includes("indigenous") || w.traits.includes("clans") ? 32 : 15,
        unrest: 20, opp: 50,
        ap: 10, endorsements: 0,
        const: JSON.parse(JSON.stringify(w.const)),
        galConst: JSON.parse(JSON.stringify(GALACTIC_CONST)),
        groups: {}, planet: { ...w.planet },
        gal: { trade: 55, war: 30, military: 45, refugees: 25, diplomacy: 62 },
        factions: {}, inst: {}, media: {},
        news: [], reports: [], chronicle: [], inbox: [], scenes: [],
        npcs: [], galaxy: {},
        bills: [], billCounter: ri(600, 800), usedBills: {},
        obligations: [], promises: [], donors: {}, grantUsedTerm: -1,
        programs: [], secrets: [], dynasty: [], amendments: [], amendment: null,
        family: makeFamily(),
        clans: w.clans ? w.clans.map(c => ({ name: c, loyalty: ri(35, 70) })) : null,
        chancellorId: null, chancTermLeft: 60,
        autocrat: false, lastEvents: {}, generation: 1,
        chiefOfStaff: randomName(worldKey),
        termIndex: 0, careerStart: 1, officesHeld: []
    };

    initPolicies();

    Object.keys(FACTIONS).forEach(k => { G.factions[k] = k === ideology ? 30 : ri(-10, 10); });
    Object.keys(INSTITUTIONS).forEach(k => { G.inst[k] = ri(42, 60); });
    OUTLETS.forEach(o => { G.media[o.key] = (o.lean === ideology ? 12 : 0) + ri(-6, 6); });

    Object.keys(GROUPS).forEach(k => {
        const wgt = w.groups[k] != null ? w.groups[k] : 1;
        G.groups[k] = { w: wgt, a: ri(42, 62), prev: 0 };
    });
    Object.keys(G.groups).forEach(k => { G.groups[k].a = clamp(G.groups[k].a * 0.5 + groupTarget(k) * 0.5, 5, 95); G.groups[k].prev = G.groups[k].a; });

    if (role.approval) {
        const shift = role.approval - approval();
        Object.values(G.groups).forEach(g => { g.a = clamp(g.a + shift, 5, 95); g.prev = g.a; });
    }


    buildGalaxy(role);
    initHistory();
    buildLocalFigures(role);
    seedRelationships();

    setOffice(makeOffice(role), { silent: true });
    if (role.startLeft && G.office.termLeft != null) G.office.termLeft = role.startLeft;
    initCommittees();

    G.dynasty.push({ name, generation: 1, from: G.year, offices: [role.title], end: null, legacy: [] });

    log(`32 BBY. ${name} begins a political career on ${w.name} as ${role.title}. ${w.intro}`, "career");
    spawnBill(arena() === "none" ? "senate" : arena());
    if (arena() === "local") spawnBill("senate");
    seedInbox();
}

function makeFamily() {
    const fam = { spouse: null, children: [] };
    if (chance(70)) fam.spouse = { name: `${pick(FIRST_NAMES)}`, alive: true };
    const n = ri(0, 3);
    for (let i = 0; i < n; i++) fam.children.push({ name: pick(FIRST_NAMES), age: ri(2, 22), alive: true, inPolitics: false });
    return fam;
}

function buildGalaxy(role) {
    const all = { ...WORLDS, ...BACKGROUND_WORLDS };
    const displaced = role && role.canonHolder;
    Object.entries(all).forEach(([key, w]) => {
        const s = {
            stability: w.const ? w.const.stability + ri(-8, 8) : ri(35, 70),
            prosperity: w.planet ? Math.round((w.planet.employment + w.planet.infrastructure + (100 - w.planet.inequality)) / 3) : ri(30, 60),
            indep: (w.traits || []).some(t => ["frontier", "clans", "indigenous"].includes(t)) ? ri(20, 45) : ri(5, 20),
            independent: false,
            senatorId: null
        };
        G.galaxy[key] = s;
        if (w.canonAlign === "hutt") return;
        // Canon senators hold their real seats.
        const canonSeat = canonSeatFor(key);
        const playerTakesSeat = key === G.worldKey && role && role.kind === "senator";
        if (canonSeat) {
            const [ck] = canonSeat;
            const n = makeCanonNpc(ck, playerTakesSeat ? { displaced: true, arena: "galactic" } : {});
            G.npcs.push(n);
            if (!playerTakesSeat) { s.senatorId = n.id; return; }
            return;
        }
        if (playerTakesSeat) return;
        const sen = makeNpc({ world: key, title: `Senator of ${w.name}`, arena: "senate" });
        G.npcs.push(sen);
        s.senatorId = sen.id;
    });
    // Other canon figures active in 32 BBY: the Chancellor, Vice Chair, Trade Federation, banks, Jedi.
    Object.entries(CANON).forEach(([k, c]) => {
        if (c.seat || c.from < 32 || G.npcs.some(n => n.canon === k)) return;
        if (c.arena === "local") { if (c.world !== G.worldKey) G.npcs.push(makeCanonNpc(k, { arena: "galactic" })); return; }
        G.npcs.push(makeCanonNpc(k));
    });
    const val = canonNpc("valorum");
    G.chancellorId = val ? val.id : null;
}

function buildLocalFigures(role) {
    const w = world();
    // Canon characters of your own world, in their real offices (or displaced by you).
    Object.entries(CANON).forEach(([k, c]) => {
        if (c.world !== G.worldKey || c.arena !== "local" || c.from < 32) return;
        const displaced = role && role.canonHolder === k;
        G.npcs.push(makeCanonNpc(k, displaced ? { displaced: true } : {}));
    });
    const have = livingNpcs().filter(n => n.arena === "local").length;
    const titles = w.clans
        ? w.clans.map(c => `Head of Clan ${c}`)
        : ["Speaker of the Legislature", "Leader of the Opposition", "Finance Committee Chair", "Labour Caucus Chair", "Security Committee Chair"];
    titles.slice(0, Math.max(2, 6 - have)).forEach(t => G.npcs.push(makeNpc({ world: G.worldKey, title: t, arena: "local", votes: ri(3, 6) })));
    // The world's senator (if the player isn't it and no canon senator exists).
    if (!G.galaxy[G.worldKey].senatorId && !(role && role.kind === "senator") && w.canonAlign !== "hutt") {
        const sen = makeNpc({ world: G.worldKey, title: `Senator of ${w.name}`, arena: "senate" });
        G.npcs.push(sen);
        G.galaxy[G.worldKey].senatorId = sen.id;
    }
}

function seedRelationships() {
    const pool = shuffle(livingNpcs().filter(n => n.id !== G.chancellorId && !n.canon && ["senate", "local"].includes(n.arena)));
    pool.slice(0, 4).forEach(n => { n.rel = ri(40, 60); remember(n, pick(["Supported your first campaign.", "An old friend from your early days in politics.", "Owes you for a committee vote years ago.", "Shares your philosophy and your enemies."])); });
    pool.slice(4, 7).forEach(n => { n.rel = ri(-60, -38); remember(n, pick(["You defeated their protégé in an election.", "You publicly mocked their bill.", "Blames you for a scandal that ended a friend's career.", "Sees you as a threat to their ambitions."])); });
}


// ── Offices ────────────────────────────────────────────────────────

function makeOffice(spec) {
    const c = G.const;
    const o = { title: spec.title, kind: spec.kind, desc: spec.desc || "", termsServed: 0, termLeft: null, termLimit: 0, termYears: 0 };
    if (spec.rung != null) o.rung = spec.rung;
    if (spec.kind === "local") { o.rung = spec.rung ?? 0; o.termYears = spec.term || 2; o.termLimit = spec.limit ?? 0; }
    if (spec.kind === "senator") { o.termYears = c.senateTerm; o.termLimit = c.senateLimit; o.rung = 3; }
    if (spec.kind === "executive" || spec.kind === "monarch") { o.termYears = spec.term || c.execTerm; o.termLimit = spec.limit ?? c.execLimit; }
    if (spec.kind === "chancellor") { o.termYears = G.galConst.execTerm; o.termLimit = G.galConst.execLimit; }
    if (o.termYears) o.termLeft = spec.fresh ? o.termYears * 12 : ri(Math.round(o.termYears * 12 * 0.4), o.termYears * 12);
    if (spec.kind === "opposition" || spec.kind === "candidate") {
        o.target = typeof spec.target === "number" ? { ...world().roles[spec.target] } : spec.target;
        o.termLeft = spec.months ?? ri(10, 24);
    }
    if (spec.kind === "outsider") { o.sub = spec.sub; o.timer = spec.timer || 0; }
    if (spec.kind === "minister") o.ministry = spec.ministry;
    return o;
}

function setOffice(o, { silent = false } = {}) {
    const prev = G.office;
    G.office = o;
    // Taking the planet's Senate seat retires whoever held it; leaving it creates a successor.
    const home = G.galaxy[G.worldKey];
    const holdsSeat = o.kind === "senator";
    if (holdsSeat && home.senatorId !== "player") {
        const old = npc(home.senatorId);
        if (old) { old.arena = old.canon ? "galactic" : "retired"; old.title = old.canon ? (CANON[old.canon].alt || `Former Senator of ${world().name}`) : `Former Senator of ${world().name}`; }
        home.senatorId = "player";
    } else if (!holdsSeat && home.senatorId === "player" && G.allegiance !== "hutt") {
        const sen = makeNpc({ world: G.worldKey, title: `Senator of ${world().name}`, arena: "senate", rel: ri(-20, 10) });
        G.npcs.push(sen);
        home.senatorId = sen.id;
    }
    if (o.kind === "chancellor") G.chancellorId = "player";
    else if (prev && prev.kind === "chancellor" && G.chancellorId === "player") G.chancellorId = null;
    if (!G.officesHeld.includes(o.title) && o.kind !== "outsider" && o.kind !== "candidate") G.officesHeld.push(o.title);
    const d = G.dynasty[G.dynasty.length - 1];
    if (d && !d.offices.includes(o.title)) d.offices.push(o.title);
    if (G.record) {
        const last = G.record.offices[G.record.offices.length - 1];
        if (last && last.to == null) last.to = currentBBY();
        if (o.kind !== "candidate") G.record.offices.push({ title: o.title, world: world().name, from: currentBBY(), to: null, name: G.name });
    }
    if (!silent) log(`${G.name} becomes ${o.title}.`, "career");
}


// ── Save / load ────────────────────────────────────────────────────

function saveGame() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({ G, npcCounter }));
        return true;
    } catch (e) {
        return false;
    }
}

function loadGame() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        G = data.G;
        npcCounter = data.npcCounter || 1000;
        return true;
    } catch (e) {
        return false;
    }
}

function hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
}

function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* storage unavailable */ }
}
