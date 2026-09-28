// ── WORLD ATTRIBUTES — the stars mean something ─────────────────────
//
// Every world has five core attributes, 1–5 stars:
//   wealth, political_stability, resource_wealth, strategic_vulnerability,
//   cultural_identity
// They set starting conditions and keep shaping the simulation:
//   Low wealth        → smaller tax base, weaker services, dependence on
//                       Republic funding, vulnerability to economic shocks
//   Low stability     → protests, stronger opposition, coalition collapse,
//                       separatism, coups and civil conflict
//   High vulnerability→ blockades and invasions, pressure to accept Republic
//                       garrisons, higher defence spending, diplomatic stakes
//   High identity     → resistance to outside interference, strong local
//                       movements, backlash against culturally threatening policy
//   Resource wealth   → jobs and revenue — and outsiders who want them
// Political stability is not frozen: it tracks the world's actual stability.

const ATTRIBUTES = {
    wealth:        { name: "Wealth", key: "wealth",
        effects: ["Tax base and public revenue", "Strength of public services", "Dependence on Republic funding", "Exposure to economic shocks"] },
    stability:     { name: "Political stability", key: "stability",
        effects: ["Protests and unrest", "Strength of the opposition", "Coalition collapse", "Separatist movements", "Coups and civil conflict"] },
    resources:     { name: "Resource wealth", key: "resources",
        effects: ["Jobs and extraction revenue", "Corporate and foreign interest in your world"] },
    vulnerability: { name: "Strategic vulnerability", key: "vulnerability",
        effects: ["Chance of blockade and invasion", "Pressure to accept Republic forces", "Demand for defence spending", "Diplomatic consequences of your choices"] },
    identity:      { name: "Cultural identity", key: "identity",
        effects: ["Resistance to outside interference", "Strength of local movements", "Backlash against culturally threatening policies"] }
};

// Current value of an attribute (1–5) for the player's world.
function attr(k) {
    const w = world();
    if (k === "stability" && G && G.galaxy && G.galaxy[G.worldKey]) {
        return clamp(Math.round(G.galaxy[G.worldKey].stability / 20 + 0.5), 1, 5);
    }
    const base = w.ratings[k] || 3;
    if (["wealth", "resources", "vulnerability"].includes(k) && typeof liveAttr === "function" && G && G.planet) return clamp(Math.round(liveAttr(k, base)), 1, 5);
    return base;
}

function attrLine(k, v) {
    const lines = {
        wealth: v <= 2 ? "Small tax base, thin services, heavy reliance on Republic money, fragile economy." : v >= 4 ? "Deep tax base, strong services, able to weather shocks." : "A middling economy.",
        stability: v <= 2 ? "Protests come easily; oppositions are strong; coalitions break; coups are possible." : v >= 4 ? "Institutions hold; opposition plays by the rules." : "Stable, with strains.",
        resources: v >= 4 ? "Rich in resources: jobs and revenue — and outsiders who covet them." : v <= 2 ? "Few resources to trade or tax." : "Some resources.",
        vulnerability: v >= 4 ? "Exposed: blockades and invasions are likely; defence matters." : v <= 2 ? "Well protected by geography or alliances." : "Moderately exposed.",
        identity: v >= 4 ? "A proud people: outside interference and cultural threats provoke fierce backlash." : v <= 2 ? "Cosmopolitan and flexible." : "A distinct but open culture."
    };
    return lines[k];
}

// ── Mechanical hooks (called from the simulation) ─────────────────

const taxBaseMultiplier = () => 0.5 + attr("wealth") * 0.2;                  // 0.7 … 1.5
const aidSensitivity = () => (6 - attr("wealth")) / 3;                        // poorer worlds feel Republic aid more
const unrestBaseline = () => (3 - attr("stability")) * 6;
const oppositionBonus = () => (3 - attr("stability")) * 2.5;
const separatismPush = () => (3 - attr("stability")) * 3 + (attr("identity") - 3) * 2;
const attackMultiplier = () => attr("vulnerability") / 3 + (attr("resources") - 3) * 0.08;
const identityMultiplier = () => attr("identity") / 3;

function tickAttributes() {
    const w = attr("wealth"), s = attr("stability"), v = attr("vulnerability"), c = attr("identity");
    // Economic shocks hit poor worlds hardest.
    if (chance(2 * (6 - w) / 3)) {
        const hit = rnd(1, 2.5) * (6 - w);
        report("📉 Economic shock", `${pick(["A major shipper goes bankrupt", "Commodity prices collapse", "A credit squeeze hits local lenders", "A key export market closes"])}. ${w <= 2 ? "With little to cushion it, the blow lands hard." : "The economy absorbs most of it."}`, applyEffects({ p: { employment: -hit }, g: { workers: -hit / 2, business: -hit / 3 } }));
    }
    // Unstable worlds: protests, coups.
    if (s <= 2 && chance(4 * (3 - s)) && !G.inbox.some(d => d.id === "street_protest")) addDossier("street_protest", {});
    if (s <= 1 && KIND_INFO[G.office.kind].legit && G.legitimacy < 40 && chance(4) && !G.scenes.some(x => x.type === "challenge")) pushScene("challenge", {});
    // Vulnerable worlds feel the pull toward Republic protection.
    if (v >= 4 && G.war && G.allegiance === "republic" && chance(3) && !G.inbox.some(d => d.id === "garrison_offer")) addDossier("garrison_offer", {});
    // Strong identities build local movements.
    G.indep = clamp(G.indep + (c - 3) * 0.05);
    // Exposed worlds want defence.
    if (G.groups.military && G.groups.military.w > 0) G.groups.military.a = clamp(G.groups.military.a + (v - 3) * 0.1 - (G.policies.defence_force.level - 0.4) * 0.2 * (v - 3), 2, 98);
}

// Policies and bills that feel like outside interference or cultural threats.
const CULTURAL_THREATS = { migration: 1, surveillance: 0.5, censorship: 0.5, martial_law: 0.5 };
function identityBacklash(e) {
    const c = attr("identity");
    if (c < 4) return e;
    const f = e.f || {};
    if ((f.centralists || 0) > 0 || (f.independence || 0) < 0) {
        const k = (c - 3) * 1.5;
        e.g = Object.assign({}, e.g, { traditional: ((e.g || {}).traditional || 0) - k, rural: ((e.g || {}).rural || 0) - k * 0.5 });
        e.indep = (e.indep || 0) + k * 0.5;
    }
    return e;
}


// ── Signature mechanics of particular worlds ──────────────────────

function initSpecial() {
    const sp = world().special;
    if (sp === "assembly") G.assembly = 55;
    if (sp === "finance") { G.lendingRate = 5; G.leverage = 35; }
    if (sp === "secrecy") { G.intel = 30; G.plots = [{ faction: "Separatist sympathisers in the military", progress: ri(10, 30) }, { faction: "Pro-Republic technocrats", progress: ri(5, 20) }]; }
    if (sp === "survival") G.food = 50;
    if (sp === "corporate") G.corpPower = 60;
}

function tickSpecial() {
    const sp = world().special;
    if (!sp) return;
    if (sp === "assembly") {
        // The Pantoran Assembly: coalitions shift with approval and faction standing.
        const standing = (G.factions.federalists + G.factions.reformers + G.factions.centralists + G.factions.corporatists) / 4;
        const target = 35 + approval() * 0.4 + standing * 0.2 + attr("stability") * 2;
        G.assembly = clamp(G.assembly + (target - G.assembly) * 0.08 + rnd(-2, 2));
        if (G.office.kind === "executive" && G.assembly < 35 && chance(10 + (5 - attr("stability")) * 3) && !G.scenes.some(x => x.type === "no_confidence")) {
            report("Coalition crisis", "Your Assembly coalition is collapsing. A confidence vote is coming.");
            pushScene("no_confidence", {});
        }
    }
    if (sp === "finance") {
        // Scipio: cheap credit builds leverage; leverage builds crises.
        G.leverage = clamp(G.leverage + (5 - G.lendingRate) * 0.8 + (G.policies.corporate_tax.level < 0.2 ? 0.3 : 0) - 0.3);
        if (G.leverage > 80 && chance((G.leverage - 75) * 0.8)) financialCrisis();
    }
    if (sp === "secrecy") {
        // Umbara: plots advance in the dark.
        G.intel = clamp(G.intel - 0.6);
        G.plots.forEach(p => { p.progress = clamp(p.progress + rnd(0.5, 2.5) + (G.opinion.sep > 40 && /Separatist/.test(p.faction) ? 1 : 0)); });
        const ripe = G.plots.find(p => p.progress >= 100);
        if (ripe) {
            ripe.progress = 10;
            if (/Separatist/.test(ripe.faction) && G.allegiance === "republic" && G.era !== "republic") {
                report("🕶️ A plot you never saw", "Military officers have secretly opened the planetary defences to the Separatists.");
                changeAllegiance("separatist", "after a secret deal struck by military officers");
            } else {
                report("🕶️ A plot you never saw", `${ripe.faction} have quietly taken control of a ministry. You learn of it from the newsfeeds.`, applyEffects({ legitimacy: -10, influence: -5, i: { civil: -8 } }));
            }
        }
    }
    if (sp === "survival") {
        // Rodia: food security is legitimacy.
        let d = -1.2 - (G.gal.war > 60 ? 1 : 0) - (G.siege && G.siege.blockade ? 3 : 0) + G.policies.rural_power.eff * 1.5 + G.policies.subsidies.eff * 0.8 + (G.aidMonths > 0 ? 2.5 : 0);
        G.food = clamp(G.food + d);
        if (G.food < 35) {
            const k = (35 - G.food) / 10;
            applyEffects({ legitimacy: -k, unrest: k * 1.5, g: { rural: -k, workers: -k, elders: -k }, trust: -k * 0.5 });
            G.opinion.sep = clamp(G.opinion.sep + k * 0.6);
            if (chance(8) && !G.inbox.some(x => x.id === "separatist_food")) addDossier("separatist_food", {});
        }
    }
    if (sp === "corporate") {
        // Cato Neimoidia: trade wealth becomes corporate power.
        G.corpPower = clamp(G.corpPower + (G.gal.trade - 50) * 0.03 + (G.factions.corporatists - 20) * 0.01 - 0.2);
        G.treasury = clamp(G.treasury + (G.gal.trade - 45) * 0.02, -80, 999);
        if (G.corpPower > 75 && chance(6) && !G.inbox.some(x => x.id === "corporate_draft")) addDossier("corporate_draft", {});
    }
}

function financialCrisis() {
    G.leverage = 40;
    Object.entries(G.galaxy).forEach(([k, s]) => { s.prosperity = clamp(s.prosperity - 6); });
    report("💥 Galactic credit crunch", "A wave of defaults spreads out from Scipio's vaults. Trade seizes up across the galaxy.", applyEffects({ gal: { trade: -12, diplomacy: -3 }, p: { employment: -6 }, g: { business: -8, elites: -6, workers: -4 }, treasury: -4 }));
    G.repCorruption = clamp(G.repCorruption + 4);
}

function specialPowers() {
    const sp = world().special;
    if (!sp) return "";
    const k = G.office.kind;
    const inGov = governing() || ["council", "executive", "senator", "local"].includes(k);
    if (!inGov) return "";
    const b = (t, label, cost, note = "") => tact("special", label, cost, note, `data-t="${t}"`);
    if (sp === "assembly") return panel("🏛️ The Pantoran Assembly", `${statRow("Coalition support", `${Math.round(G.assembly)}%`, G.assembly, G.assembly >= 50 ? "good" : "bad")}
        <p class="muted small">Below 35% a Chairman faces a confidence vote. Your bills in the Assembly gain or lose momentum with the coalition.</p>
        <select id="partnerSel">${["federalists", "reformers", "centralists", "corporatists", "traditionalists"].map(f => `<option value="${f}">${FACTIONS[f].name}</option>`).join("")}</select>
        ${b("partner", "Negotiate with a coalition partner", 4, "Concessions buy votes.")}${b("whip", "Whip the Assembly", 3)}`);
    if (sp === "finance") return panel("🏦 The Vaults of Scipio", `${statRow("Galactic lending rate", `${G.lendingRate}%`)}${statRow("System leverage", Math.round(G.leverage), G.leverage, "bad")}
        <p class="muted small">Cheap credit booms the galaxy and builds leverage; above 80 a crisis can spread to every world.</p>
        ${b("rate_up", "Raise lending rates", 4, "Cools the galaxy, protects the banks.")}${b("rate_down", "Lower lending rates", 4, "Booms trade everywhere. Leverage builds.")}
        ${b("war_loans", "Extend war loans to the Republic", 4, "Profits and influence — tied to the war.")}${b("sep_loans", "Quietly lend to the Separatists", 4, "Enormous profits. Enormous risk.")}
        ${b("regulate", "Regulate the banks", 5, "Lower leverage; the financial sector will fight back.")}${b("bailout", "Bail out a failing bank", 4, "Costs the treasury; calms markets.")}`);
    if (sp === "secrecy") return panel("🕶️ The Shadow Ministries", `${statRow("Your intelligence network", Math.round(G.intel), G.intel, "good")}
        ${G.intel >= 60 ? `<h4>Intelligence reports</h4>${G.plots.map(p => `<div class="statrow"><span>${esc(p.faction)}</span><b class="c-against">${Math.round(p.progress)}%</b></div>`).join("")}` : `<p class="muted small">Your network is too thin to see what is moving inside your own government.</p>`}
        ${b("intel", "Expand the intelligence network", 4)}${b("purge", "Purge a suspected faction", 5, "Plots set back; liberties and trust suffer.")}${b("disinfo", "Feed disinformation to rivals", 3)}`);
    if (sp === "survival") return panel("🌾 Feeding Rodia", `${statRow("Food security", Math.round(G.food), G.food, G.food >= 40 ? "good" : "bad")}
        <p class="muted small">A government that cannot feed its people loses legitimacy fast — and the Separatists are offering food.</p>
        ${b("food_aid", "Request Republic food aid", 4)}${b("hunt", "Organise hunting guild expeditions", 3)}${b("rationing", "Introduce rationing", 3, "Fair, unpopular.")}`);
    if (sp === "corporate") return panel("💰 The Merchant Houses", `${statRow("Corporate power", Math.round(G.corpPower), G.corpPower, "bad")}
        <p class="muted small">Trade makes this world rich. When corporate power runs high, the merchant houses start writing your laws.</p>
        ${b("charter", "Grant a trade charter", 3, "Money and jobs; more corporate power.")}${b("commerce_tax", "Levy a commerce tax", 4)}${b("cartel", "Break up a merchant cartel", 6, "They will retaliate.")}${b("federation", "Invite Trade Federation investment", 3, "Vast sums — and Separatist ties.")}`);
    return "";
}

function specialAction(t) {
    const costs = { partner: 4, whip: 3, rate_up: 4, rate_down: 4, war_loans: 4, sep_loans: 4, regulate: 5, bailout: 4, intel: 4, purge: 5, disinfo: 3, food_aid: 4, hunt: 3, rationing: 3, charter: 3, commerce_tax: 4, cartel: 6, federation: 3 };
    if (!spendAP(costs[t] || 3)) return;
    let ch = [];
    switch (t) {
        case "partner": { const f = selVal("partnerSel"); G.assembly = clamp(G.assembly + 10); ch = applyEffects({ f: { [f]: 6 }, influence: -3 }); report("Coalition deal", `The ${FACTIONS[f].name} join your coalition — for a price.`, ch); break; }
        case "whip": G.assembly = clamp(G.assembly + 5); report("Whipping the Assembly", "Delegates are reminded who controls the committee chairs."); break;
        case "rate_up": G.lendingRate = Math.min(10, G.lendingRate + 1); G.leverage = clamp(G.leverage - 6); ch = applyEffects({ gal: { trade: -4 }, treasury: 2, g: { elites: 3, business: -2, workers: -3 } }); Object.values(G.galaxy).forEach(s => { s.prosperity = clamp(s.prosperity - 1.5); }); report("Rates raised", "Credit tightens across the galaxy.", ch); break;
        case "rate_down": G.lendingRate = Math.max(1, G.lendingRate - 1); ch = applyEffects({ gal: { trade: 5 }, g: { business: 3, workers: 2 } }); Object.values(G.galaxy).forEach(s => { s.prosperity = clamp(s.prosperity + 1.5); }); report("Rates cut", "Cheap credit floods the galaxy. Leverage builds in the vaults.", ch); break;
        case "war_loans": G.galTreasury += 10; G.repCorruption = clamp(G.repCorruption + 2); ch = applyEffects({ treasury: 3, f: { centralists: 3, militarists: 3, reformers: -2 }, influence: 3 }); report("War loans", "The Republic borrows — and owes Scipio.", ch); break;
        case "sep_loans": ch = applyEffects({ treasury: 5, secret: "Lent to the Separatists from Scipio's vaults", secretHeat: 15, f: { independence: 4 } }); report("Loans to the Confederacy", "The credits move through a dozen shell banks.", ch); break;
        case "regulate": G.leverage = clamp(G.leverage - 20); ch = applyEffects({ g: { elites: -6, business: -4, workers: 3 }, f: { corporatists: -6, reformers: 4 } }); report("Banks regulated", "Leverage falls. The financial houses begin to organise against you.", ch); addIssue(makeIssue("finance", { title: "Financial-sector backlash", text: "Banking profits are falling and the financial houses are funding a campaign against your regulations.", source: "consequence", kind: "consequence" })); break;
        case "bailout": G.leverage = clamp(G.leverage - 8); ch = applyEffects({ treasury: -4, g: { elites: 3, workers: -3 }, trust: -3 }); report("Bailout", "The bank survives. Taxpayers notice who paid.", ch); break;
        case "intel": G.intel = clamp(G.intel + 12); report("Network expanded", "New informants in every ministry."); break;
        case "purge": G.plots.forEach(p => { p.progress = clamp(p.progress - 25); }); G.liberties = clamp(G.liberties + 10); ch = applyEffects({ trust: -5, i: { civil: -5, military: -3 } }); report("Purge", "Suspected conspirators are removed. Some were guilty.", ch); break;
        case "disinfo": G.plots.forEach(p => { p.progress = clamp(p.progress - 8); }); report("Disinformation", "Your rivals chase shadows for a while."); break;
        case "food_aid": { const ok = chance(30 + G.influence * 0.4 + (G.allegiance === "republic" ? 15 : -40)); if (ok) { G.food = clamp(G.food + 30); G.aidMonths = 8; G.opinion.sep = clamp(G.opinion.sep - 8); report("Republic food aid", "Relief ships arrive. The Republic's flag flies over the food depots.", applyEffects({ legitimacy: 6 })); } else report("Aid refused", "The Senate says Rodia must wait. The Separatists do not make people wait."); break; }
        case "hunt": G.food = clamp(G.food + 8); ch = applyEffects({ g: { traditional: 3, rural: 2 } }); report("Hunting expeditions", "The guilds bring in food from the wild.", ch); break;
        case "rationing": G.food = clamp(G.food + 5); ch = applyEffects({ g: { workers: -2, elites: -3 }, unrest: -3, legitimacy: 2 }); report("Rationing", "Everyone gets less. Nobody starves.", ch); break;
        case "charter": G.corpPower = clamp(G.corpPower + 8); ch = applyEffects({ treasury: 3, p: { employment: 2 }, g: { business: 4 } }); report("Trade charter granted", "A merchant house gains exclusive rights.", ch); break;
        case "commerce_tax": G.corpPower = clamp(G.corpPower - 6); ch = applyEffects({ treasury: 4, g: { business: -4, elites: -3 }, f: { corporatists: -3 } }); report("Commerce tax", "The houses pay — and complain.", ch); break;
        case "cartel": G.corpPower = clamp(G.corpPower - 15); ch = applyEffects({ g: { business: -8, workers: 4 }, f: { corporatists: -8, reformers: 4 }, heat: chance(40) ? 8 : 0 }); report("Cartel broken", "A shipping cartel is dissolved. Its owners swear revenge.", ch); break;
        case "federation": G.corpPower = clamp(G.corpPower + 10); G.opinion.sep = clamp(G.opinion.sep + 6); ch = applyEffects({ treasury: 6, f: { corporatists: 4, centralists: -3 } }); report("Federation investment", "The Trade Federation pours money in. Its influence follows.", ch); break;
    }
    render();
}

// Dossiers used by the attribute and special systems.
Object.assign(EVENTS, {
    street_protest: { weight: 0, deadline: 2,
        build: () => ({ title: "Protests in the Streets", from: "Security services", topic: "the protests",
            text: `${world().name}'s fragile politics boil over: crowds fill the squares demanding the government's resignation.`,
            choices: [
                { label: "Negotiate with the protest leaders", ap: 3, e: { unrest: -10, trust: 3, g: { youth: 3 } }, msg: "Talks defuse the crisis — for now." },
                { label: "Wait it out", e: { unrest: 5, legitimacy: -3 }, msg: "The crowds grow." },
                { label: "Disperse them", e: { unrest: -6, rep: -5, g: { youth: -6, students: -5, elders: 2 }, i: { courts: -3 } }, msg: "The squares are cleared. The anger is not." }
            ], def: 1 }) },
    garrison_offer: { weight: 0, deadline: 2,
        build: () => ({ title: "The Republic Offers a Garrison", from: "Republic high command", topic: "Republic troops",
            text: `${world().name} is exposed. High command offers to station a clone garrison permanently — under Republic command.`,
            choices: [
                { label: "Accept the garrison", e: identityBacklash({ f: { centralists: 4, militarists: 3 }, g: { military: 3, elders: 2 } }), run: () => { G.garrison += 30; if (world().special === "secrecy") addIssue(makeIssue("sovereignty", { title: "Sovereignty debate", text: "Republic troops on Umbaran soil have split the shadow ministries. Many ask who really governs Umbara.", source: "event" })); }, msg: "Clone troopers take up positions. Not everyone is pleased to see them." },
                { label: "Decline politely", e: { f: { federalists: 3, centralists: -2 } }, msg: "You'll defend yourselves." }
            ], def: 1 }) },
    separatist_food: { weight: 0, deadline: 2,
        build: () => ({ title: "The Separatists Offer Food", from: "A Confederacy envoy", topic: "the food crisis",
            text: "“The Republic lets your children go hungry. The Confederacy will feed them — as friends.”",
            choices: [
                { label: "Accept the food", run: () => { G.food = clamp(G.food + 30); G.opinion.sep = clamp(G.opinion.sep + 15); const p = canonNpc("palpatine"); if (p) changeRel(p, -10); }, e: { f: { independence: 6, centralists: -6 } }, msg: "The ships unload. So does Separatist influence." },
                { label: "Refuse", e: { legitimacy: -4, f: { centralists: 3 } }, msg: "Your people go hungry a little longer." }
            ], def: 1 }) },
    corporate_draft: { weight: 0, deadline: 2,
        build: () => ({ title: "The Merchant Houses Have Written a Bill", from: "The merchant council", topic: "corporate power",
            text: "Lawyers from the merchant houses present you with a finished bill: tariff exemptions, shipping subsidies and a new limit on public audits. They expect you to introduce it.",
            choices: [
                { label: "Introduce it as written", e: { funds: 3, f: { corporatists: 6, reformers: -6 }, g: { business: 5, workers: -3 } }, run: () => { G.corpPower = clamp(G.corpPower + 6); createBill("merchant_act_" + monthsNow(), "player", { arena: arena() === "senate" ? "senate" : "local", title: "Commercial Competitiveness Act", desc: "Written by the merchant houses.", stance: { corporatists: 3, federalists: 1, reformers: -3, centralists: -1, militarists: 0, independence: 1, traditionalists: 0 }, g: { business: 5, elites: 4, workers: -3 }, p: { employment: 2, inequality: 3 } }); }, msg: "The bill goes in under your name." },
                { label: "Rewrite it with public protections", ap: 3, e: { f: { corporatists: -2, reformers: 3 }, rep: 3 }, msg: "The houses are displeased but accept a weaker version." },
                { label: "Refuse", e: { f: { corporatists: -5 }, opp: 3, rep: 4 }, run: () => { G.corpPower = clamp(G.corpPower - 4); }, msg: "The houses will fund your opponent." }
            ], def: 0 }) },
    upper_city: { weight: 0, deadline: 2,
        build: () => ({ title: "The Upper City Pushes Back", from: "Upper City Property Owners' League", topic: "redistribution",
            text: "Upper City landlords and commercial combines are threatening capital flight and a ward-by-ward campaign against your redistribution.",
            choices: [
                { label: "Push through anyway", e: { g: { workers: 4, youth: 3, elites: -6, business: -5 }, p: { employment: -2 }, opp: 3 }, msg: "The Lower City cheers. Capital starts to leave." },
                { label: "Offer a compromise", ap: 3, e: { g: { elites: 2, workers: -1 } }, msg: "A phased approach. Everyone is a little unhappy." },
                { label: "Back down", e: { g: { workers: -6, youth: -5, elites: 3 }, trust: -4 }, run: () => { ["min_wage", "dividend", "housing", "income_tax"].forEach(k => { G.policies[k].level = Math.max(0, G.policies[k].level - 0.2); }); }, msg: "The reforms are scaled back." }
            ], def: 0 }) }
});
