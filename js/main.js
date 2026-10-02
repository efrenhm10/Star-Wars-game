// ── MAIN — boot and input ───────────────────────────────────────────

const selectedBill = () => G.bills.find(b => b.id === ui.bill);
const selVal = id => { const el = document.getElementById(id); return el ? el.value : null; };

const ACTIONS = {
    view: d => { view = d.v; ui.policy = null; if (d.v === "government" && G.office.kind === "chancellor") ui.web = "galaxy"; render(); window.scrollTo(0, 0); },
    dossier: d => resolveDossier(d.uid, +d.i),
    scene: d => sceneChoose(+d.i),

    arena: d => { ui.arenaSel = d.a; ui.bill = null; render(); },
    bill: d => { ui.bill = d.id; render(); },
    vote: d => setVote(selectedBill(), d.v),
    persuade: d => persuade(selectedBill(), npc(d.id)),
    favor: d => promiseFavor(selectedBill(), npc(d.id)),
    trade: d => tradeVotes(selectedBill(), npc(d.id)),
    speech: () => giveSpeech(selectedBill()),
    amend: () => amendBill(selectedBill()),
    leak: () => leakBill(selectedBill()),
    committee: () => sendToCommittee(selectedBill()),
    introduce: d => { introduceBill(d.key); },
    lobbychair: () => lobbyChair(selectedBill()),
    fasttrack: () => fastTrack(selectedBill()),
    bury: () => buryBill(selectedBill()),

    web: d => { ui.web = d.w; ui.policy = null; render(); },
    webnode: d => { ui.policy = ui.policy === d.node ? null : d.node; render(); },
    setpolicy: d => setPolicy(d.key, +selVal("policySlider") / 100, d.gal === "1"),
    policybill: d => proposePolicyBill(d.key, +selVal("policySlider") / 100),
    fund: d => fundraise(d.src),
    role: d => roleAction(d.type, d.group ? selVal("groupSel") : d.npc ? selVal("npcSel") : d.world ? selVal("worldSel") : d.type === "clan" ? selVal("clanSel") : d.arg),
    run: d => runForOffice(+d.i),

    // Powers
    assign: d => requestAssignment(d.k),
    seekchair: d => seekChair(d.k),
    earmark: d => requestEarmark(+d.i),
    "earmark-do": d => earmarkAction(+d.e, d.t, d.sel ? selVal(d.sel) : null),
    hearing: () => senatorAction("hearing", selVal("hearingSel")),
    investigation: () => senatorAction("investigation"),
    inquiry: () => senatorAction("inquiry"),
    milreview: () => senatorAction("milreview"),
    bloc: d => senatorAction("bloc", d.k),
    sanctions: d => senatorAction("sanctions", d.k),
    treaty: () => senatorAction("treaty"),
    intervention: () => senatorAction("intervention", selVal("interventionSel")),
    exec: d => execAction(d.t, d.sel ? selVal(d.sel) : null),
    court: d => courtAction(d.t, d.sel ? selVal(d.sel) : null),
    chanc: d => chancelleryAction(d.t, d.pair ? `${selVal("minSel")}:${selVal("minNpc")}` : d.sel ? selVal(d.sel) : null),
    city: d => cityService(d.k),
    petitionup: d => petitionUp(d.w),
    petition: () => startPetition(),
    rebel: d => rebelAction(d.t),
    forces: d => forcesAction(d.t),
    battle: d => launchBattle(d.t, d.k),
    mission: d => startMission(d.t),
    recruitagent: () => recruitAgent(),
    flee: d => fleeTo(d.k),
    raisehome: () => raiseHome(),
    declarerevolt: () => declareRevolt(),
    probe: d => probeChancellor(d.t),
    govtab: d => { ui.govTab = d.t; render(); },
    lawpick: d => { ui.govTab = "web"; ui.policy = `p:${d.key}`; render(); },
    adjustpolicy: d => adjustPolicy(d.key, +d.d),
    repealbill: d => proposePolicyBill(d.key, 0),
    submitbudget: () => submitBudget(),
    cipmove: d => cipMove(+d.i, +d.d),
    cipremove: d => cipRemove(+d.i),
    approvecip: () => approveCip(),
    pkgnew: d => { ui.pkg = pkgDefaults(d.t); render(); },
    pkgsubmit: () => submitPackage(ui.pkg),
    pkgcancel: () => { ui.pkg = null; render(); },
    pkgneg: d => { const b = selectedBill(); if (b) pkgNegotiate(b, d.h, d.sel ? selVal(d.sel) : null); },
    pg: d => pgAction(d.k, d.t),
    tradesel: d => { ui.tradeSel = d.k; render(); },
    trademission: d => tradeMission(d.k),
    tradedeal: d => negotiateDeal(d.k),
    tradecancel: d => cancelDeal(d.id),
    gotrade: () => { view = "government"; ui.govTab = "trade"; render(); },
    govresist: d => govResist(d.t),
    advisor: d => replaceAdvisor(d.k),
    infra: d => buildInfra(d.k, d.u, d.h),
    courtfirm: d => courtCompany(d.k),
    sectorbuild: d => { ui.sectorOpen = d.k; buildSectorAsset(d.k, d.a, "cip"); },
    offer: d => setOffer(d.f, d.v),
    closedeal: () => closeDeal(),
    planlocal: d => planLocal(d.k),
    localsup: d => { if (G.localPlan) { G.localPlan.support = d.v; render(); } },
    launchlocal: () => launchLocal(),
    droplocal: () => { G.localPlan = null; render(); },
    expandlocal: d => expandLocal(+d.i),
    visittrade: d => { if (!governing()) return toast("Not your call", "Only the planetary government negotiates trade. You can still pay a state visit."); tradeMission(d.key); if (G.trade && G.trade.missions[d.key] === monthsNow()) { view = "government"; ui.govTab = "trade"; ui.tradeSel = d.key; render(); } },
    flyceo: () => flyToCeo(),
    dropdeal: () => { if (G.prospect) report("You walk away", `${G.prospect.firm} goes elsewhere.`); G.prospect = null; render(); },
    train: () => trainWorkforce(),
    gobudget: () => { view = "government"; ui.govTab = "budget"; render(); },
    request: d => requestAction(+d.i, d.t),
    bailout: () => askBailout(),
    sellbonds: d => sellBonds(+d.v),
    pbstep: d => { const [, c] = d.f.split(":"); const cur = G.pbudget.draft.cats[c] || 1; setDraft(d.f, Math.round((cur + +d.d) * 10) / 10); render(); },
    pbset: d => { setDraft(d.f, d.v); render(); },
    hold: d => { const b = G.bills.find(x => x.id === d.id) || selectedBill(); if (b) holdBill(b); },
    release: d => { const b = G.bills.find(x => x.id === d.id) || selectedBill(); if (b) releaseBill(b, false); },
    releaseprice: d => { const b = G.bills.find(x => x.id === d.id) || selectedBill(); if (b) releaseBill(b, true); },
    oversight: () => chairOversight(),
    whip: () => whipBloc(),
    resist: d => resistAction(d.t),
    ministry: d => ministryAction(d.t),
    evidence: d => useEvidence(d.t),
    safety: d => safetyAction(d.t),
    revolt: d => revoltAction(d.t),

    interview: d => interview(d.key),
    press: () => pressConference(),
    district: d => campaignDistrict(+d.i, d.t),
    attackad: () => attackAd(),

    world: d => { ui.worldSel = d.key; render(); },
    visit: d => visitWorld(d.key),

    npc: d => { ui.npcOpen = ui.npcOpen === d.id ? null : d.id; render(); },
    meet: d => meetNpc(d.id),
    endorse: d => seekEndorsement(d.id),
    leakrival: d => leakOnRival(d.id),
    denounce: d => denounce(d.id),
    retire: () => { if (confirm("Retire and hand the family's cause to a successor?")) retire(); },

    "amend-start": d => startAmendment(d.key),
    "amend-do": d => amendmentAction(d.t),
    "amend-vote": () => callAmendmentVote(),

    logf: d => { ui.logFilter = d.t; render(); },

    // Agenda
    issue: d => resolveIssue(d.uid, d.a),
    hometour: () => homeTour(),
    special: d => specialAction(d.t),
    "builder-open": d => { openBuilderFor(null); if (d.scope && ui.builder) { ui.builder.scope = d.scope; render(); } },
    "builder-cancel": () => { ui.builder = null; ui.builderIssue = null; render(); },
    "builder-submit": () => submitBuilder(ui.builder, ui.builderIssue),
    gobill: d => { const b = G.bills.find(x => x.id === d.id); if (b) { ui.bill = b.id; ui.arenaSel = b.arena; view = "chamber"; render(); } },

    // Setup
    pickworld: d => { ui.app = null; renderWorldSetup(d.key); },
    pickrole: d => { ui.roleIndex = +d.i; ui.app = null; renderCreator(); },
    species: d => { const keep = ui.app; ui.app = randomAppearance(d.s); ui.app.attire = keep.attire; ui.app.accessory = ["headdress", "helmet", "hood", "circlet"].includes(keep.accessory) ? keep.accessory : "none"; ui.app.age = keep.age; $("#playerName").value = randomName(ui.setupWorld, d.s); renderCreator(); },
    app: d => { ui.app[d.f] = d.v; renderCreator(); },
    randomlook: () => { const s = ui.app.species; const keep = ui.app.attire; ui.app = randomAppearance(s); ui.app.attire = keep; ui.app.marks = s === "dathomirian" ? "tattoo" : pick(["none", "none", "freckles", "scar", "tattoo"]); renderCreator(); },
    rename: () => { $("#playerName").value = randomName(ui.setupWorld, ui.app.species); },
    begin: () => beginCareer()
};

document.addEventListener("click", e => {
    const el = e.target.closest("[data-act]");
    if (!el || el.disabled) return;
    const fn = ACTIONS[el.dataset.act];
    if (fn) fn(el.dataset);
});

document.addEventListener("change", e => {
    const ds = e.target.dataset || {};
    if (ds.pb && G.pbudget && G.pbudget.draft) { setDraft(ds.pb, e.target.value); render(); return; }
    if (ds.pkc && ui.pkg) { ui.pkg.comps = e.target.checked ? ui.pkg.comps.concat(ds.pkc) : ui.pkg.comps.filter(x => x !== ds.pkc); render(); return; }
    if (ds.pkf && ui.pkg) { const [a, b2] = ds.pkf.split(":"); if (a === "fund") ui.pkg.funding[b2] = +e.target.value; else ui.pkg[a] = a === "years" ? +e.target.value : e.target.value; render(); return; }
    if (ds.tt) { const T = initTrade(); T.terms = e.target.checked ? T.terms.concat(ds.tt) : T.terms.filter(x => x !== ds.tt); render(); return; }
    const bf = e.target.dataset && e.target.dataset.bf;
    if (bf && ui.builder) { ui.builder[bf] = ["amount", "years"].includes(bf) ? +e.target.value : e.target.value; render(); return; }
    const bp = e.target.dataset && e.target.dataset.bp;
    if (bp && ui.builder) { const s = new Set(ui.builder.provisions); if (e.target.checked) s.add(bp); else s.delete(bp); ui.builder.provisions = [...s]; render(); return; }
    const f = e.target.dataset && e.target.dataset.appf;
    if (f && ui.app) {
        ui.app[f] = f === "feature" ? +e.target.value : e.target.value;
        renderCreator();
    }
});

document.addEventListener("input", e => {
    if (e.target.id !== "policySlider") return;
    const lvl = +e.target.value / 100;
    const gal = ui.web === "galaxy";
    const out = document.getElementById("slv");
    if (out) out.textContent = `${e.target.value}%`;
    const cost = document.getElementById("pcost");
    if (cost) cost.textContent = `${policyChangeCost(e.target.dataset.key, lvl, gal)} capital`;
});

document.addEventListener("click", e => {
    if (e.target.id === "endMonth" && !e.target.disabled) {
        endMonth();
        render();
    }
});

function beginCareer() {
    const name = ($("#playerName").value || "").trim() || randomName(ui.setupWorld, ui.app.species);
    const ideology = $("#playerIdeology").value;
    newCareer({ worldKey: ui.setupWorld, roleIndex: ui.roleIndex, name, ideology, app: { ...ui.app } });
    view = "office";
    showScreen("play");
    render();
    saveGame();
}

function quitToMenu() {
    saveGame();
    G = null;
    $("#scene").innerHTML = "";
    $("#scene").className = "";
    delete document.body.dataset.lens;
    $("#continueBtn").style.display = hasSave() ? "" : "none";
    showScreen("boot");
}

function boot() {
    $("#playerIdeology").innerHTML = Object.entries(FACTIONS).map(([k, f]) => `<option value="${k}">${f.icon} ${f.name}</option>`).join("");
    const motto = () => { $("#ideologyMotto").textContent = `“${FACTIONS[$("#playerIdeology").value].motto}”`; };
    $("#playerIdeology").addEventListener("change", motto);
    motto();

    $("#continueBtn").style.display = hasSave() ? "" : "none";
    $("#newBtn").addEventListener("click", () => { renderWorldPicker(); showScreen("worlds"); });
    $("#continueBtn").addEventListener("click", () => {
        if (loadGame() && G.record) {
            // Bring older saves up to date.
            G.issues = G.issues || []; G.laws = G.laws || []; G.completedBills = G.completedBills || {}; initEmpireState(); initLawbook(); initTrade(); if (G.worldKey && G.planet) initDemo();
            if (world().special && G.assembly == null && G.lendingRate == null && G.intel == null && G.food == null && G.corpPower == null) initSpecial();
            view = "office"; showScreen("play"); render();
        }
        else toast("Old save", "That save is from an earlier version of the game. Start a new career.");
    });
    $("#backToWorlds").addEventListener("click", () => showScreen("worlds"));
    $("#backToBoot").addEventListener("click", () => showScreen("boot"));
    $("#backToRoles").addEventListener("click", () => renderWorldSetup(ui.setupWorld));
    $("#menuBtn").addEventListener("click", quitToMenu);
}

boot();
