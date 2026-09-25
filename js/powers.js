// ── ROLES & POWERS — every office is a different game ───────────────
//
// Every role defines powers, responsibilities, budget, legislative,
// appointment, military and diplomatic authority, term and succession
// rules, and constitutional constraints. The toolbox, the information
// you see and the interface all follow from that.

const ROLE_SCHEMA = {
    senator: { lens: "senate", label: "Senate Desk",
        powers: "Legislate, negotiate, oversee. Bring Republic money home.",
        responsibilities: "Represent your world in the Galactic Senate.",
        budget: "None directly — you fight for Republic appropriations (pork).",
        legislative: "Introduce, amend and vote on galactic legislation; sit on committees.",
        appointment: "None, except committee staff.",
        military: "None. You can petition, authorise and investigate.",
        diplomatic: "Sanctions, treaties and Senate resolutions.",
        constraints: "You cannot run your planet. You need votes for everything." },
    executive: { lens: "executive", label: "Executive",
        powers: "Implement, administer, respond.",
        responsibilities: "Run the planetary government and its budget.",
        budget: "Full authority over the planetary budget — within what you can raise.",
        legislative: "Propose bills to the planetary legislature; sign or veto.",
        appointment: "Cabinet and agency heads.",
        military: "Planetary defence forces. Republic forces only by petition.",
        diplomatic: "Planet-to-planet trade agreements.",
        constraints: "Courts can enjoin your decrees; the legislature controls laws; the Senate controls Republic help." },
    council: { lens: "executive", label: "Administration",
        powers: "Administer the planet on behalf of whoever appointed you.",
        responsibilities: "Keep the council, board or command that appointed you satisfied.",
        budget: "Planetary budget, subject to your appointers.",
        legislative: "Propose to the council.",
        appointment: "Agency heads.",
        military: "Planetary forces, under the appointing authority's eye.",
        diplomatic: "Limited.",
        constraints: "You can be removed whenever your backers lose confidence." },
    monarch: { lens: "court", label: "Royal Court",
        powers: "Appoint, assent, represent — and govern, if your constitution allows.",
        responsibilities: "Embody the state.",
        budget: "Depends on the monarchy: an elective queen governs; a constitutional one advises.",
        legislative: "Grant or withhold assent; request reconsideration.",
        appointment: "Prime ministers, royal advisers, ministers.",
        military: "Commander of royal forces, ceremonially or in fact.",
        diplomatic: "Receive delegations, host summits, grant audiences.",
        constraints: "The constitution. Push past it and you trigger a crisis." },
    hereditary: { lens: "court", label: "The Throne",
        powers: "Rule by birthright.",
        responsibilities: "Keep the throne — and the realm.",
        budget: "Absolute.",
        legislative: "Your word is law; councils advise.",
        appointment: "Everyone.",
        military: "The royal guard answers to you.",
        diplomatic: "Full.",
        constraints: "Legitimacy. Lose it and the nobles, clans or guard will act." },
    traditional: { lens: "court", label: "Council of Elders",
        powers: "Speak with the authority of custom.",
        responsibilities: "Preserve the people and their ways.",
        budget: "Customary resources.",
        legislative: "Consensus of the elders.",
        appointment: "By custom only.",
        military: "Traditional warriors.",
        diplomatic: "Receive envoys.",
        constraints: "Custom is patient but unforgiving." },
    clan: { lens: "court", label: "Clan Hall",
        powers: "Command through loyalty.",
        responsibilities: "Keep the clans behind you.",
        budget: "Tribute and clan wealth.",
        legislative: "Clan councils.",
        appointment: "Clan captains.",
        military: "Clan warriors.",
        diplomatic: "Alliances between clans and worlds.",
        constraints: "The clans can abandon you at any conclave." },
    local: { lens: "city", label: "City Hall",
        powers: "Housing, transit, police, parks, schools, sanitation, zoning.",
        responsibilities: "Your city or settlement.",
        budget: "A modest city budget.",
        legislative: "Local ordinances.",
        appointment: "City department heads.",
        military: "None. Petition the planetary government.",
        diplomatic: "None.",
        constraints: "You do not possess planetary or galactic authority." },
    chancellor: { lens: "chancellery", label: "Chancellery",
        powers: "Execute the Republic's government.",
        responsibilities: "The whole Republic.",
        budget: "The Republic budget, subject to the Senate.",
        legislative: "Set the agenda, direct ministries to draft bills, request emergency legislation.",
        appointment: "Ministers and the cabinet.",
        military: "Deploy the Republic's forces; authorisation from the Senate.",
        diplomatic: "Treaties, sanctions, recognition of governments.",
        constraints: "The Senate, the courts, and the constitution's term limits." },
    minister: { lens: "chancellery", label: "Ministry",
        powers: "Run a ministry of the Republic.",
        responsibilities: "Your portfolio.",
        budget: "Your ministry's.",
        legislative: "Draft bills for the Chancellor.",
        appointment: "Ministry staff.",
        military: "Only if Defence.",
        diplomatic: "Only if Foreign.",
        constraints: "You serve at the Chancellor's pleasure." },
    movement: { lens: "movement", label: "Movement HQ",
        powers: "Mobilise people outside the institutions.",
        responsibilities: "Your cause.",
        budget: "Donations.",
        legislative: "None.",
        appointment: "Your lieutenants.",
        military: "Only what your followers carry.",
        diplomatic: "Unofficial.",
        constraints: "Everything official is against you." },
    opposition: { lens: "movement", label: "Campaign HQ", powers: "Oppose, campaign, prepare to govern.", responsibilities: "Win the next election.", budget: "Campaign funds.", legislative: "Speak and vote in the legislature.", appointment: "Shadow cabinet.", military: "None.", diplomatic: "None.", constraints: "You have no power until you win." },
    candidate: { lens: "movement", label: "Campaign HQ", powers: "Campaign.", responsibilities: "Win.", budget: "Campaign funds.", legislative: "None.", appointment: "None.", military: "None.", diplomatic: "None.", constraints: "Not in office yet." },
    outsider: { lens: "movement", label: "Outside Office", powers: "Influence, money, networks.", responsibilities: "Your own.", budget: "Your own.", legislative: "None.", appointment: "None.", military: "None.", diplomatic: "Unofficial.", constraints: "No formal power at all." }
};

function roleSchema(kind = G.office.kind) { return ROLE_SCHEMA[kind] || ROLE_SCHEMA.outsider; }

function lens() {
    if (G.office.kind === "outsider" && /Rebel/.test(G.office.sub || "")) return "underground";
    if (G.office.kind === "council" && /Military/.test(G.const.militaryControl)) return "command";
    return roleSchema().lens;
}

function isConstitutionalMonarch() { return G.office.kind === "monarch" && G.const.monarchy === "constitutional"; }


// ── Senate committees ─────────────────────────────────────────────

const COMMITTEES = {
    finance:      { name: "Finance Committee",          prestige: 5, note: "Budgets, revenue, grants, emergency relief. Earmarks live or die here." },
    defense:      { name: "Defense Committee",          prestige: 5, note: "Military bills and petitions for assistance." },
    intelligence: { name: "Intelligence Committee",     prestige: 4, note: "Classified briefings. You'll know things others don't." },
    foreign:      { name: "Foreign Affairs Committee",  prestige: 4, note: "Sanctions, treaties, secession." },
    judiciary:    { name: "Judiciary Committee",        prestige: 3, note: "Emergency powers, courts, civil liberties." },
    commerce:     { name: "Commerce Committee",         prestige: 3, note: "Trade, corporations, labour. Donors notice." }
};

const BILL_COMMITTEE = {
    trade_route_tax: "finance", tariff_cut: "finance", banking_dereg: "finance", education_fund: "finance", water_relief: "finance", outer_rim_aid: "finance",
    security_auth: "defense", military_approps: "defense", military_creation: "defense",
    civil_liberties: "judiciary", ethics_reform: "judiciary", efficiency_act: "judiciary",
    kuat_shipping: "commerce", mining_rights: "commerce", labor_rights: "commerce", biotech_oversight: "commerce",
    refugee_resettlement: "foreign", planetary_sovereignty: "foreign", senate_centralization: "foreign"
};

function committeeFor(b) {
    if (b.petition) return "defense";
    if (b.key.startsWith("aid_")) return "finance";
    return BILL_COMMITTEE[b.key] || null;
}

function initCommittees() {
    G.committees = [];
    G.chairOf = null;
    G.committeeChairs = {};
    G.seniority = 0;
    G.earmarks = [];
    G.approPool = 1240;
    G.projects = [];
    G.cabinet = {};
    G.cityFunds = 5;
    G.fortify = 0;
    const senators = livingNpcs().filter(n => n.arena === "senate").sort((a, b) => b.influence - a.influence);
    Object.keys(COMMITTEES).forEach((k, i) => { if (senators[i + 1]) G.committeeChairs[k] = senators[i + 1].id; });
    if (G.office.kind === "senator") G.committees = [pick(["judiciary", "commerce"])];
}

function joinCommittee(k) {
    if (!G.committees.includes(k)) G.committees.push(k);
    report(`Committee assignment: ${COMMITTEES[k].name}`, COMMITTEES[k].note);
}

function requestAssignment(k) {
    if (!spendAP(5)) return;
    const c = COMMITTEES[k];
    const ch = chancellor();
    const p = 30 + G.influence * 0.5 - c.prestige * 6 + (ch ? ch.rel * 0.2 : 0) + G.factions[G.ideology] * 0.15 + G.seniority / 6;
    if (chance(p)) joinCommittee(k);
    else {
        const chair = npc(G.committeeChairs[k]);
        if (chair) changeRel(chair, -3);
        report("Assignment refused", `The leadership gives the ${c.name} seat to someone more senior.`);
    }
    render();
}

function seekChair(k) {
    if (!G.committees.includes(k) || G.seniority < 48) return;
    if (!spendAP(8)) return;
    const chair = npc(G.committeeChairs[k]);
    const p = 20 + G.influence * 0.4 + G.seniority / 4 - (chair && chair.rel <= -30 ? 20 : 0);
    if (chance(p)) {
        G.chairOf = k;
        if (chair) { changeRel(chair, -20, `You took their chairmanship of the ${COMMITTEES[k].name}.`); }
        G.committeeChairs[k] = "player";
        report(`Chair of the ${COMMITTEES[k].name}`, "You now decide which bills in your committee live and which die.", applyEffects({ influence: 8 }));
    } else report("Chairmanship bid fails", "The committee keeps its chair. The chair knows you tried.");
    render();
}

// Bills can be bottled up by a hostile committee chair.
function gateBill(b) {
    if (b.arena !== "senate") return;
    const k = committeeFor(b);
    b.committeeKey = k;
    if (!k) return;
    const chairId = G.committeeChairs[k];
    if (chairId === "player") return;
    const chair = npc(chairId);
    if (!chair || !chair.alive) return;
    const s = b.stance[chair.faction] || 0;
    if (s <= -2 && !(b.sponsor === "player" && chair.rel >= 30)) b.stuck = chairId;
}

function lobbyChair(b) {
    const chair = npc(b.stuck);
    if (!chair || !spendAP(3)) return;
    if (chance(30 + chair.rel * 0.5 + G.influence * 0.3)) { b.stuck = null; changeRel(chair, 2); report("Released from committee", `${chair.name} lets ${b.title} go to the floor.`); }
    else { changeRel(chair, -3); report("Still stuck", `${chair.name} won't move ${b.title}.`); }
    render();
}

function fastTrack(b) {
    if (!spendAP(3)) return;
    b.voteIn = 1; b.momentum += 6; b.stuck = null;
    report("Fast-tracked", `As chair, you send ${b.title} straight to the floor.`);
    render();
}

function buryBill(b) {
    if (!spendAP(4)) return;
    G.bills = G.bills.filter(x => x !== b);
    livingNpcs().filter(n => n.arena === "senate" && (b.stance[n.faction] || 0) >= 2).forEach(n => changeRel(n, -6, `You buried ${b.title} in committee.`));
    report("Buried in committee", `${b.title} will never reach the floor. Its supporters are furious.`, applyEffects({ influence: 2, f: Object.fromEntries(Object.entries(b.stance).filter(([, s]) => s >= 2).map(([f]) => [f, -4])) }));
    render();
}


// ── Bring it home: appropriations (pork) ──────────────────────────

function requestEarmark(i) {
    const p = world().pork[i];
    if (!p || G.earmarks.some(e => e.idx === i && ["requested", "building"].includes(e.status))) return;
    if (!spendAP(4)) return;
    const support = 10 + G.influence / 5 + (G.committees.includes("finance") ? 15 : 0) + (G.chairOf === "finance" ? 25 : 0) + G.seniority / 6;
    G.earmarks.push({ idx: i, name: p[0], cost: p[1], fx: p[2], g: p[3], blurb: p[4], gal: p[5] || null, support: Math.round(support), status: "requested", cosponsors: [], monthsLeft: 0 });
    report("Appropriation requested", `${p[0]} (${p[1]}M credits) goes into the appropriations process. Markup is in Month 10.`);
    render();
}

function earmarkAction(i, type, npcId) {
    const e = G.earmarks[i];
    if (!e || e.status !== "requested") return;
    if (!spendAP(3)) return;
    if (type === "cosponsor") {
        const n = npc(npcId);
        if (!n) return;
        if (n.rel >= 25 || chance(50)) {
            e.support += 10 + Math.round(n.influence / 10);
            e.cosponsors.push(n.name);
            if (n.rel < 25) {
                const theirs = Object.keys(BILLS).filter(k => BILLS[k].arena === "senate" && (BILLS[k].stance[n.faction] || 0) >= 2);
                if (theirs.length) { const k = pick(theirs); G.promises.push({ npcId: n.id, type: "trade", billKey: k, made: monthsNow(), bill: e.name, due: monthsNow() + ri(3, 7) }); report("Cosponsor — for a price", `${n.name}: “I'll support your ${e.name} if you support my ${BILLS[k].title}.”`); }
            } else report("Cosponsor secured", `${n.name} signs on to ${e.name}.`);
        } else { changeRel(n, -2); report("No cosponsor", `${n.name} has other priorities.`); }
    }
    if (type === "finance") { e.support += 8 + (G.committeeChairs.finance && npc(G.committeeChairs.finance) ? Math.round(npc(G.committeeChairs.finance).rel / 10) : 0); report("Finance Committee lobbied", `Staff on the Finance Committee take another look at ${e.name}.`); }
    if (type === "chancellor") { const ch = chancellor(); e.support += ch ? Math.round(ch.rel / 4) : 5; report("Pitched to the Chancellor", ch && ch.rel < 0 ? "The Chancellor's office is cool on the idea." : "The Chancellor's office is supportive."); }
    render();
}

function appropriationsMarkup() {
    const reqs = G.earmarks.filter(e => e.status === "requested").sort((a, b) => b.support - a.support);
    if (!reqs.length) return;
    const ch = chancellor();
    reqs.forEach(e => {
        if (e.support >= 35 + rnd(0, 25) && G.approPool >= e.cost) {
            if (ch && ch.rel <= -30 && chance(30)) { e.status = "rejected"; report("Earmark stripped", `The Chancellor's office has ${e.name} stripped from the appropriations bill.`); return; }
            G.approPool -= e.cost;
            e.status = "building";
            e.monthsLeft = 6 + Math.round(e.cost / 100);
            report("💰 Appropriation approved", `${e.name}: ${e.cost}M credits for ${world().name}. Construction begins.`, applyEffects({ influence: 3, g: e.g }, 0.5));
            publish(e.name, { federalists: 2, reformers: 1, corporatists: 1 });
        } else {
            e.status = "rejected";
            report("Appropriation rejected", `${e.name} doesn't make the cut this year. You can try again.`);
        }
    });
}

function tickAppropriations() {
    if (G.office.kind === "senator") G.seniority = (G.seniority || 0) + 1;
    if (G.month === 1) G.approPool = G.war ? 900 : 1240;
    if (G.month === 10) appropriationsMarkup();
    G.earmarks.filter(e => e.status === "building").forEach(e => {
        e.monthsLeft--;
        if (e.monthsLeft <= 0) {
            e.status = "built";
            Object.entries(e.fx || {}).forEach(([k, v]) => { G.base[k] += v; });
            const ch = applyEffects({ g: e.g, gal: e.gal || {}, trust: 2 });
            G.record.appropriations += e.cost;
            G.homeDelivered = (G.homeDelivered || 0) + 1;
            report(`✂️ Ribbon cutting: ${e.name}`, `${e.blurb}. Your constituents notice.`, ch);
            log(`💰 Delivered ${e.name} (${e.cost}M credits) to ${world().name}.`, "legacy");
        }
    });
    // Governors' projects.
    G.projects.filter(p => p.monthsLeft > 0).forEach(p => {
        p.monthsLeft--;
        if (p.monthsLeft <= 0) {
            Object.entries(p.fx).forEach(([k, v]) => { if (k === "fortify") G.fortify += v; else G.base[k] += v; });
            report(`🏗️ Completed: ${p.name}`, p.privateOwned ? "Built and owned by private investors." : "Opened by your government.", applyEffects({ trust: 2, g: p.g || {} }));
            log(`🏗️ Completed ${p.name}.`, "legacy");
        }
    });
    if (G.office.kind === "local") G.cityFunds = Math.min(30, G.cityFunds + 0.5);
    // Losing committee seats when the leadership turns on you.
    if (G.month === 12 && G.office.kind === "senator" && G.committees.length > 1 && chancellor() && chancellor().rel <= -40 && chance(30)) {
        const lost = G.committees.pop();
        if (G.chairOf === lost) G.chairOf = null;
        report("Committee seat lost", `The leadership strips you of your ${COMMITTEES[lost].name} assignment.`);
    }
}


// ── Governor: projects and financing ──────────────────────────────

const PROJECTS = [
    { key: "hospital", name: "Planetary Hospital",        cost: 2.4, months: 8,  fx: { healthcare: 8 }, g: { elders: 5, veterans: 3 } },
    { key: "housing",  name: "New Housing District",      cost: 1.8, months: 10, fx: { housing: 8 }, g: { youth: 4, urban: 4 } },
    { key: "port",     name: "Spaceport Modernisation",   cost: 3.0, months: 12, fx: { infrastructure: 8, employment: 3 }, g: { business: 5 } },
    { key: "univ",     name: "Planetary University",      cost: 1.5, months: 12, fx: { education: 8 }, g: { students: 6 } },
    { key: "grid",     name: "Power & Water Grid",        cost: 2.0, months: 10, fx: { infrastructure: 6, healthcare: 2 }, g: { rural: 5 } },
    { key: "academy",  name: "Security Academy",          cost: 1.0, months: 6,  fx: { crime: -6 }, g: { elders: 3 } },
    { key: "industry", name: "Industrial Park",           cost: 2.2, months: 10, fx: { employment: 7, environment: -3 }, g: { workers: 5, environmentalists: -3 } },
    { key: "reserve",  name: "Conservation Reserve",      cost: 0.6, months: 4,  fx: { environment: 7 }, g: { environmentalists: 5, traditional: 3 } },
    { key: "shield",   name: "Planetary Defence Works",   cost: 2.5, months: 12, fx: { fortify: 15 }, g: { military: 5, elders: 2 } }
];

function financeProject(key, how, extra) {
    const p = PROJECTS.find(x => x.key === key);
    if (G.projects.some(x => x.key === key && x.monthsLeft > 0)) return toast("Already under construction", `${p.name} is already being built.`);
    if (!spendAP(4)) return;
    const proj = { key, name: p.name, fx: p.fx, g: p.g, monthsLeft: p.months };
    let msg = "";
    switch (how) {
        case "cash": G.treasury -= p.cost; msg = "Paid from the treasury."; break;
        case "taxes": G.policies.income_tax.level = clamp(G.policies.income_tax.level + 0.2, 0, 1); G.treasury -= p.cost; applyEffects({ g: { workers: -3, elites: -4, business: -2 } }); msg = "You raise income tax to pay for it."; break;
        case "borrow": G.treasury -= p.cost; applyEffects({ g: { business: -1 }, f: { corporatists: -2 } }); msg = "Borrowed. The interest will follow you."; break;
        case "cut": { const k = extra; if (!G.policies[k]) return; G.policies[k].level = clamp(G.policies[k].level - 0.3, 0, 1); G.treasury -= p.cost * 0.4; const e = { g: {} }; Object.entries(POLICIES[k].g).forEach(([gk, v]) => { if (v > 0) e.g[gk] = -v * 0.5; }); applyEffects(e); msg = `Paid for by cutting ${POLICIES[k].name}.`; break; }
        case "republic": { const sen = worldSenator(G.worldKey); const ok = chance(25 + (sen ? sen.rel / 2 : 0) + G.influence / 3 + (G.allegiance === "republic" ? 10 : -30)); if (ok) { proj.monthsLeft += 3; msg = "Republic funding approved after a three-month wait."; G.record.appropriations += Math.round(p.cost * 1000); } else { G.ap += 4; return report("Republic funding refused", "The Senate won't pay for it. Find another way."); } break; }
        case "private": proj.privateOwned = true; applyEffects({ p: { inequality: 2 }, g: { business: 4, workers: -2 }, f: { corporatists: 5, reformers: -3 } }); msg = "Private investors build it — and own it."; break;
    }
    G.projects.push(proj);
    report(`Project launched: ${p.name}`, msg);
    render();
}


// ── Executive powers ──────────────────────────────────────────────

function execAction(type, arg) {
    const costs = { emergency: 5, agencies: 3, regulations: 3, resources: 3, cabinet: 3, agencyhead: 3, merge: 4, security: 3, preparedness: 3, incentives: 3, mining: 3, enterprise: 4, trade: 4 };
    if (!spendAP(costs[type] || 3)) return;
    let ch = [];
    switch (type) {
        case "emergency":
            G.emergencyDeclared = 12;
            ch = applyEffects({ i: { courts: -5, legislature: -4 }, f: { militarists: 3, reformers: -4 } });
            G.liberties = clamp(G.liberties + 10);
            report("State of emergency declared", "Wartime measures are unlocked and decrees bypass the courts for twelve months. Citizens will ask when it ends.", ch); break;
        case "agencies": ch = applyEffects({ i: { civil: 8 } }); report("Agencies directed", "You give the ministries clear orders and deadlines.", ch); break;
        case "regulations": ch = applyEffects({ p: { inequality: -2 }, g: { workers: 3, business: -3 } }); report("Temporary regulations", "Emergency price and safety rules take effect.", ch); break;
        case "resources": ch = applyEffects({ treasury: -2, unrest: -8 }); ["food", "medicine", "fuel"].forEach(k => { G.supplies[k] = clamp(G.supplies[k] + 20); }); report("Emergency resources allocated", "Reserves are released to the districts that need them most.", ch); break;
        case "cabinet": { const n = npc(arg); G.cabinet[extraSeat()] = n.id; changeRel(n, 12, "Appointed to your cabinet."); ch = applyEffects({ i: { civil: 3 }, f: { [n.faction]: 4 } }); report("Cabinet appointment", `${n.name} joins your cabinet.`, ch); break; }
        case "agencyhead": ch = applyEffects({ i: { civil: 6 }, heat: chance(30) ? 4 : 0 }); report("Agency head replaced", "A loyalist takes over a troublesome agency.", ch); break;
        case "merge": ch = applyEffects({ treasury: 1.5, i: { civil: -5 } }); report("Agencies merged", "Savings now, confusion for a while.", ch); break;
        case "security": ch = applyEffects({ p: { crime: -4 }, g: { youth: -2, elders: 2 } }); G.liberties = clamp(G.liberties + 5); report("Security deployed", "Planetary security is on the streets.", ch); break;
        case "preparedness": G.fortify += 5; ch = applyEffects({ treasury: -1.5, g: { military: 2 } }); report("Defence preparedness", `Defence strength is now ${defenseStrength()}.`, ch); break;
        case "incentives": ch = applyEffects({ p: { employment: 3, inequality: 2 }, treasury: -1, g: { business: 4 }, f: { corporatists: 3 } }); report("Corporate incentives", "Tax breaks lure new investment.", ch); break;
        case "mining": ch = applyEffects({ p: { environment: 4, employment: -2 }, g: { environmentalists: 4, business: -3 } }); report("Mining regulated", "Tighter rules on the extraction companies.", ch); break;
        case "enterprise": ch = applyEffects({ p: { employment: 3 }, treasury: -2, g: { workers: 3, business: -3 }, f: { reformers: 3, corporatists: -3 } }); report("Public enterprise", "A state-owned company takes over a failing industry.", ch); break;
        case "trade": { const k = arg; ch = applyEffects({ world: { key: k, prosperity: 4 }, gal: { trade: 1 }, p: { employment: 1 } }); const s = worldSenator(k); if (s) changeRel(s, 6, `Signed a trade agreement with ${world().name}.`); G.record.agreements.push(`${world().name}–${worldName(k)} Trade Agreement (${eraYear(currentBBY())})`); report("Trade agreement", `${world().name} and ${worldName(k)} sign a trade agreement.`, ch); break; }
    }
    render();
}

function extraSeat() {
    const seats = ["Finance", "Security", "Health", "Infrastructure"];
    return seats.find(s => !G.cabinet[s]) || pick(seats);
}


// ── The royal court ───────────────────────────────────────────────

function courtAction(type, arg) {
    const costs = { pm: 5, advisers: 3, summit: 5, statement: 3, audience: 3, delegation: 3, newgov: 8, emergency: 5 };
    if (!spendAP(costs[type] || 3)) return;
    let ch = [];
    switch (type) {
        case "pm": { const n = npc(arg); G.pm = n.id; n.title = `Prime Minister of ${world().name}`; changeRel(n, 15, "Appointed Prime Minister by the Crown."); ch = applyEffects({ i: { legislature: 5 }, f: { [n.faction]: 5 } }); report("Prime Minister appointed", `${n.name} forms a government. Their ${FACTIONS[n.faction].name} priorities will shape policy.`, ch); break; }
        case "advisers": ch = applyEffects({ influence: 3, legitimacy: 3 }); report("Royal advisers", "You bring wise heads into the palace.", ch); break;
        case "summit": ch = applyEffects({ gal: { diplomacy: 4 }, rep: 3, influence: 2 }); report("Diplomatic summit", `Leaders from across the sector meet at your court.`, ch); G.record.agreements.push(`Hosted a diplomatic summit (${eraYear(currentBBY())})`); break;
        case "statement": ch = applyEffects({ trust: 3, g: { [arg]: 3 } }); report("Royal statement", `The Crown speaks to the ${GROUPS[arg].name.toLowerCase()}.`, ch); break;
        case "audience": { const n = npc(arg); changeRel(n, 8, "Granted a royal audience."); report("Royal audience", `${n.name} is received at court. “${canonLine(n) || "An honour, Your Majesty."}”`); break; }
        case "delegation": { const k = arg; ch = applyEffects({ world: { key: k, stability: 3 }, gal: { diplomacy: 1 } }); const s = worldSenator(k); if (s) changeRel(s, 8, "Received by your court."); report("Delegation received", `The delegation from ${worldName(k)} is received with full honours.`, ch); break; }
        case "newgov": ch = applyEffects({ i: { legislature: -6 }, legitimacy: -3 }); G.pm = null; report("New government called", "You dissolve the government and call on the assembly to form a new one.", ch); break;
        case "emergency": G.emergencyDeclared = 12; ch = applyEffects({ i: { courts: -4 } }); report("Emergency provisions invoked", "The Crown invokes its emergency powers.", ch); break;
    }
    render();
}


// ── The Chancellery ───────────────────────────────────────────────

function chancelleryAction(type, arg) {
    const costs = { minister: 4, dismiss: 4, agenda: 3, draft: 5, negotiate: 4, deploy: 5, authorize: 4, readiness: 3, meet: 4, treaty: 5, sanctions: 4, recognize: 5, address_senate: 3, address_public: 3, mobilize: 5 };
    if (!spendAP(costs[type] || 3)) return;
    let ch = [];
    switch (type) {
        case "minister": { const [ministry, id] = arg.split(":"); const n = npc(id); G.ministers = G.ministers || {}; G.ministers[ministry] = n.id; n.title = MINISTRIES.find(m => m.key === ministry).name; changeRel(n, 15, "Appointed to the cabinet."); ch = applyEffects({ f: { [n.faction]: 5 }, influence: 2 }); report("Minister appointed", `${n.name} becomes ${n.title}.`, ch); break; }
        case "dismiss": { const n = npc(arg); changeRel(n, -30, "Dismissed from the cabinet."); Object.keys(G.ministers || {}).forEach(k => { if (G.ministers[k] === n.id) delete G.ministers[k]; }); n.title = `Senator of ${worldName(n.world)}`; ch = applyEffects({ f: { [n.faction]: -5 } }); report("Minister dismissed", `${n.name} is out. They will not forget it.`, ch); break; }
        case "agenda": G.agenda = arg; report("Legislative agenda set", "The government's full weight goes behind this bill."); break;
        case "draft": { const b = createBill(arg, "player"); report("Ministry drafts a bill", `${b.title} goes to the Senate.`); break; }
        case "negotiate": G.bills.filter(b => b.arena === "senate" && b.playerVote).forEach(b => { b.momentum += dir(b) * 5; }); report("Negotiations with the Senate", "Your whips work the corridors."); break;
        case "deploy": { const k = arg; if (k === G.worldKey && G.siege) G.garrison += 40; ch = applyEffects({ world: { key: k, stability: 10 }, gal: { military: -1 } }); G.galTreasury -= 3; const s = worldSenator(k); if (s) changeRel(s, 10, "Sent Republic forces to their world."); report("Forces deployed", `Republic forces deploy to ${worldName(k)}.`, ch); break; }
        case "authorize": { createBill("use_of_force", "player", { arena: "senate", title: "Authorization for the Use of Force", desc: "Senate authorisation for military operations.", stance: { militarists: 3, centralists: 2, reformers: -2, federalists: -1, independence: -2, corporatists: 1, traditionalists: 0 }, g: { military: 4 }, gal: { war: -3, military: 4 } }); report("Authorisation requested", "The Senate will vote on authorising force."); break; }
        case "readiness": ch = applyEffects({ gal: { military: 5, war: -1 }, f: { militarists: 3 } }); report("Readiness increased", "The fleets are brought to full readiness.", ch); break;
        case "meet": ch = applyEffects({ gal: { diplomacy: 3, war: -2 }, rep: 2 }); report("Summit", G.war ? "You meet Separatist envoys in secret. Hawks are furious." : "You meet leaders from across the galaxy.", ch); break;
        case "treaty": ch = applyEffects({ gal: { diplomacy: 6, war: -4 }, f: { reformers: 3, militarists: -3 } }); G.record.agreements.push(`Negotiated a galactic treaty (${eraYear(currentBBY())})`); report("Treaty signed", "A treaty eases galactic tensions.", ch); break;
        case "sanctions": ch = applyEffects({ gal: { trade: -3, war: -1 }, f: { corporatists: -4, militarists: 2 } }); report("Sanctions imposed", "The Republic sanctions the Confederacy's trading houses.", ch); break;
        case "recognize": { const k = arg; G.galaxy[k].align = "neutral"; ch = applyEffects({ f: { independence: 6, federalists: 3, centralists: -6 } }); report("Government recognised", `The Republic recognises the independent government of ${worldName(k)}.`, ch); break; }
        case "address_senate": G.bills.filter(b => b.arena === "senate" && b.playerVote).forEach(b => { b.momentum += dir(b) * 4; }); ch = applyEffects({ influence: 2 }); report("Address to the Senate", "You address the full Senate.", ch); break;
        case "address_public": ch = applyEffects({ trust: 4 }); report("Address to the galaxy", "You speak to every world at once.", ch); break;
        case "mobilize": ch = applyEffects({ gal: { military: 8 }, treasury: -2 }); G.emergencyDeclared = 12; report("Resources mobilised", "The Republic's industry is put on a war footing.", ch); break;
    }
    render();
}


// ── Senator desk: oversight, coalitions, foreign affairs ──────────

function senatorAction(type, arg) {
    const costs = { hearing: 4, investigation: 3, inquiry: 6, milreview: 4, bloc: 3, sanctions: 3, treaty: 4, intervention: 3 };
    if (!spendAP(costs[type] || 3)) return;
    let ch = [];
    switch (type) {
        case "hearing": {
            const target = arg;
            if (target === "chancellor") { const c = chancellor(); if (c) changeRel(c, -10, "Hauled their office before a committee."); }
            if (chance(40)) { G.repCorruption = clamp(G.repCorruption - 5); ch = applyEffects({ trust: 5, rep: 3, media: { herald: 5 } }); report("Hearing: revelations", "Your questioning exposes mismanagement. The HoloNet runs the clips for days.", ch); }
            else { ch = applyEffects({ trust: 2 }); report("Hearing", "The official stonewalls, but you are on the record.", ch); }
            break;
        }
        case "investigation": { G.repCorruption = clamp(G.repCorruption - 3); const r = rivals().find(n => n.arena === "senate"); if (r && chance(35)) { r.influence = clamp(r.influence - 10); changeRel(r, -10, "Their dealings were investigated at your request."); report("Investigation", `The inquiry turns up irregularities involving ${r.name}.`); } else report("Investigation opened", "The Senate's investigators get to work."); break; }
        case "inquiry": { if (G.influence < 5) { G.ap += 6; return toast("Not enough influence", "A full Senate inquiry needs 5 influence."); } G.repCorruption = clamp(G.repCorruption - 8); const c = chancellor(); if (c) changeRel(c, -15, "Demanded a Senate inquiry."); ch = applyEffects({ influence: -5, trust: 5, rep: 4 }); report("Senate inquiry", "A full Senate inquiry is launched. The Chancellor's office is not pleased.", ch); break; }
        case "milreview": ch = applyEffects({ gal: { military: -5 }, f: { militarists: -5, reformers: 3 } }); report("Military spending review", "The Defense Committee finds waste — lots of it.", ch); break;
        case "bloc": {
            const regions = { core: "Core Worlds delegation", mid: "Mid Rim caucus", outer: "Outer Rim bloc" };
            if (arg === "loyalist") { ["amidala", "bail", "mothma"].forEach(k => { const n = canonNpc(k); if (n) changeRel(n, 5); }); ch = applyEffects({ f: { reformers: 3 } }); report("Loyalist Committee", "You meet with the Loyalists."); break; }
            if (arg === "sep") { livingNpcs().filter(n => n.faction === "independence").forEach(n => changeRel(n, 5)); ch = applyEffects({ f: { independence: 4, centralists: -3 }, heat: 3 }); G.opinion.sep = clamp(G.opinion.sep + 2); report("Separatist sympathisers", "You meet quietly with senators who talk of leaving.", ch); break; }
            livingNpcs().filter(n => n.arena === "senate" && ((WORLDS[n.world] || BACKGROUND_WORLDS[n.world] || {}).region === arg)).forEach(n => changeRel(n, 4));
            G.bills.filter(b => b.arena === "senate" && b.playerVote).forEach(b => { b.momentum += dir(b) * 3; });
            report(`Meeting: ${regions[arg]}`, "Coalition-building over a long dinner.");
            break;
        }
        case "sanctions": ch = applyEffects({ f: arg === "support" ? { militarists: 3, corporatists: -4, reformers: 1 } : { corporatists: 3, reformers: -1 }, gal: { trade: arg === "support" ? -1 : 1 } }); report(arg === "support" ? "You back sanctions" : "You oppose sanctions", "Your position goes on the record.", ch); break;
        case "treaty": ch = applyEffects({ gal: { diplomacy: 3 }, f: { reformers: 2, federalists: 2 } }); G.record.agreements.push(`Ratified a galactic treaty (${eraYear(currentBBY())})`); report("Treaty ratified", "You help carry a treaty through the Senate.", ch); break;
        case "intervention": { const k = arg; ch = applyEffects({ world: { key: k, stability: 6 }, gal: { diplomacy: 1 } }); const s = worldSenator(k); if (s) changeRel(s, 8, "Requested diplomatic intervention for their world."); report("Diplomatic intervention", `Republic diplomats are sent to ${worldName(k)}.`, ch); break; }
    }
    render();
}


// ── City hall ─────────────────────────────────────────────────────

const CITY_SERVICES = [
    { key: "housing", name: "Housing", icon: "🏠", fx: { housing: 1.2 }, g: { youth: 3, urban: 2 } },
    { key: "transit", name: "Transit", icon: "🚝", fx: { infrastructure: 1.2 }, g: { urban: 3, workers: 2 } },
    { key: "police", name: "Police", icon: "🚓", fx: { crime: -1.2 }, g: { elders: 3, business: 2 } },
    { key: "parks", name: "Parks", icon: "🌳", fx: { environment: 1 }, g: { environmentalists: 3, youth: 1 } },
    { key: "schools", name: "Schools", icon: "🏫", fx: { education: 1.2 }, g: { students: 3, youth: 2 } },
    { key: "sanitation", name: "Sanitation", icon: "🧹", fx: { healthcare: 1 }, g: { elders: 2, urban: 2 } },
    { key: "business", name: "Local business", icon: "🏪", fx: { employment: 1 }, g: { business: 3 } },
    { key: "zoning", name: "Zoning reform", icon: "📐", fx: { housing: 1, inequality: -0.5 }, g: { youth: 2, elites: -2 } }
];

function cityService(key) {
    const s = CITY_SERVICES.find(x => x.key === key);
    if (G.cityFunds < 1.5) return toast("City budget exhausted", "The city budget refills slowly each month — or petition the planetary government.");
    if (!spendAP(3)) return;
    G.cityFunds -= 1.5;
    Object.entries(s.fx).forEach(([k, v]) => { G.base[k] += v; });
    report(`City: ${s.name}`, "A modest improvement, felt on every street.", applyEffects({ g: s.g }));
    render();
}

function petitionUp(what) {
    if (!spendAP(3)) return;
    const ok = chance(35 + G.influence * 0.5 + (approval() - 50) * 0.3);
    if (!ok) { report("Petition declined", "The planetary government has other priorities."); return render(); }
    if (what === "funds") { G.cityFunds += 4; report("Petition granted", "The planetary government sends extra funding to your city."); }
    if (what === "defence") { G.garrison += 10; report("Petition granted", "Planetary forces are stationed near your city."); }
    render();
}


// ── The underground ───────────────────────────────────────────────

function rebelAction(type) {
    if (!spendAP(type === "sabotage" ? 5 : 3)) return;
    let ch = [];
    if (type === "recruit") { G.rebellion = clamp(G.rebellion + 2); ch = applyEffects({ heat: 4, g: { youth: 3 } }); report("Cells recruited", "New recruits join the underground.", ch); }
    if (type === "sabotage") {
        if (chance(25)) { G.record.arrests.push(eraYear(currentBBY())); report("Captured", "The sabotage mission is betrayed. You are taken."); enterOutsider("Prisoner", 24); return render(); }
        G.rebellion = clamp(G.rebellion + 4); ch = applyEffects({ heat: 8 }); report("Sabotage", "An Imperial supply depot burns.", ch);
    }
    if (type === "fund") { if (G.funds < 1) { G.ap += 3; return toast("Not enough funds", "You need 1M credits."); } G.rebellion = clamp(G.rebellion + 3); ch = applyEffects({ funds: -1 }); report("Funds sent", "Credits reach the Alliance through a dozen shell companies.", ch); }
    render();
}
