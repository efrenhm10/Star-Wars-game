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
    if (!confirm(`Rewind to ${cp.label}? Everything since then will be undone.`)) return;
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
    return currentBBY() < 20 && !G.rewoundEmpire && !!lastGovSpec() && !(GOV_KINDS.includes(G.office.kind) && !isEmpireEra());
}

function rewindBeforeEmpire() {
    const spec = lastGovSpec();
    if (!spec) return;
    if (!confirm(`Go back to 20 BBY — one year before the Empire — as ${spec.title}? Your planet, treasury, laws and relationships stay as they are now; the Empire and everything since is undone.`)) return;
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
    const rescue = canRewindBeforeEmpire() ? `<div class="haven"><div><b>20 BBY — a year before the Empire</b><p class="small">Back in office as <b>${esc(lastGovSpec().title)}</b>. Your planet, treasury, laws and relationships stay as they are now; the Empire, your arrest and everything since are undone. Once per career.</p></div><button class="mini" data-act="rewindempire">Go back</button></div>` : "";
    if (!rows && !rescue) return panel("⏪ Rewind", `<p class="muted small">A checkpoint is saved every New Year and just before an arrest. They'll appear here.</p>`);
    return panel("⏪ Rewind", `<p class="small">Checkpoints are saved every New Year and just before an arrest (up to six, on this device).</p>${rescue}${rows}`);
}
