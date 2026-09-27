// ── THE LEGISLATIVE ECOSYSTEM ───────────────────────────────────────
//
// Legislation and pork are not a static menu. The world generates issues —
// from planetary conditions, constituents, campaign stops, events, and the
// results of what you've already done. Issues become appropriations, bills,
// partnerships, promises — or resentment. Projects have lifecycles
// (need → proposal → funding fight → authorisation → construction →
// opening → outcome) and create follow-up needs. Bills move through stages
// and, once completed, never come back as identical choices; their
// outcomes and unintended consequences generate the next round of politics.

const ISSUE_CATS = {
    health:      { name: "Healthcare",       icon: "🏥", stat: "healthcare",     groups: ["elders", "veterans", "workers"], bill: "Health Access",
                   proj: [["Emergency Wing", 80], ["District Clinic", 60], ["Hospital Expansion", 180], ["Medical Supply Depot", 70]],
                   quotes: ["The hospital doesn't have enough emergency beds.", "We wait weeks to see a medic.", "The nearest clinic closed last year."],
                   obs: ["You pass a clinic with a queue stretching around the block.", "An overcrowded medical centre is treating patients in the corridors."],
                   follow: ["The new {name} is already operating near capacity. Administrators are requesting funding for more staff and equipment.", "The {name} can't hire enough medics to open every ward."] },
    housing:     { name: "Housing",          icon: "🏠", stat: "housing",        groups: ["youth", "urban", "workers"], bill: "Housing",
                   proj: [["Housing Towers", 200], ["Affordable Homes Program", 150], ["Shelter Network", 60]],
                   quotes: ["Rents have doubled and wages haven't.", "Three families share my apartment.", "Young people can't afford to stay here."],
                   obs: ["Families are sleeping in a transit station.", "Whole blocks stand condemned, still occupied."],
                   follow: ["The {name} helped, but population growth has already outpaced construction.", "Maintenance costs at the {name} are higher than planned."] },
    transit:     { name: "Transit & roads",  icon: "🚝", stat: "infrastructure", groups: ["urban", "rural", "workers"], bill: "Transit",
                   proj: [["Transit Station Rebuild", 90], ["Repulsor Road Network", 220], ["Transit Line Extension", 300]],
                   quotes: ["It takes two hours to get to work.", "The bridge to our district has been closed for a year."],
                   obs: ["Dozens of workers wait outside a damaged transit station.", "A collapsed skyway has cut off an entire district."],
                   follow: ["Ridership on the {name} is double the forecast. Commuters want more trains.", "The {name} needs repairs sooner than expected."] },
    education:   { name: "Education",        icon: "🎓", stat: "education",      groups: ["students", "youth"], bill: "Education",
                   proj: [["Technical School", 120], ["School Rebuilding Program", 160], ["Academy Scholarships", 60]],
                   quotes: ["My daughter can't get a seat at the only technical school in our district.", "Our teachers haven't been paid in months."],
                   obs: ["A school is holding classes in a warehouse.", "Hundreds of applicants are turned away at a technical academy."],
                   follow: ["Graduates of the {name} can't find jobs that use their skills.", "The {name} has a waiting list three years long."] },
    jobs:        { name: "Workforce & jobs", icon: "🛠️", stat: "employment",     groups: ["workers", "youth"], bill: "Workforce",
                   proj: [["Apprenticeship Program", 70], ["Job Training Centre", 90], ["Public Works Program", 200]],
                   quotes: ["There are no apprenticeships for young people.", "The factory closed and nothing replaced it."],
                   obs: ["A hiring hall is packed with people and posts only three jobs.", "Young people idle on every corner of an industrial district."],
                   follow: ["Employers say {name} graduates lack the skills they need.", "The {name} is oversubscribed."] },
    industry:    { name: "Industry",         icon: "🏭", stat: "employment",     groups: ["workers", "business", "unions"], bill: "Industrial Modernization",
                   proj: [["Shipyard Modernization", 180], ["Foundry Retooling", 150], ["Industrial Park", 220]],
                   quotes: ["Our equipment is older than I am.", "Offworld competitors are undercutting us."],
                   obs: ["You tour a shipyard where 40% of the equipment is over 30 years old.", "A foundry runs at half capacity with broken machinery."],
                   follow: ["The modernised {name} needs fewer workers than before. The laid-off want retraining.", "The {name} is booming — and polluting."] },
    food:        { name: "Food security",    icon: "🌾", stat: "healthcare",     groups: ["rural", "farmers", "elders"], bill: "Food Security",
                   proj: [["Irrigation Restoration", 120], ["Emergency Food Reserve", 150], ["Agricultural Credit Fund", 90]],
                   quotes: ["Our irrigation system is failing.", "Food prices have tripled.", "The harvest rots because there's no way to ship it."],
                   obs: ["Farmers are lining up for food aid.", "Market stalls are empty by midday."],
                   follow: ["The {name} works — but drought is spreading to new districts.", "Farmers who benefited from the {name} now want price guarantees."] },
    security:    { name: "Public safety",    icon: "🚨", stat: "crime",          groups: ["elders", "business", "urban"], bill: "Public Safety",
                   proj: [["Security Task Force", 110], ["Community Policing Program", 80], ["Court Backlog Fund", 60]],
                   quotes: ["Gangs run our street after dark.", "Nobody reports crimes because nothing happens."],
                   obs: ["Shopkeepers are boarding up their windows in the market district.", "You see a swoop gang shaking down a street vendor."],
                   follow: ["The {name} cut crime — and residents complain of harassment by patrols.", "Crime has moved to the next district over."] },
    water:       { name: "Water & power",    icon: "💧", stat: "infrastructure", groups: ["rural", "farmers", "urban"], bill: "Water and Power",
                   proj: [["Water Treatment Plant", 140], ["Power Grid Upgrade", 180], ["Moisture Collection Network", 90]],
                   quotes: ["The water isn't safe to drink.", "We have power four hours a day."],
                   obs: ["A burst water main has flooded a residential block.", "Rolling blackouts plunge a district into darkness."],
                   follow: ["Demand on the {name} has already exceeded its capacity.", "The {name} needs skilled technicians nobody trained."] },
    environment: { name: "Environment",      icon: "🌳", stat: "environment",    groups: ["environmentalists", "traditional", "youth"], bill: "Environmental Protection",
                   proj: [["River Cleanup", 90], ["Protected Reserve", 60], ["Emissions Monitoring Network", 80]],
                   quotes: ["The river smells of chemicals.", "Our children are coughing all winter."],
                   obs: ["A toxic haze hangs over the industrial district.", "Dead fish line the riverbanks."],
                   follow: ["The {name} worked — and industry wants compensation for the lost output.", "Pollution has moved just outside the {name}'s boundary."] },
    labor:       { name: "Labour & inequality", icon: "⚖️", stat: "inequality",  groups: ["workers", "unions"], bill: "Fair Wages",
                   proj: [["Workers' Rights Office", 50], ["Wage Support Fund", 160]],
                   quotes: ["I work two jobs and still can't pay rent.", "The owners got richer; we got poorer."],
                   obs: ["Striking workers picket a factory gate.", "Luxury towers rise beside a shanty district."],
                   follow: ["Employers are cutting hours to get around the {name}.", "The {name} is popular — and business groups want it repealed."] },
    finance:     { name: "Credit & debt",    icon: "🏦", stat: "inequality",     groups: ["workers", "business"], bill: "Consumer Credit",
                   proj: [["Credit Relief Fund", 200], ["Small Business Loan Program", 150]],
                   quotes: ["The loan sharks own half the street.", "No bank will lend to a small shop."],
                   obs: ["A line of debtors stretches outside a lending house.", "Shuttered shops carry foreclosure notices."],
                   follow: ["The {name} is being exploited by predatory lenders.", "Banks are lobbying against the {name}."] },
    trade:       { name: "Trade & shipping", icon: "📦", stat: "employment",     groups: ["business", "workers"], bill: "Trade and Shipping",
                   proj: [["Port Modernization", 200], ["Shipping Lane Security", 150], ["Export Promotion Office", 60]],
                   quotes: ["Shipping companies are leaving because the port is outdated.", "Tariffs are killing our exports."],
                   obs: ["Freighters wait in orbit for days to dock.", "Warehouses stand half-empty at the spaceport."],
                   follow: ["The {name} brought more trade — and more smuggling.", "Shippers want the {name} expanded."] },
    sovereignty: { name: "Sovereignty",      icon: "🏳️", stat: null,             groups: ["traditional", "rural"], bill: "Planetary Autonomy",
                   proj: [["Local Governance Fund", 60]],
                   quotes: ["Coruscant decides everything for us.", "Who asked the Republic to be here?"],
                   obs: ["Graffiti on a Republic building reads: GO HOME."],
                   follow: ["The {name} satisfied no one: loyalists call it separatism, separatists call it a sham."] },
    veterans:    { name: "Veterans",         icon: "🎖️", stat: "healthcare",     groups: ["veterans", "military"], bill: "Veterans' Care",
                   proj: [["Veterans' Medical Centre", 120], ["Veterans' Housing", 90]],
                   quotes: ["I fought for the Republic and I can't get treatment.", "Our veterans are sleeping on the streets."],
                   obs: ["Wounded veterans wait outside a closed benefits office."],
                   follow: ["The {name} has a waiting list as the war produces more wounded."] },
    refugees:    { name: "Refugees",         icon: "🧳", stat: "housing",        groups: ["religious", "urban"], bill: "Refugee Assistance",
                   proj: [["Refugee Reception Centre", 90], ["Resettlement Program", 150]],
                   quotes: ["Refugees are camped in our parks.", "The newcomers need work, not handouts."],
                   obs: ["A makeshift camp of refugees fills a public square."],
                   follow: ["Locals resent the {name}; newcomers say it isn't enough."] }
};

const GROUP_CATS = {
    workers: ["jobs", "labor", "housing"], farmers: ["food", "water"], business: ["trade", "industry", "finance"], elites: ["finance", "security"],
    students: ["education"], veterans: ["veterans", "health"], traditional: ["sovereignty", "environment"], religious: ["health", "refugees"],
    environmentalists: ["environment"], military: ["security", "veterans"], unions: ["labor", "industry"], rural: ["water", "transit", "food"],
    urban: ["housing", "transit", "security"], youth: ["jobs", "education", "housing"], elders: ["health", "security"]
};

const SOURCE_LABELS = { constituent: "📬 Constituent", observed: "👁️ Observed", known: "📋 Known need", followup: "🔁 Follow-up", consequence: "⚠️ Consequence", event: "📰 Event", condition: "📊 Conditions" };

let issueSeq = 1;

function makeIssue(cat, o = {}) {
    const c = ISSUE_CATS[cat];
    const district = o.district || (G.districts.length ? pick(G.districts).name : world().name);
    const pr = o.proj || pick(c.proj);
    return Object.assign({
        uid: `i${Date.now().toString(36)}${issueSeq++}`, cat, district,
        title: `${district}: ${c.name}`, text: pick(c.quotes),
        projName: `${district} ${pr[0]}`, cost: pr[1],
        fx: c.stat ? { [c.stat]: PLANET_STATS[c.stat].bad ? -5 : 5 } : {}, g: Object.fromEntries(c.groups.slice(0, 2).map(gk => [gk, 4])),
        severity: ri(1, 3), source: "condition", kind: "need", status: "open",
        created: monthsNow(), expires: monthsNow() + 12
    }, o);
}

function addIssue(issue, quiet = false) {
    G.issues = G.issues || [];
    if (G.issues.some(x => x.status === "open" && x.title === issue.title)) return null;
    if (G.issues.filter(x => x.status === "open").length >= 9) return null;
    G.issues.unshift(issue);
    if (G.issues.length > 60) G.issues.length = 60;
    if (!quiet) report(`${SOURCE_LABELS[issue.source] || "📬"} New issue: ${issue.title}`, issue.text);
    return issue;
}

function openIssues() { return (G.issues || []).filter(i => i.status === "open"); }

// Your world's known needs at the start of a career.
function seedIssues() {
    G.issues = [];
    (world().pork || []).forEach(p => {
        const cat = guessCat(p[2], p[3]);
        addIssue(makeIssue(cat, { title: p[0], text: p[4], projName: p[0], cost: p[1], fx: p[2], g: p[3], gal: p[5] || null, source: "known", severity: 2, expires: monthsNow() + 36 }), true);
    });
}

function guessCat(fx, g) {
    const k = Object.keys(fx || {})[0];
    const map = { healthcare: "health", housing: "housing", infrastructure: "transit", education: "education", employment: "industry", crime: "security", environment: "environment", inequality: "labor" };
    if (g && g.veterans > 3) return "veterans";
    if (g && g.farmers > 4) return "food";
    return map[k] || "industry";
}

function districtIssue(d, source) {
    const mix = Object.entries(d.mix).sort((a, b) => b[1] - a[1]);
    const gk = pick(mix.slice(0, 2))[0];
    const cat = pick(GROUP_CATS[gk] || ["jobs"]);
    const c = ISSUE_CATS[cat];
    return makeIssue(cat, {
        district: d.name, title: `${d.name}: ${c.name}`,
        text: source === "observed" ? pick(c.obs) : `“${pick(c.quotes)}” — a resident of ${d.name}`,
        source, g: { [gk]: 5, ...(c.groups[0] !== gk ? { [c.groups[0]]: 2 } : {}) }
    });
}


// ── The generator ─────────────────────────────────────────────────

// "Hospital" → "Hospital Phase II" → "Hospital Phase III", never "Phase II Phase II".
function nextPhase(name) {
    const R = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    const m = name.match(/^(.*) Phase ([IVX]+)$/);
    const base = m ? m[1] : name, n = m ? R.indexOf(m[2]) + 1 : 1;
    return `${base} Phase ${R[Math.min(R.length - 1, n)]}`;
}

function tickIssues() {
    G.issues = G.issues || [];
    // Broken campaign promises — checked before ordinary expiry.
    G.issues.filter(i => i.status === "open" && i.promised && monthsNow() - i.promisedAt >= 24).forEach(i => {
        i.status = "broken";
        report("💔 A broken promise", `You promised to deal with “${i.title}”. Nothing happened.`, applyEffects({ trust: -3, g: Object.fromEntries(Object.keys(i.g || {}).map(k => [k, -4])) }));
    });
    // Expired issues leave resentment behind.
    G.issues.filter(i => i.status === "open" && monthsNow() > i.expires).forEach(i => {
        i.status = "expired";
        const d = G.districts.find(x => x.name === i.district);
        if (d) d.boost -= 2;
        applyEffects({ g: Object.fromEntries(Object.keys(i.g || {}).map(k => [k, -2])) });
        log(`Unaddressed: ${i.title}. ${i.district} feels ignored.`, "issue");
    });

    const open = openIssues().length;
    const p = G.planet, w = world();

    // Conditions on the planet surface as issues.
    if (open < 7 && chance(22)) {
        const cands = [];
        if (p.healthcare < 50) cands.push("health");
        if (p.housing < 45) cands.push("housing");
        if (p.infrastructure < 50) cands.push("transit", "water");
        if (p.education < 50) cands.push("education");
        if (p.employment < 50) cands.push("jobs", "industry");
        if (p.crime > 55) cands.push("security");
        if (p.environment < 35) cands.push("environment");
        if (p.inequality > 65) cands.push("labor", "finance");
        if (G.war) cands.push("veterans");
        if (G.gal.refugees > 45) cands.push("refugees");
        if (w.special === "survival" && G.food < 50) cands.push("food", "food");
        if (G.siege && G.siege.blockade) cands.push("food");
        if (G.garrison > 20 && attr("identity") >= 4) cands.push("sovereignty");
        if (!cands.length) cands.push(pick(Object.keys(ISSUE_CATS)));
        const cat = pick(cands);
        addIssue(makeIssue(cat, { source: "condition", text: `${pick(ISSUE_CATS[cat].quotes)} (${ISSUE_CATS[cat].name} is a growing problem across ${w.name}.)` }));
    }

    // Constituents write in.
    if (open < 8 && G.districts.length && chance(28)) addIssue(districtIssue(pick(G.districts), "constituent"));

    // World-specific pressures.
    if (w.special === "corporate" && G.war && G.gal.trade < 50 && chance(6)) addIssue(makeIssue("trade", { title: "Shipping industry bailout proposal", text: "The war has disrupted trade. The shipping houses want a bailout — and their lobbyists are already in your office.", source: "event", cost: 350, g: { business: 6, elites: 4, workers: -2 } }));
    if (w.special === "survival" && G.food < 40 && chance(10)) addIssue(makeIssue("food", { title: "Food insecurity", text: "Rodia is poor, food prices are rising and Republic aid has dried up. Families are going hungry.", source: "condition", severity: 3 }));

    // Follow-ups from completed projects.
    (G.earmarks || []).concat(G.projects || []).filter(e => e.followAt && monthsNow() >= e.followAt).forEach(e => {
        e.followAt = null;
        const cat = e.cat || guessCat(e.fx, e.g);
        const c = ISSUE_CATS[cat] || ISSUE_CATS.industry;
        addIssue(makeIssue(cat, { title: `${e.name}: what next?`, text: pick(c.follow).replace("{name}", e.name), source: "followup", kind: "followup", projName: nextPhase(e.name), cost: Math.round((e.cost || 100) * 0.6), district: e.district || (G.districts[0] || {}).name }));
    });

    tickLaws();
}


// ── Acting on an issue ────────────────────────────────────────────

function issueActions(i) {
    const k = G.office.kind;
    const gov = governing();
    const acts = [];
    if (i.kind === "consequence") {
        return [["strengthen", "Strengthen regulations", 3], ["investigate", "Investigate", 3], ["amend", "Amend the program", 4], ["cut", "Cut its funding", 2], ["expand", "Expand the program", 4], ["defend", "Defend the existing policy", 0]];
    }
    if (k === "senator") acts.push(["appropriation", `Seek an appropriation (${i.cost}M)`, 4], ["bill", "Draft a bill", 0], ["private", "Pursue a private partnership", 3], ["promise", "Make it a campaign promise", 0], ["committee", "Refer it to committee", 2]);
    else if (gov || k === "council") acts.push(["cip", `Add to the capital program (${(i.cost / 100).toFixed(1)}B)`, 1], ["project", `Emergency appropriation outside the budget (${(i.cost / 100).toFixed(1)}B)`, 5], ["bill", "Draft a bill", 0], ["agency", "Direct an agency to act", 3], ["askSenate", "Ask the Senate for funding", 3], ["private", "Pursue a private partnership", 3]);
    else if (k === "local") acts.push(["city", "City project", 3], ["petition", "Petition the planetary government", 3], ["promise", "Make it a campaign promise", 0], ["bill", "Draft a local ordinance", 0]);
    else if (k === "chancellor" || k === "minister") acts.push(["agency", "Direct a ministry to act", 3], ["bill", "Draft a bill", 0]);
    else acts.push(["organize", "Champion the cause", 3], ["promise", "Make it a campaign promise", 0]);
    if (i.kind === "followup" && k === "senator") acts.splice(1, 0, ["redirect", "Redirect existing funding", 3], ["askPlanet", "Ask the planetary government to contribute", 3]);
    acts.push(["ignore", "Do nothing", 0]);
    return acts;
}

function resolveIssue(uid, act) {
    const i = (G.issues || []).find(x => x.uid === uid);
    if (!i || !["open"].includes(i.status)) return;
    const cost = (issueActions(i).find(a => a[0] === act) || [])[2] || 0;
    if (act === "bill") { openBuilderFor(i); return; }
    if (cost && !spendAP(cost)) return;
    const d = G.districts.find(x => x.name === i.district);
    const gKeys = Object.keys(i.g || {});
    let ch = [];
    const partial = m => { Object.entries(i.fx || {}).forEach(([k, v]) => { G.base[k] += v * m; }); };
    switch (act) {
        case "appropriation": {
            const support = 10 + G.influence / 5 + (G.committees.includes("finance") ? 15 : 0) + (G.chairOf === "finance" ? 25 : 0) + G.seniority / 6 + (6 - attr("wealth")) * 2;
            G.earmarks.push({ idx: null, name: i.projName, cost: i.cost, fx: i.fx, g: i.g, blurb: i.text, gal: i.gal || null, support: Math.round(support), status: "requested", cosponsors: [], monthsLeft: 0, cat: i.cat, district: i.district, issueUid: i.uid });
            i.status = "in progress";
            report("Appropriation requested", `${i.projName} (${i.cost}M credits) enters the appropriations fight. Markup is in Month 10.`);
            break;
        }
        case "private":
            if (chance(55)) { partial(0.6); i.status = "resolved"; ch = applyEffects({ g: { business: 3, [gKeys[0]]: 2 }, p: { inequality: 1 }, f: { corporatists: 3 } }); report("Private partnership", `A private firm takes on “${i.title}” — on its own terms.`, ch); }
            else report("No partner found", "Nobody sees a profit in it.");
            break;
        case "promise":
            i.promisedAt = monthsNow();
            if (d) d.boost += 3;
            ch = applyEffects({ g: Object.fromEntries(gKeys.map(k => [k, 3])) });
            report("Campaign promise", `You promise to fix “${i.title}”. Voters will remember — either way.`, ch);
            i.status = "open"; i.promised = true; i.expires = monthsNow() + 24;
            break;
        case "committee": i.expires += 12; ch = applyEffects({ trust: -1 }); report("Referred to committee", "It will be studied. Critics say it's being buried.", ch); break;
        case "ignore": i.status = "dismissed"; ch = applyEffects({ g: Object.fromEntries(gKeys.map(k => [k, -2])) }); if (d) d.boost -= 1; report("Set aside", `“${i.title}” is not a priority.`, ch); break;
        case "cip": {
            addToCip({ key: i.uid, name: i.projName, fx: i.fx, g: i.g, cost: i.cost / 100, cat: i.cat, district: i.district });
            i.status = "in progress";
            if (!(G.projects || []).some(p => p.key === i.uid)) report("Added to the capital program", `${i.projName} joins the Capital Improvement Program queue. It will be built when the capital budget reaches it.`);
            break;
        }
        case "project": {
            const b = i.cost / 100;
            G.treasury -= b;
            G.projects.push({ key: i.uid, name: i.projName, fx: i.fx, g: i.g, monthsLeft: 4 + Math.round(i.cost / 50), cost: i.cost, cat: i.cat, district: i.district });
            i.status = "in progress";
            report("Project funded", `${i.projName}: ${b.toFixed(1)}B from the treasury${G.treasury < 0 ? " (borrowed)" : ""}. Construction begins.`);
            break;
        }
        case "agency": partial(0.4); i.status = "resolved"; ch = applyEffects({ i: { civil: 2 }, g: Object.fromEntries(gKeys.map(k => [k, 2])) }); report("Agency directed", `A ministry is ordered to deal with “${i.title}” within existing budgets.`, ch); break;
        case "askSenate": {
            const sen = worldSenator(G.worldKey);
            if (chance(25 + (sen ? sen.rel / 2 : 0) + G.influence / 3 + (G.allegiance === "republic" ? 10 : -30) + (6 - attr("wealth")) * 3)) {
                G.projects.push({ key: i.uid, name: i.projName, fx: i.fx, g: i.g, monthsLeft: 7 + Math.round(i.cost / 50), cost: i.cost, cat: i.cat, district: i.district });
                G.record.appropriations += i.cost; i.status = "in progress";
                report("Republic funding secured", `${sen ? sen.name : "Your senator"} wins Republic money for ${i.projName}.`);
            } else report("The Senate says no", "No Republic money this time.");
            break;
        }
        case "city":
            if (G.cityFunds < 1.5) { G.ap += 3; return toast("City budget exhausted", "It refills a little each month."); }
            G.cityFunds -= Math.min(4, 1.5 + i.cost / 100); partial(0.5); i.status = "resolved";
            report("City project", `The city tackles “${i.title}” itself.`, applyEffects({ g: Object.fromEntries(gKeys.map(k => [k, 3])) }));
            break;
        case "petition":
            if (chance(35 + G.influence * 0.5)) { G.projects.push({ key: i.uid, name: i.projName, fx: i.fx, g: i.g, monthsLeft: 6, cost: i.cost, cat: i.cat, district: i.district }); i.status = "in progress"; report("Petition granted", `The planetary government funds ${i.projName}.`); }
            else report("Petition declined", "The planetary government has other priorities.");
            break;
        case "organize": ch = applyEffects({ g: Object.fromEntries(gKeys.map(k => [k, 4])), influence: 1 }); if (d) d.boost += 2; i.status = "championed"; report("Championing the cause", `You make “${i.title}” your fight.`, ch); break;
        case "redirect": { const pk = Object.keys(G.policies).filter(k => G.policies[k].level > 0.2 && !POLICIES[k].war); const k = pick(pk); G.policies[k].level = clamp(G.policies[k].level - 0.15, 0, 1); partial(0.5); i.status = "resolved"; report("Funding redirected", `Money moves from ${POLICIES[k].name} to ${i.projName}.`); break; }
        case "askPlanet": if (chance(45)) { partial(0.6); i.status = "resolved"; report("The planetary government contributes", `${world().name}'s government pays for ${i.projName}.`); } else report("No help from the planet", "The planetary government says the Republic should pay."); break;
        // Consequence responses
        case "strengthen": i.status = "resolved"; ch = applyEffects({ g: { business: -3 }, trust: 2, f: { reformers: 2, corporatists: -2 } }); lawFix(i, "strengthened"); report("Regulations strengthened", "New rules close the loopholes.", ch); break;
        case "investigate": i.status = "resolved"; ch = applyEffects({ rep: 3, trust: 2, heat: 0 }); if (chance(50)) { report("Investigation", "Investigators find real abuse — heads roll.", applyEffects({ trust: 3 })); } else report("Investigation", "The investigation finds sloppiness, not crime."); break;
        case "amend": { i.status = "resolved"; const law = (G.laws || []).find(l => l.id === i.lawId); createBill(`amend_${i.uid}`, "player", { arena: arena() === "none" ? "local" : arena(), title: `${law ? law.title.replace(/ Act$/, "") : i.title} Amendment Act`, desc: "Fixes the problems in an existing program.", stance: { reformers: 1, centralists: 1, federalists: 0, corporatists: 0, militarists: 0, independence: 0, traditionalists: 0 }, g: i.g || {} }); report("Amendment introduced", "You put a fix to the vote."); break; }
        case "cut": i.status = "resolved"; lawFix(i, "cut"); ch = applyEffects({ g: Object.fromEntries(gKeys.map(k => [k, -4])), f: { corporatists: 2, reformers: -3 } }); report("Funding cut", "The program shrinks. So does its constituency's patience.", ch); break;
        case "expand": i.status = "resolved"; lawFix(i, "expanded"); ch = applyEffects({ g: Object.fromEntries(gKeys.map(k => [k, 3])), f: { reformers: 2, corporatists: -2 }, treasury: governing() ? -1.5 : 0, influence: governing() ? 0 : -3 }); report("Program expanded", "More money, more reach — more to go wrong.", ch); break;
        case "defend": i.status = "resolved"; ch = applyEffects({ trust: chance(50) ? 2 : -3 }); report("You defend the policy", "You stand by your record.", ch); break;
    }
    render();
}


// ── Laws: implementation, completion, consequences ────────────────

const SEED_TEXT = {
    contractor: { cat: "labor", title: "Contractors cutting corners", text: "Private contractors administering the {law} are cutting corners and overbilling." },
    misuse:     { cat: "finance", title: "Funds misused", text: "An audit finds money from the {law} diverted to connected officials." },
    debt:       { cat: "finance", title: "The borrowing bill comes due", text: "Interest on the debt raised for the {law} is squeezing other programs." },
    luxury:     { cat: "housing", title: "Subsidies for luxury housing", text: "Developers receiving {law} subsidies are building luxury housing rather than affordable units." },
    compliance: { cat: "industry", title: "Compliance burden", text: "Businesses say the {law}'s rules are driving them offworld." },
    bureaucracy:{ cat: "labor", title: "Runaway bureaucracy", text: "The agency created by the {law} has doubled its staff and halved its output." },
    demand:     { cat: null, title: "Demand outpaces the program", text: "The {law} worked — so well that demand now outpaces what it can provide." }
};

function recordLaw(b) {
    G.laws = G.laws || [];
    const f = b.fx;
    const years = f.duration || (f.program ? Math.min(5, f.program.years) : 2);
    G.laws.unshift({ id: b.id, title: b.title, sponsor: b.sponsor === "player" ? G.name : b.sponsor === "floor" ? "the Senate" : ((npc(b.sponsor) || {}).name || "another member"), mine: b.sponsor === "player",
        status: "implementation", monthsLeft: years * 12, total: years * 12, perYear: f.perYear || null,
        galPerYear: f.galPerYear || null, worldPerYear: f.worldPerYear || null, worldKeys: f.worldKeys || null, scope: f.scope || null, cat: f.cat || null, seeds: (f.seeds || []).slice(), arena: b.arena, year: currentBBY() });
    if (G.laws.length > 40) G.laws.length = 40;
    G.completedBills = G.completedBills || {};
    G.completedBills[b.key] = true;
}

function tickLaws() {
    (G.laws || []).filter(l => l.status === "implementation").forEach(l => {
        l.monthsLeft--;
        if (l.perYear && (l.arena === "local" || l.mine)) Object.entries(l.perYear).forEach(([k, v]) => { G.base[k] += v / 12 * (l.arena === "senate" ? 0.6 : 1); });
        if (l.galPerYear) Object.entries(l.galPerYear).forEach(([k, v]) => { if (G.gal[k] != null) G.gal[k] = clamp(G.gal[k] + v / 12); });
        if (l.worldPerYear) (l.worldKeys || Object.keys(G.galaxy)).forEach(k => {
            const w = G.galaxy[k];
            if (!w || w.destroyed) return;
            Object.entries(l.worldPerYear).forEach(([s, v]) => { if (w[s] != null) w[s] = clamp(w[s] + v / 12); });
        });
        if (l.seeds.length && l.monthsLeft === Math.floor(l.total / 2)) {
            l.seeds.forEach(s => {
                if (!chance(55)) return;
                const t = SEED_TEXT[s];
                const cat = t.cat || l.cat || "industry";
                addIssue(makeIssue(cat, { title: `${t.title} (${l.title})`, text: t.text.replace("{law}", l.title), source: "consequence", kind: s === "demand" ? "followup" : "consequence", lawId: l.id, severity: 2 }));
            });
        }
        if (l.monthsLeft <= 0) {
            l.status = "completed";
            if (l.mine) {
                report("📜 Law fully implemented", `The ${l.title} has completed implementation. It will not come back as an identical bill — but its results will shape what comes next.`);
                log(`📜 ${l.title} completed.`, "legislation");
                if (l.cat && chance(35)) addIssue(makeIssue(l.cat, { title: `After the ${l.title}`, text: SEED_TEXT.demand.text.replace("{law}", l.title), source: "followup", kind: "followup" }));
            }
        }
    });
}

function lawFix(i, how) {
    const l = (G.laws || []).find(x => x.id === i.lawId);
    if (!l) return;
    if (how === "cut") { l.status = "completed"; l.monthsLeft = 0; }
    if (how === "expanded") { l.monthsLeft += 24; l.total += 24; if (l.perYear) Object.keys(l.perYear).forEach(k => { l.perYear[k] *= 1.3; }); }
    if (how === "strengthened") l.seeds = [];
}

// Where a bill is in its life.
const STAGES = ["Idea", "Drafting", "Introduced", "Committee", "Debate", "Vote", "Passed", "Implementation", "Completed"];
function billStage(b) {
    if (b.stuck) return "Committee";
    if (b.voteIn >= 3) return b.voteIn === (b.fx.startVoteIn || 99) ? "Introduced" : "Committee";
    if (b.voteIn === 2) return "Debate";
    return "Vote";
}

function billCategory(b) {
    if (b.sponsor === "player") return "yours";
    if (b.fx.major || b.keyVote || b.petition) return "major";
    return "others";
}


// ── Major galactic legislation, contextual to the timeline ────────

const MAJOR_BILLS = {
    separatist_sanctions: { arena: "senate", major: true, era: ["crisis"], title: "Separatist Sanctions Act", desc: "Trade sanctions against systems that have seceded.", stance: { centralists: 3, militarists: 2, federalists: -2, independence: -3, corporatists: -2, reformers: 0, traditionalists: 0 }, g: { military: 3, business: -3 }, gal: { trade: -5, war: 3 } },
    loyalty_act: { arena: "senate", major: true, era: ["crisis"], title: "Republic Loyalty Act", desc: "Requires member worlds to affirm their loyalty — or lose Republic funding.", stance: { centralists: 3, militarists: 2, federalists: -3, independence: -3, reformers: -1, corporatists: 0, traditionalists: 0 }, g: { traditional: -3 }, indep: -3 },
    clone_funding: { arena: "senate", major: true, era: ["war"], title: "Clone Army Funding Act", desc: "Another million clones from Kamino.", stance: { militarists: 3, centralists: 2, corporatists: 1, reformers: -2, federalists: -1, independence: -2, traditionalists: 0 }, g: { military: 5, students: -3 }, gal: { military: 10, war: -2 } },
    emergency_defense: { arena: "senate", major: true, era: ["war"], title: "Emergency Defense Authorization", desc: "Blanket authority for the Chancellor to deploy forces without further votes.", stance: { militarists: 3, centralists: 3, reformers: -3, federalists: -2, independence: -3, corporatists: 0, traditionalists: -1 }, g: { military: 4, youth: -3 }, gal: { military: 6 } },
    wartime_transport: { arena: "senate", major: true, era: ["war"], title: "Wartime Transportation Act", desc: "Military priority on every hyperlane.", stance: { militarists: 2, centralists: 2, corporatists: -2, federalists: -1, reformers: 0, independence: -1, traditionalists: 0 }, g: { business: -4, military: 3 }, gal: { trade: -6 } },
    refugee_assistance: { arena: "senate", major: true, era: ["war"], title: "Refugee Assistance Act", desc: "Republic funds for worlds taking in war refugees.", stance: { reformers: 3, federalists: 1, centralists: 1, traditionalists: -2, militarists: -1, corporatists: -1, independence: 0 }, g: { religious: 4, urban: -1 }, gal: { refugees: -12 } },
    intelligence_expansion: { arena: "senate", major: true, era: ["war"], title: "Intelligence Expansion Act", desc: "Broad new surveillance powers for the Senate Bureau of Intelligence.", stance: { militarists: 3, centralists: 2, reformers: -3, federalists: -2, independence: -2, corporatists: 0, traditionalists: 0 }, g: { youth: -4, students: -4, elders: 3 }, i: { courts: -4 } },
    imperial_security: { arena: "senate", major: true, era: ["empire"], title: "Imperial Security Act", desc: "Expands the powers of the Imperial Security Bureau.", stance: { militarists: 3, centralists: 3, reformers: -3, federalists: -2, independence: -3, corporatists: 0, traditionalists: 0 }, g: { youth: -5, students: -5 } },
    senate_advisory: { arena: "senate", major: true, era: ["empire"], title: "Senate Advisory Role Act", desc: "Reduces the Imperial Senate to an advisory body.", stance: { centralists: 3, militarists: 2, reformers: -3, federalists: -3, independence: -2, corporatists: 0, traditionalists: -1 }, g: {} },
    demilitarization: { arena: "senate", major: true, era: ["newrepublic"], title: "Military Disarmament Act", desc: "Shrinks the New Republic's fleet by ninety percent.", stance: { reformers: 3, federalists: 2, militarists: -3, centralists: -1, corporatists: 0, independence: 1, traditionalists: 0 }, g: { military: -6, students: 3 }, gal: { military: -15 } },
    amnesty: { arena: "senate", major: true, era: ["newrepublic"], title: "Imperial Amnesty Act", desc: "Amnesty for former Imperial officials who surrender.", stance: { centralists: 1, reformers: -1, militarists: 1, federalists: 1, independence: 0, corporatists: 1, traditionalists: 1 }, g: { veterans: 2 } }
};
Object.assign(BILLS, MAJOR_BILLS);


// ── The Bill Builder ──────────────────────────────────────────────

const MECHANISMS = {
    fund:       { name: "Fund services",           noun: "and Investment Act", eff: 1,   cost: 1 },
    program:    { name: "Create a new program",    noun: "Program Act",        eff: 1.2, cost: 1.2 },
    regulate:   { name: "Regulate",                noun: "Standards Act",      eff: 0.6, cost: 0.2 },
    taxcredit:  { name: "Offer tax credits",       noun: "Tax Credit Act",     eff: 0.7, cost: 0.7 },
    restrict:   { name: "Restrict or prohibit",    noun: "Protection Act",     eff: 0.6, cost: 0.2 },
    deregulate: { name: "Deregulate",              noun: "Modernization Act",  eff: 0.8, cost: 0 }
};
const FUNDING = { appropriations: "Republic appropriations", budget: "The planetary budget", newtax: "A new tax", borrowing: "Borrowing", reallocation: "Reallocate existing funds", industryfees: "Fees on industry" };
const AGENCIES = { department: "An existing department", planetary: "Planetary governments", contractors: "Private contractors", newagency: "A new agency", local: "Local councils" };
const PROVISIONS = {
    low_income: "Require access for low-income citizens", local_hiring: "Require local hiring", audit: "Independent anti-corruption audit",
    sunset: "Sunset clause (expires unless renewed)", env_review: "Environmental review", worker_protections: "Worker protections", private_match: "Require private-sector matching funds"
};
const BENEFICIARY_ADJ = { rural: "Rural", urban: "Urban", workers: "Working Families", farmers: "Farmers", youth: "Youth", students: "Student", elders: "Elder", veterans: "Veterans", business: "Small Business", elites: "Enterprise", military: "Armed Forces", unions: "Workers", traditional: "Heritage Communities", environmentalists: "Green", religious: "Community", everyone: "" };

// How a galaxy-wide law in each area moves the galaxy itself.
const GAL_EFFECTS = {
    security: { military: 1.5 }, veterans: { military: 0.8 }, trade: { trade: 1.5 }, finance: { trade: 1 }, industry: { trade: 1 }, jobs: { trade: 0.8 },
    refugees: { refugees: -2 }, food: { refugees: -0.8 }, health: { refugees: -0.5 }, sovereignty: { diplomacy: 1.2 }, environment: { diplomacy: 0.5 }, transit: { trade: 0.6 }
};

function billScope(b) {
    if (b.arena !== "senate") return null;
    return (b.fx && b.fx.scope) || "galaxy";
}

function scopeTag(b) {
    const sc = billScope(b);
    if (!sc) return "";
    const where = b.fx && b.fx.worldKeys && b.fx.worldKeys.length === 1 ? worldName(b.fx.worldKeys[0]) : world().name;
    return sc === "galaxy" ? '<span class="scope gal">🌌 Galaxy-wide law</span>' : `<span class="scope planet">🪐 For ${esc(where)} only</span>`;
}

function builderDefaults(cat) {
    const c = ISSUE_CATS[cat] || ISSUE_CATS.health;
    const senate = arena() === "senate";
    return { cat, scope: "planet", mech: "fund", ben: c.groups.find(g => G.groups[g] && G.groups[g].w > 0) || "everyone", amount: senate ? 250 : 1.5, funding: senate ? "appropriations" : "budget", agency: "department", years: 5, provisions: [] };
}

function compileBill(spec) {
    const c = ISSUE_CATS[spec.cat];
    const m = MECHANISMS[spec.mech];
    const senate = arena() === "senate";
    const scale = spec.amount / (senate ? 250 : 1.5);
    const st = { centralists: 0, federalists: 0, corporatists: 0, reformers: 0, militarists: 0, independence: 0, traditionalists: 0 };
    const add = (f, v) => { st[f] += v; };
    ({ fund: () => { add("reformers", 2); add("corporatists", -1); }, program: () => { add("reformers", 2); add("centralists", 1); add("corporatists", -1); },
       regulate: () => { add("reformers", 1); add("corporatists", -2); }, taxcredit: () => { add("corporatists", 2); add("reformers", -1); },
       restrict: () => spec.cat === "security" ? (add("militarists", 1), add("traditionalists", 1), add("reformers", -1)) : (add("reformers", 1), add("corporatists", -1)),
       deregulate: () => { add("corporatists", 3); add("reformers", -2); add("federalists", 1); } })[spec.mech]();
    ({ newtax: () => { add("corporatists", -2); add("reformers", 1); }, borrowing: () => { add("traditionalists", -1); add("corporatists", -1); }, industryfees: () => add("corporatists", -2),
       appropriations: () => { add("federalists", 1); add("centralists", 1); }, budget: () => {}, reallocation: () => {} })[spec.funding]();
    ({ department: () => add("centralists", 1), planetary: () => { add("federalists", 2); add("centralists", -1); }, contractors: () => { add("corporatists", 2); add("reformers", -1); },
       newagency: () => { add("centralists", 2); add("federalists", -1); add("traditionalists", -1); }, local: () => add("federalists", 1) })[spec.agency]();
    ({ security: () => add("militarists", 2), sovereignty: () => { add("independence", 2); add("federalists", 1); add("centralists", -2); }, veterans: () => add("militarists", 1),
       environment: () => { add("reformers", 1); add("corporatists", -1); }, trade: () => add("corporatists", 1), finance: () => add("corporatists", 1),
       labor: () => { add("reformers", 1); add("corporatists", -1); }, refugees: () => { add("reformers", 2); add("traditionalists", -2); } }[spec.cat] || (() => {}))();
    const g = {};
    const addG = (k, v) => { if (G.groups[k] && G.groups[k].w > 0) g[k] = (g[k] || 0) + v; };
    let costMult = m.cost;
    spec.provisions.forEach(p => {
        ({ sunset: () => { add("traditionalists", 1); add("federalists", 1); }, audit: () => add("reformers", 1), local_hiring: () => { add("federalists", 1); addG("workers", 2); },
           low_income: () => { add("reformers", 1); add("corporatists", -1); addG("workers", 1); }, env_review: () => { add("reformers", 1); add("corporatists", -1); addG("environmentalists", 2); },
           worker_protections: () => { add("reformers", 1); add("corporatists", -1); addG("unions", 2); }, private_match: () => { add("corporatists", 1); costMult *= 0.7; } })[p]();
    });
    // Scope: a law for your own world, or one that binds every member world.
    const galactic = senate && spec.scope === "galaxy";
    const stanceScale = !senate ? 1 : galactic ? 1.5 : 0.6;
    if (galactic) costMult *= 4;
    Object.keys(st).forEach(k => { st[k] = clamp(Math.round(st[k] * stanceScale), -3, 3); });

    // Voter reactions.
    if (spec.ben === "everyone") c.groups.forEach(k => addG(k, 2 * Math.min(scale, 2)));
    else { addG(spec.ben, 4 * Math.min(scale, 2)); addG(c.groups[0], 1.5); }
    if (spec.funding === "newtax") { addG("elites", -3); addG("business", -2); }
    if (spec.funding === "industryfees") addG("business", -3);
    if (spec.funding === "borrowing") addG("elders", -1);
    if (spec.funding === "reallocation") addG(pick(Object.keys(G.groups).filter(k => G.groups[k].w > 0)), -2);
    if (spec.mech === "deregulate") { addG("environmentalists", -3); addG("business", 4); }

    // What it does, per year, while implemented.
    const perYear = {};
    const mag = Math.min(4, 1.6 * scale * m.eff);
    if (c.stat) perYear[c.stat] = PLANET_STATS[c.stat].bad ? -mag : mag;
    if (spec.mech === "deregulate") { perYear.employment = (perYear.employment || 0) + 1.2 * scale; perYear.environment = (perYear.environment || 0) - 0.8 * scale; perYear.inequality = (perYear.inequality || 0) + 0.6 * scale; }
    if (spec.mech === "taxcredit") perYear.inequality = (perYear.inequality || 0) + 0.4 * scale;
    if (spec.provisions.includes("low_income")) perYear.inequality = (perYear.inequality || 0) - 0.5 * scale;
    if (spec.provisions.includes("env_review")) perYear.environment = (perYear.environment || 0) + 0.4;
    // A galaxy-wide law spreads its effect: your world gets a share, and so does every other.
    let galPerYear = null, worldPerYear = null;
    if (galactic) {
        Object.keys(perYear).forEach(k => { perYear[k] *= 0.5; });
        galPerYear = GAL_EFFECTS[spec.cat] ? Object.fromEntries(Object.entries(GAL_EFFECTS[spec.cat]).map(([k, v]) => [k, v * Math.min(2, scale) * m.eff])) : null;
        worldPerYear = { prosperity: ["jobs", "industry", "trade", "finance", "housing", "transit", "food", "water", "health", "education"].includes(spec.cat) ? 1.2 * Math.min(2, scale) * m.eff : 0.4,
                         stability: ["security", "food", "refugees", "sovereignty", "veterans", "labor"].includes(spec.cat) ? 1.2 * Math.min(2, scale) * m.eff : 0.4 };
    }

    const cost = Math.round(spec.amount * costMult * (spec.years >= 20 ? 1.5 : 1) * 10) / 10;
    const seeds = [];
    if (spec.agency === "contractors") seeds.push("contractor");
    if (!spec.provisions.includes("audit") && cost >= (senate ? 400 : 3)) seeds.push("misuse");
    if (spec.funding === "borrowing" && cost >= (senate ? 300 : 2)) seeds.push("debt");
    if (spec.cat === "housing" && ["taxcredit", "deregulate"].includes(spec.mech) || spec.cat === "housing" && spec.agency === "contractors" && !spec.provisions.includes("low_income")) seeds.push("luxury");
    if (["regulate", "restrict"].includes(spec.mech)) seeds.push("compliance");
    if (spec.agency === "newagency" && !spec.provisions.includes("sunset")) seeds.push("bureaucracy");
    if (["fund", "program"].includes(spec.mech) && scale >= 1) seeds.push("demand");

    const adj = BENEFICIARY_ADJ[spec.ben] || "";
    const title = `${galactic ? "Galactic" : world().name} ${adj ? adj + " " : ""}${c.bill} ${m.noun}`.replace(/\s+/g, " ");
    const fn = k => FACTIONS[k].name;
    let supportersExtra = null;
    const supporters = Object.entries(st).filter(([, v]) => v >= 1).map(([k]) => fn(k)).concat(Object.entries(g).filter(([, v]) => v > 0).map(([k]) => GROUPS[k].name));
    const opponents = Object.entries(st).filter(([, v]) => v <= -1).map(([k]) => fn(k)).concat(Object.entries(g).filter(([, v]) => v < 0).map(([k]) => GROUPS[k].name));
    const scopeLines = !senate ? [] : galactic
        ? ["Scope: binds every member world — your world gets only a share of the benefit", "Every senator has a stake: expect a bigger fight, and bigger credit if it passes"]
        : [`Scope: ${world().name} only — most senators have no stake in it; you'll need cosponsors and trades`];
    if (galactic) { supportersExtra = "Senators from struggling worlds"; }
    const consequences = scopeLines.concat([`Cost: ${senate ? cost + "M credits from Republic funds" : cost + "B from the planetary treasury"}${spec.years < 20 ? ` over ${spec.years} years` : " (permanent)"}${costMult < 1 ? ` — ${m.name.toLowerCase()} costs a fraction of the ${spec.amount}${senate ? "M" : "B"} it steers` : ""}${galactic ? " — four times the price of a one-world law" : ""}`])
        .concat(seeds.map(s => ({ contractor: "Risk: contractors cut corners", misuse: "Risk: funds misused without an audit", debt: "Risk: debt service squeezes other programs", luxury: "Risk: subsidies flow to luxury developments", compliance: "Risk: businesses complain of compliance costs", bureaucracy: "Risk: the new agency grows beyond its mission", demand: "Likely: success creates demand for more" }[s])));
    return {
        arena: senate ? "senate" : "local", title, custom: true, cat: spec.cat, spec,
        desc: `Purpose: address ${c.name.toLowerCase()} — ${MECHANISMS[spec.mech].name.toLowerCase()} for ${spec.ben === "everyone" ? "everyone" : GROUPS[spec.ben].name.toLowerCase()}, through ${AGENCIES[spec.agency].toLowerCase()}, funded by ${FUNDING[spec.funding].toLowerCase()}.${spec.provisions.length ? " Provisions: " + spec.provisions.map(p => PROVISIONS[p].toLowerCase()).join("; ") + "." : ""}`,
        stance: st, g, perYear, galPerYear, worldPerYear, scope: senate ? (galactic ? "galaxy" : "planet") : "planet", duration: Math.min(spec.years, 10), cost, seeds,
        supporters: supportersExtra ? supporters.concat(supportersExtra) : supporters, opponents, consequences,
        treasury: senate ? 0 : -cost
    };
}

function submitBuilder(spec, issueUid) {
    const t = compileBill(spec);
    const inf = t.arena === "senate" ? (t.scope === "galaxy" ? 10 : 5) : 4;
    if (G.influence < inf) return toast("Not enough influence", `Introducing legislation needs ${inf} influence.`);
    if (!spendAP(6)) return;
    applyEffects({ influence: -inf });
    const b = createBill(`custom_${Date.now().toString(36)}`, "player", t);
    b.voteIn = 4; b.fx.startVoteIn = 4;
    if (G.assembly != null && t.arena === "local") b.momentum += (G.assembly - 50) / 3;
    // Nobody else's voters benefit from a one-world law; a galaxy-wide law has natural allies.
    if (t.arena === "senate") b.momentum += t.scope === "galaxy" ? 2 : -3;
    const i = issueUid && (G.issues || []).find(x => x.uid === issueUid);
    if (i) { i.status = "in progress"; b.issueUid = i.uid; }
    report("✍️ Bill introduced", `You introduce the ${b.title}${t.scope === "galaxy" ? ", a law for the whole galaxy" : t.arena === "senate" ? `, a law for ${world().name}` : ""}. It goes to committee now; the vote is in four months.`);
    ui.builder = null;
    view = "chamber"; ui.bill = b.id; ui.arenaSel = b.arena;
    render();
}

// NPC senators introduce their own bills, built from their worlds' needs.
function npcGeneratedBill(a) {
    const sponsor = pick(livingNpcs().filter(n => n.arena === a));
    if (!sponsor) return null;
    const cat = pick(Object.keys(ISSUE_CATS).filter(k => k !== "sovereignty"));
    const spec = { cat, mech: pick(Object.keys(MECHANISMS)), ben: pick(ISSUE_CATS[cat].groups), amount: a === "senate" ? pick([100, 250, 500]) : pick([0.5, 1.5, 3]), funding: a === "senate" ? "appropriations" : "budget", agency: pick(Object.keys(AGENCIES)), years: pick([3, 5, 10]), provisions: [] };
    const t = compileBill(spec);
    t.arena = a;
    const where = worldName(sponsor.world);
    t.title = t.title.replace(world().name, where);
    t.desc = `${sponsor.name}'s bill. ` + t.desc;
    if (a === "senate") {
        t.perYear = null;
        if (chance(40)) {
            t.scope = "galaxy"; t.worldKeys = null;
            t.title = t.title.replace(where, "Galactic");
            t.galPerYear = GAL_EFFECTS[cat] || null;
            t.worldPerYear = { prosperity: 0.6, stability: 0.4 };
        } else {
            t.scope = "planet"; t.worldKeys = [sponsor.world]; t.galPerYear = null;
            t.worldPerYear = { prosperity: 1.5, stability: 0.8 };
        }
    }
    const b = createBill(`npc_${Date.now().toString(36)}${ri(0, 999)}`, sponsor.id, t);
    return b;
}

function openBuilderFor(i) {
    ui.builder = builderDefaults(i ? i.cat : "health");
    ui.builderIssue = i ? i.uid : null;
    if (i && i.g) { const top = Object.entries(i.g).sort((a, b) => b[1] - a[1])[0]; if (top && G.groups[top[0]]) ui.builder.ben = top[0]; }
    view = "issues";
    render();
    const el = document.getElementById("builder");
    if (el) el.scrollIntoView({ behavior: "smooth" });
}

// A tour of the homeworld turns up needs.
function homeTour() {
    if (!spendAP(3)) return;
    const found = [];
    for (let n = 0; n < 2; n++) {
        const d = pick(G.districts);
        const is = addIssue(districtIssue(d, chance(50) ? "observed" : "constituent"), true);
        if (is) found.push(is.title);
    }
    report("Tour of the homeworld", found.length ? `You come back with new problems to solve: ${found.join("; ")}.` : "Everything you see, you've already heard about.");
    render();
}
