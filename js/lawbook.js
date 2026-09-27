// ── THE LAWBOOK — laws before sliders, the annual budget, and the capital program ──
//
// A governor with a legislature can't just move a slider. A law has to be
// drafted and passed before it exists; the executive may then adjust it a
// little each year; anything bigger is an amendment, and ending it is a repeal.
// Absolute rulers decree. Every year the government must pass a budget.

POLICY_CATS.transport = { name: "Transport", color: "#4fb3d9" };
POLICY_CATS.defense = { name: "Security & Defence", color: "#b0b8c8" };
POLICIES.transit.cat = "transport";
POLICIES.spaceport.cat = "transport";
POLICIES.defence_force.cat = "defense";

// cost: billions per month at full level (negative = revenue). defense: added to planetary defence.
Object.assign(POLICIES, {
    // Transport
    skylanes:        { name: "Skylane Traffic Control",     icon: "🚦", cat: "transport", cost: 0.6, fx: { infrastructure: 8, crime: -2 }, g: { urban: 4, business: 2 }, f: { centralists: 1 } },
    repulsor_rail:   { name: "Repulsorlift Rail Network",   icon: "🚄", cat: "transport", cost: 1.6, fx: { infrastructure: 12, environment: 4, employment: 2 }, g: { urban: 5, workers: 3, rural: -1 }, f: { reformers: 1, centralists: 1 } },
    free_transit:    { name: "Free Transit Passes",         icon: "🎫", cat: "transport", cost: 0.9, fx: { inequality: -3, infrastructure: 2 }, g: { youth: 5, students: 4, workers: 3, elites: -2 }, f: { reformers: 2, corporatists: -1 } },
    freight:         { name: "Freight Hauler Subsidies",    icon: "🚚", cat: "transport", cost: 0.7, fx: { employment: 4, infrastructure: 3 }, g: { business: 4, workers: 2 }, f: { corporatists: 2 } },
    landing_pads:    { name: "Settlement Landing Pads",     icon: "🛬", cat: "transport", cost: 0.5, fx: { infrastructure: 5 }, g: { rural: 6, farmers: 4 }, f: { federalists: 2 } },
    autopilot:       { name: "Droid Pilot Licensing",       icon: "🤖", cat: "transport", cost: 0.2, fx: { crime: -2, employment: -1, infrastructure: 2 }, g: { business: 2, workers: -2 }, f: { corporatists: 1 } },
    // Law & order
    droid_patrols:   { name: "Security Droid Patrols",      icon: "🛡️", cat: "law", cost: 0.9, fx: { crime: -10, employment: -2 }, g: { elders: 4, business: 3, youth: -4, workers: -2 }, f: { militarists: 1, corporatists: 1 } },
    holocams:        { name: "Holocam Network",             icon: "📹", cat: "law", cost: 0.4, fx: { crime: -7 }, g: { youth: -5, students: -5, elders: 3 }, f: { militarists: 2, reformers: -3 } },
    constables:      { name: "Community Constables",        icon: "👮", cat: "law", cost: 0.6, fx: { crime: -6, inequality: -1 }, g: { elders: 3, urban: 3, youth: 1 }, f: { reformers: 2 } },
    curfews:         { name: "Curfews",                     icon: "🌙", cat: "law", cost: 0.2, fx: { crime: -8, employment: -2 }, g: { youth: -8, students: -6, business: -2, elders: 3 }, f: { militarists: 2, reformers: -4 } },
    detention:       { name: "Detention Without Trial",     icon: "🔒", cat: "law", cost: 0.3, fx: { crime: -8 }, g: { students: -8, youth: -6, elders: 2 }, f: { militarists: 3, reformers: -7, federalists: -2 }, extreme: true },
    capital_sentence:{ name: "Capital Sentencing",          icon: "⚰️", cat: "law", cost: 0.2, fx: { crime: -3 }, g: { traditional: 3, elders: 2, religious: -2, students: -4 }, f: { traditionalists: 2, reformers: -4 } },
    id_chits:        { name: "Identity Chits",              icon: "🪪", cat: "law", cost: 0.3, fx: { crime: -4 }, g: { youth: -3, traditional: -2, elders: 2 }, f: { centralists: 2, independence: -2, reformers: -1 } },
    spice_ban:       { name: "Spice Prohibition",           icon: "🚫", cat: "law", cost: 0.4, fx: { healthcare: 3, crime: 3 }, g: { religious: 4, elders: 3, youth: -4 }, f: { traditionalists: 2 } },
    blaster_permits: { name: "Blaster Permits",             icon: "🔫", cat: "law", cost: 0.1, fx: { crime: -5 }, g: { urban: 3, elders: 2, rural: -5, veterans: -3, traditional: -2 }, f: { reformers: 1, federalists: -1 } },
    bounty_licensing:{ name: "Bounty Hunter Licensing",     icon: "🎯", cat: "law", cost: -0.2, fx: { crime: -4 }, g: { business: 2, youth: -1 }, f: { corporatists: 1 } },
    anti_slicing:    { name: "Anti-Slicing Division",       icon: "💻", cat: "law", cost: 0.4, fx: { crime: -4 }, g: { business: 4 }, f: { corporatists: 1 } },
    penal_colony:    { name: "Penal Colonies",              icon: "🏝️", cat: "law", cost: 0.5, fx: { crime: -6, environment: -2 }, g: { elders: 3, youth: -3 }, f: { militarists: 1, reformers: -3 } },
    private_detention:{ name: "Private Detention Contracts", icon: "🏢", cat: "law", cost: 0.2, fx: { crime: -3, inequality: 2 }, g: { business: 3, students: -3 }, f: { corporatists: 3, reformers: -3 } },
    anti_corruption: { name: "Anti-Corruption Office",      icon: "🧾", cat: "law", cost: 0.3, fx: { crime: -2, inequality: -1 }, g: { students: 2, workers: 2, elites: -3 }, f: { reformers: 3 } },
    // Public services
    bacta_clinics:   { name: "Bacta Tank Clinics",          icon: "🧪", cat: "services", cost: 1.2, fx: { healthcare: 10 }, g: { elders: 6, veterans: 6, workers: 2 }, f: { reformers: 2 } },
    med_droids:      { name: "Medical Droid Program",       icon: "🩺", cat: "services", cost: 0.9, fx: { healthcare: 8, employment: -2 }, g: { elders: 4, rural: 3, workers: -2 }, f: { corporatists: 1 } },
    holo_archives:   { name: "HoloNet Archives & Libraries", icon: "📚", cat: "services", cost: 0.3, fx: { education: 5 }, g: { students: 4, youth: 2 }, f: { reformers: 1 } },
    tech_academies:  { name: "Technical Academies",         icon: "🔧", cat: "services", cost: 0.8, fx: { education: 6, employment: 4 }, g: { workers: 4, youth: 4, business: 2 }, f: { corporatists: 1, reformers: 1 } },
    flight_academy:  { name: "Flight Academies",            icon: "✈️", cat: "services", cost: 0.6, fx: { education: 3, employment: 3 }, g: { youth: 5, military: 3 }, f: { militarists: 1 } },
    research:        { name: "Research Institutes",         icon: "🔬", cat: "services", cost: 0.8, fx: { education: 5, employment: 2 }, g: { students: 5, elites: 2 }, f: { centralists: 1 } },
    school_meals:    { name: "Free School Meals",           icon: "🍲", cat: "services", cost: 0.5, fx: { education: 3, healthcare: 3, inequality: -2 }, g: { workers: 4, youth: 2 }, f: { reformers: 2 } },
    cloning_research:{ name: "Cloning & Genetic Research",  icon: "🧬", cat: "services", cost: 0.7, fx: { healthcare: 4, employment: 2 }, g: { students: 3, religious: -8, traditional: -6 }, f: { corporatists: 1, traditionalists: -3 } },
    water_purif:     { name: "Vaporators & Water Purification", icon: "💧", cat: "services", cost: 0.7, fx: { healthcare: 4, infrastructure: 4 }, g: { rural: 5, farmers: 5 }, f: { federalists: 1 } },
    broadcaster:     { name: "Planetary HoloNet Broadcaster", icon: "📺", cat: "services", cost: 0.4, fx: { education: 2 }, g: { elders: 2, youth: -1 }, f: { centralists: 2 } },
    disaster_corps:  { name: "Disaster Preparedness Corps", icon: "🚨", cat: "services", cost: 0.4, fx: { infrastructure: 1 }, g: { rural: 2, elders: 2 }, f: { federalists: 1 }, disaster: 0.5 },
    // Taxes
    sales_tax:       { name: "Trade Goods Levy",            icon: "🧾", cat: "tax", cost: -1.2, fx: { inequality: 3 }, g: { workers: -3, business: -2, youth: -2 }, f: { corporatists: -1 } },
    luxury_tax:      { name: "Luxury Goods Tax",            icon: "💎", cat: "tax", cost: -0.6, fx: { inequality: -3 }, g: { elites: -7, business: -1 }, f: { reformers: 2, corporatists: -2 } },
    property_tax:    { name: "Estate & Property Tax",       icon: "🏠", cat: "tax", cost: -0.9, fx: { inequality: -4, housing: 2 }, g: { elites: -6, elders: -3, business: -2 }, f: { reformers: 1, corporatists: -2 } },
    starship_fees:   { name: "Starship Registry Fees",      icon: "🚀", cat: "tax", cost: -0.5, fx: {}, g: { business: -2, elites: -2 }, f: { corporatists: -1 } },
    docking_duties:  { name: "Spaceport Docking Duties",    icon: "⚓", cat: "tax", cost: -0.8, fx: { employment: -2 }, g: { business: -3, workers: -1 }, f: { corporatists: -2 } },
    droid_tax:       { name: "Droid Labour Tax",            icon: "🦾", cat: "tax", cost: -0.5, fx: { employment: 3 }, g: { business: -4, unions: 4, workers: 3 }, f: { corporatists: -2, reformers: 1 } },
    head_tax:        { name: "Flat Head Tax",               icon: "🪙", cat: "tax", cost: -1.0, fx: { inequality: 6 }, g: { workers: -5, youth: -3, elites: 3 }, f: { corporatists: 2, reformers: -3 } },
    estate_duty:     { name: "Noble Estate Duty",           icon: "🏰", cat: "tax", cost: -0.5, fx: { inequality: -3 }, g: { elites: -6, traditional: -3 }, f: { reformers: 2, traditionalists: -2 } },
    spice_tax:       { name: "Legal Spice Trade",           icon: "🌶️", cat: "tax", cost: -0.6, fx: { crime: -4, healthcare: -4 }, g: { religious: -6, traditional: -4, youth: 3, business: 2 }, f: { corporatists: 1, traditionalists: -3 } },
    gambling:        { name: "Licensed Gambling Halls",     icon: "🎲", cat: "tax", cost: -0.5, fx: { crime: 3, employment: 2 }, g: { religious: -6, business: 3, youth: 1 }, f: { corporatists: 2, traditionalists: -2 } },
    // Economy
    agri_subsidies:  { name: "Agricultural Subsidies",      icon: "🌾", cat: "economy", cost: 0.8, fx: { employment: 3, environment: -2 }, g: { farmers: 8, rural: 4, urban: -1 }, f: { federalists: 1 } },
    hydroponics:     { name: "Hydroponic Farm Grants",      icon: "🥬", cat: "economy", cost: 0.5, fx: { employment: 2, healthcare: 1 }, g: { urban: 3, farmers: -1 }, f: { reformers: 1 } },
    small_business:  { name: "Small Business Grants",       icon: "🏪", cat: "economy", cost: 0.6, fx: { employment: 4, inequality: -1 }, g: { business: 4, youth: 3 }, f: { corporatists: 1, federalists: 1 } },
    shipyard:        { name: "Shipyard Contracts",          icon: "⚓", cat: "economy", cost: 1.2, fx: { employment: 7, environment: -3 }, g: { workers: 5, military: 3, environmentalists: -3 }, f: { militarists: 2, corporatists: 1 } },
    clean_energy:    { name: "Solar & Fusion Subsidies",    icon: "☀️", cat: "economy", cost: 0.9, fx: { environment: 8, employment: 2 }, g: { environmentalists: 7, youth: 2, business: -1 }, f: { reformers: 2 } },
    droid_automation:{ name: "Droid Automation Incentives", icon: "🦿", cat: "economy", cost: 0.6, fx: { employment: -4, infrastructure: 4, inequality: 3 }, g: { business: 7, unions: -8, workers: -6 }, f: { corporatists: 3, reformers: -2 } },
    consumer_rights: { name: "Consumer Protections",        icon: "🛒", cat: "economy", cost: 0.1, fx: { inequality: -2 }, g: { workers: 2, urban: 2, business: -3 }, f: { reformers: 1, corporatists: -1 } },
    work_safety:     { name: "Work Safety Code",            icon: "⛑️", cat: "economy", cost: 0.1, fx: { healthcare: 3, employment: -1 }, g: { unions: 5, workers: 3, business: -3 }, f: { reformers: 1 } },
    guild_charters:  { name: "Guild & Union Charters",      icon: "🤝", cat: "economy", cost: 0, fx: { inequality: -4 }, g: { unions: 8, workers: 4, business: -5 }, f: { reformers: 2, corporatists: -3 } },
    corp_incentives: { name: "Corporate Relocation Incentives", icon: "🏙️", cat: "economy", cost: 0.8, fx: { employment: 6, inequality: 3 }, g: { business: 6, elites: 3, unions: -2 }, f: { corporatists: 3 } },
    banking_reg:     { name: "Banking Regulation",          icon: "🏦", cat: "economy", cost: 0.1, fx: { inequality: -2, employment: -1 }, g: { elites: -3, business: -2, workers: 1 }, f: { reformers: 2, corporatists: -2 } },
    salvage:         { name: "Salvage & Recycling Program", icon: "♻️", cat: "economy", cost: 0.3, fx: { environment: 5, employment: 2 }, g: { environmentalists: 4, workers: 1 }, f: { reformers: 1 } },
    settlement_grants:{ name: "Settlement Development Grants", icon: "🏜️", cat: "economy", cost: 0.6, fx: { infrastructure: 4, employment: 2 }, g: { rural: 6, farmers: 3 }, f: { federalists: 2 } },
    // Welfare
    child_allowance: { name: "Child Allowance",             icon: "🍼", cat: "welfare", cost: 0.8, fx: { inequality: -3 }, g: { workers: 4, youth: 3, religious: 2 }, f: { reformers: 2 } },
    injury_benefit:  { name: "Injury & Disability Benefit", icon: "🦽", cat: "welfare", cost: 0.6, fx: { inequality: -2, healthcare: 2 }, g: { veterans: 5, elders: 3, workers: 2 }, f: { reformers: 1 } },
    food_rations:    { name: "Food Ration Programme",       icon: "🥫", cat: "welfare", cost: 0.9, fx: { inequality: -3, healthcare: 3, crime: -2 }, g: { workers: 4, rural: 3, elites: -1 }, f: { reformers: 2 } },
    rent_control:    { name: "Rent Controls",               icon: "🔑", cat: "welfare", cost: 0, fx: { inequality: -3, housing: 2 }, g: { urban: 5, youth: 4, elites: -5, business: -3 }, f: { reformers: 2, corporatists: -3 } },
    elder_stipend:   { name: "Elder Stipends",              icon: "🧓", cat: "welfare", cost: 1.0, fx: { inequality: -2 }, g: { elders: 10, youth: -1 }, f: { reformers: 1, traditionalists: 1 } },
    jobseeker:       { name: "Jobseeker Allowance",         icon: "📋", cat: "welfare", cost: 0.8, fx: { inequality: -3, crime: -2, employment: -1 }, g: { workers: 4, youth: 4, business: -2 }, f: { reformers: 2, corporatists: -1 } },
    fraud_office:    { name: "Benefits Fraud Office",       icon: "🕵️", cat: "welfare", cost: 0.1, fx: { inequality: 1 }, g: { elders: 2, business: 1, workers: -2 }, f: { corporatists: 1, reformers: -1 } },
    refugee_resettle:{ name: "Refugee Resettlement",        icon: "🧳", cat: "welfare", cost: 0.6, fx: { employment: 2, housing: -2 }, g: { religious: 2, traditional: -4 }, f: { reformers: 3, traditionalists: -2 } },
    // Security & defence
    border_controls: { name: "Border & Customs Controls",   icon: "🛃", cat: "defense", cost: 0.5, fx: { crime: -3, employment: -1 }, g: { traditional: 3, elders: 2, business: -2 }, f: { traditionalists: 2, reformers: -2 } },
    citizenship:     { name: "Citizenship Trials",          icon: "📜", cat: "defense", cost: 0.1, fx: {}, g: { traditional: 4, youth: -2 }, f: { traditionalists: 2, reformers: -3 } },
    militia:         { name: "Planetary Militia Service",   icon: "🎖️", cat: "defense", cost: 0.4, fx: { employment: 2, crime: -2 }, g: { military: 5, veterans: 3, youth: -6, students: -4 }, f: { militarists: 3, reformers: -2 }, defense: 12 },
    shield_gen:      { name: "Planetary Shield Generator",  icon: "🔰", cat: "defense", cost: 1.0, fx: {}, g: { military: 3, elders: 2 }, f: { militarists: 2 }, defense: 22 },
    orbital_def:     { name: "Orbital Defence Platforms",   icon: "🛰️", cat: "defense", cost: 1.4, fx: { employment: 1 }, g: { military: 5 }, f: { militarists: 3, reformers: -1 }, defense: 30 },
    republic_relief: { name: "Contributions to Republic Relief", icon: "🌌", cat: "defense", cost: 0.5, fx: {}, g: { religious: 2 }, f: { reformers: 2, centralists: 2, federalists: -2, independence: -2 } },
    // Society
    species_equality:{ name: "Species Equality Act",        icon: "🤝", cat: "society", cost: 0.1, fx: { inequality: -3, crime: -1 }, g: { youth: 3, students: 3, traditional: -3 }, f: { reformers: 3, traditionalists: -2 } },
    droid_rights:    { name: "Droid Rights Charter",        icon: "🤖", cat: "society", cost: 0, fx: { employment: -1 }, g: { students: 3, business: -4, workers: 1 }, f: { reformers: 2, corporatists: -2 } },
    temple_protection:{ name: "Temple & Shrine Protections", icon: "🛕", cat: "society", cost: 0.2, fx: {}, g: { religious: 7, traditional: 4 }, f: { traditionalists: 2 } },
    press_charter:   { name: "Press Freedom Charter",       icon: "🗞️", cat: "society", cost: 0, fx: { education: 2 }, g: { students: 4, youth: 2 }, f: { reformers: 3, militarists: -2 } },
    patriotic_broadcasts:{ name: "Patriotic Broadcasts",    icon: "📣", cat: "society", cost: 0.2, fx: {}, g: { elders: 2, military: 2, students: -4, youth: -2 }, f: { centralists: 2, militarists: 2, reformers: -2 } },
    loyalty_oaths:   { name: "Loyalty Oaths",               icon: "✋", cat: "society", cost: 0.1, fx: {}, g: { students: -6, youth: -5, military: 3 }, f: { militarists: 3, centralists: 2, reformers: -6 }, extreme: true, era: ["war", "empire", "rebellion"] },
    species_registry:{ name: "Species Registration",        icon: "📇", cat: "society", cost: 0.2, fx: { inequality: 5, crime: -2 }, g: { traditional: -3, students: -6, youth: -4 }, f: { centralists: 3, reformers: -8, independence: -3 }, extreme: true, era: ["empire", "rebellion"] }
});

function policyAvailable(k) {
    const d = POLICIES[k];
    if (d.era && !d.era.includes(G.era)) return false;
    if (d.war && !wartime()) return false;
    return true;
}

// Saves from before the lawbook: add the new laws, not yet enacted.
function initLawbook() {
    Object.keys(POLICIES).forEach(k => { if (!G.policies[k]) G.policies[k] = { level: 0, eff: 0 }; });
    if (!G.pbudget) G.pbudget = { cats: {}, cip: 3, taxes: {}, status: "adopted", draft: null, billId: null, pending: null, history: [] };
    if (!G.cip) G.cip = { queue: [], committed: 0, remaining: 3, frozen: false };
    if (!G.streams) G.streams = [];
    if (!G.packages) G.packages = [];
    if (!G.pgroups) G.pgroups = {};
    if (!G.adjusted) G.adjusted = {};
}


// ── Who may change a law, and how ─────────────────────────────────

function rulesByDecree() {
    const k = G.office.kind;
    return !!G.autocrat || ["hereditary", "council"].includes(k) || (k === "monarch" && G.const.monarchy === "absolute");
}

function policyPending(k) { return G.bills.some(b => b.policyKey === k); }

function adjustPolicy(k, dir) {
    initLawbook();
    const p = G.policies[k];
    if (POLICIES[k].cat === "tax") return toast("Set in the budget", "Tax rates are set in the annual budget, not by executive order.");
    if (G.adjusted[k] != null && monthsNow() - G.adjusted[k] < 12) return toast("Already adjusted this year", "The executive can adjust a law once a year. Anything more needs an amendment.");
    const nl = Math.round(clamp(p.level + dir * 0.1, 0.1, 1) * 100) / 100;
    if (nl === p.level) return;
    if (!spendAP(3)) return;
    G.adjusted[k] = monthsNow();
    const d = nl - p.level;
    p.level = nl;
    const e = { f: {}, g: {} };
    Object.entries(POLICIES[k].f || {}).forEach(([f, v]) => { e.f[f] = v * d * 5; });
    Object.entries(POLICIES[k].g || {}).forEach(([gk, v]) => { e.g[gk] = v * d * 0.5; });
    report(`Executive adjustment: ${POLICIES[k].name}`, `Within the law's authority, you ${d > 0 ? "strengthen" : "scale back"} ${POLICIES[k].name} (now ${levelWord(nl)}).`, applyEffects(e));
    render();
}

// The policy panel's controls, depending on who you are.
function lawControls(k) {
    initLawbook();
    const d = POLICIES[k], p = G.policies[k];
    const lvl = Math.round(p.level * 100);
    const enacted = p.level > 0;
    const pending = policyPending(k);
    const avail = policyAvailable(k);
    if (!avail && !enacted) return `<p class="muted small">${d.era ? "Not available in this era." : "Only in wartime, under attack, or in a declared emergency."}</p>`;
    if (governing() && (rulesByDecree() || d.cat === "emergency")) {
        return `<p class="small c-und">${d.cat === "emergency" && !rulesByDecree() ? "Emergency powers let you act by decree." : "You rule by decree. Your word is law."}</p>
            <label class="muted small">New level: <b id="slv">${lvl}%</b></label>
            <input type="range" min="0" max="100" step="10" value="${lvl}" id="policySlider" data-key="${k}">
            <div class="row"><button class="primary" data-act="setpolicy" data-key="${k}" data-gal="0">Decree <em id="pcost">—</em></button></div>`;
    }
    const canBill = arena() === "local" && G.office.kind !== "outsider";
    if (!canBill && !governing()) return `<p class="muted small">You don't control this law. The planetary government does — you can only lobby, campaign, or take its place.</p>`;
    if (pending) return `<p class="small c-und">A bill on ${esc(d.name)} is before the legislature. <button class="mini" data-act="view" data-v="chamber">To the floor →</button></p>`;
    if (!enacted) return `<p class="small">This law does not exist yet. Draft it, choose how strong it starts, and pass it through the legislature.</p>
        <label class="muted small">Initial level: <b id="slv">30%</b></label>
        <input type="range" min="10" max="100" step="10" value="30" id="policySlider" data-key="${k}">
        <div class="row"><button class="primary" data-act="policybill" data-key="${k}">Draft the ${esc(d.name)} Act <em>4 capital</em></button></div>`;
    const tax = d.cat === "tax";
    const adjustedRecently = G.adjusted[k] != null && monthsNow() - G.adjusted[k] < 12;
    return `${governing() && !tax ? `<h4>Executive adjustment</h4><p class="muted small">Once a year, within the law's authority: ±10%.${adjustedRecently ? " Used this year." : ""}</p>
            <div class="row"><button class="secondary" data-act="adjustpolicy" data-key="${k}" data-d="-1" ${adjustedRecently || G.ap < 3 ? "disabled" : ""}>− 10% · 3</button><button class="secondary" data-act="adjustpolicy" data-key="${k}" data-d="1" ${adjustedRecently || G.ap < 3 ? "disabled" : ""}>+ 10% · 3</button></div>` : ""}
        ${tax && governing() ? '<p class="muted small">Tax rates are set in the annual budget (Policy → Budget).</p>' : ""}
        <h4>Amend the law</h4>
        <label class="muted small">New level: <b id="slv">${lvl}%</b></label>
        <input type="range" min="10" max="100" step="10" value="${lvl}" id="policySlider" data-key="${k}">
        <div class="row"><button class="secondary" data-act="policybill" data-key="${k}">Propose an amendment <em>4 capital</em></button>
        <button class="secondary" data-act="repealbill" data-key="${k}" ${G.ap < 4 ? "disabled" : ""}>Propose repeal <em>4 capital</em></button></div>`;
}

// Enacted laws, and laws on their way through the legislature, make up the web.
function webPolicies() {
    initLawbook();
    return Object.fromEntries(Object.entries(POLICIES).filter(([k]) => G.policies[k].level > 0 || policyPending(k) || ui.policy === `p:${k}`));
}


// ── The annual budget ─────────────────────────────────────────────

const SPEND_CATS = ["services", "welfare", "law", "economy", "env", "society", "transport", "defense"];

function fundMult(cat) {
    if (!G.pbudget || cat === "tax" || cat === "emergency") return 1;
    const v = G.pbudget.cats[cat];
    return v == null ? 1 : v;
}
function fundFactor(cat) { return 1 + (fundMult(cat) - 1) * 0.6; }

function budgetExtras() {
    const streams = (G.streams || []).reduce((s, x) => s + x.perMonth, 0);
    const cip = G.cip ? G.cip.committed / 12 : 0;
    const pk = (G.packages || []).filter(p => p.status === "active").reduce((s, p) => s + p.monthly, 0);
    return { income: streams, spend: cip + pk, cip, packages: pk, streams };
}

function budgetEditable() { return governing() && ["drafting", "rejected"].includes(G.pbudget.status); }

function draftBudget() {
    const pb = G.pbudget;
    const taxes = {};
    Object.keys(POLICIES).filter(k => POLICIES[k].cat === "tax" && G.policies[k].level > 0).forEach(k => { taxes[k] = G.policies[k].level; });
    pb.draft = { cats: Object.fromEntries(SPEND_CATS.map(c => [c, fundMult(c)])), cip: pb.cip, taxes };
}

function setDraft(field, value) {
    const d = G.pbudget.draft;
    if (!d) return;
    const [kind, key] = field.split(":");
    if (kind === "cat") d.cats[key] = +value;
    if (kind === "tax") d.taxes[key] = Math.round(+value) / 100;
    if (kind === "cip") d.cip = +value;
}

// Project the draft over a year.
function projectBudget(d = G.pbudget.draft) {
    let income = (1 + (G.planet.employment - 40) * 0.03) * taxBaseMultiplier() * 12;
    const lines = {};
    let spend = 0;
    Object.entries(G.policies).forEach(([k, p]) => {
        const def = POLICIES[k];
        if (def.cat === "tax") { const lv = d && d.taxes[k] != null ? d.taxes[k] : p.level; income += -def.cost * lv * 12; return; }
        const c = def.cost * p.level * 12;
        if (c < 0) { income -= c; return; }
        const m = d && d.cats[def.cat] != null ? d.cats[def.cat] : fundMult(def.cat);
        lines[def.cat] = (lines[def.cat] || 0) + c * m;
        spend += c * m;
    });
    const ex = budgetExtras();
    income += ex.streams * 12;
    const cip = d ? d.cip : G.pbudget.cip;
    const pk = ex.packages * 12;
    const interest = G.treasury < 0 ? -G.treasury * 0.012 * 12 : 0;
    const total = spend + cip + pk + interest;
    return { income, lines, spend, cip, pk, interest, total, net: income - total };
}

function budgetStance(d) {
    const st = {};
    const add = (f, v) => { st[f] = (st[f] || 0) + v; };
    const pr = projectBudget(d);
    if (pr.net < 0) { const s = Math.min(2.5, -pr.net / 6); add("corporatists", -s); add("traditionalists", -s * 0.6); add("federalists", -s * 0.5); }
    SPEND_CATS.forEach(c => {
        const dm = (d.cats[c] || 1) - fundMult(c);
        if (!dm) return;
        add("reformers", dm * 8);
        add("corporatists", -dm * 5);
        if (c === "defense" || c === "law") add("militarists", dm * 8);
        if (c === "society") add("traditionalists", dm * 4);
    });
    Object.entries(d.taxes).forEach(([k, lv]) => { const dt = lv - G.policies[k].level; add("corporatists", -dt * 10); add("reformers", dt * 4); });
    const dc = d.cip - G.pbudget.cip;
    add("federalists", dc * 0.3); add("centralists", dc * 0.2);
    Object.keys(st).forEach(k => { st[k] = clamp(Math.round(st[k]), -3, 3); });
    return st;
}

function submitBudget() {
    const pb = G.pbudget;
    if (!pb.draft) draftBudget();
    const fy = eraYear(currentBBY() - 1);
    if (rulesByDecree()) {
        if (!spendAP(2)) return;
        pb.pending = JSON.parse(JSON.stringify(pb.draft)); pb.status = "passed";
        report("📜 Budget decreed", `You issue the ${fy} budget by decree. It takes effect in the new year.`);
        return render();
    }
    if (!spendAP(3)) return;
    const d = pb.draft;
    const pr = projectBudget(d);
    const stance = budgetStance(d);
    const g = {};
    SPEND_CATS.forEach(c => {
        const dm = (d.cats[c] || 1) - fundMult(c);
        if (!dm) return;
        Object.entries(POLICIES).filter(([k, def]) => def.cat === c && G.policies[k].level > 0).forEach(([k, def]) => Object.entries(def.g).forEach(([gk, v]) => { if (v > 0) g[gk] = (g[gk] || 0) + v * dm * G.policies[k].level; }));
    });
    const b = createBill(`budget_${G.year}_${G.month}`, "player", { arena: "local", title: `The ${fy} Planetary Budget`, desc: `Revenue ${pr.income.toFixed(1)}B, spending ${pr.total.toFixed(1)}B (including ${pr.cip.toFixed(1)}B for capital projects) — ${pr.net >= 0 ? `a surplus of ${pr.net.toFixed(1)}B` : `a deficit of ${(-pr.net).toFixed(1)}B`}.`, stance, g, treasury: 0 });
    b.budgetBill = true; b.voteIn = Math.max(1, 12 - G.month); b.budgetDraft = JSON.parse(JSON.stringify(d));
    b.momentum += 3 + Math.min(4, d.cip * 0.6);
    pb.status = "submitted"; pb.billId = b.id;
    report("💰 Budget submitted", `Your ${fy} budget goes to the ${arenaName("local")}. The vote is in ${b.voteIn} month${b.voteIn > 1 ? "s" : ""}. Every legislator wants something.`);
    view = "chamber"; ui.bill = b.id; ui.arenaSel = "local";
    render();
}

function budgetPassed(b) {
    const pb = G.pbudget;
    pb.pending = b.budgetDraft; pb.status = "passed";
    G.record.agreements.push(`Passed the ${eraYear(currentBBY() - 1)} planetary budget`);
    report("✅ Budget passed", "The legislature passes your budget. It takes effect in the new fiscal year.");
}

function budgetRejected(b) {
    G.pbudget.status = "rejected";
    report("❌ Budget rejected", G.month >= 12 ? "The legislature rejects your budget. Without a budget, the new year starts under a continuing resolution." : "The legislature rejects your budget. Revise it and resubmit before the new year — or govern under a continuing resolution.", applyEffects({ influence: -3, trust: -2 }));
}

// January: the new fiscal year.
function newFiscalYear() {
    const pb = G.pbudget;
    const gov = governing();
    if (pb.pending) {
        const d = pb.pending;
        const old = { ...pb.cats };
        pb.cats = { ...d.cats }; pb.cip = d.cip;
        Object.entries(d.taxes).forEach(([k, lv]) => { if (G.policies[k]) G.policies[k].level = lv; });
        pb.status = "adopted"; pb.pending = null;
        G.cip.frozen = false;
        // Groups feel cuts and increases.
        const e = { g: {} };
        SPEND_CATS.forEach(c => { const dm = (pb.cats[c] || 1) - (old[c] || 1); if (!dm) return; Object.entries(POLICIES).filter(([k, def]) => def.cat === c && G.policies[k].level > 0).forEach(([k, def]) => Object.entries(def.g).forEach(([gk, v]) => { e.g[gk] = (e.g[gk] || 0) + v * dm * G.policies[k].level * 0.6; })); });
        if (gov) applyEffects(e);
    } else if (gov && !rulesByDecree()) {
        pb.status = "continuing"; G.cip.frozen = true;
        report("⏸️ Continuing resolution", "No budget passed. The government runs on last year's numbers, and no new capital projects can start until a budget is adopted.", applyEffects({ trust: -3, rep: -2 }));
    } else pb.status = "adopted";
    pb.history.unshift({ year: eraYear(currentBBY()), status: pb.status, cip: pb.cip });
    if (pb.history.length > 10) pb.history.length = 10;
    // The capital program starts the year.
    G.cip.committed = 0;
    G.cip.remaining = G.cip.frozen ? 0 : pb.cip;
    fundCip();
}


// ── The Capital Improvement Program ──────────────────────────────

function addToCip(item) {
    initLawbook();
    if (G.cip.queue.some(q => q.key === item.key && q.status !== "done")) return toast("Already in the program", `${item.name} is already in the capital program.`);
    G.cip.queue.push({ ...item, status: "queued", added: monthsNow() });
    fundCip();
}

function fundCip() {
    const c = G.cip;
    if (c.frozen) return;
    c.queue.filter(q => q.status === "queued").forEach(q => {
        if (q.cost <= c.remaining + 0.001) {
            c.remaining -= q.cost; c.committed += q.cost;
            q.status = "building";
            G.projects.push({ key: q.key, name: q.name, fx: q.fx, g: q.g, monthsLeft: q.months || 4 + Math.round(q.cost * 2), cost: Math.round(q.cost * 100), cat: q.cat, district: q.district, cip: true });
            report(`🏗️ Capital program: ${q.name}`, `Funded from this year's capital budget (${q.cost.toFixed(1)}B). Construction begins.`);
        }
    });
}

function cipMove(i, d) {
    const q = G.cip.queue;
    const waiting = q.filter(x => x.status === "queued");
    const item = waiting[i]; const other = waiting[i + d];
    if (!item || !other) return;
    const a = q.indexOf(item), b = q.indexOf(other);
    [q[a], q[b]] = [q[b], q[a]];
    render();
}

function cipRemove(i) {
    const waiting = G.cip.queue.filter(x => x.status === "queued");
    const item = waiting[i];
    if (!item) return;
    G.cip.queue = G.cip.queue.filter(x => x !== item);
    const iss = (G.issues || []).find(x => x.uid === item.key);
    if (iss) iss.status = "open";
    render();
}

function tickCip() {
    G.cip.queue.filter(q => q.status === "building").forEach(q => {
        const p = G.projects.find(x => x.key === q.key);
        if (!p || p.monthsLeft <= 0) q.status = "done";
    });
    G.cip.queue = G.cip.queue.filter(q => q.status !== "done" || monthsNow() - q.added < 24);
}


// ── Fiscal notes: what a bill costs, before you vote ─────────────

function fiscalNote(b) {
    const f = b.fx || {};
    if (b.budgetBill) return b.desc;
    if (b.packageBill) { const p = (G.packages || []).find(x => x.id === b.packageId) || b.pkgSpec; return p ? `${p.total.toFixed(1)}B over ${p.years} years (${(p.total / p.years).toFixed(1)}B a year). ${p.fundingText || ""}` : "A multi-year package."; }
    if (b.policyKey) {
        const def = POLICIES[b.policyKey];
        const d = (b.policyLevel - G.policies[b.policyKey].level) * def.cost * 12;
        if (!d) return "No direct cost.";
        return def.cost < 0 ? `${d < 0 ? "Raises" : "Loses"} about ${Math.abs(d).toFixed(1)}B a year in revenue.` : `${d > 0 ? "Costs" : "Saves"} about ${Math.abs(d).toFixed(1)}B a year.`;
    }
    const parts = [];
    if (f.custom) parts.push(b.arena === "senate" ? `${f.cost}M credits of Republic funds${f.duration ? ` over ${f.duration} years` : ""}` : `${f.cost}B from the planetary treasury${f.duration ? ` over ${f.duration} years` : ""}`);
    else if (f.treasury) parts.push(f.treasury < 0 ? `${(-f.treasury).toFixed(1)}B from the planetary treasury` : `raises ${f.treasury.toFixed(1)}B for the treasury`);
    if (f.program) parts.push(`a ${f.program.years}-year program`);
    if (f.gal && f.gal.military > 0) parts.push("significant military spending");
    if (!parts.length) return b.arena === "senate" ? "No significant cost to Republic funds." : "No direct cost to the planetary treasury.";
    return parts.join(" · ").replace(/^./, c => c.toUpperCase()) + ".";
}


// ── Panels ────────────────────────────────────────────────────────

function govTabs() {
    const t = ui.govTab || "web";
    const tabs = [["web", "🕸️ Policy web"], ["laws", "📚 Lawbook"], ["budget", "💰 Budget & capital program"], ["packages", "🏗️ Investment packages"], ["trade", "🚀 Trade"], ["pressure", "✊ Pressure groups"]];
    return `<div class="tabs gov-tabs">${tabs.map(([k, l]) => `<button class="tab ${t === k ? "active" : ""}" data-act="govtab" data-t="${k}">${l}</button>`).join("")}</div>`;
}

function lawbookView() {
    initLawbook();
    const cats = Object.keys(POLICY_CATS);
    const decree = governing() && rulesByDecree();
    return `<div class="era-banner"><b>THE LAWBOOK</b> · ${decree ? "You rule by decree: any law, any time." : governing() ? "A law must pass the legislature before it exists. Then you can adjust it a little each year." : "You can propose laws to the legislature, but the government decides how to run them."}</div>
        <div class="lawbook">${cats.map(c => {
            const keys = Object.keys(POLICIES).filter(k => POLICIES[k].cat === c && (policyAvailable(k) || G.policies[k].level > 0));
            if (!keys.length) return "";
            return `<section class="panel lawcat"><h3 style="color:${POLICY_CATS[c].color}">${POLICY_CATS[c].name}</h3>${keys.map(k => {
                const d = POLICIES[k], p = G.policies[k];
                const on = p.level > 0, pend = policyPending(k);
                return `<button class="law ${on ? "on" : ""} ${pend ? "pending" : ""}" data-act="lawpick" data-key="${k}"><span>${d.icon} ${esc(d.name)}${d.extreme ? ' <em class="c-against">extreme</em>' : ""}</span><span class="small ${on ? "c-for" : "muted"}">${pend ? "before the legislature" : on ? levelWord(p.level) : "not law"}</span></button>`;
            }).join("")}</section>`;
        }).join("")}</div>`;
}

function budgetView() {
    initLawbook();
    const pb = G.pbudget;
    const gov = governing();
    const editable = budgetEditable();
    if (editable && !pb.draft) draftBudget();
    const d = editable ? pb.draft : { cats: Object.fromEntries(SPEND_CATS.map(c => [c, fundMult(c)])), cip: pb.cip, taxes: Object.fromEntries(Object.keys(POLICIES).filter(k => POLICIES[k].cat === "tax" && G.policies[k].level > 0).map(k => [k, G.policies[k].level])) };
    const pr = projectBudget(d);
    const statusText = { adopted: "The budget is in force for this fiscal year.", drafting: "Budget season: draft next year's budget and submit it before Month 12.", submitted: "Your budget is before the legislature.", passed: "Next year's budget has passed. It takes effect in January.", rejected: "The legislature rejected your budget. Revise and resubmit.", continuing: "No budget passed: the government is running under a continuing resolution." }[pb.status];
    const catRows = SPEND_CATS.filter(c => pr.lines[c] || d.cats[c] !== 1).map(c => `<tr><td>${POLICY_CATS[c].name}</td><td class="num">${(pr.lines[c] || 0).toFixed(1)}B</td><td>${editable ? `<select data-pb="cat:${c}">${[0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3].map(v => `<option value="${v}" ${Math.abs((d.cats[c] || 1) - v) < 0.01 ? "selected" : ""}>${Math.round(v * 100)}%</option>`).join("")}</select>` : `${Math.round((d.cats[c] || 1) * 100)}%`}</td></tr>`).join("");
    const taxRows = Object.entries(d.taxes).map(([k, lv]) => `<tr><td>${POLICIES[k].icon} ${esc(POLICIES[k].name)}</td><td class="num">${(-POLICIES[k].cost * lv * 12).toFixed(1)}B</td><td>${editable ? `<input type="range" min="5" max="100" step="5" value="${Math.round(lv * 100)}" data-pb="tax:${k}"> ${Math.round(lv * 100)}%` : `${Math.round(lv * 100)}%`}</td></tr>`).join("");
    const cipRows = G.cip.queue.map(q => q).filter(q => q.status !== "done");
    const waiting = G.cip.queue.filter(q => q.status === "queued");
    return `<div class="era-banner"><b>THE ${esc(eraYear(["drafting", "rejected", "submitted", "passed"].includes(pb.status) ? currentBBY() - 1 : currentBBY()))} BUDGET</b> · ${esc(statusText)}</div>
        <div class="cols"><div class="col-main">
        ${panel("💰 Operating budget", `<table class="results"><tr><th>Department</th><th>Per year</th><th>Funding</th></tr>${catRows}</table>
            <p class="muted small">Funding below 100% saves money but weakens every law in that department; above 100% strengthens them.</p>
            <h4>Revenue</h4><table class="results"><tr><th>Tax</th><th>Per year</th><th>Rate</th></tr>${taxRows || '<tr><td colspan="3" class="muted">No taxes are law.</td></tr>'}</table>
            <h4>Capital program</h4>${editable ? `<select data-pb="cip">${[0, 1.5, 3, 5, 8, 12].map(v => `<option value="${v}" ${d.cip === v ? "selected" : ""}>${v}B for capital projects</option>`).join("")}</select>` : `<p>${pb.cip}B this year · ${G.cip.remaining.toFixed(1)}B uncommitted${G.cip.frozen ? " · frozen" : ""}</p>`}
            <div class="bill-preview"><div class="statrow"><span>Revenue</span><b>${pr.income.toFixed(1)}B</b></div><div class="statrow"><span>Operating spending</span><b>${pr.spend.toFixed(1)}B</b></div><div class="statrow"><span>Capital program</span><b>${pr.cip.toFixed(1)}B</b></div>${pr.pk ? `<div class="statrow"><span>Investment packages</span><b>${pr.pk.toFixed(1)}B</b></div>` : ""}${pr.interest ? `<div class="statrow"><span>Debt interest</span><b>${pr.interest.toFixed(1)}B</b></div>` : ""}<div class="statrow"><span>${pr.net >= 0 ? "Surplus" : "Deficit"}</span><b class="${pr.net >= 0 ? "c-for" : "c-against"}">${Math.abs(pr.net).toFixed(1)}B</b></div><div class="statrow"><span>Treasury</span><b>${G.treasury.toFixed(1)}B</b></div></div>
            ${editable ? `<h4>How the legislature will see it</h4><div class="stances">${Object.entries(budgetStance(d)).filter(([, v]) => v).map(([f, v]) => `<span class="stance s${v}">${FACTIONS[f].icon} ${FACTIONS[f].name}: ${LEAN_WORDS[v]}</span>`).join("") || '<span class="muted small">No strong feelings.</span>'}</div>
                <div class="row"><button class="primary" data-act="submitbudget" ${G.ap < 3 ? "disabled" : ""}>${rulesByDecree() ? "Issue the budget by decree · 2" : "Submit to the legislature · 3"}</button></div>` : ""}
            ${gov && pb.status === "submitted" ? `<button class="secondary" data-act="gobill" data-id="${pb.billId}">Fight for it on the floor →</button>` : ""}
            ${!gov ? '<p class="muted small">The planetary government writes the budget. You can lobby it — or take its place.</p>' : ""}`)}
        </div><div class="col-side">
        ${panel("🏗️ Capital Improvement Program", `<p class="small">Projects are funded in priority order from each year's capital budget. Add projects from your Agenda.</p>
            ${cipRows.map(q => `<div class="pipe"><div class="statrow"><b>${esc(q.name)}</b><span class="small">${q.cost.toFixed(1)}B</span></div><p class="small ${q.status === "building" ? "c-for" : "muted"}">${q.status === "building" ? "Funded — under construction" : "Waiting for funding"}${q.district ? ` · ${esc(q.district)}` : ""}</p>${q.status === "queued" && gov ? (() => { const i = waiting.indexOf(q); return `<div class="row"><button class="mini" data-act="cipmove" data-i="${i}" data-d="-1" ${i === 0 ? "disabled" : ""}>▲</button><button class="mini" data-act="cipmove" data-i="${i}" data-d="1" ${i === waiting.length - 1 ? "disabled" : ""}>▼</button><button class="mini" data-act="cipremove" data-i="${i}">Remove</button></div>`; })() : ""}</div>`).join("") || '<p class="muted small">Nothing in the program yet.</p>'}`)}
        ${(G.streams || []).length ? panel("📈 Revenue streams", G.streams.map(s => `<div class="statrow small"><span>${esc(s.name)}</span><b class="c-for">+${(s.perMonth * 12).toFixed(1)}B/yr · ${Math.ceil(s.left / 12)} yrs</b></div>`).join("")) : ""}
        ${pb.history.length ? panel("Budget history", pb.history.map(h => `<p class="small">${esc(h.year)}: ${esc(h.status)} · capital ${h.cip}B</p>`).join("")) : ""}
        </div></div>`;
}


// ── The calendar ──────────────────────────────────────────────────

function tickLawbook() {
    initLawbook();
    const pb = G.pbudget;
    if (G.month === 1) newFiscalYear();
    if (G.month === 10) {
        if (governing()) {
            pb.status = "drafting"; draftBudget();
            report("💰 Budget season", `Draft the ${eraYear(currentBBY() - 1)} budget (Policy → Budget) and ${rulesByDecree() ? "decree it" : "get it through the legislature"} before the new year.`);
        } else { pb.pending = null; pb.status = "adopted"; }
    }
    if (pb.status === "submitted" && !G.bills.some(b => b.id === pb.billId)) { if (pb.status === "submitted") pb.status = "rejected"; }
    tickCip();
    G.streams.forEach(s => { s.left--; });
    G.streams = G.streams.filter(s => s.left > 0);
    // A government run by someone else still has to balance its books.
    if (!governing() && G.month % 6 === 3) npcFiscalPolicy();
    // Other legislators propose laws of their own.
    if (governing() && !rulesByDecree() && chance(5) && !G.bills.some(b => b.policyKey && b.sponsor !== "player")) npcPolicyBill();
}

function npcFiscalPolicy() {
    const net = budget().net;
    if (G.treasury > -5 && net > -0.1) return;
    const taxes = Object.keys(POLICIES).filter(k => POLICIES[k].cat === "tax" && G.policies[k].level > 0 && G.policies[k].level < 0.8);
    const spending = Object.keys(POLICIES).filter(k => POLICIES[k].cost > 0.4 && G.policies[k].level > 0.2 && POLICIES[k].cat !== "emergency");
    if (taxes.length && chance(50)) { const k = pick(taxes); G.policies[k].level = Math.round((G.policies[k].level + 0.1) * 100) / 100; }
    else if (spending.length) { const k = pick(spending); G.policies[k].level = Math.round((G.policies[k].level - 0.1) * 100) / 100; }
}

function npcPolicyBill() {
    const sponsor = pick(arenaNpcs("local"));
    if (!sponsor) return;
    const liked = Object.keys(POLICIES).filter(k => policyAvailable(k) && POLICIES[k].cat !== "emergency" && !POLICIES[k].extreme && (POLICIES[k].f[sponsor.faction] || 0) > 0);
    const disliked = Object.keys(POLICIES).filter(k => G.policies[k].level > 0 && (POLICIES[k].f[sponsor.faction] || 0) < 0);
    const repeal = disliked.length && chance(35);
    const k = repeal ? pick(disliked) : pick(liked.filter(x => G.policies[x].level === 0));
    if (!k) return;
    const def = POLICIES[k];
    const lv = repeal ? 0 : 0.3;
    const d = lv - G.policies[k].level;
    const stance = {}; Object.keys(FACTIONS).forEach(f => { stance[f] = clamp(Math.round((def.f[f] || 0) * Math.sign(d) * 1.2), -3, 3); });
    const g = {}; Object.entries(def.g).forEach(([gk, v]) => { g[gk] = v * d; });
    const b = createBill(`policy_${k}`, sponsor.id, { arena: "local", title: `${def.name} ${repeal ? "Repeal" : "Act"}`, desc: `${sponsor.name}'s bill ${repeal ? "to repeal" : "to enact"} ${def.name}.`, stance, g });
    b.policyKey = k; b.policyLevel = lv;
    report("📜 A bill from the legislature", `${sponsor.name} introduces the ${b.title}. If it passes, you can sign it or veto it.`);
}
