// ── INTERFACE II — worlds, characters, powers, history ──────────────

const stars = n => `<span class="stars-r">${"★".repeat(n)}<i>${"☆".repeat(5 - n)}</i></span>`;
const ALIGN_COLORS = { republic: "#5a9ae6", separatist: "#e8596a", neutral: "#e8b54a", empire: "#9aa0aa", hutt: "#b58cff", rebel: "#f08a3a" };
const ALIGN_NAMES = { republic: "Galactic Republic", separatist: "Confederacy of Independent Systems", neutral: "Neutral", empire: "Galactic Empire", hutt: "Hutt Space", rebel: "Rebel Alliance" };


// ── Setup: world picker ───────────────────────────────────────────

function renderWorldPicker() {
    $("#worldList").innerHTML = REGIONS.map(r => `
        <div class="region"><h3>${r.name}</h3><div class="grid3">
        ${Object.entries(WORLDS).filter(([, w]) => w.region === r.key).map(([k, w]) => `
            <button class="world-card" data-act="pickworld" data-key="${k}">
                <div class="wc-head"><b>${w.name}</b><span class="diff" title="Difficulty">${"◆".repeat(w.difficulty)}${"◇".repeat(5 - w.difficulty)}</span></div>
                <span class="wc-gov">${esc(w.govType)}</span>
                <span class="small">${esc(w.tagline)}</span>
                <span class="wc-stats small"><span>Wealth ${stars(w.ratings.wealth)}</span><span>Military ${stars(w.ratings.military)}</span><span>Stability ${stars(w.ratings.stability)}</span></span>
                <span class="muted small">${w.species.map(s => SPECIES[s].name).join(" · ")} · ${w.roles.length} roles</span>
            </button>`).join("")}
        </div></div>`).join("");
}


// ── Setup: world dossier & roles ──────────────────────────────────

function renderWorldSetup(key) {
    ui.setupWorld = key;
    const w = WORLDS[key];
    const c = w.const;
    const lim = n => n > 0 ? `${n} term${n > 1 ? "s" : ""}` : "No limit";
    const r = w.ratings;
    const topFactions = Object.entries(w.lean).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([f]) => FACTIONS[f].name).join(", ");
    $("#setupTitle").textContent = w.name.toUpperCase();
    $("#setupTagline").textContent = `${w.govType} · ${w.tagline}`;
    const list = arr => arr.map(x => `<li>${esc(x)}</li>`).join("");
    $("#constitutionCard").innerHTML = `
        <h3>World dossier — 32 BBY</h3>
        <p class="small">${w.facts.map(esc).join(". ")}.</p>
        <div class="dossier-grid">
            <div><h4>Government type</h4><p>${esc(w.govType)}</p><h4>Institutions</h4><ul class="small">${list(w.institutions)}</ul></div>
            <div><h4>Ratings</h4>
                <div class="rating-rows small">
                    <span>Wealth</span>${stars(r.wealth)}<span>Inequality</span>${stars(r.inequality)}<span>Population</span>${stars(r.population)}
                    <span>Industry</span>${stars(r.industry)}<span>Military capacity</span>${stars(r.military)}<span>Infrastructure</span>${stars(r.infrastructure)}
                    <span>Galactic influence</span>${stars(r.influence)}<span>Stability</span>${stars(r.stability)}<span>Environment</span>${stars(r.environment)}
                </div></div>
            <div><h4>Major industries</h4><p class="small">${w.industries.map(esc).join(", ")}</p><h4>Resources</h4><p class="small">${w.resources.map(esc).join(", ")}</p><h4>Cultural groups</h4><p class="small">${w.culture.map(esc).join(", ")}</p><h4>Species</h4><p class="small">${w.species.map(s => SPECIES[s].name).join(", ")}</p></div>
            <div><h4>Political conflicts</h4><ul class="small">${list(w.conflicts)}</ul><h4>Strongest factions</h4><p class="small">${topFactions}</p>
                <h4>Republic relationship</h4>${bar(w.republic, "good")}<h4>Separatist sentiment</h4>${bar(w.sep, "bad")}<p class="muted small">${w.sep}% · canon alignment: ${ALIGN_NAMES[w.canonAlign] || w.canonAlign}</p></div>
            <div><h4>Major problems</h4><ul class="small">${list(w.problems)}</ul></div>
            <div><h4>Major advantages</h4><ul class="small">${list(w.advantages)}</ul></div>
        </div>
        <h3>Constitution</h3>
        <table class="rules">
            <tr><td class="muted">Government</td><td>${esc(c.gov)}</td></tr>
            <tr><td class="muted">Legislature</td><td>${esc(c.legislature)}</td></tr>
            <tr><td class="muted">Executive</td><td>${esc(c.executive)}</td></tr>
            ${c.monarchy ? `<tr><td class="muted">Monarchy</td><td>${{ constitutional: "Constitutional — the monarch reigns, the government rules", elective: "Elective — an elected monarch governs", absolute: "Absolute — the monarch rules" }[c.monarchy]}</td></tr>` : ""}
            <tr><td class="muted">Senate term</td><td>${c.senateTerm} years · ${lim(c.senateLimit)}</td></tr>
            <tr><td class="muted">Executive term</td><td>${c.execTerm} years · ${lim(c.execLimit)}</td></tr>
            <tr><td class="muted">Constitutional amendment</td><td>${esc(c.amendment)}</td></tr>
            <tr><td class="muted">Election system</td><td>${esc(c.elections)}</td></tr>
            <tr><td class="muted">Judicial independence</td><td>${c.judicial >= 70 ? "High" : c.judicial >= 40 ? "Moderate" : "Low"}</td></tr>
            <tr><td class="muted">Military control</td><td>${esc(c.militaryControl)}</td></tr>
            <tr><td class="muted">Political stability</td><td>${c.stability >= 70 ? "High" : c.stability >= 45 ? "Moderate" : "Low"}</td></tr>
        </table>
        <p class="quote">“You will inherit these institutions. Their rules can be changed — but changing them will require political power.”</p>
        <p class="small">${esc(w.intro)}</p>
        <h4>Who holds power here</h4><div class="hints">${w.powers.map(p => `<span class="hint">${esc(p)}</span>`).join("")}</div>`;
    $("#roleList").innerHTML = w.roles.map((ro, i) => {
        const s = roleSchema(ro.kind);
        const holder = ro.canonHolder && CANON[ro.canonHolder];
        return `<button class="role-card lens-${s.lens}" data-act="pickrole" data-i="${i}">
            <b>${esc(ro.title)}</b><span class="muted small">${s.label} · ${KIND_INFO[ro.kind].label}</span>
            <span class="small">${esc(ro.desc)}</span>
            <span class="small"><b>Powers:</b> ${esc(s.powers)}</span>
            <span class="small"><b>Constraints:</b> ${esc(s.constraints)}</span>
            ${holder ? `<span class="small c-und">In canon, ${esc(holder.name)} holds this office. In your history, you do — and ${esc(holder.name.split(" ")[0])} will still be around.</span>` : ""}
        </button>`;
    }).join("");
    showScreen("setup");
}


// ── Character creator ─────────────────────────────────────────────

function renderCreator() {
    const w = WORLDS[ui.setupWorld];
    const role = w.roles[ui.roleIndex];
    if (!ui.app || !w.species.includes(ui.app.species)) {
        ui.app = randomAppearance(w.species[0]);
        ui.app.attire = { senator: "robes", monarch: "royal", hereditary: "royal", clan: "armor", movement: "rebel", local: "civilian", council: "uniform", traditional: "clerical" }[role.kind] || "robes";
        if (role.kind === "monarch" || role.kind === "hereditary") ui.app.accessory = "headdress";
        $("#playerName").value = randomName(ui.setupWorld, ui.app.species);
    }
    const a = ui.app;
    const sp = SPECIES[a.species];
    const humanFace = sp.face === "human";
    const swatches = (field, colors) => `<div class="swatches">${colors.map(c => `<button class="sw ${a[field] === c ? "on" : ""}" style="background:${c}" data-act="app" data-f="${field}" data-v="${c}" aria-label="${c}"></button>`).join("")}</div>`;
    const sel = (field, opts) => `<select data-appf="${field}">${Object.entries(opts).map(([k, v]) => `<option value="${k}" ${String(a[field]) === String(k) ? "selected" : ""}>${esc(v)}</option>`).join("")}</select>`;
    $("#creatorTitle").textContent = `${role.title} of ${w.name}`;
    $("#creatorPortrait").innerHTML = renderPortrait(a, 240);
    $("#creatorControls").innerHTML = `
        <h4>Species <span class="muted small">— the peoples of ${esc(w.name)}</span></h4>
        <div class="species-row">${w.species.map(s => `<button class="species-btn ${a.species === s ? "on" : ""}" data-act="species" data-s="${s}">${renderPortrait({ ...randomAppearance(s), skin: SPECIES[s].skins[0], attireColor: "#1f3a5b" }, 54)}<span>${SPECIES[s].name}</span></button>`).join("")}</div>
        <h4>${sp.skinLabel || "Skin"}</h4>${swatches("skin", sp.skins)}
        ${humanFace || sp.eyes ? `<h4>${sp.eyesLabel || "Eyes"}</h4>${swatches("eyes", sp.eyes || EYE_COLORS)}` : ""}
        ${sp.hair ? `<h4>Hair</h4>${sel("hair", HAIR_STYLES)}${swatches("hairColor", HAIR_COLORS)}` : ""}
        ${sp.features ? `<h4>Features</h4>${sel("feature", Object.fromEntries(sp.features.map((f, i) => [i, f])))}` : ""}
        ${humanFace ? `<h4>Markings</h4>${sel("marks", MARKS)}` : ""}
        <h4>Accessory</h4>${sel("accessory", ACCESSORIES)}
        <h4>Attire</h4>${sel("attire", ATTIRES)}${swatches("attireColor", ATTIRE_COLORS)}
        <h4>Age</h4>${sel("age", AGES)}
        <button class="secondary" data-act="randomlook">🎲 Randomise look</button>`;
    showScreen("creator");
}


// ── Powers: every role gets a different toolbox ───────────────────

function schemaPanel() {
    const s = roleSchema();
    const rows = [["Powers", s.powers], ["Responsibilities", s.responsibilities], ["Budget authority", s.budget], ["Legislative authority", s.legislative], ["Appointment authority", s.appointment], ["Military authority", s.military], ["Diplomatic authority", s.diplomatic],
        ["Term rules", G.office.termYears ? `${G.office.termYears}-year terms · ${G.office.termLimit ? `limit ${G.office.termLimit}` : "no limit"}` : KIND_INFO[G.office.kind].label], ["Constraints", s.constraints]];
    return `<details class="schema"><summary><b>${esc(G.office.title)}</b> — ${esc(s.powers)} <span class="muted small">(what you can and cannot do)</span></summary><table class="rules">${rows.map(([k, v]) => `<tr><td class="muted">${k}</td><td>${esc(v)}</td></tr>`).join("")}</table></details>`;
}

const tact = (act, label, cost, note = "", attrs = "", disabled = false) => `<button class="tactic" data-act="${act}" ${attrs} ${disabled || G.ap < cost ? "disabled" : ""}>${label}${cost ? ` <em>${cost} capital</em>` : ""}${note ? `<span>${note}</span>` : ""}</button>`;
const noAuth = (label, alt) => `<button class="tactic noauth" disabled>${label}<span>You do not possess this authority. ${alt}</span></button>`;
const worldOptions = (filter = () => true) => Object.keys(G.galaxy).filter(k => k !== G.worldKey && !G.galaxy[k].destroyed && filter(k)).map(k => `<option value="${k}">${worldName(k)}</option>`).join("");
const npcOptions = list => list.map(n => `<option value="${n.id}">${esc(n.name)} — ${esc(n.title)}</option>`).join("");

function warPanel() {
    if (!(G.siege || G.occupied || G.war)) return "";
    const w = world();
    let body = "";
    if (G.siege) body += `<p class="c-against"><b>${esc(G.siege.by)} forces in the system.</b> Enemy strength ${G.siege.str} vs your defence ${defenseStrength()}. Month ${G.siege.months} of the attack.</p>`;
    if (G.occupied) body += `<p class="c-against"><b>${esc(w.name)} is occupied by ${esc(G.occupied.by)} forces</b> (${G.occupied.months || 0} months).</p>`;
    if (G.siege && G.siege.blockade) body += `<p>${esc(supplyReport())}</p>`;
    if (!G.siege && !G.occupied) body += `<p>No enemy in the system. Defence strength: ${defenseStrength()}.</p>`;
    if (G.petition) body += `<p class="c-und">Your petition for assistance is before the Senate.</p>`;
    else if (G.siege || G.occupied) body += roleCat() === "local" ? noAuth("📨 Petition the Senate for military assistance", "Only the planetary government can. Petition the planetary government instead.") + tact("petitionup", "📨 Petition the planetary government for protection", 3, "", 'data-w="defence"') : tact("petition", "📨 Petition the Senate for military assistance", 3, "Then fight for it: sponsors, committees, the Chancellor.");
    return panel("⚔️ War", body, "danger");
}

function viewPowers() {
    const L = lens();
    const k = G.office.kind;
    let out = `<div class="lens-banner lens-${L}"><span>${esc(roleSchema().label.toUpperCase())}</span><span>${esc(G.office.title)} · ${esc(world().name)}</span></div>${schemaPanel()}${warPanel()}`;
    if (k === "senator") out += senatorDesk();
    else if (k === "chancellor") out += chancelleryDesk();
    else if (k === "minister") out += rolePowers();
    else if (L === "court") out += courtDesk() + (canDecree() ? executiveDesk() : "") + rolePowers();
    else if (L === "executive" || L === "command") out += executiveDesk() + rolePowers();
    else if (L === "city") out += cityDesk() + rolePowers();
    else if (L === "underground") out += undergroundDesk();
    else out += rolePowers();
    return out;
}

function senatorDesk() {
    const coms = Object.entries(COMMITTEES).map(([key, c]) => {
        const member = G.committees.includes(key);
        const chair = G.committeeChairs[key] === "player" ? "You" : (npc(G.committeeChairs[key]) || {}).name || "—";
        return `<tr><td><b>${c.name}</b><br><span class="muted small">${c.note}</span></td><td class="small">Chair: ${esc(chair)}</td>
            <td>${member ? (G.chairOf === key ? '<span class="hint up">Chair</span>' : `<span class="hint up">Member</span> ${G.seniority >= 48 ? `<button class="mini" data-act="seekchair" data-k="${key}" ${G.ap < 8 ? "disabled" : ""}>Seek chair · 8</button>` : `<span class="muted small">chair after 4 yrs</span>`}`) : `<button class="mini" data-act="assign" data-k="${key}" ${G.ap < 5 ? "disabled" : ""}>Request seat · 5</button>`}</td></tr>`;
    }).join("");
    const pork = world().pork || [];
    const porkRows = pork.map((p, i) => {
        const e = G.earmarks.find(x => x.idx === i && x.status !== "rejected");
        return `<div class="pork"><div class="statrow"><b>${esc(p[0])}</b><b class="c-und">${p[1]}M cr</b></div><p class="small">${esc(p[4])}</p>
            <div class="hints">${effectHints({ p: p[2], g: p[3] })}</div>
            ${e ? `<p class="small">Status: <b>${e.status}</b>${e.status === "building" ? ` — ${e.monthsLeft} months to completion` : ""}${e.status === "requested" ? ` · support ${e.support}${e.cosponsors.length ? ` · cosponsors: ${e.cosponsors.map(esc).join(", ")}` : ""}` : ""}</p>` : `<button class="mini" data-act="earmark" data-i="${i}" ${G.ap < 4 ? "disabled" : ""}>Request appropriation · 4</button>`}
            ${e && e.status === "requested" ? `<div class="row"><select id="cosp${i}">${npcOptions(livingNpcs().filter(n => n.arena === "senate").sort((a, b) => b.rel - a.rel).slice(0, 12))}</select>
                <button class="mini" data-act="earmark-do" data-e="${G.earmarks.indexOf(e)}" data-t="cosponsor" data-sel="cosp${i}" ${G.ap < 3 ? "disabled" : ""}>Seek cosponsor · 3</button>
                <button class="mini" data-act="earmark-do" data-e="${G.earmarks.indexOf(e)}" data-t="finance" ${G.ap < 3 ? "disabled" : ""}>Lobby Finance · 3</button>
                <button class="mini" data-act="earmark-do" data-e="${G.earmarks.indexOf(e)}" data-t="chancellor" ${G.ap < 3 ? "disabled" : ""}>Pitch the Chancellor · 3</button></div>` : ""}</div>`;
    }).join("") || `<p class="muted">${esc(world().name)} has no Senate appropriations tradition.</p>`;
    const delivered = G.earmarks.filter(e => e.status === "built").length;
    const bloc = (key, label, cond = true) => cond ? tact("bloc", label, 3, "", `data-k="${key}"`) : "";
    return `<div class="cols"><div class="col-main">
        ${panel("💰 Bring it home", `<div class="statrow"><span>Available Republic funds (this year)</span><b>${G.approPool.toLocaleString()}M credits</b></div><p class="muted small">Requests go to the Finance Committee's appropriations markup in Month 10. You need committee support, cosponsors — and the Chancellor not to hate you. Delivered so far: ${delivered} project${delivered === 1 ? "" : "s"} (${G.record.appropriations.toLocaleString()}M credits).</p>${porkRows}`)}
        ${panel("🏛️ Committees", `<div class="table-wrap"><table>${coms}</table></div><p class="muted small">Seniority: ${Math.floor(G.seniority / 12)} yrs ${G.seniority % 12} mo. A hostile chair can bottle up bills in committee.</p>`)}
    </div><div class="col-side">
        ${panel("🔍 Oversight", `<select id="hearingSel"><option value="chancellor">The Chancellor's office</option><option value="defense">The Ministry of Defense</option><option value="banking">The Banking Clan</option><option value="tradefed">The Trade Federation</option></select>
            ${tact("hearing", "Call officials before your committee", 4, "", "", !G.committees.length)}
            ${tact("investigation", "Request an investigation", 3)}
            ${tact("inquiry", "Demand a full Senate inquiry", 6, "5 influence. The Chancellor will not thank you.")}
            ${G.committees.includes("defense") ? tact("milreview", "Review military spending", 4) : ""}`)}
        ${panel("🤝 Build a coalition", `${bloc("core", "Meet the Core Worlds delegation")}${bloc("mid", "Negotiate with the Mid Rim caucus")}${bloc("outer", "Negotiate with the Outer Rim bloc")}${bloc("loyalist", "Meet the Loyalist Committee", G.hist.loyalist_committee)}${bloc("sep", "Meet quietly with Separatist sympathisers", ["republic", "crisis"].includes(G.era))}`)}
        ${panel("🌌 Foreign & galactic affairs", `${tact("sanctions", "Support sanctions", 3, "", 'data-k="support"')}${tact("sanctions", "Oppose sanctions", 3, "", 'data-k="oppose"')}${tact("treaty", "Ratify a treaty", 4)}
            <select id="interventionSel">${worldOptions()}</select>${tact("intervention", "Request diplomatic intervention", 3)}`)}
    </div></div>`;
}

function executiveDesk() {
    const b = budget();
    const projects = PROJECTS.map(p => {
        const building = G.projects.find(x => x.key === p.key && x.monthsLeft > 0);
        const can = G.treasury >= p.cost;
        return `<div class="project"><div class="statrow"><b>${esc(p.name)}</b><span class="small">${p.months} months</span></div>
            <div class="hints">${effectHints({ p: p.fx.fortify ? {} : p.fx, g: p.g })}${p.fx.fortify ? '<span class="hint up">🛡️ Defence +15</span>' : ""}</div>
            <p class="small">Projected cost: <b>${p.cost.toFixed(1)}B</b> · Available: <b class="${can ? "c-for" : "c-against"}">${G.treasury.toFixed(1)}B</b></p>
            ${building ? `<p class="small c-und">Under construction — ${building.monthsLeft} months left.</p>` : `<div class="row fin">
                ${can ? `<button class="mini" data-act="project" data-k="${p.key}" data-h="cash">Pay from treasury</button>` : ""}
                <button class="mini" data-act="project" data-k="${p.key}" data-h="taxes">Raise taxes</button>
                <button class="mini" data-act="project" data-k="${p.key}" data-h="borrow">Borrow</button>
                <button class="mini" data-act="project" data-k="${p.key}" data-h="cut">Cut a program</button>
                <button class="mini" data-act="project" data-k="${p.key}" data-h="republic">Request Republic funding</button>
                <button class="mini" data-act="project" data-k="${p.key}" data-h="private">Private investment</button></div>`}</div>`;
    }).join("");
    const cabinetSeats = ["Finance", "Security", "Health", "Infrastructure"].map(s => `<div class="statrow"><span>${s}</span><b>${G.cabinet[s] && npc(G.cabinet[s]) ? esc(npc(G.cabinet[s]).name) : '<span class="muted">vacant</span>'}</b></div>`).join("");
    const locals = livingNpcs().filter(n => n.arena === "local" || n.world === G.worldKey);
    return `<div class="cols"><div class="col-main">
        ${panel("🏗️ Budget & projects", `<div class="statrow"><span>Treasury</span><b>${G.treasury.toFixed(1)}B</b></div><div class="statrow"><span>Monthly balance</span><b class="${b.net >= 0 ? "c-for" : "c-against"}">${fmt(b.net)}B</b></div>
            <p class="muted small">Every project costs 4 capital to launch. If the money isn't there, you must choose how to find it. Cutting a program uses the program selected here:</p>
            <select id="cutSel">${Object.entries(G.policies).filter(([, p]) => p.level > 0.1).map(([k]) => `<option value="${k}">${POLICIES[k].name}</option>`).join("")}</select>
            <div class="grid2">${projects}</div>`)}
    </div><div class="col-side">
        ${panel("📜 Executive orders", `${tact("exec", "Declare a state of emergency", 5, "Unlocks wartime measures for 12 months.", 'data-t="emergency"')}${tact("exec", "Direct government agencies", 3, "", 'data-t="agencies"')}${tact("exec", "Establish temporary regulations", 3, "", 'data-t="regulations"')}${tact("exec", "Allocate emergency resources", 3, "2B from the treasury.", 'data-t="resources"')}`)}
        ${panel("🗂️ Administration", `${cabinetSeats}<select id="cabSel">${npcOptions(locals)}</select>${tact("exec", "Appoint to cabinet", 3, "", 'data-t="cabinet" data-sel="cabSel"')}${tact("exec", "Replace an agency head", 3, "", 'data-t="agencyhead"')}${tact("exec", "Merge agencies", 4, "Saves money; confuses everyone.", 'data-t="merge"')}`)}
        ${panel("🚨 Public safety", `${tact("exec", "Deploy planetary security", 3, "", 'data-t="security"')}${tact("exec", "Increase emergency preparedness", 3, "", 'data-t="preparedness"')}${(G.siege || G.occupied) ? tact("petition", "Request Republic assistance", 4) : ""}`)}
        ${panel("📈 Economic development", `${tact("exec", "Offer corporate incentives", 3, "", 'data-t="incentives"')}${tact("exec", "Regulate mining", 3, "", 'data-t="mining"')}${tact("exec", "Establish a public enterprise", 4, "", 'data-t="enterprise"')}<select id="tradeSel">${worldOptions(k => G.galaxy[k].align === G.allegiance || G.galaxy[k].align === "neutral")}</select>${tact("exec", "Negotiate a trade agreement", 4, "", 'data-t="trade" data-sel="tradeSel"')}`)}
        ${panel("", `<button class="secondary" data-act="view" data-v="government">🕸️ Open the policy web</button>`)}
    </div></div>`;
}

function courtDesk() {
    const k = G.office.kind;
    const constitutional = isConstitutionalMonarch();
    const locals = livingNpcs().filter(n => n.arena === "local");
    const pm = G.pm && npc(G.pm);
    const canonGuests = livingNpcs().filter(n => n.canon && n.world !== G.worldKey);
    const groupSel = `<select id="groupSel">${groupEntries().map(([g]) => `<option value="${g}">${GROUPS[g].icon} ${GROUPS[g].name}</option>`).join("")}</select>`;
    return `<div class="cols"><div class="col-main">
        ${panel("👑 Appointments", `${constitutional ? `<p class="small">You reign; the government rules. Policy is set by your Prime Minister's government, not by you.</p>` : `<p class="small">${k === "monarch" ? "As an elected monarch you govern directly, with your advisers." : "Your word is law — so long as your legitimacy holds."}</p>`}
            <div class="statrow"><span>Prime Minister</span><b>${pm ? esc(pm.name) + ` (${FACTIONS[pm.faction].name})` : '<span class="muted">none</span>'}</b></div>
            <select id="pmSel">${npcOptions(locals)}</select>${tact("court", "Appoint Prime Minister", 5, "Their faction's priorities will shape government policy.", 'data-t="pm" data-sel="pmSel"')}
            ${tact("court", "Appoint royal advisers", 3, "", 'data-t="advisers"')}${tact("court", "Call for a new government", 8, "Dissolve the government.", 'data-t="newgov"', !pm)}`)}
        ${panel("⚖️ Constitutional powers", `<p class="small">When the legislature passes a bill against your wishes, you may grant or withhold assent. Withholding it from an elected legislature is a constitutional crisis.</p>
            ${tact("court", "Invoke emergency provisions", 5, "Wartime only.", 'data-t="emergency"', !wartime() && !G.war)}`)}
    </div><div class="col-side">
        ${panel("🕊️ Diplomacy", `<select id="delegSel">${worldOptions()}</select>${tact("court", "Receive a foreign delegation", 3, "", 'data-t="delegation" data-sel="delegSel"')}
            ${tact("court", "Host a diplomatic summit", 5, "", 'data-t="summit"')}
            ${groupSel}${tact("court", "Issue a royal statement", 3, "", 'data-t="statement" data-sel="groupSel"')}
            ${canonGuests.length ? `<select id="audSel">${npcOptions(canonGuests)}</select>${tact("court", "Grant a diplomatic audience", 3, "", 'data-t="audience" data-sel="audSel"')}` : ""}`)}
    </div></div>`;
}

function chancelleryDesk() {
    const senators = livingNpcs().filter(n => n.arena === "senate");
    const ministers = MINISTRIES.map(m => { const n = G.ministers && npc(G.ministers[m.key]); return `<div class="statrow"><span>${m.name}</span><b>${n ? esc(n.name) : '<span class="muted">vacant</span>'}</b></div>`; }).join("");
    const senateBills = G.bills.filter(b => b.arena === "senate");
    return `<div class="cols"><div class="col-main">
        ${panel("🏛️ Cabinet", `${ministers}<div class="row"><select id="minSel">${MINISTRIES.map(m => `<option value="${m.key}">${m.name}</option>`).join("")}</select><select id="minNpc">${npcOptions(senators.slice(0, 30))}</select></div>
            ${tact("chanc", "Appoint minister", 4, "", 'data-t="minister" data-pair="1"')}
            ${G.ministers && Object.keys(G.ministers).length ? `<select id="dismissSel">${npcOptions(Object.values(G.ministers).map(npc).filter(Boolean))}</select>${tact("chanc", "Dismiss minister", 4, "They will not forget.", 'data-t="dismiss" data-sel="dismissSel"')}` : ""}`)}
        ${panel("📜 Legislative agenda", `${senateBills.length ? `<select id="agendaSel">${senateBills.map(b => `<option value="${b.id}">Bill ${b.num}: ${esc(b.title)}</option>`).join("")}</select>${tact("chanc", "Make it the government's priority", 3, "Momentum every month until the vote.", 'data-t="agenda" data-sel="agendaSel"')}` : '<p class="muted">No bills before the Senate.</p>'}
            <select id="draftSel">${Object.entries(BILLS).filter(([k, t]) => t.arena === "senate" && !G.bills.some(b => b.key === k)).map(([k, t]) => `<option value="${k}">${esc(t.title)}</option>`).join("")}</select>${tact("chanc", "Direct a ministry to draft this bill", 5, "", 'data-t="draft" data-sel="draftSel"')}
            ${tact("chanc", "Negotiate with the Senate", 4, "", 'data-t="negotiate"')}`)}
    </div><div class="col-side">
        ${panel("⚔️ Defence", `<select id="deploySel">${worldOptions(k => ["republic", "neutral"].includes(G.galaxy[k].align))}<option value="${G.worldKey}">${world().name} (home)</option></select>${tact("chanc", "Deploy the military", 5, "", 'data-t="deploy" data-sel="deploySel"')}${tact("chanc", "Request Senate authorisation", 4, "", 'data-t="authorize"')}${tact("chanc", "Increase defence readiness", 3, "", 'data-t="readiness"')}`)}
        ${panel("🕊️ Diplomacy", `${tact("chanc", "Meet a foreign leader", 4, "", 'data-t="meet"')}${tact("chanc", "Negotiate a treaty", 5, "", 'data-t="treaty"')}${tact("chanc", "Impose sanctions", 4, "", 'data-t="sanctions"')}<select id="recogSel">${worldOptions(k => G.galaxy[k].align === "separatist")}</select>${tact("chanc", "Recognise a government", 5, "", 'data-t="recognize" data-sel="recogSel"')}`)}
        ${panel("🚨 Crisis management", `${tact("chanc", "Mobilise resources", 5, "", 'data-t="mobilize"')}${tact("chanc", "Address the Senate", 3, "", 'data-t="address_senate"')}${tact("chanc", "Address the public", 3, "", 'data-t="address_public"')}`)}
    </div></div>`;
}

function cityDesk() {
    return `<div class="cols"><div class="col-main">
        ${panel("🏙️ City services", `<div class="statrow"><span>City budget</span><b>${G.cityFunds.toFixed(1)}M</b></div><p class="muted small">Each improvement costs 1.5M from the city budget and 3 capital. It refills slowly.</p>
            <div class="grid3">${CITY_SERVICES.map(s => `<button class="tactic" data-act="city" data-k="${s.key}" ${G.ap < 3 || G.cityFunds < 1.5 ? "disabled" : ""}>${s.icon} ${s.name}<span>${effectHints({ p: s.fx, g: s.g })}</span></button>`).join("")}</div>`)}
    </div><div class="col-side">
        ${panel("📨 Beyond your authority", `
            ${noAuth("⚔️ Declare war on the Separatists", "Petition the planetary government for military assistance.")}
            ${noAuth("💳 Set planetary taxes", "Petition the planetary government.")}
            ${tact("petitionup", "Petition the planetary government for funding", 3, "", 'data-w="funds"')}
            ${tact("petitionup", "Petition the planetary government for protection", 3, "", 'data-w="defence"')}`)}
    </div></div>`;
}

function undergroundDesk() {
    return `<div class="cols"><div class="col-main">${panel("✊ The Rebellion", `${statRow("Rebellion strength", Math.round(G.rebellion), G.rebellion, "good")}${statRow("Imperial attention", Math.round(G.isb || 0) + Math.round(G.heat), Math.min(100, (G.isb || 0) + G.heat), "bad")}
        ${tact("rebel", "Recruit cells", 3, "", 'data-t="recruit"')}${tact("rebel", "Sabotage an Imperial project", 5, "Dangerous.", 'data-t="sabotage"')}${tact("rebel", "Fund the Alliance", 3, "1M credits.", 'data-t="fund"')}`)}</div>
        <div class="col-side">${rolePowers()}</div></div>`;
}


// ── Galaxy ────────────────────────────────────────────────────────

function galaxyPositions() {
    const all = { ...WORLDS, ...BACKGROUND_WORLDS };
    const pos = {};
    const rings = { core: [95, 0.2], mid: [185, 0.9], outer: [282, 0.35] };
    const byRegion = {};
    Object.entries(all).forEach(([k, w]) => { (byRegion[w.region] = byRegion[w.region] || []).push(k); });
    Object.entries(byRegion).forEach(([r, keys]) => {
        const [rad, off] = rings[r];
        keys.forEach((k, i) => {
            const a = off + i * Math.PI * 2 / keys.length;
            const wob = r === "outer" ? (i % 2 ? 1 : 0.9) : 1;
            pos[k] = { x: 420 + rad * 1.38 * wob * Math.cos(a), y: 322 + rad * wob * Math.sin(a) };
        });
    });
    return pos;
}

function viewGalaxy() {
    const pos = galaxyPositions();
    const sel = ui.worldSel || G.worldKey;
    const byAlign = G.era !== "republic";
    const nodes = Object.entries(pos).map(([k, p]) => {
        const s = G.galaxy[k];
        if (s.destroyed) return `<g class="gw" data-act="world" data-key="${k}"><path d="M${p.x - 6} ${p.y - 6} L${p.x + 6} ${p.y + 6} M${p.x + 6} ${p.y - 6} L${p.x - 6} ${p.y + 6}" stroke="#777" stroke-width="2"/><text x="${p.x}" y="${p.y + 22}" text-anchor="middle" class="gl dim">${worldName(k)}</text></g>`;
        const col = byAlign ? (ALIGN_COLORS[s.align] || "#888") : s.stability >= 60 ? "var(--for)" : s.stability >= 35 ? "var(--und)" : "var(--against)";
        const mine = k === G.worldKey;
        const playable = !!WORLDS[k];
        return `<g class="gw ${k === sel ? "sel" : ""}" data-act="world" data-key="${k}">
            ${mine ? `<circle cx="${p.x}" cy="${p.y}" r="17" fill="none" stroke="var(--accent)" stroke-width="2"><animate attributeName="r" values="14;19;14" dur="3s" repeatCount="indefinite"/></circle>` : ""}
            ${mine && (G.siege || G.occupied) ? `<circle cx="${p.x}" cy="${p.y}" r="24" fill="none" stroke="var(--against)" stroke-width="2" stroke-dasharray="3 3"/>` : ""}
            <circle cx="${p.x}" cy="${p.y}" r="${playable ? 9 : 6}" fill="${col}"/>
            <text x="${p.x}" y="${p.y + 22}" text-anchor="middle" class="gl ${playable ? "" : "dim"}">${worldName(k)}</text>
        </g>`;
    }).join("");
    const rings = `<ellipse cx="420" cy="322" rx="131" ry="95" class="ring"/><ellipse cx="420" cy="322" rx="255" ry="185" class="ring"/><ellipse cx="420" cy="322" rx="390" ry="282" class="ring"/>
        <text x="296" y="326" text-anchor="middle" class="rl">CORE</text><text x="172" y="326" text-anchor="middle" class="rl" transform="rotate(-90 172 326)">MID RIM</text><text x="40" y="326" text-anchor="middle" class="rl" transform="rotate(-90 40 326)">OUTER RIM</text>`;
    const legend = byAlign ? `<div class="legend">${Object.entries(ALIGN_NAMES).filter(([k]) => Object.values(G.galaxy).some(s => s.align === k)).map(([k, v]) => `<span><i style="background:${ALIGN_COLORS[k]}"></i>${v}</span>`).join("")}</div>` : `<div class="legend"><span><i style="background:var(--for)"></i>Stable</span><span><i style="background:var(--und)"></i>Strained</span><span><i style="background:var(--against)"></i>Unstable</span></div>`;
    const s = G.galaxy[sel];
    const w = WORLDS[sel] || BACKGROUND_WORLDS[sel];
    const sen = sel === G.worldKey && s.senatorId === "player" ? null : worldSenator(sel);
    const info = panel(`${worldName(sel)}${sel === G.worldKey ? " (home)" : ""}`, `
        ${w.govType ? `<p class="small">${esc(w.govType)} · ${esc(w.tagline)}</p>` : ""}
        <p class="small">Allegiance: <b style="color:${ALIGN_COLORS[s.align] || "#aaa"}">${ALIGN_NAMES[s.align] || s.align}</b>${s.destroyed ? ' · <b class="c-against">DESTROYED</b>' : ""}</p>
        ${statRow("Stability", Math.round(s.stability), s.stability)}
        ${statRow("Prosperity", Math.round(s.prosperity), s.prosperity)}
        ${statRow("Independence support", `${Math.round(s.indep)}%`, s.indep, "bad")}
        ${sen ? `<div class="mini-npc">${renderPortrait(sen.app, 44)}<div><b>${esc(sen.name)}</b><br><span class="small muted">${esc(sen.title)} · ${FACTIONS[sen.faction].name}</span> ${relBadge(sen.rel)}</div></div>` : s.senatorId === "player" ? "<p>You represent this world.</p>" : ""}
        ${sel !== G.worldKey && !s.destroyed ? tact("visit", "🚀 State visit", 3, "Improves relations with its senator.", `data-key="${sel}"`) : ""}`);
    const galStats = Object.entries(GAL_STATS).map(([k, d]) => statRow(`${d.icon} ${d.name}`, Math.round(G.gal[k]), G.gal[k], d.bad ? "bad" : "good")).join("")
        + (["empire", "rebellion"].includes(G.era) ? statRow("✊ Rebellion strength", Math.round(G.rebellion), G.rebellion, "good") : "")
        + statRow("🏦 Republic corruption", Math.round(G.repCorruption), G.repCorruption, "bad");
    const ch = chancellor();
    const facs = Object.entries(FACTIONS).map(([k, f]) => `<div class="statrow"><span>${f.icon} ${f.name}${k === G.ideology ? " (yours)" : ""}</span><b class="${G.factions[k] >= 0 ? "c-for" : "c-against"}">${fmt(G.factions[k])}</b></div>`).join("");
    return `<div class="era-banner"><b>${esc(ERAS[G.era].name)}</b> · ${esc(ERAS[G.era].note)}</div>
        <div class="cols"><div class="col-main">${panel("", `<svg class="galaxy" viewBox="0 0 840 644">${rings}${nodes}</svg>${legend}`, "webpanel")}${opinionPanel()}</div>
        <div class="col-side">${info}
        ${panel(["empire", "rebellion"].includes(G.era) ? "The Emperor" : "Supreme Chancellor", G.chancellorId === "player" ? "<p><b>You.</b></p>" : ch ? `<div class="mini-npc">${renderPortrait(ch.app, 44)}<div><b>${esc(ch.name)}</b><br><span class="small muted">${esc(ch.title)}</span> ${relBadge(ch.rel)}</div></div>${!G.chancLocked && G.era !== "empire" && G.hist.no_confidence ? `<p class="muted small">Next Chancellor election in ${G.chancTermLeft} months.</p>` : ""}` : "<p>Vacant.</p>")}
        ${panel("The galaxy", galStats)}
        ${panel("Your standing with the factions", facs)}</div></div>`;
}

function opinionPanel() {
    const o = G.opinion;
    const n = Math.max(0, 100 - o.loyal - o.sep);
    return panel(`Planetary opinion — ${esc(world().name)}`, `
        <div class="opinion-bar"><span style="width:${o.loyal}%;background:${ALIGN_COLORS.republic}"></span><span style="width:${n}%;background:${ALIGN_COLORS.neutral}"></span><span style="width:${o.sep}%;background:${ALIGN_COLORS.separatist}"></span></div>
        <div class="opinion"><div><b style="color:${ALIGN_COLORS.republic}">${Math.round(o.loyal)}%</b><span>Republic loyalists</span></div><div><b style="color:${ALIGN_COLORS.neutral}">${Math.round(n)}%</b><span>Neutral</span></div><div><b style="color:${ALIGN_COLORS.separatist}">${Math.round(o.sep)}%</b><span>Separatists</span></div></div>
        <p class="muted small">Your world: <b style="color:${ALIGN_COLORS[G.allegiance]}">${ALIGN_NAMES[G.allegiance]}</b>. Economic hardship, Republic corruption, blockades and occupation push separatism up; Republic aid pulls it down.</p>`);
}


// ── Network ───────────────────────────────────────────────────────

function npcCard(n) {
    const open = ui.npcOpen === n.id;
    const c = n.canon && CANON[n.canon];
    return `<div class="npc ${n.rel >= 35 ? "ally" : n.rel <= -30 ? "rival" : ""} ${c ? "canon" : ""}">
        <div class="npc-head" data-act="npc" data-id="${n.id}">
            ${renderPortrait(n.app, 48)}
            <div class="npc-id"><b>${esc(n.name)}</b>${c ? ' <span class="canon-tag">★</span>' : ""}<br><span class="muted small">${esc(n.title)} · ${FACTIONS[n.faction].icon} ${FACTIONS[n.faction].name} · influence ${Math.round(n.influence)}</span>
            ${c ? `<br><span class="small quote-line">“${esc(canonLine(n))}”</span>` : ""}</div>
            ${relBadge(n.rel)}
        </div>
        ${open ? `<div class="npc-body">
            ${c ? `<p class="small"><b>Ideology:</b> ${esc(c.ideology)} · <b>Wants:</b> ${esc(c.objectives.join("; "))} · <b>Fears:</b> ${esc(c.fears.join("; "))} · <b>Loyalty:</b> ${esc(c.loyalty)}</p>` : ""}
            <h4>They remember</h4>${n.memory.length ? `<ul class="small">${n.memory.map(m => `<li>${esc(m)}</li>`).join("")}</ul>` : '<p class="muted small">Nothing in particular — yet.</p>'}
            <div class="row">
                <button class="mini" data-act="meet" data-id="${n.id}" ${G.ap < 3 ? "disabled" : ""}>Private meeting · 3</button>
                <button class="mini" data-act="endorse" data-id="${n.id}" ${n.rel < 50 || n.endorsedTerm === G.termIndex || G.ap < 3 ? "disabled" : ""}>Ask for endorsement · 3</button>
                <button class="mini" data-act="leakrival" data-id="${n.id}" ${G.ap < 3 ? "disabled" : ""}>Leak dirt · 3</button>
                <button class="mini danger" data-act="denounce" data-id="${n.id}" ${G.ap < 3 ? "disabled" : ""}>Denounce · 3</button>
            </div></div>` : ""}
    </div>`;
}

function viewNetwork() {
    const people = livingNpcs().filter(n => n.arena !== "retired");
    // Your role decides which famous faces enter your life.
    const cat = roleCat();
    const visible = n => !n.canon || cat === "senate" || n.world === G.worldKey || n.arena === "jedi" && G.war || n.rel >= 20 || n.rel <= -20 || (cat === "gov" && ["galactic", "jedi"].includes(n.arena)) || n.id === G.chancellorId;
    const al = people.filter(n => n.rel >= 35 && visible(n)).sort((a, b) => b.rel - a.rel);
    const rv = people.filter(n => n.rel <= -30 && visible(n)).sort((a, b) => a.rel - b.rel);
    const figures = people.filter(n => n.canon && n.rel > -30 && n.rel < 35 && visible(n) && n.world !== G.worldKey);
    const home = people.filter(n => n.world === G.worldKey && n.rel > -30 && n.rel < 35);
    const others = people.filter(n => !n.canon && n.world !== G.worldKey && n.rel > -30 && n.rel < 35 && n.arena === "senate").sort((a, b) => b.influence - a.influence).slice(0, 20);
    const f = G.family;
    const fam = `${f.spouse ? `<p>Spouse: <b>${esc(f.spouse.name)}</b>${f.spouse.alive ? "" : " (deceased)"}</p>` : "<p>Unmarried.</p>"}
        ${f.children.length ? `<ul class="small">${f.children.map(c => `<li>${esc(c.name)}, ${c.age}${c.inPolitics ? " — in politics" : ""}</li>`).join("")}</ul>` : '<p class="muted small">No children.</p>'}`;
    const secrets = G.secrets.length ? `<ul class="small">${G.secrets.map(s => `<li class="${s.exposed ? "c-against" : ""}">${esc(s.text)}${s.exposed ? " — EXPOSED" : ""}</li>`).join("")}</ul>` : '<p class="muted small">None. Yet.</p>';
    return `<div class="cols"><div class="col-main">
        ${panel(`Allies (${al.length})`, al.map(npcCard).join("") || '<p class="muted">None.</p>')}
        ${panel(`Rivals (${rv.length})`, rv.map(npcCard).join("") || '<p class="muted">None.</p>')}
        ${panel(`${world().name}`, home.map(npcCard).join("") || '<p class="muted">—</p>')}
        ${figures.length ? panel("★ Figures of the age", figures.map(npcCard).join("")) : ""}
        ${cat === "senate" ? panel("The wider Senate", others.map(npcCard).join("")) : ""}
    </div><div class="col-side">
        ${panel(esc(G.name), `<div class="self-portrait">${renderPortrait(G.app, 150)}</div>${statRow("Species", SPECIES[G.app.species].name)}${statRow("Age", G.age)}${statRow("Health", Math.round(G.health), G.health, "good")}${statRow("Reputation", Math.round(G.rep), G.rep)}${statRow("Philosophy", `${FACTIONS[G.ideology].icon} ${FACTIONS[G.ideology].name}`)}<p class="muted small">“${FACTIONS[G.ideology].motto}”</p>${statRow("Chief of staff", esc(G.chiefOfStaff))}`)}
        ${panel("Family", fam)}
        ${panel("🤫 Secrets", secrets)}
        ${panel("", `<button class="secondary" data-act="retire">🕯️ Retire and pass the torch</button>`)}
    </div></div>`;
}


// ── Archive: the historical record ────────────────────────────────

function historyRecord() {
    const r = G.record;
    const byName = {};
    r.offices.forEach(o => { (byName[o.name] = byName[o.name] || []).push(o); });
    const title = ["empire", "rebellion"].includes(G.era) ? "HISTORY OF THE GALACTIC EMPIRE" : G.era === "newrepublic" ? "HISTORY OF THE NEW REPUBLIC" : "HISTORY OF THE GALACTIC REPUBLIC";
    const vote = v => ({ for: "Supported", against: "Opposed", abstain: "Abstained on", signed: "Signed", refused: "Refused to sign", denounced: "Denounced", supported: "Supported" }[v] || v);
    const legacy = G.programs.map(p => `${p.name} (founded by ${p.founder})`).concat(G.amendments.map(a => `Amendment: ${a.title} (${a.by})`));
    return `<div class="record">
        <div class="record-title">${title}</div>
        ${Object.entries(byName).map(([name, offs]) => `<h2>${esc(name)}</h2><ul>${offs.map(o => `<li>Served as ${esc(o.title)}${o.title.includes(o.world) ? "" : ` of ${esc(o.world)}`}, ${eraYear(o.from)}–${o.to == null ? "present" : eraYear(o.to)}.</li>`).join("")}</ul>`).join("")}
        <ul>
            <li>Introduced ${r.billsIntroduced} piece${r.billsIntroduced === 1 ? "" : "s"} of legislation; ${r.billsPassed} passed.</li>
            <li>Secured ${(r.appropriations / 1000).toFixed(1)} billion credits in Republic appropriations.</li>
            ${r.keyVotes.map(v => `<li>${vote(v.vote)} the ${esc(v.title)} (${eraYear(v.year)}).</li>`).join("")}
            ${r.agreements.map(a => `<li>${esc(a)}.</li>`).join("")}
            ${r.arrests.map(a => `<li class="c-against">Arrested: ${esc(a)}.</li>`).join("")}
        </ul>
        ${legacy.length ? `<p><b>Legacy:</b> ${legacy.map(esc).join("; ")}.</p>` : ""}
    </div>`;
}

function viewArchive() {
    const types = ["all", "history", "career", "legislation", "legacy", "betrayal", "scandal", "world", "year", "event"];
    const logs = G.chronicle.filter(e => ui.logFilter === "all" || e.type === ui.logFilter).slice(0, 150).map(e => `<p><span class="muted small">${e.date}</span> ${esc(e.text)}</p>`).join("");
    const dyn = G.dynasty.map(d => `<li><b>${esc(d.name)}</b> <span class="muted">Gen ${d.generation} · ${yearLabel(d.from)}–${d.end ? yearLabel(d.end) : "present"}</span><br><span class="small">${d.offices.map(esc).join(" → ")}</span>${d.reason ? `<br><span class="muted small">${esc(d.reason)}</span>` : ""}</li>`).join("");
    const progs = G.programs.map(p => `<li><b>${esc(p.name)}</b> — ${p.left} of ${p.years} years left <span class="muted">(founded by ${esc(p.founder)})</span></li>`).join("");
    return `<div class="cols"><div class="col-main">
        ${panel("", historyRecord(), "record-panel")}
        ${panel("Chronicle", `<div class="tabs">${types.map(t => `<button class="tab ${ui.logFilter === t ? "active" : ""}" data-act="logf" data-t="${t}">${t}</button>`).join("")}</div><div class="log">${logs || '<p class="muted">Nothing here.</p>'}</div>`)}
    </div><div class="col-side">
        ${panel("The dynasty", `<ol class="dynasty-list">${dyn}</ol>`)}
        ${panel("Living legacy", progs ? `<ul class="small">${progs}</ul>` : '<p class="muted small">No long-term programmes running.</p>')}
    </div></div>`;
}
