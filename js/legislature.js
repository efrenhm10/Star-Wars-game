// ── LEGISLATURE — bills, delegations, whipping and votes ────────────
//
// The Senate (and every planetary legislature) is modelled as faction blocs
// plus named delegations. Blocs lean according to how the bill serves their
// philosophy; named delegations are people with memories, who can be
// persuaded, bought with a favour, or betrayed.

// stance: −3 (hostile) … +3 (champions it), per faction.
const BILLS = {
    // Galactic Senate
    security_auth: { arena: "senate", title: "Emergency Security Authorization", desc: "Expands the security bureau's powers of search, detention and surveillance during the current emergency.",
        stance: { militarists: 3, centralists: 2, traditionalists: 1, corporatists: 0, federalists: -2, reformers: -2, independence: -3 },
        g: { military: 6, veterans: 4, elders: 3, youth: -5, students: -5 }, p: { crime: -3 }, gal: { military: 6, war: -3 }, i: { courts: -4 } },
    kuat_shipping: { arena: "senate", title: "Kuat Shipping Act", desc: "Grants exclusive hyperlane freight contracts to the major core-world shipbuilders.",
        stance: { corporatists: 3, centralists: 1, militarists: 1, federalists: -1, reformers: -2, independence: -1, traditionalists: 0 },
        g: { business: 6, elites: 5, workers: -2, unions: -4 }, p: { employment: 1, inequality: 2 }, gal: { trade: 6 } },
    water_relief: { arena: "senate", title: "Outer Rim Water Relief Act", desc: "Funds water infrastructure on drought-stricken frontier worlds.",
        stance: { reformers: 3, federalists: 1, centralists: 1, corporatists: -2, militarists: -1, independence: 1, traditionalists: 0 },
        g: { farmers: 5, rural: 5, elites: -2 }, frontierAid: 10 },
    refugee_resettlement: { arena: "senate", title: "Refugee Resettlement Act", desc: "Distributes refugees from conflict zones across member worlds by quota.",
        stance: { reformers: 3, centralists: 1, traditionalists: -2, militarists: -1, federalists: -1, corporatists: 0, independence: 0 },
        g: { religious: 4, workers: -2, urban: -2 }, p: { housing: -2 }, gal: { refugees: -12, diplomacy: 4 } },
    planetary_sovereignty: { arena: "senate", title: "Planetary Sovereignty Act", desc: "Returns regulatory authority from the Republic to member worlds.",
        stance: { federalists: 3, independence: 3, traditionalists: 1, centralists: -3, militarists: -1, corporatists: -1, reformers: 0 },
        g: { rural: 4, traditional: 5, urban: -2 }, i: { planetary: 6 }, indep: 5 },
    ethics_reform: { arena: "senate", title: "Senate Ethics & Lobbying Reform", desc: "Caps corporate donations and forces disclosure of lobbying meetings.",
        stance: { reformers: 3, federalists: 1, traditionalists: 0, centralists: 0, corporatists: -3, militarists: 0, independence: 1 },
        g: { youth: 4, students: 3, workers: 2, elites: -5, business: -3 }, trustOnPass: 4, i: { agencies: 6 } },
    education_fund: { arena: "senate", title: "Galactic Education Fund", desc: "A twenty-year investment in schools and universities across the Republic.",
        stance: { reformers: 3, centralists: 2, corporatists: -1, traditionalists: -1, militarists: -1, federalists: 0, independence: 0 },
        g: { students: 7, youth: 5, elites: -3 }, program: { name: "Galactic Education Fund", p: { education: 1.2 }, years: 20 } },
    military_approps: { arena: "senate", title: "Military Appropriations Bill", desc: "A 15% increase in fleet and army spending.",
        stance: { militarists: 3, corporatists: 1, centralists: 1, reformers: -2, federalists: -1, independence: -2, traditionalists: 1 },
        g: { military: 6, veterans: 3, students: -4 }, p: { education: -2 }, gal: { military: 12, war: 3 }, armsJobs: 4 },
    tariff_cut: { arena: "senate", title: "Hyperlane Tariff Reduction", desc: "Slashes tariffs on interstellar trade.",
        stance: { corporatists: 3, federalists: 1, centralists: 0, reformers: -1, militarists: 0, traditionalists: -1, independence: 0 },
        g: { business: 5, elites: 4, farmers: -4, workers: -2 }, gal: { trade: 10 } },
    mining_rights: { arena: "senate", title: "Mineral Rights Expansion Act", desc: "Opens protected worlds and moons to licensed mining.",
        stance: { corporatists: 3, militarists: 1, centralists: 0, federalists: -1, reformers: -2, traditionalists: -2, independence: -1 },
        g: { business: 5, workers: 2, environmentalists: -8, traditional: -6 }, p: { employment: 2, environment: -4 } },
    civil_liberties: { arena: "senate", title: "Civil Liberties Protection Act", desc: "Bars detention without trial and warrantless surveillance.",
        stance: { reformers: 2, federalists: 2, independence: 1, traditionalists: 0, centralists: -1, militarists: -3, corporatists: 0 },
        g: { youth: 5, students: 5, military: -5, elders: -2 }, i: { courts: 5 } },
    labor_rights: { arena: "senate", title: "Galactic Labour Standards Act", desc: "Minimum standards for wages, hours and safety across the Republic.",
        stance: { reformers: 3, centralists: 1, corporatists: -3, federalists: -1, militarists: 0, traditionalists: 0, independence: 0 },
        g: { workers: 7, unions: 8, business: -7, elites: -5 }, p: { inequality: -3, employment: -1 } },
    biotech_oversight: { arena: "senate", title: "Biotechnology Oversight Act", desc: "Ethical review boards for cloning and genetic engineering.",
        stance: { reformers: 2, traditionalists: 2, centralists: 1, corporatists: -2, militarists: -2, federalists: 0, independence: 0 },
        g: { religious: 5, business: -3 } },
    senate_centralization: { arena: "senate", title: "Republic Administrative Consolidation Act", desc: "Transfers planetary regulatory agencies to central ministries on Coruscant.",
        stance: { centralists: 3, militarists: 1, corporatists: 1, federalists: -3, independence: -3, traditionalists: -1, reformers: 0 },
        g: { urban: 2, traditional: -5, rural: -4 }, i: { planetary: -6 }, indep: -3 },

    // Planetary legislatures
    housing_program: { arena: "local", title: "Housing Construction Program", desc: "Public construction of affordable housing.",
        stance: { reformers: 3, centralists: 1, corporatists: -1, traditionalists: 0, militarists: 0, federalists: 0, independence: 0 },
        g: { youth: 6, urban: 6, workers: 4, elites: -3 }, p: { housing: 6, inequality: -2 }, treasury: -3 },
    min_wage: { arena: "local", title: "Minimum Wage Act", desc: "Raises the planetary minimum wage by a third.",
        stance: { reformers: 3, corporatists: -3, centralists: 0, traditionalists: 0, militarists: 0, federalists: 0, independence: 1 },
        g: { workers: 8, unions: 6, youth: 3, business: -8, elites: -4 }, p: { inequality: -4, employment: -2 } },
    env_protection: { arena: "local", title: "Environmental Protection Act", desc: "Emission caps and protected zones.",
        stance: { reformers: 2, traditionalists: 2, federalists: 0, corporatists: -3, militarists: -1, centralists: 0, independence: 1 },
        g: { environmentalists: 9, traditional: 5, business: -6, workers: -2 }, p: { environment: 7, employment: -2 } },
    police_expansion: { arena: "local", title: "Security Forces Expansion", desc: "Doubles the planetary security force and its powers.",
        stance: { militarists: 3, traditionalists: 2, centralists: 1, corporatists: 1, reformers: -2, independence: -2, federalists: 0 },
        g: { elders: 6, business: 4, military: 4, youth: -6 }, p: { crime: -6 }, i: { courts: -3 }, treasury: -2 },
    health_plan: { arena: "local", title: "Planetary Healthcare Plan", desc: "Universal public healthcare, funded by new taxes.",
        stance: { reformers: 3, centralists: 1, traditionalists: 0, corporatists: -2, militarists: 0, federalists: 0, independence: 0 },
        g: { elders: 8, veterans: 5, workers: 4, elites: -5 }, p: { healthcare: 8 }, treasury: -4 },
    infra_bond: { arena: "local", title: "Infrastructure Bond", desc: "Borrowing to build transit, power and spaceports.",
        stance: { corporatists: 2, centralists: 2, federalists: 1, reformers: 1, traditionalists: -1, militarists: 0, independence: 0 },
        g: { rural: 6, business: 5, farmers: 4, elders: -2 }, p: { infrastructure: 7, employment: 2 }, treasury: -4 },
    industry_tax_cut: { arena: "local", title: "Industry Tax Relief Act", desc: "Cuts corporate taxes to attract investment.",
        stance: { corporatists: 3, federalists: 1, militarists: 0, centralists: 0, traditionalists: 0, reformers: -3, independence: 0 },
        g: { business: 8, elites: 8, workers: -3, students: -3 }, p: { employment: 3, inequality: 4, education: -2 }, treasury: -2 },
    school_reform: { arena: "local", title: "Schools Modernization Act", desc: "Rebuilds schools and raises teacher pay.",
        stance: { reformers: 3, centralists: 1, traditionalists: -1, corporatists: 0, militarists: 0, federalists: 1, independence: 0 },
        g: { students: 8, youth: 4, elders: -2 }, p: { education: 6 }, treasury: -3 },
    land_rights: { arena: "local", title: "Traditional Land Rights Act", desc: "Returns ancestral lands to traditional communities.",
        stance: { traditionalists: 3, independence: 2, reformers: 1, federalists: 1, corporatists: -3, centralists: -1, militarists: 0 },
        g: { traditional: 10, rural: 3, business: -6 }, p: { environment: 3, employment: -1 }, i: { traditional: 6 } },
    anti_corruption: { arena: "local", title: "Anti-Corruption Commission Act", desc: "An independent commission with power to investigate officials — including you.",
        stance: { reformers: 3, centralists: 1, federalists: 1, corporatists: -2, traditionalists: 0, militarists: 0, independence: 0 },
        g: { youth: 4, workers: 3, elites: -4 }, p: { crime: -2 }, i: { agencies: 10 }, trustOnPass: 5, heatOnPass: 6 }
};

const LEAN_WORDS = { 3: "champions", 2: "supports", 1: "leans for", 0: "undecided", "-1": "leans against", "-2": "opposes", "-3": "fiercely opposes" };


// ── Seats ──────────────────────────────────────────────────────────

function arenaName(a = arena()) {
    if (a === "senate") return G.allegiance === "separatist" ? "Separatist Parliament" : ["empire", "rebellion"].includes(G.era) ? "Imperial Senate" : G.era === "newrepublic" ? "New Republic Senate" : "Galactic Senate";
    const w = world();
    return w.const ? (G.const.legislature || "Planetary Legislature") : "Planetary Legislature";
}

function arenaSize(a) { return a === "senate" ? SENATE_SIZE : 100; }

function arenaNpcs(a) { return livingNpcs().filter(n => n.arena === a); }

function playerVotes(a) {
    if (a === "senate" && G.office.kind === "senator") return 4;
    return 0;
}

function blocs(a) {
    const total = arenaSize(a) - arenaNpcs(a).reduce((s, n) => s + n.votes, 0) - playerVotes(a);
    const weights = {};
    Object.keys(FACTIONS).forEach(k => {
        weights[k] = a === "senate" ? FACTIONS[k].seats : ((world().lean || {})[k] ?? 0.4);
    });
    const wsum = Object.values(weights).reduce((x, y) => x + y, 0);
    const out = Object.keys(FACTIONS).map(k => ({ faction: k, seats: Math.floor(weights[k] / wsum * total) }));
    let diff = total - out.reduce((s, b) => s + b.seats, 0);
    out.sort((x, y) => y.seats - x.seats);
    for (let i = 0; diff > 0; i = (i + 1) % out.length, diff--) out[i].seats++;
    return out;
}

// Share of a bloc voting for / against at a given lean (−3…+3) and momentum.
function split(lean, momentum) {
    const m = momentum / 100;
    let f = clamp(0.25 + lean * 0.22 + m * 0.5, 0.02, 0.95);
    let a = clamp(0.25 - lean * 0.22 - m * 0.5, 0.02, 0.95);
    if (f + a > 0.97) { const k = 0.97 / (f + a); f *= k; a *= k; }
    return [f, a];
}

function tally(b) {
    const t = { for: 0, against: 0, und: 0 };
    blocs(b.arena).forEach(bl => {
        const [pf, pa] = split(b.stance[bl.faction] || 0, b.momentum);
        const f = Math.round(bl.seats * pf), a = Math.round(bl.seats * pa);
        t.for += f; t.against += a; t.und += bl.seats - f - a;
    });
    arenaNpcs(b.arena).forEach(n => {
        const pos = b.npcPos[n.id] || "undecided";
        if (pos === "for") t.for += n.votes; else if (pos === "against") t.against += n.votes; else t.und += n.votes;
    });
    const pv = playerVotes(b.arena);
    if (pv) {
        if (b.playerVote === "for") t.for += pv;
        else if (b.playerVote === "against") t.against += pv;
        else t.und += pv;
    }
    return t;
}

function npcInitialPosition(n, b) {
    const lean = b.stance[n.faction] || 0;
    const p = lean * 25 + rnd(-35, 35);
    return p > 22 ? "for" : p < -22 ? "against" : "undecided";
}


// ── Bill lifecycle ─────────────────────────────────────────────────

function spawnBill(a, key = null, sponsor = null) {
    if (a === "none") return null;
    if (!key) {
        const options = Object.keys(BILLS).filter(k => BILLS[k].arena === a && !G.bills.some(b => b.key === k) && (G.usedBills[k] || -99) < monthsNow() - 18);
        if (!options.length) return null;
        key = pick(options);
    }
    return createBill(key, sponsor);
}

function createBill(key, sponsor = null, custom = null) {
    const t = custom || BILLS[key];
    const b = {
        id: `b${G.billCounter}`, num: G.billCounter++, key, arena: t.arena,
        title: t.title, desc: t.desc,
        stance: { ...t.stance }, fx: JSON.parse(JSON.stringify(t)),
        voteIn: sponsor === "player" ? 3 : ri(2, 4),
        momentum: 0, playerVote: sponsor === "player" ? "for" : null,
        amended: false, committee: 0, leaked: false, sponsor: sponsor || "floor", npcPos: {}, spoke: 0
    };
    const ch = chancellor();
    if (b.arena === "senate" && ch) b.momentum += (b.stance[ch.faction] || 0) * 2;
    if (sponsor === "player") b.momentum += 4;
    if (b.arena === "senate" && G.era === "empire") b.momentum += ((b.stance.militarists || 0) + (b.stance.centralists || 0)) * 3;
    if (sponsor === "player" && G.committees && G.committees.includes(committeeFor(b))) b.momentum += 4;
    arenaNpcs(b.arena).forEach(n => { b.npcPos[n.id] = npcInitialPosition(n, b); });
    gateBill(b);
    G.bills.push(b);
    G.usedBills[key] = monthsNow();
    return b;
}

function activeBills(a = arena()) {
    return G.bills.filter(b => b.arena === a);
}

function billGroupEffects(b) {
    const m = b.amended ? 0.6 : 1;
    const out = {};
    Object.entries(b.fx.g || {}).forEach(([k, v]) => { out[k] = v * m; });
    return out;
}


// ── Tactics ────────────────────────────────────────────────────────

function spendAP(n = 3) {
    if (G.ap < n) { toast("Not enough political capital", `That needs ${n} capital; you have ${Math.floor(G.ap)}. Capital builds up each month.`); return false; }
    G.ap -= n;
    return true;
}

function dir(b) { return b.playerVote === "for" ? 1 : b.playerVote === "against" ? -1 : 0; }

function setVote(b, v) {
    b.playerVote = v;
    render();
}

function persuade(b, n) {
    if (!dir(b)) return toast("Take a position first", "Delegations want to know where you stand before they'll listen.");
    if (!spendAP()) return;
    const align = (b.stance[n.faction] || 0) * dir(b) * 10;
    const p = clamp(35 + n.rel * 0.4 + align + G.influence * 0.2, 5, 92);
    const want = dir(b) > 0 ? "for" : "against";
    if (chance(p)) {
        b.npcPos[n.id] = want;
        changeRel(n, 2);
        report("Delegation persuaded", `${n.name} (${worldName(n.world)}) will vote ${want.toUpperCase()} on ${b.title}.`);
    } else {
        changeRel(n, -3, `Pressed them hard on ${b.title}; they resented it.`);
        report("Persuasion failed", `${n.name} is unmoved on ${b.title}. They found your approach presumptuous.`);
    }
    render();
}

function promiseFavor(b, n) {
    if (!dir(b)) return toast("Take a position first", "You need a position before you can bargain.");
    if (!spendAP()) return;
    const align = (b.stance[n.faction] || 0) * dir(b);
    const want = dir(b) > 0 ? "for" : "against";
    if (align <= -2 && !chance(55)) {
        report("Offer refused", `${n.name} will not trade a vote this important to ${FACTIONS[n.faction].name} for a vague favour.`);
        render();
        return;
    }
    b.npcPos[n.id] = want;
    G.promises.push({ npcId: n.id, type: "favor", made: monthsNow(), bill: b.title });
    remember(n, `You promised them a favour in return for their vote on ${b.title}.`);
    report("A favour owed", `${n.name} switches to ${want.toUpperCase()}. You now owe them — and they will collect.`);
    render();
}

function tradeVotes(b, n) {
    if (!dir(b)) return toast("Take a position first", "You need a position before you can trade.");
    if (!spendAP()) return;
    const theirs = Object.keys(BILLS).filter(k => BILLS[k].arena === b.arena && (BILLS[k].stance[n.faction] || 0) >= 2 && !G.bills.some(x => x.key === k));
    if (!theirs.length) return promiseFavor(b, n);
    const key = pick(theirs);
    const want = dir(b) > 0 ? "for" : "against";
    b.npcPos[n.id] = want;
    G.promises.push({ npcId: n.id, type: "trade", billKey: key, made: monthsNow(), bill: b.title, due: monthsNow() + ri(3, 7) });
    remember(n, `Traded their vote on ${b.title} for your support on the ${BILLS[key].title}.`);
    report("Votes traded", `${n.name} backs you on ${b.title}. In return you'll vote FOR the ${BILLS[key].title} when it comes to the floor.`);
    render();
}

function giveSpeech(b) {
    if (!dir(b)) return toast("Take a position first", "A speech needs a side.");
    if (!spendAP(4)) return;
    const power = 4 + G.influence / 12 + G.rep / 25 + rnd(0, 4) - b.spoke * 2;
    b.momentum = clamp(b.momentum + dir(b) * power, -60, 60);
    b.spoke++;
    const g = {};
    Object.entries(billGroupEffects(b)).forEach(([k, v]) => { g[k] = Math.sign(v) * dir(b) * 1.5; });
    const ch = applyEffects({ g, influence: 1 });
    report("Speech on the floor", `You speak ${dir(b) > 0 ? "for" : "against"} ${b.title}. Undecided delegations shift ${power > 8 ? "noticeably" : "slightly"}.`, ch);
    render();
}

function amendBill(b) {
    if (b.amended) return;
    if (!spendAP(5)) return;
    b.amended = true;
    Object.keys(b.stance).forEach(k => {
        if (b.stance[k] < 0) b.stance[k] += 1;
        else if (b.stance[k] > 1) b.stance[k] -= 0.5;
    });
    arenaNpcs(b.arena).forEach(n => { if (b.npcPos[n.id] === "against" && chance(35)) b.npcPos[n.id] = "undecided"; });
    const ch = applyEffects({ influence: -3 });
    report("Amendment adopted", `Your amendment softens ${b.title}. Opponents are less hostile — and its effects will be smaller.`, ch);
    render();
}

function leakBill(b) {
    if (!dir(b)) return toast("Take a position first", "A leak needs a purpose.");
    if (!spendAP()) return;
    b.momentum = clamp(b.momentum + dir(b) * 10, -60, 60);
    b.leaked = true;
    let ch;
    if (chance(35)) {
        ch = applyEffects({ trust: -5, rep: -4, secret: `Leaked confidential committee papers on ${b.title}` });
        arenaNpcs(b.arena).filter(n => b.npcPos[n.id] && b.npcPos[n.id] !== (dir(b) > 0 ? "for" : "against")).forEach(n => changeRel(n, -10, `Suspects you of leaking committee papers on ${b.title}.`));
        report("Leak traced", `The papers shift the debate — but journalists are asking who leaked them, and several delegations suspect you.`, ch);
    } else {
        ch = applyEffects({ heat: 3 });
        report("Leak lands", `Committee papers on ${b.title} appear in the press. The debate tilts your way.`, ch);
    }
    publish(b.title, { reformers: dir(b) * 2, [G.ideology]: 3 }, true);
    render();
}

function sendToCommittee(b) {
    if (b.committee >= 2) return;
    if (!spendAP(4)) return;
    b.committee++;
    b.voteIn += 3;
    b.momentum = Math.round(b.momentum * 0.5);
    const g = {};
    Object.entries(b.fx.g || {}).forEach(([k, v]) => { if (Math.abs(v) >= 5) g[k] = -2; });
    const ch = applyEffects({ g, trust: -2 });
    report("Sent to committee", `${b.title} is delayed three months. Opponents accuse you of avoiding the issue.`, ch);
    render();
}

function introduceBill(key) {
    if (G.influence < 6) return toast("Not enough influence", "Introducing legislation takes at least 6 influence.");
    if (!spendAP(6)) return;
    applyEffects({ influence: -6 });
    const b = createBill(key, "player");
    G.record.billsIntroduced++;
    report("Bill introduced", `You introduce the ${b.title} (Bill ${b.num}). The vote is in three months.`);
    render();
}


// ── The vote ───────────────────────────────────────────────────────

function resolveBill(b) {
    const t = { for: 0, against: 0, abstain: 0 };
    const forShare = clamp(0.5 + b.momentum / 80 + rnd(-0.12, 0.12), 0.08, 0.92);
    blocs(b.arena).forEach(bl => {
        const [pf, pa] = split(b.stance[bl.faction] || 0, b.momentum);
        const f = Math.round(bl.seats * pf), a = Math.round(bl.seats * pa);
        const u = bl.seats - f - a;
        const uf = Math.round(u * clamp(forShare + rnd(-0.1, 0.1), 0, 1) * 0.9);
        const ua = Math.round((u - uf) * 0.9);
        t.for += f + uf; t.against += a + ua; t.abstain += u - uf - ua;
    });
    arenaNpcs(b.arena).forEach(n => {
        let pos = b.npcPos[n.id] || "undecided";
        if (pos === "undecided") {
            let p = 50 + b.momentum * 0.6 + (b.stance[n.faction] || 0) * 10 + dir(b) * n.rel * 0.3;
            pos = chance(clamp(p, 5, 95)) ? "for" : "against";
            b.npcPos[n.id] = pos;
        }
        t[pos] += n.votes;
    });
    const pv = playerVotes(b.arena);
    if (pv) {
        if (b.playerVote === "for") t.for += pv;
        else if (b.playerVote === "against") t.against += pv;
        else t.abstain += pv;
    }
    const passed = t.for > t.against;
    G.bills = G.bills.filter(x => x !== b);

    // How your constituencies and factions judge your vote.
    const changes = [];
    const vote = b.playerVote || "abstain";
    const voteMult = vote === "for" ? 0.8 : vote === "against" ? -0.5 : -0.15;
    const judged = { g: {}, f: {} };
    const involved = b.arena === arena() || (b.arena === "senate" && G.office.kind === "senator");
    if (involved) {
        Object.entries(billGroupEffects(b)).forEach(([k, v]) => { judged.g[k] = v * voteMult; });
        Object.entries(b.stance).forEach(([k, s]) => { judged.f[k] = s * (vote === "for" ? 3 : vote === "against" ? -3 : -0.5); });
        changes.push(...applyEffects(judged));
        arenaNpcs(b.arena).forEach(n => {
            const s = b.stance[n.faction] || 0;
            if (vote === "abstain" || Math.abs(s) < 2) return;
            const agreed = (s > 0) === (vote === "for");
            changeRel(n, agreed ? 3 : -4);
        });
    }

    // What the law actually does to the world.
    if (passed) changes.push(...enactBill(b));

    if (b.sponsor === "player" && passed) G.record.billsPassed++;
    if (b.keyVote && involved) recordVote(b.title, vote);
    arenaNpcs(b.arena).filter(n => n.canon && Math.abs(b.stance[n.faction] || 0) >= 2).forEach(n => remember(n, `You voted ${vote.toUpperCase()} on the ${b.title}.`));
    if (b.petition) resolvePetition(b, passed);
    if (b.sponsor === "player") {
        changes.push(...applyEffects(passed ? { influence: 7, rep: 2 } : { influence: -4 }));
        log(`${passed ? "✅ Your bill passed" : "❌ Your bill failed"}: ${b.title} (${t.for}–${t.against}).`, "legislation");
    }

    const betrayals = checkPromisesOnVote(b, vote);
    checkObligationsOnVote(b, vote);

    if (involved) publish(b.title, Object.fromEntries(Object.entries(b.stance).map(([k, s]) => [k, s * (vote === "for" ? 2 : vote === "against" ? -2 : -0.5)])));
    log(`Bill ${b.num}, ${b.title}: ${passed ? "PASSED" : "FAILED"} ${t.for}–${t.against} (${t.abstain} abstaining). You voted ${vote.toUpperCase()}.`, "legislation");

    return { bill: b, t, passed, vote, changes, betrayals };
}

function enactBill(b) {
    const m = b.amended ? 0.6 : 1;
    const f = b.fx;
    const e = { p: {}, gal: {}, i: f.i || {} };
    Object.entries(f.p || {}).forEach(([k, v]) => { e.p[k] = v * m; });
    Object.entries(f.gal || {}).forEach(([k, v]) => { e.gal[k] = v * m; });
    if (f.armsJobs && world().traits.includes("arms")) e.p.employment = (e.p.employment || 0) + f.armsJobs;
    if (f.treasury && b.arena === "local") e.treasury = f.treasury;
    if (f.indep) e.indep = f.indep * m;
    if (f.trustOnPass) e.trust = f.trustOnPass;
    if (f.heatOnPass && G.secrets.length) e.heat = f.heatOnPass;
    if (f.program) e.program = f.program;
    if (f.frontierAid) {
        e.world = Object.keys(G.galaxy).filter(k => ((WORLDS[k] || BACKGROUND_WORLDS[k]).traits || []).includes("frontier")).map(k => ({ key: k, stability: f.frontierAid, prosperity: 4 }));
        if (world().traits.includes("frontier")) { e.p.infrastructure = 4; e.p.healthcare = 2; }
    }
    if (f.worldAid) e.world = { key: f.worldAid, stability: 15, prosperity: 6 };
    if (b.policyKey) G.policies[b.policyKey].level = b.policyLevel;
    if (b.key === "ethics_reform") G.ethicsLaw = true;
    return applyEffects(e);
}

function checkPromisesOnVote(b, vote) {
    const out = [];
    G.promises.filter(p => p.type === "trade" && p.billKey === b.key).forEach(p => {
        const n = npc(p.npcId);
        if (!n) return;
        if (vote === "for") {
            changeRel(n, 15, `You kept your word and voted for the ${b.title}.`);
        } else {
            changeRel(n, -45, `You betrayed them on the ${b.title} after they backed you on ${p.bill}.`);
            applyEffects({ rep: -6 });
            out.push(n.name);
            log(`🗡️ You broke your promise to ${n.name}. They will not forget it.`, "betrayal");
        }
        p.done = true;
    });
    G.promises = G.promises.filter(p => !p.done);
    return out;
}

function checkObligationsOnVote(b, vote) {
    G.obligations.filter(o => o.billKey === b.key && !o.done).forEach(o => {
        o.done = true;
        const d = G.donors[o.donor];
        if (vote === "for") {
            if (d) d.rel += 15;
            log(`${o.donor} got the vote they paid for on the ${b.title}.`, "money");
        } else {
            if (d) d.rel -= 40;
            applyEffects({ opp: 4, rep: 2 });
            log(`${o.donor} did not get the vote they expected. Their money will go to your opponent.`, "money");
        }
    });
}
