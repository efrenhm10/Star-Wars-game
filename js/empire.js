// ── THE DARK TIMES — the Chancellor's enemies, the Emperor's purge, the resistance ──
//
// Palpatine does not forget. Opposing him — investigating him, hauling his office
// before committees, refusing him, speaking out — draws his attention ("wrath").
// Before the war he answers with warnings and smears; once the war begins, and
// under the Empire, he answers with killers and the ISB.

function initEmpireState() {
    if (G.wrath == null) G.wrath = 0;
    if (!G.probe) G.probe = { progress: 0, clues: [], sources: 0 };
    if (G.security == null) G.security = 0;
    if (!G.threat) G.threat = {};
    if (!G.fallen) G.fallen = [];
    if (G.truth == null) G.truth = 0;
}

function palNpc() { return canonNpc("palpatine"); }
function palAlive() { const p = palNpc(); return !!(p && p.alive) && G.era !== "newrepublic"; }
function palIsChancellor() { const p = palNpc(); return palAlive() && G.chancellorId === p.id && !isEmpireEra(); }
function isEmpireEra() { return ["empire", "rebellion"].includes(G.era); }
function rulerTitle() { return isEmpireEra() ? "the Emperor" : "the Chancellor"; }
function isUnderground() { return !!G.ug && G.office.kind === "outsider" && /Rebel/.test(G.office.sub || ""); }
function inImperialPrison() { return G.office.kind === "outsider" && G.office.sub === "Prisoner"; }

function danger() { initEmpireState(); return clamp(G.wrath + (G.isb || 0) * 0.5 + (G.secretRebel ? 8 : 0)); }
const DANGER_LEVELS = [[0, "Unnoticed"], [15, "Noticed"], [30, "Watched"], [50, "Marked"], [70, "Hunted"]];
function dangerLabel(d = danger()) { return DANGER_LEVELS.filter(([t]) => d >= t).pop()[1]; }
function dangerPill() {
    if (!palAlive() || danger() < 15) return "";
    const d = danger();
    return ` · <span class="danger-pill ${d >= 50 ? "hot" : ""}" title="How much ${rulerTitle()} wants you gone">☠️ ${dangerLabel(d)}</span>`;
}

function addWrath(n, why) {
    if (!palAlive()) return;
    initEmpireState();
    G.wrath = clamp(G.wrath + n);
    if (why && n >= 8) log(`👁️ ${why}`, "danger");
}

function fallen(name, how) {
    initEmpireState();
    G.fallen.unshift({ name, how, year: eraYear(currentBBY()) });
    if (G.fallen.length > 30) G.fallen.length = 30;
}


// ── Investigating the Chancellor ──────────────────────────────────

const PROBE_CLUES = [
    { at: 20, title: "Who profited from the blockade?", text: () => "Trade Federation records show that Viceroy Gunray received assurances from someone called “Lord Sidious” before the Naboo blockade — the crisis that made Palpatine Chancellor." },
    { at: 40, title: "The money trail", text: () => currentBBY() <= 22 ? "Chancellery accounts paid for the clone army on Kamino long before the Senate authorised it. The order was placed in the name of a dead Jedi, Sifo-Dyas." : "Credits from the Chancellor's discretionary accounts flow through shell companies to a world that appears on no star chart." },
    { at: 60, title: "The Serenno channel", text: () => currentBBY() <= 24 ? "Encrypted transmissions pass between 500 Republica and Count Dooku's estate on Serenno — the leader of the Separatists is talking to the Chancellor's own residence." : "Encrypted transmissions pass between 500 Republica and a private estate on Serenno." },
    { at: 80, title: "Every crisis, a new power", text: () => "The name “Darth Sidious” appears in intercepted Separatist traffic — each time weeks before a crisis that hands the Chancellor more power." },
    { at: 100, title: "The truth", text: () => "The Chancellor and Darth Sidious are the same man. Both sides of the war answer to him. You are holding the greatest secret in the galaxy — and almost nobody will believe you." }
];

function canProbe() {
    if (!palIsChancellor() || G.office.kind === "chancellor") return false;
    return roleCat() === "senate" || ["Journalist", "Activist"].includes(G.office.sub);
}

function probeChancellor(how) {
    initEmpireState();
    const p = G.probe;
    if (p.progress >= 100) return toast("You already know", "There is nothing left to find. The question is what you do with it.");
    if (how === "informant" && G.funds < 1) return toast("Not enough funds", "Informants cost 1M credits.");
    if (!spendAP(how === "informant" ? 3 : 4)) return;
    const before = p.progress;
    let ok;
    if (how === "records") {
        ok = chance(45 + G.influence * 0.3 + (G.committees.includes("intelligence") ? 15 : 0) + (G.committees.includes("finance") ? 8 : 0));
        if (ok) p.progress = Math.min(100, p.progress + ri(12, 20));
        addWrath(5 + before / 12, "Someone in the Chancellor's office has noticed what you're reading.");
        if (!ok) report("Dead ends", "Files missing, archives sealed, clerks who suddenly remember nothing.");
    } else {
        applyEffects({ funds: -1 });
        ok = chance(60);
        if (ok) p.progress = Math.min(100, p.progress + ri(18, 26));
        addWrath(8 + before / 10, "An informant talked — to both sides.");
        if (chance(22)) {
            const who = randomName(G.worldKey);
            fallen(who, "informant, found dead in the lower levels");
            addWrath(4);
            report("💀 Your source is dead", `${who}, who had been feeding you documents, is found dead in the lower levels. The police call it a robbery.`);
        } else if (!ok) report("The informant bolts", "Your source takes the credits and disappears.");
    }
    PROBE_CLUES.filter(c => c.at > before && c.at <= p.progress).forEach(c => {
        p.clues.push(c.at);
        report(`🔎 ${c.title}`, c.text());
        log(`🔎 Investigation: ${c.title}`, "danger");
    });
    render();
}

function useEvidence(kind) {
    initEmpireState();
    const p = G.probe;
    const need = kind === "delegation" ? 20 : 40;
    if (p.progress < need) return toast("Not enough evidence", `You need more than rumours. (${need}% of the investigation.)`);
    if (!spendAP(kind === "publish" ? 4 : 3)) return;
    const allies3 = ["bail", "mothma", "amidala"].map(canonNpc).filter(Boolean);
    if (kind === "publish") {
        p.published = true;
        G.truth += p.progress / 5;
        addWrath(25 + p.progress / 5, "You published the evidence against the Chancellor.");
        const pal = palNpc(); if (pal) changeRel(pal, -20, "Published accusations against him.");
        const ch = applyEffects({ rep: 6, trust: 5, heat: 10, f: { reformers: 6, centralists: -6, militarists: -3 } });
        report("📡 You go public", p.progress >= 100
            ? "You tell the galaxy that the Chancellor is a Sith Lord. His office calls it Separatist propaganda and half the Senate laughs. The other half stops laughing late at night. You have made an enemy who does not lose."
            : "Your evidence runs on every HoloNet channel for a day. Then the Chancellor's allies bury it under a scandal of their own making. But people remember.", ch);
        G.record.agreements.push(`Published evidence against Chancellor Palpatine (${eraYear(currentBBY())})`);
    } else if (kind === "jedi") {
        G.jediWarned = true;
        addWrath(15, "The Jedi have begun asking about the Chancellor.");
        report("🗡️ The Jedi Council listens", "Master Windu hears you out in silence. “We have sensed a darkness,” he says at last. “We will look into it — quietly. Be careful, Senator. If you are right, you are in great danger.”");
    } else {
        G.truth += 5;
        allies3.forEach(n => changeRel(n, 15, "Shared evidence against the Chancellor with them."));
        addWrath(8);
        report("🤝 The Delegation", "Bail Organa reads every page twice. Mon Mothma locks the file in a safe no one knows about. “Not yet,” she says. “But one day this will matter.”");
    }
    render();
}


// ── Staying alive ─────────────────────────────────────────────────

function safetyAction(t) {
    initEmpireState();
    const costs = { guards: 2, jedi_guard: 3, deadswitch: 3, laylow: 2, public: 3, family: 2, speak: 3 };
    if ((t === "guards" && G.funds < 1) || (t === "family" && G.funds < 0.5)) return toast("Not enough funds", "Protection costs money.");
    if (t === "deadswitch" && G.probe.progress < 20) return toast("Nothing to protect", "A dead man's switch needs evidence behind it.");
    if (!spendAP(costs[t])) return;
    let ch = [];
    switch (t) {
        case "guards": G.security = Math.min(100, G.security + 25); ch = applyEffects({ funds: -1 }); report("🛡️ Protection hired", "Former Republic commandos, paid well and asked no questions.", ch); break;
        case "jedi_guard": G.security = Math.min(100, G.security + 35); addWrath(4); report("🗡️ A Jedi protector", "The Council assigns a Jedi Knight to your security detail. The Chancellor's office notes the Jedi's interest in you."); break;
        case "deadswitch": G.deadSwitch = true; report("🔐 A dead man's switch", "If you die, everything you know goes to every newsroom in the galaxy. Killing you just got more expensive."); break;
        case "laylow": G.threat.laylow = 6; ch = applyEffects({ rep: -3, trust: -2, f: { reformers: -2 } }); report("🤫 Lying low", "For six months you vote with the majority and say nothing interesting. Your allies notice."); break;
        case "public": ch = applyEffects({ trust: 4, rep: 3, heat: 4 }); G.wrath = Math.max(0, G.wrath - 8); if (isEmpireEra()) G.isb = (G.isb || 0) + 10; report("📣 You go public about the threats", "If something happens to you now, everyone will know who to blame. It is a kind of armour — for a while.", ch); break;
        case "family": G.threat.familySafe = true; ch = applyEffects({ funds: -0.5 }); report("🚀 Your family is safe", "Your family leaves on a freighter under false names. You will not see them for a long time.", ch); break;
        case "speak": {
            const emp = isEmpireEra();
            ch = applyEffects({ rep: 4, trust: 3, f: { reformers: 4, centralists: -4, militarists: -3 } });
            addWrath(emp ? 14 : 10, `You spoke out against ${rulerTitle()}.`);
            if (emp) { G.isb = (G.isb || 0) + 8; G.rebellion = clamp(G.rebellion + 2); }
            report(emp ? "📣 You denounce the Emperor" : "📣 You denounce the Chancellor's power grab", emp ? "The Imperial Senate falls silent. Somewhere, a file with your name on it gets thicker." : "“Every emergency makes him stronger, and every one of us weaker.” The speech is replayed across the Mid Rim.", ch);
            break;
        }
    }
    render();
}

function assassinOutcome(bonus) {
    initEmpireState();
    const survive = clamp(48 + bonus + (G.deadSwitch ? 12 : 0), 30, 95);
    const r = rnd(0, 100);
    G.wrath = Math.max(0, G.wrath - 15);
    G.record.arrests = G.record.arrests || [];
    if (r < survive) {
        if (G.security >= 20) {
            const guard = randomName(G.worldKey);
            fallen(guard, "bodyguard, killed in an assassination attempt");
            report("You survive", `You survive. ${guard}, your bodyguard, does not.`, applyEffects({ trust: 3, rep: 3, health: -5 }));
        } else report("You survive", "By luck, and a few centimetres, you survive.", applyEffects({ trust: 3, rep: 2, health: -8 }));
        frontScene("emp_after_attempt", {});
    } else if (r < survive + (100 - survive) * 0.6) {
        const aide = G.chiefOfStaff;
        fallen(aide, "chief of staff, killed in an assassination attempt");
        G.chiefOfStaff = randomName(G.worldKey);
        let extra = "";
        if (!G.threat.familySafe && G.family.spouse && G.family.spouse.alive !== false && chance(25)) {
            G.family.spouse.alive = false;
            fallen(G.family.spouse.name, "your spouse, killed in an attack meant for you");
            extra = ` Your spouse, ${G.family.spouse.name}, was with you. They did not survive.`;
            G.family.spouse = null;
        }
        report("Badly wounded", `You wake in a medcenter weeks later. ${aide}, your chief of staff, is dead.${extra}`, applyEffects({ health: -30, trust: 5, rep: 4 }));
        frontScene("emp_after_attempt", {});
    } else {
        const reason = isEmpireEra() ? `${G.name} was killed by an Imperial assassin. The HoloNet reports a tragic accident.` : `${G.name} was assassinated. The killer was never identified. The trail went cold at 500 Republica.`;
        if (G.deadSwitch) { G.rebellion = clamp(G.rebellion + 8); G.truth += 10; log("🔐 Your dead man's switch fires. Your evidence reaches every newsroom in the galaxy.", "danger"); }
        frontScene("death", { reason });
    }
}


// ── The underground ───────────────────────────────────────────────

const COMRADE_ROLES = ["pilot", "slicer", "courier", "former Imperial officer", "medic", "smuggler", "dockworker", "student", "forger", "mechanic"];

function makeComrade() { return { name: randomName(G.worldKey), role: pick(COMRADE_ROLES), status: "active" }; }
function activeComrades() { return (G.ug ? G.ug.comrades : []).filter(c => c.status === "active"); }

function startUnderground(fromGov = false) {
    initEmpireState();
    if (G.ug) return;
    G.ug = { cells: fromGov ? 4 : 2, intel: 10, supplies: fromGov ? 50 : 30, exposure: clamp(15 + danger() * 0.3), comrades: [makeComrade(), makeComrade(), makeComrade(), makeComrade()], mole: null, op: null, ops: 0, pause: 0 };
}

function loseComrade(status, how) {
    const c = pick(activeComrades());
    if (!c) return null;
    c.status = status;
    if (status === "dead") fallen(c.name, `${c.role}, ${how}`);
    if (G.ug.mole === c.name) G.ug.mole = null;
    return c;
}

function ugAction(t) {
    initEmpireState();
    if (!G.ug) startUnderground();
    const u = G.ug;
    const costs = { recruit: 3, intel: 3, sabotage: 5, broadcast: 3, refugees: 4, safehouse: 2, fund: 3, alliance: 3, op: 8, mole: 3 };
    if (t === "sabotage" && u.intel < 20) return toast("Not enough intelligence", "You don't know enough about the target. Gather intelligence first.");
    if (t === "sabotage" && u.pause > 0) return toast("Operations paused", `You agreed to pause attacks for ${u.pause} more months.`);
    if (t === "op" && (u.cells < 5 || u.intel < 50 || u.op)) return toast("Not ready", "A major operation needs 5 cells and 50 intelligence — and only one can be planned at a time.");
    if (t === "fund" && G.funds < 1) return toast("Not enough funds", "You need 1M credits.");
    if (t === "refugees" && u.supplies < 10) return toast("Not enough supplies", "Smuggling people out takes fuel, papers and bribes.");
    if (t === "alliance" && !(currentBBY() <= 2 || G.rebellion >= 40)) return toast("No Alliance yet", "The rebel cells are scattered. There's no one to ask — yet.");
    if (!spendAP(costs[t])) return;
    let ch = [];
    switch (t) {
        case "recruit": {
            const c = makeComrade();
            u.comrades.push(c); u.cells++; u.exposure = clamp(u.exposure + 4);
            if (!u.mole && chance(15)) u.mole = c.name;
            ch = applyEffects({ g: { youth: 2 } });
            report("New recruits", `${c.name}, a ${c.role}, joins the cell. You vouch for them. You hope you're right.`, ch);
            break;
        }
        case "intel": {
            u.exposure = clamp(u.exposure + 3);
            if (chance(50 + u.cells * 5 - u.exposure * 0.2)) { const n = ri(15, 25); u.intel += n; report("Intelligence gathered", `Garrison rosters, patrol routes and supply schedules. (+${n} intelligence)`); }
            else report("Nothing useful", "The contact got cold feet. The Empire changes its codes weekly.");
            break;
        }
        case "sabotage": {
            u.intel -= 20;
            if (chance(55 + u.cells * 4 - u.exposure * 0.3)) {
                u.ops++; u.exposure = clamp(u.exposure + 10);
                G.rebellion = clamp(G.rebellion + 4);
                report("💥 Sabotage", pick(["An Imperial fuel depot burns through the night.", "A TIE fighter maintenance hangar collapses.", "A garrison's comm tower goes dark for a week.", "A munitions train never arrives."]));
                if (chance(50)) frontScene("emp_reprisal", {});
            } else {
                u.exposure = clamp(u.exposure + 15);
                if (chance(10)) { report("Ambush", "It was a trap. They were waiting for you."); frontScene("emp_interrogation", {}); return render(); }
                const c = loseComrade("captured");
                if (c) frontScene("emp_comrade_taken", { name: c.name, role: c.role });
                else report("The mission fails", "The target was moved. You barely get out.");
            }
            break;
        }
        case "broadcast": u.exposure = clamp(u.exposure + 7); G.rebellion = clamp(G.rebellion + 2); G.truth += 2; ch = applyEffects({ rep: 2 }); report("📡 Pirate broadcast", "For four minutes, on every screen in the city, the truth: names, dates, the dead. Then the Empire cuts the signal.", ch); break;
        case "refugees": u.supplies -= 10; u.exposure = clamp(u.exposure + 5); G.rebellion = clamp(G.rebellion + 1); ch = applyEffects({ rep: 3 }); report("🚀 A night flight", pick(["A freighter full of people the Empire wanted gone lifts off at night.", "A Jedi youngling, a deserter and a family of dissidents — out, past the blockade.", "Forty people, one hold, no lights. They make it."]), ch); break;
        case "safehouse": u.exposure = clamp(u.exposure - 15); u.supplies = Math.max(0, u.supplies - 5); report("New safehouse", "You move everything in one night. Burn what you can't carry."); break;
        case "fund": G.rebellion = clamp(G.rebellion + 2); u.supplies += 20; ch = applyEffects({ funds: -1 }); report("Funds sent", "Credits reach the cells through a dozen shell companies.", ch); break;
        case "alliance": {
            u.supplies += 30; u.cells++; u.comrades.push(makeComrade());
            const m = canonNpc("mothma"); if (m) changeRel(m, 5, "Coordinated with the Alliance.");
            report("The Alliance answers", "A courier arrives with weapons, credits and a new face. You are no longer alone.");
            break;
        }
        case "op": {
            u.intel -= 50;
            u.op = { months: 3, name: pick(["the Imperial sector payroll", "a prototype TIE Avenger", "the garrison's weapons depot", "the sector ISB archive", "a prison transport"]) };
            report("Planning begins", `Target: ${u.op.name}. Three months. Everyone knows the risks.`);
            break;
        }
        case "mole": {
            if (u.mole) frontScene("emp_mole", { name: u.mole });
            else { const c = pick(activeComrades()); if (c && chance(40)) { c.status = "left"; report("Paranoia", `There's no informant — but ${c.name} leaves, hurt that you suspected them.`); } else report("No informant found", "Everyone checks out. For now."); }
            break;
        }
    }
    render();
}

function tickUnderground() {
    const u = G.ug;
    u.supplies = Math.max(0, u.supplies - 2);
    if (u.pause > 0) u.pause--;
    if (u.supplies <= 0 && u.cells > 1 && chance(25)) { u.cells--; report("A cell goes dark", "Without supplies, a cell stops answering."); }
    u.exposure = clamp(u.exposure + (u.mole ? 2.5 : 0) - 1.2);
    G.rebellion = clamp(G.rebellion + u.cells * 0.05);
    if (u.op) { u.op.months--; if (u.op.months <= 0) { const name = u.op.name; u.op = null; frontScene("emp_op", { name }); return; } }
    if (u.mole && chance(5)) { frontScene("emp_betrayal", { name: u.mole }); return; }
    if (u.exposure >= 40 && chance((u.exposure - 30) / 5)) { frontScene("emp_raid", { place: pick(["the cantina cellar", "the old cannery", "the spaceport warehouse", "a safehouse in the lower city", "the farm outside town"]) }); return; }
    if (u.exposure >= 80 && chance(8)) { report("Taken", "They were waiting outside your safehouse."); frontScene("emp_interrogation", {}); return; }
    if (chance(3)) frontScene("emp_atrocity", {});
}


// ── Resistance government ─────────────────────────────────────────

function revoltAction(t) {
    const r = G.revolt;
    if (!r) return;
    const costs = { arm: 3, alliance: 4, appeal: 3, shield: 5, evacuate: 3, terms: 4 };
    if (t === "shield" && G.treasury < 2) return toast("Treasury empty", "A shield generator costs 2B.");
    if (t === "alliance" && !(currentBBY() <= 2 || G.rebellion >= 25)) return toast("No one to call", "The rebellion is not yet strong enough to send help.");
    if (!spendAP(costs[t])) return;
    let ch = [];
    switch (t) {
        case "arm": G.garrison += 12; ch = applyEffects({ unrest: 5, g: { youth: 4, military: 3, elders: -2 } }); report("The people armed", "Blasters from the armouries, handed out in the streets.", ch); break;
        case "alliance": if (chance(50)) { G.garrison += 25; report("✊ Help arrives", "Rebel starfighters drop out of hyperspace and hit the Imperial picket."); } else report("No help comes", "The Alliance cannot spare the ships. You are on your own."); break;
        case "appeal": G.rebellion = clamp(G.rebellion + 3); livingNpcs().filter(n => n.arena === "senate" && n.faction === "reformers").forEach(n => changeRel(n, 4)); ch = applyEffects({ rep: 3 }); report("An appeal to the galaxy", "Your broadcast reaches a hundred worlds: we are still free, and we are not the only ones who want to be.", ch); break;
        case "shield": G.garrison += 20; ch = applyEffects({ treasury: -2 }); report("Planetary shield", "The shield goes up over the capital.", ch); break;
        case "evacuate": r.evacuated = true; report("Contingency", "A ship is fuelled and waiting. If the capital falls, the government will not fall with it."); break;
        case "terms": {
            if (chance(35)) { G.revolt = null; G.allegiance = "empire"; G.galaxy[G.worldKey].align = "empire"; G.isb = 70; G.siege = null; ch = applyEffects({ legitimacy: -15, rep: -5, unrest: -10 }); report("Terms accepted", "The Empire accepts your surrender. An Imperial garrison takes the capital; you keep your title and nothing else.", ch); }
            else report("The Empire does not negotiate", "The envoy's answer is a recording of the bombardment of another world.");
            break;
        }
    }
    render();
}

function tickRevolt() {
    const r = G.revolt;
    r.months++;
    if (r.stage === "declared" && r.months >= 1) { r.stage = "ultimatum"; frontScene("emp_ultimatum", {}); return; }
    if (r.stage === "war") {
        if (G.occupied) {
            r.stage = "occupied";
            if (r.evacuated) { report("The government escapes", "As the capital falls, your ship lifts off under fire. The lawful government of your world lives on — underground."); goUndergroundFromRevolt(); }
            return;
        }
        if (!G.siege) { r.stage = "free"; r.next = monthsNow() + ri(10, 18); G.record.agreements.push(`Held ${world().name} free against the Empire (${eraYear(currentBBY())})`); report("🎉 We held", `${world().name} is still free. The Empire will be back — with more ships.`, applyEffects({ legitimacy: 10, trust: 6 })); return; }
        if (chance(12)) frontScene("emp_bombard", {});
    }
    if (r.stage === "free") {
        G.rebellion = clamp(G.rebellion + 0.3);
        if (monthsNow() >= r.next) { r.stage = "war"; r.waves++; startSiege("Imperial", 60 + r.waves * 15 + rnd(0, 20), true, `The Empire returns: a larger fleet drops out of hyperspace over ${world().name}.`); }
    }
    if (r.stage === "occupied" && !G.occupied) { r.stage = "free"; r.next = monthsNow() + ri(12, 20); }
}

function goUndergroundFromRevolt() {
    const title = G.office.title;
    startUnderground(true);
    G.allegiance = "rebel";
    enterOutsider("Rebel Organizer");
    G.office.title = `Leader of the ${world().name} government-in-exile`;
    G.record.agreements.push(`Led ${world().name}'s government-in-exile after serving as ${title} (${eraYear(currentBBY())})`);
}


// ── Panels ────────────────────────────────────────────────────────

function empirePanels() {
    initEmpireState();
    let out = "";
    if (G.revolt && governing()) out += revoltPanel();
    if (canProbe()) out += probePanel();
    if (palAlive() && !isUnderground() && !inImperialPrison() && (danger() >= 15 || canProbe() || isEmpireEra())) out += safetyPanel();
    return out;
}

function probePanel() {
    const p = G.probe;
    const clues = PROBE_CLUES.filter(c => p.clues.includes(c.at)).map(c => `<div class="clue"><b>🔎 ${esc(c.title)}</b><p class="small">${esc(c.text())}</p></div>`).join("");
    return panel("🔍 Investigating the Chancellor", `<p class="small">Something is wrong at the heart of the Republic. Every crisis leaves the Chancellor stronger. Finding out why is the most dangerous thing you can do.</p>
        ${statRow("Investigation", `${p.progress}%`, p.progress, "good")}
        ${clues || '<p class="muted small">No leads yet.</p>'}
        ${p.progress < 100 ? tact("probe", "Dig through Senate records", 4, "Slow and quieter. Better with Intelligence or Finance seats.", 'data-t="records"') + tact("probe", "Pay an informant", 3, "1M credits. Faster — and people who talk tend to die.", 'data-t="informant"') : ""}
        ${p.progress >= 20 ? `<h4>Use what you know</h4>
            ${tact("evidence", "Share it with Bail Organa and Mon Mothma", 3, "Allies for later. Quiet.", 'data-t="delegation"')}
            ${p.progress >= 40 ? tact("evidence", "Take it to the Jedi Council", 3, "They may act. He will know.", 'data-t="jedi"') + tact("evidence", "Publish it on the HoloNet", 4, "The galaxy will know — and so will he. Maximum danger.", 'data-t="publish"') : ""}` : ""}`, "danger");
}

function safetyPanel() {
    const d = danger();
    const emp = isEmpireEra();
    const jedi = !emp && G.era !== "republic";
    const descr = d >= 70 ? `${emp ? "The ISB and the Emperor's agents" : "The Chancellor"} want you dead. It is a question of when.` : d >= 50 ? "You are marked. Accidents happen to people like you." : d >= 30 ? "You are being watched. Your comms are not private." : d >= 15 ? "You have been noticed." : "Nobody important is paying attention to you. Yet.";
    return panel(`☠️ Your safety — ${dangerLabel(d)}`, `<p class="small">${descr}</p>
        ${statRow("Danger", dangerLabel(d), d, "bad")}
        ${statRow("Protection", G.security >= 50 ? "strong" : G.security >= 20 ? "some" : "almost none", G.security, "good")}
        <p class="muted small">${G.deadSwitch ? "🔐 Dead man's switch set. " : ""}${G.threat.familySafe ? "🚀 Family hidden offworld. " : ""}${G.threat.laylow > 0 ? `🤫 Lying low (${G.threat.laylow} months). ` : ""}</p>
        ${tact("safety", emp ? "📣 Denounce the Emperor" : "📣 Denounce the Chancellor's power grab", 3, "Reputation and allies. He will hear it.", 'data-t="speak"')}
        ${tact("safety", "🛡️ Hire bodyguards", 2, "1M credits. Protection fades over time.", 'data-t="guards"')}
        ${jedi ? tact("safety", "🗡️ Ask the Jedi for protection", 3, "", 'data-t="jedi_guard"') : ""}
        ${G.probe.progress >= 20 && !G.deadSwitch ? tact("safety", "🔐 Set a dead man's switch", 3, "If you die, the evidence goes public.", 'data-t="deadswitch"') : ""}
        ${!G.threat.familySafe && G.family.spouse ? tact("safety", "🚀 Send your family into hiding", 2, "0.5M credits.", 'data-t="family"') : ""}
        ${tact("safety", "📣 Go public about the threats", 3, "Hard to kill someone everyone's watching.", 'data-t="public"')}
        ${!(G.threat.laylow > 0) ? tact("safety", "🤫 Lie low for six months", 2, "Danger fades. So does your reputation.", 'data-t="laylow"') : ""}
        ${G.fallen.length ? `<h4>The fallen</h4><ul class="small fallen">${G.fallen.slice(0, 6).map(f => `<li><b>${esc(f.name)}</b> — ${esc(f.how)} (${esc(f.year)})</li>`).join("")}</ul>` : ""}`, "danger");
}

function revoltPanel() {
    const r = G.revolt;
    const stage = { declared: "Resistance declared. The Empire has noticed.", ultimatum: "The Empire has issued an ultimatum.", war: `Imperial forces are in the system — wave ${r.waves}.`, free: "For now, your world is free. The Empire will return.", occupied: "The capital is occupied." }[r.stage];
    return panel(`✊ ${world().name} Resistance Government`, `<p><b>${esc(stage)}</b></p>
        ${statRow("Defence strength", defenseStrength(), Math.min(100, defenseStrength()), "good")}
        ${G.siege ? statRow("Imperial strength", G.siege.str, Math.min(100, G.siege.str), "bad") : ""}
        ${tact("revolt", "Arm the population", 3, "Defence up; so is the chaos.", 'data-t="arm"')}
        ${tact("revolt", "Raise a planetary shield", 5, "2B from the treasury.", 'data-t="shield"')}
        ${tact("revolt", "Call on the Rebel Alliance", 4, "Maybe they come.", 'data-t="alliance"')}
        ${tact("revolt", "Appeal to the galaxy", 3, "Inspire other worlds.", 'data-t="appeal"')}
        ${!r.evacuated ? tact("revolt", "Prepare a government-in-exile", 3, "If the capital falls, you escape.", 'data-t="evacuate"') : '<p class="small muted">🚀 A ship is waiting if the capital falls.</p>'}
        ${tact("revolt", "Sue for terms", 4, "End the war. Lose everything you fought for.", 'data-t="terms"')}`, "danger");
}

function ugDesk() {
    initEmpireState();
    if (!G.ug) startUnderground();
    const u = G.ug;
    const comrades = u.comrades.map(c => `<li class="${c.status}"><b>${esc(c.name)}</b> — ${esc(c.role)} <span class="muted">${{ active: "", captured: "· captured", dead: "· dead", left: "· left the cell" }[c.status]}</span></li>`).join("");
    return `<div class="cols"><div class="col-main">${panel("✊ The Underground", `<p class="small">You are not a politician any more. You are a fugitive with friends — and every one of them could get you killed, or be killed because of you.</p>
        <div class="grid2"><div>${statRow("Cells", u.cells, Math.min(100, u.cells * 10), "good")}${statRow("Intelligence", u.intel, Math.min(100, u.intel), "good")}${statRow("Supplies", u.supplies, Math.min(100, u.supplies), "good")}</div>
        <div>${statRow("ISB exposure", Math.round(u.exposure), u.exposure, "bad")}${statRow("Rebellion strength", Math.round(G.rebellion), G.rebellion, "good")}${statRow("Operations", u.ops, null)}</div></div>
        ${u.op ? `<p class="c-und"><b>Operation in progress:</b> ${esc(u.op.name)} — ${u.op.months} months.</p>` : ""}
        <h4>Build</h4>
        ${tact("rebel", "Recruit a new cell", 3, "More reach, more risk. Anyone could be an informant.", 'data-t="recruit"')}
        ${tact("rebel", "Gather intelligence", 3, "", 'data-t="intel"')}
        ${tact("rebel", "Fund the cells", 3, "1M credits → supplies.", 'data-t="fund"')}
        ${tact("rebel", "Contact the Rebel Alliance", 3, currentBBY() <= 2 || G.rebellion >= 40 ? "Supplies and people." : "There is no Alliance yet.", 'data-t="alliance"')}
        <h4>Strike</h4>
        ${tact("rebel", "Sabotage an Imperial target", 5, "Needs 20 intelligence. The Empire punishes civilians for every attack.", 'data-t="sabotage"')}
        ${tact("rebel", "Pirate HoloNet broadcast", 3, "Tell the truth. They will trace the signal.", 'data-t="broadcast"')}
        ${tact("rebel", "Smuggle people out", 4, "10 supplies.", 'data-t="refugees"')}
        ${tact("rebel", "Plan a major operation", 8, "5 cells, 50 intelligence. Three months. Everything on one roll.", 'data-t="op"')}
        <h4>Survive</h4>
        ${tact("rebel", "Move the safehouse", 2, "Exposure down.", 'data-t="safehouse"')}
        ${tact("rebel", "Hunt for an informant", 3, "If there is one.", 'data-t="mole"')}`)}</div>
        <div class="col-side">${panel("Your comrades", `<ul class="small comrades">${comrades}</ul>`)}
        ${G.fallen.length ? panel("The fallen", `<ul class="small fallen">${G.fallen.slice(0, 10).map(f => `<li><b>${esc(f.name)}</b> — ${esc(f.how)} (${esc(f.year)})</li>`).join("")}</ul>`) : ""}</div></div>`;
}


// ── Scenes ────────────────────────────────────────────────────────

Object.assign(SCENES, {
    emp_warning: () => {
        const emp = isEmpireEra();
        const line = emp ? voice("Emperor Palpatine", "“You have always had such passion. I value passion. I would hate to see it… extinguished.”")
            : voice("Chancellor Palpatine", "“Your passion does you credit, Senator. But these are delicate times. Passion can so easily be… misunderstood. I would hate for anything to happen to someone so promising.”");
        return { tag: "A PRIVATE WORD", title: emp ? "An audience with the Emperor" : "Tea with the Chancellor",
            body: `${line}<p>He smiles the whole time. You leave with the distinct feeling that you have been measured for a coffin.</p>`,
            choices: [
                { label: "Back off", hint: "Danger falls. Your allies notice.", go: () => { G.wrath = Math.max(0, G.wrath - 15); applyEffects({ rep: -2, f: { reformers: -2 } }); } },
                { label: "Thank him, and change nothing", go: () => addWrath(4) },
                ...(G.probe && G.probe.progress >= 60 ? [{ label: "Tell him you know", hint: "A very dangerous thing to say.", go: () => { addWrath(22, "You told him you know."); const p = palNpc(); if (p) changeRel(p, -15, "Told him they knew his secret."); report("“Do you?”", "He laughs softly. “Then you understand how little it matters.”"); } }] : []),
                { label: "Tell the press you were threatened", go: () => { addWrath(8); applyEffects({ trust: 3, rep: 2 }); } }
            ] };
    },

    emp_smear: () => ({
        tag: "THE HOLONET", title: isEmpireEra() ? "“Traitor”" : "“Separatist money”",
        body: `<p>${isEmpireEra() ? "Imperial news runs a week of stories calling you a terrorist sympathiser. Your photograph appears beside a bombing you had nothing to do with." : "Stories appear claiming you took money from Separatist banks. The documents are forged, and very good. The Chancellor's office expresses its “deep concern”."}</p>`,
        choices: [
            { label: "Deny it", go: () => applyEffects({ trust: -4, heat: 6 }) },
            ...(G.probe && G.probe.progress >= 40 ? [{ label: "Expose who's behind it", hint: "Use your evidence.", go: () => { addWrath(8); applyEffects({ trust: 4, rep: 2 }); } }] : []),
            { label: "Stay silent and let it pass", go: () => applyEffects({ trust: -6, rep: -3 }) }
        ]
    }),

    emp_colleague: () => {
        const who = randomName(G.worldKey);
        fallen(who, "researcher, found dead in a “speeder accident”");
        return { tag: "A MESSAGE", title: "An accident",
            body: `<p><b>${esc(who)}</b>, the researcher who had been helping you, is found dead. The official report says their speeder lost power over the industrial levels.</p><p>The speeder was three months old. They had called you the night before: <i>“I found something. Not over comms.”</i></p>`,
            choices: [
                { label: "Demand a public investigation", go: () => { addWrath(8); applyEffects({ rep: 3, trust: 2 }); } },
                { label: "Protect your remaining sources", go: () => { G.security = Math.min(100, G.security + 10); } },
                { label: "Back off", hint: "This is how they win.", go: () => { G.wrath = Math.max(0, G.wrath - 20); applyEffects({ rep: -3 }); } }
            ] };
    },

    emp_assassin: ctx => {
        const how = { kouhun: "Two poisonous kouhuns slip through the ventilation shaft into your bedchamber while you sleep.", speeder: "Your speeder explodes on the landing platform — seconds before you reach it.", sniper: "A shot from a rooftop across the plaza tears through the podium as you begin to speak.", poison: "Your food taster collapses at a state dinner. The wine was meant for you." }[ctx.kind] || "They come for you at night.";
        const who = isEmpireEra() ? "Nobody claims responsibility. Everybody knows." : "A bounty hunter, paid through a dozen accounts. The trail goes cold at 500 Republica.";
        return { tag: "ASSASSINATION ATTEMPT", title: "They came for you",
            body: `<p>${how}</p><p class="muted">${who}</p><p class="small">Your protection: <b>${G.security >= 50 ? "strong" : G.security >= 20 ? "some" : "almost none"}</b>${G.deadSwitch ? " · a dead man's switch holds your evidence" : ""}.</p>`,
            choices: [
                { label: "Trust your protection", hint: "Depends on the security you've built.", go: () => assassinOutcome(G.security * 0.6) },
                { label: "Fight back", hint: "Your own nerve and health.", go: () => assassinOutcome(G.health * 0.3) },
                { label: "Run", go: () => assassinOutcome(15) }
            ] };
    },

    emp_after_attempt: () => ({
        tag: "AFTERMATH", title: "Still alive",
        body: `<p>You are alive. The HoloNet calls it ${isEmpireEra() ? "“an act of rebel terrorism”" : "“a Separatist plot”"}. You know better.</p>`,
        choices: [
            { label: "Tell the galaxy who you think did it", hint: "Sympathy — and a bigger target.", go: () => { addWrath(10); applyEffects({ trust: 6, rep: 4, f: { reformers: 4 } }); } },
            { label: "Keep going, quietly", go: () => {} },
            { label: "Stop. It isn't worth dying for.", hint: "Danger falls sharply. So does your standing.", go: () => { G.wrath = Math.max(0, G.wrath - 25); G.threat.laylow = 12; applyEffects({ rep: -5, f: { reformers: -4 } }); G.record.agreements.push(`Backed down after an assassination attempt (${eraYear(currentBBY())})`); } },
            ...(isEmpireEra() ? [{ label: "Disappear into the underground", go: () => imperialPath("rebel") }] : [])
        ]
    }),

    emp_knock: () => ({
        tag: "0300 HOURS", title: "The knock at the door",
        body: `<p>Two ISB officers in grey, and four stormtroopers in the corridor behind them. “Routine questions. It won't take long.”</p><p class="muted small">People who go with them for routine questions do not always come back.</p>`,
        choices: [
            { label: "Go with them", go: () => { if (chance(50)) { G.isb = Math.max(0, (G.isb || 0) - 10); applyEffects({ health: -10 }); report("Released", "Eleven hours in a white room. They let you go. They wanted you to know they could."); } else imprisonImperial("Detained without charge by the Imperial Security Bureau.", 24); } },
            ...(allies().length >= 3 && G.influence >= 25 ? [{ label: "Call your allies", hint: "Influence as armour.", go: () => { if (chance(60)) { addWrath(5); applyEffects({ influence: -8 }); report("They back off", "Three senators and a Moff's cousin call the ISB within the hour. The officers leave. They will be back."); } else imprisonImperial("Arrested despite the protests of your allies.", 24); } }] : []),
            { label: "Out the back window", hint: "Leave your old life tonight.", go: () => { imperialPath("rebel"); if (G.ug) G.ug.exposure = 60; } }
        ]
    }),

    emp_prison: () => ({
        tag: "IMPERIAL LABOUR CAMP", title: "One way out",
        body: `<p>White floors that burn when they are switched on. Shifts counted to the second. Nobody here has a release date that means anything — the Empire extends sentences at will.</p><p>Someone on your shift is whispering about the water pipes and the one floor the guards never check.</p>`,
        choices: [
            { label: "Organise the breakout", hint: "One chance.", go: () => { const r = rnd(0, 100); if (r < 35) { report("🔥 One way out!", "Hundreds of prisoners pour out of the facility. You are one of them."); imperialPath("rebel"); } else if (r < 60) { frontScene("death", { reason: `${G.name} died in a failed prison break.` }); } else { G.office.timer += 12; applyEffects({ health: -15 }); report("Caught", "The floors come on. You survive. Your sentence doubles."); } } },
            { label: "Keep your head down", go: () => applyEffects({ health: -5 }) },
            { label: "Inform on other prisoners", hint: "Early release. You'll have to live with it.", go: () => { G.office.timer = Math.max(1, G.office.timer - 12); applyEffects({ rep: -8, consistency: -10 }); } }
        ]
    }),

    emp_interrogation: () => ({
        tag: "ISB DETENTION", title: "Interrogation",
        body: `<p>A white room. A chair with straps. An officer who apologises for what is about to happen, and means none of it. They want names.</p>${G.ug ? `<p class="small">Everyone in your cell: ${activeComrades().map(c => esc(c.name)).join(", ") || "nobody left"}.</p>` : ""}`,
        choices: [
            { label: "Say nothing", hint: "Your body pays.", go: () => { applyEffects({ health: -30 }); if (G.health < 25 && chance(35)) frontScene("death", { reason: `${G.name} died under Imperial interrogation without giving up a single name.` }); else { report("You held", "Days, or weeks. You never gave them a name."); imprisonImperial("Sentenced by an Imperial tribunal after interrogation.", 36); } } },
            { label: "Give them false names", hint: "If they check, it gets worse.", go: () => { if (chance(50)) { report("They believe you", "Three raids on empty apartments. You are sent to a labour camp."); imprisonImperial("Sent to an Imperial labour camp.", 24); } else { applyEffects({ health: -40 }); if (G.health <= 0) frontScene("death", { reason: `${G.name} died in ISB custody.` }); else imprisonImperial("Sentenced after lying to the ISB.", 48); } } },
            { label: "Break", hint: "You live. Your comrades don't.", go: () => { if (G.ug) { activeComrades().forEach(c => { c.status = chance(50) ? "dead" : "captured"; if (c.status === "dead") fallen(c.name, `${c.role}, killed in the raids after you talked`); }); G.ug.cells = 0; } G.rebellion = clamp(G.rebellion - 5); applyEffects({ consistency: -20, rep: -10 }); G.record.agreements.push(`Gave names to the ISB under interrogation (${eraYear(currentBBY())})`); const m = canonNpc("mothma"); if (m) changeRel(m, -30, "Gave up their cell to the ISB."); G.ug = null; enterOutsider("Exile", 12); report("Released", "They let you go. Nobody is waiting for you."); } }
        ]
    }),

    emp_raid: ctx => ({
        tag: "DAWN", title: "The raid",
        body: `<p>Stormtroopers hit ${esc(ctx.place)} at dawn. You hear the doors come in two floors below.</p>`,
        choices: [
            { label: "Fight your way out", go: () => { if (chance(50 + G.ug.cells * 3)) { const c = loseComrade("dead", "killed covering the escape"); G.ug.exposure = clamp(G.ug.exposure - 10); report("Out", c ? `You get out. ${c.name} stayed behind to cover the stairs.` : "You get out."); } else { report("Cornered", "There is no way out."); frontScene("emp_interrogation", {}); } } },
            { label: "Scatter", hint: "Everyone runs a different way.", go: () => { const c = loseComrade("captured"); G.ug.cells = Math.max(1, G.ug.cells - 1); G.ug.supplies = Math.max(0, G.ug.supplies - 10); G.ug.exposure = clamp(G.ug.exposure - 20); report("Scattered", c ? `Most of you make it. ${c.name} is taken.` : "You all make it — just."); } },
            { label: "Go to ground offworld", hint: "Months in a freighter hold.", go: () => { G.ug.exposure = clamp(G.ug.exposure - 40); G.ug.cells = Math.max(1, G.ug.cells - 2); G.ug.supplies = Math.max(0, G.ug.supplies - 15); applyEffects({ health: -5 }); report("Gone", "You leave the planet in a cargo container. Half your network doesn't know where you went."); } }
        ]
    }),

    emp_comrade_taken: ctx => ({
        tag: "CAPTURED", title: `${ctx.name} is taken`,
        body: `<p>${esc(ctx.name)}, your ${esc(ctx.role)}, is taken alive. The ISB will make them talk. Everyone they know is now in danger.</p>`,
        choices: [
            { label: "Attempt a rescue", go: () => { const c = G.ug.comrades.find(x => x.name === ctx.name); if (chance(35 + G.ug.cells * 3)) { if (c) c.status = "active"; G.ug.exposure = clamp(G.ug.exposure + 15); report("Rescued", `You get ${ctx.name} out of the transport. The Empire will not forget it.`); } else { const d = loseComrade("dead", "killed in a failed rescue"); if (c) { c.status = "dead"; fallen(c.name, `${c.role}, died in ISB custody`); } G.ug.exposure = clamp(G.ug.exposure + 10); report("The rescue fails", `${ctx.name} is not in the transport.${d ? ` ${d.name} doesn't come back either.` : ""}`); } } },
            { label: "Burn the network", hint: "Move everyone, destroy everything they knew.", go: () => { G.ug.exposure = clamp(G.ug.exposure - 25); G.ug.cells = Math.max(1, G.ug.cells - 1); G.ug.intel = Math.max(0, G.ug.intel - 20); } },
            { label: "Trust them to hold out", go: () => { const c = G.ug.comrades.find(x => x.name === ctx.name); if (chance(50)) { if (c) { c.status = "dead"; fallen(c.name, `${c.role}, died in ISB custody without talking`); } report("They held", `${ctx.name} dies in custody. They never gave up a name.`); } else { G.ug.exposure = clamp(G.ug.exposure + 30); report("They talked", `Nobody holds out forever. The ISB knows what ${ctx.name} knew.`); } } }
        ]
    }),

    emp_reprisal: () => {
        const n = pick([10, 20, 30]);
        return { tag: "REPRISAL", title: "The price of every attack",
            body: `<p>The garrison commander has ${n} people from the district shot in the square. Posters on every wall promise ${n} more for every attack.</p><p>Some of them were your neighbours.</p>`,
            choices: [
                { label: "Keep fighting", hint: "This is what they want us to fear.", go: () => { G.rebellion = clamp(G.rebellion + 2); applyEffects({ unrest: 6, trust: -2, g: { elders: -3, workers: -2 } }); } },
                { label: "Pause attacks", hint: "Six months without sabotage.", go: () => { G.ug.pause = 6; G.ug.exposure = clamp(G.ug.exposure - 10); G.rebellion = clamp(G.rebellion - 1); } },
                { label: "Strike the commander", hint: "Risky.", go: () => { if (chance(40)) { G.rebellion = clamp(G.rebellion + 6); G.ug.exposure = clamp(G.ug.exposure + 15); report("The commander is dead", "The reprisals stop. For now."); } else { const c = loseComrade("dead", "killed attacking the garrison commander"); G.ug.exposure = clamp(G.ug.exposure + 20); report("It fails", c ? `${c.name} is killed at the checkpoint.` : "The commander was never there."); } } },
                { label: "Turn yourself in to stop the killing", go: () => frontScene("emp_interrogation", {}) }
            ] };
    },

    emp_op: ctx => ({
        tag: "THE OPERATION", title: `Target: ${ctx.name}`,
        body: `<p>Three months of planning come down to one night. Everyone is in position.</p>`,
        choices: [{ label: "Go", go: () => {
            const u = G.ug;
            if (chance(50 + u.cells * 3 - u.exposure * 0.3)) {
                G.rebellion = clamp(G.rebellion + 12); u.supplies += 30; u.ops++; u.exposure = clamp(u.exposure + 35);
                if (/payroll/.test(ctx.name)) applyEffects({ funds: 3 });
                G.record.agreements.push(`Led the raid on ${ctx.name} (${eraYear(currentBBY())})`);
                report("💥 It worked", `The raid on ${ctx.name} succeeds. The whole sector is talking about it — and the Empire's answer will be brutal.`);
                G.isb = (G.isb || 0) + 15;
            } else {
                const a = loseComrade("dead", `killed in the raid on ${ctx.name}`), b = loseComrade("dead", `killed in the raid on ${ctx.name}`);
                u.exposure = clamp(u.exposure + 30);
                report("Disaster", `The raid on ${ctx.name} goes wrong from the first minute.${a ? ` ${a.name}${b ? ` and ${b.name}` : ""} don't come back.` : ""}`);
                if (chance(25)) frontScene("emp_interrogation", {});
            }
        } }]
    }),

    emp_mole: ctx => ({
        tag: "THE INFORMANT", title: `It was ${ctx.name}`,
        body: `<p>The transmission logs don't lie. ${esc(ctx.name)} has been reporting to the ISB for months. They're sitting in the next room, cleaning a blaster, laughing at something.</p>`,
        choices: [
            { label: "Execute them", hint: "The rules of the war you're in.", go: () => { const c = G.ug.comrades.find(x => x.name === ctx.name); if (c) c.status = "dead"; G.ug.mole = null; applyEffects({ consistency: -4 }); } },
            { label: "Cut them loose", go: () => { const c = G.ug.comrades.find(x => x.name === ctx.name); if (c) c.status = "left"; G.ug.mole = null; G.ug.exposure = clamp(G.ug.exposure + 10); } },
            { label: "Feed the ISB false information through them", hint: "A double game.", go: () => { if (chance(60)) { G.ug.exposure = clamp(G.ug.exposure - 30); G.ug.intel += 20; G.ug.mole = null; report("It works", "The ISB spends a month raiding the wrong warehouses."); } else { G.ug.exposure = clamp(G.ug.exposure + 25); report("They realise", "Your informant realises they've been made — and runs straight to their handler."); } } }
        ]
    }),

    emp_betrayal: ctx => {
        const c = G.ug.comrades.find(x => x.name === ctx.name);
        if (c) c.status = "left";
        G.ug.mole = null;
        G.ug.exposure = clamp(G.ug.exposure + 35);
        const a = loseComrade("captured"), b = loseComrade("dead", `killed in the raids after ${ctx.name}'s betrayal`);
        return { tag: "BETRAYED", title: `${ctx.name} sold you`,
            body: `<p>${esc(ctx.name)} was an ISB informant all along. Tonight three safehouses are hit at once.${a ? ` ${esc(a.name)} is taken.` : ""}${b ? ` ${esc(b.name)} is killed.` : ""}</p>`,
            choices: [
                { label: "Run", go: () => { G.ug.exposure = clamp(G.ug.exposure - 20); G.ug.cells = Math.max(1, G.ug.cells - 2); } },
                { label: "Hunt them down", go: () => { if (chance(45)) { fallen(ctx.name, "the informant, found by the cell"); report("Found", `${ctx.name} is found. There is no trial.`); } else { G.ug.exposure = clamp(G.ug.exposure + 10); report("Gone", `${ctx.name} is under ISB protection now.`); } } }
            ] };
    },

    emp_atrocity: () => {
        const w = world();
        const what = pick([
            `A Star Destroyer levels a village outside the capital that was suspected of hiding rebels. Nobody is allowed to count the dead.`,
            `Imperial conscription sweeps take every young person from three districts of ${w.name} in a single night.`,
            `The Empire strip-mines a sacred site on ${w.name}. People who protest are shot.`,
            `A curfew, and then the disappearances. Families of ${w.name} post the names of the missing on the walls; the walls are painted over by morning.`
        ]);
        const ug = isUnderground();
        return { tag: "UNDER THE EMPIRE", title: "The Empire's order",
            body: `<p>${what}</p>`,
            choices: ug ? [
                { label: "Document it and broadcast it to the galaxy", go: () => { G.rebellion = clamp(G.rebellion + 3); G.ug.exposure = clamp(G.ug.exposure + 8); G.truth += 2; } },
                { label: "Help the survivors", go: () => { G.ug.supplies = Math.max(0, G.ug.supplies - 10); applyEffects({ rep: 3 }); G.ug.cells++; G.ug.comrades.push(makeComrade()); } },
                { label: "There is nothing we can do", go: () => {} }
            ] : [
                { label: "Protest to the Moff", go: () => { G.isb = (G.isb || 0) + 10; addWrath(6); applyEffects({ rep: 4, trust: 3 }); } },
                { label: "Say nothing", go: () => applyEffects({ rep: -3, trust: -2 }) },
                { label: "Endorse the Empire's action", go: () => applyEffects({ rep: -8, trust: -4, f: { militarists: 4, reformers: -6 } }) }
            ] };
    },

    emp_ultimatum: () => ({
        tag: "ULTIMATUM", title: "Surrender, or be made an example",
        body: `${voice("An Imperial envoy", `“You have one standard month to dissolve this so-called government and surrender its leaders. After that, the Empire will restore order to ${world().name}. Personally, I hope you refuse. Examples are so instructive.”`)}`,
        choices: [
            { label: "Defy them", hint: "War.", go: () => { const r = G.revolt; r.stage = "war"; r.waves = 1; startSiege("Imperial", 65 + rnd(0, 20), true, `Star Destroyers drop out of hyperspace over ${world().name}. A blockade seals the system.`); } },
            { label: "Negotiate", go: () => revoltAction("terms") },
            { label: "Surrender the government, but escape yourself", go: () => { G.revolt = null; occupy("Imperial"); goUndergroundFromRevolt(); } },
            { label: "Surrender everything", go: () => { G.revolt = null; G.allegiance = "empire"; G.galaxy[G.worldKey].align = "empire"; occupy("Imperial"); imprisonImperial("Arrested as leader of a rebel government.", 48); } }
        ]
    }),

    emp_bombard: () => {
        const place = pick(["the capital's industrial district", "the spaceport", "the old city", "a power plant", "the university"]);
        return { tag: "BOMBARDMENT", title: "Fire from orbit",
            body: `<p>Turbolaser fire falls on ${place}. The Empire does not warn anyone first.</p>`,
            choices: [
                { label: "Evacuate the cities", hint: "Fewer dead, a battered economy.", go: () => applyEffects({ treasury: -1, p: { employment: -2, infrastructure: -2 }, g: { elders: 2 } }) },
                { label: "Hold the line", go: () => { G.garrison += 5; applyEffects({ p: { infrastructure: -4, housing: -3, healthcare: -2 }, g: { elders: -4, urban: -4 }, trust: -2 }); } },
                { label: "Surrender to stop the killing", go: () => { G.revolt = null; G.siege = null; G.allegiance = "empire"; G.galaxy[G.worldKey].align = "empire"; occupy("Imperial"); imprisonImperial("Surrendered to stop the bombardment. Arrested anyway.", 36); } }
            ] };
    },

    // Historical scenes of the dark times.
    emp_jedi: () => ({
        tag: "19 BBY — ORDER 66", title: "A Jedi at your door",
        body: `<p>A wounded Jedi Padawan, no older than sixteen, stumbles into your residence. Clone troopers are sweeping the district floor by floor. <i>“Please.”</i></p>${G.jediWarned ? "<p class=\"small\">It's the apprentice of a Master you once warned about the Chancellor.</p>" : ""}`,
        choices: [
            { label: "Hide them", hint: "If they find out, you are finished.", go: () => { G.isb = (G.isb || 0) + 15; addWrath(8); G.jediHidden = true; G.record.agreements.push(`Sheltered a Jedi fugitive (${eraYear(currentBBY())})`); report("Hidden", "For three weeks, a Jedi sleeps in your storeroom. Then one night they're gone, with a note: “I will not forget.”"); } },
            { label: "Give them a ship and send them away", go: () => { G.isb = (G.isb || 0) + 8; applyEffects({ funds: -0.5 }); } },
            { label: "Turn them in", hint: "The Empire will remember your loyalty.", go: () => { G.isb = Math.max(0, (G.isb || 0) - 10); G.wrath = Math.max(0, G.wrath - 10); applyEffects({ rep: -6, consistency: -8, f: { militarists: 3, reformers: -6 } }); G.record.agreements.push(`Turned a Jedi over to the clones (${eraYear(currentBBY())})`); } },
            { label: "Close the door", go: () => applyEffects({ consistency: -3 }) }
        ]
    }),

    emp_purge: () => {
        const mine = G.signed2000 && !isUnderground();
        return { tag: "18 BBY", title: "The Petition of the 2,000",
            body: `<p>The senators who signed the Petition of the 2,000 are disappearing. Fang Zar flees Coruscant with the ISB behind him. Others are arrested at dawn, or simply stop coming to the chamber.</p>${mine ? "<p><b>Your name is on that petition.</b></p>" : ""}`,
            choices: [
                { label: "Speak for them on the Senate floor", go: () => { addWrath(15, "You defended the Petition's signatories."); G.isb = (G.isb || 0) + 15; applyEffects({ rep: 5, f: { reformers: 5 } }); } },
                { label: "Use your influence to protect one colleague", go: () => { applyEffects({ influence: -10 }); G.isb = (G.isb || 0) + 8; const who = pick(livingNpcs().filter(n => n.arena === "senate" && n.faction === "reformers")); if (who) changeRel(who, 30, "Saved them from the purge."); report("One life", `${who ? who.name : "A colleague"} is quietly moved offworld under your protection.`); } },
                { label: "Stay silent", go: () => applyEffects({ rep: -4 }) },
                ...(mine ? [{ label: "Run while you still can", go: () => imperialPath("rebel") }] : [])
            ] };
    },

    emp_resentencing: () => {
        const cat = roleCat();
        return { tag: "5 BBY", title: "The Public Order Resentencing Directive",
            body: `<p>The Emperor signs a directive: sentences can be extended at will, association is a crime, and there is no appeal. The prisons fill in a month.</p>`,
            choices: isUnderground() ? [
                { label: "It will fill the prisons — and our ranks", go: () => { G.rebellion = clamp(G.rebellion + 4); G.ug.exposure = clamp(G.ug.exposure + 5); } }
            ] : cat === "senate" ? [
                { label: "Speak against it", go: () => { G.isb = (G.isb || 0) + 15; addWrath(8); recordVote("Public Order Resentencing Directive", "opposed"); applyEffects({ rep: 4 }); } },
                { label: "Support it", go: () => { recordVote("Public Order Resentencing Directive", "supported"); applyEffects({ rep: -5, f: { militarists: 3, reformers: -5 } }); } },
                { label: "Say nothing", go: () => {} }
            ] : governing() ? [
                { label: "Quietly refuse to enforce it", go: () => { G.isb = (G.isb || 0) + 20; applyEffects({ legitimacy: 5, g: { youth: 3 } }); } },
                { label: "Enforce it", go: () => { G.isb = Math.max(0, (G.isb || 0) - 10); applyEffects({ unrest: 10, rep: -5, g: { youth: -5, workers: -3 } }); } }
            ] : [{ label: "Continue", go: () => {} }] };
    }
});

function imprisonImperial(reason, months) {
    G.record.arrests.push(eraYear(currentBBY()));
    G.ug = null;
    report("Imprisoned", reason);
    enterOutsider("Prisoner", months);
}

HISTORY.push(
    { bby: 19, m: 6, id: "jedi_refugee", run: () => { if (!isUnderground()) frontScene("emp_jedi", {}); } },
    { bby: 18, m: 4, id: "purge_of_the_2000", run: () => frontScene("emp_purge", {}) },
    { bby: 5, m: 6, id: "resentencing_directive", run: () => frontScene("emp_resentencing", {}) },
    { bby: 5, m: 10, id: "aldhani", run: () => { G.rebellion = clamp(G.rebellion + 4); if (G.ug) G.ug.exposure = clamp(G.ug.exposure + 10); report("💰 The Aldhani heist", "Rebels steal a sector's Imperial payroll from the garrison at Aldhani. The Empire answers with mass arrests across the sector."); } },
    { bby: 4, m: 3, id: "ferrix", run: () => { G.rebellion = clamp(G.rebellion + 3); report("🔥 Ferrix rises", "At a funeral on Ferrix, the crowd turns on the stormtroopers. The Empire had not expected ordinary people to fight."); } },
    { bby: 0, m: 1, id: "jedha_destroyed", run: () => report("💥 Jedha City destroyed", "The holy city of Jedha is wiped from the face of its moon. Imperial news calls it a mining disaster.") },
    { bby: 0, m: 2, id: "scarif", run: () => { G.rebellion = clamp(G.rebellion + 6); report("⚔️ Scarif", "Rebels steal the plans to the Empire's battle station from the archive on Scarif. None of the team survive."); } }
);

// Every month, the Chancellor — then the Emperor — answers his enemies.
function tickEmpire() {
    initEmpireState();
    G.security = Math.max(0, G.security - 1);
    if (G.threat.laylow > 0) { G.threat.laylow--; G.wrath = Math.max(0, G.wrath - 3); }
    else G.wrath = Math.max(0, G.wrath - 0.6);
    if (G.era === "newrepublic") {
        if (G.ug) { G.record.agreements.push("Survived the underground to see the New Republic"); G.ug = null; }
        G.revolt = null; G.wrath = 0;
        return;
    }
    if (G.ug && isUnderground()) tickUnderground();
    if (G.revolt) tickRevolt();
    if (!palAlive() || G.scenes.length > 2) return;
    if (inImperialPrison()) { if (G.office.timer > 2 && chance(10)) pushScene("emp_prison", {}); return; }
    if (isUnderground()) return;
    const d = danger(), t = G.threat, now = monthsNow();
    if (d >= 20 && t.warned == null) { t.warned = now; pushScene("emp_warning", {}); return; }
    if (d >= 35 && now - (t.smear == null ? -99 : t.smear) > 18 && chance(8)) { t.smear = now; pushScene("emp_smear", {}); return; }
    if (d >= 50 && t.colleague == null && chance(12)) { t.colleague = now; pushScene("emp_colleague", {}); return; }
    const killingEra = currentBBY() <= 22 || isEmpireEra();
    if (d >= 55 && killingEra && now - (t.attempt == null ? -99 : t.attempt) > 10 && chance((d - 40) / 3)) { t.attempt = now; pushScene("emp_assassin", { kind: pick(["kouhun", "speeder", "sniper", "poison"]) }); return; }
    if (isEmpireEra() && d >= 65 && now - (t.knock == null ? -99 : t.knock) > 12 && chance((d - 55) / 5)) { t.knock = now; pushScene("emp_knock", {}); return; }
    if (isEmpireEra() && G.jediHidden && chance(1.5)) { G.jediHidden = false; G.isb = (G.isb || 0) + 25; report("They know", "A neighbour remembers the young stranger in your storeroom. The ISB opens a file."); }
}
