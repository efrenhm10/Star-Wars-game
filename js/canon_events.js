// ── CANON ENCOUNTERS — Star Wars characters come to you ────────────
//
// Which characters enter your life depends on your role: senators meet
// senators; governors meet regional senators, Jedi generals and officials;
// monarchs meet ambassadors and Separatist envoys.

const bbyNow = () => currentBBY();
const cn = key => canonNpc(key);

Object.assign(EVENTS, {

    gunray_bribe: { weight: 0, deadline: 2,
        build: () => ({ title: "A Visit from the Trade Federation", from: "Senator Lott Dod", topic: "the trade route tax",
            text: "“Senator, the Trade Federation would be… most grateful… if you opposed this outrageous taxation of the trade routes. Our gratitude can be very tangible.”",
            choices: [
                { label: "Take their money and oppose the tax", e: { funds: 3, secret: "Took Trade Federation money to oppose the trade tax", secretHeat: 10, f: { corporatists: 5 } }, run: () => { const d = cn("dod"); if (d) changeRel(d, 20, "Took the Federation's gratitude."); const b = G.bills.find(x => x.key === "trade_route_tax"); if (b) b.playerVote = "against"; }, msg: "The credits arrive. So does a certain obligation." },
                { label: "Refuse — and support the tax", e: { rep: 3, f: { centralists: 3, corporatists: -4 } }, run: () => { const d = cn("dod"); if (d) changeRel(d, -20, "Refused the Federation's offer."); const b = G.bills.find(x => x.key === "trade_route_tax"); if (b) b.playerVote = "for"; }, msg: "Lott Dod leaves without a word." },
                { label: "Hear them out, promise nothing", msg: "You learn a great deal about the Federation's plans." }
            ], def: 2 }) },

    gunray_trial: { weight: 0, deadline: 3,
        build: () => ({ title: "The Trials of Nute Gunray", from: "Senate Judiciary Committee", topic: "the Gunray trials",
            text: "The Trade Federation's viceroy is on trial for the invasion of Naboo. His lawyers — and his money — are winning. The Supreme Court has already overturned one conviction.",
            choices: [
                { label: "Push for conviction", e: { trust: 3, rep: 3, f: { reformers: 4, corporatists: -5 } }, run: () => { G.repCorruption = clamp(G.repCorruption - 5); const g = cn("gunray"); if (g) changeRel(g, -30, "Pushed for his conviction."); napNaboo(8, "Demanded justice for Naboo."); }, msg: "The trial drags on — but you're on the record." },
                { label: "Accept a settlement", e: { funds: 1, f: { corporatists: 4 } }, run: () => { G.repCorruption = clamp(G.repCorruption + 5); napNaboo(-8, "Accepted a settlement with the Federation."); }, msg: "Gunray walks free. The Outer Rim draws its own conclusions." },
                { label: "Stay out of it", msg: "Other people's fight." }
            ], def: 2 }) },

    palpatine_meeting: { weight: 0, deadline: 2,
        build: () => ({ title: "An Invitation from the Chancellor", from: "Supreme Chancellor Palpatine", topic: "the Chancellor's offer",
            text: "“Senator, I have followed your career with great interest. There is a seat on the Finance Committee. I would so like to see it filled by someone who supports my Senate Efficiency Act.”",
            choices: [
                { label: "Accept the seat — and support his bill", run: () => { joinCommittee("finance"); const p = cn("palpatine"); if (p) changeRel(p, 15, "Accepted his committee nomination."); const b = createBill("efficiency_act", p ? p.id : null, { arena: "senate", title: "Senate Efficiency Act", desc: "Streamlines Senate procedure — and routes more decisions through the Chancellor's office.", stance: { centralists: 3, militarists: 1, corporatists: 1, reformers: -1, federalists: -2, independence: -2, traditionalists: -1 }, g: {} }); b.playerVote = "for"; G.promises.push({ npcId: p ? p.id : null, type: "trade", billKey: "efficiency_act", made: monthsNow(), bill: "the Finance Committee seat" }); }, msg: "You join the Finance Committee. You have unknowingly helped a very patient man." },
                { label: "Accept the seat, but stay independent", run: () => { joinCommittee("finance"); const p = cn("palpatine"); if (p) changeRel(p, -8, "Took the seat but not the bargain."); }, msg: "He smiles. He always smiles." },
                { label: "Decline politely", run: () => { const p = cn("palpatine"); if (p) changeRel(p, -4); }, msg: "“A pity. Another time, perhaps.”" }
            ], def: 2 }) },

    padme_aid: { weight: 0, deadline: 3,
        build: () => { const p = cn("amidala"); return { title: "Padmé Amidala Asks for Help", from: p ? p.name : "Naboo delegation", topic: "Outer Rim aid",
            text: `“${p && p.rel >= 35 ? "Senator, I need your help." : "Senator"}, I've been trying to get emergency aid approved for the Outer Rim. Your support could make the difference.”`,
            choices: [
                { label: "Support her", run: () => { if (p) changeRel(p, 15, "Supported her Outer Rim aid bill."); const b = createBill("outer_rim_aid", p ? p.id : null, { arena: "senate", title: "Outer Rim Emergency Aid Act", desc: "Food, medicine and infrastructure for neglected Outer Rim worlds.", stance: { reformers: 3, federalists: 2, independence: 1, centralists: 0, corporatists: -2, militarists: -1, traditionalists: 0 }, g: { rural: 3, farmers: 3, elites: -2 }, frontierAid: 12 }); b.playerVote = "for"; }, msg: "The bill goes to the floor with your name beside hers." },
                { label: "Negotiate: your support for hers", run: () => { if (p) changeRel(p, 5, "Bargained over her aid bill."); G.promises.push({ npcId: p ? p.id : null, type: "favor", made: monthsNow(), bill: "Outer Rim aid" }); }, msg: "She agrees to owe you one. She will remember that you asked." },
                { label: "Offer an alternative: private investment", e: { f: { corporatists: 4, reformers: -2 } }, run: () => { if (p) changeRel(p, -5, "Offered a corporate alternative to her aid bill."); }, msg: "She listens politely. She is not persuaded." },
                { label: "Refuse", run: () => { if (p) changeRel(p, -15, "Refused to help the Outer Rim."); }, msg: "“I see.”" }
            ], def: 3 }; } },

    dooku_approach: { weight: 0, deadline: 3,
        build: () => ({ title: "A Private Message from Count Dooku", from: "Count Dooku of Serenno", topic: "the Separatist movement",
            text: "“The Republic has forgotten the Outer Rim. It has forgotten your people. Corruption has hollowed out the Senate. I ask only that you listen.”",
            choices: [
                { label: "Agree with him", e: { f: { independence: 8, centralists: -6 } }, run: () => { const d = cn("dooku"); if (d) changeRel(d, 20, "Agreed the Republic had failed."); G.opinion.sep = clamp(G.opinion.sep + 5); }, msg: "Dooku is pleased. Word of your sympathy spreads — in both directions." },
                { label: "Disagree", e: { f: { centralists: 3 } }, run: () => { const d = cn("dooku"); if (d) changeRel(d, -10, "Rejected his arguments."); }, msg: "“A pity. History will not wait for you.”" },
                { label: "Ask questions", e: { influence: 2 }, run: () => { const d = cn("dooku"); if (d) remember(d, "Listened carefully and asked hard questions."); }, msg: "You learn how far his plans already reach." },
                { label: "Report him to the Chancellor", run: () => { const p = cn("palpatine"); if (p) changeRel(p, 10, "Reported Dooku's approach."); const d = cn("dooku"); if (d) changeRel(d, -25, "Reported him to the Chancellor."); }, msg: "The Chancellor thanks you warmly. He does not seem surprised." },
                { label: "Secretly keep talking", e: { secret: "Kept a secret channel to Count Dooku", secretHeat: 10 }, run: () => { G.dookuChannel = true; const d = cn("dooku"); if (d) changeRel(d, 15, "Kept a secret channel open."); }, msg: "A secure channel is established." }
            ], def: 1 }) },

    loyalist_committee: { weight: 0, deadline: 3,
        build: () => ({ title: "The Loyalist Committee", from: "Senators Amidala and Organa", topic: "the Loyalist Committee",
            text: "A group of senators is forming a Loyalist Committee to hold the Republic together — by negotiation, not war. Will you join?",
            choices: [
                { label: "Join", e: { f: { reformers: 5, centralists: 2 }, influence: 3 }, run: () => { ["amidala", "bail", "mothma"].forEach(k => { const n = cn(k); if (n) changeRel(n, 12, "Joined the Loyalist Committee."); }); G.record.agreements.push("Member of the Loyalist Committee (23 BBY)"); }, msg: "You join the Committee." },
                { label: "Decline", run: () => { const n = cn("amidala"); if (n) changeRel(n, -4); }, msg: "They're disappointed, but understand." }
            ], def: 1 }) },

    padme_mca: { weight: 0, deadline: 2,
        build: () => { const p = cn("amidala"); return { title: "Senator Amidala on the Military Creation Act", from: p ? p.name : "Naboo", topic: "the Military Creation Act",
            text: "“If we create an army, the Separatists will see it as a declaration of war. Please, vote against the Military Creation Act.”",
            choices: [
                { label: "Promise to vote against it", run: () => { const b = G.bills.find(x => x.key === "military_creation"); if (b) b.playerVote = "against"; if (p) changeRel(p, 10, "Promised to oppose the Military Creation Act."); }, msg: "She thanks you." },
                { label: "Tell her you'll vote for it", run: () => { const b = G.bills.find(x => x.key === "military_creation"); if (b) b.playerVote = "for"; if (p) changeRel(p, -10, "Supported the Military Creation Act."); }, msg: "“I hope you're right.”" },
                { label: "Keep your options open", msg: "She notes your caution." }
            ], def: 2 }; } },

    palpatine_emergency: { weight: 0, deadline: 1,
        build: () => ({ title: "The Chancellor Needs You", from: "Supreme Chancellor Palpatine", topic: "emergency powers",
            text: "“The Separatists are building an army. If the Senate were to grant me emergency powers — temporarily, of course — we could act. May I count on your vote?”",
            choices: [
                { label: "Yes, Chancellor", run: () => { const p = cn("palpatine"); if (p) changeRel(p, 10, "Promised to support his emergency powers."); }, msg: "“I knew I could rely on you.”" },
                { label: "I have concerns", run: () => { const p = cn("palpatine"); if (p) changeRel(p, -3); }, msg: "“Of course. Concerns are healthy.”" },
                { label: "No", run: () => { const p = cn("palpatine"); if (p) changeRel(p, -10, "Refused him emergency powers."); }, msg: "The warmth leaves his voice for just a moment." }
            ], def: 1 }) },

    ryloth_relief: { weight: 0, deadline: 2,
        build: () => ({ title: "Ryloth Is Burning", from: "Senator Orn Free Taa", topic: "Ryloth",
            text: "“My people are starving under the droid occupation. The Chancellor says relief must wait for the military campaign.”",
            choices: [
                { label: "Push for immediate humanitarian relief", e: { f: { reformers: 4 }, rep: 3, influence: -3 }, run: () => { const n = cn("freeTaa"); if (n) changeRel(n, 12, "Pushed relief for Ryloth."); G.galaxy.ryloth.stability = clamp(G.galaxy.ryloth.stability + 8); }, msg: "Relief ships follow the fleet." },
                { label: "Back the Chancellor's military-first approach", e: { f: { militarists: 4 } }, msg: "The campaign comes first." },
                { label: "Trade your support for his vote later", run: () => { const n = cn("freeTaa"); if (n) { changeRel(n, 5); G.promises.push({ npcId: n.id, type: "favor", made: monthsNow(), bill: "Ryloth relief" }); } }, msg: "Orn Free Taa always pays his debts. Eventually." }
            ], def: 1 }) },

    // Petition sponsors: each asks for something.
    sponsor_trade: { weight: 0, deadline: 2,
        build: (g, c) => { const n = cn("belIblis") || livingNpcs().find(x => x.arena === "senate" && x.faction === "corporatists"); return { title: "A Sponsor — With Conditions", from: n ? n.name : "A Core senator", topic: "the defence petition",
            text: `“We'll support your request for military assistance if you support our industrial tariff bill.”`,
            choices: [
                { label: "Agree to the trade", run: () => { const b = G.bills.find(x => x.id === c.billId); if (b) b.momentum += 12; if (n) { changeRel(n, 8, "Traded tariff support for their sponsorship."); G.promises.push({ npcId: n.id, type: "trade", billKey: "tariff_cut", made: monthsNow(), bill: "your defence petition", due: monthsNow() + 4 }); } }, msg: "They cosponsor your petition. You owe them a vote on tariffs." },
                { label: "Decline", msg: "They'll decide on the merits. Probably against." }
            ], def: 1 }; } },

    sponsor_humanitarian: { weight: 0, deadline: 2,
        build: (g, c) => { const n = cn("mothma") || livingNpcs().find(x => x.arena === "senate" && x.faction === "reformers"); return { title: "Humanitarian — Not Military", from: n ? n.name : "A reformist senator", topic: "the defence petition",
            text: "“We support humanitarian assistance but oppose military escalation. Amend your petition and you'll have our votes.”",
            choices: [
                { label: "Amend it: humanitarian aid only", run: () => { const b = G.bills.find(x => x.id === c.billId); if (b) { b.humanitarianOnly = true; b.stance.reformers = 3; b.stance.militarists = 0; b.momentum += 8; } if (n) changeRel(n, 8, "Accepted a humanitarian amendment."); }, msg: "Supplies, yes. Warships, no." },
                { label: "Refuse: we need warships", run: () => { if (n) changeRel(n, -4); }, msg: "They'll vote against." }
            ], def: 1 }; } },

    sponsor_cost: { weight: 0, deadline: 2,
        build: (g, c) => ({ title: "The Chancellor's Office Has Concerns", from: "Mas Amedda", topic: "the defence petition",
            text: "“The Chancellor's office is concerned about the cost of your request. The Chancellor would appreciate… reassurance.”",
            choices: [
                { label: "Meet the Chancellor personally (−6 influence)", run: () => { applyEffects({ influence: -6 }); const b = G.bills.find(x => x.id === c.billId); if (b) b.momentum += 10; const p = cn("palpatine"); if (p) changeRel(p, 6, "Asked him personally for military help."); }, msg: "He promises to “see what can be done”. The whips get the message." },
                { label: "Offer to support his next priority", run: () => { const b = G.bills.find(x => x.id === c.billId); if (b) b.momentum += 12; const p = cn("palpatine"); if (p) G.promises.push({ npcId: p.id, type: "favor", made: monthsNow(), bill: "your defence petition" }); }, msg: "You now owe the Chancellor." },
                { label: "Go around him to the committees", msg: "The Chancellor's office notices." }
            ], def: 2 }) },

    rights_back: { weight: 0, deadline: 3,
        build: () => ({ title: "“When Are You Giving Our Rights Back?”", from: "Civil liberties coalition", topic: "emergency measures",
            text: "The emergency is over, but the surveillance, censorship and emergency laws are still in force. Protesters want to know when they end.",
            choices: [
                { label: "Repeal the emergency measures", run: () => { ["surveillance", "censorship", "martial_law", "conscription"].forEach(k => { if (G.policies[k]) G.policies[k].level = 0; }); applyEffects({ g: { youth: 6, students: 6 }, trust: 5, f: { reformers: 5, militarists: -4 } }); }, msg: "The emergency laws are repealed." },
                { label: "Keep them: the threat hasn't passed", e: { g: { youth: -6, students: -6, elders: 2 }, trust: -4, f: { militarists: 3, reformers: -5 }, unrest: 6 }, msg: "The protests grow." },
                { label: "Promise a review", e: { trust: -1 }, msg: "A commission is formed. Nobody is fooled." }
            ], def: 1 }) },

    // ── Random canon encounters, gated by role and era ──────────────

    chuchi_advice: { weight: g => roleCat() === "senate" && bbyNow() <= 22 && bbyNow() > 19 && cn("chuchi") ? 2 : 0, cooldown: 60, deadline: 3,
        setup: () => cn("chuchi") && roleCat() === "senate" ? {} : null,
        build: () => ({ title: "A New Senator Asks for Advice", from: "Senator Riyo Chuchi of Pantora", topic: "mentoring",
            text: "“I'm new here, and the others don't take me seriously. Could you advise me?”",
            choices: [
                { label: "Take her under your wing", ap: 3, run: () => { const n = cn("chuchi"); if (n) { changeRel(n, 25, "Mentored her in her first years."); n.influence += 5; } }, msg: "A grateful ally for life." },
                { label: "Brush her off", run: () => { const n = cn("chuchi"); if (n) changeRel(n, -10, "Brushed her off."); }, msg: "She'll remember." }
            ], def: 1 }) },

    farr_food: { weight: g => roleCat() === "senate" && bbyNow() <= 22 && bbyNow() >= 21 && cn("farr") ? 2 : 0, cooldown: 60, deadline: 2,
        setup: () => cn("farr") ? {} : null,
        build: () => ({ title: "Rodia Is Starving", from: "Senator Onaconda Farr", topic: "Rodia",
            text: "“My people are starving. The Separatists have offered food — at a price. The Republic offers nothing. What would you do in my place?”",
            choices: [
                { label: "Get Rodia emergency food aid", ap: 3, e: { f: { reformers: 3 }, influence: -3 }, run: () => { const n = cn("farr"); if (n) changeRel(n, 20, "Fed Rodia when no one else would."); G.galaxy.rodia.stability = clamp(G.galaxy.rodia.stability + 10); }, msg: "Rodia stays in the Republic." },
                { label: "Warn him against the Separatists", run: () => { const n = cn("farr"); if (n) changeRel(n, -5); }, msg: "“Easy to say with a full stomach.”" }
            ], def: 1 }) },

    satine_neutral: { weight: g => (G.allegiance === "neutral" || G.worldKey === "mandalore") && cn("satine") && bbyNow() <= 22 && bbyNow() > 20 ? 2 : 0, cooldown: 60, deadline: 3,
        setup: () => cn("satine") ? {} : null,
        build: () => ({ title: "The Council of Neutral Systems", from: "Duchess Satine Kryze", topic: "neutrality",
            text: "“Neutrality is not weakness. Join the Council of Neutral Systems and stand with those of us who refuse this war.”",
            choices: [
                { label: "Join the Council", e: { f: { reformers: 3, militarists: -3 } }, run: () => { changeAllegiance("neutral", "joining the Council of Neutral Systems"); const n = cn("satine"); if (n) changeRel(n, 20, "Joined the Council of Neutral Systems."); }, msg: "Your world joins the neutral bloc." },
                { label: "Decline", run: () => { const n = cn("satine"); if (n) changeRel(n, -5); }, msg: "“I hope you never regret that.”" }
            ], def: 1 }) },

    jabba_tribute: { weight: g => G.worldKey === "tatooine" && cn("jabba") ? 3 : 0, cooldown: 12, deadline: 2,
        setup: () => cn("jabba") ? {} : null,
        build: () => ({ title: "Jabba Wants His Cut", from: "Bib Fortuna, for Jabba the Hutt", topic: "the Hutts",
            text: "“His Excellency notes that your settlement's water trade has grown. His Excellency expects tribute.”",
            choices: [
                { label: "Pay the tribute", e: { treasury: -2, funds: -0.5, g: { farmers: -3 } }, run: () => { const n = cn("jabba"); if (n) changeRel(n, 8); }, msg: "Jabba is pleased. For now." },
                { label: "Refuse", e: { g: { farmers: 6, rural: 4 }, trust: 3 }, run: () => { G.threatened = true; const n = cn("jabba"); if (n) changeRel(n, -25, "Refused tribute."); }, msg: "Jabba laughs. That's never good." },
                { label: "Negotiate a smaller cut", ap: 3, e: { treasury: -1 }, run: () => { const n = cn("jabba"); if (n) changeRel(n, 2); }, msg: "Everyone saves face." }
            ], def: 0 }) },

    lamasu_contract: { weight: g => G.worldKey === "kamino" && bbyNow() <= 22 && bbyNow() > 19 ? 3 : 0, cooldown: 24, deadline: 3,
        setup: () => ({}),
        build: () => ({ title: "The Republic Wants More Clones", from: "Prime Minister Lama Su", topic: "the clone contract",
            text: "The Republic has ordered another million clones. Kamino's economy now depends entirely on a war.",
            choices: [
                { label: "Accept and expand", e: { treasury: 6, p: { employment: 4 }, g: { business: 5 }, f: { militarists: 5, reformers: -3 } }, msg: "Kamino grows rich on war." },
                { label: "Accept, with ethical safeguards", e: { treasury: 3, g: { religious: 3 }, rep: 3 }, msg: "The safeguards are real, if limited." },
                { label: "Refuse further orders", e: { treasury: -3, p: { employment: -4 }, f: { militarists: -8, reformers: 4 } }, run: () => { const p = cn("palpatine"); if (p) changeRel(p, -15, "Refused the clone contract."); }, msg: "The Chancellor's office is not amused." }
            ], def: 0 }) },

    jedi_visit: { weight: g => G.war && roleCat() === "gov" ? 2 : 0, cooldown: 24, deadline: 2,
        setup: () => { const j = ["kenobi", "anakin", "ahsoka"].map(cn).filter(Boolean); return j.length ? { id: pick(j).id } : null; },
        build: (g, c) => { const n = npc(c.id); return { title: `${n.name} Arrives`, from: "Republic high command", topic: "the Jedi",
            text: `${n.name} has been assigned to your system with a clone detachment. “${canonLine(n)}”`,
            choices: [
                { label: "Put your forces under their command", run: () => { G.garrison += 15; changeRel(n, 10, `Trusted them with ${world().name}'s defence.`); }, msg: "Defence strength rises." },
                { label: "Coordinate, but keep command yourself", run: () => { G.garrison += 8; }, msg: "An uneasy partnership." },
                { label: "Ask them to leave", e: { f: { federalists: 4, centralists: -4 } }, run: () => changeRel(n, -10, "Asked them to leave."), msg: "They go. Your world is on its own." }
            ], def: 1 }; } },

    imperial_quota: { weight: g => (G.era === "empire" || G.era === "rebellion") && governing() ? 3 : 0, cooldown: 10, deadline: 2,
        setup: () => ({ what: pick(["ore", "conscripts", "food", "taxes", "labour"]) }),
        build: (g, c) => ({ title: `Imperial Quota: ${c.what}`, from: "Office of the Regional Governor", topic: "Imperial quotas",
            text: `The Moff's office demands a new quota of ${c.what} from ${world().name}, due immediately.`,
            choices: [
                { label: "Comply", e: { treasury: -3, p: { employment: -1 }, g: { workers: -3, youth: -3 }, f: { militarists: 3 } }, run: () => { const t = cn("tarkin"); if (t) changeRel(t, 5); }, msg: "The quota is met. Your people pay." },
                { label: "Negotiate it down", ap: 3, e: { treasury: -1, heat: 3 }, msg: "A smaller quota, a longer look from the ISB." },
                { label: "Defy the quota", e: { g: { youth: 6, workers: 5 }, heat: 15, f: { reformers: 5 } }, run: () => { G.isb = (G.isb || 0) + 15; G.rebellion = clamp(G.rebellion + 2); const t = cn("tarkin"); if (t) changeRel(t, -20, "Defied an Imperial quota."); }, msg: "The Empire has noticed you." }
            ], def: 0 }) },

    isb: { weight: g => (G.isb || 0) > 20 || G.secretRebel ? 3 : 0, cooldown: 8, deadline: 1,
        setup: () => ({}),
        build: () => ({ title: "The ISB Is Asking Questions", from: "Imperial Security Bureau", topic: "the ISB",
            text: "An ISB supervisor has requested your office's records — and your travel logs.",
            choices: [
                { label: "Cooperate fully", e: { heat: -5 }, run: () => { G.isb = Math.max(0, (G.isb || 0) - 15); }, msg: "The supervisor leaves satisfied. Probably." },
                { label: "Stall", run: () => { if (chance((G.isb || 0) / 2 + (G.secretRebel ? 20 : 0))) { G.record.arrests.push(eraYear(currentBBY())); report("Arrested", "The ISB found what it was looking for."); frontScene("outsider_path", { reason: "Arrested by the Imperial Security Bureau." }); enterOutsider("Prisoner", 24); } else G.isb = (G.isb || 0) + 5; }, msg: "" },
                { label: "Destroy the evidence", e: { heat: 10 }, run: () => { G.isb = Math.max(0, (G.isb || 0) - 10); }, msg: "Nothing to find. Suspicious in itself." }
            ], def: 1 }) },

    rebel_aid: { weight: g => G.secretRebel && ["empire", "rebellion"].includes(G.era) ? 3 : 0, cooldown: 6, deadline: 2,
        setup: () => ({}),
        build: () => ({ title: "A Request from the Underground", from: "An old friend (encrypted)", topic: "the Rebellion",
            text: "The rebel cells need credits, ships and forged permits. You're in a position to help — quietly.",
            choices: [
                { label: "Divert funds", e: { funds: -1.5, heat: 6 }, run: () => { G.rebellion = clamp(G.rebellion + 4); G.isb = (G.isb || 0) + 6; G.record.agreements.push(`Secretly financed the Rebellion (${eraYear(currentBBY())})`); }, msg: "The credits vanish into shell companies." },
                { label: "Pass on Imperial intelligence", e: { heat: 8 }, run: () => { G.rebellion = clamp(G.rebellion + 6); G.isb = (G.isb || 0) + 10; }, msg: "Somewhere, a rebel strike succeeds." },
                { label: "Not now — it's too dangerous", msg: "They understand. They're not happy." }
            ], def: 2 }) },

    classified_intel: { weight: g => G.war && intelLevel() === "classified" ? 3 : 0, cooldown: 8, deadline: 1,
        setup: () => { const t = shuffle(Object.keys(G.galaxy).filter(k => G.galaxy[k].align !== "separatist" && k !== G.worldKey && ((WORLDS[k] || BACKGROUND_WORLDS[k]).region === "outer"))).slice(0, 3); return t.length === 3 ? { targets: t } : null; },
        build: (g, c) => ({ title: "CLASSIFIED INTELLIGENCE", from: "Senate Intelligence / Chancellery", topic: "classified intelligence",
            text: `Separatist forces are expected to attack ${c.targets.map(worldName).join(", ")} within 72 hours. Only a handful of people know.`,
            choices: [
                { label: "Warn the targeted worlds", run: () => { c.targets.forEach(k => { G.galaxy[k].stability = clamp(G.galaxy[k].stability + 6); const s = worldSenator(k); if (s) changeRel(s, 12, "Warned their world of an attack."); }); if (chance(30)) applyEffects({ heat: 10, secret: "Leaked classified intelligence" }); }, msg: "The worlds prepare. Lives are saved. Someone may ask how they knew." },
                { label: "Keep it classified", run: () => { c.targets.forEach(k => { G.galaxy[k].stability = clamp(G.galaxy[k].stability - 8); }); }, msg: "The attacks come as predicted." },
                { label: "Share it with your allies only", run: () => { allies().slice(0, 3).forEach(n => changeRel(n, 6, "Shared classified intelligence with them.")); applyEffects({ influence: 3, heat: 4 }); }, msg: "Your allies owe you." },
                { label: "Leak it to the press", run: () => { applyEffects({ trust: 4, heat: 12, media: { herald: 6 } }); c.targets.forEach(k => { G.galaxy[k].stability = clamp(G.galaxy[k].stability + 3); }); }, msg: "The HoloNet erupts." }
            ], def: 1 }) },

    where_hospital: { weight: g => G.office.kind === "senator" && G.seniority >= 72 && (G.homeDelivered || 0) === 0 ? 4 : 0, cooldown: 24, deadline: 2,
        setup: () => ({}),
        build: () => ({ title: "“Where Is Our Hospital?”", from: "Constituents' town hall", topic: "home projects",
            text: `“You have been a senator for ${Math.floor(G.seniority / 12)} years. Where is our hospital? Where are our roads? What has the Republic ever done for ${world().name}?”`,
            choices: [
                { label: "Promise to deliver this year", e: { trust: -2 }, msg: "They'll hold you to it." },
                { label: "Point to your legislative record", e: { g: { students: 2, elders: -3, workers: -3 } }, msg: "Nobody can live in a legislative record." },
                { label: "Blame the Senate", e: { g: { rural: 2 }, f: { federalists: 3, centralists: -3 } }, run: () => { G.opinion.sep = clamp(G.opinion.sep + 3); }, msg: "It works — and it feeds the separatists." }
            ], def: 0 }) }
});
