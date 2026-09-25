// ── INTERFACE ───────────────────────────────────────────────────────

let view = "office";
let ui = { bill: null, policy: null, stat: null, web: "planet", worldSel: null, npcOpen: null, logFilter: "all", setupWorld: null };

const $ = sel => document.querySelector(sel);

const VIEWS = [
    { key: "office",     icon: "🗂️", name: "Office" },
    { key: "powers",     icon: "⭐", name: "Powers" },
    { key: "chamber",    icon: "🏛️", name: "Chamber" },
    { key: "government", icon: "🕸️", name: "Policy" },
    { key: "public",     icon: "📊", name: "Public" },
    { key: "campaign",   icon: "🗳️", name: "Campaign" },
    { key: "galaxy",     icon: "🌌", name: "Galaxy" },
    { key: "network",    icon: "🤝", name: "Network" },
    { key: "charter",    icon: "⚖️", name: "Charter" },
    { key: "archive",    icon: "📜", name: "Archive" }
];

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id === id));
    window.scrollTo(0, 0);
}

function render() {
    if (!G) return;
    renderHud();
    renderDock();
    document.body.dataset.lens = lens();
    const fn = { powers: viewPowers, office: viewOffice, chamber: viewChamber, government: viewGovernment, public: viewPublic, campaign: viewCampaign, galaxy: viewGalaxy, network: viewNetwork, charter: viewCharter, archive: viewArchive }[view];
    $("#view").innerHTML = fn();
    renderScene();
}

function panel(title, body, cls = "") {
    return `<section class="panel ${cls}">${title ? `<h3>${title}</h3>` : ""}${body}</section>`;
}

function statRow(label, value, pctv, cls = "") {
    return `<div class="statrow"><span>${label}</span><b>${value}</b></div>${pctv != null ? bar(pctv, cls) : ""}`;
}

function effectHints(e) {
    if (!e) return "";
    const out = [];
    Object.entries(e.g || {}).forEach(([k, v]) => { if (G.groups[k] && G.groups[k].w > 0) out.push([GROUPS[k].icon + " " + GROUPS[k].name, v]); });
    Object.entries(e.p || {}).forEach(([k, v]) => out.push([PLANET_STATS[k].icon + " " + PLANET_STATS[k].name, PLANET_STATS[k].bad ? -v : v]));
    Object.entries(e.f || {}).forEach(([k, v]) => out.push([FACTIONS[k].icon + " " + FACTIONS[k].name, v]));
    Object.entries(e.gal || {}).forEach(([k, v]) => out.push([GAL_STATS[k].icon + " " + GAL_STATS[k].name, GAL_STATS[k].bad ? -v : v]));
    Object.entries(e.i || {}).forEach(([k, v]) => out.push([INSTITUTIONS[k].icon + " " + INSTITUTIONS[k].name, v]));
    ["trust", "rep", "influence", "funds", "treasury", "legitimacy", "indep"].forEach(k => { if (e[k]) out.push([SCALARS[k].name, e[k]]); });
    ["heat", "unrest", "opp"].forEach(k => { if (e[k]) out.push([SCALARS[k].name, -e[k]]); });
    if (e.clans) out.push(["⚔️ Clans", typeof e.clans === "number" ? e.clans : 1]);
    if (e.secret) out.push(["🤫 Creates a secret", -1]);
    if (e.program) out.push(["📐 Long-term programme", 1]);
    return out.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 5).map(([l, v]) => `<span class="hint ${v > 0 ? "up" : "down"}">${esc(l)} ${v > 0 ? "▲" : "▼"}</span>`).join("");
}


// ── HUD & dock ────────────────────────────────────────────────────

function renderHud() {
    const o = G.office;
    const cap = capitalCap();
    const gov = governing();
    $("#hud").innerHTML = `
        <div class="hud-id">
            <div class="hud-portrait">${renderPortrait(G.app, 46)}</div>
            <div>
                <div class="hud-name">${esc(G.name)}</div>
                <div class="hud-office">${esc(o.title)} · ${esc(world().name)} · <span class="gen">GEN ${G.generation}</span>${G.autocrat ? ' · <span class="c-against">RULING WITHOUT MANDATE</span>' : ""}</div>
                <div class="hud-office"><span style="color:${ALIGN_COLORS[G.allegiance]}">● ${ALIGN_NAMES[G.allegiance]}</span>${G.siege ? ' · <span class="c-against">⚔️ UNDER ATTACK</span>' : ""}${G.occupied ? ' · <span class="c-against">🏴 OCCUPIED</span>' : ""}</div>
            </div>
        </div>
        <div class="hud-stats">
            <div class="hs"><span>Approval</span><b class="${approval() >= 50 ? "c-for" : "c-against"}">${Math.round(approval())}%</b></div>
            <div class="hs"><span>Trust</span><b>${Math.round(G.trust)}</b></div>
            <div class="hs"><span>Influence</span><b>${Math.round(G.influence)}</b></div>
            <div class="hs capital"><span>Capital</span><b>${Math.floor(G.ap)}<small>/${cap}</small></b><div class="capbar"><i style="width:${G.ap / cap * 100}%"></i></div></div>
            <div class="hs"><span>Funds</span><b>${G.funds.toFixed(1)}<small>M</small></b></div>
            ${gov ? `<div class="hs"><span>Treasury</span><b class="${G.treasury < 0 ? "c-against" : ""}">${G.treasury.toFixed(1)}<small>B</small></b></div>` : ""}
            ${KIND_INFO[o.kind].legit ? `<div class="hs"><span>Legitimacy</span><b>${Math.round(G.legitimacy)}</b></div>` : ""}
        </div>
        <div class="hud-time">
            <div class="date">${dateStr()}</div>
            <div class="term">${esc(ERAS[G.era].name)}</div>
            <div class="term">${o.termLeft != null ? `Term: ${termLeftLabel()}` : KIND_INFO[o.kind].label}</div>
            <button id="endMonth" class="primary" ${G.scenes.length ? "disabled" : ""}>End Month ▸</button>
        </div>`;
}

function renderDock() {
    const inbox = G.inbox.length;
    const pw = { senate: "🏛️", executive: "🏢", court: "👑", chancellery: "🎖️", city: "🏙️", movement: "✊", command: "🛡️", underground: "✊" }[lens()];
    $("#dock").innerHTML = VIEWS.map(v => `<button class="dock-btn ${view === v.key ? "active" : ""}" data-act="view" data-v="${v.key}"><span class="di">${v.key === "powers" ? pw : v.icon}</span><span>${v.key === "powers" ? roleSchema().label : v.name}</span>${v.key === "office" && inbox ? `<em class="badge">${inbox}</em>` : ""}</button>`).join("");
}


// ── Office ────────────────────────────────────────────────────────

function advisories() {
    const out = [];
    const cos = G.chiefOfStaff;
    const o = G.office;
    activeBills().forEach(b => {
        const und = arenaNpcs(b.arena).filter(n => (b.npcPos[n.id] || "undecided") === "undecided").length;
        if (b.voteIn <= 1 && und) out.push(`“${und} undecided delegation${und > 1 ? "s are" : " is"} waiting to hear from you on Bill ${b.num}, ${b.title}.”`);
        if (!b.playerVote && b.voteIn <= 2) out.push(`“You haven't taken a position on ${b.title}. The vote is in ${b.voteIn} month${b.voteIn > 1 ? "s" : ""}.”`);
    });
    if (isElected() && o.termLimit > 0 && o.termsServed + 1 >= o.termLimit && o.termLeft <= 18) out.push(`“This is your final term. It ends in ${termLeftLabel()} — unless the constitution changes.”`);
    if (o.termLeft != null && o.termLeft <= 6 && (isElected() || KIND_INFO[o.kind].candidate)) out.push(`“The election is in ${termLeftLabel()}. We're polling at ${Math.round(projectedShare())}%.”`);
    const worst = groupEntries().filter(([, g]) => g.w >= 1).sort((a, b) => a[1].a - b[1].a)[0];
    if (worst && worst[1].a < 35) out.push(`“We're losing ${GROUPS[worst[0]].name.toLowerCase()} — down to ${Math.round(worst[1].a)}%.”`);
    if (G.heat > 25) out.push("“Journalists are sniffing around. Something is going to come out.”");
    if (G.treasury < 0 && governing()) out.push(`“The treasury is in deficit (${G.treasury.toFixed(1)}B). Interest is eating the budget.”`);
    if (KIND_INFO[o.kind].legit && G.legitimacy < 35) out.push(`“Your legitimacy is dangerously low (${Math.round(G.legitimacy)}). A challenge is coming.”`);
    G.obligations.filter(x => !x.done && G.bills.some(b => b.key === x.billKey)).forEach(x => out.push(`“${x.donor} is watching how you vote on the ${BILLS[x.billKey].title}.”`));
    G.promises.filter(p => p.type === "trade" && G.bills.some(b => b.key === p.billKey)).forEach(p => { const n = npc(p.npcId); if (n) out.push(`“You promised ${n.name} your vote on the ${BILLS[p.billKey].title}.”`); });
    if (G.ap >= capitalCap() - 2) out.push("“Your political capital is maxed out. Spend it or lose it.”");
    if (!out.length) out.push("“Quiet month. Enjoy it — it won't last.”");
    return out.slice(0, 6).map(t => `<div class="advice"><b>${esc(cos)}</b>${esc(t)}</div>`).join("");
}

function dossierCard(d) {
    const ev = EVENTS[d.id];
    const b = ev.build(G, d.ctx);
    return `<article class="dossier ${d.deadline <= 1 ? "urgent" : ""}">
        <header><span class="from">${esc(b.from || "")}</span><span class="deadline">${d.deadline <= 1 ? "⚠ DECIDE THIS MONTH" : `${d.deadline} months to respond`}</span></header>
        <h4>${esc(b.title)}</h4>
        <p>${esc(b.text)}</p>
        <div class="choices">${b.choices.map((c, i) => `<button class="choice" data-act="dossier" data-uid="${d.uid}" data-i="${i}" ${c.ap && G.ap < c.ap ? "disabled" : ""}>
            <span class="cl">${esc(c.label)}${c.ap ? ` <em class="cost">${c.ap} capital</em>` : ""}</span>
            <span class="hints">${c.e ? effectHints(c.e) : ""}${c.run && !c.e ? '<span class="hint">❔ Uncertain</span>' : ""}</span>
        </button>`).join("")}</div>
    </article>`;
}

function viewOffice() {
    const o = G.office;
    const seeking = Object.keys(FACTIONS).filter(f => f !== G.ideology && G.factions[f] > -20 && G.factions[f] < 25).length;
    const brief = `
        <div class="brief">
            <div class="brief-title">${esc(o.title)}${o.kind === "senator" ? ` for ${esc(world().name)}` : ""}</div>
            <ul>
                ${o.termLeft != null ? `<li>${termLeftLabel()} left ${KIND_INFO[o.kind].candidate ? "until the election" : "in your term"}${o.termLimit ? ` · term ${o.termsServed + 1} of ${o.termLimit}` : ""}</li>` : `<li>${KIND_INFO[o.kind].label}</li>`}
                <li>${allies().length} political allies · ${rivals().length} political rivals</li>
                <li>${Math.round(approval())}% approval on ${esc(world().name)}</li>
                <li>${influenceLabel()[0].toUpperCase() + influenceLabel().slice(1)} influence${arena() === "senate" ? " in the Senate" : ""}</li>
                <li>${seeking} faction${seeking === 1 ? "" : "s"} trying to get your support</li>
                <li>Planetary opinion: ${Math.round(G.opinion.loyal)}% loyalist · ${Math.round(G.opinion.sep)}% separatist</li>
            </ul>
            <p class="muted small">${esc(o.desc || world().intro)}</p>
        </div>`;
    const sits = activeSituations();
    const inbox = G.inbox.length ? G.inbox.map(dossierCard).join("") : `<p class="muted">Your desk is clear. End the month to see what the galaxy sends you.</p>`;
    const reports = G.reports.slice(0, 6).map(r => `<div class="report"><span class="muted small">${r.date}</span><b>${esc(r.title)}</b><p>${esc(r.text)}</p>${changeChips(r.changes)}</div>`).join("") || `<p class="muted">Nothing yet.</p>`;
    const news = G.news.slice(0, 5).map(n => `<div class="headline ${n.good ? "good" : "bad"}"><b>${esc(n.outlet)}</b>${esc(n.text)}</div>`).join("") || `<p class="muted">The press hasn't noticed you yet.</p>`;
    return `
        <div class="cols">
            <div class="col-main">
                <div class="era-banner"><b>${esc(ERAS[G.era].name)}</b> · ${esc(ERAS[G.era].note)}</div>
                ${warPanel()}
                ${panel("📂 Dossiers", inbox, "inbox")}
            </div>
            <div class="col-side">
                ${panel("Situation", brief)}
                ${sits.length ? panel("Active situations", sits.map(s => `<span class="sit ${s.bad ? "bad" : "good"}">${s.icon} ${s.name}</span>`).join("")) : ""}
                ${panel("Chief of staff", advisories())}
                ${panel("📰 Headlines", news)}
                ${panel("Consequences", reports)}
            </div>
        </div>`;
}


// ── Chamber ───────────────────────────────────────────────────────

function hemicycle(t) {
    const total = t.for + t.against + t.und;
    const rows = total > 200 ? 9 : 5;
    const r0 = 70, r1 = 190;
    const radii = Array.from({ length: rows }, (_, i) => r0 + i * (r1 - r0) / (rows - 1));
    const rsum = radii.reduce((a, b) => a + b, 0);
    let counts = radii.map(r => Math.round(total * r / rsum));
    counts[rows - 1] += total - counts.reduce((a, b) => a + b, 0);
    const pts = [];
    radii.forEach((r, i) => {
        const n = counts[i];
        for (let j = 0; j < n; j++) {
            const a = Math.PI - (n === 1 ? Math.PI / 2 : j * Math.PI / (n - 1));
            pts.push({ x: 210 + r * Math.cos(a), y: 205 - r * Math.sin(a), a });
        }
    });
    pts.sort((p, q) => q.a - p.a);
    const dot = total > 200 ? 4.2 : 7;
    const circles = pts.map((p, i) => {
        const c = i < t.for ? "var(--for)" : i < t.for + t.und ? "var(--und)" : "var(--against)";
        return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${dot}" fill="${c}"/>`;
    }).join("");
    return `<svg class="hemicycle" viewBox="0 0 420 215" role="img" aria-label="Seats: ${t.for} for, ${t.und} undecided, ${t.against} against">${circles}<text x="210" y="200" text-anchor="middle" class="hc-total">${total}</text></svg>`;
}

function viewChamber() {
    const own = arena();
    const petitionOpen = G.bills.some(b => b.petition);
    if (!ui.arenaSel || (ui.arenaSel === "senate" && own !== "senate" && !petitionOpen)) ui.arenaSel = own;
    const a = own === "none" && petitionOpen ? "senate" : ui.arenaSel;
    const arenaTabs = own !== "senate" && petitionOpen ? `<div class="tabs"><button class="tab ${a === own ? "active" : ""}" data-act="arena" data-a="${own}">${esc(arenaName(own))}</button><button class="tab ${a === "senate" ? "active" : ""}" data-act="arena" data-a="senate">Galactic Senate — your petition</button></div>` : "";
    if (a === "none") {
        return panel("No seat, no vote", `<p>As ${esc(G.office.title)}, you have no place on any legislative floor. Follow the votes in the Archive, or run for office from the Policy view.</p>`);
    }
    const bills = activeBills(a);
    if (!ui.bill || !bills.some(b => b.id === ui.bill)) ui.bill = bills[0] ? bills[0].id : null;
    const b = bills.find(x => x.id === ui.bill);
    const clock = `${String(8 + (G.month * 7) % 11).padStart(2, "0")}:${String((G.year * 13 + G.month * 29) % 60).padStart(2, "0")}`;
    const header = `<div class="chamber-head"><span>${esc(arenaName(a).toUpperCase())} — ${clock}</span><span class="muted">${a === "senate" ? SENATE_SIZE : 100} seats</span></div>`;
    const tabs = bills.map(x => `<button class="tab ${x.id === ui.bill ? "active" : ""}" data-act="bill" data-id="${x.id}">Bill ${x.num}</button>`).join("");
    const introducible = Object.entries(BILLS).filter(([k, t]) => t.arena === a && !G.bills.some(x => x.key === k));
    const canIntroduce = a === "senate" ? ["senator", "chancellor"].includes(G.office.kind) : G.office.kind !== "outsider";
    const intro = canIntroduce ? panel("Introduce legislation", `<p class="muted small">Costs 6 capital and 6 influence. The vote comes in three months, and it goes on your record.</p>
        <div class="bill-list">${introducible.map(([k, t]) => `<button class="secondary" data-act="introduce" data-key="${k}"><b>${esc(t.title)}</b><span class="muted small">${esc(t.desc)}</span></button>`).join("")}</div>`) : "";
    const other = G.bills.filter(x => x.arena !== a).map(x => `<li>Bill ${x.num}: ${esc(x.title)} — vote in ${x.voteIn} mo</li>`).join("");

    if (!b) return arenaTabs + header + panel("The floor is quiet", `<p class="muted">No bills are pending. That rarely lasts.</p>`) + intro;

    const t = tally(b);
    const d = dir(b);
    const vote = b.playerVote;
    const pv = playerVotes(a);
    const stanceRows = Object.keys(FACTIONS).map(f => {
        const s = Math.round(b.stance[f] || 0);
        return `<span class="stance s${s}">${FACTIONS[f].icon} ${FACTIONS[f].name}: ${LEAN_WORDS[s]}</span>`;
    }).join("");
    const npcs = arenaNpcs(a).sort((x, y) => y.votes - x.votes || y.influence - x.influence);
    const rows = npcs.map(n => {
        const pos = b.npcPos[n.id] || "undecided";
        const debt = G.promises.some(p => p.npcId === n.id);
        return `<tr>
            <td><b>${esc(n.name)}</b><br><span class="muted small">${esc(n.title)}</span></td>
            <td class="small">${FACTIONS[n.faction].icon} ${FACTIONS[n.faction].name}<br><span class="muted">${n.votes} votes · lean: ${LEAN_WORDS[Math.round(b.stance[n.faction] || 0)]}</span></td>
            <td>${relBadge(n.rel)}${debt ? ' <span class="hint">owes/owed</span>' : ""}</td>
            <td class="pos-${pos}">${pos.toUpperCase()}</td>
            <td class="acts">
                <button class="mini" data-act="persuade" data-id="${n.id}" ${!d || G.ap < 3 ? "disabled" : ""} title="3 capital">Persuade</button>
                <button class="mini" data-act="favor" data-id="${n.id}" ${!d || G.ap < 3 ? "disabled" : ""} title="3 capital — they will collect later">Promise favour</button>
                <button class="mini" data-act="trade" data-id="${n.id}" ${!d || G.ap < 3 ? "disabled" : ""} title="3 capital — you must back their bill">Trade votes</button>
            </td></tr>`;
    }).join("");
    const w = v => `${(v / (t.for + t.against + t.und) * 100).toFixed(2)}%`;

    const chairKey = b.committeeKey;
    const stuckChair = b.stuck && npc(b.stuck);
    const committeeBox = chairKey ? `<p class="small">Committee: <b>${COMMITTEES[chairKey].name}</b>${G.committeeChairs[chairKey] === "player" ? " — you chair it." : ""}</p>
        ${stuckChair ? `<p class="c-against small">⛔ Bottled up in committee by ${esc(stuckChair.name)}. It won't reach the floor until released.</p><button class="tactic" data-act="lobbychair" ${G.ap < 3 ? "disabled" : ""}>Lobby the chair <em>3 capital</em></button>` : ""}
        ${G.committeeChairs[chairKey] === "player" ? `<button class="tactic" data-act="fasttrack" ${G.ap < 3 ? "disabled" : ""}>⏩ Fast-track to the floor <em>3 capital</em></button><button class="tactic" data-act="bury" ${G.ap < 4 ? "disabled" : ""}>🪦 Bury it in committee <em>4 capital</em><span>Kill it. Its supporters will remember.</span></button>` : ""}` : "";
    return `${arenaTabs}${header}<div class="tabs">${tabs}</div>
        <div class="cols">
            <div class="col-main">
                ${panel(`BILL ${b.num}: ${esc(b.title)}`, `
                    <p>${esc(b.desc)}${b.amended ? ' <span class="hint">amended</span>' : ""}${b.sponsor === "player" ? ' <span class="hint up">your bill</span>' : ""}</p>
                    ${hemicycle(t)}
                    <div class="tally-row"><b class="c-for">FOR ${t.for}</b><b class="c-und">UNDECIDED ${t.und}</b><b class="c-against">AGAINST ${t.against}</b></div>
                    <div class="tally-bar"><span style="width:${w(t.for)}"></span><span style="width:${w(t.und)}"></span><span style="width:${w(t.against)}"></span></div>
                    <p class="muted small">Vote in ${b.voteIn} month${b.voteIn === 1 ? "" : "s"} · momentum ${fmt(b.momentum)}${pv ? ` · your delegation: ${pv} votes` : ""}</p>
                    <div class="stances">${stanceRows}</div>
                    <h4>If it passes</h4><div class="hints">${effectHints({ g: billGroupEffects(b), p: b.fx.p, gal: b.fx.gal })}</div>
                `)}
                ${panel("Delegations", `<div class="table-wrap"><table class="deleg"><tr><th>Delegation</th><th>Faction</th><th>Relation</th><th>Position</th><th></th></tr>${rows}</table></div>`)}
            </div>
            <div class="col-side">
                ${panel("Your position", `
                    <div class="seg">
                        <button class="${vote === "for" ? "on for" : ""}" data-act="vote" data-v="for">For</button>
                        <button class="${!vote || vote === "abstain" ? "on" : ""}" data-act="vote" data-v="abstain">Abstain</button>
                        <button class="${vote === "against" ? "on against" : ""}" data-act="vote" data-v="against">Against</button>
                    </div>
                    <p class="muted small">${pv ? "Your vote counts on the floor." : "You don't vote here, but your whip operation does."} Your constituencies and factions will judge the position you take.</p>`)}
                ${committeeBox ? panel("Committee", committeeBox) : ""}
                ${panel("Floor tactics", `
                    <button class="tactic" data-act="speech" ${!d || G.ap < 4 ? "disabled" : ""}>🎙️ Give a speech <em>4 capital</em><span>Sway undecided blocs.</span></button>
                    <button class="tactic" data-act="amend" ${b.amended || G.ap < 5 ? "disabled" : ""}>✏️ Introduce an amendment <em>5 capital</em><span>Soften opposition — and the bill's effects.</span></button>
                    <button class="tactic" data-act="leak" ${!d || G.ap < 3 ? "disabled" : ""}>📨 Leak to journalists <em>3 capital</em><span>A big swing. Might be traced to you.</span></button>
                    <button class="tactic" data-act="committee" ${b.committee >= 2 || G.ap < 4 ? "disabled" : ""}>🗄️ Send to committee <em>4 capital</em><span>Delay 3 months. Looks evasive.</span></button>`)}
                ${other ? panel("Elsewhere", `<ul class="small">${other}</ul>`) : ""}
            </div>
        </div>${intro}`;
}

function relBadge(r) {
    const cls = r >= 35 ? "ally" : r <= -30 ? "rival" : "neutral";
    const label = r >= 35 ? "Ally" : r <= -30 ? "Rival" : "Neutral";
    return `<span class="rel ${cls}">${label} ${Math.round(r)}</span>`;
}


// ── Government: the policy web ────────────────────────────────────

function webLayout(defs, statDefs) {
    const W = 900, H = 640, cx = 450, cy = 330;
    const nodes = {};
    const sk = Object.keys(statDefs);
    sk.forEach((k, i) => {
        const a = -Math.PI / 2 + i * 2 * Math.PI / sk.length;
        nodes[`s:${k}`] = { x: cx + 120 * Math.cos(a), y: cy + 105 * Math.sin(a) };
    });
    const cats = Object.keys(POLICY_CATS);
    const pk = Object.keys(defs).sort((a, b) => cats.indexOf(defs[a].cat) - cats.indexOf(defs[b].cat));
    pk.forEach((k, i) => {
        const a = -Math.PI / 2 + (i + 0.5) * 2 * Math.PI / pk.length;
        nodes[`p:${k}`] = { x: cx + 380 * Math.cos(a), y: cy + 275 * Math.sin(a) };
    });
    return { W, H, cx, cy, nodes, pk, sk };
}

function renderWeb(defs, store, statDefs, values, sits) {
    const L = webLayout(defs, statDefs);
    const sel = ui.policy;
    const edges = [];
    const addEdges = (from, fx) => Object.entries(fx || {}).forEach(([s, v]) => {
        if (!L.nodes[`s:${s}`]) return;
        const bad = statDefs[s].bad;
        edges.push({ from, to: `s:${s}`, good: bad ? v < 0 : v > 0, w: Math.min(5, 1 + Math.abs(v) / 4) });
    });
    if (sel && sel.startsWith("p:")) addEdges(sel, defs[sel.slice(2)].fx);
    if (sel && sel.startsWith("s:")) L.pk.forEach(k => { const v = (defs[k].fx || {})[sel.slice(2)]; if (v && store[k].level > 0) addEdges(`p:${k}`, { [sel.slice(2)]: v }); });
    // Active situations sit on an inner ring near the stats they affect.
    sits.forEach((s, i) => {
        const a = Math.PI / 4 + i * 2 * Math.PI / Math.max(sits.length, 1);
        L.nodes[`x:${s.key}`] = { x: L.cx + 215 * Math.cos(a), y: L.cy + 175 * Math.sin(a) };
        if (sel === `x:${s.key}`) addEdges(`x:${s.key}`, s.fx);
    });
    const line = e => { const a = L.nodes[e.from], b = L.nodes[e.to]; return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${e.good ? "var(--for)" : "var(--against)"}" stroke-width="${e.w}" stroke-opacity=".75"/>`; };
    const pol = L.pk.map(k => {
        const n = L.nodes[`p:${k}`], p = store[k], d = defs[k], c = POLICY_CATS[d.cat].color;
        const on = p.level > 0;
        return `<g class="wn ${sel === `p:${k}` ? "sel" : ""}" data-act="webnode" data-node="p:${k}">
            <circle cx="${n.x}" cy="${n.y}" r="25" fill="${on ? c : "transparent"}" fill-opacity="${on ? 0.25 + p.eff * 0.6 : 0}" stroke="${c}" stroke-width="${on ? 2 : 1}" stroke-dasharray="${on ? "" : "3 3"}"/>
            <text x="${n.x}" y="${n.y + 6}" text-anchor="middle" class="wicon">${d.icon}</text>
            <text x="${n.x}" y="${n.y + 40}" text-anchor="middle" class="wlabel">${esc(d.name.length > 18 ? d.name.slice(0, 17) + "…" : d.name)}</text>
        </g>`;
    }).join("");
    const st = L.sk.map(k => {
        const n = L.nodes[`s:${k}`], v = values[k], bad = statDefs[k].bad;
        const good = bad ? 100 - v : v;
        const col = good >= 60 ? "var(--for)" : good >= 40 ? "var(--und)" : "var(--against)";
        return `<g class="wn ${sel === `s:${k}` ? "sel" : ""}" data-act="webnode" data-node="s:${k}">
            <circle cx="${n.x}" cy="${n.y}" r="31" fill="var(--bg2)" stroke="${col}" stroke-width="3"/>
            <text x="${n.x}" y="${n.y - 4}" text-anchor="middle" class="wicon small">${statDefs[k].icon}</text>
            <text x="${n.x}" y="${n.y + 14}" text-anchor="middle" class="wval">${Math.round(v)}</text>
            <text x="${n.x}" y="${n.y + 46}" text-anchor="middle" class="wlabel">${statDefs[k].name}</text>
        </g>`;
    }).join("");
    const sx = sits.map(s => {
        const n = L.nodes[`x:${s.key}`];
        return `<g class="wn ${sel === `x:${s.key}` ? "sel" : ""}" data-act="webnode" data-node="x:${s.key}">
            <rect x="${n.x - 22}" y="${n.y - 22}" width="44" height="44" rx="8" fill="${s.bad ? "rgba(230,80,90,.25)" : "rgba(80,200,130,.25)"}" stroke="${s.bad ? "var(--against)" : "var(--for)"}" stroke-width="2"/>
            <text x="${n.x}" y="${n.y + 7}" text-anchor="middle" class="wicon">${s.icon}</text>
            <text x="${n.x}" y="${n.y + 36}" text-anchor="middle" class="wlabel ${s.bad ? "c-against" : "c-for"}">${s.name}</text>
        </g>`;
    }).join("");
    return `<svg class="web" viewBox="0 0 ${L.W} ${L.H}">${edges.map(line).join("")}${pol}${sx}${st}</svg>`;
}

function policyPanel(k, galactic) {
    const defs = galactic ? GAL_POLICIES : POLICIES;
    const store = galactic ? G.galPolicies : G.policies;
    const d = defs[k], p = store[k];
    const canDecreeHere = galactic ? G.office.kind === "chancellor" : governing();
    const canBill = !galactic && arena() === "local" && G.office.kind !== "outsider";
    const fx = Object.entries(d.fx || {}).map(([s, v]) => {
        const sd = galactic ? GAL_STATS[s] : PLANET_STATS[s];
        const good = sd.bad ? v < 0 : v > 0;
        return `<span class="hint ${good ? "up" : "down"}">${sd.icon} ${sd.name} ${fmt(v)}</span>`;
    }).join("");
    const gx = Object.entries(d.g || {}).map(([g, v]) => G.groups[g] && G.groups[g].w > 0 ? `<span class="hint ${v > 0 ? "up" : "down"}">${GROUPS[g].icon} ${GROUPS[g].name} ${v > 0 ? "▲" : "▼"}</span>` : "").join("");
    const fxn = Object.entries(d.f || {}).map(([f, v]) => `<span class="hint ${v > 0 ? "up" : "down"}">${FACTIONS[f].icon} ${FACTIONS[f].name} ${v > 0 ? "▲" : "▼"}</span>`).join("");
    const lvl = Math.round(p.level * 100);
    return panel(`${d.icon} ${esc(d.name)}`, `
        <p class="muted small">${POLICY_CATS[d.cat].name} · ${d.cost < 0 ? `raises ${(-d.cost * p.level).toFixed(2)}B/month` : `costs ${(d.cost * p.level).toFixed(2)}B/month`} at current level</p>
        <div class="statrow"><span>Level</span><b>${levelWord(p.level)} (${lvl}%)</b></div>
        <div class="statrow"><span>Effect felt so far</span><b>${Math.round(p.eff * 100)}%</b></div>
        ${bar(p.eff * 100)}
        <h4>At full strength</h4><div class="hints">${fx || '<span class="muted small">No direct effect on values.</span>'}</div>
        ${gx ? `<h4>Voters</h4><div class="hints">${gx}</div>` : ""}
        <h4>Factions</h4><div class="hints">${fxn}</div>
        ${canDecreeHere || canBill ? `
            <label class="muted small">New level: <b id="slv">${lvl}%</b></label>
            <input type="range" min="0" max="100" step="10" value="${lvl}" id="policySlider" data-key="${k}">
            <div class="row">
                ${canDecreeHere ? `<button class="primary" data-act="setpolicy" data-key="${k}" data-gal="${galactic ? 1 : 0}">Enact <em id="pcost">—</em></button>` : ""}
                ${canBill ? `<button class="secondary" data-act="policybill" data-key="${k}">Send to legislature <em>4 capital</em></button>` : ""}
            </div>` : `<p class="muted small">You don't control this policy. ${galactic ? "Only the Supreme Chancellor sets galactic policy." : "The planetary government does — you can only lobby, campaign, or take its place."}</p>`}
    `);
}

function statPanel(k) {
    const sd = PLANET_STATS[k];
    const drivers = Object.entries(G.policies).map(([pk, p]) => [pk, (POLICIES[pk].fx[k] || 0) * p.eff]).filter(([, v]) => Math.abs(v) > 0.3).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    const who = Object.entries(GROUP_NEEDS).filter(([g, n]) => n[k] && G.groups[g].w > 0).map(([g]) => `${GROUPS[g].icon} ${GROUPS[g].name}`);
    return panel(`${sd.icon} ${sd.name}`, `
        ${statRow("Current", Math.round(G.planet[k]), G.planet[k], sd.bad ? "bad" : "good")}
        ${statRow("Heading toward", Math.round(statTarget(k)))}
        <h4>Driven by</h4><div class="hints">${drivers.map(([pk, v]) => `<span class="hint ${(sd.bad ? v < 0 : v > 0) ? "up" : "down"}">${POLICIES[pk].icon} ${POLICIES[pk].name} ${fmt(v)}</span>`).join("") || '<span class="muted small">Mostly the world itself.</span>'}</div>
        <h4>Who cares</h4><p class="small">${who.join(", ")}</p>`);
}

function viewGovernment() {
    const gal = ui.web === "galaxy";
    const sits = gal ? [] : activeSituations();
    const toggle = `<div class="tabs"><button class="tab ${!gal ? "active" : ""}" data-act="web" data-w="planet">🪐 ${esc(world().name)}</button><button class="tab ${gal ? "active" : ""}" data-act="web" data-w="galaxy">🌌 The Republic</button></div>`;
    const web = gal ? renderWeb(GAL_POLICIES, G.galPolicies, GAL_STATS, G.gal, []) : renderWeb(POLICIES, G.policies, PLANET_STATS, G.planet, sits);
    let side = "";
    const sel = ui.policy;
    if (sel && sel.startsWith("p:") && (gal ? GAL_POLICIES : POLICIES)[sel.slice(2)]) side = policyPanel(sel.slice(2), gal);
    else if (sel && sel.startsWith("s:") && !gal && PLANET_STATS[sel.slice(2)]) side = statPanel(sel.slice(2));
    else if (sel && sel.startsWith("x:")) {
        const s = SITUATIONS.find(x => `x:${x.key}` === sel);
        side = panel(`${s.icon} ${s.name}`, `<p>${s.bad ? "A crisis driven by conditions on the planet. It will persist until they change." : "A good situation. Enjoy it while it lasts."}</p><h4>Effects</h4><div class="hints">${effectHints({ p: s.fx, g: s.g })}</div>`);
    } else side = panel("How this works", `<p class="small">Click any <b>policy</b> (outer ring) to see what it does and change it. Click a <b>value</b> (centre) to see what drives it. Red boxes are <b>situations</b> — crises that push back on everything.</p><p class="small muted">Changes take months to be felt. Voters react to the announcement immediately.</p>`);

    const b = gal ? galBudget() : budget();
    const budgetPanel = panel(gal ? "Republic budget" : "Planetary budget", `
        ${statRow("Revenue", `${b.income.toFixed(2)}B/mo`)}
        ${statRow("Spending", `${b.spend.toFixed(2)}B/mo`)}
        ${!gal ? statRow("Debt interest", `${b.interest.toFixed(2)}B/mo`) : ""}
        ${statRow("Balance", `<span class="${b.net >= 0 ? "c-for" : "c-against"}">${fmt(b.net)}B/mo</span>`)}
        ${statRow("Treasury", `${(gal ? G.galTreasury : G.treasury).toFixed(1)}B`)}
        <p class="muted small">${gal ? (G.office.kind === "chancellor" ? "You set galactic policy." : `Set by Chancellor ${chancellor() ? esc(chancellor().name) : "—"}.`) : governing() ? "You are the government. Every policy is yours to answer for." : "Set by the planetary government. Voters blame it — not you — for its policies."}</p>`);
    return `${toggle}<div class="cols web-cols"><div class="col-main">${panel("", web, "webpanel")}</div><div class="col-side">${side}${budgetPanel}${rolePowers()}</div></div>`;
}

function rolePowers() {
    const k = G.office.kind;
    const btn = (act, label, cost, extra = "", note = "") => `<button class="tactic" data-act="${act}" ${extra} ${G.ap < cost ? "disabled" : ""}>${label} <em>${cost} capital</em>${note ? `<span>${note}</span>` : ""}</button>`;
    const groupSel = `<select id="groupSel">${groupEntries().map(([g]) => `<option value="${g}">${GROUPS[g].icon} ${GROUPS[g].name}</option>`).join("")}</select>`;
    let out = "";
    if (k === "senator") out = `<p class="small muted">Senators don't run the planet — use your Senate Desk to bring money home.</p>`;
    if (k === "clan") out = G.clans.map(c => `<div class="statrow"><span>Clan ${esc(c.name)}</span><b>${Math.round(c.loyalty)}</b></div>${bar(c.loyalty)}`).join("") + `<select id="clanSel">${G.clans.map(c => `<option>${esc(c.name)}</option>`).join("")}</select>` + btn("role", "⚔️ Court a clan", 3, 'data-type="clan"') + btn("role", "🔥 Hold a conclave", 3, 'data-type="conclave"');
    if (k === "movement") out = statRow("Independence support", `${Math.round(G.indep)}%`, G.indep) + btn("role", "📣 Mass rally", 3, 'data-type="rally"') + btn("role", "🏗️ Build shadow institutions", 3, 'data-type="shadow"') + btn("role", "🤝 Negotiate autonomy", 3, 'data-type="autonomy"');
    if (k === "opposition" || k === "candidate") out = groupSel + btn("role", "🎯 Campaign stop", 3, 'data-type="stop" data-group="1"') + btn("role", "⚔️ Attack the government", 3, 'data-type="attack" data-group="1"');
    if (["local", "executive", "monarch"].includes(k)) out = groupSel + btn("role", "📞 Constituent services", 3, 'data-type="service" data-group="1"');
    if (k === "minister") out = btn("role", `🏢 Ministry initiative`, 3, 'data-type="ministry"', "4 influence");
    if (k === "chancellor") out = ["peace", "fleet", "trade", "relief"].map(o => btn("role", { peace: "🕊️ Open peace talks", fleet: "🚀 Expand the fleet", trade: "📦 Sign a trade compact", relief: "🧳 Galaxy-wide relief" }[o], 3, `data-type="order" data-arg="${o}"`, "5 influence")).join("");
    if (k === "outsider") {
        const sub = G.office.sub;
        if (sub === "Prisoner") out = `<p>You are in prison. ${G.office.timer} months remain.</p>`;
        else if (sub === "Exile") out = `<p>You are in exile. ${G.office.timer} months remain.</p>`;
        else {
            if (sub === "Activist" || sub === "Revolutionary") out += groupSel + btn("role", "✊ Organise", 3, 'data-type="organize" data-group="1"');
            if (sub === "Journalist") out += `<select id="npcSel">${livingNpcs().filter(n => n.arena !== "retired").map(n => `<option value="${n.id}">${esc(n.name)}</option>`).join("")}</select>` + btn("role", "🔍 Publish an investigation", 3, 'data-type="investigate" data-npc="1"');
            if (sub === "Diplomat") out += `<select id="worldSel">${Object.keys(G.galaxy).filter(x => x !== G.worldKey).map(x => `<option value="${x}">${worldName(x)}</option>`).join("")}</select>` + btn("role", "🕊️ Mediation mission", 3, 'data-type="mediate" data-world="1"');
            const runnable = world().roles.map((r, i) => [r, i]).filter(([r]) => ["senator", "executive", "monarch", "local"].includes(r.kind) && !(r.kind === "senator" && G.galaxy[G.worldKey].independent));
            out += `<h4>Return to politics</h4>` + runnable.map(([r, i]) => btn("run", `🗳️ Run for ${r.title}`, 5, `data-i="${i}"`, "Election in 8 months")).join("");
        }
    }
    return out ? panel(`Your powers · ${esc(G.office.title)}`, out) : "";
}


// ── Public ────────────────────────────────────────────────────────

function viewPublic() {
    const rows = groupEntries().sort((a, b) => b[1].w - a[1].w).map(([k, g]) => {
        const trend = g.a - g.prev;
        const needs = Object.entries(GROUP_NEEDS[k]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 2).map(([s, w]) => `${w < 0 ? "less " : ""}${PLANET_STATS[s].name.toLowerCase()}`).join(", ");
        return `<tr><td>${GROUPS[k].icon} ${GROUPS[k].name}<br><span class="muted small">wants ${needs}</span></td><td class="num">${groupShare(k).toFixed(0)}%</td><td style="min-width:120px">${bar(g.a, g.a >= 50 ? "good" : "bad")}</td><td class="num"><b>${Math.round(g.a)}%</b> <span class="${trend >= 0 ? "c-for" : "c-against"}">${trend >= 0.3 ? "▲" : trend <= -0.3 ? "▼" : "·"}</span></td></tr>`;
    }).join("");
    const outlets = OUTLETS.map(o => `<div class="outlet"><div class="statrow"><span><b>${o.name}</b> <span class="muted small">${FACTIONS[o.lean].name}</span></span><b class="${G.media[o.key] >= 0 ? "c-for" : "c-against"}">${fmt(G.media[o.key])}</b></div>
        <div class="row"><span class="muted small">Reaches ${o.audience.map(a => GROUPS[a].name.toLowerCase()).join(", ")}</span><button class="mini" data-act="interview" data-key="${o.key}" ${G.ap < 3 ? "disabled" : ""}>Interview</button></div></div>`).join("");
    const news = G.news.slice(0, 12).map(n => `<div class="headline ${n.good ? "good" : "bad"}"><b>${esc(n.outlet)}</b>${esc(n.text)} <span class="muted small">${n.date}</span></div>`).join("") || `<p class="muted">No coverage yet.</p>`;
    return `<div class="cols"><div class="col-main">
        ${panel("Constituencies", `<p class="muted small">“The people” is not one number. Each group judges you on the conditions they care about — and on what you do.</p><div class="table-wrap"><table><tr><th>Group</th><th>Share</th><th>Approval</th><th></th></tr>${rows}</table></div>`)}
        ${panel("📰 The competing narratives", news)}
    </div><div class="col-side">
        ${opinionPanel()}
        ${panel("Public mood", `${statRow("Overall approval", `${Math.round(approval())}%`, approval(), "good")}${statRow("Public trust", Math.round(G.trust), G.trust)}${statRow("Unrest", Math.round(G.unrest), G.unrest, "bad")}${statRow("Ideological consistency", Math.round(G.consistency), G.consistency)}${statRow("Scandal heat", Math.round(G.heat), G.heat, "bad")}`)}
        ${panel("Media", `<button class="tactic" data-act="press" ${G.ap < 3 ? "disabled" : ""}>🎤 Hold a press conference <em>3 capital</em></button>${outlets}`)}
    </div></div>`;
}


// ── Campaign ──────────────────────────────────────────────────────

function viewCampaign() {
    const o = G.office;
    const electedPath = isElected() || KIND_INFO[o.kind].candidate;
    const proj = projectedShare();
    const districts = G.districts.map((d, i) => {
        const s = districtShare(d, electionCommon());
        return `<div class="district">
            <div class="statrow"><b>${esc(d.name)}</b><span class="muted small">pop. weight ${d.pop}</span></div>
            <div class="hints">${Object.entries(d.mix).map(([g]) => `<span class="hint">${GROUPS[g].icon} ${GROUPS[g].name}</span>`).join("")}</div>
            <div class="dshare"><div class="dbar"><i style="width:${s}%"></i><u></u></div><b class="${s > 50 ? "c-for" : "c-against"}">${pct(s)}</b></div>
            ${d.boost > 0.5 ? `<span class="muted small">campaign boost +${d.boost.toFixed(1)}</span>` : ""}
            <div class="row">
                <button class="mini" data-act="district" data-i="${i}" data-t="canvass" ${G.ap < 3 ? "disabled" : ""}>Canvass · 3 cap · 0.3M</button>
                <button class="mini" data-act="district" data-i="${i}" data-t="rally" ${G.ap < 4 ? "disabled" : ""}>Rally · 4 cap · 1M</button>
                <button class="mini" data-act="district" data-i="${i}" data-t="ads" ${G.funds < 2 ? "disabled" : ""}>Ads · 2M</button>
            </div></div>`;
    }).join("");
    const donors = Object.entries(DONOR_SOURCES).map(([k, s]) => `<button class="tactic" data-act="fund" data-src="${k}" ${G.ap < 3 ? "disabled" : ""}>${s.icon} ${s.name} <em>3 capital · ${s.amount[0]}–${s.amount[1]}M</em><span>${s.note}</span></button>`).join("");
    const obligations = G.obligations.filter(x => !x.done).map(x => `<li><b>${esc(x.donor)}</b> expects your vote for the ${BILLS[x.billKey].title}${x.asked ? "" : " (they haven't asked yet)"}</li>`).join("");
    const promises = G.promises.map(p => { const n = npc(p.npcId); return n ? `<li>${p.type === "trade" ? `You'll vote for <b>${BILLS[p.billKey].title}</b> — promised to` : "You owe a favour to"} <b>${esc(n.name)}</b></li>` : ""; }).join("");
    const donorList = Object.entries(G.donors).map(([n, d]) => `<li>${esc(n)} — ${d.given}M cr ${d.rel < 0 ? '<span class="c-against">(hostile)</span>' : ""}</li>`).join("");
    return `<div class="cols"><div class="col-main">
        ${panel("The race", electedPath ? `
            <div class="versus">
                <div><b>${esc(G.name)}</b><span class="muted">${FACTIONS[G.ideology].name}</span></div>
                <div class="vs">${pct(proj)}</div>
                <div><b>${esc(G.opponent ? G.opponent.name : "No declared challenger")}</b><span class="muted">${G.opponent ? `${FACTIONS[G.opponent.faction].name} · strength ${Math.round(G.opp)}` : ""}</span></div>
            </div>
            <p class="muted small">${o.termLeft != null ? `Election in ${termLeftLabel()}.` : ""} Endorsements: ${G.endorsements || 0}. Campaign boosts fade over time — timing matters.</p>` : `<p>Your power doesn't come from elections. Your <b>legitimacy</b> is ${Math.round(G.legitimacy)}. But the districts still decide how the planet feels about you.</p>`)}
        ${panel("Districts", `<div class="grid2">${districts}</div>`)}
    </div><div class="col-side">
        ${panel("Campaign war chest", `${statRow("Funds", `${G.funds.toFixed(1)}M cr`)}<button class="tactic" data-act="attackad" ${G.funds < 1.5 ? "disabled" : ""}>📺 Run attack ads <em>1.5M</em><span>Weakens your opponent; costs trust.</span></button>`)}
        ${panel("Raise money", `<p class="muted small">Every credit comes with a relationship.</p>${donors}`)}
        ${obligations || promises ? panel("What you owe", `<ul class="small">${obligations}${promises}</ul>`) : ""}
        ${donorList ? panel("Your donors", `<ul class="small">${donorList}</ul>`) : ""}
    </div></div>`;
}


// ── Galaxy ────────────────────────────────────────────────────────

// ── Network ───────────────────────────────────────────────────────

// ── Charter ───────────────────────────────────────────────────────

function viewCharter() {
    const c = G.const;
    const o = G.office;
    const lim = n => n > 0 ? `${n} term${n > 1 ? "s" : ""}` : "None";
    const rules = [
        ["Government", c.gov], ["Legislature", c.legislature], ["Executive", c.executive],
        ["Senate term", `${c.senateTerm} years`], ["Senate term limit", lim(c.senateLimit)],
        ["Executive term", `${c.execTerm} years`], ["Executive term limit", lim(c.execLimit)],
        ["Constitutional amendment", `${c.amendment} — ${Math.round(c.legThreshold * 100)}% of legislature${c.referendum ? ` + ${Math.round(c.refThreshold * 100)}% referendum` : ""}${c.courtReview ? " + judicial review" : ""}`],
        ["Election system", c.elections], ["Judicial independence", c.judicial >= 70 ? `High (${c.judicial})` : c.judicial >= 40 ? `Moderate (${c.judicial})` : `Low (${c.judicial})`],
        ["Military control", c.militaryControl], ["Recall elections", c.recall ? "Yes" : "No"], ["Emergency powers", c.emergency ? "Granted" : "None"]
    ].map(([k, v]) => `<tr><td class="muted">${k}</td><td>${esc(v)}</td></tr>`).join("");
    const insts = Object.entries(INSTITUTIONS).map(([k, d]) => statRow(`${d.icon} ${d.name}`, Math.round(G.inst[k]), G.inst[k], G.inst[k] < 35 ? "bad" : "good")).join("");
    let tracker = "";
    if (G.amendment) {
        const am = amendmentDef(G.amendment.key);
        const s = amendmentSupport(am);
        const gauge = (label, v, need) => `<div class="gauge"><div class="statrow"><span>${label}</span><b class="${v >= need ? "c-for" : "c-against"}">${pct(v)} / ${pct(need)}</b></div><div class="dbar"><i style="width:${v}%"></i><u style="left:${need}%"></u></div></div>`;
        tracker = panel(`Active campaign: “${esc(am.title())}”`, `
            ${gauge("Legislature", s.leg, s.legNeed)}
            ${s.referendum ? gauge(am.independence ? "Independence support" : "Public referendum", s.pub, s.pubNeed) : '<p class="muted small">No referendum required.</p>'}
            ${s.courtReview ? `<div class="statrow"><span>Judicial review — chance to survive</span><b>${Math.round(s.court)}%</b></div>` : '<p class="muted small">No judicial review.</p>'}
            <button class="tactic" data-act="amend-do" data-t="negotiate" ${G.ap < 4 ? "disabled" : ""}>🤝 Negotiate with blocs <em>4 capital · 4 influence</em></button>
            <button class="tactic" data-act="amend-do" data-t="campaign" ${G.ap < 4 ? "disabled" : ""}>📣 Public campaign <em>4 capital · 1.5M</em></button>
            ${s.courtReview ? `<button class="tactic" data-act="amend-do" data-t="judiciary" ${G.ap < 4 ? "disabled" : ""}>⚖️ Court the judiciary <em>4 capital</em><span>Risky.</span></button>` : ""}
            <button class="primary" data-act="amend-vote">Call the vote</button>
            <button class="secondary" data-act="amend-do" data-t="abandon">Abandon (−5 influence)</button>`, "alert");
    }
    const avail = AMENDMENTS.filter(a => a.available());
    const list = avail.map(a => {
        const s = amendmentSupport(a);
        return `<div class="amend"><b>${esc(a.title())}</b><p class="small">${esc(a.desc)}</p>
            <p class="muted small">Now: legislature ${pct(s.leg)} (needs ${pct(s.legNeed)})${s.referendum ? ` · public ${pct(s.pub)} (needs ${pct(s.pubNeed)})` : ""}${s.courtReview ? ` · court ${Math.round(s.court)}%` : ""}</p>
            <button class="mini" data-act="amend-start" data-key="${a.key}" ${G.amendment || G.ap < 8 ? "disabled" : ""}>Launch campaign · 8 capital</button></div>`;
    }).join("") || '<p class="muted">Nothing you can propose from your current position.</p>';
    const hist = G.amendments.map(a => `<li>Year ${a.year}: ${esc(a.title)} <span class="muted">(${esc(a.by)})</span></li>`).join("");
    return `<div class="cols"><div class="col-main">
        ${panel(`The constitution of ${esc(world().name)}`, `<table class="rules">${rules}</table><p class="muted small">You inherit these institutions. Their rules can be changed — but changing them requires political power.</p>`)}
        ${tracker}
        ${panel("Propose an amendment", list)}
    </div><div class="col-side">
        ${panel("Institutions", `<p class="muted small">Institutions push back. Decrees trigger court injunctions; a hostile civil service slow-walks your orders; the military decides whether you can ignore an election.</p>${insts}`)}
        ${o.kind === "chancellor" ? panel("Galactic constitution", `<p class="small">Chancellor term: ${G.galConst.execTerm} years · limit: ${lim(G.galConst.execLimit)}</p>`) : ""}
        ${hist ? panel("Constitutional history", `<ul class="small">${hist}</ul>`) : ""}
    </div></div>`;
}


// ── Archive ───────────────────────────────────────────────────────

// ── Scenes & toasts ───────────────────────────────────────────────

function renderScene() {
    const s = G.scenes[0];
    const el = $("#scene");
    if (!s) { el.innerHTML = ""; el.className = ""; return; }
    const b = SCENES[s.type](s.ctx);
    el.className = "open";
    el.innerHTML = `<div class="scene-card">
        <div class="scene-tag">${esc(b.tag)}</div>
        <h2>${esc(b.title)}</h2>
        <div class="scene-body">${b.body}</div>
        <div class="scene-choices">${b.choices.map((c, i) => `<button class="choice" data-act="scene" data-i="${i}" ${c.disabled ? "disabled" : ""}><span class="cl">${esc(c.label)}</span>${c.hint ? `<span class="muted small">${esc(c.hint)}</span>` : ""}</button>`).join("")}</div>
    </div>`;
}

function toast(title, text, changes = [], key = null) {
    const box = $("#toasts");
    if (!box) return;
    if (key) box.querySelectorAll(`[data-key="${key}"]`).forEach(x => x.remove());
    const t = document.createElement("div");
    t.className = "toast";
    if (key) t.dataset.key = key;
    t.innerHTML = `<b>${esc(title)}</b><p>${esc(text)}</p>${changeChips(changes.slice(0, 6))}`;
    box.prepend(t);
    while (box.children.length > 3) box.lastChild.remove();
    setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 400); }, 5200);
}


