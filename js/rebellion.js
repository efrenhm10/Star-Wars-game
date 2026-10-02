// Galactic Senate — Armed forces, battles, espionage and the war against the Empire
// ---------------------------------------------------------------------------
// War should feel like war. A planetary government has an army it can count,
// mobilise and send into battle. A resistance leader has fighters, agents and
// a base on a world that is still free. Battles are fought in turns —
// a plan, a twist, a result with the dead counted on both sides — and the war
// council brings new problems every few months: patrols, convoys, defectors,
// reprisals, hotheads, an Alliance that needs your ships.

// ── Armed forces ──────────────────────────────────────────────────

const FORCE_BASE = { 1: 6000, 2: 30000, 3: 120000, 4: 400000, 5: 1500000 };
const SHIP_BASE = { 1: 1, 2: 4, 3: 10, 4: 28, 5: 80 };
const fmtN = n => Math.round(n).toLocaleString("en-US");

function worldPop(k) {
    if (k === G.worldKey && G.demo) return G.demo.pop;
    const w = WORLDS[k];
    return (typeof DEMO_POP !== "undefined" && DEMO_POP[k]) || (w ? DEMO_POP_RATING[w.ratings.population || 3] : 50e6);
}
function worldMil(k) { const w = WORLDS[k]; return w ? w.ratings.military : (BACKGROUND_WORLDS[k] ? 2 : 2); }

function initForces() {
    if (G.forces) return G.forces;
    const m = worldMil(G.worldKey), pop = worldPop(G.worldKey);
    const troops = Math.round(Math.min(FORCE_BASE[m], pop * 0.01));
    const ships = Math.max(0, Math.min(SHIP_BASE[m], Math.floor(pop / 5000)));
    const fighters = ships * 12 + (world().ratings.industry >= 5 ? 24 : 0);
    G.forces = { under: "planetary", troops, reserves: Math.round(Math.min(troops * 2, pop * 0.03)), ships, fighters, training: 40 + m * 8, morale: 60, mobilized: false, queue: [], base: { troops, ships, fighters } };
    return G.forces;
}

function initRebelForces(extra = 0) {
    if (G.forces && G.forces.under === "rebel") { G.forces.troops += Math.round(extra); return G.forces; }
    const t = ri(150, 400) + Math.round(extra);
    G.forces = { under: "rebel", troops: t, reserves: 0, ships: 0, fighters: 0, training: 35, morale: 70, mobilized: false, queue: [], base: { troops: Math.max(t, 300), ships: 1, fighters: 12 } };
    return G.forces;
}

// Part of a planetary army follows its leader into the resistance.
function forcesDefect(share) {
    const f = G.forces;
    if (!f || f.under === "rebel") return initRebelForces();
    const t = Math.round(f.troops * share), s = Math.round(f.ships * share * 1.5), fi = Math.round(f.fighters * share * 1.5);
    G.forces = { under: "rebel", troops: Math.max(200, t), reserves: 0, ships: s, fighters: fi, training: f.training, morale: 75, mobilized: false, queue: [], base: { troops: Math.max(300, t), ships: Math.max(1, s), fighters: Math.max(12, fi) } };
    return G.forces;
}

const forceRaw = f => f.troops / 1000 + f.ships * 20 + f.fighters;
function forcesBonus() {
    const f = G.forces;
    if (!f || f.under === "rebel") return 0;
    const part = (a, b) => b > 0 ? a / b : (a > 0 ? 2 : 1);
    const ratio = part(f.troops, f.base.troops) * 0.5 + part(f.ships, f.base.ships) * 0.3 + part(f.fighters, f.base.fighters) * 0.2;
    return Math.round(clamp(30 * (ratio - 1) + (f.training - 50) * 0.2 + (f.morale - 50) * 0.1, -25, 70));
}

function forcesUpkeep() {
    const f = G.forces;
    if (!f || f.under !== "planetary") return 0;
    const extra = Math.max(0, f.troops - f.base.troops) / 1e6 * 0.8 + Math.max(0, f.ships - f.base.ships) * 0.03 + Math.max(0, f.fighters - f.base.fighters) * 0.002;
    return Math.round(extra * 100) / 100;
}

function forcesAction(t) {
    const f = initForces();
    const rebel = f.under === "rebel";
    const costs = { mobilize: 4, demobilize: 2, recruit: 3, train: 3, ships: 4, fighters: 3, rally: 2 };
    if (f.under === "imperial") return toast("Under Imperial command", "Your army serves the Empire now. Only a secret militia is yours.");
    if (t === "mobilize" && (f.mobilized || f.reserves < 10)) return toast("Already mobilised", "Every reserve you have is already under arms.");
    if (t === "demobilize" && !f.mobilized) return toast("Not mobilised", "Your forces are on a peacetime footing.");
    const sup = rSupplies();
    if (rebel && t === "recruit" && sup < 10) return toast("Not enough supplies", "Recruits need weapons, food and papers — 10 supplies.");
    if (rebel && t === "train" && sup < 5) return toast("Not enough supplies", "Training burns ammunition and fuel — 5 supplies.");
    if (rebel && t === "ships" && G.funds < 2) return toast("Not enough funds", "Smugglers sell old corvettes for 2M credits.");
    if (rebel && t === "fighters" && G.funds < 1) return toast("Not enough funds", "A squadron of second-hand starfighters costs 1M credits.");
    const shipCost = Math.max(0.5, Math.round(f.base.ships * 0.25 * 0.4 * 10) / 10 || 0.5) * (G.sectors && G.sectors.shipyards && G.sectors.shipyards.assets.length ? 0.75 : 1);
    if (!rebel && t === "ships" && G.treasury < shipCost) return toast("Treasury too low", `New warships cost ${shipCost.toFixed(1)}B.`);
    if (!rebel && ["recruit", "train", "fighters"].includes(t) && G.treasury < 0.3) return toast("Treasury too low", "The treasury can't pay for it.");
    if (!spendAP(costs[t])) return;
    let ch = [];
    switch (t) {
        case "mobilize": {
            const called = Math.round(f.reserves * 0.85);
            f.troops += called; f.reserves -= called; f.mobilized = true; f.morale = clamp(f.morale + 5);
            ch = applyEffects({ p: { employment: -Math.min(6, called / Math.max(1, worldPop(G.worldKey)) * 400) }, g: { military: 5, youth: -4, workers: -2, business: -2 } });
            report("📯 Mobilisation", `${fmtN(called)} reservists report to their units. ${world().name} now has ${fmtN(f.troops)} troops under arms. Factories lose workers; families lose sons and daughters.`, ch);
            break;
        }
        case "demobilize": {
            const back = Math.round(Math.max(0, f.troops - f.base.troops) * 0.8);
            f.troops -= back; f.reserves += back; f.mobilized = false;
            ch = applyEffects({ p: { employment: 2 }, g: { youth: 3, workers: 2, military: -3 } });
            report("Stand down", `${fmtN(back)} soldiers go home to their jobs.`, ch);
            break;
        }
        case "recruit": {
            if (rebel) { addSupplies(-10); const n = Math.round(f.troops * 0.12 + FORCE_BASE[worldMil(G.ug && G.ug.base ? G.ug.base : G.worldKey)] * 0.01) + ri(80, 200); f.troops += n; addExposure(3); report("New fighters", `${fmtN(n)} volunteers take up arms — farmers, dockworkers, deserters, students.`); }
            else { const n = Math.round(Math.max(f.base.troops * 0.1, 500)); f.troops += n; ch = applyEffects({ treasury: -Math.max(0.2, Math.round(n / 1e6 * 4 * 10) / 10), g: { youth: -1, military: 2 } }); report("Recruitment drive", `${fmtN(n)} new recruits enter training.`, ch); }
            break;
        }
        case "train": {
            f.training = clamp(f.training + 12);
            if (rebel) addSupplies(-5); else ch = applyEffects({ treasury: -0.4 });
            report("Drills and exercises", `Live-fire exercises, night landings, zero-g boarding drills. Readiness is now ${Math.round(f.training)}.`, ch);
            break;
        }
        case "ships": {
            if (rebel) { ch = applyEffects({ funds: -2 }); f.queue.push({ ships: 1, fighters: 0, months: 2 }); report("A ship of the line — sort of", "A smuggler sells you a battered CR90 corvette. It'll be ready in two months."); }
            else { const n = Math.max(1, Math.round(f.base.ships * 0.25)); ch = applyEffects({ treasury: -shipCost }); f.queue.push({ ships: n, fighters: 0, months: 6 }); report("Warships ordered", `${n} warship${n > 1 ? "s" : ""} laid down in the yards. Commissioning in six months.`, ch); }
            break;
        }
        case "fighters": {
            if (rebel) { ch = applyEffects({ funds: -1 }); f.queue.push({ ships: 0, fighters: 12, months: 1 }); report("A squadron", "Twelve second-hand starfighters, delivered next month by people who don't ask questions."); }
            else { const n = Math.max(12, Math.round(f.base.fighters * 0.25 / 12) * 12); ch = applyEffects({ treasury: -Math.max(0.3, Math.round(n * 0.01 * 10) / 10) }); f.queue.push({ ships: 0, fighters: n, months: 3 }); report("Starfighters ordered", `${n} starfighters ordered. Delivery in three months.`, ch); }
            break;
        }
        case "rally": f.morale = clamp(f.morale + 12); report("You address the troops", pick(["You walk the lines and shake every hand you can.", "A speech from the back of a speeder truck, in the rain. They cheer anyway.", "You eat with the troops. Word gets around."])); break;
    }
    render();
}

// The Empire takes what it wants.
function imperialRequisition(share, why) {
    const f = initForces();
    const tk = Math.round(f.troops * share), sk = Math.round(f.ships * share), fk = Math.round(f.fighters * share);
    f.troops -= tk; f.ships -= sk; f.fighters -= fk; f.under = "imperial"; f.mobilized = false;
    report("🪖 The Empire takes your army", `${why} ${fmtN(tk)} troops, ${sk} warship${sk === 1 ? "" : "s"} and ${fk} starfighters are transferred to Imperial command. What's left answers to the Moff.`);
}

// Called at the end of imperialPath().
function afterImperialPath(path, wasGov) {
    if (path === "rebel" && wasGov) { forcesDefect(0.2); if (G.ug) G.ug.base = G.worldKey; return; }
    if (path === "rebel") { if (G.ug) G.ug.base = G.worldKey; return; }
    if (!wasGov) return;
    if (path === "accept") imperialRequisition(0.6, "Your planetary forces are folded into the Imperial Army.");
    else if (path === "resist" || path === "double") imperialRequisition(0.45, "The Empire disbands planetary armies it doesn't trust.");
    else if (path === "revolt") { initForces(); frontScene("mobilize", { revolt: true }); }
}

function forcesPanel() {
    const f = initForces();
    const rebel = f.under === "rebel", imp = f.under === "imperial";
    const q = f.queue.length ? `<p class="small c-und">🛠️ On order: ${f.queue.map(x => `${x.ships ? `${x.ships} warship${x.ships > 1 ? "s" : ""}` : `${x.fighters} starfighters`} (${x.months} mo)`).join(", ")}</p>` : "";
    const cell = (icon, label, v, sub = "") => `<div class="force-cell"><span>${icon}</span><b>${v}</b><small>${label}${sub ? `<br>${sub}` : ""}</small></div>`;
    const grid = `<div class="force-grid">
        ${cell("🪖", rebel ? "fighters under arms" : "troops under arms", fmtN(f.troops), !rebel && !imp ? `${fmtN(f.reserves)} in reserve` : "")}
        ${cell("🚀", rebel ? "ships" : "warships", fmtN(f.ships))}
        ${cell("✈️", "starfighters", fmtN(f.fighters))}
    </div>`;
    const bars = `${statRow("Readiness (training)", Math.round(f.training), f.training, "good")}${statRow("Morale", Math.round(f.morale), f.morale, "good")}`;
    let body = "";
    if (imp) {
        body = `<p class="small">Most of your army now serves the Empire. What's left answers to ${typeof moffName === "function" ? esc(moffName()) : "the Moff"}, not to you.</p>${grid}${bars}
            <p class="muted small">A secret militia (Quiet resistance) is the only force that's still yours — until you declare open revolt.</p>`;
    } else if (rebel) {
        body = `<p class="small">Partisans, deserters and volunteers. Supplies feed them; victories arm them.${G.ug && G.ug.base ? ` Base: <b>${esc(worldName(G.ug.base))}</b>.` : ""}</p>${grid}${bars}${q}
            ${tact("forces", "🪖 Recruit fighters", 3, "10 supplies.", 'data-t="recruit"')}
            ${tact("forces", "🎯 Train", 3, "5 supplies. Readiness up.", 'data-t="train"')}
            ${tact("forces", "✈️ Buy a starfighter squadron", 3, "1M credits.", 'data-t="fighters"')}
            ${tact("forces", "🚀 Buy a corvette from smugglers", 4, "2M credits.", 'data-t="ships"')}
            ${tact("forces", "📣 Rally the fighters", 2, "Morale up.", 'data-t="rally"')}`;
    } else {
        const up = forcesUpkeep();
        const def = defenseStrength();
        body = `<p class="small">${f.mobilized ? "<b>Mobilised.</b> Every reservist is under arms." : "Peacetime footing. Your reserves are at home, at work."} Defence strength <b>${def}</b>${G.siege ? ` vs enemy <b class="c-against">${G.siege.str}</b>` : ""}.</p>${grid}${bars}${q}
            ${up > 0 ? `<p class="small">Cost beyond the regular defence budget: <b>${up.toFixed(2)}B a month</b> from the treasury.</p>` : ""}
            ${f.mobilized ? tact("forces", "🏠 Stand down the reserves", 2, "Workers go home; defence falls.", 'data-t="demobilize"') : tact("forces", "📯 Mobilise the reserves", 4, `${fmtN(Math.round(f.reserves * 0.85))} troops. Pulls workers out of the economy.`, 'data-t="mobilize"')}
            ${tact("forces", "🪖 Recruitment drive", 3, "More troops. Treasury cost.", 'data-t="recruit"')}
            ${tact("forces", "🎯 Training and exercises", 3, "0.4B. Readiness up.", 'data-t="train"')}
            ${tact("forces", "🚀 Order warships", 4, "Six months in the yards.", 'data-t="ships"')}
            ${tact("forces", "✈️ Order starfighters", 3, "Three months.", 'data-t="fighters"')}
            ${tact("forces", "📣 Visit the troops", 2, "Morale up.", 'data-t="rally"')}`;
    }
    return panel(rebel ? "⚔️ Your rebel forces" : `⚔️ Armed forces of ${esc(world().name)}`, body, "danger");
}


// ── Resistance state ──────────────────────────────────────────────

function initReb() {
    if (!G.reb) G.reb = { imp: 60, intel: 10, supplies: 20, agents: [], missions: [], liberated: [], won: 0, lost: 0, lastBattle: -9, lastEv: -9, recent: [], edge: 0, mole: 0, favor: 0 };
    return G.reb;
}

function resistMode() {
    if (inImperialPrison() || G.era === "newrepublic") return null;
    if (isUnderground()) return "rebel";
    if (G.revolt && governing()) return "revolt";
    if (G.office.kind === "movement" && (isEmpireEra() || G.occupied)) return "partisan";
    if (isEmpireEra() && (G.secretRebel || (G.imperial && ["resist", "double", "autonomy"].includes(G.imperial.path)))) return "inside";
    return null;
}
const fighting = () => ["rebel", "revolt", "partisan"].includes(resistMode());

function rIntel() { return G.ug ? G.ug.intel : initReb().intel; }
function addIntel(n) { if (G.ug) G.ug.intel = Math.max(0, G.ug.intel + n); else { initReb(); G.reb.intel = Math.max(0, G.reb.intel + n); } }
function rSupplies() { return G.ug ? G.ug.supplies : initReb().supplies; }
function addSupplies(n) { if (G.ug) G.ug.supplies = Math.max(0, G.ug.supplies + n); else { initReb(); G.reb.supplies = Math.max(0, G.reb.supplies + n); } }
function addExposure(n) { if (G.ug) G.ug.exposure = clamp(G.ug.exposure + n); else G.isb = clamp((G.isb || 0) + n * 0.8); }
function foeName() { return G.occupied ? G.occupied.by : G.siege ? G.siege.by : isEmpireEra() ? "Imperial" : "Separatist"; }
const FOE_UNITS = {
    Imperial: { troops: "stormtroopers", ships: "Star Destroyers", fighters: "TIE fighters", walker: "AT-ATs" },
    Separatist: { troops: "battle droids", ships: "Separatist cruisers", fighters: "droid starfighters", walker: "droid tanks" },
    Republic: { troops: "clone troopers", ships: "Venator cruisers", fighters: "V-wing fighters", walker: "AT-TEs" }
};
const foeUnits = by => FOE_UNITS[by] || FOE_UNITS.Imperial;


// ── Battles ───────────────────────────────────────────────────────

const GROUND_TACTICS = [
    { k: "assault", label: "⚔️ Full assault", hint: "Everything at once. The best chance of a decisive win — and the heaviest losses.", mod: 1.15, cas: 1.4 },
    { k: "flank", label: "🌲 Flank them through the terrain", hint: "Rewards well-trained troops.", mod: f => 0.85 + f.training / 300, cas: 0.9 },
    { k: "guerrilla", label: "🗡️ Hit and run", hint: "Small, safe gains. It can't win a decisive victory.", mod: 0.85, cas: 0.5, capped: true },
    { k: "allies", label: "✊ Call in Alliance support", hint: "Rebel gunships join the fight — if they come.", mod: 1.3, cas: 1, need: () => G.rebellion >= 25 || currentBBY() <= 2 }
];
const SPACE_TACTICS = [
    { k: "line", label: "💥 Line of battle", hint: "Ship against ship. Heavy losses either way.", mod: 1.1, cas: 1.3 },
    { k: "strike", label: "✈️ Starfighter strike on the bridge", hint: "Fighters do the work. Better the more you have.", mod: f => 0.8 + Math.min(0.5, f.fighters / Math.max(1, f.ships * 30 + 24)), cas: 0.9, need: f => f.fighters > 0 },
    { k: "jump", label: "🌀 Hit hard, then jump to hyperspace", hint: "Small, safe gains. Not a decisive victory.", mod: 0.85, cas: 0.5, capped: true },
    { k: "terrain", label: "☄️ Lure them into the asteroid field", hint: "Rewards well-trained crews.", mod: f => 0.9 + f.training / 400, cas: 0.8 }
];
const TWISTS = {
    ground: [
        { text: u => `${u.walker} break through your shield line.`, opts: [["Harpoons and tow cables — bring them down", 1.15, 1.2], ["Fall back to the second line", 0.95, 0.75], ["Throw everything at the lead machine", 1.05, 1.1]] },
        { text: u => `A battalion of ${u.troops} lands behind your lines.`, opts: [["Turn and meet them", 1.0, 1.1], ["Hold the front and trust the reserves", 0.95, 0.9], ["Ambush the drop zone", 1.12, 1.0]] },
        { text: () => "Your left flank is collapsing.", opts: [["Send in the reserve", 1.05, 1.1], ["Pull the whole line back in good order", 0.92, 0.7], ["Lead the counter-charge yourself", 1.15, 1.0, "hero"]] },
        { text: () => "Locals offer to guide your troops through old tunnels under the enemy position.", opts: [["Trust them", 1.2, 0.9, "gamble"], ["Thank them, and keep to the plan", 1.0, 1.0]] },
        { text: () => "The enemy commander offers a two-hour truce to collect the wounded.", opts: [["Accept", 0.95, 0.7], ["Refuse and press on", 1.08, 1.1]] }
    ],
    space: [
        { text: u => `A second wave of ${u.ships} drops out of hyperspace.`, opts: [["Concentrate fire on the first ship", 1.05, 1.1], ["Scatter and regroup", 0.92, 0.75], ["Ram it", 1.2, 1.3, "hero"]] },
        { text: u => `${u.fighters} swarm your bombers.`, opts: [["Escorts peel off to cover them", 1.0, 0.9], ["Press the attack run", 1.1, 1.2]] },
        { text: () => "A pilot volunteers for a suicide run at the enemy bridge.", opts: [["Approve it", 1.25, 1.0, "martyr"], ["Deny it", 1.0, 1.0]] },
        { text: () => "The enemy flagship's shield generator is exposed.", opts: [["Hit it now", 1.2, 1.1], ["Stay in formation", 1.0, 0.9]] }
    ]
};

// Sizes a fight. `abs` means fixed enemy numbers (a garrison to beat); otherwise relative to you.
function launchBattle(goal, k, free = false) {
    const f = G.forces;
    initReb();
    if (!f) return toast("No forces", "You have nobody to send.");
    if (!free && G.reb.lastBattle === monthsNow()) return toast("Regrouping", "Your forces fought this month. They need time to bury the dead and rearm.");
    const space = ["blockade", "fleet", "outpost"].includes(goal);
    if (space && f.ships + f.fighters <= 0) return toast("No ships", "You need warships or starfighters to fight in space.");
    if (f.under === "imperial") return toast("Under Imperial command", "Your army serves the Empire now.");
    const imp = G.reb.imp;
    const by = ["blockade", "counter_siege"].includes(goal) && G.siege ? G.siege.by : goal === "home" && G.occupied ? G.occupied.by : isEmpireEra() ? "Imperial" : foeName();
    let d = 1, abs = null, name = "", where = world().name;
    const ratio = () => G.siege ? clamp(G.siege.str / Math.max(10, defenseStrength()), 0.5, 2.2) : 1;
    switch (goal) {
        case "blockade": d = ratio(); name = `Breaking the blockade of ${world().name}`; break;
        case "counter_siege": d = ratio(); name = `The counter-attack on the landing zones`; break;
        case "raid": d = 0.65 + imp / 250; name = "Raid on an Imperial garrison"; break;
        case "convoy": d = 0.55 + imp / 300; name = "Ambush on a supply convoy"; break;
        case "patrol": d = 0.45; name = "Ambush on an Imperial patrol"; break;
        case "medical": d = 0.6; name = "Raid on an Imperial medical depot"; break;
        case "outpost": d = 0.7 + imp / 250; name = "Strike on an orbital outpost"; break;
        case "fleet": d = 0.9 + imp / 200; name = "Strike on the Imperial staging fleet"; break;
        case "alliance": d = 1.0; name = pick(["The Alliance strike at Mygeeto", "Operation Ringbreaker", "The raid on the Kuat supply lanes", "The Battle of Atrisian space"]); where = "far from home"; break;
        case "base": d = 0.9 + imp / 250; name = `Defence of the base on ${worldName(G.ug && G.ug.base ? G.ug.base : G.worldKey)}`; break;
        case "home": case "liberate": case "counter": {
            const tk = goal === "home" ? G.worldKey : k;
            const m = worldMil(tk);
            const gar = FORCE_BASE[m] * (goal === "counter" ? 0.35 : 0.45) * (0.6 + imp / 100) * (goal === "home" && G.occupied ? 1 : 1);
            abs = { troops: Math.round(gar), ships: Math.max(goal === "counter" ? 1 : 0, Math.round(SHIP_BASE[m] * 0.15)), fighters: Math.round(SHIP_BASE[m] * 3) };
            name = goal === "counter" ? `The Empire strikes back at ${worldName(tk)}` : `The liberation of ${worldName(tk)}`;
            where = worldName(tk);
            break;
        }
    }
    const enemy = abs || {
        troops: Math.round(Math.max(f.troops, 300) * d * rnd(0.85, 1.2)),
        ships: space ? Math.max(1, Math.round((f.ships * 20 + f.fighters) * d / 60 * rnd(0.85, 1.2))) : Math.round(f.ships * d * 0.3),
        fighters: Math.round(Math.max(f.fighters, space ? 12 : 0) * d * rnd(0.8, 1.2))
    };
    if (!free && !spendAP(goal === "alliance" ? 2 : 4)) return;
    G.reb.lastBattle = monthsNow();
    frontScene("battle", { goal, k: k || null, kind: space ? "space" : "ground", name, where, by, enemy, phase: 0 });
    render();
}

function battlePower(side, kind, isFoe) {
    if (kind === "space") return isFoe ? side.ships * 60 + side.fighters * 0.6 : side.ships * 20 + side.fighters;
    return side.troops / 1000 * (isFoe ? 1.15 : 1) + side.ships * 3 + side.fighters * 0.3;
}
function ourQuality() { const f = G.forces; return (0.6 + f.training / 125) * (0.75 + f.morale / 200) * (G.reb && G.reb.edge > 0 ? 1.1 : 1); }
function battleOdds(ctx, mod = 1) {
    const ours = battlePower(G.forces, ctx.kind, false) * ourQuality() * mod;
    const theirs = battlePower(ctx.enemy, ctx.kind, true);
    return ours / Math.max(0.01, ours + theirs);
}
const oddsLabel = r => r >= 0.62 ? "favourable" : r >= 0.52 ? "slightly in your favour" : r >= 0.42 ? "even" : r >= 0.3 ? "against you" : "hopeless";
function sideLine(s, u, kind, ours) {
    const parts = [];
    if (kind === "ground" || !ours) parts.push(`${fmtN(s.troops)} ${ours ? "troops" : u.troops}`);
    if (s.ships) parts.push(`${fmtN(s.ships)} ${ours ? (s.ships === 1 ? "warship" : "warships") : u.ships}`);
    if (s.fighters) parts.push(`${fmtN(s.fighters)} ${ours ? "starfighters" : u.fighters}`);
    return parts.join(" · ") || "almost nothing";
}

function resolveBattle(ctx, mod, cas, tag) {
    const f = G.forces;
    let r = battleOdds(ctx, mod);
    if (tag === "gamble" && chance(20)) { r *= 0.6; ctx.trap = true; }
    const score = r + rnd(-0.1, 0.1);
    const res = score >= 0.5 ? (ctx.capped ? "minor" : score >= 0.62 ? "decisive" : "win") : "loss";
    const ourFrac = clamp((0.06 + (1 - r) * 0.3) * cas, 0.02, 0.7);
    const foeFrac = clamp((0.06 + r * 0.3) * (res === "decisive" ? 1.3 : 1) * (ctx.capped ? 0.6 : 1), 0.03, 0.85);
    const roundP = x => Math.floor(x) + (Math.random() < x % 1 ? 1 : 0);
    const lost = {
        troops: Math.round(f.troops * ourFrac * (ctx.kind === "space" ? 0.05 : 1)),
        ships: roundP(f.ships * ourFrac * (ctx.kind === "space" ? 0.8 : 0.1)),
        fighters: roundP(f.fighters * ourFrac * (ctx.kind === "space" ? 1.3 : 0.4))
    };
    const killed = {
        troops: Math.round(ctx.enemy.troops * foeFrac * (ctx.kind === "space" ? 0.05 : 1)),
        ships: roundP(ctx.enemy.ships * foeFrac * (ctx.kind === "space" ? 0.7 : 0.1)),
        fighters: roundP(ctx.enemy.fighters * foeFrac * 1.2)
    };
    f.troops = Math.max(0, f.troops - lost.troops); f.ships = Math.max(0, f.ships - lost.ships); f.fighters = Math.max(0, f.fighters - lost.fighters);
    f.morale = clamp(f.morale + (res === "decisive" ? 14 : res === "win" ? 8 : res === "minor" ? 3 : -12));
    f.training = clamp(f.training + 3);
    let hero = null;
    if (tag === "martyr") { hero = randomName(G.worldKey); fallen(hero, "pilot, flew into the enemy bridge"); }
    if (tag === "hero") { if (chance(res === "loss" ? 30 : 8)) applyEffects({ health: -ri(10, 25) }); }
    if (res === "loss" && chance(25)) { hero = hero || randomName(G.worldKey); fallen(hero, `officer, killed in ${ctx.name.toLowerCase()}`); }
    if (res === "loss") G.reb.lost++; else G.reb.won++;
    const text = battleConsequence(ctx, res);
    return { res, lost, killed, text, hero, trap: !!ctx.trap };
}

function battleConsequence(ctx, res) {
    const win = res === "decisive" || res === "win", w = world();
    const R = G.reb;
    switch (ctx.goal) {
        case "blockade": case "counter_siege": {
            const s = G.siege;
            if (!s) return "The enemy had already gone.";
            if (res === "decisive" || (win && s.str < defenseStrength() * 0.9)) {
                G.siege = null; G.warRecord++;
                G.record.agreements.push(`Broke the ${s.by} attack on ${w.name} in battle (${eraYear(currentBBY())})`);
                applyEffects({ trust: 6, rep: 4, g: { military: 6, veterans: 4, elders: 3 } });
                return `The ${s.by} force breaks and runs. ${w.name} is free of them.`;
            }
            if (win || res === "minor") { s.str = Math.max(10, s.str - (res === "minor" ? 8 : 20)); return `The enemy reels. Their strength falls to ${s.str}.`; }
            s.str += 8;
            if (s.str > defenseStrength() * 1.3 && chance(20)) { occupy(s.by); return "The defences collapse. The enemy lands in force."; }
            return `You're thrown back. The enemy's strength grows to ${s.str}.`;
        }
        case "raid": if (win || res === "minor") { addSupplies(res === "minor" ? 10 : 25); R.imp = clamp(R.imp - (res === "decisive" ? 5 : 3), 15, 95); G.rebellion = clamp(G.rebellion + 3); addExposure(6); return "The garrison's armoury is yours: blasters, explosives, ration packs."; } addExposure(10); return "The garrison was ready. You leave your dead behind.";
        case "convoy": if (win || res === "minor") { addSupplies(res === "minor" ? 12 : 30); if (res !== "minor") applyEffects({ funds: 0.5 }); addExposure(5); return "Fuel, food, medicine, and a strongbox of Imperial credits."; } return "The convoy had a heavier escort than anyone knew.";
        case "patrol": if (win || res === "minor") { addSupplies(6); addExposure(-6); return "No survivors to report where your base is."; } addExposure(15); return "Someone got a message out. They know you're here.";
        case "medical": if (win || res === "minor") { addSupplies(15); G.forces.morale = clamp(G.forces.morale + 6); return "Bacta, painkillers and a surgical droid. Your wounded will live."; } return "The depot was a trap. Your wounded wait.";
        case "outpost": if (win || res === "minor") { R.imp = clamp(R.imp - 4, 15, 95); G.rebellion = clamp(G.rebellion + 3); if (res === "decisive") G.forces.fighters += 6; return "The outpost burns in orbit. The sector's patrols go blind for weeks."; } return "The outpost's guns tear your squadron apart.";
        case "fleet": if (G.revolt && (win || res === "minor")) { G.revolt.next += res === "minor" ? 3 : ri(6, 10); return "The staging fleet is scattered. The next invasion will be months late."; } if (G.revolt) G.revolt.next = Math.max(monthsNow() + 1, G.revolt.next - 3); return win ? "The fleet is scattered." : "The Empire knows you're coming now. The next wave will be sooner.";
        case "alliance": { const m = canonNpc("mothma"); if (win || res === "minor") { G.rebellion = clamp(G.rebellion + 6); addSupplies(20); R.favor += 2; if (m) changeRel(m, 10, "Fought beside the Alliance."); return "High Command sends its thanks — and crates of weapons."; } if (m) changeRel(m, 3, "Fought beside the Alliance."); return "The operation fails. The Alliance remembers you came."; }
        case "base": if (win || res === "minor") { addExposure(-10); return "The Empire's assault breaks on your defences. They will think twice."; } addSupplies(-20); addExposure(15); return "You evacuate under fire, leaving half your stores behind.";
        case "home": if (win) { liberateHome(); return `${w.name} is free.`; } return `The liberation of ${w.name} fails. The garrison holds the capital.`;
        case "liberate": if (win) { liberateWorld(ctx.k); return `${worldName(ctx.k)} is free.`; } return `The ${worldName(ctx.k)} garrison holds.`;
        case "counter": if (win || res === "minor") return `${worldName(ctx.k)} stays free.`; G.galaxy[ctx.k].align = "empire"; R.liberated = R.liberated.filter(x => x !== ctx.k); R.imp = clamp(R.imp + 5, 15, 95); return `${worldName(ctx.k)} falls back under Imperial rule. The reprisals begin.`;
    }
    return "";
}

function liberateWorld(k) {
    const R = initReb();
    G.galaxy[k].align = "rebel";
    if (!R.liberated.includes(k)) R.liberated.push(k);
    R.imp = clamp(R.imp - 6, 15, 95);
    G.rebellion = clamp(G.rebellion + 5);
    G.record.agreements.push(`Liberated ${worldName(k)} from the Empire (${eraYear(currentBBY())})`);
    applyEffects({ rep: 5 });
}

function liberateHome() {
    const w = world(), f = G.forces;
    G.occupied = null; G.siege = null;
    G.allegiance = "rebel"; G.galaxy[G.worldKey].align = "rebel";
    if (f) { f.under = "planetary"; f.troops += Math.round(FORCE_BASE[worldMil(G.worldKey)] * 0.25); f.reserves = Math.round(f.troops * 0.5); f.mobilized = true; f.base = { troops: f.troops, ships: f.ships, fighters: f.fighters }; }
    G.ug = null;
    setOffice(makeOffice({ title: `President of Free ${w.name}`, kind: "executive", desc: "Head of a liberated world. The Empire will be back.", fresh: true }));
    G.revolt = { stage: "free", months: 0, waves: 0, next: monthsNow() + ri(6, 12) };
    G.isb = 60; addWrath(15);
    G.record.agreements.push(`Liberated ${w.name} and led its free government (${eraYear(currentBBY())})`);
    applyEffects({ legitimacy: 20, trust: 10, g: { youth: 8, military: 6, elders: 4 } });
}

function battleTactics(ctx) {
    const f = G.forces;
    const list = ctx.kind === "space" ? SPACE_TACTICS : GROUND_TACTICS;
    return list.map(t => {
        const mod = typeof t.mod === "function" ? t.mod(f) : t.mod;
        const ok = !t.need || t.need(f);
        return { label: t.label, hint: `${t.hint} Odds: ${oddsLabel(battleOdds(ctx, mod))}.`, disabled: !ok, go: c => {
            const twist = pick(TWISTS[c.kind]);
            const u = foeUnits(c.by);
            frontScene("battle_turn", { ...c, mod, cas: t.cas, capped: !!t.capped, tactic: t.label, twist: twist.text(u), opts: twist.opts, allies: t.k === "allies" && chance(35) });
        } };
    }).concat([{ label: "🏳️ Pull back", hint: "No battle. Morale falls.", go: () => { G.forces.morale = clamp(G.forces.morale - 8); G.reb.lastBattle = -9; report("You pull back", "No one dies today. Not everyone thinks that was the right call."); } }]);
}

Object.assign(SCENES, {
    battle: ctx => {
        const u = foeUnits(ctx.by);
        return { tag: ctx.kind === "space" ? "SPACE BATTLE" : "GROUND BATTLE", title: ctx.name,
            body: `<div class="battle-sides"><div><h4>Your forces</h4><p>${sideLine(G.forces, u, ctx.kind, true)}</p><p class="small muted">Readiness ${Math.round(G.forces.training)} · morale ${Math.round(G.forces.morale)}</p></div>
                <div><h4>${esc(ctx.by)} forces</h4><p>${sideLine(ctx.enemy, u, ctx.kind, false)}</p></div></div>
                <p>Odds before the first shot: <b>${oddsLabel(battleOdds(ctx))}</b>${G.reb.edge > 0 ? " — your stolen intelligence gives you an edge" : ""}. How do you fight?</p>`,
            choices: battleTactics(ctx) };
    },
    battle_turn: ctx => ({
        tag: "THE BATTLE TURNS", title: ctx.twist,
        body: `<p>You chose: <b>${esc(ctx.tactic)}</b>.${ctx.allies ? " <b>Rebel gunships drop out of hyperspace and join the fight.</b>" : ""}</p><p>${esc(ctx.twist)} Your officers look at you.</p>`,
        choices: ctx.opts.map(([label, mod, cas, tag]) => ({ label, go: c => {
            const out = resolveBattle(c, c.mod * mod * (c.allies ? 1.25 : 1), c.cas * cas, tag);
            frontScene("battle_result", { name: c.name, by: c.by, kind: c.kind, ...out });
        } }))
    }),
    battle_result: ctx => {
        const u = foeUnits(ctx.by);
        const head = { decisive: "⭐ A decisive victory", win: "✅ Victory", minor: "🗡️ A sharp blow", loss: "❌ Defeat" }[ctx.res];
        const L = (s, ours) => [s.troops && `${fmtN(s.troops)} ${ours ? "troops" : u.troops}`, s.ships && `${s.ships} ${ours ? "warship" + (s.ships > 1 ? "s" : "") : u.ships}`, s.fighters && `${s.fighters} ${ours ? "starfighters" : u.fighters}`].filter(Boolean).join(", ") || "almost none";
        return { tag: "AFTER THE BATTLE", title: `${head}: ${ctx.name}`,
            body: `${ctx.trap ? "<p class=\"c-against\">The guides led you into a trap.</p>" : ""}<p>${esc(ctx.text)}</p>
                <div class="battle-sides"><div><h4>Your losses</h4><p>${L(ctx.lost, true)}</p></div><div><h4>${esc(ctx.by)} losses</h4><p>${L(ctx.killed, false)}</p></div></div>
                ${ctx.hero ? `<p class="small">Among the dead: <b>${esc(ctx.hero)}</b>.</p>` : ""}
                <p class="small muted">Your forces now: ${fmtN(G.forces.troops)} troops · ${G.forces.ships} ships · ${G.forces.fighters} starfighters · morale ${Math.round(G.forces.morale)}.</p>`,
            choices: [{ label: "Continue", go: () => log(`⚔️ ${ctx.name}: ${head.replace(/^\S+ /, "")}.`, "history") }] };
    },

    mobilize: ctx => {
        const f = initForces(), w = world();
        const called = Math.round(f.reserves * 0.85), half = Math.round(f.reserves * 0.4);
        const intro = ctx.revolt ? `<p>The Empire will answer ${esc(w.name)}'s defiance with Star Destroyers. Your generals are waiting for orders.</p>`
            : `<p>The galaxy is at war. Your generals want to know how ready ${esc(w.name)} should be.</p>`;
        return { tag: "WAR FOOTING", title: `Mobilise the armed forces of ${w.name}?`,
            body: `${intro}<div class="force-grid"><div class="force-cell"><span>🪖</span><b>${fmtN(f.troops)}</b><small>troops under arms<br>${fmtN(f.reserves)} in reserve</small></div><div class="force-cell"><span>🚀</span><b>${f.ships}</b><small>warships</small></div><div class="force-cell"><span>✈️</span><b>${f.fighters}</b><small>starfighters</small></div></div>
                <p class="small">Defence strength now: <b>${defenseStrength()}</b>. Full mobilisation calls up ${fmtN(called)} reservists — they leave their jobs, and the treasury pays them.</p>`,
            choices: [
                { label: `📯 Full mobilisation (+${fmtN(called)} troops)`, hint: "Strongest defence. Hits the economy.", go: () => { f.troops += called; f.reserves -= called; f.mobilized = true; f.morale = clamp(f.morale + 6); applyEffects({ p: { employment: -Math.min(6, called / Math.max(1, worldPop(G.worldKey)) * 400) }, g: { military: 6, youth: -4, workers: -2 } }); report("📯 Mobilisation", `${fmtN(called)} reservists report for duty. ${fmtN(f.troops)} troops are now under arms.`); } },
                { label: `🪖 Partial mobilisation (+${fmtN(half)} troops)`, hint: "A middle course.", go: () => { f.troops += half; f.reserves -= half; f.mobilized = true; applyEffects({ p: { employment: -Math.min(3, half / Math.max(1, worldPop(G.worldKey)) * 400) }, g: { military: 3, youth: -2 } }); report("Partial mobilisation", `${fmtN(half)} reservists called up.`); } },
                { label: "🏠 Stay on a peacetime footing", hint: "The economy keeps its workers. You keep your fingers crossed.", go: () => applyEffects({ g: { business: 2, military: -3 } }) }
            ] };
    }
});


// ── Espionage ─────────────────────────────────────────────────────

const MISSIONS = {
    codes:    { name: "Steal Imperial codes", icon: "🔑", months: 2, base: 55, desc: "Intelligence +30." },
    plans:    { name: "Steal troop movements", icon: "🗺️", months: 3, base: 45, desc: "Six months of battlefield edge; the next invasion is weaker." },
    sabotage: { name: "Sabotage a weapons factory", icon: "💣", months: 2, base: 45, desc: "Weakens the Empire in the sector — and any fleet overhead." },
    mole:     { name: "Plant a mole in the Moff's office", icon: "🐀", months: 3, base: 40, desc: "A year of warnings. ISB attention falls." },
    rescue:   { name: "Rescue political prisoners", icon: "⛓️", months: 2, base: 45, desc: "New recruits and a new agent." },
    turn:     { name: "Turn an Imperial officer", icon: "🎖️", months: 3, base: 35, desc: "A defector brings a ship — or a fortune in intelligence." },
    expose:   { name: "Expose the Moff's corruption", icon: "📰", months: 2, base: 50, desc: "The Empire's grip loosens. ISB scrambles." },
    slice:    { name: "Slice the HoloNet relay", icon: "📡", months: 1, base: 60, desc: "The truth on every screen for an hour." }
};
const AGENT_ROLES = ["slicer", "forger", "pilot", "former Imperial officer", "courier", "infiltrator", "smuggler", "medic"];

function agents() {
    if (G.ug) { G.ug.comrades.forEach(c => { if (c.skill == null) c.skill = ri(1, 4); }); return G.ug.comrades; }
    return initReb().agents;
}
const readyAgents = () => agents().filter(a => a.status === "active" && !a.mission).sort((a, b) => b.skill - a.skill);

function recruitAgent() {
    if (G.ug) return ugAction("recruit");
    if (G.funds < 1) return toast("Not enough funds", "Agents need paying — 1M credits.");
    if (!spendAP(2)) return;
    const a = { name: randomName(G.worldKey), role: pick(AGENT_ROLES), skill: ri(1, 4), status: "active" };
    initReb().agents.push(a);
    applyEffects({ funds: -1 });
    addExposure(3);
    report("A new agent", `${a.name}, a ${a.role}, agrees to work for you. ${"★".repeat(a.skill)}`);
    render();
}

function missionOdds(type, a) {
    const M = MISSIONS[type];
    return clamp(M.base + (a ? a.skill * 6 : 0) + rIntel() / 5 - (G.ug ? G.ug.exposure : (G.isb || 0)) / 4 + (G.reb.mole > 0 ? 10 : 0), 5, 92);
}

function startMission(type) {
    initReb();
    const a = readyAgents()[0];
    if (!a) return toast("No agent available", "Every agent you have is already in the field, captured or dead. Recruit another.");
    if (G.reb.missions.some(m => m.type === type)) return toast("Already running", "You already have someone on that.");
    if (!spendAP(3)) return;
    a.mission = true;
    G.reb.missions.push({ type, agent: a.name, months: MISSIONS[type].months });
    addExposure(2);
    report(`${MISSIONS[type].icon} Mission begins`, `${a.name} (${a.role}) goes in: ${MISSIONS[type].name.toLowerCase()}. ${MISSIONS[type].months} month${MISSIONS[type].months > 1 ? "s" : ""}.`);
    render();
}

function missionSuccess(type) {
    const R = G.reb;
    switch (type) {
        case "codes": addIntel(30); return "Imperial codes for the whole sector — patrol routes, garrison rosters, supply schedules.";
        case "plans": R.edge = 6; if (G.siege) G.siege.str = Math.max(10, G.siege.str - 15); return "Troop movements for half a year. Your commanders will know where the Empire is going before it gets there.";
        case "sabotage": R.imp = clamp(R.imp - 6, 15, 95); if (G.siege) G.siege.str = Math.max(10, G.siege.str - 20); G.rebellion = clamp(G.rebellion + 3); return "The factory's reactor goes critical at shift change. Production stops for months.";
        case "mole": R.mole = 12; return "Your mole has a desk outside the Moff's door. You'll hear things before they happen.";
        case "rescue": { const a = { name: randomName(G.worldKey), role: pick(AGENT_ROLES), skill: ri(2, 4), status: "active" }; agents().push(a); if (G.forces && G.forces.under === "rebel") G.forces.troops += ri(40, 120); applyEffects({ rep: 4 }); return `Forty prisoners walk out of a labour camp. One of them, ${a.name}, a ${a.role}, wants to work for you.`; }
        case "turn": if (G.forces && chance(50)) { G.forces.ships += 1; G.forces.fighters += 12; return "An Imperial captain brings his frigate — and its fighter wing — over to your side."; } addIntel(40); return "An Imperial major hands over everything he knows. It's a lot.";
        case "expose": R.imp = clamp(R.imp - 4, 15, 95); G.isb = Math.max(0, (G.isb || 0) - 10); if (typeof G.moffTrust === "number") G.moffTrust = Math.max(0, G.moffTrust - 10); return "The Moff's skimming hits the HoloNet. Coruscant recalls him; his replacement has to start from scratch.";
        case "slice": G.rebellion = clamp(G.rebellion + 3); G.truth = (G.truth || 0) + 2; applyEffects({ rep: 2 }); return "For an hour, every screen in the sector shows what the Empire did at Ghorman, Jedha and a hundred places nobody's heard of.";
    }
    return "";
}

function tickMissions() {
    const R = G.reb;
    R.missions.forEach(m => m.months--);
    const done = R.missions.filter(m => m.months <= 0);
    R.missions = R.missions.filter(m => m.months > 0);
    done.forEach(m => pushScene("spy_report", { type: m.type, agent: m.agent }));
}

Object.assign(SCENES, {
    spy_report: ctx => {
        const M = MISSIONS[ctx.type];
        const a = agents().find(x => x.name === ctx.agent);
        if (ctx.complication == null) ctx.complication = chance(40);
        const odds = Math.round(missionOdds(ctx.type, a));
        const finish = (bonus, safe) => () => {
            if (a) a.mission = false;
            if (chance(odds + bonus)) { report(`${M.icon} Mission success`, missionSuccess(ctx.type)); if (a && chance(25)) a.skill = Math.min(5, a.skill + 1); return; }
            if (safe) { report(`${M.icon} Mission aborted`, `${ctx.agent} gets out with nothing — but gets out.`); addExposure(2); return; }
            addExposure(10);
            if (a && chance(50)) { a.status = "dead"; fallen(a.name, `${a.role}, killed on a mission`); report(`${M.icon} Agent lost`, `${ctx.agent} doesn't come back.`); }
            else if (a) { a.status = "captured"; report(`${M.icon} Agent captured`, `${ctx.agent} is taken by the ISB. They know things.`); addExposure(10); }
        };
        return { tag: "AGENT REPORT", title: `${M.icon} ${M.name}`,
            body: ctx.complication ? `<p><b>${esc(ctx.agent)}</b> sends a burst transmission: <i>“I think they're onto me. I can get out now — or finish the job.”</i></p><p class="small muted">Chance of success if they stay: ~${clamp(odds - 10, 5, 90)}%.</p>`
                : `<p><b>${esc(ctx.agent)}</b> is in position. It's time.</p><p class="small muted">Chance of success: ~${odds}%.</p>`,
            choices: ctx.complication ? [
                { label: "Finish the job", hint: "Riskier.", go: finish(-10, false) },
                { label: "Get out now", hint: "Safe. Nothing gained.", go: finish(-100, true) }
            ] : [{ label: "Go", go: finish(0, false) }] };
    }
});

function spyPanel() {
    const list = agents();
    const ready = readyAgents();
    const rows = list.slice(0, 10).map(a => `<li class="${a.status}"><b>${esc(a.name)}</b> — ${esc(a.role)} <span class="agent-stars">${"★".repeat(a.skill || 1)}</span> <span class="muted">${a.mission ? "· in the field" : { active: "", captured: "· captured", dead: "· dead", left: "· gone" }[a.status] || ""}</span></li>`).join("");
    const active = G.reb.missions.map(m => `<p class="small c-und">${MISSIONS[m.type].icon} ${esc(m.agent)}: ${MISSIONS[m.type].name} — ${m.months} mo</p>`).join("");
    const best = ready[0];
    const btns = Object.entries(MISSIONS).map(([k, M]) => tact("mission", `${M.icon} ${M.name}`, 3, `${M.desc} ${best ? `~${Math.round(missionOdds(k, best))}% with ${esc(best.name)}.` : ""}`, `data-t="${k}"`, !best || G.reb.missions.some(m => m.type === k))).join("");
    return panel("🕵️ Your spy network", `<p class="small">Agents run the missions you can't be seen doing. The best free agent takes each job. ${G.reb.mole > 0 ? `🐀 Your mole is in place (${G.reb.mole} months).` : ""}</p>
        ${statRow("Intelligence", Math.round(rIntel()), Math.min(100, rIntel()), "good")}
        <ul class="small comrades">${rows || "<li class=\"muted\">No agents yet.</li>"}</ul>
        ${G.ug ? "" : tact("recruitagent", "🧑‍💼 Recruit an agent", 2, "1M credits.")}
        ${active}${btns}`, "danger");
}


// ── Resistance worlds and fleeing ─────────────────────────────────

const HAVENS = [
    { key: "onderon", from: 19, to: -5, text: "Saw Gerrera's partisans still hold the jungles beyond Iziz." },
    { key: "kashyyyk", from: 19, to: -5, text: "Wookiee clans fight on from the Shadowlands, beneath the wroshyr trees." },
    { key: "ryloth", from: 19, to: -5, text: "Cham Syndulla's Free Ryloth fighters hide in the caves of the night side." },
    { key: "lothal", from: 5, to: 1, text: "A small cell — Spectres — runs operations out of the Lothal plains." },
    { key: "jedha", from: 5, to: 0, text: "Saw Gerrera's Partisans in the catacombs of the Holy City." },
    { key: "moncala", from: 2, to: -5, text: "Mon Cala's fleet is joining the Alliance." },
    { key: "hoth", from: -1, to: -3, text: "Echo Base, buried in the ice of Hoth." }
];

function havens() {
    const bby = currentBBY();
    const out = HAVENS.filter(h => bby <= h.from && bby >= h.to && G.galaxy[h.key] && !G.galaxy[h.key].destroyed && h.key !== G.worldKey).map(h => ({ key: h.key, text: h.text }));
    Object.entries(G.galaxy).forEach(([k, s]) => { if (s.align === "rebel" && k !== G.worldKey && !s.destroyed && !out.some(h => h.key === k)) out.push({ key: k, text: "A world your forces freed. It needs defending." }); });
    return out;
}

function fleeTo(k) {
    if (!spendAP(3)) return;
    frontScene("flee_escape", { k });
    render();
}

function completeFlee(k) {
    const was = G.office.title, wasGov = governing() || G.office.kind === "council";
    if (!isUnderground()) {
        G.allegiance = "rebel";
        if (wasGov) forcesDefect(0.2);
        startUnderground(wasGov);
        enterOutsider("Rebel Organizer");
        G.record.agreements.push(`Fled to ${worldName(k)} to fight the Empire, leaving the office of ${was} (${eraYear(currentBBY())})`);
    }
    G.office.title = `Rebel leader in exile on ${worldName(k)}`;
    G.ug.base = k;
    G.ug.exposure = clamp(G.ug.exposure - 30);
    const locals = Math.round(Math.min(FORCE_BASE[worldMil(k)] * 0.02, worldPop(k) * 0.002)) + ri(200, 600);
    initRebelForces(0);
    G.forces.troops += locals;
    G.rebellion = clamp(G.rebellion + 2);
    report("🚀 Safe — for now", `You reach ${worldName(k)}. ${fmtN(locals)} local fighters put themselves under your command.`);
}

function raiseHome(free = false) {
    const w = world(), was = G.office.title;
    if (!free && !spendAP(4)) return;
    G.allegiance = "rebel";
    startUnderground();
    enterOutsider("Rebel Organizer");
    G.office.title = `Leader of the ${w.name} Resistance`;
    G.ug.base = G.worldKey;
    initRebelForces(Math.round(FORCE_BASE[worldMil(G.worldKey)] * 0.03));
    G.rebellion = clamp(G.rebellion + 3);
    addWrath(10);
    G.record.agreements.push(`Left the office of ${was} to raise ${w.name} against the Empire (${eraYear(currentBBY())})`);
    report("✊ Home to fight", `You slip back to ${w.name} and into the hills. ${fmtN(G.forces.troops)} partisans answer the call. Liberating ${w.name} will take an army — build one.`, applyEffects({ f: { reformers: 6, independence: 6, militarists: -6 } }));
    render();
}

function declareRevolt() {
    if (!spendAP(5)) return;
    if (G.forces && G.forces.under === "imperial") { G.forces.under = "planetary"; G.forces.troops += Math.round(FORCE_BASE[worldMil(G.worldKey)] * 0.15) + (G.secretMilitia || 0) * 2000; G.forces.base = { troops: G.forces.troops, ships: G.forces.ships, fighters: G.forces.fighters }; }
    imperialPath("revolt");
    render();
}

Object.assign(SCENES, {
    flee_pick: () => ({ tag: "THE DARK TIMES", title: "Where will you go?",
        body: `<p>Some worlds are still fighting. Pick one — you'll have to get past the ISB to reach it.</p>${havens().map(h => `<p class="small"><b>${esc(worldName(h.key))}</b> — ${esc(h.text)}</p>`).join("")}`,
        choices: havens().map(h => ({ label: `🚀 ${worldName(h.key)}`, go: () => frontScene("flee_escape", { k: h.key }) })).concat([{ label: "Stay where you are", go: () => imperialPath("resist") }]) }),
    flee_escape: ctx => {
        const d = danger();
        return { tag: "ESCAPE", title: `Getting to ${worldName(ctx.k)}`,
            body: `<p>The spaceport is crawling with ISB. Your face is on a list — how high up depends on what you've done. <b>Danger: ${dangerLabel(d)}</b>.</p>`,
            choices: [
                { label: "🪪 Forged papers and a commercial liner", hint: `~${Math.round(clamp(80 - d * 0.6, 10, 90))}% chance.`, go: () => chance(80 - d * 0.6) ? completeFlee(ctx.k) : frontScene("emp_interrogation", {}) },
                { label: "💰 Bribe a customs officer", hint: `0.5M credits. ~${Math.round(clamp(88 - d * 0.5, 15, 95))}%.`, disabled: G.funds < 0.5, go: () => { applyEffects({ funds: -0.5 }); chance(88 - d * 0.5) ? completeFlee(ctx.k) : frontScene("emp_interrogation", {}); } },
                { label: "📦 A smuggler's hidden compartment", hint: `Four days in a box. ~${Math.round(clamp(92 - d * 0.4, 20, 95))}%.`, go: () => { applyEffects({ health: -5 }); chance(92 - d * 0.4) ? completeFlee(ctx.k) : frontScene("emp_interrogation", {}); } },
                { label: "Turn back", go: () => {} }
            ] };
    }
});

function havenPanel() {
    const mode = resistMode();
    const H = havens();
    const w = world();
    let out = "";
    if (governing() && imperialWorld()) out += tact("declarerevolt", `✊ Declare ${esc(w.name)} in open revolt`, 5, "Your world becomes a resistance planet. The Empire will come with Star Destroyers.");
    if (!governing() && mode !== "rebel" && isEmpireEra() && G.galaxy[G.worldKey].align !== "rebel") out += tact("raisehome", `✊ Go home and raise ${esc(w.name)} against the Empire`, 4, "Leave your post. Lead the partisans. Liberate your world.");
    const list = H.filter(h => !(G.ug && G.ug.base === h.key)).map(h => `<div class="haven"><div><b>${esc(worldName(h.key))}</b><p class="small">${esc(h.text)}</p></div><button class="mini" data-act="flee" data-k="${h.key}" ${G.ap < 3 ? "disabled" : ""}>${mode === "rebel" ? "Move base · 3" : "Flee · 3"}</button></div>`).join("");
    if (list) out += `<h4>${mode === "rebel" ? "Move your base" : "Flee to a resistance world"}</h4>${list}`;
    if (!out) return "";
    return panel("🌍 Resistance worlds", `<p class="small">${mode === "rebel" ? "You can move to another world that's still fighting." : "Some worlds are still fighting. You can leave everything and join them — or make your own world one of them."}</p>${out}`, "danger");
}


// ── The war room ──────────────────────────────────────────────────

function liberationTargets() {
    const base = G.ug && G.ug.base ? G.ug.base : G.worldKey;
    const region = (WORLDS[base] || BACKGROUND_WORLDS[base] || world()).region;
    return Object.keys(G.galaxy).filter(k => k !== G.worldKey && G.galaxy[k].align === "empire" && !G.galaxy[k].destroyed && k !== "coruscant")
        .sort((a, b) => ((WORLDS[a] || BACKGROUND_WORLDS[a]).region === region ? 0 : 1) - ((WORLDS[b] || BACKGROUND_WORLDS[b]).region === region ? 0 : 1) || worldMil(a) - worldMil(b)).slice(0, 4);
}
const garrisonSize = (k, goal = "liberate") => Math.round(FORCE_BASE[worldMil(k)] * 0.45 * (0.6 + initReb().imp / 100));

function warRoomPanel() {
    const mode = resistMode(), f = G.forces, R = initReb();
    if (!f) return "";
    const regroup = R.lastBattle === monthsNow();
    const b = (goal, label, note, k = "") => tact("battle", label, goal === "alliance" ? 2 : 4, note, `data-t="${goal}" ${k ? `data-k="${k}"` : ""}`, regroup);
    let out = "";
    if (G.siege && (governing() || mode === "partisan")) out += `<p class="c-against small"><b>${esc(G.siege.by)} forces in the system</b> — strength ${G.siege.str} vs your defence ${defenseStrength()}.</p>`
        + (f.ships + f.fighters > 0 ? b("blockade", "🚀 Break the blockade", "A space battle against the enemy fleet.") : "")
        + b("counter_siege", "⚔️ Counter-attack the landing zones", "A ground battle.");
    if (G.occupied && ["rebel", "partisan"].includes(mode) && (!G.ug || !G.ug.base || G.ug.base === G.worldKey)) out += b("home", `🔥 Rise up: liberate ${esc(world().name)}`, `The ${esc(G.occupied.by)} garrison is about ${fmtN(garrisonSize(G.worldKey))} strong.`);
    if (["rebel", "partisan"].includes(mode) && isEmpireEra()) {
        if (G.galaxy[G.worldKey].align !== "rebel" && !G.occupied) out += b("home", `🔥 Liberate ${esc(world().name)}`, `The Imperial garrison is about ${fmtN(garrisonSize(G.worldKey))} strong. You have ${fmtN(f.troops)}.`);
        out += b("raid", "🏚️ Raid an Imperial garrison", "Weapons and supplies. The Empire will hunt you.")
            + b("convoy", "📦 Ambush a supply convoy", "Supplies and credits.")
            + (f.ships + f.fighters > 0 ? b("outpost", "🛰️ Strike an orbital outpost", "A space battle. Blinds the sector's patrols.") : "");
    }
    if (mode === "revolt") {
        out += `<p class="small">${G.revolt.stage === "free" ? `The Empire's next invasion is expected in about <b>${Math.max(0, G.revolt.next - monthsNow())} months</b>.` : ""}</p>`;
        if (G.revolt.stage === "free" && f.ships + f.fighters > 0) out += b("fleet", "🚀 Strike the Imperial staging fleet", "Delay the next invasion — or bring it sooner.");
    }
    if (fighting() && (G.rebellion >= 25 || currentBBY() <= 2)) out += b("alliance", "✊ Join an Alliance operation", "Far from home. The Alliance remembers who came.");
    if (fighting() && isEmpireEra()) {
        const T = liberationTargets();
        if (T.length) out += `<h4>Liberate a world</h4>` + T.map(k => b("liberate", `🏳️ Liberate ${esc(worldName(k))}`, `Garrison about ${fmtN(garrisonSize(k))}. You have ${fmtN(f.troops)} troops.`, k)).join("");
    }
    if (!out) return "";
    const free = R.liberated.length ? `<p class="small">Free worlds: ${R.liberated.map(k => `<b>${esc(worldName(k))}</b>`).join(", ")}</p>` : "";
    return panel("🗺️ War room", `${regroup ? '<p class="small muted">Your forces fought this month and are regrouping.</p>' : ""}
        ${isEmpireEra() ? statRow("The Empire's grip on the sector", Math.round(R.imp), R.imp, "bad") : ""}
        <p class="small muted">Battles won ${R.won} · lost ${R.lost}${R.edge > 0 ? ` · 🗺️ stolen troop movements (${R.edge} mo)` : ""}</p>${free}${out}`, "danger");
}

// Everything the war adds to the Powers tab.
function resistancePanels() {
    const mode = resistMode();
    let out = "";
    const showForces = mode === "rebel" || mode === "partisan" || ((governing() || G.office.kind === "council") && (G.war || G.siege || G.occupied || G.revolt || isEmpireEra()));
    if (showForces) {
        if (mode === "rebel" || mode === "partisan") {
            if (!G.forces) initRebelForces(mode === "partisan" ? Math.round(FORCE_BASE[worldMil(G.worldKey)] * 0.02) : 0);
            else if (G.forces.under !== "rebel") forcesDefect(mode === "rebel" ? 0.1 : 0.3);
        }
        out += forcesPanel();
    }
    out += warRoomPanel();
    if (mode) out += spyPanel();
    if (isEmpireEra() && G.era !== "newrepublic" && !inImperialPrison()) out += havenPanel();
    return out;
}


// ── The war council: problems that come to you ────────────────────

const REB_EVENTS = {
    reb_patrol:    { modes: ["rebel", "partisan"], w: 3 },
    reb_convoy:    { modes: ["rebel", "partisan", "revolt"], w: 3 },
    reb_defector:  { modes: ["rebel", "partisan", "revolt", "inside"], w: 2 },
    reb_village:   { modes: ["rebel", "partisan", "revolt"], w: 2 },
    reb_arms:      { modes: ["rebel", "partisan", "revolt", "inside"], w: 2 },
    reb_hotheads:  { modes: ["rebel", "partisan"], w: 2 },
    reb_prisoners: { modes: ["rebel", "partisan", "revolt"], w: 1, need: () => G.reb.won > 0 },
    reb_alliance:  { modes: ["rebel", "partisan", "revolt"], w: 2, need: () => G.rebellion >= 25 || currentBBY() <= 2 },
    reb_destroyer: { modes: ["revolt"], w: 3, need: () => G.revolt && G.revolt.stage === "free" },
    reb_wounded:   { modes: ["rebel", "partisan", "revolt"], w: 2 },
    reb_recruits:  { modes: ["rebel", "partisan"], w: 2 },
    reb_assault:   { modes: ["rebel"], w: 2, need: () => G.ug && G.ug.exposure >= 35 },
    reb_courier:   { modes: ["inside"], w: 3 },
    reb_leak:      { modes: ["inside"], w: 3 },
    reb_cargo:     { modes: ["inside"], w: 2 },
    reb_staffer:   { modes: ["inside"], w: 2 },
    reb_counter:   { modes: ["rebel", "partisan", "revolt"], w: 3, need: () => G.reb.liberated.length > 0 }
};

function tickRebellion() {
    const R = initReb();
    if (R.edge > 0) R.edge--;
    if (R.mole > 0) { R.mole--; G.isb = Math.max(0, (G.isb || 0) - 1); if (G.ug) G.ug.exposure = clamp(G.ug.exposure - 1); }
    if (isEmpireEra()) R.imp = clamp(R.imp + 0.25 - G.rebellion * 0.004, 15, 95);
    tickMissions();

    const f = G.forces;
    if (f) {
        f.queue.forEach(q => q.months--);
        f.queue.filter(q => q.months <= 0).forEach(q => { f.ships += q.ships; f.fighters += q.fighters; report("🚀 New forces", q.ships ? `${q.ships} warship${q.ships > 1 ? "s" : ""} commissioned.` : `${q.fighters} starfighters delivered.`); });
        f.queue = f.queue.filter(q => q.months > 0);
        f.morale = clamp(f.morale + (55 - f.morale) * 0.05);
        f.training = clamp(f.training - 0.3);
        const up = forcesUpkeep();
        if (up > 0) G.treasury -= up;
        if (f.under === "planetary" && f.mobilized) applyEffects({ p: { employment: -0.15 } });
        if (f.under === "rebel") {
            const need = Math.max(1, Math.round(f.troops / 800));
            if (rSupplies() >= need) addSupplies(-need);
            else { f.morale = clamp(f.morale - 5); if (chance(30)) { const gone = Math.round(f.troops * 0.08); f.troops -= gone; report("Hunger", `Without supplies, ${fmtN(gone)} fighters drift home.`); } }
        }
        if (G.ug && G.ug.base && G.ug.base !== G.worldKey) G.ug.exposure = clamp(G.ug.exposure - 0.8);
    }

    const mode = resistMode();
    if (!mode || G.scenes.length) return;
    const now = monthsNow();
    if (now - R.lastEv < 2 || !chance(45)) return;
    const pool = Object.entries(REB_EVENTS).filter(([k, e]) => e.modes.includes(mode) && (!e.need || e.need()) && !R.recent.includes(k));
    if (!pool.length) return;
    let roll = rnd(0, pool.reduce((s, [, e]) => s + e.w, 0)), key = pool[0][0];
    for (const [k, e] of pool) { roll -= e.w; if (roll <= 0) { key = k; break; } }
    R.lastEv = now;
    R.recent = [key, ...R.recent].slice(0, 4);
    pushScene(key, {});
}

const evBattle = (goal, k) => () => launchBattle(goal, k, true);

Object.assign(SCENES, {
    reb_patrol: () => ({ tag: "WAR COUNCIL", title: "An Imperial patrol",
        body: `<p>Scouts report an Imperial patrol — a dozen troopers and two speeders — sweeping the valley below your camp. They'll be at the ridge by nightfall.</p>`,
        choices: [
            { label: "⚔️ Ambush them", hint: "A small battle.", go: evBattle("patrol") },
            { label: "Move the camp", hint: "Supplies −8, exposure down.", go: () => { addSupplies(-8); addExposure(-10); } },
            { label: "Lie still and let them pass", hint: "They might not find you.", go: () => { if (chance(60)) report("They pass", "The patrol never looks up."); else { addExposure(15); report("Spotted", "A trooper stops, looks straight at your sentry, and calls it in."); } } }
        ] }),
    reb_convoy: () => ({ tag: "WAR COUNCIL", title: "A supply convoy",
        body: `<p>An Imperial supply convoy — fuel, rations, munitions — moves through the pass tomorrow with a light escort.</p>`,
        choices: [
            { label: "⚔️ Hit it", hint: "A battle for supplies.", go: evBattle("convoy") },
            { label: "Let it go", go: () => {} }
        ] }),
    reb_defector: ctx => {
        if (!ctx.who) ctx.who = `${pick(["Lieutenant", "Captain", "Major", "Commander"])} ${randomName("coruscant")}`;
        return { tag: "A DEFECTOR", title: `${ctx.who} wants to come over`,
            body: `<p>An Imperial officer, ${esc(ctx.who)}, makes contact through a dead drop. They're offering codes, rosters, maybe more — in exchange for a way out.</p><p class="muted small">The ISB plants fake defectors. Real ones die if you hesitate.</p>`,
            choices: [
                { label: "Bring them in", hint: "Big payoff — if it's real.", go: () => { if (chance(65)) { addIntel(30); if (G.forces && chance(30)) { G.forces.ships += 1; report("A real defector", `${ctx.who} arrives with a shuttle full of codes — and a patrol frigate.`); } else report("A real defector", `${ctx.who}'s codes check out. Intelligence +30.`); } else { addExposure(20); const a = readyAgents()[0]; if (a) { a.status = "captured"; report("A trap", `It was the ISB. ${a.name} is taken at the meeting point.`); } else report("A trap", "It was the ISB. You barely get out."); } } },
                { label: "Test them first", hint: "Slower and safer.", go: () => { if (chance(50)) { addIntel(15); report("Tested and true", "The first batch of codes checks out."); } else report("They go quiet", "The officer stops answering. Maybe they got cold feet. Maybe they're dead."); } },
                { label: "Ignore it", go: () => {} }
            ] };
    },
    reb_village: () => ({ tag: "WAR COUNCIL", title: "A village asks for protection",
        body: `<p>The elders of a village that fed your fighters last winter come to you. The garrison has announced reprisals for the last attack. They're next.</p>`,
        choices: [
            { label: "Send fighters to defend them", hint: "A battle with the garrison.", go: evBattle("raid") },
            { label: "Evacuate them to the hills", hint: "Supplies −12. They'll remember.", go: () => { addSupplies(-12); applyEffects({ rep: 4 }); if (G.forces) G.forces.troops += ri(20, 60); report("Evacuated", "The whole village walks into the hills overnight. Some of the young ones stay to fight."); } },
            { label: "There's nothing we can do", go: () => { G.rebellion = clamp(G.rebellion - 1); if (G.forces) G.forces.morale = clamp(G.forces.morale - 8); report("Silence", "The garrison burns the village. Your fighters don't look at you for days."); } }
        ] }),
    reb_arms: () => ({ tag: "WAR COUNCIL", title: "Smugglers with heavy weapons",
        body: `<p>A smuggler crew offers crates of heavy blasters, rocket launchers and two old starfighters. Cash only — or a share of your stores.</p>`,
        choices: [
            { label: "Pay 1.5M credits", disabled: G.funds < 1.5, go: () => { applyEffects({ funds: -1.5 }); const f = G.forces || initRebelForces(); f.training = clamp(f.training + 6); f.fighters += 2; report("Armed", "Heavy weapons for your best units, two starfighters for your pilots."); } },
            { label: "Trade 20 supplies", disabled: rSupplies() < 20, go: () => { addSupplies(-20); const f = G.forces || initRebelForces(); f.training = clamp(f.training + 4); report("A fair trade", "Food for guns. Your fighters will be hungrier and better armed."); } },
            { label: "Turn them away", go: () => {} }
        ] }),
    reb_hotheads: () => ({ tag: "WAR COUNCIL", title: "The hotheads",
        body: `<p>Your youngest cell wants to bomb the Imperial officers' club in the city. It's on a street full of cafés.</p>`,
        choices: [
            { label: "Approve it", hint: "The Empire bleeds. So do civilians.", go: () => { G.reb.imp = clamp(G.reb.imp - 5, 15, 95); G.rebellion = clamp(G.rebellion + 3); applyEffects({ consistency: -6, rep: -3 }); addExposure(10); report("The club burns", "Eleven Imperial officers dead. Four civilians too. The HoloNet shows only the civilians."); if (G.ug && chance(50)) frontScene("emp_reprisal", {}); } },
            { label: "Strike at 0300, when it's empty", hint: "Smaller blow, cleaner hands.", go: () => { G.reb.imp = clamp(G.reb.imp - 2, 15, 95); addExposure(5); report("A message", "The club is rubble by morning. Nobody inside."); } },
            { label: "Forbid it", go: () => { if (G.forces) G.forces.morale = clamp(G.forces.morale - 6); if (G.ug && chance(40)) { const c = activeComrades()[0]; if (c) { c.status = "left"; report("They leave", `${c.name} storms out. They'll fight their own war now.`); } } } }
        ] }),
    reb_prisoners: () => ({ tag: "WAR COUNCIL", title: "Prisoners",
        body: `<p>You're holding a squad of captured ${esc(foeUnits(foeName()).troops)}. They eat your food. Some of them are very young.</p>`,
        choices: [
            { label: "Release them", hint: "Reputation; they may talk.", go: () => { applyEffects({ rep: 4, consistency: 3 }); addExposure(6); } },
            { label: "Trade them for our people", go: () => { const c = agents().find(a => a.status === "captured"); if (c) { c.status = "active"; report("An exchange", `${c.name} comes home.`); } else { addSupplies(10); report("An exchange", "No one of ours to trade for — the garrison pays in rations instead."); } } },
            { label: "Ask who wants to switch sides", go: () => { const n = ri(2, 12); if (G.forces) G.forces.troops += n; if (G.ug && chance(15)) G.ug.mole = randomName(G.worldKey); report("Deserters", `${n} of them take off the armour for good.`); } }
        ] }),
    reb_alliance: () => ({ tag: "ALLIANCE HIGH COMMAND", title: "The Alliance needs your forces",
        body: `<p>A coded message from Alliance High Command: a joint operation is planned, and they need every ship and fighter they can get.</p>`,
        choices: [
            { label: "Commit your forces", hint: "A battle far from home.", go: evBattle("alliance") },
            { label: "Send supplies instead", hint: "Supplies −15.", disabled: rSupplies() < 15, go: () => { addSupplies(-15); G.rebellion = clamp(G.rebellion + 2); const m = canonNpc("mothma"); if (m) changeRel(m, 4, "Sent supplies to the Alliance."); } },
            { label: "Decline", go: () => { const m = canonNpc("mothma"); if (m) changeRel(m, -5, "Declined to join an Alliance operation."); } }
        ] }),
    reb_destroyer: () => ({ tag: "ALERT", title: "A Star Destroyer drops out of hyperspace",
        body: `<p>A single Imperial Star Destroyer arrives in orbit over ${esc(world().name)} — probing your defences ahead of the next invasion.</p>`,
        choices: [
            { label: "🚀 Engage it", hint: "A space battle.", disabled: !(G.forces && G.forces.ships + G.forces.fighters > 0), go: evBattle("fleet") },
            { label: "Hide the fleet and let the shields take it", go: () => { applyEffects({ p: { infrastructure: -2 } }); report("Probed", "It fires a few volleys, maps your shield grid, and leaves. They'll know where to hit."); if (G.revolt) G.revolt.next = Math.max(monthsNow() + 1, G.revolt.next - 2); } }
        ] }),
    reb_wounded: () => ({ tag: "WAR COUNCIL", title: "The wounded",
        body: `<p>Your medics are out of bacta. Some of the wounded won't last the week.</p>`,
        choices: [
            { label: "⚔️ Raid an Imperial medical depot", go: evBattle("medical") },
            { label: "Buy on the black market", hint: "1M credits.", disabled: G.funds < 1, go: () => { applyEffects({ funds: -1 }); if (G.forces) G.forces.morale = clamp(G.forces.morale + 5); } },
            { label: "Ration what's left", go: () => { const n = randomName(G.worldKey); fallen(n, "died of wounds for want of bacta"); if (G.forces) { G.forces.troops = Math.max(0, G.forces.troops - ri(5, 30)); G.forces.morale = clamp(G.forces.morale - 6); } report("Rationing", `${n} is among those who don't make it.`); } }
        ] }),
    reb_recruits: () => ({ tag: "WAR COUNCIL", title: "Deserters from the academy",
        body: `<p>A group of Imperial academy cadets have deserted and want to join you. They know Imperial tactics. One of them could be ISB.</p>`,
        choices: [
            { label: "Take them all", go: () => { const f = G.forces || initRebelForces(); f.troops += ri(20, 60); f.training = clamp(f.training + 4); if (G.ug && chance(25)) G.ug.mole = randomName(G.worldKey); } },
            { label: "Vet them one by one", hint: "Slower, safer.", go: () => { const f = G.forces || initRebelForces(); f.troops += ri(8, 20); } },
            { label: "Send them away", go: () => {} }
        ] }),
    reb_assault: () => ({ tag: "ALERT", title: "They found the base",
        body: `<p>Imperial landing craft are coming down outside your base on ${esc(worldName(G.ug && G.ug.base ? G.ug.base : G.worldKey))}.</p>`,
        choices: [
            { label: "⚔️ Stand and fight", go: evBattle("base") },
            { label: "Evacuate", hint: "Supplies −20, exposure down sharply.", go: () => { addSupplies(-20); addExposure(-25); if (G.forces) G.forces.troops = Math.round(G.forces.troops * 0.9); report("Evacuated", "You get out with what you can carry. The base burns behind you."); } }
        ] }),
    reb_counter: ctx => {
        if (!ctx.k) ctx.k = pick(G.reb.liberated);
        return { tag: "ALERT", title: `The Empire returns to ${worldName(ctx.k)}`,
            body: `<p>An Imperial task force is moving on ${esc(worldName(ctx.k))}, the world your forces freed.</p>`,
            choices: [
                { label: "⚔️ Defend it", go: evBattle("counter", ctx.k) },
                { label: "Evacuate its leaders and let it go", go: () => { G.galaxy[ctx.k].align = "empire"; G.reb.liberated = G.reb.liberated.filter(x => x !== ctx.k); G.reb.imp = clamp(G.reb.imp + 4, 15, 95); report("Abandoned", `${worldName(ctx.k)} falls back under Imperial rule.`); } }
            ] };
    },
    reb_courier: () => ({ tag: "A REQUEST", title: "A rebel courier needs clearance codes",
        body: `<p>A courier from the rebel cells needs Imperial clearance codes to get a shipment through the sector blockade. You have access to them.</p>`,
        choices: [
            { label: "Hand them over", hint: "ISB attention rises.", go: () => { G.rebellion = clamp(G.rebellion + 3); G.isb = (G.isb || 0) + 8; addIntel(5); report("Through", "The shipment gets through. Somewhere, an auditor will notice the access log."); } },
            { label: "Refuse", go: () => {} }
        ] }),
    reb_leak: () => ({ tag: "A CLASSIFIED BRIEFING", title: "Troop movements",
        body: `<p>A briefing you sat through mentions where three Imperial battle groups will be next quarter.</p>`,
        choices: [
            { label: "Leak it to the Alliance", hint: "Danger rises.", go: () => { G.rebellion = clamp(G.rebellion + 4); addWrath(6); G.reb.edge = 4; const m = canonNpc("mothma"); if (m) changeRel(m, 6, "Leaked Imperial troop movements."); report("Leaked", "Two weeks later, an Imperial convoy is ambushed exactly where the briefing said it would be."); } },
            { label: "Keep it to yourself", go: () => {} }
        ] }),
    reb_cargo: () => ({ tag: "A REQUEST", title: "Your diplomatic ship",
        body: `<p>Your official ship isn't searched at Imperial checkpoints. The cells want to use it to move medical supplies — and weapons.</p>`,
        choices: [
            { label: "Medicine and weapons", hint: "If it's searched, you're finished.", go: () => { if (chance(80)) { G.rebellion = clamp(G.rebellion + 4); addSupplies(15); report("Delivered", "Crates of blasters under crates of bacta, waved through six checkpoints."); } else { G.isb = (G.isb || 0) + 30; addWrath(15); report("Searched", "A zealous lieutenant searches the hold. You talk your way out — barely. Your name is now on a list."); } } },
            { label: "Medicine only", go: () => { applyEffects({ rep: 2 }); G.isb = (G.isb || 0) + 3; } },
            { label: "No", go: () => {} }
        ] }),
    reb_staffer: ctx => {
        if (!ctx.who) ctx.who = randomName(G.worldKey);
        return { tag: "YOUR OFFICE", title: "An ISB plant on your staff",
            body: `<p>Your chief of security is sure: ${esc(ctx.who)}, a junior aide, has been copying your schedule to the ISB.</p>`,
            choices: [
                { label: "Feed them false information", hint: "A double game.", go: () => { if (chance(60)) { G.isb = Math.max(0, (G.isb || 0) - 15); report("It works", "The ISB spends a month watching meetings that never happen."); } else { G.isb = (G.isb || 0) + 10; report("They realise", `${ctx.who} stops coming to work. The ISB knows you know.`); } } },
                { label: "Fire them quietly", go: () => { G.isb = (G.isb || 0) + 3; } },
                { label: "Do nothing", go: () => { G.isb = (G.isb || 0) + 8; } }
            ] };
    }
});
