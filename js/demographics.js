// Galactic Senate — Population & demographics
// ---------------------------------------------------------------------------
// A real headcount for your world, and the numbers behind it: who lives
// there, how many are born and how many die, how many are poor, out of work
// or without a proper home. Every figure is driven by the systems you already
// touch — healthcare, schools, jobs, welfare laws, war, sieges — and a yearly
// census feeds back into housing, crime and unrest.

const DEMO_POP = {
    coruscant: 1e12, alderaan: 2e9, naboo: 4.5e9, corellia: 3e9, chandrila: 1.2e9, kuat: 4e9, fondor: 2.6e9,
    moncala: 2.7e9, mandalore: 4e9, kashyyyk: 45e6, ryloth: 1.5e9, tatooine: 200e3, ordmantell: 1.9e9, bespin: 6e6,
    geonosis: 100e9, kamino: 1e9, onderon: 600e6, jedha: 11e6, mustafar: 20e3, scarif: 80e3, sullust: 18.5e9,
    dathomir: 9e6, hoth: 5e3, manaan: 150e6, cantonica: 70e6, pantora: 3e9, taris: 6e9, scipio: 900e6,
    umbara: 500e6, rodia: 1.3e9, cato_neimoidia: 800e6
};
const DEMO_POP_RATING = [0, 1e6, 50e6, 800e6, 3e9, 50e9];
// Some species simply live longer.
const DEMO_LIFESPAN = { wookiee: 3.2, muun: 1.4, gungan: 1.1 };
const DEMO_URBAN = { city: 99, industrial: 85, temperate: 62, ocean: 55, desert: 45, forest: 30, gas: 95, jungle: 35, lava: 80, volcanic: 70, swamp: 40, ice: 75, dark: 60 };

function fmtPop(n) {
    const u = [[1e12, "trillion"], [1e9, "billion"], [1e6, "million"]];
    for (const [d, w] of u) if (n >= d) { const v = n / d; return `${v >= 100 ? Math.round(v) : v.toFixed(2).replace(/\.?0+$/, "")} ${w}`; }
    return Math.round(n).toLocaleString("en-US");
}

function initDemo() {
    if (G.demo) return;
    const w = world();
    const r = (w.ratings && w.ratings.population) || 3;
    const pop = DEMO_POP[G.worldKey] || DEMO_POP_RATING[r];
    G.demo = { pop, hist: [] };
    const d = demoCalc();
    G.demo.hist.push(demoSnapshot(d));
}

const pEff = k => (G.policies && G.policies[k] ? G.policies[k].eff : 0);

// Top drivers of a figure, for the one-line "why".
function demoWhy(list) {
    const top = list.filter(([, v]) => Math.abs(v) >= 0.4).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 3);
    const up = top.filter(x => x[1] > 0).map(x => x[0]), down = top.filter(x => x[1] < 0).map(x => x[0]);
    return [up.length ? `pushed up by ${up.join(", ")}` : "", down.length ? `held down by ${down.join(", ")}` : ""].filter(Boolean).join(" · ");
}

// Names a condition by how it actually stands ("poor healthcare", "high crime").
function demoLbl(k) {
    const p = G.planet, wealth = attr("wealth");
    const L = {
        prosperity: wealth >= 3 ? "prosperity" : "poverty",
        healthcare: p.healthcare >= 50 ? "good healthcare" : "poor healthcare",
        education: p.education >= 50 ? "good schooling" : "poor schooling",
        housing: p.housing >= 50 ? "decent housing" : "a housing shortage",
        crime: p.crime >= 40 ? "high crime" : "low crime",
        environment: p.environment >= 50 ? "a clean environment" : "pollution",
        jobs: p.employment >= 55 ? "plentiful jobs" : "joblessness",
        inequality: p.inequality >= 40 ? "inequality" : "equality"
    };
    return L[k] || k;
}

function demoCalc() {
    const p = G.planet, w = world();
    const wealth = attr("wealth");
    const siege = G.siege ? 1 : 0, occ = G.occupied ? 1 : 0, bigWar = (G.gal.war || 0) > 60 ? 1 : 0;
    const life0 = (w.species || []).reduce((m, s) => Math.max(m, DEMO_LIFESPAN[s] || 1), 1);

    // Births per 1,000 people a year.
    const bParts = [
        [demoLbl("education"), -(p.education - 50) * 0.15], [demoLbl("prosperity"), -(wealth - 3) * 3],
        ["child allowance", pEff("child_allowance") * 3], [demoLbl("housing"), (p.housing - 50) * 0.04],
        ["war", -siege * 4 - bigWar * 2 - occ * 2]
    ];
    const births = clamp((30 + bParts.reduce((s, x) => s + x[1], 0)) / Math.sqrt(life0), 4, 45);

    // Infant deaths per 1,000 births.
    const iParts = [
        [demoLbl("healthcare"), -(p.healthcare - 50) * 0.55], [demoLbl("prosperity"), -(wealth - 3) * 5],
        ["clinics & droids", -(pEff("bacta_clinics") * 6 + pEff("med_droids") * 4 + pEff("water_purif") * 5)],
        ["siege", siege * 15 + occ * 5]
    ];
    const infant = clamp(42 + iParts.reduce((s, x) => s + x[1], 0), 2, 140);

    // Life expectancy (standard years).
    const lParts = [
        [demoLbl("healthcare"), (p.healthcare - 50) * 0.25], [demoLbl("prosperity"), (wealth - 3) * 3],
        [demoLbl("environment"), (p.environment - 50) * 0.05], [demoLbl("crime"), -(p.crime - 30) * 0.05],
        ["war", -siege * 6 - occ * 4 - bigWar * 1.5]
    ];
    const life = clamp(64 + lParts.reduce((s, x) => s + x[1], 0), 35, 95) * life0;

    // Deaths per 1,000 a year: old age, infants, violence, war.
    const violent = p.crime * 0.02 + (G.siege ? (G.siege.str || 30) * 0.03 : 0) + occ * 1.5 + (G.war && bigWar ? 0.5 : 0);
    const deaths = clamp(800 / life + births * infant / 1000 + violent, 2, 60);
    const dParts = [["old age", 800 / life - 12], ["infant deaths", births * infant / 1000 - 1], [demoLbl("crime"), p.crime * 0.02 - 0.6], ["war", violent - p.crime * 0.02]];

    // Net migration per 1,000.
    const open = pEff("migration"), refugees = (G.gal.refugees || 0);
    const mParts = [
        [demoLbl("jobs"), (p.employment - 55) * 0.08], [demoLbl("crime"), -(p.crime - 40) * 0.03],
        ["refugee laws", pEff("refugee_resettle") * 3 + pEff("refugee_prog") * 2 + open * (1 + Math.max(0, refugees - 40) * 0.04)],
        ["border controls", -pEff("border_controls") * 1.5], ["war & occupation", -siege * 5 - occ * 3]
    ];
    const migration = clamp(mParts.reduce((s, x) => s + x[1], 0), -30, 25);

    // Hardship.
    const welfare = pEff("food_rations") + pEff("jobseeker") + pEff("child_allowance") + pEff("elder_stipend") + pEff("dividend") + pEff("injury_benefit");
    const povParts = [
        [demoLbl("inequality"), (p.inequality - 40) * 0.35], [demoLbl("jobs"), (60 - p.employment) * 0.4],
        [demoLbl("prosperity"), -(wealth - 3) * 5], ["welfare laws", -welfare * 3], ["siege", siege * 8 + occ * 4]
    ];
    const poverty = clamp(18 + povParts.reduce((s, x) => s + x[1], 0), 1, 85);
    const unemployment = clamp((100 - p.employment) * 0.35 + siege * 4, 1, 60);
    const homeless = clamp((70 - p.housing) * 0.35 + poverty * 0.15 - pEff("rent_control") * 2, 0.3, 60);
    const literacy = clamp(40 + p.education * 0.6 + pEff("schools") * 4 + pEff("holo_archives") * 2, 10, 99.6);

    // People.
    const kids = clamp(births * 0.95, 8, 45);
    const elders = clamp((life / life0 - 50) * 0.55, 3, 30);
    const median = Math.round((14 + (life / life0 - 50) * 0.3 + (30 - births) * 0.55) * life0);
    const urban = clamp((DEMO_URBAN[climate()] || 55) + (p.infrastructure - 50) * 0.15, 5, 99.9);
    const growth = births - deaths + migration;

    return {
        births, deaths, infant, life, migration, growth, poverty, unemployment, homeless, literacy, kids, elders, median, urban,
        why: {
            births: demoWhy(bParts), infant: demoWhy(iParts), life: demoWhy(lParts), deaths: demoWhy(dParts),
            migration: demoWhy(mParts), poverty: demoWhy(povParts)
        }
    };
}

function demoSnapshot(d) {
    return { year: G.year, pop: G.demo.pop, births: d.births, deaths: d.deaths, infant: d.infant, life: d.life, migration: d.migration,
        poverty: d.poverty, unemployment: d.unemployment, homeless: d.homeless, literacy: d.literacy };
}

function speciesMix() {
    const sp = world().species || ["human"];
    const wts = [60, 16, 10, 8, 6].slice(0, sp.length);
    const tot = wts.reduce((a, b) => a + b, 0);
    const other = sp.length > 1 || G.worldKey === "coruscant" ? 4 : 1;
    const out = sp.map((s, i) => [SPECIES[s] ? SPECIES[s].name : s, wts[i] / tot * (100 - other)]);
    out.push(["Other species", other]);
    return out;
}

// The yearly census: population moves, and the numbers push back.
function tickDemo() {
    initDemo();
    const d = demoCalc();
    const before = G.demo.pop;
    G.demo.pop = Math.max(100, Math.round(before * (1 + d.growth / 1000)));
    G.demo.hist.push(demoSnapshot(d));
    if (G.demo.hist.length > 12) G.demo.hist.shift();

    const pct = d.growth / 10;
    // A growing population outruns its housing; a shrinking one leaves jobs empty.
    if (pct > 0.8) G.planet.housing = clamp(G.planet.housing - Math.min(3, pct * 0.8));
    if (pct < -1) G.planet.employment = clamp(G.planet.employment - 1);
    if (d.poverty > 35) { G.planet.crime = clamp(G.planet.crime + 1); G.unrest = clamp(G.unrest + 1); }
    if (d.infant > 60 && G.groups.religious) G.groups.religious.a = clamp(G.groups.religious.a - 1);

    const verb = pct >= 0 ? `grew ${pct.toFixed(1)}%` : `shrank ${Math.abs(pct).toFixed(1)}%`;
    log(`📊 Census: ${world().name} ${verb} to ${fmtPop(G.demo.pop)}. ${d.poverty.toFixed(0)}% live below the poverty line; life expectancy ${Math.round(d.life)}.`, "year");
}

function demoArrow(now, prev, goodUp) {
    if (prev == null) return "";
    const diff = now - prev;
    if (Math.abs(diff) < Math.max(0.05, Math.abs(prev) * 0.01)) return `<span class="muted">·</span>`;
    const good = goodUp ? diff > 0 : diff < 0;
    return `<span class="${good ? "c-for" : "c-against"}">${diff > 0 ? "▲" : "▼"}</span>`;
}

function demographicsPanel() {
    initDemo();
    const d = demoCalc(), pop = G.demo.pop;
    const last = G.demo.hist[G.demo.hist.length - 1];
    const perYear = r => fmtPop(Math.max(0, pop * r / 1000));
    const row = (label, val, detail, why, arrow) => `<tr><td>${label}${why ? `<br><span class="muted small">${why}</span>` : ""}</td><td class="num"><b>${val}</b> ${arrow || ""}</td><td class="muted small">${detail || ""}</td></tr>`;

    const mix = speciesMix().map(([n, s]) => `<span class="hint">${esc(n)} ${s.toFixed(0)}%</span>`).join("");
    const working = 100 - d.kids - d.elders;
    const ages = `<div class="demo-ages"><i style="width:${d.kids}%" class="kids"></i><i style="width:${working}%" class="work"></i><i style="width:${d.elders}%" class="old"></i></div>
        <div class="statrow small"><span>🧒 Children ${d.kids.toFixed(0)}%</span><span>🧑 Working age ${working.toFixed(0)}%</span><span>🧓 Elders ${d.elders.toFixed(0)}%</span></div>`;
    const spark = G.demo.hist.length > 1 ? `<p class="muted small">Past censuses: ${G.demo.hist.slice(-6).map(h => `Y${h.year} ${fmtPop(h.pop)}`).join(" → ")}</p>` : "";
    const g = d.growth / 10;

    return panel(`👥 Population of ${esc(world().name)}`, `
        <div class="demo-head"><div><div class="demo-big">${fmtPop(pop)}</div><span class="muted small">people · last census Year ${last.year}</span></div>
            <div class="demo-growth ${g >= 0 ? "c-for" : "c-against"}"><b>${g >= 0 ? "+" : ""}${g.toFixed(2)}%</b><br><span class="muted small">a year on current trends</span></div></div>
        <div class="hints">${mix}</div>
        <div class="statrow small"><span>🏙️ Urban ${d.urban.toFixed(0)}% · 🌾 Rural ${(100 - d.urban).toFixed(0)}%</span><span>Median age <b>${d.median}</b></span></div>
        ${ages}
        <h4>Life & death</h4>
        <div class="table-wrap"><table>
            ${row("🍼 Births", `${d.births.toFixed(1)}‰`, `≈ ${perYear(d.births)} babies a year`, d.why.births, demoArrow(d.births, last.births, true))}
            ${row("⚰️ Deaths", `${d.deaths.toFixed(1)}‰`, `≈ ${perYear(d.deaths)} a year`, d.why.deaths, demoArrow(d.deaths, last.deaths, false))}
            ${row("👶 Infant mortality", `${d.infant.toFixed(0)}`, "per 1,000 births", d.why.infant, demoArrow(d.infant, last.infant, false))}
            ${row("⏳ Life expectancy", `${Math.round(d.life)} yrs`, "", d.why.life, demoArrow(d.life, last.life, true))}
            ${row("🧳 Net migration", `${d.migration >= 0 ? "+" : ""}${d.migration.toFixed(1)}‰`, d.migration >= 0 ? `≈ ${perYear(d.migration)} arriving a year` : `≈ ${perYear(-d.migration)} leaving a year`, d.why.migration, demoArrow(d.migration, last.migration, true))}
        </table></div>
        <h4>Hardship</h4>
        <div class="table-wrap"><table>
            ${row("🪙 Below the poverty line", `${d.poverty.toFixed(1)}%`, `${fmtPop(pop * d.poverty / 100)} people`, d.why.poverty, demoArrow(d.poverty, last.poverty, false))}
            ${row("📋 Unemployed", `${d.unemployment.toFixed(1)}%`, "of the workforce", "", demoArrow(d.unemployment, last.unemployment, false))}
            ${row("🏚️ Without adequate housing", `${d.homeless.toFixed(1)}%`, `${fmtPop(pop * d.homeless / 100)} people`, "", demoArrow(d.homeless, last.homeless, false))}
            ${row("📖 Literacy", `${d.literacy.toFixed(1)}%`, "", "", demoArrow(d.literacy, last.literacy, true))}
        </table></div>
        ${spark}
        <p class="muted small">‰ = per 1,000 people a year. Arrows compare today's conditions with the last census. Healthcare, schools, jobs, housing, welfare laws and war all move these numbers — and every New Year's census pushes back: fast growth strains housing, deep poverty feeds crime and unrest.</p>
    `, "demo");
}
