// Galactic Senate — Personal life
// ---------------------------------------------------------------------------
// The office takes everything; the family pays. Single politicians date and
// court; married ones have a bond that frays when the work comes first.
// Children grow up with their own temperaments, need their parents at the
// worst moments, and make the news. A monarch has a duty to marry, to provide
// an heir, and to make that heir fit to reign — without the family becoming
// the story.

const SUITOR_BG = [
    { k: "aide", text: "a senior Senate aide", fx: { influence: 3 } },
    { k: "journalist", text: "a HoloNet journalist", fx: { media: 4 }, risky: true },
    { k: "pilot", text: "a starship pilot", fx: {} },
    { k: "doctor", text: "a doctor at the capital medical centre", fx: { g: { elders: 2 } } },
    { k: "artist", text: "a painter with a gallery in the old quarter", fx: { g: { youth: 2 } } },
    { k: "executive", text: "a corporate executive", fx: { f: { corporatists: 3 } }, risky: true },
    { k: "activist", text: "a reform activist", fx: { f: { reformers: 3 } } },
    { k: "officer", text: "a fleet officer", fx: { f: { militarists: 3 } } },
    { k: "teacher", text: "a schoolteacher", fx: { g: { workers: 2 } } },
    { k: "diplomat", text: "a junior diplomat from another world", fx: { influence: 2 } }
];
const ROYAL_HOUSES = [
    { world: "alderaan", house: "House Organa" }, { world: "alderaan", house: "House Antilles" }, { world: "naboo", house: "House Naberrie" },
    { world: "mandalore", house: "House Kryze" }, { world: "onderon", house: "House Dendup" }, { world: "moncala", house: "House Kolina" },
    { world: "chandrila", house: "House Mothma" }, { world: "corellia", house: "House Thul" }, { world: "kuat", house: "House Kuat" },
    { world: "pantora", house: "House Chuchi" }, { world: "umbara", house: "House Vaal" }
];
const TEMPERS = {
    dutiful:   { name: "dutiful", duty: 15, scandal: 0.3 },
    bookish:   { name: "bookish", duty: 8, scandal: 0.4 },
    shy:       { name: "shy", duty: 4, scandal: 0.4 },
    charming:  { name: "charming", duty: 4, scandal: 1 },
    rebellious:{ name: "rebellious", duty: -10, scandal: 1.8 },
    wild:      { name: "wild", duty: -6, scandal: 2.2 }
};
const SCHOOLS = {
    tutors:  { name: "Private tutors at home", duty: 8, ready: 12, bond: 6, cost: 0.4 },
    public:  { name: "The local public school", duty: 2, ready: 6, bond: 4, cost: 0, pop: 4 },
    academy: { name: "A military academy", duty: 14, ready: 16, bond: -8, cost: 0.3 },
    offworld:{ name: "An elite offworld academy", duty: 6, ready: 18, bond: -10, cost: 0.8 }
};

const isRoyal = () => G.office.kind === "hereditary" || (G.office.kind === "monarch" && G.const.monarchy !== "elective");
const firstName = () => (randomName(G.worldKey) || pick(FIRST_NAMES)).split(" ")[0];

function fam() {
    const f = G.family;
    if (!f.upgraded) {
        if (f.spouse) Object.assign(f.spouse, { bond: f.spouse.bond ?? ri(50, 78), bg: f.spouse.bg || pick(SUITOR_BG).text, years: f.spouse.years ?? ri(2, 15) });
        f.children.forEach(c => upgradeChild(c));
        Object.assign(f, { suitors: [], partner: null, court: 0, rp: 60, log: [], lastEv: -9, recent: [], trying: false, heir: null, upgraded: true });
    }
    return f;
}
function upgradeChild(c) {
    if (c.upg) return c;
    c.upg = true;
    c.temper = c.temper || pick(Object.keys(TEMPERS));
    c.duty = clamp(40 + TEMPERS[c.temper].duty + ri(-10, 10));
    c.bond = c.bond ?? ri(50, 80);
    c.scandal = c.scandal || 0;
    c.edu = c.edu || (c.age >= 10 ? pick(Object.keys(SCHOOLS)) : null);
    c.path = c.path || null;
    return c;
}
const living = () => fam().children.filter(c => c.alive);
function famLog(text) { fam().log.unshift({ text, date: eraYear(currentBBY()) }); fam().log = fam().log.slice(0, 20); }

function heirReady(c) {
    const e = c.edu ? SCHOOLS[c.edu].ready : 0;
    const p = { court: 18, military: 12, politics: 10, own: -8 }[c.path] || 0;
    return Math.round(clamp(c.duty * 0.6 + e + p + Math.min(c.age, 25) * 0.6 - c.scandal * 8));
}
function heir() {
    const f = fam(), kids = living();
    return kids.find(c => c.name === f.heir) || kids.slice().sort((a, b) => b.age - a.age)[0] || null;
}

// ── Actions ───────────────────────────────────────────────────────

function newSuitor(royalMatch) {
    if (royalMatch) {
        const h = pick(ROYAL_HOUSES.filter(x => x.world !== G.worldKey));
        return { name: `${firstName()} of ${h.house}`, bg: `an heir of ${h.house} of ${worldName(h.world)}`, world: h.world, chem: ri(15, 70), match: true };
    }
    const b = pick(SUITOR_BG);
    return { name: randomName(G.worldKey), bg: b.text, bgk: b.k, chem: ri(20, 95), match: false };
}

function personalAction(t, k) {
    const f = fam();
    const costs = { meet: 2, matches: 2, ask: 2, date: 2, propose: 3, breakup: 1, time: 2, holiday: 4, child: 1, train: 2, heir: 1, trying: 1, stopping: 0 };
    if (t === "propose" && (!f.partner || f.partner.love < (f.partner.match ? 35 : 60))) return toast("Not yet", "You don't know each other well enough. Spend more time together.");
    if (t === "holiday" && G.funds < 0.5) return toast("Not enough funds", "A holiday costs 0.5M credits.");
    if (t === "date" && G.funds < 0.1) return toast("Not enough funds", "Even a quiet dinner costs something.");
    if (!spendAP(costs[t] ?? 1)) return;
    let ch = [];
    switch (t) {
        case "meet": {
            const s = newSuitor(false);
            f.suitors = [s, ...f.suitors].slice(0, 3);
            report("💫 Someone interesting", `At a reception you end up talking for an hour with ${s.name}, ${s.bg}.`);
            break;
        }
        case "matches": {
            f.suitors = [newSuitor(true), newSuitor(true), newSuitor(true)];
            report("👑 The court's list", "Your private secretary presents three suitable matches — good families, useful alliances, nothing in their past that the HoloNet could find.");
            break;
        }
        case "ask": {
            const s = f.suitors[+k];
            if (!s) return;
            if (chance(35 + s.chem * 0.6 + G.rep * 0.1)) {
                f.partner = { name: s.name, bg: s.bg, world: s.world || null, bgk: s.bgk || null, love: 20 + Math.round(s.chem / 3), match: s.match, months: 0 };
                f.suitors = f.suitors.filter(x => x !== s);
                report("💞 A yes", `${s.name} says yes. Dinner, somewhere your security detail can watch the doors.`);
            } else { f.suitors = f.suitors.filter(x => x !== s); report("A polite no", `${s.name} is flattered — and not interested in a life lived in public.`); }
            break;
        }
        case "date": {
            const p = f.partner;
            p.love = clamp(p.love + ri(8, 16));
            ch = applyEffects({ funds: -0.1, health: 2 });
            report("💞 An evening off", pick([`Dinner with ${p.name} at a place with no windows facing the street.`, `A walk with ${p.name} along the water. Nobody recognises you. For once.`, `${p.name} makes you laugh about something you'd forgotten was funny.`]), ch);
            if (chance(25)) pushScene("p_date_photo", {});
            break;
        }
        case "propose": {
            const p = f.partner;
            if (chance(40 + p.love * 0.6)) frontScene("p_wedding", {});
            else { p.love = clamp(p.love - 15); report("Not yet", `${p.name} says they need more time. “Your life is a lot to marry into.”`); }
            break;
        }
        case "breakup": famLog(`Parted with ${f.partner.name}`); report("It's over", `You and ${f.partner.name} part — quietly, you hope.`); f.partner = null; break;
        case "time": {
            if (f.spouse) f.spouse.bond = clamp(f.spouse.bond + 12);
            living().forEach(c => { c.bond = clamp(c.bond + 8); });
            ch = applyEffects({ health: 3 });
            report("🏠 Home for dinner", pick(["You switch off your comlink for an evening. The galaxy survives.", "A game night. You lose badly, and everyone enjoys it.", "You cook. It's terrible. Nobody minds."]), ch);
            break;
        }
        case "holiday": {
            if (f.spouse) f.spouse.bond = clamp(f.spouse.bond + 22);
            living().forEach(c => { c.bond = clamp(c.bond + 14); });
            const crisis = G.siege || G.occupied || G.unrest > 60 || G.situations && G.situations.length > 2;
            ch = applyEffects({ funds: -0.5, health: 8, ...(crisis ? { heat: 10, trust: -4 } : {}) });
            report("🏖️ A family holiday", crisis ? "Two weeks on the coast of a quiet world — while things at home are bad. The HoloNet runs pictures of you on the beach next to pictures of the crisis." : "Two weeks on the coast of a quiet world. You remember who your family are.", ch);
            break;
        }
        case "child": { const c = living().find(x => x.name === k); if (!c) return; c.bond = clamp(c.bond + 12); c.duty = clamp(c.duty + 2); report("Time together", `${pick(["A long walk", "An afternoon at the speeder races", "Homework at the kitchen table", "A visit to the old family home"])} with ${c.name}.`); break; }
        case "train": { const c = living().find(x => x.name === k); if (!c) return; c.duty = clamp(c.duty + 8); c.bond = clamp(c.bond - 2); report("Lessons in duty", `${c.name} sits beside you through a day of audiences, briefings and ribbon-cuttings. ${c.temper === "rebellious" ? "They make it very clear they'd rather be anywhere else." : "They watch everything."}`); break; }
        case "heir": { const c = living().find(x => x.name === k); if (!c) return; const eldest = living().slice().sort((a, b) => b.age - a.age)[0]; f.heir = c.name; if (eldest && eldest !== c) { ch = applyEffects({ g: { traditional: -4, elders: -2 }, f: { traditionalists: -3 } }); eldest.bond = clamp(eldest.bond - 20); } report("👑 The succession", `${c.name} is named heir to the throne.${eldest && eldest !== c ? ` ${eldest.name}, the eldest, is passed over — and everyone knows it.` : ""}`, ch); break; }
        case "trying": f.trying = true; report("A family", "You and your spouse decide it's time."); break;
        case "stopping": f.trying = false; break;
    }
    render();
}

// ── The month ─────────────────────────────────────────────────────

function tickPersonal() {
    const f = fam();
    const busy = G.siege || G.occupied || G.revolt || G.war ? 1 : 0;
    if (f.spouse && f.spouse.alive !== false) {
        f.spouse.bond = clamp(f.spouse.bond - 0.35 - busy * 0.3);
        if (f.spouse.bond >= 70) G.health = Math.min(100, G.health + 0.15);
        if (f.spouse.bond < 25) G.health = Math.max(0, G.health - 0.2);
    }
    if (f.partner) { f.partner.months++; f.partner.love = clamp(f.partner.love - 1.5); if (f.partner.love <= 0) { report("Drifted apart", `You haven't seen ${f.partner.name} in months. They've stopped waiting.`); famLog(`Drifted apart from ${f.partner.name}`); f.partner = null; } }
    living().forEach(c => { upgradeChild(c); c.bond = clamp(c.bond - 0.15 - busy * 0.1); });
    f.rp = clamp(f.rp + (60 - f.rp) * 0.02);
    if (isRoyal()) {
        if (!f.spouse && G.age >= 24) f.court = clamp(f.court + 1);
        else f.court = Math.max(0, f.court - 2);
        if (f.court > 40) G.legitimacy = clamp(G.legitimacy - 0.15);
        if (!living().length && G.age >= 40) G.legitimacy = clamp(G.legitimacy - 0.1);
        G.legitimacy = clamp(G.legitimacy + (f.rp - 50) * 0.01);
    }
    // Births.
    if (G.month === 1 && f.spouse && f.spouse.alive !== false && G.age <= 55 && living().length < 6) {
        const p = (f.trying ? 40 : 12) + (isRoyal() && !living().length ? 15 : 0);
        if (chance(p)) pushScene("p_birth", {});
    }
    if (G.scenes.length) return;
    // Milestones.
    const school = living().find(c => !c.edu && c.age >= 6);
    if (school) { pushScene("p_school", { name: school.name }); return; }
    const grown = living().find(c => !c.path && c.age >= 18);
    if (grown) { pushScene("p_path", { name: grown.name }); return; }
    if (isRoyal() && !f.spouse && !f.partner && f.court >= 30 && monthsNow() - f.lastEv > 10 && chance(20)) { f.lastEv = monthsNow(); pushScene("p_duty_marry", {}); return; }
    // Life happens.
    if (monthsNow() - f.lastEv < 3 || !chance(22)) return;
    const pool = Object.entries(P_EVENTS).filter(([k, e]) => e.when() && !f.recent.includes(k));
    if (!pool.length) return;
    const key = pick(pool.flatMap(([k, e]) => Array(e.w).fill(k)));
    f.lastEv = monthsNow();
    f.recent = [key, ...f.recent].slice(0, 5);
    pushScene(key, {});
}

const kidAged = (a, b) => living().filter(c => c.age >= a && c.age <= b);
const P_EVENTS = {
    p_missed:      { w: 3, when: () => kidAged(4, 17).length > 0 },
    p_sick:        { w: 1, when: () => kidAged(0, 12).length > 0 },
    p_anniversary: { w: 2, when: () => !!fam().spouse },
    p_spouse_career:{ w: 1, when: () => !!fam().spouse },
    p_strain:      { w: 3, when: () => fam().spouse && fam().spouse.bond < 35 },
    p_separation:  { w: 4, when: () => fam().spouse && fam().spouse.bond < 15 },
    p_tabloid:     { w: 3, when: () => kidAged(14, 28).some(c => TEMPERS[c.temper].scandal >= 1) },
    p_child_love:  { w: 2, when: () => kidAged(19, 32).some(c => !c.married) },
    p_royal_tour:  { w: 2, when: () => isRoyal() },
    p_family_photo:{ w: 2, when: () => !!fam().spouse || living().length > 0 },
    p_spouse_news: { w: 1, when: () => !!fam().spouse },
    p_abdicate:    { w: 2, when: () => isRoyal() && G.age >= 62 && heir() && heirReady(heir()) >= 55 && heir().age >= 21 },
    p_partner_family:{ w: 2, when: () => !!fam().partner },
    p_disobey:     { w: 4, when: () => kidAged(6, 19).length > 0 },
    p_underage:    { w: 3, when: () => kidAged(14, 17).some(c => TEMPERS[c.temper].scandal >= 0.4) },
    p_pregnancy:   { w: 2, when: () => kidAged(16, 26).some(c => TEMPERS[c.temper].scandal >= 1) },
    p_spare:       { w: 2, when: () => isRoyal() && living().filter(c => c.age >= 12).length >= 2 },
    p_reluctant:   { w: 2, when: () => isRoyal() && heir() && heir().age >= 16 && heir().duty < 45 },
    p_runaway:     { w: 1, when: () => kidAged(15, 19).some(c => c.bond < 35) },
    p_bad_company: { w: 2, when: () => kidAged(16, 30).some(c => TEMPERS[c.temper].scandal >= 1) }
};

// How a child takes being talked to, punished or indulged depends on who they are.
const PARENTING = {
    talk:    { dutiful: [8, 10], bookish: [6, 8], shy: [8, 6], charming: [4, 4], rebellious: [2, -2], wild: [0, -4] },
    punish:  { dutiful: [-4, 6], bookish: [-8, 4], shy: [-12, 2], charming: [-6, 4], rebellious: [-18, -6], wild: [-14, 2] },
    indulge: { dutiful: [6, -4], bookish: [8, -2], shy: [6, 0], charming: [10, -8], rebellious: [10, -10], wild: [8, -12] }
};
function parent(c, how) {
    const [b, d] = PARENTING[how][c.temper];
    c.bond = clamp(c.bond + b); c.duty = clamp(c.duty + d);
    return b >= 6 ? "It lands." : b <= -10 ? "It goes badly. A door slams somewhere upstairs." : d < -6 ? "They're delighted. You suspect you've taught them the wrong lesson." : "Hard to tell if it made any difference.";
}
const kidPick = (a, b, filter = () => true) => { const l = kidAged(a, b).filter(filter); return l.length ? pick(l).name : null; };

// ── Scenes ────────────────────────────────────────────────────────

const royalNews = n => isRoyal() ? n : n * 0.5;
const NONE = { title: "—", body: "", choices: [{ label: "Continue", go: () => {} }] };
Object.assign(SCENES, {
    p_date_photo: () => ({ tag: "THE HOLONET", title: "Caught on camera",
        body: `<p>A photographer catches you and ${esc(fam().partner ? fam().partner.name : "your date")} leaving a restaurant. By morning every gossip channel has the picture.</p>`,
        choices: [
            { label: "Go public — yes, we're together", go: () => { const p = fam().partner; if (p) p.love = clamp(p.love + 10); applyEffects({ g: { youth: 3 }, heat: royalNews(4) }); } },
            { label: "“No comment.”", go: () => { const p = fam().partner; if (p) p.love = clamp(p.love - 6); } }
        ] }),
    p_partner_family: () => {
        const p = fam().partner;
        if (!p) return NONE;
        return { tag: "PERSONAL", title: `${p.name}'s family`,
            body: `<p>Dinner with ${esc(p.name)}'s family. Their mother has read every bad story ever written about you, and quotes them.</p>`,
            choices: [
                { label: "Charm them", go: () => { if (chance(55)) { p.love = clamp(p.love + 10); report("Won over", "By dessert, their mother is telling you a story about her own political career."); } else { p.love = clamp(p.love - 8); report("A long evening", "It doesn't go well. The drive home is quiet."); } } },
                { label: "Hold your ground", go: () => { p.love = clamp(p.love + 3); } }
            ] };
    },
    p_wedding: () => {
        const p = fam().partner;
        if (!p) return NONE;
        const royal = isRoyal();
        const marry = (style) => () => {
            const f = fam();
            f.spouse = { name: p.name, alive: true, bond: clamp(p.love + 15), bg: p.bg, years: 0, world: p.world };
            f.partner = null; f.suitors = []; f.court = 0;
            famLog(`Married ${p.name}${style === "state" ? " in a state wedding" : style === "private" ? " in a private ceremony" : ""}`);
            G.record.agreements.push(`Married ${p.name} (${eraYear(currentBBY())})`);
            if (p.world) { const leader = livingNpcs().find(n => n.world === p.world && n.arena !== "senate") || livingNpcs().find(n => n.world === p.world); if (leader) changeRel(leader, 15, `Their house is joined to ${G.name}'s by marriage.`); G.influence = clamp(G.influence + 8); }
            if (style === "state") { f.rp = clamp(f.rp + 15); report("💍 A state wedding", `The whole of ${world().name} watches. Bells, banners, a flypast, and ${p.name} in the old cathedral. For a day, nobody talks about anything else.`, applyEffects({ treasury: governing() ? -1 : 0, funds: governing() ? 0 : -1, legitimacy: 10, trust: 5, g: { traditional: 6, religious: 5, elders: 4 } })); }
            else if (style === "private") report("💍 Married", `A small ceremony with the people who matter. ${p.name} is your spouse.`, applyEffects({ g: { youth: 2 }, health: 4 }));
            else report("💍 Eloped", `You and ${p.name} slip away and marry on a world nobody's heard of. ${royal ? "The court is apoplectic." : "Your press office is not amused."}`, applyEffects({ heat: royal ? 12 : 5, g: { youth: 4, traditional: royal ? -8 : -2 } }));
        };
        return { tag: "💍 A PROPOSAL", title: `${p.name} says yes`,
            body: `<p>${esc(p.name)}, ${esc(p.bg)}, says yes.${royal ? " The court begins planning before you've finished the sentence." : ""}</p>`,
            choices: [
                ...(royal || G.rep > 50 ? [{ label: "👑 A state wedding", hint: "1B (or 1M of your own). The whole world watches.", go: marry("state") }] : []),
                { label: "A private ceremony", go: marry("private") },
                { label: "Elope", hint: royal ? "The court will never forgive it." : "Romantic. Not great press.", go: marry("elope") }
            ] };
    },
    p_birth: ctx => {
        if (!ctx.name) { let n = firstName(), tries = 0; while (fam().children.some(c => c.name === n) && tries++ < 10) n = firstName(); ctx.name = n; ctx.temper = pick(Object.keys(TEMPERS)); }
        const f = fam();
        return { tag: "A NEW LIFE", title: `${ctx.name} is born`,
            body: `<p>${esc(f.spouse ? f.spouse.name : "Your spouse")} gives birth to a healthy child: <b>${esc(ctx.name)}</b>.${isRoyal() ? ` The bells ring across ${esc(world().name)}. ${living().length ? "Another in the line of succession." : "An heir to the throne."}` : ""}</p>`,
            choices: [
                { label: "Take a month off with the baby", hint: "Capital this month falls; your family won't forget it.", go: () => addChild(ctx, 20, () => { G.ap = Math.max(0, G.ap - 6); if (f.spouse) f.spouse.bond = clamp(f.spouse.bond + 15); }) },
                { label: "Back to work the next morning", hint: "The galaxy doesn't stop.", go: () => addChild(ctx, 0, () => { if (f.spouse) f.spouse.bond = clamp(f.spouse.bond - 10); }) }
            ] };
    },
    p_school: ctx => {
        const c = living().find(x => x.name === ctx.name);
        if (!c) return { title: "—", body: "", choices: [{ label: "Continue", go: () => {} }] };
        return { tag: "PARENTHOOD", title: `${c.name}'s schooling`,
            body: `<p>${esc(c.name)} is ${c.age} and ${TEMPERS[c.temper].name}. Where do they go to school?${isRoyal() ? " The court has opinions. So does the press." : ""}</p>`,
            choices: Object.entries(SCHOOLS).map(([k, s]) => ({ label: s.name, hint: `${s.cost ? `${s.cost}M a year · ` : ""}${s.bond < 0 ? "They'll be away from home." : "They stay close."}${isRoyal() ? ` Fitness to reign ${s.ready >= 15 ? "↑↑" : "↑"}.` : ""}`,
                go: () => { c.edu = k; c.duty = clamp(c.duty + s.duty); c.bond = clamp(c.bond + s.bond); if (s.cost) G.funds = Math.max(0, G.funds - s.cost); if (s.pop) { fam().rp = clamp(fam().rp + s.pop); applyEffects({ g: { workers: 3, youth: 2 } }); } } })) };
    },
    p_path: ctx => {
        const c = living().find(x => x.name === ctx.name);
        if (!c) return { title: "—", body: "", choices: [{ label: "Continue", go: () => {} }] };
        const set = (p, fx, msg) => () => { c.path = p; if (fx) fx(); report(`${c.name} chooses a path`, msg); };
        return { tag: "PARENTHOOD", title: `${c.name} comes of age`,
            body: `<p>${esc(c.name)} is eighteen — ${TEMPERS[c.temper].name}, ${c.bond >= 60 ? "close to you" : c.bond >= 35 ? "a little distant" : "barely speaking to you"}. What comes next?</p>`,
            choices: [
                ...(isRoyal() ? [{ label: "👑 Royal duties at court", hint: "The surest preparation for the throne.", go: set("court", () => { c.duty = clamp(c.duty + 8); }, `${c.name} takes up royal duties: patronages, state visits, the long apprenticeship of a future monarch.`) }] : []),
                { label: "🏛️ Into politics", go: set("politics", () => { c.inPolitics = true; }, `${c.name} goes to work in politics. Your rivals start a file on them the same week.`) },
                { label: "🎖️ Military service", go: set("military", () => { c.duty = clamp(c.duty + 6); applyEffects({ g: { military: 3, veterans: 2 } }); }, `${c.name} enlists. ${G.war ? "There's a war on. You don't sleep well." : "You're proud, and worried."}`) },
                { label: "Let them choose their own life", go: set("own", () => { c.bond = clamp(c.bond + 15); }, `${c.name} goes their own way — art, medicine, the stars. ${isRoyal() ? "The court calls it a dereliction of duty." : "You've never seen them happier."}`) }
            ] };
    },
    p_missed: ctx => {
        if (!ctx.name) { ctx.name = pick(kidAged(4, 17)).name; ctx.what = pick(["school recital", "graduation", "first podrace", "birthday party", "championship final", "award ceremony"]); ctx.clash = pick(["an emergency session", "a summit with a sector governor", "a crisis briefing", "a vote you can't afford to lose"]); }
        const c = living().find(x => x.name === ctx.name);
        return { tag: "THE SACRIFICE", title: `${ctx.name}'s ${ctx.what}`,
            body: `<p>It's tonight. So is ${esc(ctx.clash)}. ${esc(ctx.name)} asked you three times if you'd be there. You said yes three times.</p>`,
            choices: [
                { label: `Go to the ${ctx.what}`, hint: "Your staff will cover. Probably.", go: () => { if (c) c.bond = clamp(c.bond + 15); const s = fam().spouse; if (s) s.bond = clamp(s.bond + 5); applyEffects({ influence: -4 }); report("You were there", `${ctx.name} spots you in the crowd and grins the whole way through.`); } },
                { label: "Send a hologram message", go: () => { if (c) c.bond = clamp(c.bond - 6); } },
                { label: `Go to ${ctx.clash}`, hint: "The job comes first.", go: () => { if (c) c.bond = clamp(c.bond - 15); const s = fam().spouse; if (s) s.bond = clamp(s.bond - 6); applyEffects({ influence: 3 }); report("You missed it", `${ctx.name} doesn't mention it at breakfast. That's worse.`); } }
            ] };
    },
    p_sick: ctx => {
        if (!ctx.name) ctx.name = pick(kidAged(0, 12)).name;
        const c = living().find(x => x.name === ctx.name);
        return { tag: "PERSONAL", title: `${ctx.name} is ill`,
            body: `<p>${esc(ctx.name)} has a fever the medical droids don't like. The doctors say it's probably nothing. Probably.</p>`,
            choices: [
                { label: "Cancel everything and stay at the bedside", hint: "Lose most of this month's capital.", go: () => { G.ap = Math.max(0, G.ap - 8); if (c) c.bond = clamp(c.bond + 20); const s = fam().spouse; if (s) s.bond = clamp(s.bond + 10); report("A long week", `${ctx.name} recovers. They'll remember who was there.`); } },
                { label: "Keep working; check in every hour", go: () => { if (c) c.bond = clamp(c.bond - 8); report("Recovered", `${ctx.name} recovers. You were on a comm call when the fever broke.`); } }
            ] };
    },
    p_anniversary: () => {
        const s = fam().spouse;
        if (!s) return NONE;
        return { tag: "PERSONAL", title: "Your anniversary",
            body: `<p>${s.years >= 1 ? `${s.years} years with ${esc(s.name)}.` : `Your first anniversary with ${esc(s.name)}.`} Your schedule has you in budget meetings until midnight.</p>`,
            choices: [
                { label: "Clear the evening", hint: "0.3M — somewhere special.", go: () => { s.bond = clamp(s.bond + 12); applyEffects({ funds: -0.3, health: 2 }); } },
                { label: "Flowers, and a promise to make it up to them", go: () => { s.bond = clamp(s.bond - 3); } },
                { label: "Work through it", go: () => { s.bond = clamp(s.bond - 12); report("Forgotten", `${s.name} waited up. You didn't call.`); } }
            ] };
    },
    p_spouse_career: () => {
        const s = fam().spouse;
        if (!s) return NONE;
        if (!s.offer) s.offer = pick(["a seat on a medical research board", "an ambassadorship", "a professorship offworld", "a role running a foundation", "a command posting"]);
        return { tag: "PERSONAL", title: `${s.name}'s own ambitions`,
            body: `<p>${esc(s.name)} has been offered ${esc(s.offer)}. It would mean long stretches apart — and a spouse with their own life, their own opinions, and their own press.</p>`,
            choices: [
                { label: "Support them completely", go: () => { s.bond = clamp(s.bond + 15); s.offer = null; applyEffects({ g: { youth: 2 } }); } },
                { label: "Ask them to put it off — for now", go: () => { s.bond = clamp(s.bond - 15); s.offer = null; report("Put off", `${s.name} says yes. They don't say it happily.`); } }
            ] };
    },
    p_strain: () => {
        const s = fam().spouse;
        if (!s) return NONE;
        return { tag: "PERSONAL", title: "“We never see you”",
            body: `<p>${esc(s.name)} is waiting up. <i>“The children ask where you are. I've stopped knowing what to tell them. Is this the life we agreed to?”</i></p>`,
            choices: [
                { label: "Step back from work for a while", hint: "Less capital this month; family first.", go: () => { G.ap = Math.max(0, G.ap - 6); s.bond = clamp(s.bond + 22); living().forEach(c => { c.bond = clamp(c.bond + 6); }); } },
                { label: "Promise things will change", go: () => { s.bond = clamp(s.bond + 6); } },
                { label: "“This work matters more than either of us.”", go: () => { s.bond = clamp(s.bond - 15); applyEffects({ consistency: 2 }); } }
            ] };
    },
    p_separation: () => {
        const s = fam().spouse;
        if (!s) return NONE;
        const end = (pub) => () => {
            const f = fam();
            famLog(`${pub ? "Divorced" : "Separated from"} ${s.name}`);
            f.spouse = null;
            living().forEach(c => { c.bond = clamp(c.bond - 10); });
            applyEffects(pub ? { heat: royalNews(18), trust: -4, g: { religious: -5, traditional: -5, elders: -3 } } : { heat: royalNews(6) });
            if (isRoyal()) f.rp = clamp(f.rp - (pub ? 15 : 6));
            report(pub ? "A public divorce" : "A quiet separation", pub ? `The divorce fills every channel for a month. ${isRoyal() ? "The palace has not seen anything like it in a century." : ""}` : `${s.name} moves out. The press office says as little as possible.`);
        };
        return { tag: "PERSONAL", title: "The end of a marriage?",
            body: `<p>${esc(s.name)} has found an apartment. <i>“I'm not angry anymore. That's how I know it's over.”</i></p>`,
            choices: [
                { label: "Fight for the marriage", hint: "Counselling, time, real change.", go: () => { if (chance(45)) { s.bond = 45; G.ap = Math.max(0, G.ap - 5); report("Another chance", `${s.name} stays. It'll take work.`); } else end(false)(); } },
                { label: "Separate quietly", go: end(false) },
                { label: "Divorce", go: end(true) }
            ] };
    },
    p_tabloid: ctx => {
        if (!ctx.name) { const c = pick(kidAged(14, 28).filter(c => TEMPERS[c.temper].scandal >= 1)); ctx.name = c.name; ctx.what = pick(["photographed at a Canto Bight casino at four in the morning", "filmed at an anti-government protest", "seen with a known spice smuggler", "in a speeder crash — nobody hurt, the speeder wasn't theirs", "quoted mocking the Senate at a party"]); }
        const c = living().find(x => x.name === ctx.name);
        return { tag: "THE HOLONET", title: `${ctx.name} makes the news`,
            body: `<p>Your ${c && c.age < 18 ? "teenage child" : "child"}, ${esc(ctx.name)}, was ${esc(ctx.what)}. ${isRoyal() ? "The palace press office is besieged." : "Your press office wants a line by noon."}</p>`,
            choices: [
                { label: "Discipline them, privately and firmly", go: () => { if (c) { c.duty = clamp(c.duty + 10); c.bond = clamp(c.bond - 12); } applyEffects({ heat: royalNews(3) }); } },
                { label: "Defend them in public", go: () => { if (c) { c.bond = clamp(c.bond + 12); c.scandal++; } applyEffects({ heat: royalNews(10), g: { youth: 2, traditional: -3 } }); if (isRoyal()) fam().rp = clamp(fam().rp - 5); } },
                { label: "Say nothing and let it blow over", go: () => { if (c) c.scandal++; applyEffects({ heat: royalNews(6) }); if (isRoyal()) fam().rp = clamp(fam().rp - 3); } }
            ] };
    },
    p_child_love: ctx => {
        if (!ctx.name) { ctx.name = pick(kidAged(19, 32).filter(c => !c.married)).name; ctx.who = randomName(G.worldKey); ctx.what = pick(["a divorced fleet officer twice their age", "a commoner from the lower districts", "an offworlder of a species half the court despises", "a journalist", "a Separatist sympathiser's child", "a former bodyguard"]); }
        const c = living().find(x => x.name === ctx.name);
        const royal = isRoyal(), isHeir = royal && heir() === c;
        return { tag: isHeir ? "THE CROWN" : "PARENTHOOD", title: `${ctx.name} wants to marry`,
            body: `<p>${esc(ctx.name)} wants to marry ${esc(ctx.who)} — ${esc(ctx.what)}.${royal ? ` The court says it is impossible.${isHeir ? " A future monarch cannot marry for love alone." : ""}` : ""}</p>`,
            choices: [
                { label: "Give your blessing", go: () => { if (c) { c.bond = clamp(c.bond + 18); c.married = true; } applyEffects(royal ? { g: { youth: 4, traditional: -6, elders: -3 }, f: { traditionalists: -3 } } : { g: { youth: 2 } }); if (royal) fam().rp = clamp(fam().rp + (chance(50) ? 6 : -6)); famLog(`${ctx.name} married ${ctx.who}`); } },
                { label: "Forbid it", hint: royal ? "Duty first. They may never forgive you." : "", go: () => { if (c) { c.bond = clamp(c.bond - 25); c.duty = clamp(c.duty + 5); if (TEMPERS[c.temper].scandal >= 1.5 && chance(50)) { c.married = true; c.scandal++; applyEffects({ heat: royalNews(14) }); report("Eloped", `${ctx.name} elopes with ${ctx.who}. It's on every channel.`); } } } },
                { label: "Ask them to wait a year", go: () => { if (c) c.bond = clamp(c.bond - 5); } }
            ] };
    },
    p_royal_tour: () => ({ tag: "THE CROWN", title: "The royal tour",
        body: `<p>The palace proposes a six-month tour of the outer territories: parades, hospitals, factory floors, a hundred speeches. It would be good for the Crown. It would mean six months away from your family.</p>`,
        choices: [
            { label: "Go alone", hint: "Duty first.", go: () => { const s = fam().spouse; if (s) s.bond = clamp(s.bond - 15); living().forEach(c => { c.bond = clamp(c.bond - 10); }); fam().rp = clamp(fam().rp + 8); applyEffects({ legitimacy: 8, g: { rural: 5, elders: 3 } }); } },
            { label: "Take the family", hint: "0.5M. Good pictures — if the children behave.", go: () => { applyEffects({ funds: -0.5, legitimacy: 5 }); fam().rp = clamp(fam().rp + 5); living().forEach(c => { if (TEMPERS[c.temper].scandal >= 1.5 && chance(40)) { c.scandal++; applyEffects({ heat: 6 }); report("A royal embarrassment", `${c.name} is photographed being rude to a provincial governor.`); } }); } },
            { label: "Decline", go: () => { fam().rp = clamp(fam().rp - 4); applyEffects({ legitimacy: -3 }); } }
        ] }),
    p_family_photo: () => ({ tag: "PERSONAL", title: "The family portrait",
        body: `<p>Your press office wants a family portrait for the HoloNet${isRoyal() ? " — the official royal portrait" : ""}. ${living().some(c => c.bond < 35) ? "Not everyone in the family wants to be in it." : "Everyone's willing, more or less."}</p>`,
        choices: [
            { label: "Do it", go: () => { const sour = living().filter(c => c.bond < 35).length; applyEffects({ g: { elders: 3, religious: 2, traditional: 2 }, ...(sour ? { heat: 3 } : {}) }); if (isRoyal()) fam().rp = clamp(fam().rp + (sour ? -2 : 5)); if (sour) report("Spot the frown", "Every channel notices one of your children isn't smiling."); } },
            { label: "Keep the family out of it", go: () => { living().forEach(c => { c.bond = clamp(c.bond + 3); }); } }
        ] }),
    p_spouse_news: () => {
        const s = fam().spouse;
        if (!s) return NONE;
        if (!s.story) s.story = pick(["an investment in a company that just won a government contract", "an unflattering comment about a senator at a dinner party", "a friendship with a disgraced banker", "a charity that spends most of its money on galas"]);
        return { tag: "THE HOLONET", title: `Your spouse in the news`,
            body: `<p>A HoloNet exposé on ${esc(s.name)}: ${esc(s.story)}.</p>`,
            choices: [
                { label: "Stand by them", go: () => { s.bond = clamp(s.bond + 10); s.story = null; applyEffects({ heat: royalNews(8) }); } },
                { label: "Ask them to step out of public life", go: () => { s.bond = clamp(s.bond - 15); s.story = null; applyEffects({ heat: -4 }); } }
            ] };
    },
    p_abdicate: () => {
        const h = heir();
        if (!h) return NONE;
        return { tag: "THE CROWN", title: "The question nobody asks aloud",
            body: `<p>You are ${G.age}. ${esc(h.name)} is ${h.age}, ready (fitness ${heirReady(h)}), and waiting. The court whispers about abdication. Some monarchs reign until they die; some know when to go.</p>`,
            choices: [
                { label: `Abdicate in favour of ${h.name}`, go: () => { G.record.agreements.push(`Abdicated in favour of ${h.name} (${eraYear(currentBBY())})`); endCareer(`Abdicated in favour of ${h.name}.`); } },
                { label: "Give them more responsibility", go: () => { h.duty = clamp(h.duty + 8); h.bond = clamp(h.bond + 8); } },
                { label: "“I will reign until I die.”", go: () => { applyEffects({ legitimacy: -3 }); h.bond = clamp(h.bond - 8); } }
            ] };
    },
    p_disobey: ctx => {
        if (!ctx.name) { ctx.name = kidPick(6, 19); ctx.what = pick(["refuses to attend a public engagement in your name", "has been skipping school for weeks", "sneaked out past your security detail at night", "told a reporter what they really think of your politics", "won't speak to your spouse", "was sent home from school for fighting"]); }
        const c = living().find(x => x.name === ctx.name);
        if (!c) return { title: "—", body: "", choices: [{ label: "Continue", go: () => {} }] };
        const go = how => () => report(`${c.name}`, parent(c, how));
        return { tag: "PARENTHOOD", title: `${c.name} won't listen`,
            body: `<p>${esc(c.name)} (${c.age}, ${TEMPERS[c.temper].name}) ${esc(ctx.what)}.${isRoyal() ? " The household staff are already talking." : ""}</p><p class="small muted">Every child is different. What works on one makes another worse.</p>`,
            choices: [
                { label: "Sit down and really talk", hint: "Patient. Works best on thoughtful children.", go: go("talk") },
                { label: "Lay down the law", hint: "Grounded, privileges gone. Some children push back hard.", go: go("punish") },
                { label: "Let it go this time", hint: "They'll love you for it. They may learn nothing.", go: go("indulge") }
            ] };
    },
    p_underage: ctx => {
        if (!ctx.name) { ctx.name = kidPick(14, 17, c => TEMPERS[c.temper].scandal >= 0.4); ctx.where = pick(["a nightclub in the entertainment district", "a party on a senator's yacht", "a cantina near the spaceport", "the back of a speeder outside a concert"]); }
        const c = living().find(x => x.name === ctx.name);
        if (!c) return { title: "—", body: "", choices: [{ label: "Continue", go: () => {} }] };
        const royal = isRoyal();
        return { tag: royal ? "THE CROWN" : "THE HOLONET", title: `${c.name}, ${c.age}, caught drinking`,
            body: `<p>${esc(c.name)} was caught drinking at ${esc(ctx.where)}. They're ${c.age}. A photographer has the pictures and is calling your press office for comment${royal ? " — and asking what the palace intends to do about the heir's “conduct”" : ""}.</p>`,
            choices: [
                { label: "Pay the photographer to bury it", hint: "0.5M. If it ever comes out, it's worse.", disabled: G.funds < 0.5, go: () => { applyEffects({ funds: -0.5 }); addSecret(`Paid off a photographer to bury pictures of ${c.name} drinking underage`); c.bond = clamp(c.bond + 4); } },
                { label: "Public apology, and community service", hint: "Own it. The child hates it.", go: () => { c.duty = clamp(c.duty + 10); c.bond = clamp(c.bond - 10); applyEffects({ heat: royalNews(4), trust: 2 }); if (royal) fam().rp = clamp(fam().rp + 2); report("Owned", `${c.name} spends the summer serving meals at a veterans' hostel, cameras invited.`); } },
                { label: "Send them away to a strict academy", hint: "Out of sight. Fitness up, bond down.", go: () => { c.edu = "academy"; c.duty = clamp(c.duty + 14); c.bond = clamp(c.bond - 18); applyEffects({ heat: royalNews(3) }); report("Sent away", `${c.name} leaves for a military academy on a cold world. They don't say goodbye.`); } },
                { label: "Deny it — the pictures are doctored", go: () => { c.scandal++; if (chance(55)) { applyEffects({ heat: royalNews(14), trust: -5 }); if (royal) fam().rp = clamp(fam().rp - 8); report("The denial collapses", "A second photographer had video. Now it's a story about lying."); } else report("It holds", "The story dies in a day. You were lucky."); } }
            ] };
    },
    p_pregnancy: ctx => {
        if (!ctx.name) { ctx.name = kidPick(16, 26, c => TEMPERS[c.temper].scandal >= 1); ctx.other = randomName(G.worldKey); ctx.mine = chance(50); }
        const c = living().find(x => x.name === ctx.name);
        if (!c) return { title: "—", body: "", choices: [{ label: "Continue", go: () => {} }] };
        const royal = isRoyal();
        const who = ctx.mine ? `${c.name} is pregnant. The other parent is ${ctx.other}` : `${c.name} has got ${ctx.other} pregnant`;
        return { tag: royal ? "THE CROWN" : "PERSONAL", title: royal ? "A royal grandchild — out of wedlock" : "An unexpected grandchild",
            body: `<p>${esc(who)}, ${pick(["a waiter at a palace function", "a student they met at the academy", "the child of a rival's chief of staff", "a pilot from the spaceport"])}. ${esc(c.name)} is ${c.age}.${royal ? " In the line of succession, nothing is private. The court wants a plan by tonight." : ""}</p>`,
            choices: [
                { label: "A quick wedding", hint: "Duty and appearances.", go: () => { c.married = true; c.duty = clamp(c.duty + 6); c.bond = clamp(c.bond - 8); applyEffects({ heat: royalNews(6), g: { traditional: 2 } }); famLog(`${c.name} married ${ctx.other} in a hurried ceremony`); if (royal) fam().rp = clamp(fam().rp + 2); } },
                { label: "Acknowledge it openly and welcome the child", hint: "Honest. The traditionalists will be appalled.", go: () => { c.bond = clamp(c.bond + 15); c.scandal++; applyEffects({ heat: royalNews(12), g: { youth: 4, traditional: -6, religious: -4 } }); famLog(`${c.name}'s child was born — acknowledged by the family`); if (royal) fam().rp = clamp(fam().rp - 4); } },
                { label: "A quiet settlement — and silence", hint: "1M and a non-disclosure agreement. Secrets have a way of surfacing.", disabled: G.funds < 1, go: () => { applyEffects({ funds: -1 }); addSecret(`Paid a settlement to hide ${c.name}'s child`); c.bond = clamp(c.bond - 15); } },
                { label: "Support them privately, say nothing publicly", go: () => { c.bond = clamp(c.bond + 8); applyEffects({ heat: royalNews(5) }); } }
            ] };
    },
    p_spare: ctx => {
        const h = heir();
        if (!ctx.name) { const o = living().filter(c => c !== h && c.age >= 12); ctx.name = o.length ? pick(o).name : null; }
        const c = living().find(x => x.name === ctx.name);
        if (!c || !h) return { title: "—", body: "", choices: [{ label: "Continue", go: () => {} }] };
        return { tag: "THE CROWN", title: "The heir and the spare",
            body: `<p>${esc(c.name)} has always been the brighter one at parties and the worse one at duty. Tonight, after too much wine: <i>"${esc(h.name)} gets the throne. I get the leftovers. Do you know what it's like being the spare?"</i></p>`,
            choices: [
                { label: "Give them a real role — patronages, a title", go: () => { c.duty = clamp(c.duty + 8); c.bond = clamp(c.bond + 10); h.bond = clamp(h.bond - 4); applyEffects({ funds: -0.2 }); } },
                { label: "Remind them that duty is not a competition", go: () => report(c.name, parent(c, "punish")) },
                { label: `Name ${c.name} heir instead`, hint: "Upend the succession.", go: () => { fam().heir = c.name; h.bond = clamp(h.bond - 25); c.bond = clamp(c.bond + 15); applyEffects({ g: { traditional: -6 }, f: { traditionalists: -4 }, heat: 8 }); fam().rp = clamp(fam().rp - 6); report("👑 The succession changes", `${c.name} is the new heir. ${h.name} learns it from the HoloNet.`); } }
            ] };
    },
    p_reluctant: () => {
        const h = heir();
        if (!h) return NONE;
        return { tag: "THE CROWN", title: `${h.name} doesn't want it`,
            body: `<p>${esc(h.name)}, ${h.age}: <i>"I never asked for this. I want to study medicine. I want a life. Why does being born first mean I owe everyone everything?"</i></p><p class="small muted">Fitness to reign: ${heirReady(h)}.</p>`,
            choices: [
                { label: "Duty is not a choice. It's who we are.", go: () => { h.duty = clamp(h.duty + 12); h.bond = clamp(h.bond - 15); } },
                { label: "Make them a promise: some years of their own first", go: () => { h.bond = clamp(h.bond + 15); h.duty = clamp(h.duty + 3); } },
                { label: "Let them step aside from the succession", go: () => { const next = living().filter(c => c !== h).sort((a, b) => b.age - a.age)[0]; h.path = "own"; h.bond = clamp(h.bond + 20); fam().heir = next ? next.name : null; applyEffects({ heat: 10, g: { traditional: -5, youth: 4 } }); fam().rp = clamp(fam().rp - 5); report("Renounced", `${h.name} renounces their place in the succession.${next ? ` ${next.name} is the heir now.` : " There is no heir."}`); } }
            ] };
    },
    p_runaway: ctx => {
        if (!ctx.name) ctx.name = kidPick(15, 19, c => c.bond < 35);
        const c = living().find(x => x.name === ctx.name);
        if (!c) return { title: "—", body: "", choices: [{ label: "Continue", go: () => {} }] };
        return { tag: "PERSONAL", title: `${c.name} is gone`,
            body: `<p>${esc(c.name)}'s room is empty. A note: <i>"Don't look for me."</i> Spaceport records show a ticket to ${esc(pick(["Nar Shaddaa", "Canto Bight", "Tatooine", "a mining colony in the Outer Rim", "Coruscant's lower levels"]))}.</p>`,
            choices: [
                { label: "Go and find them yourself", hint: "A week away from everything.", go: () => { G.ap = Math.max(0, G.ap - 8); c.bond = clamp(c.bond + 25); report("Found", `You find ${c.name} in a cheap hostel. You don't shout. You both cry. They come home.`); } },
                { label: "Send your security team", go: () => { c.bond = clamp(c.bond - 10); applyEffects({ heat: royalNews(6) }); report("Retrieved", `${c.name} is brought home by men in dark suits. The HoloNet gets a photo of it.`); } },
                { label: "Let them go — they'll come back when they're ready", go: () => { c.bond = clamp(c.bond + 5); c.path = c.path || "own"; if (chance(40)) { c.scandal++; applyEffects({ heat: royalNews(8) }); } } }
            ] };
    },
    p_bad_company: ctx => {
        if (!ctx.name) { ctx.name = kidPick(16, 30, c => TEMPERS[c.temper].scandal >= 1); ctx.who = pick(["a Hutt-connected nightclub owner", "a disgraced former senator", "a smuggler with a famous ship", "an ISB officer with a reputation", "a con artist posing as a noble"]); }
        const c = living().find(x => x.name === ctx.name);
        if (!c) return { title: "—", body: "", choices: [{ label: "Continue", go: () => {} }] };
        return { tag: "PERSONAL", title: `${c.name}'s new friend`,
            body: `<p>${esc(c.name)} has fallen in with ${esc(ctx.who)}. Your security chief has a file. It's thick.</p>`,
            choices: [
                { label: "Forbid them from seeing this person", go: () => report(c.name, parent(c, "punish")) },
                { label: "Talk to them about who this person really is", go: () => report(c.name, parent(c, "talk")) },
                { label: "Quietly have the friend leaned on", hint: "Effective. Not entirely legal.", go: () => { addSecret(`Had ${c.name}'s friend, ${ctx.who}, intimidated into leaving`); applyEffects({ heat: 3 }); } }
            ] };
    },
    p_duty_marry: () => ({ tag: "THE CROWN", title: "The duty to marry",
        body: `<p>Your private secretary closes the door. <i>“Forgive me. The court, the council and the people expect a royal wedding — and an heir. Every year without one, the questions get louder.”</i></p>`,
        choices: [
            { label: "Ask for the court's list of suitable matches", go: () => { fam().suitors = [newSuitor(true), newSuitor(true), newSuitor(true)]; report("👑 The court's list", "Three names, three houses, three alliances. Visit the Family tab."); } },
            { label: "“I'll marry when I find the right person.”", go: () => { fam().court = clamp(fam().court + 10); applyEffects({ g: { youth: 3, traditional: -3 } }); } }
        ] })
});

function addChild(ctx, bond, extra) {
    const c = upgradeChild({ name: ctx.name, age: 0, alive: true, inPolitics: false, temper: ctx.temper });
    c.temper = ctx.temper; c.duty = clamp(40 + TEMPERS[ctx.temper].duty + ri(-10, 10)); c.bond = 60 + bond;
    fam().children.push(c);
    fam().trying = false;
    famLog(`${ctx.name} was born`);
    if (isRoyal()) { fam().rp = clamp(fam().rp + 8); applyEffects({ legitimacy: 5, g: { traditional: 4, elders: 3 } }); }
    extra && extra();
}

// ── The Family tab ────────────────────────────────────────────────

function viewFamily() {
    const f = fam(), royal = isRoyal();
    const btn = (t, label, cost, k = "", note = "") => tact("personal", label, cost, note, `data-t="${t}" ${k !== "" ? `data-k="${esc(String(k))}"` : ""}`);
    let love = "";
    if (f.spouse && f.spouse.alive !== false) {
        const s = f.spouse;
        love = panel(`💍 ${esc(s.name)}`, `<p class="small">Your spouse — ${esc(s.bg)}. ${s.bond >= 70 ? "Your rock. Coming home is the best part of the day." : s.bond >= 45 ? "Solid, if you're honest a little taken for granted." : s.bond >= 25 ? "Distant. Conversations are mostly logistics." : "On the edge. Something has to change."}</p>
            ${statRow("Your bond", Math.round(s.bond), s.bond, "good")}
            ${btn("time", "🏠 Home for dinner, comlink off", 2, "", "Spouse and children closer; health up.")}
            ${btn("holiday", "🏖️ A family holiday", 4, "", "0.5M. Big boost — bad press if there's a crisis at home.")}
            ${living().length < 6 && G.age <= 55 ? (f.trying ? btn("stopping", "Stop trying for a child", 0) : btn("trying", "👶 Try for a child", 1)) : ""}`);
    } else {
        const suitors = f.suitors.map((s, i) => `<div class="haven"><div><b>${esc(s.name)}</b><p class="small">${esc(s.bg)}${s.match ? " · a dynastic match" : ""} · chemistry ${s.chem >= 70 ? "sparks" : s.chem >= 45 ? "promising" : "polite"}</p></div><button class="mini" data-act="personal" data-t="ask" data-k="${i}" ${G.ap < 2 || f.partner ? "disabled" : ""}>Ask out · 2</button></div>`).join("");
        love = panel(f.partner ? `💞 Seeing ${esc(f.partner.name)}` : "💫 Single", `${royal && f.court > 20 ? `<p class="small c-against">The court is pressing you to marry (pressure ${Math.round(f.court)}). Without a spouse and an heir, your legitimacy slips.</p>` : ""}
            ${f.partner ? `<p class="small">${esc(f.partner.name)} — ${esc(f.partner.bg)}. ${f.partner.months} month${f.partner.months === 1 ? "" : "s"} together.</p>${statRow("Love", Math.round(f.partner.love), f.partner.love, "good")}
                ${btn("date", "💞 Take them out", 2, "", "0.1M. Relationships fade if you're never there.")}
                ${btn("propose", "💍 Propose", 3, "", f.partner.match ? "A dynastic match can marry sooner (love 35+)." : "When the time is right (love 60+).")}
                ${btn("breakup", "End it", 1)}` : `<p class="small">${royal ? "A monarch's marriage is a matter of state. The court would prefer a match from a great house; your heart may disagree." : "A life in public is hard on romance. Not impossible."}</p>`}
            ${btn("meet", "🥂 Accept more invitations — meet people", 2)}
            ${royal ? btn("matches", "👑 Ask the court for suitable matches", 2, "", "Alliances with great houses on other worlds.") : ""}
            ${suitors ? `<h4>People you've met</h4>${suitors}` : ""}`);
    }
    const h = royal ? heir() : null;
    const kids = living().map(c => `<div class="child-card"><div class="statrow"><b>${esc(c.name)}</b><span class="small muted">${c.age} · ${TEMPERS[c.temper].name}${c.path ? ` · ${{ court: "royal duties", politics: "in politics", military: "in the military", own: "their own life" }[c.path]}` : c.edu ? ` · ${SCHOOLS[c.edu].name.toLowerCase()}` : ""}${h === c ? ' · <span class="hint up">heir</span>' : ""}</span></div>
        ${statRow("Bond with you", Math.round(c.bond), c.bond, "good")}
        ${royal ? statRow("Fitness to reign", heirReady(c), heirReady(c), "good") : ""}
        ${c.scandal ? `<p class="small c-against">${c.scandal} scandal${c.scandal > 1 ? "s" : ""} in the press</p>` : ""}
        <div class="row">${btn("child", "Time together", 1, c.name)}${royal && c.age >= 8 ? btn("train", "👑 Teach royal duty", 2, c.name) : ""}${royal && h !== c ? btn("heir", "Name as heir", 1, c.name) : ""}</div></div>`).join("");
    const lost = f.children.filter(c => !c.alive).map(c => esc(c.name)).join(", ");
    const crown = royal ? panel("👑 The Crown", `<p class="small">The Crown is a family business. The people judge the whole family — weddings, heirs, scandals and all.</p>
        ${statRow("The royal family's popularity", Math.round(f.rp), f.rp, "good")}
        ${statRow("Heir", h ? `${esc(h.name)} (${h.age})` : "none")}
        ${h ? statRow("Heir's fitness to reign", heirReady(h), heirReady(h), "good") : '<p class="small c-against">No heir. The succession is a question mark — and the court knows it.</p>'}
        ${!f.spouse && G.age >= 24 ? statRow("Pressure to marry", Math.round(f.court), f.court, "bad") : ""}`) : "";
    const hist = f.log.length ? `<ul class="small">${f.log.map(l => `<li>${esc(l.text)} <span class="muted">(${esc(l.date)})</span></li>`).join("")}</ul>` : '<p class="muted small">Nothing yet.</p>';
    return `<div class="cols"><div class="col-main">
        ${love}
        ${panel(`👨‍👩‍👧 Children${living().length ? ` (${living().length})` : ""}`, kids || `<p class="muted small">No children.${f.spouse ? "" : " Most people start with a spouse."}</p>`)}
    </div><div class="col-side">
        ${crown}
        ${panel(esc(G.name), `${statRow("Age", G.age)}${statRow("Health", Math.round(G.health), G.health, "good")}<p class="small muted">A happy home keeps you healthy. A broken one wears you down.</p>${lost ? `<p class="small">Lost: ${lost}</p>` : ""}`)}
        ${panel("Family history", hist)}
    </div></div>`;
}
