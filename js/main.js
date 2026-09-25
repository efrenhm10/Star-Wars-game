// ── MAIN — boot and input ───────────────────────────────────────────

const selectedBill = () => G.bills.find(b => b.id === ui.bill);
const selVal = id => { const el = document.getElementById(id); return el ? el.value : null; };

const ACTIONS = {
    view: d => { view = d.v; ui.policy = null; render(); window.scrollTo(0, 0); },
    dossier: d => resolveDossier(d.uid, +d.i),
    scene: d => sceneChoose(+d.i),

    bill: d => { ui.bill = d.id; render(); },
    vote: d => setVote(selectedBill(), d.v),
    persuade: d => persuade(selectedBill(), npc(d.id)),
    favor: d => promiseFavor(selectedBill(), npc(d.id)),
    trade: d => tradeVotes(selectedBill(), npc(d.id)),
    speech: () => giveSpeech(selectedBill()),
    amend: () => amendBill(selectedBill()),
    leak: () => leakBill(selectedBill()),
    committee: () => sendToCommittee(selectedBill()),
    introduce: d => introduceBill(d.key),

    web: d => { ui.web = d.w; ui.policy = null; render(); },
    webnode: d => { ui.policy = ui.policy === d.node ? null : d.node; render(); },
    setpolicy: d => setPolicy(d.key, +selVal("policySlider") / 100, d.gal === "1"),
    policybill: d => proposePolicyBill(d.key, +selVal("policySlider") / 100),
    fund: d => d.src ? fundraise(d.src) : secureFunding(selVal("fundSel")),
    role: d => roleAction(d.type, d.group ? selVal("groupSel") : d.npc ? selVal("npcSel") : d.world ? selVal("worldSel") : d.type === "clan" ? selVal("clanSel") : d.arg),
    run: d => runForOffice(+d.i),

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

    pickworld: d => renderWorldSetup(d.key),
    pickrole: d => beginCareer(+d.i)
};

document.addEventListener("click", e => {
    const el = e.target.closest("[data-act]");
    if (!el || el.disabled) return;
    const fn = ACTIONS[el.dataset.act];
    if (fn) fn(el.dataset);
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

function beginCareer(roleIndex) {
    const name = ($("#playerName").value || "").trim() || randomName(ui.setupWorld);
    const ideology = $("#playerIdeology").value;
    newCareer({ worldKey: ui.setupWorld, roleIndex, name, ideology });
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
        if (loadGame()) { view = "office"; showScreen("play"); render(); }
    });
    $("#backToWorlds").addEventListener("click", () => showScreen("worlds"));
    $("#backToBoot").addEventListener("click", () => showScreen("boot"));
    $("#menuBtn").addEventListener("click", quitToMenu);
}

boot();
