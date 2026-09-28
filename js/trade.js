// ── TRADE — goods, partners, agreements, and everything that goes wrong with them ──

const GOODS = {
    food: { name: "Food", icon: "🌾" }, water: { name: "Water", icon: "💧" }, fuel: { name: "Fuel & gas", icon: "⛽" },
    ore: { name: "Ore & metals", icon: "⛏️" }, ships: { name: "Starships", icon: "🚀" }, droids: { name: "Droids", icon: "🤖" },
    medicine: { name: "Medicine (bacta, kolto)", icon: "🧪" }, luxuries: { name: "Luxury goods", icon: "💎" }, arms: { name: "Arms", icon: "🔫" },
    timber: { name: "Timber", icon: "🌲" }, tech: { name: "Technology", icon: "💻" }, finance: { name: "Finance & banking", icon: "🏦" }, kyber: { name: "Kyber crystals", icon: "💠" }
};

const TRADE_PROFILE = {
    coruscant: [["finance", "tech", "luxuries"], ["food", "water", "fuel", "ore"]], alderaan: [["luxuries", "tech"], ["ore", "fuel"]],
    naboo: [["fuel", "food", "luxuries"], ["tech", "droids"]], corellia: [["ships", "arms", "droids"], ["ore", "food"]],
    chandrila: [["food", "luxuries"], ["tech", "ships"]], kuat: [["ships", "arms"], ["ore", "fuel", "food"]], fondor: [["ships", "arms"], ["ore", "fuel"]],
    moncala: [["ships", "food"], ["ore", "tech"]], mandalore: [["ore", "arms"], ["food", "tech"]], kashyyyk: [["timber", "luxuries"], ["tech", "droids"]],
    ryloth: [["luxuries", "ore"], ["food", "medicine"]], tatooine: [["droids"], ["water", "food", "medicine"]], ordmantell: [["luxuries", "finance"], ["food", "fuel"]],
    bespin: [["fuel"], ["food", "droids"]], geonosis: [["droids", "arms"], ["food", "water"]], kamino: [["tech", "medicine"], ["ore", "food"]],
    onderon: [["food", "timber"], ["arms", "tech"]], jedha: [["kyber"], ["food", "water"]], mustafar: [["ore"], ["food", "water", "droids"]],
    scarif: [["tech"], ["food", "fuel"]], sullust: [["ships", "droids"], ["food"]], dathomir: [["timber"], ["tech", "arms"]], hoth: [["water"], ["food", "fuel"]],
    manaan: [["medicine"], ["tech", "ore"]], cantonica: [["luxuries", "finance"], ["food", "water"]], pantora: [["food", "luxuries"], ["tech", "ships"]],
    taris: [["droids", "tech"], ["food", "water"]], scipio: [["finance", "luxuries"], ["food", "tech"]], umbara: [["arms", "tech"], ["food", "ore"]],
    rodia: [["luxuries"], ["food", "medicine"]], cato_neimoidia: [["finance", "food"], ["ore", "tech"]],
    kessel: [["luxuries"], ["food", "droids"]], muunilinst: [["finance"], ["food"]], lothal: [["food"], ["tech"]], felucia: [["medicine", "food"], ["tech"]],
    christophsis: [["luxuries"], ["food"]], utapau: [["ore"], ["tech"]], serenno: [["luxuries", "finance"], ["arms"]], skako: [["tech"], ["food"]]
};

function tradeProfile(k) {
    if (k === G.worldKey && G.sectors) {
        // Your own exports grow with the industries you build.
        const [ex0, im0] = baseProfile(k);
        const built = Object.keys(G.sectors).filter(s => G.sectors[s].str >= 40 || (G.firms || []).some(f => f.sector === s && f.open && !f.failed)).map(s => SECTOR_GOODS[s]);
        const ex = [...new Set(ex0.concat(built))];
        return [ex, im0.filter(g => !ex.includes(g))];
    }
    return baseProfile(k);
}

function baseProfile(k) {
    if (TRADE_PROFILE[k]) return TRADE_PROFILE[k];
    const r = (WORLDS[k] || BACKGROUND_WORLDS[k] || {}).region;
    return r === "core" ? [["tech", "finance"], ["food"]] : r === "mid" ? [["food", "ore"], ["ships", "tech"]] : [["ore", "food"], ["medicine", "tech"]];
}

function tradeMatch(a, b) {
    const [ea, ia] = tradeProfile(a), [eb, ib] = tradeProfile(b);
    return { sell: ea.filter(g => ib.includes(g)), buy: eb.filter(g => ia.includes(g)) };
}

const TRADE_TERMS = {
    tariff_cut: { name: "Mutual tariff cuts", note: "Much more trade. Domestic producers face competition." },
    exclusive:  { name: "Exclusive supply contract", note: "A premium price. Other partners resent it." },
    credit:     { name: "A credit line", note: "2B now; a thinner margin afterwards." },
    security:   { name: "A mutual security clause", note: "Their forces help defend you — and their wars become yours." }
};

// What imported goods do for the economy.
const IMPORT_FX = { food: { healthcare: 1, inequality: -1 }, water: { healthcare: 2 }, fuel: { infrastructure: 2 }, ore: { employment: 1 }, medicine: { healthcare: 3 },
    tech: { education: 1, employment: 1 }, droids: { infrastructure: 1 }, ships: { infrastructure: 1 }, arms: {}, timber: { housing: 1 }, luxuries: {}, finance: { employment: 1 }, kyber: {} };

function initTrade() {
    if (!G.trade) G.trade = { deals: [], missions: {}, terms: [] };
    return G.trade;
}

function tradeBlocked(k) {
    const s = G.galaxy[k];
    if (!s || s.destroyed) return "That world is gone.";
    if (k === G.worldKey) return "That's your own world.";
    const a = G.allegiance, b = s.align;
    if (G.war && ((a === "republic" && b === "separatist") || (a === "separatist" && b === "republic"))) return "Wartime law forbids trade with the enemy.";
    if (isEmpireEra() && ((a === "empire" && b === "rebel") || (a === "rebel" && b === "empire"))) return "The Imperial Trade Authority forbids it.";
    return null;
}

function dealValue(d) {
    const base = 0.07 * (d.sell.length * 1.2 + d.buy.length * 0.6);
    let m = 1;
    if (d.terms.includes("tariff_cut")) m += 0.4;
    if (d.terms.includes("exclusive")) m += 0.25;
    if (d.terms.includes("credit")) m -= 0.1;
    m -= (G.policies.tariffs ? G.policies.tariffs.level : 0) * (d.terms.includes("tariff_cut") ? 0.1 : 0.35);
    return Math.max(0.02, base * m * (0.7 + attr("wealth") * 0.1) * d.volume / 100);
}

function tradeIncome() {
    return (G.trade ? G.trade.deals : []).filter(d => d.status === "active").reduce((s, d) => s + dealValue(d), 0);
}

function acceptChance(k, terms) {
    const m = tradeMatch(G.worldKey, k);
    const sen = worldSenator(k);
    const T = initTrade();
    let p = 20 + (m.sell.length + m.buy.length) * 12 + (sen ? sen.rel * 0.3 : 0) + G.influence * 0.2 + ((G.galaxy[k].stability || 50) - 50) * 0.2;
    p -= (G.policies.tariffs ? G.policies.tariffs.level : 0) * (terms.includes("tariff_cut") ? 0 : 20);
    p -= Math.max(0, terms.length - 1) * 8;
    if (terms.includes("exclusive")) p -= 6;
    if (G.galaxy[k].align === G.allegiance) p += 10; else if (G.galaxy[k].align !== "neutral") p -= 15;
    if (T.missions[k] && monthsNow() - T.missions[k] < 12) p += 12;
    if (T.deals.some(d => d.world === k && d.status === "ended")) p -= 10;
    return Math.round(clamp(p, 3, 92));
}

function tradeMission(k) {
    const T = initTrade();
    if (tradeBlocked(k)) return toast("Not possible", tradeBlocked(k));
    if (G.funds < 0.5) return toast("Not enough funds", "A trade mission costs 0.5M credits.");
    if (!spendAP(3)) return;
    T.missions[k] = monthsNow();
    const sen = worldSenator(k); if (sen) changeRel(sen, 6, `Received a trade mission from ${world().name}.`);
    applyEffects({ funds: -0.5, world: { key: k, prosperity: 1 } });
    const m = tradeMatch(G.worldKey, k);
    report(`🚀 Trade mission to ${worldName(k)}`, `${m.sell.length ? `They want your ${m.sell.map(g => GOODS[g].name.toLowerCase()).join(" and ")}.` : "They don't need much of what you make."} ${m.buy.length ? `You could buy their ${m.buy.map(g => GOODS[g].name.toLowerCase()).join(" and ")}.` : ""} The door is open for a year.`);
    render();
}

function negotiateDeal(k) {
    const T = initTrade();
    if (tradeBlocked(k)) return toast("Not possible", tradeBlocked(k));
    if (T.deals.some(d => d.world === k && ["active", "proposed", "suspended"].includes(d.status))) return toast("Already trading", `You already have an agreement with ${worldName(k)}.`);
    const m = tradeMatch(G.worldKey, k);
    if (!m.sell.length && !m.buy.length) return toast("Nothing to trade", `${worldName(k)} doesn't need what you make, and makes nothing you need.`);
    if (!spendAP(4)) return;
    const terms = T.terms.slice();
    if (!chance(acceptChance(k, terms))) {
        const sen = worldSenator(k); if (sen) changeRel(sen, -2);
        report("Talks break down", `${worldName(k)}'s negotiators want better terms. Try a trade mission first — or ask for less.`);
        return render();
    }
    const deal = { id: `td${Date.now().toString(36)}`, world: k, sell: m.sell, buy: m.buy, terms, volume: 100, status: "proposed", since: monthsNow() };
    T.deals.push(deal);
    if (rulesByDecree()) { activateDeal(deal); return render(); }
    const st = { corporatists: 2, federalists: 1, reformers: 0, centralists: 0, militarists: 0, independence: 0, traditionalists: 0 };
    if (terms.includes("tariff_cut")) { st.corporatists += 1; st.traditionalists -= 1; }
    if (terms.includes("security")) { st.militarists += 1; st.independence -= 2; st.reformers -= 1; }
    if (G.galaxy[k].align !== G.allegiance) st.centralists -= 1;
    const g = { business: 3 };
    if (terms.includes("tariff_cut")) { g.farmers = -2; g.workers = -1; }
    const b = createBill(`treaty_${deal.id}`, "player", { arena: "local", title: `${world().name}–${worldName(k)} Trade Agreement`, desc: `Sell: ${m.sell.map(x => GOODS[x].name).join(", ") || "—"}. Buy: ${m.buy.map(x => GOODS[x].name).join(", ") || "—"}. ${terms.map(t => TRADE_TERMS[t].name).join(", ") || "Standard terms"}.`, stance: st, g });
    b.tradeBill = true; b.dealId = deal.id; b.voteIn = 3;
    report("🤝 Agreement reached", `${worldName(k)} accepts. The treaty now needs ratification by the ${arenaName("local")} — the vote is in three months.`);
    render();
}

function activateDeal(deal) {
    deal.status = "active"; deal.since = monthsNow();
    deal.sell.forEach(() => { G.base.employment += 1.5; });
    deal.buy.forEach(g => Object.entries(IMPORT_FX[g] || {}).forEach(([k, v]) => { G.base[k] += v; }));
    if (deal.buy.includes("food") && G.food != null) G.food = clamp(G.food + 15);
    if (deal.terms.includes("credit")) applyEffects({ treasury: 2 });
    if (deal.terms.includes("security")) G.garrison += 8;
    if (deal.terms.includes("tariff_cut")) applyEffects({ g: { farmers: -2, workers: -1, business: 3 } });
    if (deal.terms.includes("exclusive")) initTrade().deals.filter(d => d !== deal && d.status === "active").forEach(d => { d.volume = Math.max(30, d.volume - 10); });
    const sen = worldSenator(deal.world); if (sen) changeRel(sen, 8, `Signed a trade agreement with ${world().name}.`);
    applyEffects({ world: { key: deal.world, prosperity: 4 }, gal: { trade: 1 } });
    G.record.agreements.push(`${world().name}–${worldName(deal.world)} Trade Agreement (${eraYear(currentBBY())})`);
    report(`🤝 Trade agreement in force: ${worldName(deal.world)}`, `Worth about ${(dealValue(deal) * 12).toFixed(1)}B a year to the treasury, plus jobs.`);
}

function endDeal(deal, why) {
    if (deal.status === "active") {
        deal.sell.forEach(() => { G.base.employment -= 1.5; });
        deal.buy.forEach(g => Object.entries(IMPORT_FX[g] || {}).forEach(([k, v]) => { G.base[k] -= v; }));
    }
    deal.status = "ended";
    if (why) report(`Trade agreement ended: ${worldName(deal.world)}`, why);
}

function cancelDeal(id) {
    const d = initTrade().deals.find(x => x.id === id);
    if (!d || !spendAP(2)) return;
    const sen = worldSenator(d.world); if (sen) changeRel(sen, -12, `${world().name} tore up its trade agreement.`);
    endDeal(d, `You withdraw from the agreement with ${worldName(d.world)}. Their government is not pleased.`);
    render();
}

function tradeRatified(b) { const d = initTrade().deals.find(x => x.id === b.dealId); if (d) activateDeal(d); }
function tradeRejected(b) { const d = initTrade().deals.find(x => x.id === b.dealId); if (d) { d.status = "ended"; report("Treaty rejected", `The legislature refuses to ratify the agreement with ${worldName(d.world)}.`); } }

function tickTrade() {
    const T = initTrade();
    T.deals.forEach(d => {
        if (d.status === "proposed" && !G.bills.some(b => b.dealId === d.id) && monthsNow() - d.since > 1 && !rulesByDecree()) d.status = "ended";
        if (!["active", "suspended"].includes(d.status)) return;
        const blocked = tradeBlocked(d.world);
        const blockade = G.siege && G.siege.blockade;
        if (blocked && d.status !== "ended") { endDeal(d, `${blocked} The agreement with ${worldName(d.world)} is void.`); return; }
        if (blockade || (G.galaxy[d.world] && G.galaxy[d.world].stability < 15)) { if (d.status === "active") { d.status = "suspended"; report("Trade suspended", `${blockade ? "The blockade" : `Chaos on ${worldName(d.world)}`} halts trade with ${worldName(d.world)}.`); } return; }
        if (d.status === "suspended") { d.status = "active"; report("Trade resumes", `Freighters are moving again between ${world().name} and ${worldName(d.world)}.`); }
        d.volume = clamp(d.volume + (100 - d.volume) * 0.05);
        // New industries at home mean more to sell under existing deals.
        const m = tradeMatch(G.worldKey, d.world);
        const added = m.sell.filter(g => !d.sell.includes(g));
        if (added.length) { d.sell = d.sell.concat(added); added.forEach(() => { G.base.employment += 1.5; }); report(`📦 More to sell to ${worldName(d.world)}`, `Your agreement now covers ${added.map(g => GOODS[g].name.toLowerCase()).join(" and ")} from your new industries.`); }
        if (d.terms.includes("security") && G.galaxy[d.world].stability < 35 && chance(5)) { G.garrison = Math.max(0, G.garrison - 6); report("Our treaty obligations", `${worldName(d.world)} is in trouble. Under the security clause, some of your forces are sent to help.`); }
    });
    const active = T.deals.filter(d => d.status === "active");
    if (!active.length || G.scenes.length) return;
    const outer = active.filter(d => ((WORLDS[d.world] || BACKGROUND_WORLDS[d.world] || {}).region) === "outer");
    if (outer.length && chance(3)) pushScene("trade_pirates", { id: pick(outer).id });
    else if (chance(2)) pushScene("trade_dispute", { id: pick(active).id, good: pick(pick(active).sell.concat(pick(active).buy).length ? pick(active).sell.concat(pick(active).buy) : ["luxuries"]) });
}

Object.assign(SCENES, {
    trade_pirates: ctx => {
        const d = initTrade().deals.find(x => x.id === ctx.id);
        if (!d) return { tag: "", title: "", body: "", choices: [{ label: "Continue" }] };
        return { tag: "TRADE", title: "Pirates on the trade lane",
            body: `<p>${pick(["Weequay raiders", "A Hutt-backed pirate crew", "Nikto corsairs", "Deserters in stolen gunships"])} are hitting freighters on the route to ${esc(worldName(d.world))}. Insurers are refusing to cover the run.</p>`,
            choices: [
                { label: "Pay for armed escorts (1B)", go: () => { applyEffects({ treasury: -1 }); report("Escorts", "Convoys with gunship escorts. The raids stop."); } },
                { label: "Ask the Republic navy for help", go: () => { if (chance(G.allegiance === "republic" ? 50 : 15)) report("The navy answers", "A Republic frigate clears the lane."); else { d.volume = Math.max(20, d.volume - 30); report("No help comes", "Trade on the route falls by a third."); } } },
                { label: "Put up with it", go: () => { d.volume = Math.max(20, d.volume - 30); } }
            ] };
    },
    trade_dispute: ctx => {
        const d = initTrade().deals.find(x => x.id === ctx.id);
        if (!d) return { tag: "", title: "", body: "", choices: [{ label: "Continue" }] };
        const g = GOODS[ctx.good] || GOODS.luxuries;
        const sen = worldSenator(d.world);
        return { tag: "TRADE DISPUTE", title: `A quarrel with ${worldName(d.world)}`,
            body: `<p>${esc(worldName(d.world))} accuses ${esc(world().name)} of ${pick(["dumping cheap", "smuggling untaxed", "overcharging for", "breaking quality standards on"])} ${g.name.toLowerCase()}. Their government threatens to suspend the agreement.</p>`,
            choices: [
                { label: "Concede", hint: "The deal survives, a little less profitable.", go: () => { d.volume = Math.max(40, d.volume - 15); if (sen) changeRel(sen, 4); } },
                { label: "Retaliate with tariffs", hint: "Domestic producers cheer. Trade falls.", go: () => { d.volume = Math.max(20, d.volume - 35); if (sen) changeRel(sen, -10); applyEffects({ g: { farmers: 3, workers: 2, business: -2 }, f: { federalists: 2, corporatists: -2 } }); } },
                { label: "Take it to Republic arbitration", go: () => { if (chance(50 + G.influence * 0.3)) report("Arbitration", "The arbitrators rule in your favour."); else { d.volume = Math.max(30, d.volume - 25); report("Arbitration", "The arbitrators side with them. You must pay compensation.", applyEffects({ treasury: -0.8 })); } } }
            ] };
    }
});

function tradeView() {
    const T = initTrade();
    const gov = governing();
    const [ex, im] = tradeProfile(G.worldKey);
    const partners = Object.keys(G.galaxy).filter(k => k !== G.worldKey && !G.galaxy[k].destroyed).map(k => ({ k, m: tradeMatch(G.worldKey, k) })).sort((a, b) => (b.m.sell.length * 2 + b.m.buy.length) - (a.m.sell.length * 2 + a.m.buy.length) || worldName(a.k).localeCompare(worldName(b.k)));
    const sel = ui.tradeSel && G.galaxy[ui.tradeSel] ? ui.tradeSel : partners[0] && partners[0].k;
    const deals = T.deals.filter(d => ["active", "suspended", "proposed"].includes(d.status));
    const selM = sel ? tradeMatch(G.worldKey, sel) : null;
    const blocked = sel ? tradeBlocked(sel) : null;
    return `<div class="era-banner"><b>TRADE</b> · ${esc(world().name)} sells ${ex.map(g => `${GOODS[g].icon} ${GOODS[g].name}`).join(", ")} and needs ${im.map(g => `${GOODS[g].icon} ${GOODS[g].name}`).join(", ")}.</div>
        <div class="cols"><div class="col-main">
        ${panel("🤝 Trade agreements", deals.map(d => `<div class="pipe"><div class="statrow"><b>${esc(worldName(d.world))}</b><span class="small ${d.status === "active" ? "c-for" : "c-und"}">${d.status}${d.status === "active" ? ` · ${(dealValue(d) * 12).toFixed(1)}B/yr` : ""}</span></div>
            <p class="small">Sell ${d.sell.map(g => GOODS[g].icon).join(" ") || "—"} · Buy ${d.buy.map(g => GOODS[g].icon).join(" ") || "—"}${d.terms.length ? ` · ${d.terms.map(t => TRADE_TERMS[t].name).join(", ")}` : ""}</p>
            ${statRow("Volume", `${Math.round(d.volume)}%`, d.volume, "good")}
            ${gov && d.status === "active" ? `<button class="mini" data-act="tradecancel" data-id="${d.id}">Withdraw · 2</button>` : ""}</div>`).join("") || '<p class="muted small">No agreements yet.</p>')}
        ${gov && sel ? panel(`🚀 ${esc(worldName(sel))}`, `<p class="small">${G.galaxy[sel].align ? `Aligned with: ${esc(ALIGN_NAMES[G.galaxy[sel].align] || G.galaxy[sel].align)}. ` : ""}Stability ${Math.round(G.galaxy[sel].stability)}.</p>
            <p class="small">You could sell: <b>${selM.sell.map(g => GOODS[g].name).join(", ") || "nothing they need"}</b>. You could buy: <b>${selM.buy.map(g => GOODS[g].name).join(", ") || "nothing you need"}</b>.</p>
            ${blocked ? `<p class="c-against small">${esc(blocked)}</p>` : `<h4>Terms to ask for</h4><div class="provisions">${Object.entries(TRADE_TERMS).map(([k, t]) => `<label class="prov"><input type="checkbox" data-tt="${k}" ${T.terms.includes(k) ? "checked" : ""}> ${t.name} <span class="muted small">— ${t.note}</span></label>`).join("")}</div>
            <p class="small">Chance they accept: <b>${acceptChance(sel, T.terms)}%</b>${T.missions[sel] && monthsNow() - T.missions[sel] < 12 ? " (trade mission bonus)" : ""}</p>
            <div class="row">${tact("trademission", "Send a trade mission", 3, "0.5M credits. Improves your odds for a year.", `data-k="${sel}"`)}${tact("tradedeal", rulesByDecree() ? "Negotiate and sign" : "Negotiate an agreement", 4, rulesByDecree() ? "" : "Then the legislature must ratify it.", `data-k="${sel}"`)}</div>`}`) : ""}
        ${!gov ? '<p class="muted">Only the planetary government negotiates trade agreements.</p>' : ""}
        </div><div class="col-side">${panel("Best trading partners", partners.map(({ k, m }) => `<button class="law ${k === sel ? "on" : ""}" data-act="tradesel" data-k="${k}"><span>${esc(worldName(k))}</span><span class="small">${m.sell.map(g => GOODS[g].icon).join("")}${m.buy.length ? " ⇄ " + m.buy.map(g => GOODS[g].icon).join("") : ""}${tradeBlocked(k) ? " ⛔" : ""}</span></button>`).join(""))}
        ${statRow("Trade income", `${(tradeIncome() * 12).toFixed(1)}B/yr`)}</div></div>`;
}
