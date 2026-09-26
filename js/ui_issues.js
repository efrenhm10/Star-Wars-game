// ── INTERFACE III — the agenda: issues, pipelines, the Bill Builder ──

function issueCard(i, compact = false) {
    const c = ISSUE_CATS[i.cat] || ISSUE_CATS.industry;
    const left = i.expires - monthsNow();
    const acts = issueActions(i);
    return `<article class="issue sev${i.severity}">
        <header><span class="src">${SOURCE_LABELS[i.source] || ""}</span><span class="muted small">${esc(i.district || "")}${i.promised ? ' · <b class="c-und">promised</b>' : ""} · ${left > 0 ? `${left} mo before it fades` : "fading"}</span></header>
        <h4>${c.icon} ${esc(i.title)}</h4>
        <p class="small">${esc(i.text)}</p>
        ${compact ? "" : `<div class="hints">${effectHints({ p: i.fx, g: i.g })}</div>`}
        <div class="row issue-acts">${acts.map(([a, label, cost]) => `<button class="mini" data-act="issue" data-uid="${i.uid}" data-a="${a}" ${cost && G.ap < cost ? "disabled" : ""}>${esc(label)}${cost ? ` · ${cost}` : ""}</button>`).join("")}</div>
    </article>`;
}

function officeIssuesPanel() {
    const open = openIssues();
    if (!open.length) return "";
    return panel(`📬 Constituent requests & issues (${open.length})`, open.slice(0, 3).map(i => issueCard(i, true)).join("") + (open.length > 3 ? `<button class="secondary" data-act="view" data-v="issues">See all ${open.length} →</button>` : ""));
}

function stageBar(stage) {
    const idx = STAGES.indexOf(stage);
    return `<div class="stages">${STAGES.map((s, n) => `<span class="${n < idx ? "done" : n === idx ? "now" : ""}">${s}</span>`).join("")}</div>`;
}

function pipelinePanel() {
    const rows = [];
    (G.earmarks || []).filter(e => e.status !== "rejected" || monthsNow() - (e.rejectedAt || 0) < 12).slice(-8).reverse().forEach((e, n) => {
        const stage = { requested: e.support >= 35 ? "Funding fight" : "Proposal", building: "Construction", built: e.followAt ? "Opened" : "Outcome", rejected: "Rejected" }[e.status];
        const idx = G.earmarks.indexOf(e);
        rows.push(`<div class="pipe"><div class="statrow"><b>${esc(e.name)}</b><span class="c-und">${e.cost}M</span></div>
            <div class="stages">${["Need", "Proposal", "Funding fight", "Construction", "Opened", "Outcome"].map(s => `<span class="${s === stage ? "now" : ""}">${s}</span>`).join("")}</div>
            ${e.status === "requested" ? `<p class="small">Support ${e.support}${e.cosponsors.length ? ` · cosponsors: ${e.cosponsors.map(esc).join(", ")}` : ""} · markup in Month 10</p>
                <div class="row"><select id="cosp${idx}">${npcOptions(livingNpcs().filter(x => x.arena === "senate").sort((a, b) => b.rel - a.rel).slice(0, 14))}</select>
                <button class="mini" data-act="earmark-do" data-e="${idx}" data-t="cosponsor" data-sel="cosp${idx}" ${G.ap < 3 ? "disabled" : ""}>Seek cosponsor · 3</button>
                <button class="mini" data-act="earmark-do" data-e="${idx}" data-t="finance" ${G.ap < 3 ? "disabled" : ""}>Lobby Finance · 3</button>
                <button class="mini" data-act="earmark-do" data-e="${idx}" data-t="chancellor" ${G.ap < 3 ? "disabled" : ""}>Pitch the Chancellor · 3</button></div>` : ""}
            ${e.status === "building" ? `<p class="small">${e.monthsLeft} months to the opening ceremony.</p>` : ""}</div>`);
    });
    (G.projects || []).filter(p => p.monthsLeft > 0).forEach(p => rows.push(`<div class="pipe"><div class="statrow"><b>${esc(p.name)}</b><span class="small">${p.monthsLeft} months</span></div><div class="stages">${["Need", "Funded", "Construction", "Opened", "Outcome"].map(s => `<span class="${s === "Construction" ? "now" : ""}">${s}</span>`).join("")}</div></div>`));
    return panel("🏗️ Projects pipeline", rows.join("") || `<p class="muted">Nothing in the pipeline. Turn an issue into a project.</p>`);
}

function legislationPanel() {
    const mine = G.bills.filter(b => b.sponsor === "player");
    const laws = (G.laws || []).filter(l => l.mine || l.arena === arena()).slice(0, 10);
    return panel("📜 Your legislation", `
        ${mine.map(b => `<div class="pipe"><div class="statrow"><b>${esc(b.title)}</b><button class="mini" data-act="gobill" data-id="${b.id}">To the floor →</button></div>${stageBar(billStage(b))}</div>`).join("")}
        ${laws.map(l => `<div class="pipe"><div class="statrow"><b>${esc(l.title)}</b><span class="small muted">${l.mine ? "yours" : `by ${esc(l.sponsor)}`} · ${eraYear(l.year)}</span></div>${stageBar(l.status === "completed" ? "Completed" : "Implementation")}${l.status === "implementation" ? `<p class="small muted">${l.monthsLeft} months of implementation left.</p>` : ""}</div>`).join("")}
        ${!mine.length && !laws.length ? '<p class="muted">You have no legislation yet. Every law starts as an issue.</p>' : ""}`);
}

function builderPanel() {
    const b = ui.builder;
    if (!b) return panel("✍️ Bill Builder", `<p class="small">Write your own legislation: choose the problem, the policy, who benefits, how much, who pays, who runs it, and for how long.</p>
        ${arena() === "senate" ? `<div class="row"><button class="primary" data-act="builder-open" data-scope="planet">🪐 A law for ${esc(world().name)}</button><button class="primary" data-act="builder-open" data-scope="galaxy">🌌 A galaxy-wide law</button></div>` : '<button class="primary" data-act="builder-open">Start a new bill</button>'}`);
    const senate = arena() === "senate";
    const opt = (field, obj, cur) => `<select data-bf="${field}">${Object.entries(obj).map(([k, v]) => `<option value="${k}" ${String(cur) === String(k) ? "selected" : ""}>${esc(v)}</option>`).join("")}</select>`;
    const cats = Object.fromEntries(Object.entries(ISSUE_CATS).map(([k, c]) => [k, `${c.icon} ${c.name}`]));
    const bens = Object.assign({ everyone: "Everyone" }, Object.fromEntries(groupEntries().map(([k]) => [k, GROUPS[k].name])));
    const amounts = senate ? { 50: "50M credits", 100: "100M credits", 250: "250M credits", 500: "500M credits", 1000: "1,000M credits" } : { 0.5: "0.5B credits", 1.5: "1.5B credits", 3: "3B credits", 6: "6B credits" };
    const funding = Object.fromEntries(Object.entries(FUNDING).filter(([k]) => senate ? k !== "budget" : k !== "appropriations"));
    const t = compileBill(b);
    const issue = ui.builderIssue && (G.issues || []).find(x => x.uid === ui.builderIssue);
    return panel("✍️ Bill Builder", `<div class="builder" id="builder">
        ${issue ? `<p class="small c-und">Responding to: ${esc(issue.title)}</p>` : ""}
        <div class="bgrid">
            ${senate ? `<label>Who does this law cover?${opt("scope", { planet: `${world().name} only`, galaxy: "The whole galaxy" }, b.scope || "planet")}</label>` : ""}
            <label>What problem are you addressing?${opt("cat", cats, b.cat)}</label>
            <label>What do you want government to do?${opt("mech", Object.fromEntries(Object.entries(MECHANISMS).map(([k, m]) => [k, m.name])), b.mech)}</label>
            <label>Who receives the benefit?${opt("ben", bens, b.ben)}</label>
            <label>How much funding?${opt("amount", amounts, b.amount)}</label>
            <label>How is it funded?${opt("funding", funding, b.funding)}</label>
            <label>Who administers it?${opt("agency", AGENCIES, b.agency)}</label>
            <label>How long does it last?${opt("years", { 1: "1 year", 3: "3 years", 5: "5 years", 10: "10 years", 20: "Permanent" }, b.years)}</label>
        </div>
        <h4>Additional provisions</h4>
        <div class="provisions">${Object.entries(PROVISIONS).map(([k, v]) => `<label class="prov"><input type="checkbox" data-bp="${k}" ${b.provisions.includes(k) ? "checked" : ""}> ${esc(v)}</label>`).join("")}</div>
        <div class="bill-preview">
            <div class="record-title">YOUR BILL ${senate ? (b.scope === "galaxy" ? "· 🌌 GALAXY-WIDE" : `· 🪐 FOR ${esc(world().name.toUpperCase())}`) : ""}</div>
            <h3 class="bill-title">${esc(t.title)}</h3>
            <p class="small">${esc(t.desc)}</p>
            <div class="grid2">
                <div><h4>Benefits</h4><div class="hints">${effectHints({ p: t.perYear, gal: t.galPerYear || undefined, g: Object.fromEntries(Object.entries(t.g).filter(([, v]) => v > 0)) })}</div>${t.worldPerYear ? '<p class="small muted">Every member world: prosperity and stability rise a little each year.</p>' : ""}</div>
                <div><h4>Consequences</h4><ul class="small">${t.consequences.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
                <div><h4>Support</h4><p class="small c-for">${t.supporters.map(esc).join(", ") || "—"}</p></div>
                <div><h4>Opposition</h4><p class="small c-against">${t.opponents.map(esc).join(", ") || "—"}</p></div>
            </div>
            <div class="row"><button class="primary" data-act="builder-submit" ${G.ap < 6 ? "disabled" : ""}>Introduce it · 6 capital · ${senate ? (b.scope === "galaxy" ? 10 : 5) : 4} influence</button><button class="secondary" data-act="builder-cancel">Discard</button></div>
        </div></div>`);
}

function viewIssues() {
    const open = openIssues();
    const k = G.office.kind;
    const tour = k === "senator" ? tact("hometour", "🚀 Tour the homeworld to find needs", 3, "Meet constituents; see problems with your own eyes.") : "";
    return `<div class="era-banner"><b>THE AGENDA</b> · Politics comes to you. Solve one problem and someone else may feel ignored.</div>
        <div class="cols"><div class="col-main">
            ${panel(`📬 Issues & constituent requests (${open.length})`, `${tour}${open.map(i => issueCard(i)).join("") || '<p class="muted">No open issues. Campaign, tour, or wait — the galaxy will send you some.</p>'}`)}
            ${builderPanel()}
        </div><div class="col-side">
            ${legislationPanel()}
            ${pipelinePanel()}
            ${panel("Recently closed", (G.issues || []).filter(i => i.status !== "open").slice(0, 8).map(i => `<p class="small"><b>${esc(i.title)}</b> — <span class="muted">${esc(i.status)}</span></p>`).join("") || '<p class="muted small">—</p>')}
        </div></div>`;
}

function attributesPanel(w, live = false) {
    return Object.entries(ATTRIBUTES).map(([k, a]) => {
        const v = live ? attr(k) : w.ratings[k];
        return `<div class="attr"><div class="statrow"><b>${a.name}</b>${stars(v)}</div><p class="small">${esc(attrLine(k, v))}</p><p class="muted small">Affects: ${a.effects.map(esc).join(" · ")}</p></div>`;
    }).join("");
}
