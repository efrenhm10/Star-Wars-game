// ── THE WAR AT HOME — what the Clone Wars and the Empire do to a planetary government ──
//
// Planetary autonomy is to a governor what Senate power is to a senator: the war
// and then the Empire take it away. War changes the economy every month, brings
// demands to the governor's desk, and the Empire sends a Moff to watch you.

function autonomy() { if (G.autonomy == null) G.autonomy = 100; return G.autonomy; }
function autonomyLabel(v = autonomy()) { return v >= 75 ? "Self-governing" : v >= 50 ? "Supervised" : v >= 30 ? "Directed" : v >= 12 ? "Puppet government" : "Occupied in all but name"; }
function cutAutonomy(n, why) {
    G.autonomy = clamp(autonomy() - n);
    G.autonomyLog = G.autonomyLog || [];
    if (why) G.autonomyLog.unshift({ text: why, d: -n, year: eraYear(currentBBY()) });
}
function gainAutonomy(n, why) {
    G.autonomy = clamp(autonomy() + n);
    G.autonomyLog = G.autonomyLog || [];
    if (why) G.autonomyLog.unshift({ text: why, d: n, year: eraYear(currentBBY()) });
}
function moffName() { if (!G.moff) G.moff = `Moff ${randomName("coruscant").split(" ").pop()}`; return G.moff; }
function imperialWorld() { return isEmpireEra() && G.allegiance !== "rebel" && !G.revolt; }
function wartimeGov() { return governing() || G.office.kind === "council"; }


// ── The war economy ───────────────────────────────────────────────

function tickWarEconomy() {
    const w = world();
    const tr = w.traits;
    if (G.era === "war") {
        const side = G.allegiance === "separatist" ? "Confederacy" : G.allegiance === "republic" ? "Republic" : null;
        // War levies and requisitions.
        if (side) G.treasury -= 0.05 + attr("wealth") * 0.03;
        // Arms and industry worlds profit; trade worlds suffer.
        if (tr.some(t => ["arms", "industry"].includes(t))) { G.base.employment += 0.08; G.treasury += 0.12; }
        if (tr.some(t => ["trade", "finance"].includes(t))) G.base.employment -= 0.06;
        // Prices climb when the lanes are dangerous.
        G.base.inequality += 0.03;
        if (w.region !== "core") G.base.housing -= 0.03 * Math.max(0, G.gal.refugees - 30) / 20;
        // Raids: smaller than a siege, far more common.
        if (!G.siege && !G.occupied && chance({ core: 1, mid: 3, outer: 5 }[w.region] * attackMultiplier()) && G.scenes.length < 2) pushScene("war_raid", {});
    }
    if (imperialWorld() && G.era !== "newrepublic") {
        // The Imperial tithe.
        G.treasury -= 0.08 + attr("wealth") * 0.04;
        G.base.inequality += 0.02;
        if (tr.some(t => ["arms", "industry", "mining"].includes(t))) G.base.employment += 0.05;
    }
}


// ── Imperial veto ─────────────────────────────────────────────────

// Under the Empire, a planetary government's laws need the Moff's blessing.
function imperialVeto(b) {
    if (b.arena !== "local" || !imperialWorld() || !governing()) return false;
    const a = autonomy();
    if (a >= 50) return false;
    const fx = b.fx || {};
    const liberal = b.policyKey ? (POLICIES[b.policyKey].f.reformers || 0) > 0 && b.policyLevel > G.policies[b.policyKey].level : (b.stance.reformers || 0) >= 2;
    if (!liberal && !b.budgetBill) return false;
    if (chance((50 - a) * 1.6)) {
        G.moffTrust = clamp((G.moffTrust || 50) - 3);
        report(`⛔ ${moffName()} vetoes the ${b.title}`, "The legislature passed it. The Moff's office returned it unsigned. There is no appeal.");
        return true;
    }
    return false;
}


// ── Quiet resistance and wartime tools ────────────────────────────

function govResist(t) {
    const costs = { falsify: 3, hide: 3, slowwalk: 3, supply: 4, protect: 4, petition: 4, militia: 5, alliance: 3, levy_fight: 3, war_contracts: 4, shelter: 3 };
    if (!spendAP(costs[t] || 3)) return;
    let ch = [];
    const risk = n => { G.isb = (G.isb || 0) + n; G.moffTrust = clamp((G.moffTrust || 50) - n / 2); };
    switch (t) {
        case "falsify": risk(8); G.rebellion = clamp(G.rebellion + 3); G.base.employment += 1; report("📄 Cooked books", "Your production reports show a bad harvest and a broken foundry. Neither is true. The difference goes to your own people — and some of it to the rebels."); break;
        case "hide": risk(7); G.rebellion = clamp(G.rebellion + 2); ch = applyEffects({ rep: 3, g: { youth: 2, religious: 2 } }); report("🏚️ Safe houses", "Dissidents, deserters and a family of Jedi sympathisers disappear into the countryside with papers your office printed.", ch); break;
        case "slowwalk": risk(5); gainAutonomy(3, "The government slow-walked Imperial directives"); report("🐌 Slow-walked", "Every Imperial directive goes to a committee, which asks for clarification, which takes months."); break;
        case "supply": risk(10); G.rebellion = clamp(G.rebellion + 5); G.secretRebel = true; ch = applyEffects({ treasury: -0.8 }); report("📦 Supplies for the rebels", "Medical crates, fuel cells and a surplus shuttle vanish from the planetary inventory.", ch); break;
        case "protect": risk(6); gainAutonomy(4, "The legislature was protected from Imperial interference"); ch = applyEffects({ legitimacy: 5, i: { legislature: 5 } }); report("🏛️ The legislature stays open", "You keep the planetary legislature meeting, and its laws on the books, over the Moff's objections.", ch); break;
        case "petition": { if (chance(30 + G.influence * 0.4 - (50 - autonomy()) * 0.3)) { gainAutonomy(8, "Coruscant granted a petition for local self-government"); report("📜 Petition granted", "Coruscant grants a few more years of local self-government — for now."); } else { risk(4); report("Petition denied", "Your petition is denied. Your name is noted."); } break; }
        case "militia": risk(12); G.garrison += 12; G.secretMilitia = (G.secretMilitia || 0) + 1; report("🗡️ A secret militia", "Hunting clubs, flying clubs, a very large volunteer fire brigade. If the day comes, they'll be ready."); break;
        case "alliance": { risk(8); G.rebellion = clamp(G.rebellion + 4); const m = canonNpc("mothma"); if (m) changeRel(m, 10, "A planetary government reached out to the Alliance."); report("✊ Contact with the Alliance", "A courier from Mon Mothma. Your world is now part of the conversation."); break; }
        case "levy_fight": { if (chance(35 + G.influence * 0.3 + attr("influence") * 5)) { G.levyRelief = monthsNow() + 12; report("💳 Levy reduced", "The Republic agrees to cut your war levy for a year."); } else report("No relief", "“Every world must do its part.”"); break; }
        case "war_contracts": { if (chance(30 + attr("industry") * 10)) { addStream("War contracts", 0.25, 24); G.base.employment += 3; ch = applyEffects({ f: { militarists: 3, reformers: -2 }, g: { workers: 3 } }); report("🏭 War contracts won", "Your factories will build for the war effort.", ch); } else report("Contracts go elsewhere", "Kuat and Corellia get the contracts. Again."); break; }
        case "shelter": { ch = applyEffects({ treasury: -1, g: { elders: 3, urban: 2 } }); G.fortify = (G.fortify || 0) + 5; report("🛡️ Civil defence", "Shelters, sirens and drills in every city.", ch); break; }
    }
    if (isEmpireEra() && chance((G.isb || 0) / 8) && !G.inbox.some(d => d.id === "isb")) addDossier("isb", {});
    render();
}

function wartimePanels() {
    if (!wartimeGov()) return "";
    let out = "";
    const a = autonomy();
    if (G.era !== "republic" || a < 100) {
        out += panel(`🪐 Planetary autonomy — ${autonomyLabel(a)}`, `<p class="small">${a >= 75 ? "Your government answers to your people." : a >= 50 ? "Outside officials review your decisions." : a >= 30 ? "Your laws can be vetoed; outside officials give orders." : "You govern at the pleasure of occupiers."}</p>
            ${statRow("Autonomy", `${Math.round(a)}%`, a, "good")}
            ${imperialWorld() ? statRow(`${moffName()}'s trust in you`, Math.round(G.moffTrust || 50), G.moffTrust || 50, "good") : ""}
            ${(G.autonomyLog || []).slice(0, 4).map(l => `<p class="small ${l.d < 0 ? "c-against" : "c-for"}">${l.d < 0 ? "▼" : "▲"} ${esc(l.text)} <span class="muted">(${esc(l.year)})</span></p>`).join("")}`);
    }
    if (G.era === "war") {
        out += panel("⚔️ The war effort", `<p class="small">The war reaches every ledger: ${G.allegiance === "neutral" ? "neutrality keeps you out of the levies — and out of anyone's protection" : `a war levy to the ${G.allegiance === "separatist" ? "Confederacy" : "Republic"}`}, disrupted trade, refugees, raids.</p>
            ${tact("govresist", "💳 Fight the war levy", 3, "Ask for a year's relief.", 'data-t="levy_fight"')}
            ${tact("govresist", "🏭 Compete for war contracts", 4, "Jobs and revenue for two years.", 'data-t="war_contracts"')}
            ${tact("govresist", "🛡️ Build civil defences", 3, "1B. Shelters and drills.", 'data-t="shelter"')}`, "danger");
    }
    if (imperialWorld() && governing()) {
        out += panel("✊ Quiet resistance", `<p class="small">You still hold office. That gives you forms, stamps, budgets and staff — and ways to defy the Empire without firing a shot. Every one of them raises the ISB's interest in you.</p>
            ${tact("govresist", "📄 Falsify production reports", 3, "Short the quotas.", 'data-t="falsify"')}
            ${tact("govresist", "🏚️ Hide dissidents and refugees", 3, "", 'data-t="hide"')}
            ${tact("govresist", "🐌 Slow-walk Imperial directives", 3, "Autonomy up. The Moff notices.", 'data-t="slowwalk"')}
            ${tact("govresist", "🏛️ Keep the legislature open", 4, "", 'data-t="protect"')}
            ${tact("govresist", "📜 Petition Coruscant for self-government", 4, "", 'data-t="petition"')}
            ${tact("govresist", "📦 Divert supplies to the rebels", 4, "0.8B.", 'data-t="supply"')}
            ${tact("govresist", "🗡️ Build a secret militia", 5, "Very dangerous.", 'data-t="militia"')}
            ${currentBBY() <= 3 ? tact("govresist", "✊ Contact the Rebel Alliance", 3, "", 'data-t="alliance"') : ""}`, "danger");
    }
    return out;
}


// ── Scenes ────────────────────────────────────────────────────────

const WAR_SCENES = ["war_requisition", "war_clone_base", "war_envoy", "war_refugees", "war_profiteer", "war_rationing", "war_conversion", "war_casualties", "war_jedi", "war_sympathizers", "war_bonds"];
const IMPERIAL_SCENES = ["imp_academy", "imp_garrison", "imp_lists", "imp_decree", "imp_concession", "imp_destroyer", "imp_cell", "imp_pacification", "imp_census", "imp_contract"];

Object.assign(SCENES, {
    war_raid: () => {
        const by = G.allegiance === "separatist" ? "Republic" : "Separatist";
        const what = pick(["a droid landing force hits an outlying settlement", "bombers strike the spaceport fuel depots", "commandos sabotage the power grid", "a raiding party seizes a mining station"]);
        return { tag: "THE WAR COMES", title: `${by} raid`,
            body: `<p>Without warning, ${what}. It isn't an invasion — yet. Defence strength: ${defenseStrength()}.</p>`,
            choices: [
                { label: "Send the defence force", hint: "Casualties, but you drive them off.", go: () => { if (defenseStrength() * rnd(0.6, 1.4) > 40) { G.warRecord++; report("Raid repelled", "Your forces drive the raiders off.", applyEffects({ g: { military: 4, veterans: 2 }, trust: 3 })); } else { applyDamage({ infrastructure: -4, employment: -2 }, 1); report("Too slow", "By the time your forces arrive, the raiders are gone and the damage is done.", applyEffects({ trust: -3 })); } } },
                { label: "Evacuate and absorb the damage", go: () => { applyDamage({ infrastructure: -3, housing: -2 }, 1); applyEffects({ g: { rural: -2 } }); } },
                { label: G.allegiance === "neutral" ? "Protest to both sides" : "Demand protection from your allies", go: () => { if (chance(35)) { G.garrison += 12; report("Help arrives", "A garrison is sent to protect you."); } else report("No one comes", "Your allies have bigger battles to fight."); } }
            ] };
    },
    war_requisition: () => ({ tag: "THE WAR EFFORT", title: `The ${G.allegiance === "separatist" ? "Confederacy" : "Republic"} requisitions`,
        body: `<p>${G.allegiance === "separatist" ? "Separatist Command" : "The Republic's Office of War Materiel"} demands ${pick(["half your planetary defence force's ships", "your spaceport's freighters", "your fuel reserves", "your medical stockpiles"])} for the front.</p>`,
        choices: [
            { label: "Comply", go: () => { G.garrison = Math.max(0, G.garrison - 10); cutAutonomy(3, "Planetary assets requisitioned for the war"); applyEffects({ f: { centralists: 3, militarists: 2 }, influence: 3 }); } },
            { label: "Negotiate a smaller contribution", go: () => { if (chance(55)) report("Reduced", "You give a third of what they asked."); else { cutAutonomy(3, "Requisitions imposed anyway"); report("Overruled", "They take it anyway."); } } },
            { label: "Refuse", go: () => { gainAutonomy(2); applyEffects({ f: { federalists: 4, centralists: -5 }, influence: -5 }); G.opinion.sep = clamp(G.opinion.sep + 3); } }
        ] }),
    war_clone_base: () => ({ tag: "THE WAR EFFORT", title: "A clone garrison",
        body: `<p>The Republic wants to station a clone battalion on ${esc(world().name)} — a base, barracks, a landing field. Your world would be safer. It would also no longer be entirely yours.</p>`,
        choices: [
            { label: "Welcome them", go: () => { G.garrison += 25; cutAutonomy(6, "A clone garrison was stationed on the planet"); applyEffects({ g: { elders: 3, military: 3, traditional: -3 }, f: { centralists: 4, independence: -4 } }); } },
            { label: "Accept a smaller outpost", go: () => { G.garrison += 12; cutAutonomy(2, "A small clone outpost"); } },
            { label: "Decline", go: () => { gainAutonomy(2); applyEffects({ f: { federalists: 3, centralists: -3 } }); } }
        ] }),
    war_envoy: () => ({ tag: "DIPLOMACY", title: G.allegiance === "separatist" ? "A Republic back-channel" : "A Separatist envoy",
        body: `<p>${G.allegiance === "separatist" ? "A Republic diplomat" : "A Confederate envoy"} arrives quietly. Stay out of the fighting, they say, and your shipping will be left alone.</p>`,
        choices: [
            { label: "Quietly agree", hint: "Fewer raids. If anyone finds out…", go: () => { G.quietDeal = monthsNow() + 18; applyEffects({ secret: "Made a secret non-aggression deal during the war", heat: 6 }); } },
            { label: "Send them away", go: () => applyEffects({ f: { centralists: 2 } }) },
            { label: "Report the approach to your allies", go: () => applyEffects({ influence: 4, rep: 2 }) }
        ] }),
    war_refugees: () => ({ tag: "REFUGEES", title: "A refugee fleet",
        body: `<p>Forty transports full of families fleeing ${pick(["Christophsis", "Ryloth", "Umbara", "Felucia", "Mon Cala", "Onderon"])} request permission to land. They have nothing.</p>`,
        choices: [
            { label: "Open the camps", go: () => { applyEffects({ treasury: -1, p: { housing: -3 }, g: { religious: 3, traditional: -3 }, f: { reformers: 4 }, rep: 3 }); } },
            { label: "Take some, send the rest on", go: () => applyEffects({ treasury: -0.4, p: { housing: -1 } }) },
            { label: "Turn them away", go: () => applyEffects({ rep: -5, g: { traditional: 2, religious: -3 }, f: { reformers: -4, traditionalists: 2 } }) }
        ] }),
    war_profiteer: () => ({ tag: "SCANDAL", title: "War profiteers",
        body: `<p>A defence contractor has been charging your government triple for shield generators that don't work.</p>`,
        choices: [
            { label: "Prosecute", go: () => applyEffects({ trust: 4, g: { business: -2 }, treasury: 0.5 }) },
            { label: "Quietly renegotiate", go: () => applyEffects({ treasury: 0.3, secret: "Covered up a war profiteering scandal", heat: 4 }) },
            { label: "Ignore it — we need them", go: () => applyEffects({ trust: -3 }) }
        ] }),
    war_rationing: () => ({ tag: "SHORTAGES", title: "Empty shelves",
        body: `<p>The war has choked the supply lanes. Fuel and food prices have doubled in a month.</p>`,
        choices: [
            { label: "Introduce rationing", go: () => applyEffects({ p: { inequality: -2 }, g: { workers: 2, business: -3, youth: -2 }, f: { reformers: 2 } }) },
            { label: "Subsidise prices", go: () => applyEffects({ treasury: -1.5, g: { workers: 3, urban: 3 } }) },
            { label: "Let the market sort it out", go: () => applyEffects({ p: { inequality: 3 }, g: { workers: -4, business: 3 }, unrest: 4 }) }
        ] }),
    war_conversion: () => ({ tag: "THE WAR ECONOMY", title: "Convert the factories?",
        body: `<p>The war effort wants your civilian factories converted to munitions and armour plate.</p>`,
        choices: [
            { label: "Convert them", go: () => { addStream("Munitions production", 0.2, 30); G.base.employment += 2; G.base.environment -= 2; applyEffects({ f: { militarists: 3 }, g: { environmentalists: -3 } }); } },
            { label: "Convert half", go: () => { addStream("Munitions production", 0.1, 30); G.base.employment += 1; } },
            { label: "Refuse", go: () => applyEffects({ f: { militarists: -3, federalists: 2 } }) }
        ] }),
    war_casualties: () => ({ tag: "THE COST", title: "The casualty lists",
        body: `<p>Volunteers from ${esc(world().name)} served with the ${G.allegiance === "separatist" ? "Separatist militias" : "Republic's local auxiliaries"}. The first casualty lists have arrived. Some families are asking why their children were there at all.</p>`,
        choices: [
            { label: "A day of mourning — and pensions for the families", go: () => applyEffects({ treasury: -0.5, g: { veterans: 4, elders: 3 }, trust: 3 }) },
            { label: "A recruitment drive in their honour", go: () => { G.garrison += 6; applyEffects({ f: { militarists: 3 }, g: { youth: -3 } }); } },
            { label: "Bring our volunteers home", go: () => applyEffects({ f: { reformers: 3, militarists: -3, centralists: -2 }, g: { elders: 3 } }) }
        ] }),
    war_jedi: () => ({ tag: "THE WAR EFFORT", title: "A Jedi general's request",
        body: `<p>A Jedi general asks to use your world as a staging point for an offensive — supplies, landing fields, hospitals.</p>`,
        choices: [
            { label: "Agree", go: () => { G.garrison += 10; applyEffects({ treasury: -0.8, f: { centralists: 2 }, influence: 3 }); } },
            { label: "Offer hospitals only", go: () => applyEffects({ treasury: -0.3, rep: 2 }) },
            { label: "Decline", go: () => applyEffects({ f: { independence: 2, centralists: -2 } }) }
        ] }),
    war_sympathizers: () => ({ tag: "DISSENT", title: G.allegiance === "separatist" ? "Republic loyalists march" : "Separatist sympathisers march",
        body: `<p>Thousands march through the capital demanding your world ${G.allegiance === "separatist" ? "rejoin the Republic" : "leave the war — and the Republic"}.</p>`,
        choices: [
            { label: "Let them march", go: () => applyEffects({ f: { reformers: 2 }, unrest: 2 }) },
            { label: "Ban the marches", go: () => applyEffects({ unrest: 5, f: { reformers: -4, militarists: 2 } }) },
            { label: "Meet their leaders", go: () => applyEffects({ unrest: -2, f: { independence: 2 } }) }
        ] }),
    war_bonds: () => ({ tag: "THE WAR ECONOMY", title: "A war bond drive",
        body: `<p>Your finance office proposes a planetary war bond drive.</p>`,
        choices: [
            { label: "Launch it", go: () => { applyEffects({ treasury: 3 }); addStream("Bond repayments", -0.08, 48); } },
            { label: "Not now", go: () => {} }
        ] }),

    imp_academy: () => ({ tag: `${moffName().toUpperCase()}`, title: "The Academy quota",
        body: `<p>${esc(moffName())} requires ${pick([200, 500, 1000])} of ${esc(world().name)}'s young people for the Imperial Academy this year.</p>`,
        choices: [
            { label: "Fill the quota", go: () => { G.moffTrust = clamp((G.moffTrust || 50) + 6); applyEffects({ g: { youth: -6, elders: -3, military: 2 }, f: { militarists: 2 } }); } },
            { label: "Fill it with volunteers only", hint: "Probably not enough.", go: () => { if (chance(45)) report("Enough volunteers", "Somehow, you find them."); else { G.moffTrust = clamp((G.moffTrust || 50) - 8); cutAutonomy(3, "The Moff filled the Academy quota himself"); } } },
            { label: "Hide the youngest", go: () => { G.isb = (G.isb || 0) + 8; G.moffTrust = clamp((G.moffTrust || 50) - 6); applyEffects({ g: { youth: 4, elders: 4 } }); } }
        ] }),
    imp_garrison: () => ({ tag: "THE EMPIRE", title: "A stormtrooper garrison",
        body: `<p>${esc(moffName())} is stationing a stormtrooper garrison in your capital — at your government's expense.</p>`,
        choices: [
            { label: "Build the barracks", go: () => { applyEffects({ treasury: -1.5, unrest: -3, g: { youth: -3 } }); cutAutonomy(8, "A stormtrooper garrison in the capital"); G.moffTrust = clamp((G.moffTrust || 50) + 5); } },
            { label: "Offer a base outside the city", go: () => { applyEffects({ treasury: -1 }); cutAutonomy(4, "An Imperial base outside the capital"); } },
            { label: "Protest", go: () => { G.moffTrust = clamp((G.moffTrust || 50) - 8); addWrath(4); cutAutonomy(6, "A garrison imposed over the government's protest"); } }
        ] }),
    imp_lists: () => ({ tag: "IMPERIAL SECURITY BUREAU", title: "The lists",
        body: `<p>The ISB requests your government's records of ${pick(["former Separatist sympathisers", "Jedi-affiliated families", "union organisers", "journalists and student leaders"])}. Names, addresses, associates.</p>`,
        choices: [
            { label: "Hand them over", go: () => { G.moffTrust = clamp((G.moffTrust || 50) + 8); applyEffects({ rep: -6, consistency: -6, f: { reformers: -6 } }); G.record.agreements.push(`Handed dissident lists to the ISB (${eraYear(currentBBY())})`); } },
            { label: "Hand over a cleaned list", go: () => { G.isb = (G.isb || 0) + 6; if (chance(30)) { G.moffTrust = clamp((G.moffTrust || 50) - 12); report("They noticed", "The ISB compares your list to its own. It is noticeably shorter."); } } },
            { label: "“The records were lost in a fire”", go: () => { G.isb = (G.isb || 0) + 12; G.moffTrust = clamp((G.moffTrust || 50) - 10); applyEffects({ rep: 4 }); } }
        ] }),
    imp_decree: () => {
        const k = pick(["id_chits", "curfews", "holocams", "patriotic_broadcasts", "loyalty_oaths", "species_registry"].filter(x => POLICIES[x] && policyAvailable(x) && G.policies[x].level < 0.5)) || "holocams";
        return { tag: "IMPERIAL DECREE", title: `${moffName()} imposes ${POLICIES[k].name}`,
            body: `<p>By order of the Moff, ${esc(world().name)} will enact <b>${esc(POLICIES[k].name)}</b> at once. Your legislature is not consulted.</p>`,
            choices: [
                { label: "Implement it", go: () => { G.policies[k].level = 0.6; G.moffTrust = clamp((G.moffTrust || 50) + 5); cutAutonomy(4, `${POLICIES[k].name} imposed by decree`); } },
                { label: "Implement it — badly", hint: "On paper only.", go: () => { G.policies[k].level = 0.2; G.isb = (G.isb || 0) + 6; if (chance(35)) G.moffTrust = clamp((G.moffTrust || 50) - 10); } },
                { label: "Refuse", go: () => { G.moffTrust = clamp((G.moffTrust || 50) - 15); addWrath(8, "You refused an Imperial decree."); applyEffects({ rep: 5, legitimacy: 4 }); if ((G.moffTrust || 50) < 20) frontScene("imp_removal", {}); } }
            ] };
    },
    imp_concession: () => ({ tag: "THE EMPIRE", title: "An Imperial mining concession",
        body: `<p>The Empire grants a mining concession on ${pick(["the northern highlands", "a sacred valley", "your largest nature reserve", "the old ancestral lands"])} to an Imperial contractor.</p>`,
        choices: [
            { label: "Accept the royalties", go: () => { addStream("Imperial mining royalties", 0.15, 36); G.base.environment -= 6; applyEffects({ g: { traditional: -6, environmentalists: -6 } }); } },
            { label: "Demand protections", go: () => { if (chance(40)) report("Some protections", "The worst sites are spared."); else { G.base.environment -= 6; G.moffTrust = clamp((G.moffTrust || 50) - 4); } } },
            { label: "Organise protests", go: () => { G.isb = (G.isb || 0) + 8; applyEffects({ g: { traditional: 6, environmentalists: 5 }, unrest: 4 }); } }
        ] }),
    imp_destroyer: () => ({ tag: "THE EMPIRE", title: "A Star Destroyer in orbit",
        body: `<p>An Imperial Star Destroyer arrives over the capital “for a routine inspection”. It stays for a month. Everyone looks up.</p>`,
        choices: [
            { label: "Host the admiral lavishly", go: () => { G.moffTrust = clamp((G.moffTrust || 50) + 6); applyEffects({ treasury: -0.3, rep: -2 }); } },
            { label: "Carry on as normal", go: () => applyEffects({ unrest: -2 }) },
            { label: "Protest the intimidation", go: () => { G.moffTrust = clamp((G.moffTrust || 50) - 6); addWrath(3); applyEffects({ rep: 3 }); } }
        ] }),
    imp_cell: () => ({ tag: "IMPERIAL SECURITY BUREAU", title: "A rebel cell in the capital",
        body: `<p>The ISB has found a rebel cell in your capital and wants your police to make the arrests — tomorrow, at dawn.</p>`,
        choices: [
            { label: "Make the arrests", go: () => { G.moffTrust = clamp((G.moffTrust || 50) + 8); G.rebellion = clamp(G.rebellion - 2); applyEffects({ rep: -4, consistency: -4 }); } },
            { label: "Warn them tonight", hint: "If you're caught…", go: () => { G.isb = (G.isb || 0) + 12; G.rebellion = clamp(G.rebellion + 3); G.secretRebel = true; if (chance(25)) { G.moffTrust = clamp((G.moffTrust || 50) - 20); report("They know", "The cell escaped. The ISB wants to know who told them."); } } },
            { label: "Let the ISB do its own dirty work", go: () => { G.moffTrust = clamp((G.moffTrust || 50) - 5); } }
        ] }),
    imp_pacification: () => ({ tag: "THE EMPIRE", title: "Pacification",
        body: `<p>The Empire has “pacified” a neighbouring system. Survivors are arriving on anything that flies. ${esc(moffName())} forbids you to take them in.</p>`,
        choices: [
            { label: "Obey", go: () => { G.moffTrust = clamp((G.moffTrust || 50) + 4); applyEffects({ rep: -5, g: { religious: -3 } }); } },
            { label: "Take them in quietly", go: () => { G.isb = (G.isb || 0) + 8; applyEffects({ treasury: -0.5, rep: 4, p: { housing: -2 } }); G.rebellion = clamp(G.rebellion + 2); } },
            { label: "Take them in publicly", go: () => { G.moffTrust = clamp((G.moffTrust || 50) - 15); addWrath(6); applyEffects({ rep: 8, trust: 4 }); } }
        ] }),
    imp_census: () => ({ tag: "THE EMPIRE", title: "The Imperial census",
        body: `<p>The Empire orders a census of every being on ${esc(world().name)} — by species.</p>`,
        choices: [
            { label: "Carry it out", go: () => { G.moffTrust = clamp((G.moffTrust || 50) + 4); applyEffects({ g: { traditional: -4 }, f: { reformers: -3 } }); } },
            { label: "Count everyone as “citizen”", go: () => { G.isb = (G.isb || 0) + 6; applyEffects({ rep: 3 }); } },
            { label: "Refuse", go: () => { G.moffTrust = clamp((G.moffTrust || 50) - 10); addWrath(5); } }
        ] }),
    imp_contract: () => ({ tag: "THE EMPIRE", title: "A classified contract",
        body: `<p>Imperial engineers want ${esc(world().name)}'s foundries for a classified project. Enormous components, enormous money, no questions.</p>`,
        choices: [
            { label: "Take the contract", go: () => { addStream("Classified Imperial contract", 0.3, 36); G.base.employment += 3; G.moffTrust = clamp((G.moffTrust || 50) + 6); G.imperialContract = true; } },
            { label: "Take it — and pass the plans to the rebels", go: () => { addStream("Classified Imperial contract", 0.3, 36); G.isb = (G.isb || 0) + 15; G.rebellion = clamp(G.rebellion + 8); G.secretRebel = true; } },
            { label: "Decline", go: () => { G.moffTrust = clamp((G.moffTrust || 50) - 6); } }
        ] }),
    imp_removal: () => ({ tag: moffName().toUpperCase(), title: "The Moff has lost patience",
        body: `<p>${esc(moffName())} informs you that your services are no longer required. An Imperial administrator will take over by the end of the week.</p>`,
        choices: [
            { label: "Step aside", go: () => { cutAutonomy(15, "The Moff removed the planetary government"); frontScene("outsider_path", { reason: `Removed from office by ${moffName()}.` }); } },
            { label: "Refuse to leave — declare a resistance government", go: () => imperialPath("revolt") },
            { label: "Disappear before they come", go: () => imperialPath("rebel") }
        ] })
});


// ── The month ─────────────────────────────────────────────────────

HISTORY.push(
    { bby: 19, m: 2, id: "autonomy_sector_governance", run: () => cutAutonomy(20, "The Sector Governance Decree placed a regional governor over the planet") },
    { bby: 19, m: 5, id: "autonomy_empire", run: () => { if (!(G.imperial && G.imperial.special)) cutAutonomy(25, "The Empire was proclaimed"); else cutAutonomy(8, "The Empire — with special status"); moffName(); G.moffTrust = 50; } },
    { bby: 0, m: 3, id: "autonomy_moffs", run: () => { if (imperialWorld()) cutAutonomy(20, "The regional governors took direct control"); } },
    { bby: -5, m: 3, id: "autonomy_restored", run: () => gainAutonomy(100 - autonomy(), "The New Republic restored self-government") }
);

function tickWartime() {
    autonomy();
    if (G.levyRelief && monthsNow() < G.levyRelief && G.era === "war") G.treasury += 0.05 + attr("wealth") * 0.03;
    tickWarEconomy();
    if (!wartimeGov() || G.scenes.length) return;
    G.lastWarScene = G.lastWarScene == null ? -99 : G.lastWarScene;
    if (monthsNow() - G.lastWarScene < 4) return;
    // Never the same demand twice in a row.
    const fresh = list => { const opts = list.filter(t => !(G.recentWar || []).includes(t)); const t = pick(opts.length ? opts : list); G.recentWar = [t].concat(G.recentWar || []).slice(0, 4); return t; };
    if (G.era === "war" && G.allegiance !== "neutral" && chance(22)) { G.lastWarScene = monthsNow(); pushScene(fresh(WAR_SCENES), {}); }
    else if (G.era === "war" && G.allegiance === "neutral" && chance(10)) { G.lastWarScene = monthsNow(); pushScene(fresh(["war_envoy", "war_refugees", "war_rationing"]), {}); }
    else if (imperialWorld() && chance(22)) { G.lastWarScene = monthsNow(); pushScene(fresh(IMPERIAL_SCENES), {}); }
    if (imperialWorld() && (G.moffTrust || 50) < 15 && chance(10) && !G.scenes.some(s => s.type === "imp_removal")) pushScene("imp_removal", {});
}
