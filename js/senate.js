// ── THE SENATE'S POWER — committees, budgets, ministries, and the Chancellor's grabs ──
//
// The Senate starts with real power: committee chairs can hold bills, committees
// write their agencies' budgets, and the Finance chair negotiates the budget with
// the Chancellor. Every power grab the Senate allows strips a little of it away.

function senatePower() { if (G.senatePower == null) G.senatePower = 100; return G.senatePower; }
function spLabel(v = senatePower()) { return v >= 75 ? "Independent" : v >= 55 ? "Contested" : v >= 35 ? "Weakened" : v >= 15 ? "Rubber stamp" : "Powerless"; }
function cutSenatePower(n, why) {
    G.senatePower = clamp(senatePower() - n);
    G.grabs = G.grabs || [];
    if (why) G.grabs.unshift({ text: why, d: -n, year: eraYear(currentBBY()) });
}
function restoreSenatePower(n, why) {
    G.senatePower = clamp(senatePower() + n);
    G.grabs = G.grabs || [];
    if (why) G.grabs.unshift({ text: why, d: n, year: eraYear(currentBBY()) });
}
function isSenator() { return G.office.kind === "senator"; }


// ── Committee routing ─────────────────────────────────────────────

const CAT_COMMITTEE = { health: "finance", housing: "finance", education: "finance", transit: "finance", water: "finance", food: "finance", finance: "finance",
    jobs: "commerce", industry: "commerce", trade: "commerce", labor: "commerce", environment: "commerce",
    security: "defense", veterans: "defense", refugees: "foreign", sovereignty: "foreign" };
const MAJOR_COMMITTEE = { separatist_sanctions: "foreign", loyalty_act: "judiciary", clone_funding: "defense", emergency_defense: "defense", wartime_transport: "commerce",
    refugee_assistance: "foreign", intelligence_expansion: "intelligence", imperial_security: "judiciary", senate_advisory: "judiciary", demilitarization: "defense", amnesty: "judiciary" };


// ── Chair powers ──────────────────────────────────────────────────

function chairCanHold() { return senatePower() >= 35; }

function holdBill(b) {
    if (!chairCanHold()) return toast("The Chancellor's office overrides you", "The Senate has lost the power to hold bills in committee.");
    if (!spendAP(3)) return;
    b.held = true; b.heldAt = monthsNow();
    livingNpcs().filter(n => n.arena === "senate" && (b.stance[n.faction] || 0) >= 2).forEach(n => changeRel(n, -3, `You held ${b.title} in committee.`));
    report("Held in committee", `As chair, you hold the ${b.title}. It will not reach the floor until you release it.`);
    render();
}

function releaseBill(b, price) {
    if (price && !spendAP(2)) return;
    b.held = false; b.voteIn = Math.max(b.voteIn, 2);
    if (price) {
        const sponsor = npc(b.sponsor);
        b.stance[G.ideology] = clamp((b.stance[G.ideology] || 0) + 1, -3, 3);
        b.amended = true;
        if (sponsor) { changeRel(sponsor, 6, `Released their bill — at a price.`); remember(sponsor, `Owes you for releasing ${b.title} from committee.`); }
        report("Released — at a price", `You release the ${b.title} after its backers accept your changes and owe you a favour.`, applyEffects({ influence: 5 }));
    } else report("Released", `The ${b.title} goes to the floor.`);
    render();
}

// Held bills: supporters grow angry, and a weakened Senate can be overridden.
function holdTick(b) {
    if (!b.held) return false;
    if (G.chairOf !== committeeFor(b) || !isSenator()) { b.held = false; return false; }
    const sp = senatePower();
    const chancellorBill = b.fx.major || (chancellor() && b.sponsor === chancellor().id);
    const discharge = (sp < 60 ? (60 - sp) / 2 : 0) + (chancellorBill ? 8 : 0) + (monthsNow() - b.heldAt) * 0.5;
    if (chance(discharge)) {
        b.held = false;
        report("Discharged from your committee", `${chancellorBill ? "The Chancellor's allies" : "A majority of the Senate"} force the ${b.title} out of your committee and onto the floor.`, applyEffects({ influence: -3 }));
        return false;
    }
    if (chance(15)) livingNpcs().filter(n => n.arena === "senate" && (b.stance[n.faction] || 0) >= 2).slice(0, 4).forEach(n => changeRel(n, -1));
    return true;
}

const OVERSIGHT = {
    finance:      { label: "Audit the Chancellery's discretionary accounts", probe: 12, wrath: 8, e: { rep: 3 } },
    defense:      { label: "Audit the clone army contracts", probe: 15, wrath: 10, e: { rep: 3, f: { militarists: -3 } } },
    intelligence: { label: "Demand the Chancellery's classified briefings", probe: 10, wrath: 6, e: { influence: 3 } },
    foreign:      { label: "Investigate the secret Separatist negotiations", probe: 8, wrath: 6, e: { gal: { diplomacy: 3 } } },
    judiciary:    { label: "Subpoena the Chancellor's office", probe: 15, wrath: 12, e: { rep: 4, trust: 2 } },
    commerce:     { label: "Investigate the Trade Federation's backers", probe: 10, wrath: 6, e: { f: { corporatists: -3 } } }
};

function chairOversight() {
    const k = G.chairOf;
    const o = OVERSIGHT[k];
    if (!o) return;
    if (senatePower() < 25) return toast("Ignored", "The Chancellor's office no longer answers Senate subpoenas.");
    if (!spendAP(4)) return;
    const pal = palAlive() && chancellor() && chancellor().canon === "palpatine";
    const ch = applyEffects(o.e);
    restoreSenatePower(1);
    if (pal && !isEmpireEra()) {
        addWrath(o.wrath, "Your committee is looking into the Chancellery.");
        if (G.probe && G.probe.progress < 100) advanceProbe(o.probe);
        report(`🔍 ${o.label}`, "Your committee staff pull records the Chancellery would rather keep buried.", ch);
    } else report(`🔍 ${o.label}`, "Your committee's hearings make headlines.", ch);
    render();
}


// ── Budgets ───────────────────────────────────────────────────────

function agencyName(k) {
    const emp = isEmpireEra(), war = G.era === "war";
    return {
        finance: emp ? "Imperial grants to member worlds" : "Grants to member worlds",
        defense: emp ? "The Imperial Army and Navy" : war ? "The Grand Army of the Republic and the Republic Navy" : "The Judicial Forces and the Republic fleet",
        intelligence: emp ? "The Imperial Security Bureau" : "The Republic intelligence services",
        foreign: emp ? "The Imperial diplomatic service" : "The Diplomatic Corps",
        judiciary: emp ? "The Imperial courts (what is left of them)" : "The Republic courts and the Judicial Department",
        commerce: emp ? "The Imperial trade authority" : "The Bureau of Trade and Commerce"
    }[k];
}

function initBudget() {
    if (!G.budget) G.budget = { lines: null, request: null, debt: 120, taxRaise: 0, lobby: {}, reqMult: 1, last: null };
    return G.budget;
}

function chancellorRequest() {
    const b = initBudget();
    const r = { finance: 120, defense: 220, intelligence: 45, foreign: 85, judiciary: 60, commerce: 70 };
    if (G.era === "crisis") { r.defense = 300; r.intelligence = 60; }
    if (G.era === "war") { r.defense = 520; r.intelligence = 95; r.finance = 100; r.foreign = 70; }
    if (isEmpireEra()) { r.defense = 720; r.intelligence = 150; r.foreign = 40; r.judiciary = 30; r.finance = 80; r.commerce = 60; }
    Object.keys(r).forEach(k => { r[k] = Math.round(r[k] * b.reqMult * (1 + (b.lobby[k] || 0))); });
    return r;
}

function galRevenue() {
    const b = initBudget();
    return Math.round(560 + G.gal.trade * 2 + (G.era === "war" ? 80 : 0) + (isEmpireEra() ? 340 : 0) + b.taxRaise);
}

function npcLine(k, req) {
    const chair = npc(G.committeeChairs[k]);
    if (senatePower() < 40 || !chair) return req;
    const f = chair.faction;
    let m = 1;
    if (f === "reformers" && ["defense", "intelligence"].includes(k)) m = 0.85;
    if (f === "reformers" && ["finance", "foreign"].includes(k)) m = 1.1;
    if (f === "militarists" && k === "defense") m = 1.15;
    if (f === "federalists") m = 0.95;
    if (f === "corporatists" && k === "commerce") m = 1.1;
    if (f === "corporatists" && k === "judiciary") m = 0.9;
    return Math.round(req * m);
}

function budgetSeason() {
    const b = initBudget();
    b.request = chancellorRequest();
    b.lines = {};
    b.lobby = {};
    Object.keys(COMMITTEES).forEach(k => {
        if (G.chairOf === k && isSenator()) pushScene("committee_budget", { k });
        else b.lines[k] = npcLine(k, b.request[k]);
    });
}

function setLine(k, ratio, note) {
    const b = initBudget();
    const req = b.request[k];
    let v = Math.round(req * ratio);
    const sp = senatePower();
    if (ratio < 1 && sp < 60 && chance((60 - sp) * 2)) {
        v = req;
        cutSenatePower(2);
        report("Overridden", `The Chancellor's office reprograms the money by executive order. ${agencyName(k)} gets the full ${req}B anyway.`);
    } else if (note) report(`Committee budget: ${agencyName(k)}`, note);
    b.lines[k] = v;
    const ch = chancellor();
    if (ch) changeRel(ch, Math.round((v / req - 1) * 30), v < req ? `Your committee cut ${agencyName(k)}.` : null);
    const d = v / req - 1;
    const e = { defense: { gal: { military: d * 15 }, f: { militarists: d * 12, reformers: -d * 6 } }, intelligence: { f: { militarists: d * 5, reformers: -d * 5 } },
        foreign: { gal: { diplomacy: d * 10 } }, commerce: { gal: { trade: d * 8 }, f: { corporatists: d * 6 } }, judiciary: { f: { reformers: d * 6 } }, finance: { f: { federalists: d * 6 } } }[k];
    applyEffects(e);
    if (k === "intelligence" && isEmpireEra() && d < 0) G.isb = Math.max(0, (G.isb || 0) - 5);
}

function budgetResolution() {
    const b = initBudget();
    if (!b.request) return;
    Object.keys(COMMITTEES).forEach(k => { if (b.lines[k] == null) b.lines[k] = npcLine(k, b.request[k]); });
    if (G.chairOf === "finance" && isSenator()) pushScene("budget_resolution", {});
    else closeBudget("as the committees wrote it");
}

function budgetTotals() {
    const b = initBudget();
    const spend = Object.values(b.lines || {}).reduce((s, v) => s + v, 0) + Math.round(b.debt * 0.03);
    const rev = galRevenue();
    return { spend, rev, deficit: spend - rev };
}

function closeBudget(how) {
    const b = initBudget();
    const t = budgetTotals();
    b.debt = Math.max(0, b.debt + t.deficit);
    b.grantsRatio = b.lines.finance / b.request.finance;
    b.last = { lines: { ...b.lines }, request: { ...b.request }, deficit: t.deficit, rev: t.rev, spend: t.spend, year: eraYear(currentBBY()), how };
    if (b.debt > 600) { applyEffects({ gal: { trade: -2 } }); log("💸 Debt service is crowding out the Republic's budget.", "money"); }
    if (isSenator() || G.office.kind === "minister") report("🏛️ The budget is passed", `${t.deficit > 0 ? `A deficit of ${t.deficit}B` : t.deficit < 0 ? `A surplus of ${-t.deficit}B` : "A balanced budget"} — passed ${how}. Galactic debt: ${Math.round(b.debt)}B.`);
}

function trimToRevenue(share = 1) {
    const b = initBudget();
    const t = budgetTotals();
    if (t.deficit <= 0) return;
    const cut = t.deficit * share;
    const tot = Object.values(b.lines).reduce((s, v) => s + v, 0);
    Object.keys(b.lines).forEach(k => { b.lines[k] = Math.round(b.lines[k] - cut * b.lines[k] / tot); });
    return cut;
}


// ── Power grabs, and blocking them ────────────────────────────────

function blockSupport(hard = 0) {
    const al = livingNpcs().filter(n => n.arena === "senate" && n.rel >= 35).length;
    const loyal = ["mothma", "bail", "amidala"].filter(k => { const n = canonNpc(k); return n && n.alive && n.rel >= 20; }).length;
    return Math.round(clamp(12 + al * 2 + loyal * 5 + G.influence * 0.3 + (senatePower() - 50) * 0.3 + (G.truth || 0) * 0.4 + (G.bloc || 0) * 0.8 + (G.chairOf ? 5 : 0) - hard, 3, 85));
}

function blockChoice(key, drop, hard = 0, onBlock = null, fallback = null) {
    const s = blockSupport(hard);
    const can = isSenator() && G.ap >= 6 && G.influence >= 10;
    return { label: "Organise the opposition to block it", hint: `6 capital, 10 influence. Whip count: about ${s}% chance.`, disabled: !can, go: () => {
        G.ap -= 6; applyEffects({ influence: -10 });
        const pal = palNpc();
        if (chance(s)) {
            G.blocked = G.blocked || {}; G.blocked[key] = true;
            restoreSenatePower(drop + 3, `The Senate blocked: ${GRAB_NAMES[key] || key}`);
            addWrath(18, "You defeated the Chancellor on the Senate floor.");
            if (pal) changeRel(pal, -15, `Organised the Senate against ${GRAB_NAMES[key] || key}.`);
            ["mothma", "bail", "amidala"].forEach(k => { const n = canonNpc(k); if (n) changeRel(n, 10, "Led the Senate against a power grab."); });
            recordVote(GRAB_NAMES[key] || key, "blocked");
            G.record.agreements.push(`Led the Senate to block ${GRAB_NAMES[key] || key} (${eraYear(currentBBY())})`);
            report("🛑 Blocked", `You whip enough votes. ${GRAB_NAMES[key] || "The measure"} fails on the Senate floor. The Chancellor congratulates the Senate on its “vigorous debate”. His eyes do not smile.`, applyEffects({ rep: 6, influence: 6, f: { reformers: 5, federalists: 5, centralists: -5 } }));
            if (onBlock) onBlock();
        } else {
            addWrath(10);
            report("The votes aren't there", `Your coalition falls short. ${GRAB_NAMES[key] || "The measure"} passes.`);
            if (fallback) fallback();
        }
    } };
}

const GRAB_NAMES = { term_extension: "the extension of the Chancellor's term", emergency_powers: "the Emergency Powers Act", emergency_retry: "the second Emergency Powers bill",
    sector_governance: "the Sector Governance Decree", security_council: "the Security Council Act", holonet: "the HoloNet Regulation Decree", jedi_control: "the Jedi Oversight Amendment",
    imperial_budget: "the Imperial Budget Decree" };

const GRABS = {
    security_council: { tag: "21 BBY", title: "The Security Council Act", drop: 10, hard: 5,
        body: "The Chancellor proposes a Security Council: a handful of loyal senators, chosen by him, with authority over the war effort and every world's security forces." },
    holonet: { tag: "20 BBY", title: "The HoloNet Regulation Decree", drop: 5, hard: 5,
        body: "For the duration of the war, the Chancellery will approve all HoloNet news about the war. “Loose talk costs lives.”", onPass: () => { G.liberties = clamp((G.liberties || 0) + 5); } },
    jedi_control: { tag: "19 BBY", title: "The Jedi Oversight Amendment", drop: 5, hard: 10,
        body: "An amendment placing the Jedi Council under the direct authority of the Chancellor's office. The Jedi are not consulted." },
    emergency_retry: { tag: "22 BBY", title: "Emergency Powers, again", drop: 20, hard: 15,
        body: "After a new wave of Separatist attacks, the Chancellor's allies bring emergency powers back to the floor. This time the galleries are full of veterans.", onPass: () => { G.galConst.emergency = true; } },
    imperial_budget: { tag: "17 BBY", title: "The Imperial Budget Decree", drop: 20, hard: 35,
        body: "The Emperor will set the Imperial budget. Senate committees may review it — but not change it." }
};

function grabAllowed() { return palAlive() && (palIsChancellor() || isEmpireEra()) && G.era !== "rebellion"; }


// ── The Loyalist bloc and resistance from inside the Senate ───────

function whipBloc() {
    if (!spendAP(3)) return;
    G.bloc = Math.min(40, (G.bloc || 0) + 6);
    livingNpcs().filter(n => n.arena === "senate" && ["reformers", "federalists"].includes(n.faction)).forEach(n => changeRel(n, 2));
    addWrath(2);
    report("🤝 The opposition bloc", "Late nights in Mon Mothma's office, counting votes. When the next power grab comes, you'll be ready.");
    render();
}

function resistAction(t) {
    const costs = { leak: 4, pass: 3, shield: 4, speakworld: 3, mothma: 3, decree: 6, hidebudget: 5 };
    if (t === "decree" && G.influence < 8) return toast("Not enough influence", "You need 8 influence to organise a bloc.");
    if (!spendAP(costs[t])) return;
    const intel = G.committees.includes("intelligence") || G.committees.includes("defense");
    let ch = [];
    switch (t) {
        case "leak": G.rebellion = clamp(G.rebellion + (intel ? 7 : 4)); G.isb = (G.isb || 0) + 10; G.secretRebel = true; report("📡 Secrets passed", intel ? "Fleet deployment schedules from your committee's briefings reach a rebel cell." : "Imperial procurement schedules reach the rebels through a courier."); break;
        case "pass": G.rebellion = clamp(G.rebellion + 2); G.isb = (G.isb || 0) + 6; G.secretRebel = true; report("🛂 A senatorial transit pass", "A rebel courier crosses three Imperial checkpoints on your diplomatic seal."); break;
        case "shield": {
            const k = pick(Object.keys(G.galaxy).filter(x => G.galaxy[x].stability < 50 && !G.galaxy[x].destroyed)) || pick(Object.keys(G.galaxy));
            ch = applyEffects({ world: { key: k, stability: 8 }, rep: 2 });
            G.isb = (G.isb || 0) + 5;
            report(`🛡️ Shielding ${worldName(k)}`, `You file motion after motion to delay Imperial reprisals on ${worldName(k)}. It buys them months.`, ch);
            break;
        }
        case "speakworld": {
            const w = pick(["Ghorman", "Lothal", "Ferrix", "Kashyyyk", "Ryloth", "Mon Cala"]);
            ch = applyEffects({ rep: 3, trust: 2, f: { reformers: 3 } });
            G.isb = (G.isb || 0) + 6; G.rebellion = clamp(G.rebellion + 1); addWrath(6);
            report(`📣 For ${w}`, `You read the names of the dead of ${w} into the Senate record. The Imperial Senate pretends not to hear.`, ch);
            break;
        }
        case "mothma": {
            const m = canonNpc("mothma"); if (m) changeRel(m, 8, "Joined her quiet network in the Senate.");
            G.secretRebel = true; G.truth = (G.truth || 0) + 2; G.rebellion = clamp(G.rebellion + 2); G.isb = (G.isb || 0) + 4;
            report("🕯️ Mon Mothma's network", "A private dinner. A careful conversation. By dessert you are part of something that doesn't have a name yet.");
            break;
        }
        case "decree": {
            applyEffects({ influence: -8 });
            if (chance(blockSupport(30))) {
                restoreSenatePower(5, "The Imperial Senate forced the Emperor to withdraw a decree");
                G.rebellion = clamp(G.rebellion + 3); G.isb = (G.isb || 0) + 15; addWrath(12);
                report("🛑 The Senate says no", "For the first time since the Empire, a bloc of senators forces the withdrawal of an Imperial decree. It will not be forgotten — by anyone.", applyEffects({ rep: 6 }));
            } else { G.isb = (G.isb || 0) + 10; report("Not enough votes", "Your bloc falls short. The names of everyone who voted with you are now on a list."); }
            break;
        }
        case "hidebudget": {
            if (!G.chairOf) return;
            G.rebellion = clamp(G.rebellion + 6); G.isb = (G.isb || 0) + 12; G.secretRebel = true;
            G.record.agreements.push(`Hid rebel funding in the Imperial budget (${eraYear(currentBBY())})`);
            report("💰 A line item nobody reads", `Deep in the ${COMMITTEES[G.chairOf].name}'s appropriations, a “maintenance fund” quietly pays for rebel starships.`);
            break;
        }
    }
    if (chance((G.isb || 0) / 8) && !G.inbox.some(d => d.id === "isb")) addDossier("isb", {});
    render();
}


// ── Ministries ────────────────────────────────────────────────────

const MINISTRY_COMMITTEE = { finance: "finance", defense: "defense", interior: "judiciary", welfare: "finance", planetary: "foreign" };

const MINISTRY_ACTIONS = {
    finance: [["austere", "Draft an austere budget request", 3, "Next year's request −15%. The Chancellor may not like it."], ["expansive", "Draft an expansive budget request", 3, "Next year's request +15%."], ["bonds", "Issue Republic bonds", 3, "Revenue now, debt later."], ["taxfed", "Pursue Trade Federation tax evasion", 4, "Revenue up. Corporatists furious."]],
    defense: [["ships", "Commission new warships", 4, "Military up, debt up."], ["audit", "Audit the clone army contracts", 4, "What was paid for, and by whom?"], ["protect", "Deploy forces to protect a threatened world", 4, ""], ["veterans", "Care for wounded veterans", 3, ""]],
    interior: [["guard", "Assign the Senate Guard to your own protection", 3, "Protection up."], ["liberties", "Rein in the security services", 4, "Civil liberties. The Chancellor objects."], ["crackdown", "Crack down on Separatist sympathisers", 4, "Order — at a cost."], ["stabilize", "Stabilise troubled worlds", 4, ""]],
    welfare: [["relief", "Galaxy-wide medical relief", 4, ""], ["camps", "Fund refugee camps", 4, ""], ["outer", "Vaccination campaign in the Outer Rim", 4, ""], ["pensions", "Protect war widows' pensions", 3, ""]],
    planetary: [["mediate", "Mediate a planetary dispute", 4, ""], ["autonomy", "Defend planetary autonomy", 4, "Federalists cheer. The Chancellor frowns."], ["aid", "Fast-track aid to struggling worlds", 4, ""], ["governors", "Slow-walk the regional governors plan", 4, "Buys the worlds time."]]
};

function ministryAction(t) {
    const mk = G.office.ministry;
    const b = initBudget();
    const ch0 = chancellor();
    const cost = t === "testify" ? 3 : t === "senate" ? 5 : t === "resign" ? 0 : ((MINISTRY_ACTIONS[mk] || []).find(a => a[0] === t) || [0, 0, 4])[2];
    if (cost && !spendAP(cost)) return;
    let ch = [];
    const weak = () => Object.keys(G.galaxy).filter(k => G.galaxy[k].stability < 45 && !G.galaxy[k].destroyed).slice(0, 3);
    switch (t) {
        case "austere": b.reqMult = 0.85; if (ch0) changeRel(ch0, -6, "Drafted an austere budget."); ch = applyEffects({ f: { federalists: 3, corporatists: 2, militarists: -3 } }); report("An austere request", "Next year's budget request is 15% leaner."); break;
        case "expansive": b.reqMult = 1.15; if (ch0) changeRel(ch0, 4); ch = applyEffects({ f: { reformers: 2, militarists: 2, federalists: -3 } }); report("An expansive request", "Next year's budget request is 15% larger."); break;
        case "bonds": b.taxRaise += 40; b.debt += 60; ch = applyEffects({ gal: { trade: 1 } }); report("Bonds issued", G.era === "war" ? "War bonds sell out on Coruscant and Kuat." : "Republic bonds sell steadily.", ch); break;
        case "taxfed": b.taxRaise += 30; ch = applyEffects({ f: { corporatists: -6, reformers: 3 }, g: { business: -3 } }); report("Tax evasion", "Trade Federation accounts are frozen pending audit. Revenue rises."); break;
        case "ships": ch = applyEffects({ gal: { military: 6 }, f: { militarists: 4 } }); b.debt += 50; report("Warships commissioned", "Kuat Drive Yards lays down new keels.", ch); break;
        case "audit": if (G.probe && palIsChancellor()) { advanceProbe(15); addWrath(10, "Your ministry is auditing the clone contracts."); } ch = applyEffects({ rep: 3 }); report("Contract audit", "The paper trail is strange — payments older than the war.", ch); break;
        case "protect": { const k = pick(weak()) || G.worldKey; ch = applyEffects({ world: { key: k, stability: 10 }, gal: { military: -1 } }); report(`Forces to ${worldName(k)}`, "A battle group arrives in orbit.", ch); break; }
        case "veterans": ch = applyEffects({ g: { veterans: 5, military: 3 }, f: { militarists: 2 } }); report("Veterans' care", "New medcenters for the wounded.", ch); break;
        case "guard": G.security = Math.min(100, (G.security || 0) + 30); report("The Senate Guard", "Blue-robed guards now stand outside your office."); break;
        case "liberties": ch = applyEffects({ f: { reformers: 5, centralists: -4, militarists: -2 }, rep: 3 }); G.liberties = clamp((G.liberties || 0) - 5); if (ch0) changeRel(ch0, -8, "Reined in the security services."); report("Liberties defended", "You order the security services to obtain warrants.", ch); break;
        case "crackdown": ch = applyEffects({ f: { militarists: 4, centralists: 3, reformers: -5 }, rep: -2 }); G.liberties = clamp((G.liberties || 0) + 5); if (ch0) changeRel(ch0, 6); report("Crackdown", "Arrests on Coruscant. The press is told they were spies.", ch); break;
        case "stabilize": ch = applyEffects({ world: weak().map(k => ({ key: k, stability: 7 })) }); report("Stabilisation", "Administrators and credits flow to troubled worlds.", ch); break;
        case "relief": ch = applyEffects({ gal: { refugees: -6 }, f: { reformers: 4 } }); report("Medical relief", "Hospital frigates reach the front-line worlds.", ch); break;
        case "camps": ch = applyEffects({ gal: { refugees: -8 }, f: { reformers: 3, traditionalists: -2 } }); report("Refugee camps", "Shelter for millions displaced by the war.", ch); break;
        case "outer": ch = applyEffects({ world: Object.keys(G.galaxy).filter(k => (WORLDS[k] || BACKGROUND_WORLDS[k]).region === "outer").slice(0, 5).map(k => ({ key: k, prosperity: 4, stability: 3 })) }); report("Outer Rim vaccination", "Clinics on worlds the Republic usually forgets.", ch); break;
        case "pensions": ch = applyEffects({ g: { elders: 5, veterans: 3 } }); report("Pensions protected", "You fight off the war-budget cuts.", ch); break;
        case "mediate": { const k = pick(weak()) || G.worldKey; ch = applyEffects({ world: { key: k, stability: 9 }, gal: { diplomacy: 2 } }); report(`Mediation on ${worldName(k)}`, "Talks, then a truce.", ch); break; }
        case "autonomy": ch = applyEffects({ f: { federalists: 6, centralists: -5 } }); if (ch0) changeRel(ch0, -6, "Defended planetary autonomy."); restoreSenatePower(1); report("Autonomy defended", "Member worlds keep their say over their own administration — for now.", ch); break;
        case "aid": ch = applyEffects({ world: weak().map(k => ({ key: k, prosperity: 6 })) }); report("Aid fast-tracked", "The paperwork that usually takes a year takes a week.", ch); break;
        case "governors": if (ch0) changeRel(ch0, -10, "Slow-walked his governors plan."); addWrath(6); ch = applyEffects({ f: { federalists: 5 } }); report("Slow-walked", "Your ministry discovers a great many legal questions about the regional governors."); break;
        case "testify": { const k = MINISTRY_COMMITTEE[mk]; b.lobby[k] = Math.min(0.3, (b.lobby[k] || 0) + 0.1); const chair = npc(G.committeeChairs[k]); if (chair) changeRel(chair, 3); report(`Testimony before the ${COMMITTEES[k].name}`, "Three hours of questions. Next year's budget for your ministry should be a little larger."); break; }
        case "resign": { const r = world().roles.find(x => x.kind === "senator"); if (ch0) changeRel(ch0, -20, "Resigned from the cabinet in protest."); applyEffects({ rep: 6, trust: 4, f: { reformers: 3 } }); G.record.agreements.push(`Resigned from the cabinet in protest (${eraYear(currentBBY())})`); frontScene("outsider_path", { reason: "You resigned from the cabinet in protest." }); break; }
        case "senate": { const r = world().roles.find(x => x.kind === "senator"); if (!r) return; if (ch0) changeRel(ch0, -5); setOffice(makeOffice({ title: `Candidate for ${r.title}`, kind: "candidate", target: { ...r }, months: 6 })); newOpponent(1); report("Back to the Senate", "You resign your ministry and file to run for the Senate."); break; }
    }
    render();
}

function ministryDesk() {
    const mk = G.office.ministry;
    const m = MINISTRIES.find(x => x.key === mk) || MINISTRIES[0];
    const b = initBudget();
    const ck = MINISTRY_COMMITTEE[mk];
    const line = b.last ? b.last.lines[ck] : null;
    const chair = npc(G.committeeChairs[ck]);
    const ch = chancellor();
    return `<div class="cols"><div class="col-main">${panel(`🏢 ${esc(m.name)}`, `<p class="small">You serve at the Chancellor's pleasure. Your ministry's money is written by the ${COMMITTEES[ck].name}${chair ? ` (chair: ${esc(chair.name)})` : ""}.</p>
        ${statRow("The Chancellor's confidence", ch ? relWord(ch.rel) : "—", ch ? clamp(50 + ch.rel / 2) : 50, "good")}
        ${line != null ? statRow(`Last year's budget (${agencyName(ck)})`, `${line}B of ${b.last.request[ck]}B requested`, clamp(line / b.last.request[ck] * 60), "good") : '<p class="muted small">The first budget cycle comes in Month 7.</p>'}
        <h4>Your portfolio</h4>
        ${(MINISTRY_ACTIONS[mk] || []).map(([k, label, cost, note]) => tact("ministry", label, cost, note, `data-t="${k}"`)).join("")}
        <h4>The ministry and the Senate</h4>
        ${tact("ministry", `Testify for your budget before the ${COMMITTEES[ck].name}`, 3, "Next year's budget up.", 'data-t="testify"')}
        ${tact("role", "🏢 Launch a galactic initiative", 3, "4 influence.", 'data-type="ministry"')}
        ${world().roles.some(r => r.kind === "senator") ? tact("ministry", "Resign and run for the Senate", 5, "Six-month campaign.", 'data-t="senate"') : ""}
        ${tact("ministry", "Resign in protest", 0, "Leave the cabinet on principle.", 'data-t="resign"')}`)}</div>
        <div class="col-side">${budgetPanel()}</div></div>`;
}

function relWord(r) { return r >= 50 ? "Trusted" : r >= 20 ? "Favoured" : r >= -10 ? "Tolerated" : r >= -40 ? "Doubted" : "On thin ice"; }

// The portfolios on offer are fixed when the offer arrives (stored on the dossier).
function ministryOfferChoices(n, ctx = {}) {
    if (!ctx.opts) {
        const opts = [];
        const add = m => { if (m && !opts.includes(m)) opts.push(m); };
        add(MINISTRIES.find(x => x.faction === G.ideology));
        (G.committees || []).forEach(c => add(MINISTRIES.find(x => MINISTRY_COMMITTEE[x.key] === c)));
        shuffle(MINISTRIES.slice()).forEach(m => { if (opts.length < 3) add(m); });
        ctx.opts = opts.slice(0, 3).map(m => m.key);
    }
    return ctx.opts.map(k => MINISTRIES.find(m => m.key === k)).map(m => ({ label: `Accept: become ${m.name}`, run: () => { setOffice(makeOffice({ title: m.name, kind: "minister", ministry: m.key })); if (n) changeRel(n, 10, "Accepted a place in their government."); applyEffects({ influence: 12 }); }, msg: "You clear your Senate office and move into the ministry." }));
}


// ── Career crossroads ─────────────────────────────────────────────

function crossroadsRoles() {
    return world().roles.map((r, i) => [r, i]).filter(([r]) => ["senator", "executive", "monarch", "local"].includes(r.kind) && (KIND_INFO[r.kind] || {}).elected && r.title !== G.office.title && !(r.kind === "senator" && G.galaxy[G.worldKey].independent));
}

function resolveCareerPlan(o) {
    const plan = o.plan;
    o.plan = null;
    if (plan === "retire") { pushScene("farewell", {}); return true; }
    if (plan === "stepdown") { rememberElectedSpec(); pushScene("outsider_path", { reason: "You chose not to run again." }); return true; }
    if (plan && plan.run != null) {
        const r = world().roles[plan.run];
        if (!r) return false;
        rememberElectedSpec();
        newOpponent(r.kind === "senator" || r.kind === "executive" ? 4 : 1);
        pushScene("campaign", { mode: "ladder", target: { ...r } });
        return true;
    }
    return false;
}


// ── Panels ────────────────────────────────────────────────────────

function budgetPanel() {
    const b = initBudget();
    const l = b.last;
    const rows = l ? Object.keys(COMMITTEES).map(k => `<div class="statrow small"><span>${esc(agencyName(k))}</span><b>${l.lines[k]}B <span class="muted">/ ${l.request[k]}B asked</span></b></div>`).join("") : '<p class="muted small">The budget is written each year: committees mark up in Month 7, the budget resolution passes in Month 9.</p>';
    return panel("💰 The galactic budget", `${rows}
        ${l ? `<div class="statrow"><span>Revenue / spending (${esc(l.year)})</span><b>${l.rev}B / ${l.spend}B</b></div><div class="statrow"><span>${l.deficit > 0 ? "Deficit" : "Surplus"}</span><b class="${l.deficit > 0 ? "c-against" : "c-for"}">${Math.abs(l.deficit)}B</b></div>` : ""}
        <div class="statrow"><span>Galactic debt</span><b class="${b.debt > 600 ? "c-against" : ""}">${Math.round(b.debt)}B</b></div>`);
}

function senatePanels() {
    const sp = senatePower();
    const emp = isEmpireEra();
    let out = panel(`⚖️ The Senate's power — ${spLabel(sp)}`, `<p class="small">${sp >= 75 ? "The Senate is a real check on the Chancellor. Chairs can hold bills and cut budgets." : sp >= 55 ? "The Chancellor's allies can sometimes force bills out of committee and restore budget cuts." : sp >= 35 ? "Committee holds rarely last, and the Chancellor often overrides budget cuts by executive order." : "Committees can no longer hold bills. Budgets are set by the executive; the Senate reviews them."}</p>
        ${statRow("Senate power", `${Math.round(sp)}%`, sp, "good")}
        ${(G.grabs || []).slice(0, 5).map(g => `<p class="small ${g.d < 0 ? "c-against" : "c-for"}">${g.d < 0 ? "▼" : "▲"} ${esc(g.text)} <span class="muted">(${esc(g.year)})</span></p>`).join("")}
        ${!emp && palIsChancellor() ? `${statRow("Your opposition bloc", Math.round(G.bloc || 0), (G.bloc || 0) * 2.5, "good")}${tact("whip", "🤝 Build the opposition bloc", 3, "Counts when you try to block a power grab.")}` : ""}`);
    if (G.chairOf) {
        const k = G.chairOf, b = initBudget();
        const held = G.bills.filter(x => x.held).map(x => `<li>${esc(x.title)} <button class="mini" data-act="release" data-id="${x.id}">Release</button> <button class="mini" data-act="releaseprice" data-id="${x.id}" ${G.ap < 2 ? "disabled" : ""}>Release for a price · 2</button></li>`).join("");
        const inCommittee = G.bills.filter(x => x.arena === "senate" && committeeFor(x) === k && !x.held).map(x => `<li>${esc(x.title)} <button class="mini" data-act="hold" data-id="${x.id}" ${G.ap < 3 || !chairCanHold() ? "disabled" : ""}>Hold · 3</button></li>`).join("");
        out += panel(`🪑 Chair of the ${COMMITTEES[k].name}`, `<p class="small">You write the budget for <b>${esc(agencyName(k))}</b>${k === "finance" ? " and negotiate the whole galactic budget with the Chancellor" : ""}. ${b.last ? `Last year: ${b.last.lines[k]}B of ${b.last.request[k]}B requested.` : "Markup is in Month 7."}</p>
            ${OVERSIGHT[k] ? tact("oversight", `🔍 ${OVERSIGHT[k].label}`, 4, sp < 25 ? "The Chancellery ignores subpoenas now." : "Oversight hearings.", "", sp < 25) : ""}
            <h4>Bills in your committee</h4>
            ${held ? `<p class="small c-und">Held by you:</p><ul class="small">${held}</ul>` : ""}
            ${inCommittee ? `<ul class="small">${inCommittee}</ul>` : '<p class="muted small">No other bills before your committee.</p>'}
            ${!chairCanHold() ? '<p class="small c-against">The Senate can no longer hold bills against the executive.</p>' : ""}`);
    }
    if (emp && isSenator()) {
        out += panel("✊ Resisting from inside the Senate", `<p class="small">The Imperial Senate is a stage set. But a senator still has a seal, a vote, access — and friends.</p>
            ${tact("resist", "📡 Pass Imperial secrets to the rebels", 4, G.committees.includes("intelligence") || G.committees.includes("defense") ? "Your committee seat makes this worth more." : "", 'data-t="leak"')}
            ${tact("resist", "🛂 Give a rebel courier a senatorial transit pass", 3, "", 'data-t="pass"')}
            ${tact("resist", "🛡️ Shield a world from reprisals", 4, "", 'data-t="shield"')}
            ${tact("resist", "📣 Read the names of the dead into the record", 3, "", 'data-t="speakworld"')}
            ${currentBBY() >= 2 && currentBBY() <= 18 ? tact("resist", "🕯️ Join Mon Mothma's quiet network", 3, "", 'data-t="mothma"') : ""}
            ${tact("resist", "🛑 Organise a bloc against an Imperial decree", 6, `8 influence. About ${blockSupport(30)}% chance.`, 'data-t="decree"')}
            ${G.chairOf ? tact("resist", "💰 Hide rebel funding in your committee's budget", 5, "Very dangerous.", 'data-t="hidebudget"') : ""}`, "danger");
    }
    return out + budgetPanel();
}


// ── Scenes ────────────────────────────────────────────────────────

Object.assign(SCENES, {
    committee_budget: ctx => {
        const k = ctx.k, b = initBudget(), req = b.request[k], sp = senatePower();
        const last = b.last ? b.last.lines[k] : null;
        const emp = isEmpireEra();
        const body = `<p>The Chancellor's request for <b>${esc(agencyName(k))}</b>: <b>${req}B</b>${last != null ? ` (last year: ${last}B)` : ""}.</p>
            <p class="small">Senate power: <b>${spLabel(sp)}</b>. ${sp < 60 ? "Cuts may be overridden by executive order." : "Your committee's word is final."}</p>`;
        const choices = sp < 20 ? [
            { label: "Rubber-stamp the request", go: () => setLine(k, 1, "Approved without amendment.") },
            { label: "Vote against it in committee", hint: "Symbolic. On the record.", go: () => { setLine(k, 1, "Approved over your objection."); applyEffects({ rep: 3 }); G.isb = (G.isb || 0) + (emp ? 8 : 0); addWrath(4); recordVote(`${agencyName(k)} budget`, "opposed"); } },
            ...(emp && (G.secretRebel || (G.imperial && ["resist", "double"].includes(G.imperial.path))) ? [{ label: "Approve it — and hide a rebel line item inside", hint: "Very dangerous.", go: () => { setLine(k, 1); G.rebellion = clamp(G.rebellion + 6); G.isb = (G.isb || 0) + 12; G.secretRebel = true; report("A line item nobody reads", "A “maintenance fund” in the budget quietly pays for rebel starships."); } }] : [])
        ] : [
            { label: `Fund the request (${req}B)`, go: () => setLine(k, 1, "Funded as requested.") },
            { label: `Cut it 20% (${Math.round(req * 0.8)}B)`, go: () => setLine(k, 0.8, "Cut by a fifth.") },
            ...(sp >= 60 ? [{ label: `Starve it: cut 40% (${Math.round(req * 0.6)}B)`, hint: "A declaration of war on the agency.", go: () => setLine(k, 0.6, "Cut by two fifths.") }] : []),
            { label: `Increase it 20% (${Math.round(req * 1.2)}B)`, go: () => setLine(k, 1.2, "Increased by a fifth.") },
            { label: "Fund it — with oversight conditions", hint: "Reporting requirements and a sunset. The Senate's power grows.", go: () => { setLine(k, 1, "Funded, with strings attached."); restoreSenatePower(3, `Oversight conditions on ${agencyName(k)}`); const c = chancellor(); if (c) changeRel(c, -4, "Attached conditions to his budget."); } }
        ];
        return { tag: "BUDGET MARKUP", title: `${COMMITTEES[k].name}: the ${eraYear(currentBBY())} budget`, body, choices };
    },

    budget_resolution: () => {
        const b = initBudget(), t = budgetTotals(), sp = senatePower();
        const ch = chancellor();
        const rows = Object.keys(COMMITTEES).map(k => `<tr><td>${esc(agencyName(k))}</td><td class="num">${b.lines[k]}B</td><td class="num muted">${b.request[k]}B</td></tr>`).join("");
        const body = `<p>As chair of the Finance Committee, you negotiate the galactic budget with ${ch ? esc(ch.name) : "the Chancellor"}.</p>
            <table class="results"><tr><th>Agency</th><th>Committees</th><th>Requested</th></tr>${rows}<tr><td>Interest on the debt</td><td class="num">${Math.round(b.debt * 0.03)}B</td><td></td></tr></table>
            <p>Revenue: <b>${t.rev}B</b> · Spending: <b>${t.spend}B</b> · <b class="${t.deficit > 0 ? "c-against" : "c-for"}">${t.deficit > 0 ? `Deficit ${t.deficit}B` : `Surplus ${-t.deficit}B`}</b> · Debt: ${Math.round(b.debt)}B</p>`;
        if (sp < 25) return { tag: "THE BUDGET", title: "The executive's budget", body: body + "<p class=\"small\">The Senate no longer writes the budget. It approves it.</p>", choices: [
            { label: "Approve it", go: () => closeBudget("by executive order") },
            { label: "Protest on the floor", go: () => { applyEffects({ rep: 3 }); addWrath(4); closeBudget("over your protest"); } }
        ] };
        const choices = [
            { label: "Pass it as it stands", go: () => closeBudget("as the committees wrote it") },
            ...(t.deficit > 0 ? [
                { label: "Balance it with cuts", hint: "Every agency shrinks. The Chancellor will not be pleased.", go: () => { trimToRevenue(1); if (ch) changeRel(ch, -10, "Forced spending cuts to balance the budget."); applyEffects({ f: { federalists: 4, corporatists: 3, militarists: -4 }, rep: 2 }); G.record.agreements.push(`Balanced the galactic budget (${eraYear(currentBBY())})`); closeBudget("balanced with spending cuts"); } },
                { label: "Balance it with new taxes on trade routes", hint: "The Outer Rim and the corporations will be furious.", go: () => { b.taxRaise += t.deficit; applyEffects({ f: { corporatists: -6, reformers: 2 }, gal: { trade: -2 } }); G.opinion.sep = clamp(G.opinion.sep + 3); G.record.agreements.push(`Balanced the galactic budget with new taxes (${eraYear(currentBBY())})`); closeBudget("balanced with new trade-route taxes"); } },
                { label: "Negotiate a compromise with the Chancellor", hint: `Half cuts, half revenue. About ${Math.round(clamp(40 + G.influence * 0.3 + (ch ? ch.rel * 0.2 : 0) + (sp - 50) * 0.3, 5, 90))}% chance.`, go: () => {
                    if (chance(40 + G.influence * 0.3 + (ch ? ch.rel * 0.2 : 0) + (sp - 50) * 0.3)) { trimToRevenue(0.5); b.taxRaise += Math.round(t.deficit / 2); if (ch) changeRel(ch, 3); applyEffects({ rep: 3, influence: 3 }); closeBudget("in a compromise with the Chancellor"); }
                    else { cutSenatePower(3, "The Chancellor went over the Finance Committee's head"); closeBudget("after the Chancellor went over your head"); }
                } },
                { label: "Refuse to move his budget until he gives ground", hint: `A standoff. About ${blockSupport(10)}% chance he blinks.`, go: () => {
                    if (chance(blockSupport(10))) { b.lines.defense = Math.round(b.lines.defense * 0.85); b.lines.intelligence = Math.round(b.lines.intelligence * 0.85); restoreSenatePower(5, "The Finance Committee faced down the Chancellor"); if (ch) changeRel(ch, -15, "Faced him down over the budget."); applyEffects({ rep: 5, influence: 5 }); closeBudget("after the Chancellor gave ground"); }
                    else { cutSenatePower(8, "The Chancellor funded the government by emergency decree"); if (ch) changeRel(ch, -10); applyEffects({ influence: -5 }); closeBudget("by emergency decree"); }
                } }
            ] : [{ label: "Return the surplus to member worlds", go: () => { b.lines.finance += Math.max(0, -t.deficit); closeBudget("with a surplus returned to member worlds"); } }])
        ];
        return { tag: "THE BUDGET RESOLUTION", title: `The ${eraYear(currentBBY())} galactic budget`, body, choices };
    },

    power_grab: ctx => {
        const g = GRABS[ctx.key];
        const pal = palNpc();
        const done = v => {
            if (v) recordVote(g.title, v);
            if (pal && v) changeRel(pal, v === "for" ? 10 : -10, `${v === "for" ? "Supported" : "Opposed"} ${g.title}.`);
            cutSenatePower(g.drop, `${g.title} passed`);
            if (g.onPass) g.onPass();
            report(`${g.title} passes`, "The Senate hands over a little more of its power.");
        };
        const body = `<p>${esc(g.body)}</p>${npcVoice("mothma")}<p class="small">Senate power: <b>${spLabel()}</b>. If it passes, the Senate loses more of its independence.</p>`;
        return { tag: g.tag, title: g.title, body, choices: isSenator() ? [
            { label: "Vote for it", go: () => { done("for"); histApply({ f: { centralists: 4, reformers: -3 } }, g.title); } },
            { label: "Vote against it", go: () => { done("against"); histApply({ f: { reformers: 3, federalists: 3, centralists: -3 } }, g.title); } },
            blockChoice(ctx.key, 0, g.hard, null, () => done("against")),
            { label: "Abstain", go: () => done("abstain") }
        ] : [{ label: "Continue", go: () => done(null) }] };
    },

    crossroads: () => {
        const o = G.office;
        const limited = o.termLimit > 0 && o.termsServed + 1 >= o.termLimit;
        const roles = crossroadsRoles();
        return { tag: "SIX MONTHS TO ELECTION DAY", title: "What comes next?",
            body: `<p>Your term as <b>${esc(o.title)}</b> ends in six months. ${limited ? "The constitution bars you from running again for this office." : "The filing deadline is coming."}</p><p class="small muted">Approval: ${Math.round(approval())}% · Influence: ${Math.round(G.influence)} · Funds: ${G.funds.toFixed(1)}M</p>`,
            choices: [
                { label: `Run for re-election as ${o.title}`, hint: limited ? "Term-limited." : "Defend your seat.", disabled: limited, go: () => { o.plan = "reelect"; } },
                ...roles.map(([r, i]) => ({ label: `Run for ${r.title} instead`, hint: `You leave your current office when your term ends. ${r.kind === "senator" ? "Galactic politics." : r.kind === "local" ? "A smaller, closer office." : "Govern your world."}`, go: () => { o.plan = { run: i }; report("Decision made", `You'll run for ${r.title} when your term ends.`); } })),
                { label: "Don't run: serve out your term, then leave office", go: () => { o.plan = "stepdown"; } },
                { label: "Retire at the end of your term", hint: "Pass the torch to the next generation.", go: () => { o.plan = "retire"; } }
            ] };
    },

    farewell: () => ({
        tag: "THE LAST DAY", title: "Farewell",
        body: `<p>Your staff line the corridor. Somebody has made a banner. After ${G.officesHeld.length ? G.officesHeld.map(esc).join(", ") : "all these years"}, you hand over the seal of office and walk out into the afternoon.</p>`,
        choices: [{ label: "Retire", go: () => endCareer("Retired at the end of the term.") }]
    }),

    ministry_directive: ctx => {
        const mk = G.office.ministry;
        const dark = palAlive() && (palIsChancellor() || isEmpireEra());
        const order = {
            finance: dark ? "Hide the true cost of the clone army inside the ordinary budget." : "Delay payments to Outer Rim worlds to make the numbers look better.",
            defense: dark ? "Divert clone production to a new Coruscant garrison reporting directly to the Chancellor." : "Cancel a contract in a rival senator's system.",
            interior: dark ? "Compile lists of citizens suspected of Separatist sympathies — including senators." : "Increase surveillance at the spaceports.",
            welfare: dark ? "Cut refugee funding to pay for the war." : "Close three Outer Rim clinics to save money.",
            planetary: dark ? "Prepare the transfer of planetary administration to regional governors." : "Pressure a world into dropping its lawsuit against the Republic."
        }[mk] || "Carry out a quiet order.";
        const ch = chancellor();
        return { tag: "FROM THE CHANCELLOR'S DESK", title: "A directive", body: `<p>The Chancellor's office sends a directive, marked for your eyes only:</p><p class="voice"><i>“${esc(order)}”</i></p>`,
            choices: [
                { label: "Carry it out", go: () => { if (ch) changeRel(ch, 8, "Carried out a directive without question."); applyEffects({ consistency: -4, rep: -2 }); if (dark) cutSenatePower(2); } },
                { label: "Slow-walk it", hint: "Maybe no one will notice.", go: () => { if (chance(40)) { if (ch) changeRel(ch, -8, "Slow-walked a directive."); report("Noticed", "The Chancellor's aide asks, very politely, why the directive has not been implemented."); } } },
                { label: "Refuse", go: () => { if (ch) changeRel(ch, -15, "Refused a directive."); if (dark) addWrath(8); if (chance(35)) frontScene("dismissed", {}); } },
                { label: "Leak it to the press", hint: "Dangerous.", go: () => { if (ch) changeRel(ch, -25, "Leaked a directive."); addWrath(15, "A directive leaked from your ministry."); applyEffects({ rep: 6, trust: 5, heat: 8 }); if (chance(60)) frontScene("dismissed", {}); } }
            ] };
    }
});


// ── The calendar ──────────────────────────────────────────────────

HISTORY.push(
    { bby: 24, m: 11, id: "senate_power_term", run: () => cutSenatePower(10, "The Chancellor's term extended") },
    { bby: 22, m: 5, id: "senate_power_emergency", run: () => cutSenatePower(20, "Emergency powers granted") },
    { bby: 21, m: 12, id: "security_council", run: () => { if (grabAllowed()) frontScene("power_grab", { key: "security_council" }); } },
    { bby: 20, m: 9, id: "holonet_decree", run: () => { if (grabAllowed()) frontScene("power_grab", { key: "holonet" }); } },
    { bby: 19, m: 1, id: "jedi_oversight", run: () => { if (grabAllowed()) frontScene("power_grab", { key: "jedi_control" }); } },
    { bby: 19, m: 2, id: "senate_power_sector", run: () => cutSenatePower(15, "The Sector Governance Decree") },
    { bby: 19, m: 5, id: "senate_power_empire", run: () => { const floor = Object.keys(G.blocked || {}).length >= 2 ? 30 : 0; const sp0 = senatePower(); cutSenatePower(sp0 - Math.max(floor, sp0 - 25), floor ? "The Empire — but the Senate keeps its committees, for now" : "The Empire is proclaimed"); } },
    { bby: 17, m: 6, id: "imperial_budget", run: () => { if (grabAllowed()) frontScene("power_grab", { key: "imperial_budget" }); } },
    { bby: 0, m: 3, id: "senate_power_end", run: () => cutSenatePower(senatePower(), "The Imperial Senate is dissolved") },
    { bby: -5, m: 3, id: "senate_power_restored", run: () => restoreSenatePower(100 - senatePower(), "The New Republic Senate is founded") }
);

function tickSenate() {
    senatePower();
    initBudget();
    if (G.bloc) G.bloc = Math.max(0, G.bloc - 0.4);
    G.bills.forEach(b => { if (b.held) holdTick(b); });
    if (G.retryEmergency && monthsNow() >= G.retryEmergency) { G.retryEmergency = null; if (grabAllowed()) frontScene("power_grab", { key: "emergency_retry" }); }
    if (G.era !== "rebellion") {
        if (G.month === 7) budgetSeason();
        if (G.month === 9) budgetResolution();
    }
    if (G.office.kind === "minister" && chance(palAlive() ? 5 : 2) && G.scenes.length < 2) pushScene("ministry_directive", {});
}
