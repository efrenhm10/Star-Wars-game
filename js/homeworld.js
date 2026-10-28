// Galactic Senate — Your homeworld's leadership
// ---------------------------------------------------------------------------
// When you don't run your planet, somebody else does. They have a name, a
// faction and a relationship with you. Their government leans their way.
// A senator can fly home to talk to them, press them on laws and defence,
// coordinate before a vote — or just talk. And a senator can win Republic
// money for the homeworld's defences.

const LEADER_KINDS = ["executive", "monarch", "hereditary", "council", "traditional", "clan"];

function leaderRole() { return world().roles.find(r => LEADER_KINDS.includes(r.kind)) || null; }
const youLead = () => LEADER_KINDS.includes(G.office.kind) || governing();

// The person running your world when you aren't.
function planetLeader() {
    if (youLead()) return null;
    const r = leaderRole();
    if (!r) return null;
    let n = G.leaderId && npc(G.leaderId);
    if (n && n.alive) return n;
    const c = r.canonHolder && canonNpc(r.canonHolder);
    if (c && c.alive) { c.title = r.title; c.arena = "local"; n = c; }
    else {
        n = G.npcs.find(x => x.alive && x.world === G.worldKey && x.title === r.title);
        if (!n) { n = makeNpc({ world: G.worldKey, title: r.title, arena: "local" }); G.npcs.push(n); }
    }
    G.leaderId = n.id;
    return n;
}

// Called whenever your office changes.
function homeworldOnOffice(prev, o) {
    if (!G.worldKey || !G.npcs) return;
    if (LEADER_KINDS.includes(o.kind)) {
        if (isEmpireEra() && !G.revolt && G.galaxy[G.worldKey].align !== "rebel" && G.allegiance === "rebel") G.allegiance = "empire";
        const n = G.leaderId && npc(G.leaderId);
        if (n && n.alive && n.title === o.title) n.title = `Former ${o.title}`;
        G.leaderId = null;
        return;
    }
    if (prev && LEADER_KINDS.includes(prev.kind)) {
        const n = planetLeader();
        if (n) log(`🪐 ${n.name} takes over as ${n.title}.`, "career");
    }
}

// ── Senate money for the homeworld's defences ─────────────────────

function defenseGrantSize() {
    const m = worldMil(G.worldKey);
    return { ships: Math.max(1, Math.round(SHIP_BASE[m] * 0.3)), fighters: 24, works: 20, cost: 1500 + m * 500 };
}

function seekDefenseGrant() {
    const w = world();
    if (G.bills.some(b => b.defenseFor)) return toast("Already before the Senate", `Your defence appropriation for ${w.name} is still working its way through.`);
    if (G.defenseGrantAt && monthsNow() - G.defenseGrantAt < 24) return toast("Too soon", "The Senate just funded your world's defences. Wait a while before asking again.");
    if (!spendAP(4)) return;
    const g = defenseGrantSize();
    const b = createBill(`defense_${G.worldKey}`, "player", {
        arena: "senate", title: `${w.name} Planetary Defense Appropriation`,
        desc: `Republic funds for ${w.name}'s shield generators, orbital defences, ${g.ships} warship${g.ships > 1 ? "s" : ""} and ${g.fighters} starfighters. Cost: ${(g.cost / 1000).toFixed(1)} billion credits.`,
        stance: { militarists: 3, centralists: 1, federalists: 1, reformers: -1, corporatists: G.era === "war" ? 1 : -1, independence: 0, traditionalists: 0 }, g: { military: 4, elders: 2 }
    });
    b.defenseFor = G.worldKey;
    b.momentum += attr("vulnerability") * 2 + (G.war || G.siege ? 6 : 0) + (G.committees.includes("defense") ? 3 : 0);
    report("🛡️ Defence appropriation introduced", `You introduce the ${b.title}. The vote is in ${b.voteIn} months. Militarists will back it; everyone else will want to know why ${w.name} and not their own world.`);
    render();
}

function resolveDefenseGrant(b, passed) {
    const w = world();
    if (!passed) { report("Defence appropriation fails", `The Senate votes down the ${b.title}. ${w.name}'s defences stay as they are.`); return; }
    const g = defenseGrantSize(), f = initForces();
    f.ships += g.ships; f.fighters += g.fighters;
    if (G.infra && G.infra.defence) G.infra.defence.have = Math.min(100, G.infra.defence.have + g.works);
    G.fortify = (G.fortify || 0) + 8;
    G.approPool = Math.max(0, (G.approPool || 0) - g.cost);
    G.defenseGrantAt = monthsNow();
    G.homeDelivered = (G.homeDelivered || 0) + 1;
    const n = planetLeader(); if (n) changeRel(n, 10, `Won Republic money for ${w.name}'s defences.`);
    G.record.agreements.push(`Won Republic funding for ${w.name}'s planetary defences (${eraYear(currentBBY())})`);
    report("🛡️ Defences funded", `The Senate funds ${w.name}'s defences: shield generators, orbital batteries, ${g.ships} warship${g.ships > 1 ? "s" : ""} and ${g.fighters} starfighters. Defence strength is now ${defenseStrength()}.`, applyEffects({ g: { military: 5, elders: 3 }, trust: 3, rep: 2 }));
}

// ── Going home ────────────────────────────────────────────────────

function flyHome() {
    const n = planetLeader();
    if (!n) return toast("Nobody to meet", "Your world has no separate planetary leader.");
    if (!spendAP(3)) return;
    frontScene("home_meeting", { id: n.id });
    render();
}

function pushOdds(n, k, dir = 1) {
    const lean = (POLICIES[k].f[n.faction] || 0) * dir;
    return Math.round(clamp(35 + n.rel * 0.5 + lean * 12 + G.influence * 0.15 + (G.rep - 50) * 0.2, 5, 90));
}

function homeAsks(n) {
    const keys = Object.keys(POLICIES).filter(k => !POLICIES[k].extreme && !POLICIES[k].war && (typeof policyAvailable !== "function" || policyAvailable(k)) && POLICIES[k].cat !== "tax");
    const up = keys.filter(k => (POLICIES[k].f[G.ideology] || 0) > 0 && G.policies[k].level < 0.6).sort(() => Math.random() - 0.5).slice(0, 2).map(k => ({ k, dir: 1 }));
    const down = keys.filter(k => (POLICIES[k].f[G.ideology] || 0) < 0 && G.policies[k].level >= 0.4).sort(() => Math.random() - 0.5).slice(0, 1).map(k => ({ k, dir: -1 }));
    return up.concat(down);
}

function homeWorry() {
    const worst = Object.entries(G.planet).filter(([k]) => PLANET_STATS[k]).map(([k, v]) => [k, PLANET_STATS[k].bad ? v : 100 - v]).sort((a, b) => b[1] - a[1])[0];
    return worst ? PLANET_STATS[worst[0]].name.toLowerCase() : "the budget";
}

Object.assign(SCENES, {
    home_meeting: ctx => {
        const n = npc(ctx.id);
        if (!n) return { title: "—", body: "", choices: [{ label: "Continue", go: () => {} }] };
        if (!ctx.asks) { ctx.asks = homeAsks(n); ctx.snub = n.rel < -30 && chance(50); }
        const w = world();
        const mood = n.rel >= 40 ? "greets you like an old friend" : n.rel >= 10 ? "is glad to see you" : n.rel > -20 ? "receives you politely" : "keeps you waiting an hour, then receives you coldly";
        const vote = G.bills.filter(b => b.arena === "senate" && b.playerVote && b.playerVote !== "abstain" && b.voteIn <= 3).sort((a, b) => a.voteIn - b.voteIn)[0];
        const defKey = ["defence_force", "shield_gen", "orbital_def"].find(k => G.policies[k] && G.policies[k].level < 0.8 && (typeof policyAvailable !== "function" || policyAvailable(k)));
        const press = (k, dir) => () => {
            const p = G.policies[k], odds = pushOdds(n, k, dir);
            if (chance(odds)) {
                p.level = Math.round(clamp(p.level + 0.2 * dir, 0, 1) * 100) / 100;
                changeRel(n, 2);
                report(`🪐 ${n.name} agrees`, `${n.name} takes it to the ${G.const.legislature || "legislature"}. ${POLICIES[k].name} is ${dir > 0 ? "expanded" : "cut back"} (now ${levelWord(p.level)}).`);
            } else {
                changeRel(n, -4, "Lectured them about how to run the planet.");
                report("Not interested", `${n.name} hears you out, then explains — at length — why a senator on Coruscant doesn't understand ${w.name}.`);
            }
        };
        if (ctx.snub) return { tag: `${w.name.toUpperCase()}`, title: `${n.name} is too busy`,
            body: `<p>You fly all the way home. ${esc(n.name)} sends an aide. <i>"The ${esc(n.title)} regrets that the schedule is full."</i></p>`,
            choices: [{ label: "Leave a message", go: () => changeRel(n, 2) }, { label: "Make a scene in the press", go: () => { changeRel(n, -8); applyEffects({ heat: 4, f: { [n.faction]: -2 } }); } }] };
        return { tag: `HOME TO ${w.name.toUpperCase()}`, title: `A meeting with ${n.name}`,
            body: `<p>${esc(n.name)}, ${esc(n.title)} (${FACTIONS[n.faction].icon} ${FACTIONS[n.faction].name}), ${mood}.</p>
                <p class="small muted">Your relationship: ${n.rel >= 0 ? "+" : ""}${Math.round(n.rel)}. Their government leans toward their own faction's laws unless someone persuades them otherwise.</p>`,
            choices: [
                ...ctx.asks.map(({ k, dir }) => ({ label: `${dir > 0 ? "Urge them to expand" : "Urge them to cut back"} ${POLICIES[k].icon} ${POLICIES[k].name}`, hint: `Now ${levelWord(G.policies[k].level)} · ~${pushOdds(n, k, dir)}% they agree.`, go: press(k, dir) })),
                ...(defKey ? [{ label: `🛡️ Press them to spend more on defence (${POLICIES[defKey].name})`, hint: `~${pushOdds(n, defKey, 1) + (G.war || G.siege ? 15 : 0)}% they agree.`, go: () => { if (G.war || G.siege) n.rel += 30; press(defKey, 1)(); if (G.war || G.siege) n.rel -= 30; } }] : []),
                ...(vote ? [{ label: `🗳️ Ask them to back you publicly on the ${vote.title}`, hint: `You're voting ${vote.playerVote.toUpperCase()}; the vote is in ${vote.voteIn} month${vote.voteIn > 1 ? "s" : ""}.`, go: () => { if (chance(40 + n.rel * 0.5)) { vote.momentum += vote.playerVote === "for" ? 5 : -5; changeRel(n, 1); report("A public statement", `${n.name} tells the HoloNet that ${w.name} stands with its senator on the ${vote.title}.`); } else report("They stay neutral", `${n.name} would rather not take sides on Senate business.`); } }] : []),
                { label: "🤝 Ask what they need from you in the Senate", go: () => { changeRel(n, 6, "Asked what the homeworld needs."); const need = homeWorry(); report(`What ${w.name} needs`, `${n.name} is blunt: ${need}. "Bring home money for that and I'll remember it at election time."`); } },
                { label: "☕ No agenda — just talk", hint: "Relationship, and a sense of how things really are.", go: () => { changeRel(n, 10, "Spent an evening just talking."); applyEffects({ health: 3 }); report(`An evening with ${n.name}`, `No aides, no agenda. ${n.name} worries most about ${homeWorry()}, and ${n.rel >= 30 ? "trusts you more than they let on" : n.rel >= 0 ? "is still deciding what to make of you" : "still doesn't trust you"}.`); } },
                ...(isEmpireEra() && imperialWorld() && n.rel >= 20 ? [{ label: "✊ Quietly ask them to help the rebellion", hint: "Very dangerous for both of you.", go: () => { if (chance(30 + n.rel * 0.5)) { G.rebellion = clamp(G.rebellion + 3); changeRel(n, 5); report("In the dark times", `${n.name} agrees to look the other way when rebel supply ships refuel.`); } else { changeRel(n, -10); addWrath(5); report("A mistake", `${n.name} goes pale and ends the meeting. You hope they don't report it.`); } } }] : [])
            ] };
    }
});

function homeworldPanel() {
    const n = planetLeader();
    const w = world();
    const g = defenseGrantSize();
    const pending = G.bills.find(b => b.defenseFor);
    const leader = n ? `<div class="statrow"><span><b>${esc(n.name)}</b><br><span class="small muted">${esc(n.title)} · ${FACTIONS[n.faction].icon} ${FACTIONS[n.faction].name}</span></span><b class="${n.rel >= 0 ? "c-for" : "c-against"}">${n.rel >= 0 ? "+" : ""}${Math.round(n.rel)}</b></div>
        ${tact("flyhome", `🚀 Fly home and meet ${esc(n.name)}`, 3, "Press them on laws or defence, coordinate a vote, or just talk.")}` : `<p class="muted small">${esc(w.name)} has no separate planetary leader.</p>`;
    return panel(`🪐 ${esc(w.name)} — your homeworld`, `${leader}
        <h4>🛡️ Defending ${esc(w.name)}</h4>
        <p class="small">Defence strength <b>${defenseStrength()}</b>${G.infra && G.infra.defence ? ` · defence works ${G.infra.defence.have}% built` : ""}.</p>
        ${pending ? `<p class="small c-und">Your ${esc(pending.title)} is before the Senate — vote in ${pending.voteIn} month${pending.voteIn > 1 ? "s" : ""}.</p>`
            : G.defenseGrantAt && monthsNow() - G.defenseGrantAt < 24 ? `<p class="small muted">Funded ${monthsNow() - G.defenseGrantAt} months ago. You can ask again in ${24 - (monthsNow() - G.defenseGrantAt)} months.</p>`
            : tact("defensegrant", `🛡️ Seek Republic funds for ${esc(w.name)}'s defences`, 4, `A Senate bill: shields, orbital batteries, ${g.ships} warship${g.ships > 1 ? "s" : ""}, ${g.fighters} starfighters (${(g.cost / 1000).toFixed(1)}B).`)}`);
}
