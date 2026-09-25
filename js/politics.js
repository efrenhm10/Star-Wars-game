// ── POLITICS — the living simulation, elections, careers, dynasty ───

// ── Scenes: full-screen moments that demand an answer ──────────────

function pushScene(type, ctx = {}) { G.scenes.push({ type, ctx }); }
function frontScene(type, ctx = {}) { G.scenes.unshift({ type, ctx }); }

function sceneChoose(i) {
    const s = G.scenes[0];
    if (!s) return;
    const built = SCENES[s.type](s.ctx);
    const c = built.choices[i];
    if (!c || c.disabled) return;
    G.scenes.shift();
    c.go && c.go(s.ctx);
    render();
}


// ── The month ─────────────────────────────────────────────────────

function endMonth() {
    if (G.scenes.length) return;
    const approvalBefore = approval();
    const inboxBefore = G.inbox.length;
    quietReports = [];

    G.month++;
    if (G.month > 12) { G.month = 1; G.year++; tickYear(); }

    tickHistory();
    tickEconomy();
    tickPublic();
    tickGalaxy();
    tickOpinion();
    tickWar();
    tickLegislature();
    tickAppropriations();
    tickPromises();
    tickOffice();
    tickPersonal();
    tickInbox();
    rollEvents();

    G.ap = Math.min(capitalCap(), G.ap + capitalIncome());
    G.lastMonthDelta = approval() - approvalBefore;
    const happened = quietReports;
    quietReports = null;
    const fresh = Math.max(0, G.inbox.length - inboxBefore);
    const d = G.lastMonthDelta;
    toast(dateStr(), `Approval ${Math.round(approval())}% (${fmt(d)}). ${happened.length ? `${happened.length} development${happened.length > 1 ? "s" : ""} — see Consequences in your Office.` : "A quiet month."}${fresh ? ` ${fresh} new dossier${fresh > 1 ? "s" : ""} on your desk.` : ""}`, [], "month");
    saveGame();
}

function tickEconomy() {
    tickPolicies();
    tickDistricts();
    const target = 20 + (50 - approval()) * 0.8 + (G.planet.inequality - 50) * 0.3 + (50 - G.planet.housing) * 0.2 + G.situations.length * 3 + (G.autocrat ? 30 : 0);
    G.unrest = clamp(G.unrest + (target - G.unrest) * 0.1);
}

function tickPublic() {
    groupEntries().forEach(([k, g]) => {
        g.prev = g.a;
        g.a = clamp(g.a + (groupTarget(k) - g.a) * 0.05 + rnd(-0.8, 0.8), 2, 98);
    });
    const trustTarget = 50 + (G.rep - 60) * 0.3 + (G.consistency - 70) * 0.2 - G.heat * 0.15;
    G.trust = clamp(G.trust + (trustTarget - G.trust) * 0.03);
    const base = { senator: 30, chancellor: 80, minister: 50, local: 14, executive: 38, monarch: 42, hereditary: 40, council: 35, traditional: 35, clan: 35, movement: 25, opposition: 22, candidate: 18, outsider: 10 }[G.office.kind] || 20;
    G.influence = clamp(G.influence + (base - G.influence) * 0.02);
    Object.keys(G.media).forEach(k => { G.media[k] *= 0.97; });
    G.heat = clamp(G.heat - 0.4);
    if (G.autocrat) G.unrest = clamp(G.unrest + 1.5);

    // Legitimacy for those whose power doesn't come from the ballot.
    const k = G.office.kind;
    let anchor = null;
    if (k === "council") anchor = G.inst.legislature;
    if (k === "traditional") anchor = G.inst.traditional;
    if (k === "hereditary") anchor = (G.inst.military + G.inst.traditional) / 2;
    if (k === "clan" && G.clans) anchor = G.clans.reduce((s, c) => s + c.loyalty, 0) / G.clans.length;
    if (k === "movement") anchor = G.indep + 10;
    if (k === "minister") anchor = chancellor() ? 50 + chancellor().rel * 0.5 : 60;
    if (anchor != null) {
        const t = anchor * 0.45 + approval() * 0.35 + G.consistency * 0.2;
        G.legitimacy = clamp(G.legitimacy + (t - G.legitimacy) * 0.06);
    }
}

function tickGalaxy() {
    const gal = G.gal;
    const failing = Object.values(G.galaxy).filter(s => s.stability < 30).length;
    const warTarget = 25 + (60 - gal.diplomacy) * 0.5 + failing * 2;
    gal.war = clamp(gal.war + (warTarget - gal.war) * 0.05 + rnd(-2, 2.2));
    gal.refugees = clamp(gal.refugees + (gal.war * 0.7 - gal.refugees) * 0.06 + rnd(-1, 1));
    gal.military = clamp(gal.military + (45 + (gal.war - 30) * 0.4 - gal.military) * 0.03);
    gal.trade = clamp(gal.trade + (55 + (gal.diplomacy - 60) * 0.3 - (gal.war - 30) * 0.3 - gal.trade) * 0.04 + rnd(-1, 1));
    gal.diplomacy = clamp(gal.diplomacy + (62 - (gal.war - 30) * 0.3 - gal.diplomacy) * 0.03 + rnd(-1, 1));

    const ch = chancellor();
    if (ch) {
        const nudges = { militarists: { military: 0.3 }, corporatists: { trade: 0.3 }, reformers: { refugees: -0.3 }, centralists: { diplomacy: 0.2 } };
        Object.entries(nudges[ch.faction] || {}).forEach(([k, v]) => { gal[k] = clamp(gal[k] + v); });
    }

    Object.entries(G.galaxy).forEach(([key, s]) => {
        if (key === G.worldKey) {
            s.stability = clamp(100 - G.unrest * 0.8 + (approval() - 50) * 0.2);
            s.prosperity = Math.round((G.planet.employment + G.planet.infrastructure + (100 - G.planet.inequality)) / 3);
            s.indep = G.indep;
            return;
        }
        s.stability = clamp(s.stability + (55 - s.stability) * 0.02 + rnd(-2, 2) - (gal.war > 60 ? 0.6 : 0));
        s.prosperity = clamp(s.prosperity + (gal.trade - 55) * 0.02 + rnd(-1, 1));
        s.indep = clamp(s.indep + (50 - s.stability) * 0.01 + rnd(-0.5, 0.5));
        if (!s.independent && s.indep >= 72 && s.stability < 35 && chance(4)) {
            s.independent = true;
            const sen = worldSenator(key);
            if (sen) { sen.arena = "retired"; sen.title = `Former Senator of ${worldName(key)}`; }
            gal.war = clamp(gal.war + 6);
            gal.diplomacy = clamp(gal.diplomacy - 5);
            report("🔥 Secession", `${worldName(key)} declares independence from the Republic. Its delegation walks out of the Senate.`);
        }
    });
}

function tickLegislature() {
    G.bills.slice().forEach(b => {
        if (b.stuck) { if (chance(20)) b.stuck = null; else return; }
        if (G.agenda === b.id) b.momentum += 4;
        b.voteIn--;
        // Delegations drift over time.
        arenaNpcs(b.arena).forEach(n => {
            if (!b.npcPos[n.id]) b.npcPos[n.id] = npcInitialPosition(n, b);
            if (b.npcPos[n.id] === "undecided" && chance(15)) b.npcPos[n.id] = chance(50 + b.momentum) ? "for" : "against";
        });
        if (b.voteIn <= 0) {
            const vetoable = b.arena === "local" && (canDecree() || isConstitutionalMonarch()) && b.playerVote === "against";
            const res = resolveBillMaybeHold(b, vetoable);
            // Only stop the clock for votes you have a stake in.
            const stake = b.sponsor === "player" || b.petition || (b.keyVote && roleCat() === "senate") || (b.arena === arena() && b.playerVote && b.playerVote !== "abstain") || res.betrayals.length || res.vetoable
                || G.obligations.some(o => o.billKey === b.key) || G.promises.some(p => p.billKey === b.key);
            if (stake) pushScene("vote", res);
            else report(`${b.title}`, `${res.passed ? "Passed" : "Failed"} ${res.t.for}–${res.t.against} in the ${arenaName(b.arena)}.`, res.changes);
        }
    });
    ["senate", "local"].forEach(a => {
        const want = a === arena() ? 2 : 1;
        if (activeBills(a).length < want && chance(45)) spawnBill(a);
    });
}

function resolveBillMaybeHold(b, hold) {
    if (!hold) return resolveBill(b);
    const saved = b.fx;
    b.fx = { ...saved, p: {}, gal: {}, i: {}, treasury: 0, program: null, indep: 0, trustOnPass: 0, heatOnPass: 0, frontierAid: 0, armsJobs: 0 };
    const res = resolveBill(b);
    b.fx = saved;
    res.vetoable = res.passed;
    return res;
}

function tickPromises() {
    G.promises.filter(p => p.type === "trade" && p.due && monthsNow() >= p.due && !p.spawned).forEach(p => {
        p.spawned = true;
        const n = npc(p.npcId);
        const t = BILLS[p.billKey];
        if (!t) { if (!G.bills.some(b => b.key === p.billKey)) p.done = true; return; }
        if (!n || !n.alive || t.arena !== arena()) { p.done = true; return; }
        if (!G.bills.some(b => b.key === p.billKey)) createBill(p.billKey, n.id);
        report("A debt comes due", `${n.name}'s ${t.title} reaches the floor. You promised to vote FOR it.`);
    });
    G.promises = G.promises.filter(p => !p.done);

    const favors = G.promises.filter(p => p.type === "favor" && monthsNow() - p.made >= 3);
    if (favors.length && chance(14) && !G.inbox.some(d => d.id === "favor_called")) {
        const p = pick(favors);
        addDossier("favor_called", { npcId: p.npcId });
        p.done = true;
        G.promises = G.promises.filter(x => !x.done);
    }

    G.obligations.filter(o => !o.done && !o.asked && monthsNow() >= o.due).forEach(o => {
        o.asked = true;
        const t = BILLS[o.billKey];
        if (!t || t.arena !== arena()) { o.done = true; return; }
        if (!G.bills.some(b => b.key === o.billKey)) createBill(o.billKey);
        addDossier("lobbyist", { donor: o.donor, billKey: o.billKey });
    });
}

function tickOffice() {
    const o = G.office;
    const k = o.kind;

    if (o.termLeft != null && k !== "outsider") {
        o.termLeft--;
        if (isElected() && o.termLimit > 0 && o.termsServed + 1 >= o.termLimit && o.termLeft === 12) addDossier("final_term", {});
        if (o.termLeft <= 0) {
            if (k === "opposition" || k === "candidate") pushScene("campaign", { mode: "candidate", target: o.target });
            else if (k === "chancellor") pushScene("chancellor_election", { incumbent: true });
            else if (isElected()) {
                o.termsServed++;
                if (o.termLimit > 0 && o.termsServed >= o.termLimit && !G.autocrat) pushScene("term_limit", {});
                else if (G.autocrat) { o.termLeft = o.termYears * 12; report("No election is held", "The election date passes. Your government announces that 'conditions do not permit' a vote.", applyEffects({ trust: -6, unrest: 8, i: { courts: -5 } })); }
                else if (k === "local" && o.rung < 3) pushScene("career_choice", {});
                else pushScene("campaign", { mode: "reelection" });
            }
        }
    }

    // Supreme Chancellor cycle (when someone else holds it).
    if (k !== "chancellor" && !G.chancLocked && ["republic", "crisis", "newrepublic"].includes(G.era) && G.hist.no_confidence) {
        G.chancTermLeft--;
        if (G.chancTermLeft <= 0) {
            G.chancTermLeft = 48;
            const eligible = (k === "senator" || k === "minister") && G.influence >= 45;
            if (eligible) pushScene("chancellor_election", { incumbent: false });
            else electNpcChancellor(null);
        }
    }

    // Legitimacy review for non-elected power, once a year.
    if (KIND_INFO[k].legit && G.month === 6 && G.legitimacy < 28 && k !== "movement") pushScene("challenge", {});

    // Recall and confidence.
    if (G.const.recall && isElected() && k !== "chancellor" && approval() < 30 && chance(8)) pushScene("campaign", { mode: "recall" });
    if (k === "executive" && /Parliament/i.test(G.const.gov) && G.inst.legislature < 25 && chance(12)) pushScene("no_confidence", {});

    // Autocracy has its own ending.
    if (G.autocrat && G.unrest >= 95 && !G.scenes.some(s => s.type === "revolution")) pushScene("revolution", {});

    // Life outside office.
    if (k === "outsider") {
        const sub = o.sub;
        if (sub === "Lobbyist") G.funds += 0.4;
        if (sub === "Corporate Executive") { G.funds += 0.8; G.factions.corporatists = clamp(G.factions.corporatists + 0.5, -100, 100); }
        if (sub === "Diplomat") G.gal.diplomacy = clamp(G.gal.diplomacy + 0.3);
        if (sub === "Prisoner" || sub === "Exile") {
            o.timer--;
            if (o.timer <= 0) pushScene("outsider_path", { reason: sub === "Prisoner" ? "You are released from prison, older and quieter." : "Your exile ends. The government permits your return." });
        }
    }
}

function tickPersonal() {
    if (G.age > 55) G.health = clamp(G.health - 0.12);
    if (G.health < 80 && G.age < 55) G.health = clamp(G.health + 0.2);
    const p = (G.age > 60 ? (G.age - 60) * 0.03 : 0) + (G.health < 25 ? 1 : 0) + (G.health < 10 ? 4 : 0);
    if (chance(p) && !G.scenes.some(s => s.type === "death")) pushScene("death", { reason: `${G.name} dies at the age of ${G.age}.` });

    // Secrets surface.
    G.secrets.filter(s => !s.exposed).forEach(s => {
        const p = G.heat * 0.06 + rivals().length * 0.3;
        if (chance(p) && !G.inbox.some(d => d.id === "scandal")) addDossier("scandal", { text: s.text });
    });
}

function tickYear() {
    G.age++;
    G.family.children.forEach(c => { c.age++; });
    G.programs.forEach(p => { p.left--; });
    G.programs.filter(p => p.left <= 0).forEach(p => log(`📐 The ${p.name} (founded by ${p.founder} in Year ${p.started}) completes its mandate.`, "legacy"));
    G.programs = G.programs.filter(p => p.left > 0);

    livingNpcs().forEach(n => {
        n.influence = clamp(n.influence + ri(-5, 6));
        if (!n.canon && chance(2) && n.id !== G.chancellorId) {
            n.alive = false;
            log(`${n.name} (${n.title}) has died.`, "world");
            if (n.arena === "senate" && G.galaxy[n.world] && G.galaxy[n.world].senatorId === n.id && !G.galaxy[n.world].independent) {
                const rep = makeNpc({ world: n.world, title: n.title, arena: "senate" });
                G.npcs.push(rep);
                G.galaxy[n.world].senatorId = rep.id;
            }
            if (n.arena === "local") G.npcs.push(makeNpc({ world: G.worldKey, title: n.title, arena: "local", votes: n.votes }));
        }
    });
    if (G.family.spouse && G.family.spouse.alive && G.age > 60 && chance(3)) {
        G.family.spouse.alive = false;
        report("A death in the family", `Your spouse, ${G.family.spouse.name}, has died. The capital sends condolences; your rivals send flowers.`, applyEffects({ health: -8, g: { elders: 2, religious: 2 } }));
    }
    log(`Year ${G.year} begins. Approval ${Math.round(approval())}%, influence ${Math.round(G.influence)}, unrest ${Math.round(G.unrest)}.`, "year");
}


// ── Dossiers (the inbox) ──────────────────────────────────────────

let dossierUid = 1;

function addDossier(id, ctx = {}) {
    const ev = EVENTS[id];
    if (!ev) return;
    G.inbox.push({ uid: `d${Date.now()}${dossierUid++}`, id, ctx, deadline: ctx.deadline || ev.deadline || 3, received: dateStr() });
    G.lastEvents[id] = monthsNow();
}

function tickInbox() {
    G.inbox.slice().forEach(d => {
        d.deadline--;
        if (d.deadline <= 0) {
            const built = EVENTS[d.id].build(G, d.ctx);
            const def = built.def != null ? built.def : built.choices.length - 1;
            resolveDossier(d.uid, def, true);
        }
    });
}

function rollEvents() {
    if (G.inbox.length >= 4) return;
    if (!chance(G.inbox.length ? 40 : 65)) return;
    const eligible = [];
    Object.entries(EVENTS).forEach(([id, ev]) => {
        if (!ev.weight) return;
        if (G.lastEvents[id] && monthsNow() - G.lastEvents[id] < (ev.cooldown || 14)) return;
        if (G.inbox.some(d => d.id === id)) return;
        const w = typeof ev.weight === "function" ? ev.weight(G) : ev.weight;
        if (!w) return;
        const ctx = ev.setup ? ev.setup(G) : {};
        if (ctx) eligible.push({ id, ctx, w });
    });
    if (!eligible.length) return;
    const total = eligible.reduce((s, e) => s + e.w, 0);
    let r = Math.random() * total;
    for (const e of eligible) {
        r -= e.w;
        if (r <= 0) { addDossier(e.id, e.ctx); return; }
    }
}

function resolveDossier(uid, choiceIndex, auto = false) {
    const d = G.inbox.find(x => x.uid === uid);
    if (!d) return;
    const ev = EVENTS[d.id];
    const built = ev.build(G, d.ctx);
    const c = built.choices[choiceIndex];
    if (!auto && c.ap && G.ap < c.ap) return toast("No political capital left", "That response needs political capital you don't have this month.");
    if (!auto && c.need && !c.need(G)) return;
    G.inbox = G.inbox.filter(x => x.uid !== uid);
    if (!auto && c.ap) G.ap -= c.ap;
    const changes = applyEffects(c.e);
    let msg = c.msg || "";
    if (c.run) {
        const r = c.run(G, d.ctx, changes);
        if (typeof r === "string") msg = r;
    }
    if (c.e && c.e.f) publish(built.topic || built.title.toLowerCase(), c.e.f);
    const title = auto ? `⌛ ${built.title} — no response` : built.title;
    report(title, auto ? `You let the deadline pass. ${msg}` : msg, changes);
    render();
}


// ── Elections ─────────────────────────────────────────────────────

function newOpponent(extra = 0) {
    const worst = Object.keys(FACTIONS).sort((a, b) => G.factions[a] - G.factions[b])[0];
    const localRival = rivals().find(n => n.arena === "local");
    G.opponent = localRival && chance(40)
        ? { name: localRival.name, faction: localRival.faction, npcId: localRival.id }
        : { name: randomName(G.worldKey), faction: worst };
    G.opp = clamp(44 + world().difficulty * 2 + extra + rnd(-4, 4), 30, 75);
}

function runElection(ctx, bonus) {
    const common = electionCommon(bonus) + rnd(-3, 3);
    const breakdown = G.districts.map(d => [d.name, Math.round(districtShare(d, common, rnd(-4, 4)) * 10) / 10, d.pop]);
    const tot = breakdown.reduce((s, b) => s + b[2], 0);
    const share = breakdown.reduce((s, b) => s + b[1] * b[2], 0) / tot;
    const won = share > 50;
    const turnout = Math.round(clamp(55 + Math.abs(share - 50) * 0.3 + G.unrest * 0.1 + rnd(-6, 6), 30, 90));
    G.funds = Math.max(0, G.funds * 0.4);
    G.endorsements = 0;
    G.districts.forEach(d => { d.boost = 0; });
    ctx = { ...ctx, turnout };
    frontScene("election_result", { ...ctx, share: Math.round(share * 10) / 10, won, breakdown, opponent: G.opponent });
}

function officeSpecFromCurrent() {
    const o = G.office;
    return { title: o.title, kind: o.kind, desc: o.desc, rung: o.rung, term: o.termYears, limit: o.termLimit };
}

function nextRungSpec() {
    const r = (G.office.rung ?? 0) + 1;
    if (r >= 3) {
        const sen = world().roles.find(x => x.kind === "senator");
        return sen ? { ...sen, fresh: true } : null;
    }
    return { title: LADDER[r], kind: "local", rung: r, term: r === 2 ? 4 : 3, limit: 0, desc: `The next rung of the ladder on ${world().name}.`, fresh: true };
}

function winOffice(spec) {
    const o = makeOffice({ ...spec, fresh: true });
    setOffice(o);
    newOpponent();
}


// ── Chancellor ────────────────────────────────────────────────────

function chancellorShare(incumbent) {
    const seatsTotal = Object.values(FACTIONS).reduce((s, f) => s + f.seats, 0);
    const fs = Object.entries(FACTIONS).reduce((s, [k, f]) => s + G.factions[k] * f.seats / seatsTotal, 0);
    return clamp(32 + G.influence * 0.25 + fs * 0.3 + allies().filter(n => n.arena === "senate").length * 1.5 - rivals().filter(n => n.arena === "senate").length * 1.5 + (incumbent ? 4 : 0) - G.heat / 6 + rnd(-8, 8), 5, 90);
}

function electNpcChancellor(endorsedId) {
    const cands = livingNpcs().filter(n => n.arena === "senate").sort((a, b) => b.influence - a.influence).slice(0, 3);
    let winner = cands[0];
    // The canon backbone: Palpatine keeps the Chancellery unless the player takes it from him.
    const pal = canonNpc("palpatine");
    if (pal && G.hist.no_confidence && G.era !== "newrepublic") { winner = pal; }
    else if (endorsedId) {
        const e = npc(endorsedId);
        if (e && chance(55)) winner = e;
    } else {
        winner = pick(cands);
    }
    const old = chancellor();
    G.chancellorId = winner.id;
    winner.influence = clamp(winner.influence + 20);
    winner.title = `Supreme Chancellor (${worldName(winner.world)})`;
    if (old && old !== winner) old.title = `Senator of ${worldName(old.world)}`;
    let note = "";
    if (winner.rel <= -30) {
        note = ` ${winner.name} has not forgotten your history: ${winner.memory[0] || "old grievances"} Expect your agenda to struggle.`;
        applyEffects({ influence: -6 });
    } else if (winner.rel >= 35) {
        note = ` An ally in the Chancellery opens doors for you.`;
        applyEffects({ influence: 5 });
        if (G.office.kind === "senator" && chance(50)) addDossier("ministry_offer", { npcId: winner.id });
    }
    if (endorsedId === winner.id) changeRel(winner, 15, "You endorsed them for Chancellor.");
    report("New Supreme Chancellor", `The Senate elects ${winner.name} of ${worldName(winner.world)} (${FACTIONS[winner.faction].name}).${note}`);
    if (G.office.kind === "minister" && winner.rel < 15) pushScene("dismissed", {});
}


// ── The constitution ──────────────────────────────────────────────

const isDemocratic = () => /democra|republic|Federation/i.test(G.const.gov) && !/Nominal/i.test(G.const.gov);

function traditionalKind() {
    const w = world();
    const r = w.roles.find(x => ["clan", "hereditary", "traditional", "council"].includes(x.kind));
    return r || null;
}

const AMENDMENTS = [
    { key: "remove_limit", title: () => "Remove the term limit",
      desc: "Let the people re-elect you as often as they like. Opponents will call it a power grab.",
      available: () => isElected() && G.office.termLimit > 0 && G.office.kind !== "local",
      g: { youth: -2, students: -2, elders: -1, business: 1 }, f: { reformers: -2, traditionalists: -1, federalists: -1, centralists: 1, militarists: 1, corporatists: 1 }, courtRisk: 35,
      apply: () => { G.office.termLimit = 0; setConstLimit(0); applyEffects({ rep: -6 }); } },
    { key: "extend_limit", title: () => "Allow one additional term",
      desc: "A modest change — one more term for everyone, starting with you.",
      available: () => isElected() && G.office.termLimit > 0 && G.office.kind !== "local",
      g: { youth: -1, students: -1 }, f: { reformers: -1, federalists: -1, centralists: 1 }, courtRisk: 15,
      apply: () => { G.office.termLimit++; setConstLimit(G.office.termLimit); } },
    { key: "add_limit", title: () => "Introduce a two-term limit",
      desc: "Bind yourself and every successor. Reformers will love it.",
      available: () => isElected() && G.office.termLimit === 0 && G.office.kind !== "local",
      g: { youth: 2, students: 1, workers: 1 }, f: { reformers: 2, federalists: 1 }, courtRisk: 0,
      apply: () => { G.office.termLimit = 2; setConstLimit(2); applyEffects({ rep: 6, trust: 4 }); } },
    { key: "extend_term", title: () => "Lengthen terms by two years",
      desc: "Fewer elections, more governing. Your current term is extended too.",
      available: () => isElected() && G.office.termYears > 0 && G.office.termYears < 7 && G.office.kind !== "local",
      g: { youth: -1, students: -1, elders: 1 }, f: { reformers: -2, federalists: -1, centralists: 1 }, courtRisk: 30,
      apply: () => { G.office.termYears += 2; G.office.termLeft += 24; if (G.office.kind === "senator") G.const.senateTerm += 2; else G.const.execTerm += 2; } },
    { key: "recall", title: () => "Introduce recall elections",
      desc: "Voters may remove any official mid-term. Including you.",
      available: () => isDemocratic() && !G.const.recall,
      g: { youth: 2, workers: 1 }, f: { reformers: 2, federalists: 1 }, courtRisk: 0,
      apply: () => { G.const.recall = true; applyEffects({ trust: 4 }); } },
    { key: "judicial_up", title: () => "Strengthen judicial independence",
      desc: "Lifetime tenure for judges and a protected budget.",
      available: () => G.const.judicial < 85,
      g: { students: 1, business: 1 }, f: { reformers: 1, federalists: 1, traditionalists: 1, militarists: -1 }, courtRisk: 0,
      apply: () => { G.const.judicial = clamp(G.const.judicial + 20); G.const.courtReview = true; applyEffects({ i: { courts: 15 }, rep: 3 }); } },
    { key: "judicial_down", title: () => "Place the courts under legislative oversight",
      desc: "Judges who obstruct the people's will can be removed by the legislature.",
      available: () => G.const.judicial > 20,
      g: { students: -2, youth: -1, elders: 1 }, f: { militarists: 1, centralists: 1, reformers: -3, federalists: -1 }, courtRisk: 60,
      apply: () => { G.const.judicial = clamp(G.const.judicial - 25); applyEffects({ i: { courts: -20 }, rep: -8 }); } },
    { key: "emergency", title: () => "Grant the executive emergency powers",
      desc: "Decrees may bypass the legislature and cannot be enjoined by courts during an emergency.",
      available: () => canDecree() && !constitution().emergency,
      g: { youth: -2, students: -2, elders: 1, military: 2 }, f: { militarists: 2, centralists: 1, reformers: -3, federalists: -2 }, courtRisk: 45,
      apply: () => { constitution().emergency = true; applyEffects({ rep: -5 }); } },
    { key: "democratize", title: () => world().const.gov.includes("Fragmented") ? "Found a unified planetary government" : G.const.gov.includes("Clan") || G.const.gov.includes("clan") ? "Replace clan rule with representative democracy" : G.const.gov.includes("Corporate") || G.const.gov.includes("corporate") ? "End corporate control of government" : G.const.gov.includes("Hereditary") ? "Establish a constitutional monarchy with an elected government" : "Create an elected government",
      desc: "Transform the political system itself. The old powers will not go quietly.",
      available: () => !isDemocratic() && !G.office.kind.match(/senator|minister|chancellor/),
      g: { youth: 3, students: 2, workers: 1, traditional: -3, elites: -1 }, f: { reformers: 3, federalists: 1, traditionalists: -3, corporatists: -1 }, courtRisk: 10,
      apply: () => {
          const fragmented = G.const.gov.includes("Fragmented");
          Object.assign(G.const, { gov: fragmented ? "Planetary Federation (representative democracy)" : "Representative democracy", legislature: "Elected planetary assembly", executive: "Elected first minister", referendum: true, execTerm: 4, execLimit: 2, courtReview: true, judicial: Math.max(G.const.judicial, 50), militaryControl: "Civilian", elections: "District + planetary representation", amendment: "Difficult" });
          const title = fragmented ? `First Governor of ${world().name}` : "First Minister";
          setOffice(makeOffice({ title, kind: "executive", desc: "The first elected head of a new political order.", fresh: true, term: 4, limit: 2 }));
          applyEffects({ legitimacy: 20, i: { planetary: 20, legislature: 15, traditional: -15 }, p: fragmented ? { infrastructure: 5, crime: -5 } : {} });
          newOpponent();
      } },
    { key: "restore_tradition", title: () => { const r = traditionalKind(); return r ? `Restore rule by the ${r.kind === "clan" ? "clans" : r.kind === "hereditary" ? "crown" : "council"}` : "Restore the old order"; },
      desc: "End elections and return authority to the traditional powers — with you at the head.",
      available: () => isDemocratic() && !!traditionalKind() && ["executive", "monarch"].includes(G.office.kind),
      g: { traditional: 4, elders: 1, youth: -3, students: -3 }, f: { traditionalists: 3, reformers: -3, federalists: -1 }, courtRisk: 40,
      apply: () => {
          const r = traditionalKind();
          G.const.gov = world().const.gov;
          G.const.referendum = false;
          setOffice(makeOffice({ ...r }));
          G.legitimacy = 65;
          applyEffects({ rep: -4, i: { traditional: 20, legislature: -15 } });
      } },
    { key: "independence", title: () => `Independence referendum for ${world().name}`,
      desc: "Leave the Republic. Public support is the independence number itself.",
      available: () => !G.galaxy[G.worldKey].independent && (G.office.kind === "movement" || (canDecree() && G.office.kind !== "chancellor" && G.indep >= 40)),
      g: {}, f: { independence: 3, federalists: 1, traditionalists: 1, centralists: -3, militarists: -2 }, courtRisk: 25, independence: true,
      apply: () => {
          G.galaxy[G.worldKey].independent = true;
          const sen = worldSenator(G.worldKey);
          if (sen) { sen.arena = "retired"; sen.title = `Former Senator of ${world().name}`; }
          G.const.gov = `Independent ${isDemocratic() ? "republic" : "state"}`;
          setOffice(makeOffice({ title: `Head of State of Free ${world().name}`, kind: "executive", desc: "Leader of a newly independent world.", fresh: true, term: 5, limit: 2 }));
          applyEffects({ gal: { war: 8, diplomacy: -8 }, f: { independence: 25, centralists: -30 }, legitimacy: 20, indep: 30 });
          G.bills = G.bills.filter(b => b.arena !== "senate");
          newOpponent();
      } }
];

function setConstLimit(n) {
    const k = G.office.kind;
    if (k === "chancellor") G.galConst.execLimit = n;
    else if (k === "senator") G.const.senateLimit = n;
    else G.const.execLimit = n;
}

function amendmentDef(key) { return AMENDMENTS.find(a => a.key === key); }

function amendmentSupport(am) {
    const c = constitution();
    const bonus = G.amendment || { leg: 0, pub: 0, court: 0 };
    const senateLevel = G.office.kind === "chancellor";
    let wsum = 0, lsum = 0;
    Object.keys(FACTIONS).forEach(f => {
        const w = senateLevel ? FACTIONS[f].seats : ((world().lean || {})[f] ?? 0.4);
        wsum += w;
        lsum += w * clamp(50 + G.factions[f] * 0.4 + (am.f[f] || 0) * 14);
    });
    let leg = lsum / wsum + bonus.leg + (G.inst.legislature - 50) * 0.25;
    if (G.clans && ["clan", "executive"].includes(G.office.kind)) leg = leg * 0.6 + (G.clans.reduce((s, x) => s + x.loyalty, 0) / G.clans.length) * 0.4;

    let pub;
    if (am.independence) pub = G.indep + bonus.pub;
    else {
        let ws = 0, ps = 0;
        groupEntries().forEach(([k, g]) => { ws += g.w; ps += g.w * clamp(g.a * 0.6 + 20 + (am.g[k] || 0) * 9); });
        pub = ps / ws + bonus.pub;
    }
    const court = !c.courtReview ? 100 : clamp(100 - am.courtRisk * c.judicial / 70 + (G.inst.courts - 50) * 0.4 + bonus.court, 5, 97);
    return {
        leg: clamp(leg), legNeed: c.legThreshold * 100,
        pub: clamp(pub), pubNeed: (c.refThreshold || 0.5) * 100, referendum: c.referendum || am.independence,
        court, courtReview: c.courtReview
    };
}

function startAmendment(key) {
    if (G.amendment) return;
    if (!spendAP(8)) return;
    G.amendment = { key, leg: 0, pub: 0, court: 0, started: monthsNow() };
    const am = amendmentDef(key);
    report("Constitutional campaign launched", `You formally propose: “${am.title()}”. The long work of building a coalition begins.`, applyEffects({ influence: -3 }));
    publish(`the ${am.title().toLowerCase()} proposal`, am.f, true);
    render();
}

function amendmentAction(type) {
    const a = G.amendment;
    if (!a) return;
    if (type === "abandon") {
        G.amendment = null;
        report("Amendment abandoned", "You withdraw the proposal. Some call it prudence; others, weakness.", applyEffects({ influence: -5 }));
        return render();
    }
    if (!spendAP(4)) return;
    let ch = [];
    if (type === "negotiate") {
        if (G.influence < 4) { G.ap += 4; return toast("Not enough influence", "Deals cost influence."); }
        a.leg += ri(4, 7);
        ch = applyEffects({ influence: -4, i: { legislature: 1 } });
        report("Deals struck", "You trade committee seats, projects and promises for votes on the amendment.", ch);
    }
    if (type === "campaign") {
        if (G.funds < 1.5) { G.ap += 4; return toast("Not enough funds", "A public campaign costs 1.5M credits."); }
        a.pub += ri(3, 6);
        ch = applyEffects({ funds: -1.5 });
        report("Public campaign", "Rallies, ads and town halls make your case to the public.", ch);
    }
    if (type === "judiciary") {
        a.court += ri(6, 10);
        if (chance(30)) {
            ch = applyEffects({ secret: "Pressured judges ahead of constitutional review", secretHeat: 15, i: { courts: -6 } });
            report("Quiet words with judges", "You make your views known to certain judges. Not everyone appreciated the call.", ch);
        } else report("Quiet words with judges", "Legal scholars sympathetic to your cause publish favourable opinions.");
    }
    render();
}

function callAmendmentVote() {
    const a = G.amendment;
    if (!a) return;
    const am = amendmentDef(a.key);
    const s = amendmentSupport(am);
    const legShare = clamp(s.leg + rnd(-4, 4));
    const pubShare = clamp(s.pub + rnd(-4, 4));
    const courtPass = chance(s.court);
    pushScene("amendment_vote", {
        key: a.key, title: am.title(), stage: 0,
        legShare: Math.round(legShare * 10) / 10, legNeed: s.legNeed, legPass: legShare >= s.legNeed,
        pubShare: Math.round(pubShare * 10) / 10, pubNeed: s.pubNeed, pubPass: !s.referendum || pubShare >= s.pubNeed, referendum: s.referendum,
        courtReview: s.courtReview, courtPass
    });
    G.amendment = null;
    render();
}

function finishAmendment(ctx) {
    const am = amendmentDef(ctx.key);
    const passed = ctx.legPass && ctx.pubPass && (!ctx.courtReview || ctx.courtPass);
    if (passed) {
        am.apply();
        applyEffects({ f: am.f, influence: 5 });
        G.amendments.push({ title: ctx.title, year: G.year, by: G.name });
        log(`⚖️ CONSTITUTIONAL AMENDMENT ADOPTED: ${ctx.title}.`, "legacy");
        publish(ctx.title.toLowerCase(), am.f, true);
    } else {
        const where = !ctx.legPass ? "in the legislature" : !ctx.pubPass ? "at referendum" : "in the courts";
        report("Amendment defeated", `“${ctx.title}” fails ${where}.`, applyEffects({ influence: -8, rep: am.courtRisk >= 30 ? -3 : 0 }));
        log(`⚖️ Amendment defeated ${where}: ${ctx.title}.`, "legacy");
    }
    return passed;
}


// ── Careers after office ──────────────────────────────────────────

const OUTSIDER_PATHS = [
    { sub: "Opposition Leader", desc: "Stay in the fight. Lead the opposition and run again at the next election.", need: () => !!G.lastElectedSpec },
    { sub: "Lobbyist",           desc: "Sell what you know. Earn funds and keep working the Senate floor — without a vote." },
    { sub: "Activist",           desc: "Build a movement from the street up." },
    { sub: "Journalist",         desc: "Hold the powerful to account — especially the ones who beat you." },
    { sub: "Corporate Executive",desc: "Join a board. Money, access, and the Corporatists' gratitude." },
    { sub: "Diplomat",           desc: "Serve the Republic abroad. Requires a decent reputation.", need: () => G.rep >= 45 },
    { sub: "Revolutionary",      desc: "The system is rotten. Organise outside it.", need: () => G.autocratFallen || G.factions.independence > 20 || G.unrest > 60 }
];

function enterOutsider(sub, timer = 0) {
    if (sub === "Opposition Leader" && G.lastElectedSpec) {
        setOffice(makeOffice({ title: "Opposition Leader", kind: "opposition", target: G.lastElectedSpec, months: (G.lastElectedSpec.term || 4) * 12 }));
        newOpponent(3);
        return;
    }
    if (sub === "Revolutionary") {
        setOffice(makeOffice({ title: "Revolutionary Leader", kind: "movement", desc: "Leading a movement outside the system." }));
        G.legitimacy = 40;
        return;
    }
    setOffice(makeOffice({ title: sub, kind: "outsider", sub, timer }));
}

function rememberElectedSpec() {
    if (isElected() && G.office.kind !== "chancellor") G.lastElectedSpec = officeSpecFromCurrent();
}

function runForOffice(roleIndex) {
    const r = world().roles[roleIndex];
    if (!spendAP(5)) return;
    setOffice(makeOffice({ title: `Candidate for ${r.title}`, kind: "candidate", target: { ...r }, months: 8 }));
    newOpponent(2);
    report("Campaign launched", `You declare your candidacy for ${r.title}. The election is in 8 months.`);
    render();
}


// ── Succession and the dynasty ────────────────────────────────────

function endCareer(reason) {
    const d = G.dynasty[G.dynasty.length - 1];
    d.end = G.year;
    d.reason = reason;
    d.finalApproval = Math.round(approval());
    d.legacy = G.programs.filter(p => p.founder === G.name).map(p => p.name).concat(G.amendments.filter(a => a.by === G.name).map(a => a.title));
    log(`🕯️ The career of ${G.name} ends. ${reason}`, "career");

    const cands = [];
    G.family.children.filter(c => c.alive && c.age >= 20).forEach(c => cands.push({ name: `${c.name} ${lastName(G.name)}`, relation: "Your child", age: c.age, bonus: 8 }));
    const ally = allies()[0];
    cands.push({ name: randomName(G.worldKey), relation: ally ? `Your protégé (recommended by ${ally.name})` : "Your protégé", age: ri(29, 38), bonus: 4 });
    cands.push({ name: G.chiefOfStaff, relation: "Your chief of staff", age: ri(36, 50), bonus: 2 });
    pushScene("succession", { reason, cands });
}

function beginSuccessor(s, roleIndex) {
    const prev = G.name;
    const role = world().roles[roleIndex];
    G.generation++;
    G.name = s.name;
    G.age = s.age;
    G.health = ri(82, 96);
    G.rep = clamp(G.rep * 0.5 + 30 + s.bonus);
    G.trust = 52;
    G.consistency = 72;
    G.influence = role.kind === "local" ? 10 : 20 + s.bonus;
    G.funds = Math.max(2, G.funds * 0.5);
    G.heat = 0;
    G.autocrat = false;
    G.secrets = G.secrets.filter(() => chance(20));
    G.promises = [];
    G.obligations = [];
    G.amendment = null;
    G.inbox = [];
    G.family = makeFamily();
    if (G.family.spouse && chance(30)) G.family.spouse = null;
    G.chiefOfStaff = randomName(G.worldKey);
    G.officesHeld = [];
    const heirApp = s.relation === "Your child" ? { ...G.app, hair: pick(["short", "long", "bun", "braids"]), age: "young", accessory: "none" } : randomAppearance(pick(world().species));
    if (s.relation === "Your child" && SPECIES[heirApp.species].skins.length > 1 && chance(40)) heirApp.skin = pick(SPECIES[heirApp.species].skins);
    G.app = heirApp;
    G.committees = []; G.chairOf = null; G.seniority = 0; G.signed2000 = false; G.secretRebel = false; G.isb = 0; G.homeDelivered = 0;
    livingNpcs().forEach(n => {
        const old = n.rel;
        n.rel = Math.round(n.rel * 0.5);
        if (Math.abs(old) >= 30) remember(n, `Remembers ${prev} — and judges the successor by the predecessor.`);
    });
    Object.values(G.groups).forEach(g => { g.a = clamp(g.a * 0.6 + 20); });
    setOffice(makeOffice(role), { silent: true });
    G.ap = 10;
    G.dynasty.push({ name: s.name, generation: G.generation, from: G.year, offices: [role.title], end: null, legacy: [] });
    newOpponent();
    log(`👑 Generation ${G.generation}: ${s.name} (${s.relation.toLowerCase()}) takes up the family's cause as ${role.title}. The galaxy they inherit was shaped by ${prev}.`, "career");
    saveGame();
}


// ── Role-specific actions (homeworld) ─────────────────────────────

function roleAction(type, arg) {
    if (!spendAP()) return;
    let ch = [];
    const w = world();
    switch (type) {
        case "stop": {
            ch = applyEffects({ g: { [arg]: 5 }, funds: -0.3 });
            report("Campaign stop", `You spend the week with ${GROUPS[arg].name.toLowerCase()}. They noticed.`, ch);
            break;
        }
        case "service": {
            ch = applyEffects({ g: { [arg]: 3 }, trust: 1 });
            report("Constituent services", `Your office quietly fixes problems for ${GROUPS[arg].name.toLowerCase()}.`, ch);
            break;
        }
        case "clan": {
            const c = G.clans.find(x => x.name === arg);
            c.loyalty = clamp(c.loyalty + 9);
            G.clans.forEach(x => { if (x !== c) x.loyalty = clamp(x.loyalty - 2); });
            syncClanLegitimacy();
            ch = applyEffects({ influence: -2 });
            report(`Clan ${c.name} courted`, `Gifts, honours and a seat at your table. The other clans notice the favouritism.`, ch);
            break;
        }
        case "conclave": {
            ch = applyEffects({ clans: 3, legitimacy: 4, influence: -5, i: { traditional: 4 } });
            report("Conclave held", "You gather the leaders under ancient custom. Everyone leaves feeling heard, if not satisfied.", ch);
            break;
        }
        case "rally": {
            ch = applyEffects({ indep: 3, unrest: 4, g: { youth: 3, traditional: 2 }, gal: { diplomacy: -1 }, f: { independence: 3, centralists: -2 } });
            report("Mass rally", `Tens of thousands fill the streets for a free ${w.name}.`, ch);
            break;
        }
        case "shadow": {
            ch = applyEffects({ legitimacy: 5, indep: 1, funds: -0.5, i: { local: 4 } });
            report("Shadow institutions", "Your movement runs schools, clinics and courts. People start to see it as a government-in-waiting.", ch);
            break;
        }
        case "autonomy": {
            ch = applyEffects({ indep: -2, influence: 6, rep: 3, f: { federalists: 4, independence: -2 }, i: { planetary: 3 } });
            report("Autonomy talks", "You negotiate more self-government instead of full independence. Hardliners call it a sell-out.", ch);
            break;
        }
        case "attack": {
            ch = applyEffects({ opp: -3, trust: -2, g: { [arg]: 2 } });
            report("Attack the government", "You go after the government's record. The attacks land — and leave you looking a little meaner.", ch);
            break;
        }
        case "organize": {
            ch = applyEffects({ g: { [arg]: 4 }, influence: 2, unrest: 1 });
            report("Organising", `You build a network among ${GROUPS[arg].name.toLowerCase()}.`, ch);
            break;
        }
        case "investigate": {
            const n = npc(arg);
            n.influence = clamp(n.influence - 12);
            changeRel(n, -25, "You published an investigation into their dealings.");
            ch = applyEffects({ trust: 2, rep: 2, influence: 2 });
            report("Investigation published", `Your exposé on ${n.name} runs across the HoloNet.`, ch);
            break;
        }
        case "mediate": {
            ch = applyEffects({ world: { key: arg, stability: 8 }, gal: { diplomacy: 2 }, rep: 2, influence: 2 });
            report("Mediation mission", `You broker talks on ${worldName(arg)}.`, ch);
            break;
        }
        case "ministry": {
            const m = MINISTRIES.find(x => x.key === G.office.ministry);
            const e = {
                finance: { gal: { trade: 5 }, f: { corporatists: 4 }, g: { business: 3 } },
                defense: { gal: { military: 6, war: -2 }, f: { militarists: 4, reformers: -2 }, g: { military: 3, veterans: 3 } },
                interior: { world: Object.keys(G.galaxy).filter(k => G.galaxy[k].stability < 40).slice(0, 3).map(k => ({ key: k, stability: 6 })), f: { centralists: 4, federalists: -2 } },
                welfare: { gal: { refugees: -5 }, f: { reformers: 4 }, g: { elders: 2, workers: 2 } },
                planetary: { world: shuffle(Object.keys(G.galaxy)).slice(0, 4).map(k => ({ key: k, prosperity: 4 })), f: { federalists: 4 } }
            }[m.key];
            ch = applyEffects({ ...e, influence: -4 });
            report(`${m.name}: initiative`, "Your ministry launches a new galactic initiative.", ch);
            publish(`the ministry's new initiative`, e.f);
            break;
        }
        case "order": {
            const orders = {
                peace: { gal: { diplomacy: 6, war: -5, military: -3 }, f: { reformers: 3, militarists: -4 }, msg: "You open peace talks with the separatist worlds." },
                fleet: { gal: { military: 10, war: -3, diplomacy: -2 }, f: { militarists: 5, reformers: -4 }, msg: "You order the fleet expanded." },
                trade: { gal: { trade: 8 }, f: { corporatists: 4, reformers: -1 }, msg: "You sign a sweeping trade compact." },
                relief: { gal: { refugees: -8 }, world: Object.keys(G.galaxy).filter(k => G.galaxy[k].stability < 45).map(k => ({ key: k, stability: 5 })), f: { reformers: 4, corporatists: -2 }, msg: "You launch a galaxy-wide relief effort." }
            }[arg];
            ch = applyEffects({ ...orders, influence: -5, i: { legislature: -2 } });
            report("Chancellery order", orders.msg, ch);
            publish("the Chancellor's order", orders.f);
            break;
        }
    }
    render();
}


// ── The first morning ─────────────────────────────────────────────

function seedInbox() {
    newOpponent();
    addDossier("mining_access", EVENTS.mining_access.setup(G));
    rollEvents();
}
