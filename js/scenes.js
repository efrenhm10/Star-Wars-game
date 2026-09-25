// ── SCENES — the moments that stop the clock ────────────────────────
//
// Each scene builder takes its saved context and returns what to show:
// { tag, title, body (html), choices: [{ label, hint, disabled, go }] }.

const pct = v => `${Math.round(v * 10) / 10}%`;

function changeChips(changes) {
    if (!changes || !changes.length) return "";
    return `<div class="chips">${changes.map(c => `<span class="chip ${c.good ? "up" : "down"}">${esc(c.label)} ${fmt(c.d)}</span>`).join("")}</div>`;
}

function goAutocrat(where) {
    const c = G.const;
    const refuses = c.militaryControl === "Civilian" && G.inst.military < 70 && chance(75);
    if (refuses) {
        log(`⛓️ ${G.name} tried to hold power after ${where}. The armed forces followed the constitutional government instead.`, "career");
        applyEffects({ rep: -35, trust: -30 });
        frontScene("arrested", {});
        return;
    }
    G.autocrat = true;
    G.office.termLimit = 0;
    if (G.office.termYears) G.office.termLeft = G.office.termYears * 12;
    const g = {};
    Object.keys(G.groups).forEach(k => { g[k] = k === "military" ? 5 : -12; });
    const ch = applyEffects({ g, trust: -25, rep: -30, legitimacy: -30, unrest: 30, f: { reformers: -40, federalists: -20, militarists: 5 }, i: { courts: -30, legislature: -25, agencies: -25, military: 5 }, gal: { diplomacy: -8 } });
    report("You remain in power", `The transition is "postponed". The Senate condemns ${world().name}; crowds gather outside the government buildings.`, ch);
    log(`🩸 ${G.name} refuses to leave office after ${where}. ${world().name}'s constitutional order is broken.`, "career");
}

const SCENES = {

    vote: ctx => {
        const t = ctx.t, total = t.for + t.against + t.abstain;
        const w = v => `${(v / total * 100).toFixed(1)}%`;
        const body = `
            <p class="muted">${esc(arenaName(ctx.bill.arena))} · Bill ${ctx.bill.num}</p>
            <div class="tally-bar big"><span style="width:${w(t.for)}"></span><span style="width:${w(t.abstain)}"></span><span style="width:${w(t.against)}"></span></div>
            <div class="tally-row"><b class="c-for">FOR ${t.for}</b><b class="c-und">ABSTAIN ${t.abstain}</b><b class="c-against">AGAINST ${t.against}</b></div>
            <h2 class="${ctx.passed ? "c-for" : "c-against"}">${ctx.passed ? "THE BILL PASSES" : "THE BILL FAILS"}</h2>
            <p>You voted <b>${ctx.vote.toUpperCase()}</b>.${ctx.bill.sponsor === "player" ? " It was your bill." : ""}</p>
            ${ctx.betrayals && ctx.betrayals.length ? `<p class="c-against">🗡️ ${ctx.betrayals.map(esc).join(", ")} will remember that you broke your word.</p>` : ""}
            ${ctx.vetoable ? `<p class="c-und">It passed over your objection. As head of government, you can sign it — or veto it.</p>` : ""}
            ${changeChips(ctx.changes)}`;
        const choices = ctx.vetoable ? [
            { label: "Sign it into law", hint: "Respect the legislature's decision.", go: () => { const ch = enactBill(ctx.bill); applyEffects({ i: { legislature: 3 } }); report("Signed into law", `${ctx.bill.title} becomes law despite your objection.`, ch); } },
            { label: "Veto the bill", hint: "Legislature trust −10; its supporters won't forget.", go: () => {
                const g = {};
                Object.entries(ctx.bill.fx.g || {}).forEach(([k, v]) => { if (v > 0) g[k] = -3; });
                report("Vetoed", `You veto ${ctx.bill.title}. The legislature is furious.`, applyEffects({ g, i: { legislature: -10 } }));
            } }
        ] : [{ label: "Continue" }];
        return { tag: ctx.bill.arena === "senate" ? "GALACTIC SENATE — THE VOTE" : "THE LEGISLATURE VOTES", title: ctx.bill.title, body, choices };
    },

    campaign: ctx => {
        const recall = ctx.mode === "recall";
        const target = ctx.target ? ctx.target.title : G.office.title;
        const top = groupEntries().sort((a, b) => (b[1].w * b[1].a) - (a[1].w * a[1].a))[0][0];
        const proj = projectedShare();
        const body = `
            <p>${recall ? "Enough voters have signed the petition: a <b>recall election</b> will decide whether you finish your term." : ctx.mode === "snap" ? "Parliament is dissolved. A <b>snap election</b> is called." : `The race for <b>${esc(target)}</b> enters its final weeks.`}</p>
            <div class="versus">
                <div><b>${esc(G.name)}</b><span class="muted">${FACTIONS[G.ideology].name}</span></div>
                <div class="vs">VS</div>
                <div><b>${esc(G.opponent ? G.opponent.name : "The challenger")}</b><span class="muted">${G.opponent ? FACTIONS[G.opponent.faction].name : ""} · strength ${Math.round(G.opp)}</span></div>
            </div>
            <p>Internal polling: <b>${pct(proj)}</b> ${proj > 50 ? "— a narrow path to victory." : "— you are behind."} Campaign funds: <b>${G.funds.toFixed(1)}M cr</b>.</p>
            <p class="muted">Choose your closing strategy.</p>`;
        const choices = [
            { label: "Run on your record", hint: approval() > 50 ? "Your record is an asset." : "Risky: your record is a liability.", go: () => runElection(ctx, (approval() - 50) * 0.15) },
            { label: "Go negative on your opponent", hint: "+3.5 points, but public trust −4.", go: () => { applyEffects({ trust: -4 }); runElection(ctx, 3.5); } },
            { label: "Pour every credit into ads", hint: `Spends all ${G.funds.toFixed(1)}M cr.`, disabled: G.funds < 1, go: () => { const b = Math.min(7, G.funds * 0.9); G.funds = 0; runElection(ctx, b); } },
            { label: `Mobilise your base: ${GROUPS[top].name}`, hint: "+2.5 points and a boost with them.", go: () => { applyEffects({ g: { [top]: 5 } }); runElection(ctx, 2.5); } },
            { label: "Withdraw from the race", hint: "Leave on your own terms.", go: () => { rememberElectedSpec(); frontScene("outsider_path", { reason: "You withdraw from the race." }); } }
        ];
        return { tag: recall ? "RECALL ELECTION" : "ELECTION", title: "The Final Stretch", body, choices };
    },

    election_result: ctx => {
        const rows = ctx.breakdown.map(([name, s]) => `<tr><td>${esc(name)}</td><td>${bar(s, s > 50 ? "good" : "bad")}</td><td class="num ${s > 50 ? "c-for" : "c-against"}">${pct(s)}</td></tr>`).join("");
        const body = `
            <h2 class="${ctx.won ? "c-for" : "c-against"}">${ctx.won ? "VICTORY" : "DEFEAT"}</h2>
            <p>You win <b>${pct(ctx.share)}</b> of the vote against ${esc(ctx.opponent ? ctx.opponent.name : "your challenger")}. Turnout: ${ctx.turnout}%.</p>
            <table class="results"><tr><th>District</th><th></th><th>You</th></tr>${rows}</table>`;
        const go = () => {
            if (ctx.won) {
                if (ctx.mode === "candidate" || ctx.mode === "ladder") {
                    winOffice(ctx.target);
                    report("Elected", `${G.name} wins ${ctx.target.title} with ${pct(ctx.share)}.`, applyEffects({ influence: 8, rep: 2 }));
                } else {
                    if (ctx.mode !== "recall") G.office.termLeft = G.office.termYears * 12;
                    newOpponent();
                    report(ctx.mode === "recall" ? "Recall defeated" : "Re-elected", `${G.name} holds ${G.office.title} with ${pct(ctx.share)}.`, applyEffects({ influence: 5 }));
                }
                G.termIndex++;
            } else {
                log(`🗳️ ${G.name} loses the election (${pct(ctx.share)}).`, "career");
                if (["reelection", "recall", "snap"].includes(ctx.mode)) { rememberElectedSpec(); frontScene("defeat", ctx); }
                else frontScene("outsider_path", { reason: `You lost the race for ${ctx.target.title}.` });
            }
        };
        return { tag: "ELECTION NIGHT", title: world().name, body, choices: [{ label: "Continue", go }] };
    },

    defeat: ctx => ({
        tag: "CONSTITUTIONAL MOMENT", title: "You Have Lost",
        body: `<p>The count is in: <b>${pct(ctx.share)}</b>. By law, ${esc(ctx.opponent ? ctx.opponent.name : "your opponent")} takes office.</p>
            <div class="voices">
                <p><b>Military commander:</b> “The armed forces will follow the constitutional government.”</p>
                <p><b>Chief of staff ${esc(G.chiefOfStaff)}:</b> “We can delay the transition.”</p>
                <p><b>Your allies:</b> “If you leave now, everything we've built will disappear.”</p>
            </div>
            <p class="muted">The game will not tell you what to do.</p>`,
        choices: [
            { label: "Respect the result", hint: "Leave office. Lead the opposition.", go: () => {
                report("A peaceful transfer", "You concede and congratulate your opponent. Even your enemies call it graceful.", applyEffects({ rep: 8, trust: 5, i: { courts: 4, legislature: 4 } }));
                log(`🕊️ ${G.name} concedes defeat and hands over power peacefully.`, "career");
                enterOutsider("Opposition Leader");
            } },
            { label: "Challenge the result", hint: "Demand recounts and investigations. Costs 1M cr.", go: () => {
                applyEffects({ funds: -1 });
                const irregular = chance(world().corruption || 22);
                if (irregular && chance(50)) {
                    G.office.termLeft = G.office.termYears * 12;
                    newOpponent();
                    report("Result overturned", "Investigators find genuine fraud. The courts order the result reversed — you keep your office.", applyEffects({ rep: 4, i: { courts: 5 } }));
                } else if (irregular) {
                    report("Irregularities found — result stands", "There was fraud, but not enough to change the outcome. Your challenge is vindicated, your career is not.", applyEffects({ rep: 3 }));
                    enterOutsider("Opposition Leader");
                } else {
                    report("Challenge fails", "No evidence of fraud is found. You look like a sore loser.", applyEffects({ rep: -8, trust: -6, i: { courts: -5 } }));
                    enterOutsider("Opposition Leader");
                }
            } },
            { label: "Attempt to remain in power", hint: "Dangerous territory.", go: () => goAutocrat("losing an election") }
        ]
    }),

    arrested: () => ({
        tag: "ARRESTED", title: "The Army Chooses the Constitution",
        body: `<p>Soldiers arrive at dawn — not to protect you, but to escort you out. The courts charge you with attempting to subvert the constitution.</p>`,
        choices: [{ label: "Face trial", go: () => { enterOutsider("Prisoner", 36); G.autocrat = false; G.autocratFallen = true; } }]
    }),

    term_limit: () => {
        const others = world().roles.map((r, i) => [r, i]).filter(([r]) => ["senator", "executive", "monarch"].includes(r.kind) && r.title !== G.office.title && !(r.kind === "senator" && G.galaxy[G.worldKey].independent));
        return {
            tag: "TERM LIMIT", title: "Your Final Term Is Over",
            body: `<p>The constitution allows ${G.office.termLimit} term${G.office.termLimit > 1 ? "s" : ""} as ${esc(G.office.title)}. You have served them all.</p>`,
            choices: [
                { label: "Retire and pass the torch", hint: "Your dynasty continues.", go: () => endCareer("Served the full constitutional limit and retired.") },
                ...others.map(([r, i]) => ({ label: `Run for ${r.title}`, hint: "A new race, beginning immediately.", go: () => { rememberElectedSpec(); setOffice(makeOffice({ title: `Candidate for ${r.title}`, kind: "candidate", target: { ...r }, months: 4 })); newOpponent(2); } })),
                { label: "Stay in public life, outside office", go: () => { rememberElectedSpec(); G.lastElectedSpec = null; frontScene("outsider_path", { reason: "Term-limited out of office." }); } },
                { label: "Refuse to leave", hint: "Ignore the constitution.", go: () => goAutocrat("reaching the term limit") }
            ]
        };
    },

    career_choice: () => {
        const next = nextRungSpec();
        const ok = approval() >= 45;
        return {
            tag: "ELECTION YEAR", title: "What Next?",
            body: `<p>Your term as ${esc(G.office.title)} is ending. You can defend your seat — or aim higher.</p>
                <p class="muted">Running for higher office is harder: a bigger electorate and a stronger opponent. You need at least 45% approval to be taken seriously (you have ${Math.round(approval())}%).</p>`,
            choices: [
                { label: `Seek re-election as ${G.office.title}`, go: () => frontScene("campaign", { mode: "reelection" }) },
                ...(next ? [{ label: `Run for ${next.title}`, hint: ok ? "Climb the ladder." : "Your approval is too low.", disabled: !ok, go: () => { newOpponent(6); frontScene("campaign", { mode: "ladder", target: next }); } }] : []),
                { label: "Step down", go: () => { rememberElectedSpec(); frontScene("outsider_path", { reason: "You chose not to run again." }); } }
            ]
        };
    },

    challenge: () => {
        const k = G.office.kind;
        const who = { council: "The council", traditional: "The elders", hereditary: "The noble houses", clan: "The clans", minister: "The Chancellor's allies" }[k] || "Your backers";
        const choices = [
            { label: "Step down", go: () => { log(`${G.name} steps down as ${G.office.title}.`, "career"); frontScene("outsider_path", { reason: `${who} withdrew their support.` }); } },
            { label: "Rally support (−10 influence)", hint: `Chance of success depends on influence (${Math.round(G.influence)}).`, disabled: G.influence < 10, go: () => {
                applyEffects({ influence: -10 });
                if (chance(35 + G.influence * 0.5)) report("Challenge survived", "You call in every favour you have. It is enough — this time.", applyEffects({ legitimacy: 25, clans: 8 }));
                else { report("Removed from office", `${who} vote you out.`); frontScene("outsider_path", { reason: `${who} removed you.` }); }
            } }
        ];
        if (k === "clan") choices.push({ label: "Accept a challenge by single combat", hint: `Custom allows it. Health ${Math.round(G.health)}, age ${G.age}.`, go: () => {
            if (chance(50 + G.health / 5 - G.age / 3)) report("Victory in the circle", "You win the duel. No one questions your right to lead — for now.", applyEffects({ legitimacy: 35, clans: 12, health: -12, rep: 5 }));
            else { applyEffects({ health: -45 }); report("Defeated in the circle", "You are carried from the circle, badly wounded, no longer leader."); frontScene("outsider_path", { reason: "Defeated in single combat." }); }
        } });
        if (["hereditary", "council", "clan", "traditional"].includes(k)) choices.push({ label: "Defy them", hint: "Rule without their consent.", go: () => goAutocrat("losing the council's confidence") });
        return {
            tag: "LEGITIMACY CRISIS", title: `${who} Move Against You`,
            body: `<p>Your legitimacy has fallen to <b>${Math.round(G.legitimacy)}</b>. ${who} are preparing to replace you.</p>`,
            choices
        };
    },

    no_confidence: () => ({
        tag: "MOTION OF NO CONFIDENCE", title: "Parliament Turns",
        body: `<p>The legislature's trust in your government has collapsed (${Math.round(G.inst.legislature)}). A motion of no confidence is tabled.</p>`,
        choices: [
            { label: "Call a snap election", go: () => frontScene("campaign", { mode: "snap" }) },
            { label: "Win them back (−10 influence)", disabled: G.influence < 10, go: () => {
                applyEffects({ influence: -10 });
                if (chance(50)) report("Motion defeated", "Enough backbenchers return to the fold.", applyEffects({ i: { legislature: 20 } }));
                else { report("Motion carried", "The government falls."); rememberElectedSpec(); frontScene("outsider_path", { reason: "Your government lost a vote of no confidence." }); }
            } },
            { label: "Resign", go: () => { rememberElectedSpec(); frontScene("outsider_path", { reason: "You resigned rather than face the vote." }); } }
        ]
    }),

    chancellor_election: ctx => {
        const o = G.office;
        const cands = livingNpcs().filter(n => n.arena === "senate").sort((a, b) => b.influence - a.influence).slice(0, 3);
        if (ctx.incumbent) {
            const limited = o.termLimit > 0 && o.termsServed + 1 >= o.termLimit;
            return {
                tag: "GALACTIC SENATE", title: limited ? "Your Chancellorship Ends" : "The Chancellery Is Contested",
                body: limited ? `<p>The Republic's constitution limits the Chancellor to ${o.termLimit} terms.</p>` : `<p>Your term ends. The Senate will vote on whether you continue. Estimated support: <b>${pct(chancellorShare(true))}</b>.</p>`,
                choices: limited ? [
                    { label: "Step down as elder statesperson", go: () => { G.chancellorId = null; electNpcChancellor(null); endCareer("Served the full term limit as Supreme Chancellor."); } },
                    { label: "Refuse to step down", go: () => goAutocrat("the end of the Chancellor's term limit") }
                ] : [
                    { label: "Stand for re-election", go: () => {
                        const s = chancellorShare(true);
                        if (s > 50) { o.termsServed++; o.termLeft = o.termYears * 12; report("Chancellor re-elected", `The Senate returns you with ${pct(s)}.`, applyEffects({ influence: 6 })); }
                        else { G.chancellorId = null; electNpcChancellor(null); frontScene("outsider_path", { reason: "The Senate chose a new Chancellor." }); }
                    } },
                    { label: "Retire", go: () => { G.chancellorId = null; electNpcChancellor(null); endCareer("Retired from the Chancellery."); } }
                ]
            };
        }
        return {
            tag: "GALACTIC SENATE", title: "Election of the Supreme Chancellor",
            body: `<p>The Senate will choose the next Supreme Chancellor. The front-runners: ${cands.map(n => `<b>${esc(n.name)}</b> (${FACTIONS[n.faction].name}, ${worldName(n.world)})`).join(", ")}.</p>
                <p>If you stand, your estimated support is <b>${pct(chancellorShare(false))}</b>.</p>`,
            choices: [
                { label: "Stand for Chancellor", go: () => {
                    const s = chancellorShare(false);
                    if (s > 50) {
                        G.chancTermLeft = 48;
                        const old = chancellor();
                        if (old) old.title = `Senator of ${worldName(old.world)}`;
                        setOffice(makeOffice({ title: "Supreme Chancellor", kind: "chancellor", desc: "Head of the Galactic Republic.", fresh: true }));
                        report("SUPREME CHANCELLOR", `The Senate elects ${G.name} with ${pct(s)} of the vote.`, applyEffects({ influence: 25, rep: 5 }));
                    } else {
                        applyEffects({ influence: -6 });
                        electNpcChancellor(null);
                        report("Chancellor bid fails", `You win only ${pct(s)}. The ambition was noticed.`);
                    }
                } },
                ...cands.map(n => ({ label: `Endorse ${n.name}`, hint: `Relationship ${Math.round(n.rel)}.`, go: () => electNpcChancellor(n.id) })),
                { label: "Stay out of it", go: () => electNpcChancellor(null) }
            ]
        };
    },

    dismissed: () => ({
        tag: "THE CHANCELLERY", title: "Dismissed",
        body: `<p>The new Chancellor has no use for you. Your ministry is given to someone else.</p>`,
        choices: [
            { label: "Run for the Senate again", disabled: G.galaxy[G.worldKey].independent || !world().roles.some(r => r.kind === "senator"), go: () => {
                const r = world().roles.find(x => x.kind === "senator");
                setOffice(makeOffice({ title: `Candidate for ${r.title}`, kind: "candidate", target: { ...r }, months: 6 }));
                newOpponent(2);
            } },
            { label: "Take a position outside government", go: () => frontScene("outsider_path", { reason: "Dismissed from the ministry." }) }
        ]
    }),

    amendment_vote: ctx => {
        const stages = [{ name: "Legislature", share: ctx.legShare, need: ctx.legNeed, pass: ctx.legPass }];
        if (ctx.referendum) stages.push({ name: "Public referendum", share: ctx.pubShare, need: ctx.pubNeed, pass: ctx.pubPass });
        if (ctx.courtReview) stages.push({ name: "Judicial review", court: true, pass: ctx.courtPass });
        const shown = stages.slice(0, ctx.stage + 1);
        const failed = shown.some(s => !s.pass);
        const last = ctx.stage >= stages.length - 1 || failed;
        const body = `<p class="muted">Proposal:</p><h2>“${esc(ctx.title)}”</h2>
            ${shown.map(s => s.court
                ? `<div class="stage"><b>${s.name}</b><span class="${s.pass ? "c-for" : "c-against"}">${s.pass ? "UPHELD — the amendment is constitutional" : "STRUCK DOWN — the court rules it unconstitutional"}</span></div>`
                : `<div class="stage"><b>${s.name}</b>${bar(s.share, s.pass ? "good" : "bad")}<span class="${s.pass ? "c-for" : "c-against"}">${pct(s.share)} (needs ${pct(s.need)}) — ${s.pass ? "PASSED" : "FAILED"}</span></div>`).join("")}`;
        return {
            tag: "CONSTITUTIONAL AMENDMENT", title: "Can you convince society that this change is legitimate?", body,
            choices: [last
                ? { label: "Conclude", go: () => finishAmendment(ctx) }
                : { label: `Next: ${stages[ctx.stage + 1].name} →`, go: () => frontScene("amendment_vote", { ...ctx, stage: ctx.stage + 1 }) }]
        };
    },

    revolution: () => ({
        tag: "REVOLUTION", title: `${world().name} Rises`,
        body: `<p>The streets belong to the crowds now. Unrest has reached ${Math.round(G.unrest)}. Your security chief asks for orders.</p>`,
        choices: [
            { label: "Flee into exile", go: () => { G.autocrat = false; G.autocratFallen = true; log(`${G.name} flees ${world().name}.`, "career"); enterOutsider("Exile", 24); } },
            { label: "Crush the uprising", hint: `Depends on the military (trust ${Math.round(G.inst.military)}).`, go: () => {
                if (chance(G.inst.military * 0.6 + (G.const.militaryControl !== "Civilian" ? 15 : 0))) {
                    report("The uprising is crushed", "Order is restored. Nobody will forget how.", applyEffects({ unrest: -40, rep: -15, trust: -10, gal: { diplomacy: -6 } }));
                } else {
                    G.autocrat = false; G.autocratFallen = true;
                    report("Overthrown", "The soldiers lower their weapons. The crowd reaches the palace.");
                    enterOutsider("Prisoner", 48);
                }
            } },
            { label: "Negotiate a transition", hint: "Restore constitutional rule and leave.", go: () => {
                G.autocrat = false;
                applyEffects({ unrest: -35, rep: 12 });
                endCareer("Negotiated a peaceful transition back to constitutional rule.");
            } }
        ]
    }),

    death: ctx => ({
        tag: "IN MEMORIAM", title: G.name,
        body: `<p>${esc(ctx.reason)}</p><p class="muted">Offices held: ${G.officesHeld.map(esc).join(" → ") || "none"}.</p>`,
        choices: [{ label: "The story continues…", go: () => endCareer(ctx.reason) }]
    }),

    succession: ctx => ({
        tag: `GENERATION ${G.generation + 1}`, title: "Who Carries On?",
        body: `<p>${esc(ctx.reason)}</p><p>The galaxy your successor inherits has been shaped by everything that came before: the laws, the grudges, the programmes, the constitution.</p>`,
        choices: [
            ...ctx.cands.map(s => ({ label: `${s.name} — ${s.relation}`, hint: `Age ${s.age}.`, go: () => frontScene("successor_role", { s }) })),
            { label: "Let the story end here", go: () => frontScene("game_over", {}) }
        ]
    }),

    successor_role: ctx => ({
        tag: "A NEW CAREER", title: `${ctx.s.name}: Choose a Role`,
        body: `<p>Where on ${world().name} does ${esc(ctx.s.name)} begin?</p>`,
        choices: world().roles.map((r, i) => ({ r, i })).filter(({ r }) => !(r.kind === "senator" && G.galaxy[G.worldKey].independent)).map(({ r, i }) => ({ label: r.title, hint: r.desc, go: () => beginSuccessor(ctx.s, i) }))
    }),

    outsider_path: ctx => ({
        tag: "LIFE AFTER OFFICE", title: "What Now?",
        body: `<p>${esc(ctx.reason || "")}</p><p class="muted">Political careers are fluid. You can come back from almost anything.</p>`,
        choices: [
            ...OUTSIDER_PATHS.filter(p => !p.need || p.need()).map(p => ({ label: p.sub, hint: p.desc, go: () => enterOutsider(p.sub) })),
            { label: "Retire from public life", hint: "Pass the torch to the next generation.", go: () => endCareer(ctx.reason || "Retired from public life.") }
        ]
    }),

    game_over: () => {
        const d = G.dynasty;
        return {
            tag: "THE END", title: "A Political Dynasty",
            body: `<p>${d.length} generation${d.length > 1 ? "s" : ""}, ${G.year} years of history on ${world().name}.</p>
                <ol class="dynasty-list">${d.map(x => `<li><b>${esc(x.name)}</b> (Year ${x.from}–${x.end ?? G.year}) — ${x.offices.map(esc).join(" → ")}${x.legacy && x.legacy.length ? `<br><span class="muted">Legacy: ${x.legacy.map(esc).join("; ")}</span>` : ""}</li>`).join("")}</ol>`,
            choices: [{ label: "Return to the main menu", go: () => { clearSave(); quitToMenu(); } }]
        };
    }
};
