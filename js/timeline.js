// ── HISTORY — the Star Wars timeline, allegiance and war ────────────
//
// Two timelines run together. The canon backbone (the Naboo blockade,
// Palpatine's rise, Geonosis, Order 66, the Empire, Yavin, Endor) happens
// on schedule. Adaptive events start from canon but bend to what the player
// has done (Mon Cala's civil war, Onderon, Mandalore). Everything else —
// the player's laws, grudges, appropriations and allegiances — is their own
// history, recorded as they go.

// ── Calendar ─────────────────────────────────────────────────────
// Game year 1 is 32 BBY.
const currentBBY = () => 33 - G.year;
const eraYear = bby => bby > 0 ? `${bby} BBY` : bby === 0 ? "0 BBY" : `${-bby} ABY`;
const yearLabel = gameYear => eraYear(33 - gameYear);

const ERAS = {
    republic: { name: "Act I — The Republic", note: "The Senate functions. Trade disputes simmer. Your world's own problems come first." },
    crisis:   { name: "Act II — The Separatist Crisis", note: "Worlds are leaving. Citizens ask: why are we still in the Republic?" },
    war:      { name: "Act III — The Clone Wars", note: "War changes every government it touches." },
    empire:   { name: "Act IV — The Galactic Empire", note: "The Republic is gone. What are you willing to sacrifice?" },
    rebellion:{ name: "Act V — Rebellion", note: "The Senate is dissolved. The galaxy chooses sides." },
    newrepublic: { name: "Act VI — The New Republic", note: "Rebuilding democracy from the ruins." }
};

// ── Role categories (who sees which version of a historical moment) ──
function roleCat() {
    const k = G.office.kind;
    if (["senator", "minister", "chancellor"].includes(k)) return "senate";
    if (["executive", "council", "monarch", "hereditary", "traditional", "clan"].includes(k)) return "gov";
    if (k === "local") return "local";
    return "street";
}

function isMonarch() { return ["monarch", "hereditary"].includes(G.office.kind); }

// How much a role gets to know. Governors know their own numbers; senators get
// summaries; the Chancellor and the Intelligence Committee see classified material.
function intelLevel() {
    const k = G.office.kind;
    if (k === "chancellor" || (G.committees && G.committees.includes("intelligence"))) return "classified";
    if (["executive", "council", "monarch", "hereditary", "local", "traditional", "clan"].includes(k)) return "exact";
    return "vague";
}

function recordVote(title, vote) {
    G.record.keyVotes.push({ title, vote, year: currentBBY() });
}


// ── Planetary opinion: Republic loyalists vs Separatists ──────────

function initHistory() {
    const w = world();
    G.opinion = { loyal: clamp(w.republic * 0.75), sep: w.sep };
    if (G.opinion.loyal + G.opinion.sep > 95) G.opinion.loyal = 95 - G.opinion.sep;
    G.allegiance = w.canonAlign === "hutt" ? "hutt" : "republic";
    G.era = "republic";
    G.war = false;
    G.siege = null;
    G.occupied = null;
    G.garrison = 0;
    G.supplies = { food: 100, medicine: 100, fuel: 100 };
    G.warRecord = 0;
    G.liberties = 0;
    G.repCorruption = 40;
    G.hist = {};
    G.petition = null;
    G.chancLocked = false;
    G.rebellion = 0;
    G.imperial = null;
    G.secretRebel = false;
    G.emergencyDeclared = 0;
    G.record = { billsIntroduced: 0, billsPassed: 0, appropriations: 0, keyVotes: [], agreements: [], arrests: [], offices: [] };
    Object.entries(G.galaxy).forEach(([k, s]) => { s.align = (WORLDS[k] || BACKGROUND_WORLDS[k]).canonAlign === "hutt" ? "hutt" : "republic"; });
}

function tickOpinion() {
    const w = world();
    const p = G.planet;
    const hardship = Math.max(0, 50 - (p.employment + p.healthcare + p.housing) / 3) * 0.6;
    const outer = w.region !== "core" ? 1 : 0.4;
    let target = w.sep + hardship + (G.repCorruption - 40) * 0.25 * outer + (G.factions.independence) * 0.05;
    if (G.siege && G.siege.blockade) target += 10;
    if (["crisis", "war"].includes(G.era)) target += 6 * outer;
    if (G.occupied) target += G.occupied.by === "Republic" ? 20 : -20;
    if (G.aidMonths > 0) { target -= 8; G.aidMonths--; }
    if (G.allegiance === "separatist") target += 10;
    if (G.era === "empire" || G.era === "rebellion") target = 10 + G.liberties * 0.2;
    const neutral = w.canonAlign === "neutral" ? 28 : 16;
    G.opinion.sep = clamp(G.opinion.sep + (clamp(target) - G.opinion.sep) * 0.05);
    G.opinion.loyal = clamp(G.opinion.loyal + (clamp(100 - G.opinion.sep - neutral) - G.opinion.loyal) * 0.05);
    if (G.opinion.loyal + G.opinion.sep > 100) G.opinion.loyal = 100 - G.opinion.sep;
}


// ── War on your world: attacks, blockades, occupation ─────────────

function defenseStrength() {
    const w = world();
    const pol = G.policies;
    let d = w.ratings.military * 7 + pol.defence_force.eff * 35 + G.garrison + (G.fortify || 0);
    if (pol.conscription) d += pol.conscription.eff * 25 + pol.martial_law.eff * 10;
    if (/Military|Royal|Clan|KDY|Guard/i.test(G.const.militaryControl)) d += 6;
    return Math.round(d);
}

function startSiege(by, str, blockade = true, text = null) {
    if (G.siege || G.occupied) return;
    G.siege = { by, str: Math.round(str), months: 0, blockade };
    report(`🚨 ${world().name} under attack`, text || `${by} forces have entered the ${world().name} system.${blockade ? " A blockade cuts off imports of food, medicine and fuel." : ""} Local defence strength: ${defenseStrength()}.`);
    frontScene("attacked", {});
}

function supplyReport() {
    const s = G.supplies;
    const lvl = intelLevel();
    if (lvl === "vague") {
        const worst = Math.min(s.food, s.medicine, s.fuel);
        return worst > 70 ? "The government reports supplies holding." : worst > 40 ? "The government reports serious shortages." : "The government reports a critical shortage of food and medicine.";
    }
    const days = v => Math.max(0, Math.round(v * 0.45));
    return `Food reserves: ${days(s.food)} days · Medical supplies: ${Math.round(s.medicine)}% · Fuel: ${Math.round(s.fuel)}%. Food prices +${Math.round((100 - s.food) * 0.6)}%.`;
}

function tickWar() {
    const w = world();
    if (G.garrison > 0) G.garrison = Math.max(0, G.garrison - 1.5);

    // Supplies recover when the lanes are open.
    const blockaded = G.siege && G.siege.blockade;
    ["food", "medicine", "fuel"].forEach((k, i) => {
        G.supplies[k] = clamp(G.supplies[k] + (blockaded ? -[8, 7, 9][i] : 5));
    });
    if (blockaded) {
        const s = G.supplies;
        const short = (300 - s.food - s.medicine - s.fuel) / 300;
        applyEffects({ p: { healthcare: -short * 2, employment: -short * 1.5 }, g: { urban: -short * 3, elders: -short * 3, workers: -short * 2 }, unrest: short * 4 });
    }

    // New attacks.
    if (G.war && !G.siege && !G.occupied && G.allegiance !== "hutt") {
        const regionRisk = { core: 0.6, mid: 1.6, outer: 2.6 }[w.region];
        let p = G.allegiance === "neutral" ? regionRisk * 0.5 : regionRisk;
        if (w.ratings.military >= 4 || w.ratings.industry >= 5) p += 0.8;
        if (chance(p)) {
            const by = G.allegiance === "separatist" ? "Republic" : "Separatist";
            startSiege(by, 35 + rnd(0, 45) + (G.gal.war - 60) * 0.3, chance(70));
        }
    }

    // An ongoing siege.
    if (G.siege) {
        const s = G.siege;
        s.months++;
        const def = defenseStrength();
        if (def * rnd(0.7, 1.3) > s.str) {
            G.warRecord++;
            report("⚔️ Attack repelled", `${w.name}'s defenders break the ${s.by} assault after ${s.months} month${s.months > 1 ? "s" : ""}.`, applyEffects({ g: { military: 6, veterans: 4, elders: 3 }, trust: 4, rep: 2 }));
            G.record.agreements.push(`Repelled the ${s.by} attack on ${w.name} (${eraYear(currentBBY())})`);
            G.siege = null;
        } else if (chance(8)) {
            report("The enemy withdraws", `${s.by} forces pull back from ${w.name} — for now.`);
            G.siege = null;
        } else {
            applyEffects({ p: { infrastructure: -2, housing: -1, employment: -1 }, g: { elders: -1, urban: -1 } });
            s.str += 2;
            if (s.months >= 3 && s.str > def * 1.3 && chance(30)) occupy(s.by);
        }
    }

    if (G.occupied) {
        G.occupied.months = (G.occupied.months || 0) + 1;
        applyEffects({ p: { employment: -1, crime: 1, infrastructure: -1 }, unrest: 2 });
        if (chance(4 + G.garrison / 5) || G.occupied.months > 30) {
            report("🎉 Liberation", `${w.name} is liberated after ${G.occupied.months} months of occupation.`, applyEffects({ g: { military: 5, youth: 5, elders: 5 }, trust: 6, legitimacy: 10 }));
            G.occupied = null;
        }
    }

    // Emergency measures leave a grievance that outlives the war.
    const pol = G.policies;
    const restrictive = pol.surveillance.eff + (pol.censorship ? pol.censorship.eff + pol.martial_law.eff + pol.conscription.eff : 0);
    if (restrictive > 0.2) G.liberties = clamp(G.liberties + restrictive * 1.2);
    else G.liberties = clamp(G.liberties - 3);
    if (!G.war && !G.siege && G.liberties > 40 && chance(10) && !G.inbox.some(d => d.id === "rights_back")) addDossier("rights_back", {});
    if (G.emergencyDeclared > 0) G.emergencyDeclared--;
}

function occupy(by) {
    const w = world();
    G.siege = null;
    G.occupied = { by, months: 0 };
    report(`🏴 ${w.name} occupied`, `${by} forces occupy ${w.name}. The planetary government operates under enemy guns.`, applyEffects({ legitimacy: -20, trust: -8, g: { military: -8, elders: -6, youth: -6 }, p: { employment: -5, infrastructure: -5 } }));
    frontScene("occupation", { by });
}

function startPetition() {
    const w = world();
    if (G.petition) return toast("Petition already before the Senate", "Your request for assistance is still being debated.");
    if (!(G.siege || G.occupied)) return toast("No emergency", "There is nothing to petition for right now.");
    if (G.office.kind === "local") return toast("You do not possess this authority", `Only the planetary government can petition the Senate. Petition the government of ${w.name} instead.`);
    const cost = G.office.kind === "senator" ? 3 : 4;
    if (!spendAP(cost)) return;
    const body = G.allegiance === "separatist" ? "Separatist Parliament" : "Galactic Senate";
    const b = createBill(`petition_${G.worldKey}`, G.office.kind === "senator" ? "player" : "floor", {
        arena: "senate", title: `Emergency Defense of ${w.name} Act`, desc: `Republic military assistance for ${w.name}, requested by its government.`,
        stance: { militarists: 2, centralists: 2, reformers: 0, federalists: 1, corporatists: -1, independence: -1, traditionalists: 0 }, g: { military: 3, elders: 3 }
    });
    b.petition = true;
    b.playerVote = "for";
    b.voteIn = 2;
    const sen = worldSenator(G.worldKey);
    if (G.office.kind !== "senator") b.momentum += sen ? sen.rel / 8 : -4;
    G.petition = { billId: b.id, since: monthsNow() };
    report("Petition submitted", `Your request goes to the ${body}. Now you have to fight for it: find sponsors, satisfy the committees, persuade the Chancellor's office. Meanwhile, the attack continues.`);
    ["sponsor_trade", "sponsor_humanitarian", "sponsor_cost"].forEach(id => addDossier(id, { billId: b.id }));
    render();
}

function resolvePetition(b, passed) {
    G.petition = null;
    const w = world();
    if (passed) {
        const humanitarian = b.humanitarianOnly;
        if (humanitarian) {
            G.supplies = { food: 90, medicine: 90, fuel: 80 };
            G.aidMonths = 12;
            report("Humanitarian relief approved", `The Senate sends supplies — but no warships — to ${w.name}.`);
        } else {
            G.garrison += 45;
            G.aidMonths = 12;
            const jedi = pick(["kenobi", "anakin", "ahsoka"].map(canonNpc).filter(Boolean));
            if (jedi) changeRel(jedi, 10, `Commanded the Republic relief force sent to ${w.name}.`);
            report("🚀 Republic task force dispatched", `The Senate approves military assistance.${jedi ? ` ${jedi.name} arrives with a clone battalion.` : ""} Defence strength rises to ${defenseStrength()}.`, applyEffects({ trust: 4, g: { military: 4, elders: 4 } }));
            G.record.agreements.push(`Secured Republic military assistance for ${w.name} (${eraYear(currentBBY())})`);
        }
    } else {
        frontScene("petition_denied", {});
    }
}


// ── The timeline ──────────────────────────────────────────────────

const HISTORY = [
    { bby: 32, m: 1, id: "trade_tax", run: () => {
        const b = createBill("trade_route_tax", null, { arena: "senate", title: "Taxation of Trade Routes Act", desc: "Taxes the outlying trade routes — and the Trade Federation's profits.",
            stance: { centralists: 2, reformers: 1, corporatists: -3, federalists: -1, independence: -1, militarists: 0, traditionalists: 0 }, g: { business: -3, elites: -2, workers: 1 }, gal: { trade: -4 } });
        b.voteIn = 4;
        report("📜 The trade route crisis", "The Senate debates taxing the outlying trade routes. The Trade Federation is furious.");
        if (roleCat() === "senate") addDossier("gunray_bribe", {});
    } },
    { bby: 32, m: 3, id: "blockade", run: () => {
        G.galaxy.naboo.stability = clamp(G.galaxy.naboo.stability - 25);
        if (G.worldKey === "naboo") { startSiege("Trade Federation", 60, true, "The Trade Federation has established a blockade around Naboo. Its droid army is massing."); return; }
        frontScene("hist_blockade", {});
    } },
    { bby: 32, m: 5, id: "no_confidence", run: () => { makePalpatineChancellor(); frontScene("hist_no_confidence", {}); } },
    { bby: 32, m: 7, id: "naboo_battle", run: () => {
        G.galaxy.naboo.stability = clamp(G.galaxy.naboo.stability + 25);
        if (G.worldKey === "naboo") {
            if (G.siege || G.occupied) {
                G.siege = null; G.occupied = null;
                const nass = canonNpc("nass");
                if (nass) changeRel(nass, 15, "Fought alongside the Gungans at the Battle of Naboo.");
                report("⚔️ The Battle of Naboo", "Naboo and Gungan forces, together, break the Trade Federation's occupation. The droid control ship is destroyed.", applyEffects({ g: { traditional: 8, military: 6, youth: 5 }, trust: 6, legitimacy: 12 }));
                G.warRecord += 2;
            }
        } else report("⚔️ The Battle of Naboo", "Naboo is liberated. The Trade Federation's viceroy faces trial.");
        const g = canonNpc("gunray"); if (g) g.influence = clamp(g.influence - 15);
    } },
    { bby: 31, m: 4, id: "gunray_trials", run: () => addDossier("gunray_trial", {}) },
    { bby: 29, m: 6, id: "palpatine_meeting", run: () => { if (roleCat() === "senate") addDossier("palpatine_meeting", {}); } },
    { bby: 28, m: 3, id: "banking_scandal", run: () => {
        G.repCorruption = clamp(G.repCorruption + 10);
        report("💸 Banking Clan loan scandal", "Senators across the Republic are exposed taking cheap loans from the InterGalactic Banking Clan. Outer Rim worlds ask what the Republic is for.");
    } },
    { bby: 26, m: 9, id: "outer_neglect", run: () => {
        Object.entries(G.galaxy).forEach(([k, s]) => { if (((WORLDS[k] || BACKGROUND_WORLDS[k]).region) === "outer") s.indep = clamp(s.indep + 8); });
        report("🌵 The Outer Rim is angry", "A decade of neglect and corruption has convinced millions in the Outer Rim that the Republic will never help them.");
        if (roleCat() === "senate") addDossier("padme_aid", {});
    } },
    { bby: 24, m: 1, id: "amidala_senator", run: () => {
        const p = canonNpc("amidala");
        if (p) {
            p.title = G.galaxy.naboo.senatorId === "player" ? "Representative of Naboo" : "Senator of Naboo"; p.arena = "senate"; p.votes = 4;
            if (G.galaxy.naboo.senatorId !== "player") {
                const old = worldSenator("naboo");
                if (old && old !== p) { old.arena = "retired"; old.title = "Former Senator of Naboo"; }
                G.galaxy.naboo.senatorId = p.id;
            }
            report("Padmé Amidala joins the Senate", "Her reign as Queen over, Padmé Amidala becomes Senator of Naboo.");
        }
    } },
    { bby: 24, m: 6, id: "separatist_crisis", run: () => {
        G.era = "crisis";
        const d = canonNpc("dooku") || (G.npcs.push(makeCanonNpc("dooku")), canonNpc("dooku"));
        ["raxus", "serenno", "muunilinst", "skako", "neimoidia"].forEach(k => { if (G.galaxy[k]) G.galaxy[k].align = "separatist"; });
        applyEffects({ gal: { war: 15, diplomacy: -10 } });
        report("🔥 The Separatist Crisis", "Count Dooku calls on worlds to leave the Republic and form a Confederacy of Independent Systems. Hundreds answer.");
        G.opinion.sep = clamp(G.opinion.sep + 8);
        const w = world();
        if (G.allegiance !== "hutt" && (w.region === "outer" || G.opinion.sep >= 20 || ["independence", "federalists"].includes(G.ideology))) addDossier("dooku_approach", {});
    } },
    { bby: 24, m: 11, id: "term_extension", run: () => { G.chancLocked = true; frontScene("hist_term_extension", {}); } },
    { bby: 23, m: 3, id: "loyalist_committee", run: () => { if (roleCat() === "senate") addDossier("loyalist_committee", {}); } },
    { bby: 23, m: 9, id: "secessions", run: () => {
        ["geonosis", "mustafar", "sullust", "umbara", "felucia"].forEach(k => { if (G.galaxy[k] && k !== G.worldKey) G.galaxy[k].align = "separatist"; });
        applyEffects({ gal: { war: 10 } });
        report("Thousands of systems secede", "The Confederacy grows. The Senate debates whether the Republic needs an army.");
        if (G.opinion.sep >= 45 && G.allegiance === "republic") frontScene("hist_allegiance", {});
    } },
    { bby: 22, m: 2, id: "military_creation", run: () => {
        const b = createBill("military_creation", null, { arena: "senate", title: "Military Creation Act", desc: "Creates a Grand Army of the Republic to deal with the Separatist threat.",
            stance: { militarists: 3, centralists: 2, corporatists: 1, reformers: -3, federalists: -1, independence: -3, traditionalists: 0 }, g: { military: 6, veterans: 3, students: -5, youth: -4 }, gal: { military: 10, war: 4 } });
        b.voteIn = 3; b.keyVote = true;
        report("📜 The Military Creation Act", "The Senate will vote on creating an army. Senator Amidala leads the opposition.");
        if (roleCat() === "senate") addDossier("padme_mca", {});
    } },
    { bby: 22, m: 3, id: "amidala_attack", run: () => report("💥 Assassination attempt", "A bomb destroys Senator Amidala's ship on a Coruscant landing platform. She survives; her decoy does not.") },
    { bby: 22, m: 4, id: "emergency_ask", run: () => { if (roleCat() === "senate") addDossier("palpatine_emergency", {}); } },
    { bby: 22, m: 5, id: "emergency_powers", run: () => { G.galConst.emergency = true; G.chancLocked = true; frontScene("hist_emergency_powers", {}); } },
    { bby: 22, m: 6, id: "geonosis", run: () => {
        G.era = "war"; G.war = true;
        applyEffects({ gal: { war: 30, military: 20, diplomacy: -15, trade: -10 } });
        ["geonosis"].forEach(k => { if (k !== G.worldKey) G.galaxy[k].align = "separatist"; });
        ["kenobi", "anakin", "ahsoka"].forEach(k => { if (!canonNpc(k)) G.npcs.push(makeCanonNpc(k)); });
        frontScene("hist_geonosis", {});
    } },
    { bby: 22, m: 8, id: "which_side", run: () => {
        const w = world();
        if (G.allegiance === "hutt") return;
        if (G.opinion.sep >= 25 || w.canonAlign !== "republic" || G.allegiance === "neutral") frontScene("hist_allegiance", {});
    } },
    { bby: 21, m: 2, id: "christophsis", run: () => { G.galaxy.christophsis.stability = clamp(G.galaxy.christophsis.stability - 20); report("⚔️ Battle of Christophsis", "Republic forces break a Separatist blockade of Christophsis."); } },
    { bby: 21, m: 4, id: "ryloth", run: () => {
        if (G.worldKey === "ryloth") { if (G.allegiance !== "separatist") startSiege("Separatist", 70, true, "Separatist forces under Wat Tambor invade Ryloth. The droid army is burning villages."); return; }
        G.galaxy.ryloth.stability = clamp(G.galaxy.ryloth.stability - 30);
        report("⚔️ Ryloth invaded", "Separatists occupy Ryloth. Cham Syndulla's fighters resist; the Republic prepares a counter-attack.");
        if (roleCat() === "senate") addDossier("ryloth_relief", {});
    } },
    { bby: 21, m: 6, id: "moncala", run: () => {
        const k = canonNpc("kolina");
        if (k && G.office.canonDisplaced !== "kolina") { k.alive = false; }
        if (G.worldKey === "moncala") { frontScene("hist_moncala", {}); return; }
        const lc = canonNpc("leechar"); if (lc) { lc.title = "King of Mon Cala"; lc.influence += 20; }
        G.galaxy.moncala.stability = clamp(G.galaxy.moncala.stability - 25);
        report("⚔️ Civil war on Mon Cala", "King Yos Kolina is assassinated. Separatist-backed Quarren rise against the young Prince Lee-Char.");
    } },
    { bby: 21, m: 8, id: "kamino_attack", run: () => {
        if (G.worldKey === "kamino") { startSiege("Separatist", 65, false, "A Separatist fleet attacks Kamino, aiming at the cloning facilities."); return; }
        report("⚔️ Attack on Kamino", "The Separatists strike at Kamino's cloning facilities and are driven off.");
    } },
    { bby: 21, m: 10, id: "banking", run: () => {
        const b = createBill("banking_dereg", null, { arena: "senate", title: "Banking Clan Deregulation Act", desc: "Deregulates the Banking Clan to fund the war — and hands the Chancellor control of the banks.",
            stance: { corporatists: 3, centralists: 2, militarists: 1, reformers: -2, federalists: -2, independence: -2, traditionalists: 0 }, g: { business: 4, elites: 4, workers: -3 }, gal: { trade: 4 } });
        b.keyVote = true;
        report("📜 Banking deregulation", "The war is bankrupting the Republic. The Chancellor's allies propose deregulating the Banking Clan.");
    } },
    { bby: 21, m: 11, id: "farr", run: () => { const f = canonNpc("farr"); if (f) { f.alive = false; report("Senator Onaconda Farr is poisoned", "The Rodian senator is murdered in his office. Rodia, starving, had been tempted by the Separatists."); } } },
    { bby: 20, m: 3, id: "onderon", run: () => {
        if (G.worldKey === "onderon") { frontScene("hist_onderon", {}); return; }
        G.galaxy.onderon.align = "separatist";
        report("👑 Coup on Onderon", "With Separatist backing, Sanjay Rash seizes the throne of Onderon. Partisans led by Steela and Saw Gerrera fight back.");
    } },
    { bby: 20, m: 8, id: "mandalore", run: () => {
        if (G.worldKey === "mandalore") { frontScene("hist_mandalore", {}); return; }
        const s = canonNpc("satine"); if (s) s.alive = false;
        G.galaxy.mandalore.stability = clamp(G.galaxy.mandalore.stability - 30);
        report("⚔️ Mandalore falls", "Death Watch, allied with a mysterious Sith, overthrows the New Mandalorian government. Duchess Satine is murdered.");
    } },
    { bby: 19, m: 2, id: "sector_governance", run: () => frontScene("hist_sector_governance", {}) },
    { bby: 19, m: 3, id: "delegation", run: () => { if (roleCat() === "senate" && G.office.kind !== "chancellor") frontScene("hist_delegation", {}); } },
    { bby: 19, m: 4, id: "coruscant_battle", run: () => {
        if (G.worldKey === "coruscant") applyEffects({ p: { infrastructure: -6, housing: -3 }, g: { urban: -4 } });
        report("⚔️ Battle of Coruscant", "The Separatist fleet strikes the capital itself. The Chancellor is kidnapped — and rescued.");
    } },
    { bby: 19, m: 5, id: "empire", run: () => {
        G.era = "empire"; G.war = false;
        ["amidala", "dooku", "gunray", "sanHill", "poggle", "anakin", "kenobi", "ahsoka"].forEach(k => { const n = canonNpc(k); if (n) n.alive = false; });
        if (!canonNpc("tarkin")) G.npcs.push(makeCanonNpc("tarkin"));
        const pal = canonNpc("palpatine");
        if (pal) { pal.title = "Emperor"; pal.influence = 100; G.chancellorId = pal.id; }
        if (G.office.kind === "chancellor") { G.chancellorId = pal ? pal.id : null; }
        applyEffects({ gal: { war: -40, military: 10, diplomacy: -10 } });
        Object.values(G.galaxy).forEach(s => { if (s.align === "separatist" || s.align === "republic") s.align = "empire"; });
        G.liberties = clamp(G.liberties + 20);
        frontScene("hist_empire", {});
    } },
    { bby: 19, m: 8, id: "kashyyyk", run: () => {
        if (G.worldKey === "kashyyyk" && !(G.imperial && G.imperial.special)) { occupy("Imperial"); G.occupied.enslavement = true; return; }
        report("⛓️ Kashyyyk enslaved", "The Empire invades Kashyyyk. Wookiees are rounded up for labour camps.");
    } },
    { bby: 18, m: 3, id: "moncala_occupied", run: () => {
        if (G.worldKey === "moncala" && !(G.imperial && G.imperial.special) && G.imperial && G.imperial.path !== "accept") { occupy("Imperial"); return; }
        report("Mon Cala occupied", "The Empire occupies Mon Cala and seizes its shipyards.");
    } },
    { bby: 14, m: 5, id: "free_ryloth", run: () => { G.rebellion = clamp(G.rebellion + 5); report("✊ Free Ryloth", "Cham Syndulla's movement rises against Imperial rule on Ryloth."); } },
    { bby: 5, m: 2, id: "jedha", run: () => {
        if (G.worldKey === "jedha") { occupy("Imperial"); return; }
        report("Jedha occupied", "The Empire occupies the Holy City to strip-mine its kyber.");
    } },
    { bby: 3, m: 7, id: "ghorman", run: () => frontScene("hist_ghorman", {}) },
    { bby: 2, m: 4, id: "rebellion", run: () => { G.rebellion = clamp(G.rebellion + 20); frontScene("hist_rebellion", {}); } },
    { bby: 0, m: 3, id: "senate_dissolved", run: () => { G.era = "rebellion"; frontScene("hist_dissolved", {}); } },
    { bby: 0, m: 4, id: "alderaan", run: () => frontScene("hist_alderaan", {}) },
    { bby: 0, m: 5, id: "yavin", run: () => { G.rebellion = clamp(G.rebellion + 15); report("💥 The Battle of Yavin", "The Rebel Alliance destroys the Empire's Death Star. For the first time, the Empire can be beaten."); } },
    { bby: -4, m: 6, id: "endor", run: () => {
        const p = canonNpc("palpatine"); if (p) p.alive = false;
        G.rebellion = clamp(G.rebellion + 30);
        frontScene("hist_endor", {});
    } },
    { bby: -5, m: 3, id: "new_republic", run: () => {
        G.era = "newrepublic"; G.chancLocked = false; G.liberties = clamp(G.liberties - 40);
        const m = canonNpc("mothma") || (G.npcs.push(makeCanonNpc("mothma")), canonNpc("mothma"));
        m.title = "Chancellor of the New Republic"; m.arena = "senate"; m.alive = true;
        G.chancellorId = m.id; G.chancTermLeft = 48;
        Object.values(G.galaxy).forEach(s => { if (s.align === "empire") s.align = "republic"; });
        if (G.allegiance === "empire" || G.allegiance === "rebel") G.allegiance = "republic";
        frontScene("hist_new_republic", {});
    } }
];

function tickHistory() {
    const bby = currentBBY();
    // Canon characters leave public life at the end of their era.
    if (G.month === 12) G.npcs.filter(n => n.canon && n.alive && CANON[n.canon].to === bby && n.id !== G.chancellorId).forEach(n => { n.alive = false; log(`${n.name} leaves the political stage.`, "world"); });
    HISTORY.filter(e => e.bby === bby && e.m === G.month && !G.hist[e.id]).forEach(e => {
        G.hist[e.id] = true;
        e.run();
        log(`📜 ${eraYear(bby)}: ${e.id.replace(/_/g, " ")}`, "history");
    });
    // Canon characters enter politics on schedule.
    if (G.month === 1) Object.entries(CANON).forEach(([k, c]) => {
        if (c.from === bby && !G.npcs.some(n => n.canon === k) && c.arena !== "jedi") {
            G.npcs.push(makeCanonNpc(k, c.arena === "local" && c.world !== G.worldKey ? { arena: "galactic" } : {}));
            if (c.seat && G.galaxy[c.world] && G.galaxy[c.world].senatorId !== "player") G.galaxy[c.world].senatorId = canonNpc(k).id;
        }
    });
}


// ── Historical scenes ─────────────────────────────────────────────

const voice = (who, text) => `<p class="voice"><b>${esc(who)}</b> ${esc(text)}</p>`;
const npcVoice = key => { const n = canonNpc(key); return n ? voice(n.name, `“${canonLine(n)}”`) : ""; };

function histApply(e, topic) {
    const ch = applyEffects(e);
    if (e.f) publish(topic, e.f);
    return ch;
}

Object.assign(SCENES, {

    attacked: () => {
        const s = G.siege;
        if (!s) return { tag: "WAR", title: "The attack is over", body: "", choices: [{ label: "Continue" }] };
        const w = world();
        const cat = roleCat();
        const choices = [
            { label: `Petition the ${G.allegiance === "separatist" ? "Separatist Parliament" : "Senate"} for military assistance`, hint: cat === "local" ? "You do not possess this authority — your planetary government must petition." : "Fight for it politically while the attack continues.", disabled: cat === "local" || G.allegiance === "hutt", go: () => startPetition() },
            ...ideologyResponses("siege"),
            { label: "Rally the planetary defence forces", hint: "Raises defence spending to maximum (governments only).", disabled: !governing(), go: () => { G.policies.defence_force.level = 1; G.policies.defence_force.eff = Math.min(1, G.policies.defence_force.eff + 0.3); report("To arms", `${w.name} mobilises every defender it has.`, applyEffects({ treasury: -3, g: { military: 5, youth: -2 } })); } },
            { label: "Wait and see", go: () => {} }
        ];
        return { tag: "🚨 YOUR WORLD HAS BEEN ATTACKED", title: `${s.by} forces in the ${w.name} system`,
            body: `<p>Enemy strength: <b>${s.str}</b>. Local defence strength: <b>${defenseStrength()}</b>.${defenseStrength() < s.str ? " Local defence forces are insufficient." : ""}</p><p>${s.blockade ? "A blockade has cut off imports of food, medicine and fuel. " + supplyReport() : "They are going for the cities."}</p>`,
            choices };
    },

    occupation: ctx => ({
        tag: "OCCUPATION", title: `${world().name} is occupied`,
        body: `<p>${esc(ctx.by)} forces hold the capital. Your government can collaborate, resist, or flee.</p>`,
        choices: [
            { label: "Negotiate terms with the occupiers", hint: "Keeps people alive. Loyalists will call it collaboration.", go: () => { report("Terms agreed", "The occupiers let your government function — on their terms.", applyEffects({ legitimacy: -10, rep: -5, unrest: -10, g: { elders: 3, youth: -5 } })); } },
            { label: "Organise resistance", hint: "Liberation comes sooner; reprisals too.", go: () => { G.garrison += 15; report("Resistance", "Underground cells form in every city.", applyEffects({ unrest: 10, g: { youth: 6, military: 4 }, p: { infrastructure: -2 } })); } },
            { label: "Form a government in exile", go: () => { report("Government in exile", "You escape offworld to keep the lawful government alive.", applyEffects({ legitimacy: 5, influence: -5 })); } }
        ]
    }),

    petition_denied: () => {
        const w = world();
        const friends = livingNpcs().filter(n => n.arena === "senate" && n.rel >= 30 && G.galaxy[n.world] && n.world !== G.worldKey);
        return {
            tag: "REQUEST DENIED", title: "The Senate will not help",
            body: `<p>The ${G.allegiance === "separatist" ? "Parliament" : "Senate"} has determined that sufficient forces are unavailable. ${G.siege ? `The ${G.siege.by} attack continues.` : ""}</p><p class="muted">Every choice here changes your political future.</p>`,
            choices: [
                { label: "Defend ourselves", hint: "Everything into defence.", go: () => { G.policies.defence_force.level = 1; G.policies.defence_force.eff = Math.min(1, G.policies.defence_force.eff + 0.4); G.garrison += 10; report("We stand alone", `${w.name} fights on with what it has.`, applyEffects({ treasury: -4, g: { military: 6, youth: 4 }, f: { federalists: 4, independence: 3 } })); } },
                { label: `Negotiate with the ${G.siege ? G.siege.by : "enemy"}`, go: () => { if (chance(60)) { G.siege = null; G.occupied = null; report("A separate peace", "The attackers withdraw — for concessions.", applyEffects({ f: { centralists: -8, independence: 6 }, rep: -3 })); } else report("Talks fail", "The enemy isn't interested."); G.opinion.sep = clamp(G.opinion.sep + 6); } },
                { label: "Request assistance from another world", hint: friends.length ? `Your friend on ${worldName(friends[0].world)} might help.` : "You have no close allies to ask.", disabled: !friends.length, go: () => { const f = friends[0]; if (chance(40 + f.rel / 2)) { G.garrison += 25; changeRel(f, 5, `Sent help when ${w.name} was attacked.`); report("An ally answers", `${worldName(f.world)} sends ships.`, applyEffects({ trust: 3 })); G.record.agreements.push(`Mutual defence with ${worldName(f.world)} (${eraYear(currentBBY())})`); } else report("No help comes", `${f.name} is sympathetic, but ${worldName(f.world)} cannot spare ships.`); } },
                { label: "Join the Separatists", hint: "Switch sides. The attack may stop — the Republic will not forgive.", disabled: G.allegiance === "separatist", go: () => changeAllegiance("separatist", "after the Senate refused to defend us") },
                { label: "Declare neutrality", go: () => changeAllegiance("neutral", "after the Senate refused to defend us") },
                { label: "Evacuate civilians", go: () => { report("Evacuation", "Millions flee to the countryside and neighbouring systems.", applyEffects({ p: { employment: -6, housing: -3 }, trust: 6, g: { elders: 5, religious: 4 }, legitimacy: 3 })); } }
            ]
        };
    },

    hist_blockade: () => {
        const w = world();
        const outer = w.region !== "core";
        const cat = roleCat();
        const constituents = outer ? "“If the Republic allows Naboo to be blockaded, we're next.”" : "“This isn't our problem.”";
        const choices = cat === "senate" ? [
            { label: "Support intervention", go: () => { remember(canonNpc("amidala") || { memory: [] }, "Supported intervention during the Naboo emergency."); napNaboo(12); recordVote("Naboo intervention", "for"); histApply({ f: { militarists: 5, centralists: 3, corporatists: -4 } }, "the Naboo blockade"); } },
            { label: "Oppose intervention", go: () => { napNaboo(-15, "Opposed intervention during the Naboo emergency."); recordVote("Naboo intervention", "against"); histApply({ f: { corporatists: 5, federalists: 2, reformers: -3 } }, "the Naboo blockade"); } },
            { label: "Demand negotiations", go: () => { napNaboo(3); histApply({ f: { reformers: 2 }, rep: 2 }, "the Naboo blockade"); } },
            { label: "Call for sanctions on the Trade Federation", go: () => { napNaboo(8); const g = canonNpc("gunray"); if (g) changeRel(g, -20, "Called for sanctions against the Federation."); histApply({ f: { reformers: 3, corporatists: -6 }, gal: { trade: -2 } }, "sanctions"); } },
            { label: "Request emergency humanitarian funding", hint: "Finance route: 3 capital.", disabled: G.ap < 3, go: () => { G.ap -= 3; napNaboo(10); histApply({ f: { reformers: 4 }, rep: 3 }, "humanitarian aid for Naboo"); } },
            { label: "Remain neutral", go: () => { napNaboo(-5, "Stayed silent during the Naboo emergency."); } }
        ] : [
            { label: "Publicly condemn the blockade", go: () => { napNaboo(6); histApply({ f: { reformers: 2, corporatists: -2 } }, "the Naboo blockade"); } },
            { label: "Send humanitarian assistance", disabled: !governing(), go: () => { napNaboo(10); histApply({ treasury: -2, rep: 3, gal: { diplomacy: 1 } }, "aid for Naboo"); } },
            { label: "It isn't our problem", go: () => { napNaboo(-6); histApply({ g: { business: 2 } }, "the Naboo blockade"); } }
        ];
        return { tag: "EMERGENCY — NABOO", title: "The Trade Federation has blockaded Naboo",
            body: `<p>The Senate is divided over whether military intervention is justified. Queen Amidala's pleas go unanswered while the Senate argues about procedure.</p><p>Your constituents say: <i>${constituents}</i></p>`,
            choices };
    },

    hist_no_confidence: () => {
        const cat = roleCat();
        const body = voice("Queen Amidala", "“I was not elected to watch my people suffer and die while you discuss this invasion in a committee!”")
            + voice("Supreme Chancellor Valorum", "“Queen Amidala… I beg you to reconsider…”")
            + voice("Senator Palpatine", "“Your Majesty, I will do everything I can to get the Senate to act.”")
            + `<p>The Queen moves a vote of no confidence in Chancellor Valorum.${cat === "senate" ? " The Chair recognises the Senator from " + esc(world().name) + "." : ""}</p>`;
        const after = backed => {
            const pal = canonNpc("palpatine");
            if (backed === "palpatine" && pal) changeRel(pal, 20, "Backed him for Chancellor in 32 BBY.");
            if (backed && backed !== "palpatine" && pal) changeRel(pal, -10, "Backed another candidate against him in 32 BBY.");
            report("Palpatine elected Supreme Chancellor", "Riding a wave of sympathy for Naboo, Senator Palpatine defeats Bail Antilles and Ainlee Teem.");
        };
        const choices = cat === "senate" ? [
            { label: "Vote for the motion — and back Palpatine", go: () => { recordVote("No confidence in Chancellor Valorum", "for"); napNaboo(10); after("palpatine"); } },
            { label: "Vote for the motion — back Bail Antilles", go: () => { recordVote("No confidence in Chancellor Valorum", "for"); napNaboo(8); after("antilles"); } },
            { label: "Vote against: stand by Valorum", go: () => { recordVote("No confidence in Chancellor Valorum", "against"); napNaboo(-12, "Voted to keep Valorum while Naboo suffered."); after(null); } },
            { label: "Abstain", go: () => { recordVote("No confidence in Chancellor Valorum", "abstain"); after(null); } }
        ] : [
            { label: "Support the Queen's motion publicly", go: () => { napNaboo(6); after(null); } },
            { label: "Say nothing", go: () => after(null) }
        ];
        return { tag: "GALACTIC SENATE — 32 BBY", title: "A Vote of No Confidence", body, choices };
    },

    hist_term_extension: () => {
        const cat = roleCat();
        const pal = canonNpc("palpatine");
        const done = v => { if (pal && v) changeRel(pal, v === "for" ? 12 : -15, `${v === "for" ? "Supported" : "Opposed"} extending his term.`); if (v) recordVote("Extension of the Chancellor's term", v); report("The Chancellor's term is extended", "Amid the Separatist Crisis, the Senate lets Palpatine remain in office beyond his term. There will be no Chancellor election."); };
        return { tag: "GALACTIC SENATE — 24 BBY", title: "Extend the Chancellor's Term?",
            body: voice("Mas Amedda", "“In this time of crisis, continuity is essential.”") + npcVoice("mothma") + `<p>The Chancellor's term is ending. His allies propose suspending the election for the duration of the crisis.</p>`,
            choices: cat === "senate" ? [
                { label: "Vote for the extension", go: () => { done("for"); histApply({ f: { centralists: 5, reformers: -5 } }, "the Chancellor's term"); } },
                { label: "Vote against", go: () => { done("against"); histApply({ f: { reformers: 4, federalists: 3, centralists: -4 } }, "the Chancellor's term"); const m = canonNpc("mothma"); if (m) changeRel(m, 8, "Voted against extending the Chancellor's term."); } },
                { label: "Abstain", go: () => done("abstain") }
            ] : [{ label: "Continue", go: () => done(null) }] };
    },

    hist_emergency_powers: () => {
        const cat = roleCat();
        const body = voice("Representative Jar Jar Binks", "“Mesa proposing that the Senate give immediately emergency powers to the Supreme Chancellor!”")
            + voice("Supreme Chancellor Palpatine", "“It is with great reluctance that I have agreed to this calling. I love democracy. I love the Republic.”")
            + npcVoice("bail") + npcVoice("mothma") + `<p>The Senate votes on granting the Chancellor emergency powers.</p>`;
        const done = v => {
            const pal = canonNpc("palpatine");
            if (v === "for" && pal) changeRel(pal, 15, "Voted him emergency powers.");
            if (v === "against") { if (pal) changeRel(pal, -12, "Voted against his emergency powers."); ["mothma", "bail", "amidala"].forEach(k => { const n = canonNpc(k); if (n) changeRel(n, 8, "Stood against the emergency powers."); }); }
            if (v) recordVote("Emergency Powers Act", v);
            report("Emergency powers granted", "The Senate grants Supreme Chancellor Palpatine emergency powers. He promises to lay them down when the crisis is over.");
        };
        return { tag: "GALACTIC SENATE — 22 BBY", title: "The Emergency Powers Act", body,
            choices: cat === "senate" ? [
                { label: "Speak and vote for emergency powers", go: () => { done("for"); histApply({ f: { centralists: 6, militarists: 6, reformers: -6, federalists: -4 } }, "emergency powers"); } },
                { label: "Speak and vote against", go: () => { done("against"); histApply({ f: { reformers: 6, federalists: 5, centralists: -6, militarists: -4 } }, "emergency powers"); } },
                { label: "Abstain", go: () => done("abstain") }
            ] : [
                { label: "Welcome it: the Republic needs strength", go: () => { done(null); histApply({ f: { centralists: 3, militarists: 3 } }, "emergency powers"); } },
                { label: "Warn against it publicly", go: () => { done(null); histApply({ f: { reformers: 3, federalists: 3 }, rep: 2 }, "emergency powers"); } },
                { label: "Say nothing", go: () => done(null) }
            ] };
    },

    hist_geonosis: () => {
        const cat = roleCat();
        const w = world();
        const base = `<p>Jedi forces and a new clone army have engaged Separatist forces on Geonosis. The Clone Wars have begun.</p>`;
        let choices;
        if (cat === "senate") choices = [
            { label: "Vote to authorise the clone army and war funding", go: () => { recordVote("Clone Army Authorization", "for"); histApply({ f: { militarists: 8, centralists: 4, reformers: -5, independence: -6 }, gal: { military: 6 } }, "the clone army"); } },
            { label: "Vote for war funding, against emergency expansion", go: () => { recordVote("Clone Army Authorization", "for (with limits)"); histApply({ f: { militarists: 3, federalists: 3 } }, "war funding"); } },
            { label: "Vote against the war", go: () => { recordVote("Clone Army Authorization", "against"); histApply({ f: { reformers: 6, independence: 4, militarists: -8, centralists: -5 }, g: { military: -4 } }, "the war"); G.opinion.sep = clamp(G.opinion.sep + 4); } }
        ];
        else if (isMonarch()) choices = [
            { label: "Grant the Republic access to our military facilities", go: () => { histApply({ f: { centralists: 4, militarists: 4 }, g: { military: 3 } }, "Republic basing rights"); G.garrison += 20; } },
            { label: "Refuse", go: () => { histApply({ f: { federalists: 4, independence: 3, centralists: -4 } }, "refusing the Republic"); G.opinion.sep = clamp(G.opinion.sep + 4); } },
            { label: "Negotiate terms: bases for protection guarantees", go: () => { histApply({ influence: 3, f: { federalists: 2 } }, "Republic terms"); G.garrison += 10; } },
            { label: "Declare neutrality", go: () => changeAllegiance("neutral", "at the outbreak of war") }
        ];
        else if (cat === "gov") choices = [
            { label: "Mobilise planetary forces", go: () => { G.policies.defence_force.level = Math.max(G.policies.defence_force.level, 0.8); histApply({ f: { militarists: 4 }, g: { military: 4, youth: -2 } }, "mobilisation"); } },
            { label: "Provide troops to the Republic", go: () => { histApply({ f: { centralists: 5, militarists: 3 }, g: { military: 3, elders: -2 } }, "sending troops"); } },
            { label: "Provide supplies", go: () => { histApply({ treasury: -2, f: { centralists: 3 } }, "war supplies"); } },
            { label: "Request Republic protection", go: () => { G.garrison += 15; histApply({ f: { centralists: 2 } }, "Republic protection"); } },
            { label: "Remain neutral", go: () => changeAllegiance("neutral", "at the outbreak of war") }
        ];
        else if (cat === "local") choices = [
            { label: "Prepare civil defences", go: () => histApply({ g: { elders: 3 }, influence: 1 }, "civil defence") },
            { label: "Petition the planetary government for protection", go: () => histApply({ trust: 2 }, "protection") },
            { label: "Carry on", go: () => {} }
        ];
        else choices = [{ label: "Continue", go: () => {} }];
        return { tag: "⚔️ GALACTIC EMERGENCY — 22 BBY", title: "Geonosis", body: base + (cat === "senate" ? voice("Mas Amedda", "“Order! The Senate is in emergency session.”") : isMonarch() ? `<p>Your council gathers. “Your Majesty, the Republic has requested access to our military facilities.”</p>` : cat === "gov" ? `<p>A Republic defence request arrives at the government of ${esc(w.name)}.</p>` : ""), choices };
    },

    hist_allegiance: () => {
        const o = G.opinion;
        const neutral = Math.max(0, 100 - o.loyal - o.sep);
        const cat = roleCat();
        const decide = (path, how) => () => {
            let loyal = o.loyal, sep = o.sep, neu = neutral;
            if (path) ({ republic: () => loyal += 12, separatist: () => sep += 12, neutral: () => neu += 12 })[path]();
            const result = [["republic", loyal], ["separatist", sep], ["neutral", neu]].sort((a, b) => b[1] - a[1])[0][0];
            changeAllegiance(result, how);
        };
        const choices = cat === "senate" ? [
            { label: "Campaign to stay in the Republic", go: decide("republic", "after a bitter planetary debate") },
            { label: "Campaign for the Confederacy", go: decide("separatist", "after a bitter planetary debate") },
            { label: "Campaign for neutrality", go: decide("neutral", "after a bitter planetary debate") },
            { label: "Stay out of it and let the planet decide", go: decide(null, "by a planetary vote") }
        ] : cat === "gov" ? [
            { label: "Put it to the legislature", go: decide(null, "by a vote of the legislature") },
            { label: "Hold a referendum", go: () => { const r = [["republic", o.loyal + rnd(-6, 6)], ["separatist", o.sep + rnd(-6, 6)], ["neutral", neutral + rnd(-6, 6)]].sort((a, b) => b[1] - a[1])[0][0]; changeAllegiance(r, "by referendum"); applyEffects({ trust: 5 }); } },
            { label: "Decide it yourself: the Republic", go: () => { changeAllegiance("republic", "by government decree"); applyEffects({ legitimacy: -6, trust: -4 }); } },
            { label: "Decide it yourself: the Confederacy", go: () => { changeAllegiance("separatist", "by government decree"); applyEffects({ legitimacy: -6, trust: -4 }); } },
            { label: "Decide it yourself: neutrality", go: () => { changeAllegiance("neutral", "by government decree"); applyEffects({ legitimacy: -4 }); } }
        ] : [
            { label: "Rally for the Republic", go: decide("republic", "after mass demonstrations") },
            { label: "Rally for the Confederacy", go: decide("separatist", "after mass demonstrations") },
            { label: "Rally for neutrality", go: decide("neutral", "after mass demonstrations") }
        ];
        return { tag: "PLANETARY CRISIS", title: "Which side are we on?",
            body: `<p>Parliament must decide: <b>should ${esc(world().name)} remain within the Galactic Republic?</b></p>
                <div class="opinion"><div><b class="c-for">${Math.round(o.loyal)}%</b><span>Republic loyalists</span></div><div><b class="c-against">${Math.round(o.sep)}%</b><span>Separatists</span></div><div><b class="c-und">${Math.round(neutral)}%</b><span>Neutral</span></div></div>
                <p class="small"><b>Republic:</b> military security, Republic institutions, trade, federal assistance, Senate representation.<br><b>Separatist:</b> sovereignty, local control, new alliances, enormous uncertainty.<br><b>Neutral:</b> stay out of the war — if both sides let you.</p>`,
            choices };
    },

    hist_moncala: () => {
        const nossor = canonNpc("nossor");
        const unity = (nossor ? nossor.rel : 0) + (G.groups.traditional ? G.groups.traditional.a - 50 : 0) + (50 - G.opinion.sep) * 0.5 + (G.legitimacy - 50) * 0.3;
        const cat = roleCat();
        const outcome = extra => () => {
            const score = unity + extra + rnd(-15, 15);
            if (score > 30) { report("🌊 MON CALA REMAINS UNITED", "Because you built a coalition between Mon Calamari and Quarren leaders, the Separatist-backed uprising fizzles. History has branched.", applyEffects({ legitimacy: 15, trust: 8, g: { traditional: 6 } })); G.record.agreements.push("Kept Mon Cala united (21 BBY)"); }
            else if (score > 0) { report("Mon Cala declares neutrality", "Unable to agree on a side, the two peoples agree only to stay out of the war.", applyEffects({ legitimacy: 3 })); changeAllegiance("neutral", "to prevent civil war"); }
            else if (score > -25) { startSiege("Quarren rebel", 55, false, "Separatist-backed Quarren rise in revolt. Civil war engulfs Mon Cala."); G.galaxy.moncala.stability = clamp(G.galaxy.moncala.stability - 25); }
            else { report("Mon Cala joins the Separatists", "Alienated from the Republic, Mon Cala's government throws in with the Confederacy.", applyEffects({ f: { independence: 10, centralists: -10 } })); changeAllegiance("separatist", "amid civil strife"); }
        };
        return { tag: "ADAPTIVE EVENT — 21 BBY", title: "The Quarren Question",
            body: `<p>King Yos Kolina has been assassinated. Separatist agents are arming Quarren militias. Canon says civil war follows — but your history might differ.</p><p class="muted small">Your coalition-building so far: ${unity > 30 ? "strong" : unity > 0 ? "mixed" : "weak"}.</p>`,
            choices: [
                { label: "Summit with the Quarren chieftains", hint: "Build on the relationships you have.", go: outcome(15) },
                { label: "Offer the Quarren autonomy", go: () => { applyEffects({ f: { federalists: 5 }, g: { traditional: 6 } }); outcome(25)(); } },
                { label: "Crack down on the militias", go: () => { applyEffects({ f: { militarists: 5 }, g: { traditional: -8 } }); outcome(-10)(); } },
                { label: cat === "senate" ? "Ask the Senate for Republic troops" : "Call in the Republic", go: () => { G.garrison += 25; outcome(0)(); } }
            ] };
    },

    hist_onderon: () => ({
        tag: "ADAPTIVE EVENT — 20 BBY", title: "Coup in Iziz",
        body: `<p>Sanjay Rash, backed by the Confederacy, moves to seize the throne. Partisans gather in the jungle.</p>`,
        choices: [
            { label: "Resist the coup", go: () => { if (G.legitimacy + G.inst.military / 2 + rnd(-20, 20) > 60) { report("Coup defeated", "The Royal Guard stands firm. Rash flees.", applyEffects({ legitimacy: 12 })); G.record.agreements.push("Defeated the Separatist coup on Onderon (20 BBY)"); } else { changeAllegiance("separatist", "after a Separatist-backed coup"); if (isMonarch()) frontScene("outsider_path", { reason: "You were overthrown in the Separatist coup." }); } } },
            { label: "Accept the Confederacy", go: () => changeAllegiance("separatist", "under Separatist pressure") },
            { label: "Arm the partisans", go: () => { G.garrison += 20; applyEffects({ g: { youth: 6 }, unrest: 10 }); const s = canonNpc("steela"); if (s) changeRel(s, 20, "Armed the partisans."); } }
        ]
    }),

    hist_mandalore: () => ({
        tag: "ADAPTIVE EVENT — 20 BBY", title: "Death Watch Moves on Sundari",
        body: `<p>Death Watch, allied with a mysterious Sith and criminal syndicates, is seizing Sundari. The clans are watching to see who is strong.</p>`,
        choices: [
            { label: "Rally the clans", hint: "Depends on clan loyalty and legitimacy.", go: () => { const c = G.clans ? G.clans.reduce((s, x) => s + x.loyalty, 0) / G.clans.length : 50; if (c + G.legitimacy / 2 + rnd(-20, 20) > 75) { report("Mandalore holds", "The clans stand with you. Death Watch is driven from the capital.", applyEffects({ legitimacy: 15, clans: 8 })); G.record.agreements.push("Defeated the Death Watch coup (20 BBY)"); } else { occupy("Death Watch"); } } },
            { label: "Appeal to the Republic", go: () => { G.garrison += 20; applyEffects({ f: { centralists: 4, independence: -4 } }); if (chance(50)) report("Republic intervention", "Republic forces help restore order — neutrality is over."); else occupy("Death Watch"); } },
            { label: "Flee into exile", go: () => { frontScene("outsider_path", { reason: "You fled Mandalore when Death Watch took Sundari." }); } }
        ]
    }),

    hist_sector_governance: () => {
        const cat = roleCat();
        return { tag: "19 BBY", title: "The Sector Governance Decree",
            body: `<p>The Chancellor appoints regional governors with authority over every member world's administration. Planetary autonomy is curtailed by decree.</p>${npcVoice("mothma")}`,
            choices: cat === "gov" ? [
                { label: "Accept Republic oversight", go: () => histApply({ f: { centralists: 5, federalists: -5 }, i: { planetary: -10 } }, "the governance decree") },
                { label: "Protest formally", go: () => histApply({ f: { federalists: 5, centralists: -4 }, rep: 2 }, "the governance decree") },
                { label: "Quietly ignore the new governor", go: () => { histApply({ f: { federalists: 3, independence: 3 }, heat: 8 }, "defying the decree"); G.opinion.sep = clamp(G.opinion.sep + 4); } }
            ] : cat === "senate" ? [
                { label: "Denounce the decree on the Senate floor", go: () => { recordVote("Sector Governance Decree", "denounced"); histApply({ f: { reformers: 4, federalists: 5, centralists: -5 }, heat: 4 }, "the governance decree"); } },
                { label: "Support it: the war demands it", go: () => { recordVote("Sector Governance Decree", "supported"); histApply({ f: { centralists: 5, militarists: 3, federalists: -5 } }, "the governance decree"); } },
                { label: "Say nothing", go: () => {} }
            ] : [{ label: "Continue", go: () => {} }] };
    },

    hist_delegation: () => ({
        tag: "19 BBY", title: "The Petition of the 2,000",
        body: `${npcVoice("mothma")}${npcVoice("bail")}<p>Two thousand senators are preparing a petition demanding the Chancellor surrender his emergency powers. Will you sign?</p>`,
        choices: [
            { label: "Sign the petition", go: () => { G.signed2000 = true; recordVote("Petition of the 2,000", "signed"); ["mothma", "bail", "amidala"].forEach(k => { const n = canonNpc(k); if (n) changeRel(n, 15, "Signed the Petition of the 2,000."); }); const p = canonNpc("palpatine"); if (p) changeRel(p, -20, "Signed the Delegation's petition."); histApply({ f: { reformers: 6, federalists: 4, centralists: -6 }, heat: 6 }, "the Petition of the 2,000"); } },
            { label: "Refuse", go: () => { recordVote("Petition of the 2,000", "refused"); const m = canonNpc("mothma"); if (m) changeRel(m, -10, "Refused to sign the Petition of the 2,000."); } }
        ]
    }),

    hist_empire: () => {
        const cat = roleCat();
        const sep = G.allegiance === "separatist";
        const body = voice("Emperor Palpatine", "“In order to ensure our security and continuing stability, the Republic will be reorganised into the first Galactic Empire, for a safe and secure society.”")
            + `<p>The Jedi have been declared traitors and destroyed. Senator Amidala is dead. The Senate applauds.</p>${sep ? "<p><b>The Separatist leadership has been killed on Mustafar. The droid armies are shutting down.</b></p>" : ""}`;
        const inOffice = !["outsider", "movement", "opposition", "candidate"].includes(G.office.kind);
        const choices = [];
        if (inOffice) choices.push(
            { label: "Accept the Empire", hint: cat === "senate" ? "Become an Imperial Senator." : "Become an Imperial administrator.", go: () => imperialPath("accept") },
            { label: "Resist politically", hint: "Stay in office as part of an emerging opposition. The ISB will be watching.", go: () => imperialPath("resist") },
            { label: "Attempt to preserve planetary autonomy", hint: "Negotiate special status for your world.", go: () => imperialPath("autonomy") },
            { label: "Collaborate publicly, resist privately", hint: "Serve the Empire — and secretly help its enemies.", go: () => imperialPath("double") });
        choices.push({ label: "Join the underground", hint: "Leave formal government entirely.", go: () => imperialPath("rebel") });
        if (!inOffice) choices.push({ label: "Keep your head down", go: () => imperialPath("quiet") });
        return { tag: "19 BBY — THE END OF THE REPUBLIC", title: "The Republic has been reorganised into the First Galactic Empire", body, choices };
    },

    hist_ghorman: () => {
        const cat = roleCat();
        return { tag: "3 BBY", title: "The Ghorman Massacre",
            body: `<p>Imperial forces open fire on peaceful protesters on Ghorman. The Imperial Senate is told they were terrorists.</p>`,
            choices: [
                { label: cat === "senate" ? "Denounce it on the Senate floor" : "Denounce it publicly", go: () => { G.isb = (G.isb || 0) + 20; histApply({ rep: 6, trust: 4, heat: 12, f: { reformers: 6, militarists: -6 } }, "the Ghorman massacre"); G.rebellion = clamp(G.rebellion + 3); recordVote("Ghorman Massacre", "denounced"); } },
                { label: "Stay silent", go: () => { histApply({ rep: -3 }, "Ghorman"); recordVote("Ghorman Massacre", "silent"); } },
                { label: "Endorse the official account", go: () => { histApply({ rep: -8, f: { militarists: 5, reformers: -8 } }, "Ghorman"); recordVote("Ghorman Massacre", "endorsed the Empire"); } }
            ] };
    },

    hist_rebellion: () => ({
        tag: "2 BBY", title: "Mon Mothma Denounces the Emperor",
        body: `${voice("Mon Mothma", "“The truth is we are losing our democracy. The Emperor is the architect of this.”")}<p>She flees Coruscant. The scattered rebel cells unite as the Alliance to Restore the Republic.</p>`,
        choices: [
            { label: "Join the Rebel Alliance openly", go: () => imperialPath("rebel") },
            { label: "Support the Alliance in secret", go: () => { G.secretRebel = true; G.record.agreements.push("Secret supporter of the Rebel Alliance (2 BBY)"); const m = canonNpc("mothma"); if (m) changeRel(m, 20, "Secretly supported the Alliance."); } },
            { label: "Denounce her", go: () => { histApply({ f: { militarists: 5, reformers: -8 }, rep: -4 }, "Mon Mothma's defection"); const m = canonNpc("mothma"); if (m) changeRel(m, -30, "Denounced her when she defected."); } },
            { label: "Say nothing", go: () => {} }
        ]
    }),

    hist_dissolved: () => {
        const wasSenator = G.office.kind === "senator" || G.office.kind === "minister";
        return { tag: "0 BBY", title: "The Imperial Senate is Dissolved",
            body: `<p>“The regional governors now have direct control over their territories. Fear will keep the local systems in line.”</p>${wasSenator ? "<p><b>Your seat no longer exists.</b></p>" : ""}`,
            choices: wasSenator ? [
                { label: "Accept an Imperial post", go: () => { setOffice(makeOffice({ title: `Imperial Administrator of ${world().name}`, kind: "council", desc: "Serve the Moffs." })); G.imperial = { path: "accept" }; } },
                { label: "Join the Rebellion", go: () => imperialPath("rebel") },
                { label: "Retire", go: () => endCareer("Left public life when the Senate was dissolved.") }
            ] : [{ label: "Continue", go: () => {} }] };
    },

    hist_alderaan: () => {
        G.galaxy.alderaan.destroyed = true; G.galaxy.alderaan.stability = 0;
        const bail = canonNpc("bail"), breha = canonNpc("breha");
        [bail, breha].forEach(n => { if (n) n.alive = false; });
        const mine = G.worldKey === "alderaan";
        const onPlanet = mine && !["outsider", "movement", "senator", "minister", "chancellor"].includes(G.office.kind);
        if (onPlanet) return { tag: "0 BBY", title: "Alderaan", body: `<p>A beam of green light. A world of two billion people is gone. You were home.</p>`, choices: [{ label: "…", go: () => endCareer("Died with Alderaan.") }] };
        return { tag: "0 BBY", title: "Alderaan is Destroyed",
            body: `<p>The Empire's new battle station destroys Alderaan. Two billion people are dead.${mine ? " <b>Your homeworld is gone.</b> You were offworld." : ""}</p>`,
            choices: [{ label: "Continue", go: () => { G.rebellion = clamp(G.rebellion + 15); if (mine) { applyEffects({ health: -20 }); enterOutsider("Exile", 0); G.office.sub = "Alderaanian survivor"; } } }] };
    },

    hist_endor: () => ({
        tag: "4 ABY", title: "The Emperor is Dead",
        body: `<p>At Endor, the second Death Star is destroyed and the Emperor killed. Across the galaxy, Imperial worlds rise.</p>`,
        choices: [
            { label: "Declare for the Rebellion", go: () => { G.allegiance = "rebel"; histApply({ f: { reformers: 8, militarists: -6 }, trust: 6 }, "the Emperor's fall"); } },
            { label: "Hold your world together first", go: () => histApply({ legitimacy: 6, f: { federalists: 5 } }, "stability") },
            { label: "Try to hold on to Imperial power", go: () => { histApply({ unrest: 20, f: { militarists: 4, reformers: -10 } }, "Imperial holdouts"); G.autocrat = true; } }
        ]
    }),

    hist_new_republic: () => ({
        tag: "5 ABY", title: "The New Republic",
        body: `<p>The Galactic Concordance ends the war. A New Republic Senate is founded on Chandrila, with Mon Mothma as Chancellor. Elections return — and so does your chance.</p>`,
        choices: [
            ...(world().roles.some(r => r.kind === "senator") && G.office.kind !== "senator" ? [{ label: "Run for the New Republic Senate", go: () => { const r = world().roles.find(x => x.kind === "senator"); setOffice(makeOffice({ title: `Candidate for ${r.title}`, kind: "candidate", target: { ...r }, months: 6 })); newOpponent(); } }] : []),
            { label: "Continue your work", go: () => {} }
        ]
    })
});

function makePalpatineChancellor() {
    const val = G.npcs.find(n => n.canon === "valorum");
    const pal = canonNpc("palpatine");
    if (val) val.alive = false;
    if (!pal || G.office.kind === "chancellor") return;
    G.chancellorId = pal.id;
    pal.title = "Supreme Chancellor"; pal.influence = 85; pal.arena = "senate";
    if (G.galaxy.naboo.senatorId === pal.id) { const s = makeNpc({ world: "naboo", title: "Senator of Naboo", arena: "senate" }); G.npcs.push(s); G.galaxy.naboo.senatorId = s.id; }
    G.chancTermLeft = 48;
}

function napNaboo(d, memory) {
    ["amidala", "bibble", "nass"].forEach(k => { const n = canonNpc(k); if (n) changeRel(n, k === "amidala" ? d : d / 2, k === "amidala" ? (memory || (d > 0 ? "Stood with Naboo during the blockade." : null)) : null); });
    const p = canonNpc("palpatine"); if (p) changeRel(p, d / 3);
}

function changeAllegiance(side, how) {
    const w = world();
    const before = G.allegiance;
    G.allegiance = side;
    G.galaxy[G.worldKey].align = side;
    const name = { republic: "remains in the Galactic Republic", separatist: "joins the Confederacy of Independent Systems", neutral: "declares neutrality" }[side];
    const e = side === "separatist" ? { f: { independence: 15, federalists: 5, centralists: -15, militarists: -5 }, g: { military: -3 } }
        : side === "neutral" ? { f: { federalists: 5, centralists: -6 } } : { f: { centralists: 8, militarists: 4, independence: -8 } };
    report(`🏳️ ${w.name} ${name}`, `${w.name} ${name} ${how}.`, applyEffects(e));
    log(`🏳️ ${w.name} ${name} ${how}.`, "history");
    G.record.agreements.push(`${w.name} ${name} (${eraYear(currentBBY())})`);
    if (side === "separatist" && before !== "separatist") {
        G.siege = G.siege && G.siege.by === "Separatist" ? null : G.siege;
        const sen = worldSenator(G.worldKey);
        if (sen) { sen.title = `Separatist Parliament delegate (${w.name})`; }
        ["amidala", "bail", "mothma"].forEach(k => { const n = canonNpc(k); if (n) changeRel(n, -15, `Watched ${w.name} leave the Republic.`); });
        const d = canonNpc("dooku"); if (d) changeRel(d, 20, `Welcomed ${w.name} into the Confederacy.`);
    }
}

function imperialPath(path) {
    const w = world();
    const k = G.office.kind;
    const pal = canonNpc("palpatine");
    G.imperial = { path };
    if (path === "accept") {
        if (k === "senator") G.office.title = "Imperial Senator";
        else if (governing() || k === "council") { G.office.title = `Imperial ${k === "hereditary" || k === "monarch" ? "client monarch" : "Governor"} of ${w.name}`; }
        G.allegiance = "empire";
        if (pal) changeRel(pal, 15, "Welcomed the Empire.");
        report("You serve the Empire", "The HoloNet praises your loyalty. Some old friends stop returning your calls.", applyEffects({ f: { militarists: 8, centralists: 8, reformers: -12, federalists: -6 }, influence: 5 }));
    } else if (path === "resist") {
        G.allegiance = "empire";
        G.isb = 30;
        report("The loyal opposition", "You stay in office and oppose the Emperor's worst excesses — carefully.", applyEffects({ f: { reformers: 8, militarists: -6 }, heat: 15, rep: 5 }));
    } else if (path === "autonomy") {
        const p = G.influence * 0.4 + w.ratings.military * 6 + w.ratings.wealth * 4 + rnd(-10, 10);
        if (p > 45) { G.imperial.special = true; G.allegiance = "empire"; report("Special status", `${w.name} negotiates a special status: Imperial membership, local self-government.`, applyEffects({ legitimacy: 10, f: { federalists: 8 } })); G.record.agreements.push(`Negotiated special status for ${w.name} within the Empire (19 BBY)`); }
        else { report("The Empire refuses", "Your request for autonomy is noted — and your name added to a list.", applyEffects({ heat: 15 })); G.allegiance = "empire"; G.isb = 40; }
    } else if (path === "double") {
        G.allegiance = "empire";
        G.secretRebel = true;
        if (k === "senator") G.office.title = "Imperial Senator";
        report("A double life", "In public, you serve the Empire. In private, you will help those who fight it.", applyEffects({ f: { militarists: 4, centralists: 4 } }));
    } else if (path === "rebel") {
        G.allegiance = "rebel";
        enterOutsider("Rebel Organizer");
        G.rebellion = clamp(G.rebellion + 3);
        report("Underground", "You leave formal government and disappear into the resistance.", applyEffects({ f: { reformers: 10, independence: 6, militarists: -10 }, heat: 20 }));
        G.record.agreements.push(`Joined the resistance to the Empire (${eraYear(currentBBY())})`);
    }
    if (G.signed2000 && path !== "rebel" && chance(path === "resist" ? 45 : 20)) {
        G.record.arrests.push(eraYear(currentBBY()));
        report("Arrested", "The Imperial Security Bureau comes for the signatories of the Petition of the 2,000. You are one of them.");
        frontScene("outsider_path", { reason: "Arrested as a signatory of the Petition of the 2,000." });
        enterOutsider("Prisoner", 30);
    }
}

// Philosophy changes the toolbox: the same crisis offers different responses.
function ideologyResponses(kind) {
    const gov = governing();
    const opts = {
        corporatists: [
            { label: "Contract private security firms", hint: "Fast, expensive, unaccountable.", go: () => { G.garrison += 15; report("Private security", "Mercenary companies arrive under contract.", applyEffects({ treasury: -3, f: { corporatists: 4 }, g: { business: 3, workers: -2 } })); } },
            { label: "Offer corporate defence contracts", go: () => { G.garrison += 8; report("Defence contracts", "The shipyards and arms firms mobilise — at a price.", applyEffects({ p: { employment: 2 }, f: { corporatists: 5 }, g: { business: 4 } })); } }
        ],
        reformers: [
            { label: "Expand public emergency services", go: () => { report("Emergency services", "Shelters, field hospitals and rescue teams in every district.", applyEffects({ treasury: -2, p: { healthcare: 3 }, g: { elders: 4, workers: 3 }, f: { reformers: 4 } })); } },
            { label: "Emergency price controls", go: () => { report("Price controls", "Food and medicine prices are frozen.", applyEffects({ g: { workers: 5, urban: 4, business: -5 }, f: { reformers: 3, corporatists: -4 } })); } }
        ],
        militarists: [
            { label: "Declare emergency powers", go: () => { G.emergencyDeclared = 12; report("Emergency declared", "Emergency powers: decrees without court review, wartime measures unlocked.", applyEffects({ f: { militarists: 4, reformers: -4 }, i: { courts: -5 } })); } },
            { label: "Censor wartime information", go: () => { if (G.policies.censorship) G.policies.censorship.level = 0.6; report("Censorship", "The HoloNet carries only approved news.", applyEffects({ heat: -8, trust: -5, media: { herald: -8 }, f: { militarists: 3, reformers: -5 } })); } }
        ],
        federalists: [
            { label: "Raise local militias", go: () => { G.garrison += 10; report("Militias", "Every district raises its own defenders.", applyEffects({ g: { rural: 4, youth: 2 }, f: { federalists: 4 } })); } }
        ],
        centralists: [
            { label: "Place our forces under Republic command", go: () => { G.garrison += 12; report("Unified command", "Your forces join the Republic's chain of command.", applyEffects({ f: { centralists: 5, federalists: -3 } })); } }
        ],
        independence: [
            { label: "Seek our own terms with the attackers", go: () => { if (chance(45)) { G.siege = null; report("Separate terms", "The attackers accept your terms and move on.", applyEffects({ f: { independence: 5, centralists: -6 } })); } else report("Rebuffed", "The attackers are not interested in terms."); } }
        ],
        traditionalists: [
            { label: "Call on the old houses and clans", go: () => { G.garrison += 10; report("The old ways", "The noble houses and clans send their retainers.", applyEffects({ f: { traditionalists: 4 }, g: { traditional: 4 } })); } }
        ]
    };
    return (opts[G.ideology] || []).map(o => ({ ...o, label: `${FACTIONS[G.ideology].icon} ${o.label}`, disabled: !gov && G.office.kind !== "senator" }));
}
