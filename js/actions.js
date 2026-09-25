// ── ACTIONS — campaign finance, the press, relationships, diplomacy ──

function fundraise(source) {
    const s = DONOR_SOURCES[source];
    if (source === "party" && G.factions[G.ideology] < 10) return toast("Your faction won't fund you", "You need at least +10 standing with your own faction.");
    if (source === "grant" && (!G.const.publicFinancing || G.grantUsedTerm === G.termIndex)) return toast("No grant available", "Only once per term, and only where the constitution provides public financing.");
    if (!spendAP()) return;
    let amount = rnd(s.amount[0], s.amount[1]);
    let donor = s.name;
    let e = {};
    let msg = "";
    switch (source) {
        case "small":
            e = { trust: 1, g: { workers: 1, youth: 1 } };
            msg = "Thousands of small donations trickle in.";
            break;
        case "corporate": {
            const corp = pick(CORPORATIONS);
            if (G.ethicsLaw) amount *= 0.5;
            donor = corp.name;
            const billKey = arena() === "senate" ? corp.bill : pick(["industry_tax_cut", "infra_bond"]);
            G.obligations.push({ donor, billKey, due: monthsNow() + ri(4, 8) });
            e = { f: { corporatists: 3 }, g: { workers: -1, environmentalists: -1 } };
            msg = `The ${corp.name} writes a generous cheque.${G.ethicsLaw ? " Ethics law caps it." : ""} They will be in touch.`;
            break;
        }
        case "unions":
            G.obligations.push({ donor: "Federation of Labour", billKey: arena() === "senate" ? "labor_rights" : "min_wage", due: monthsNow() + ri(4, 8) });
            donor = "Federation of Labour";
            e = { g: { unions: 3, workers: 2, business: -2 }, f: { reformers: 2 } };
            msg = "The unions back you. They expect you to back them.";
            break;
        case "wealthy":
            donor = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)} (patron)`;
            e = { g: { elites: 2 } };
            if (chance(35)) { e.secret = `Accepted undisclosed gifts from ${donor}`; e.secretHeat = 8; }
            msg = "A discreet dinner, a discreet transfer.";
            break;
        case "party":
            e = { consistency: 2 };
            msg = `The ${FACTIONS[G.ideology].name} campaign committee funds you — and expects loyalty.`;
            break;
        case "grassroots":
            e = { g: { youth: 3, students: 2 }, health: -2 };
            msg = "Endless calls, rallies and bake sales. Exhausting, and it works.";
            break;
        case "grant":
            G.grantUsedTerm = G.termIndex;
            e = { trust: 1 };
            msg = "Public financing arrives — clean money.";
            break;
    }
    amount = Math.round(amount * 10) / 10;
    e.funds = amount;
    G.donors[donor] = G.donors[donor] || { given: 0, rel: 20, source };
    G.donors[donor].given = Math.round((G.donors[donor].given + amount) * 10) / 10;
    report(`Fundraising: ${s.name}`, msg, applyEffects(e));
    render();
}

function pressConference() {
    if (!spendAP()) return;
    if (chance(15)) {
        report("Gaffe!", "An offhand remark goes viral for all the wrong reasons.", applyEffects({ trust: -4, media: { herald: -3, cbj: -3, courier: -3 } }));
    } else {
        const media = {};
        OUTLETS.forEach(o => { media[o.key] = 2; });
        report("Press conference", "You field questions for an hour. Solid, steady coverage.", applyEffects({ trust: 3, media, influence: 1 }));
    }
    render();
}

function interview(key) {
    const o = OUTLETS.find(x => x.key === key);
    if (!spendAP()) return;
    const hostile = G.factions[o.lean] < -20 || G.media[key] < -20;
    const g = {};
    o.audience.forEach(a => { g[a] = 2; });
    if (hostile && chance(45)) {
        Object.keys(g).forEach(a => { g[a] = -2; });
        report(`Interview: ${o.name}`, "A hostile interviewer ambushes you. It goes badly.", applyEffects({ g, media: { [key]: -4 }, trust: -2 }));
    } else {
        report(`Interview: ${o.name}`, `You reach the ${o.name}'s audience directly.`, applyEffects({ g, media: { [key]: 8 } }));
    }
    render();
}

function attackAd() {
    if (G.funds < 1.5) return toast("Not enough funds", "An ad buy costs 1.5M credits.");
    report("Attack ads", "Grainy footage, ominous music, and your opponent's worst votes.", applyEffects({ funds: -1.5, opp: -3, trust: -2 }));
    render();
}

function leakOnRival(id) {
    const n = npc(id);
    if (!n || !spendAP()) return;
    n.influence = clamp(n.influence - 10);
    changeRel(n, -25, "Leaked damaging material about them.");
    if (chance(30)) report("Leak traced back to you", `${n.name} knows exactly who leaked it.`, applyEffects({ heat: 8, trust: -3 }));
    else report("A well-placed leak", `Embarrassing documents about ${n.name} appear in the press.`, applyEffects({ heat: 2 }));
    render();
}

function meetNpc(id) {
    const n = npc(id);
    if (!n || !spendAP()) return;
    const d = ri(4, 9);
    changeRel(n, d, n.memory.some(m => m.includes("private meeting")) ? null : "A long private meeting; you found some common ground.");
    report("Private meeting", `You spend an evening with ${n.name}. Relations improve (${fmt(d)}).`);
    render();
}

function seekEndorsement(id) {
    const n = npc(id);
    if (!n || n.rel < 50 || n.endorsedTerm === G.termIndex) return;
    if (!spendAP()) return;
    n.endorsedTerm = G.termIndex;
    G.endorsements = (G.endorsements || 0) + 1;
    changeRel(n, -3, "Endorsed you publicly.");
    report("Endorsement", `${n.name} publicly endorses you. It will help at the next election.`);
    render();
}

function denounce(id) {
    const n = npc(id);
    if (!n || !spendAP()) return;
    changeRel(n, -30, "You denounced them publicly.");
    const f = { [n.faction]: -4 };
    if (n.faction !== G.ideology) f[G.ideology] = 3;
    report("Public denunciation", `You tear into ${n.name} on the floor. Your side cheers.`, applyEffects({ f, influence: 1 }));
    render();
}

function visitWorld(key) {
    if (!spendAP()) return;
    const sen = worldSenator(key);
    if (sen) changeRel(sen, 8, `You visited ${worldName(key)}.`);
    report(`State visit: ${worldName(key)}`, sen ? `${sen.name} shows you around.` : "You meet the local leadership.", applyEffects({ world: { key, stability: 1 }, influence: 1 }));
    render();
}

function secureFunding(stat) {
    if (G.influence < 8) return toast("Not enough influence", "Securing Republic funding costs 8 influence.");
    if (!spendAP(5)) return;
    const name = PLANET_STATS[stat].name;
    const ch = applyEffects({ influence: -8, program: { name: `Republic ${name} Grant`, p: { [stat]: PLANET_STATS[stat].bad ? -2.5 : 2.5 }, years: 3 } });
    report("Republic funding secured", `You pull strings in the Senate to fund ${name.toLowerCase()} back home.`, ch);
    render();
}

function retire() {
    endCareer("Retired from public life by choice.");
    render();
}
