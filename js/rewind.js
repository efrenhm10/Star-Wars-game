// Galactic Senate — Rewinding time
// ---------------------------------------------------------------------------
// Checkpoints are saved at every New Year and just before an arrest. Any of
// them can be restored from the Archive. Saves made before checkpoints
// existed get one emergency option: go back to a year before the Empire,
// restored to the last government office you held.

const CHECKPOINT_KEY = "galactic-senate/checkpoints";
const GOV_KINDS = ["executive", "monarch", "hereditary", "council", "traditional", "clan"];

function loadCheckpoints() {
    try { return JSON.parse(localStorage.getItem(CHECKPOINT_KEY) || "[]"); } catch (e) { return []; }
}

function saveCheckpoint(why) {
    if (!G || !G.record) return;
    const list = loadCheckpoints();
    const cp = { id: Date.now(), name: G.name, career: G.dynasty.length, label: `${eraYear(currentBBY())}, Month ${G.month} — ${G.office.title}`, why, data: { G, npcCounter } };
    let out = [cp, ...list].slice(0, 6);
    // Storage is limited; drop the oldest until it fits.
    while (out.length) {
        try { localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(out)); return; } catch (e) { out = out.slice(0, -1); }
    }
}

function restoreCheckpoint(id) {
    const cp = loadCheckpoints().find(c => c.id === id);
    if (!cp) return toast("Checkpoint missing", "That checkpoint is no longer stored on this device.");
    G = cp.data.G;
    npcCounter = cp.data.npcCounter || npcCounter;
    G.scenes = [];
    log(`⏪ Time rewound to ${cp.label}.`, "career");
    saveGame();
    view = "office";
    render();
    toast("Time rewound", cp.label);
}

// The last government office held, from this career's record.
function lastGovSpec() {
    if (G.lastGovSpec) return G.lastGovSpec;
    const roles = world().roles.filter(r => GOV_KINDS.includes(r.kind));
    for (let i = G.officesHeld.length - 1; i >= 0; i--) {
        const r = roles.find(x => x.title === G.officesHeld[i]);
        if (r) return { ...r };
    }
    return null;
}

function canRewindBeforeEmpire() {
    return currentBBY() < 20 && !G.rewoundEmpire;
}

// Offices you can return to: your last one first, then the world's other governing roles.
function rewindRoles() {
    const last = lastGovSpec();
    const roles = world().roles.filter(r => GOV_KINDS.includes(r.kind)).map(r => ({ ...r }));
    if (last && !roles.some(r => r.title === last.title)) roles.unshift(last);
    return roles.sort((a, b) => (last && b.title === last.title ? 1 : 0) - (last && a.title === last.title ? 1 : 0));
}

function rewindBeforeEmpire(title) {
    const spec = rewindRoles().find(r => r.title === title) || rewindRoles()[0];
    if (!spec) return;
    const yearsBack = G.year - 13;
    G.year = 13; G.month = 5;
    G.age -= yearsBack;
    G.family.children.forEach(c => { c.age = Math.max(0, c.age - yearsBack); });
    HISTORY.filter(e => e.bby < 20 || (e.bby === 20 && e.m > 5)).forEach(e => { delete G.hist[e.id]; });
    G.era = "war"; G.war = true;
    G.imperial = null; G.revolt = null; G.ug = null; G.secretRebel = false; G.signed2000 = false;
    G.isb = 0; G.wrath = Math.min(G.wrath || 0, 15); G.rebellion = 0; G.liberties = Math.min(G.liberties, 20);
    G.siege = null; G.occupied = null; G.petition = null;
    G.allegiance = world().canonAlign === "hutt" ? "hutt" : "republic";
    G.reb = null;
    if (G.forces && G.forces.under !== "planetary") G.forces = null;
    if (G.galConst) G.galConst.emergency = true;
    Object.entries(G.galaxy).forEach(([k, s]) => {
        const canon = (WORLDS[k] || BACKGROUND_WORLDS[k] || {}).canonAlign;
        if (["empire", "rebel"].includes(s.align)) s.align = canon === "separatist" ? "separatist" : canon === "hutt" ? "hutt" : "republic";
        s.destroyed = false;
    });
    G.galaxy[G.worldKey].align = G.allegiance;
    ["amidala", "dooku", "gunray", "sanHill", "poggle", "anakin", "kenobi", "ahsoka", "satine", "bail", "breha", "farr"].forEach(k => { const n = canonNpc(k); if (n) n.alive = true; });
    const pal = canonNpc("palpatine");
    if (pal) { pal.alive = true; pal.title = "Supreme Chancellor"; pal.influence = 85; pal.arena = "senate"; G.chancellorId = pal.id; }
    if (G.demo) G.demo.hist = G.demo.hist.filter(h => h.year <= 13);
    G.health = Math.max(G.health, 70);
    // Undo the Empire's tithes and the deficits run up while you were gone.
    const t0 = G.treasury;
    G.treasury = G.treasuryAtEmpire != null ? Math.max(G.treasury, G.treasuryAtEmpire) : Math.max(G.treasury, 0);
    if (G.treasury > t0) log(`⏪ The Imperial debt is undone: treasury ${t0.toFixed(1)}B → ${G.treasury.toFixed(1)}B.`, "career");
    G.scenes = [];
    setOffice(makeOffice({ ...spec, fresh: true }));
    G.rewoundEmpire = true;
    G.record.agreements.push(`Returned to office as ${spec.title} (20 BBY)`);
    log(`⏪ Time rewound to 20 BBY. You are ${spec.title} again. The Empire is a year away.`, "career");
    saveGame();
    view = "office";
    render();
    toast("Back to 20 BBY", `You are ${spec.title} again. The Empire will be declared in 19 BBY, Month 5.`);
}

function rewindPanel() {
    const list = loadCheckpoints().filter(c => c.name === G.name);
    const rows = list.map(c => `<div class="haven"><div><b>${esc(c.label)}</b><p class="small muted">${esc(c.why)}</p></div><button class="mini" data-act="restorecp" data-k="${c.id}">Rewind</button></div>`).join("");
    const last = lastGovSpec();
    const rescue = canRewindBeforeEmpire() ? `<h4>Go back to 20 BBY — a year before the Empire</h4><p class="small">Your planet, treasury, laws and relationships stay as they are now; the Empire, any arrest and everything since are undone. Pick the office to return to:</p>`
        + rewindRoles().map(r => `<div class="haven"><div><b>${esc(r.title)}</b>${last && r.title === last.title ? ' <span class="hint up">your last office</span>' : ""}</div><button class="mini" data-act="rewindempire" data-k="${esc(r.title)}">⏪ Go back</button></div>`).join("") : "";
    if (!rows && !rescue) return panel("⏪ Rewind", `<p class="muted small">A checkpoint is saved every New Year and just before an arrest. They'll appear here.</p>`);
    return panel("⏪ Rewind", `<p class="small">Checkpoints are saved every New Year and just before an arrest (up to six, on this device).</p>${rescue}${rows}`);
}

HISTORY.push({ bby: 19, m: 5, id: "empire_ledger", run: () => { G.treasuryAtEmpire = G.treasury; } });
