// ── DOSSIERS — decisions that arrive on your desk ───────────────────
//
// setup(G) decides whether a dossier can appear and freezes any random
// details into a context object (so saved games rebuild it identically).
// build(G, ctx) returns the title, text and choices. Choices never say which
// answer is "right" — they only show what each one touches.

const hasTrait = t => world().traits.includes(t);
const elected = () => isElected() || ["candidate", "opposition"].includes(G.office.kind);

const CRISIS_TYPES = [
    { type: "Water Dispute",       fits: ["desert", "frontier"], text: w => `${w}'s planetary government has requested emergency water infrastructure funding from the Republic.` },
    { type: "Famine",              fits: ["farming", "frontier"], text: w => `Crop blight has left millions on ${w} facing famine. Its delegation begs for relief.` },
    { type: "Pirate Raids",        fits: ["trade", "frontier", "crime"], text: w => `Pirate fleets are strangling ${w}'s trade lanes. Its government wants Republic warships.` },
    { type: "Labour Uprising",     fits: ["industry", "mining"], text: w => `Workers on ${w} have seized the foundries. The owners want troops; the workers want a hearing.` },
    { type: "Epidemic",            fits: [], text: w => `A fast-moving plague is spreading through ${w}'s cities. Quarantine or aid?` },
    { type: "Corporate Occupation",fits: ["mining", "corporate"], text: w => `A mining conglomerate's private security has effectively taken control of ${w}'s capital.` },
    { type: "Seismic Disaster",    fits: [], text: w => `A catastrophic quake has flattened three cities on ${w}.` }
];

const EVENTS = {

    mining_access: {
        weight: 3, deadline: 3,
        setup: () => ({ corp: pick(CORPORATIONS).name }),
        build: (g, c) => ({
            title: "Mining Rights Dispute", from: c.corp, topic: "mining rights",
            text: `The ${c.corp} wants access to mineral deposits on a moon neighbouring ${world().name}. Thousands of jobs are promised — so is an open-pit mine the size of a city.`,
            choices: [
                { label: "Support the corporation", e: { g: { business: 8, elites: 5, workers: 3, environmentalists: -10, traditional: -6 }, p: { employment: 3, environment: -4 }, f: { corporatists: 10, reformers: -5 }, funds: 1 }, msg: "The deal goes ahead. Corporate donors take note; so do the environmental groups organising against you." },
                { label: "Oppose it", e: { g: { environmentalists: 10, traditional: 6, rural: 3, business: -7, workers: -2 }, f: { corporatists: -10, federalists: 4 }, opp: 2 }, msg: "Environmentalists and local communities rally behind you. Corporations begin lobbying against you." },
                { label: "Demand environmental protections", e: { g: { environmentalists: 3, business: -2, workers: 2 }, p: { employment: 1, environment: -1 }, f: { reformers: 4, corporatists: 2 }, influence: 2 }, msg: "Development proceeds slowly under strict protections. A broader coalition — and nobody thrilled." },
                { label: "Send the issue to committee", e: { g: { environmentalists: -2, business: -2 }, trust: -3 }, msg: "You buy time. Opponents accuse you of avoiding the issue." }
            ]
        })
    },

    military_spending: {
        weight: 2, deadline: 2,
        setup: () => arena() === "senate" ? {} : null,
        build: () => ({
            title: "The Militarists Want Your Vote", from: "Militarist whip", topic: "military spending",
            text: "The Militarist bloc wants your public support for a 15% increase in military spending. Military worlds will cheer; pacifist worlds will not forget.",
            choices: [
                { label: "Support the increase", e: { gal: { military: 8 }, p: { employment: hasTrait("arms") ? 4 : 0, education: -1 }, g: { military: 8, veterans: 5, students: -5, youth: -3 }, f: { militarists: 12, reformers: -6, federalists: -3 } },
                  run: () => { const r = livingNpcs().find(n => n.faction === "reformers" && n.arena === "senate" && n.rel > -30); if (r) changeRel(r, -25, "You backed the military expansion. They took it personally."); }, msg: "Military worlds send thanks. A pacifist senator becomes a new rival." },
                { label: "Oppose it", e: { g: { students: 4, youth: 3, military: -8, veterans: -4 }, f: { militarists: -12, reformers: 6 } }, msg: "You stand with the pacifist worlds. The HoloNet Sentinel calls you naive." },
                { label: "Redirect it to veterans' healthcare", e: { g: { veterans: 8, military: 2, elders: 2 }, p: { healthcare: 2 }, f: { militarists: -3, reformers: 4 }, trust: 2 }, msg: "Nobody fully wins. Veterans do rather well." }
            ]
        })
    },

    surveillance: {
        weight: 2, deadline: 2,
        setup: () => ({}),
        build: () => ({
            title: "Security Directive 12", from: "Republic Security Bureau", topic: "surveillance",
            text: `After a bombing at a transit hub, the Security Bureau requests authority to monitor all HoloNet communications on ${world().name}.`,
            choices: [
                { label: "Grant the authority", e: { p: { crime: -5 }, g: { elders: 4, business: 2, youth: -6, students: -5 }, f: { militarists: 10, reformers: -10 }, i: { courts: -5, agencies: -4 } }, msg: "The cameras and listeners go live. Crime falls; so does the trust of the young." },
                { label: "Refuse", e: { g: { youth: 5, students: 5, elders: -3 }, f: { militarists: -8, reformers: 6, federalists: 3 }, i: { courts: 3 } }, msg: "You defend civil liberties. If there is another bombing, you will be blamed." },
                { label: "Grant it with judicial warrants", e: { p: { crime: -2 }, g: { elders: 2, youth: -1 }, f: { militarists: 3, reformers: 1 }, i: { courts: 5 } }, msg: "A compromise both sides grudgingly accept." }
            ]
        })
    },

    housing_protest: {
        weight: 3, deadline: 2,
        setup: () => G.planet.housing < 45 ? {} : null,
        build: () => ({
            title: "Housing Protests", from: "Your chief of staff", topic: "the housing crisis",
            text: "Tens of thousands march through the capital. Rents have doubled in five years and young families are sleeping in transit stations.",
            choices: [
                { label: "Meet the protesters and promise a housing programme", e: { g: { youth: 6, urban: 5, workers: 3, elites: -3 }, influence: -3, program: { name: "Housing Renewal Programme", p: { housing: 1.5 }, years: 6 } }, msg: "The programme begins. Results will take years." },
                { label: "Condemn the disorder", e: { g: { elders: 4, business: 3, youth: -8, urban: -3 }, unrest: 4, f: { traditionalists: 3, reformers: -5 } }, msg: "Order-minded voters approve. The young do not." },
                { label: "Call for rent controls", e: { g: { youth: 8, workers: 5, business: -8, elites: -6 }, p: { housing: 2, employment: -1 }, f: { reformers: 6, corporatists: -7 } }, msg: "Landlords are apoplectic. Tenants are delighted." },
                { label: "Say nothing", e: { unrest: 8, g: { youth: -3 } }, msg: "The protests grow." }
            ]
        })
    },

    refugees: {
        weight: 2, deadline: 2,
        setup: () => G.gal.refugees > 38 ? { from: pick(Object.keys(G.galaxy).filter(k => k !== G.worldKey)) } : null,
        build: (g, c) => ({
            title: "Refugee Convoy", from: "Port authority", topic: "refugees",
            text: `A convoy of 40,000 refugees fleeing fighting on ${worldName(c.from)} requests permission to land on ${world().name}.`,
            choices: [
                { label: "Welcome them", e: { p: { housing: -3, employment: 1 }, g: { religious: 4, workers: -3, urban: -2, traditional: -3 }, f: { reformers: 8, traditionalists: -6 }, gal: { refugees: -4, diplomacy: 3 }, trust: 2 }, msg: "The ships land. The strain on housing is real; so is the gratitude." },
                { label: "Admit them to temporary camps", e: { p: { housing: -1, crime: 1 }, g: { religious: 2, traditional: -1 }, f: { reformers: 3, traditionalists: -1 }, gal: { refugees: -2 } }, msg: "A compromise that satisfies no one completely." },
                { label: "Turn them away", e: { g: { traditional: 4, workers: 2, religious: -5, students: -4 }, f: { traditionalists: 6, reformers: -10 }, gal: { diplomacy: -4 }, world: { key: c.from, stability: -6 } }, msg: "The convoy moves on. The images of it do not." }
            ]
        })
    },

    strike: {
        weight: 3, deadline: 2,
        setup: () => hasTrait("industry") ? {} : null,
        build: () => ({
            title: "Shipyard Strike", from: "Orbital Workers' Union", topic: "the shipyard strike",
            text: "Forty thousand shipyard workers walk out over pay and safety. Every day of the strike costs millions and delays Republic warships.",
            choices: [
                { label: "Side with the workers", e: { g: { unions: 10, workers: 6, business: -7 }, p: { inequality: -2, employment: -1 }, f: { reformers: 6, corporatists: -8 } }, msg: "The owners settle, bitterly." },
                { label: "Side with management", e: { g: { business: 7, elites: 4, unions: -12, workers: -6 }, f: { corporatists: 8, reformers: -6 } }, msg: "The strike collapses. The union remembers." },
                { label: "Mediate", ap: 3, e: { g: { unions: 3, business: 2 }, rep: 3, influence: 2 }, msg: "Two weeks of all-night talks produce a deal." },
                { label: "Send in security forces", e: { g: { unions: -15, workers: -8, business: 5, elders: 2 }, rep: -5, unrest: 10, f: { militarists: 3, reformers: -10 } }, msg: "The yards reopen under guard." }
            ]
        })
    },

    syndicate: {
        weight: 2, deadline: 2,
        setup: () => (G.planet.crime > 55 || hasTrait("crime")) ? { who: G.worldKey === "tatooine" ? "a Hutt majordomo" : "a syndicate intermediary" } : null,
        build: (g, c) => ({
            title: "An Offer You Could Refuse", from: c.who, topic: "organised crime",
            text: `${c.who[0].toUpperCase() + c.who.slice(1)} offers a “campaign contribution” of 3 million credits in exchange for your office looking away from certain spaceport cargo.`,
            choices: [
                { label: "Accept", e: { funds: 3, p: { crime: 3 }, secret: "Took syndicate money for looking away", secretHeat: 14 }, msg: "The credits arrive in an untraceable account. Nearly untraceable." },
                { label: "Refuse politely", e: { p: { crime: 2 }, rep: 2 }, run: g => { g.threatened = true; }, msg: "They thank you for your time. Someone follows your speeder home." },
                { label: "Expose them publicly", e: { p: { crime: -4 }, trust: 5, rep: 4, g: { elders: 3, business: 2 } }, run: g => { g.threatened = true; }, msg: "The raids make headlines. Your security detail doubles." }
            ]
        })
    },

    water: {
        weight: 3, deadline: 3,
        setup: () => hasTrait("desert") ? {} : null,
        build: () => ({
            title: "Who Owns the Water?", from: "Moisture farmers' association", topic: "water rights",
            text: "Moisture farmers accuse the spaceport towns of draining the aquifers. Offworld water merchants are offering to 'solve' the shortage — for a price.",
            choices: [
                { label: "Public water network", e: { treasury: -3, p: { infrastructure: 4, healthcare: 2 }, g: { farmers: 8, rural: 6, business: -3 }, f: { reformers: 5 }, program: { name: "Planetary Water Network", p: { infrastructure: 1, healthcare: 0.5 }, years: 10 } }, msg: "Pipes are laid across the dunes." },
                { label: "Sell concessions to the water merchants", e: { treasury: 4, g: { business: 6, farmers: -8, rural: -5 }, p: { inequality: 3 }, f: { corporatists: 6, reformers: -4 } }, msg: "Water flows — to whoever can pay." },
                { label: "Ration by settlement", e: { g: { farmers: 2, urban: -3 }, p: { crime: 2 }, legitimacy: 3 }, msg: "Fair, unpopular, and hard to enforce." }
            ]
        })
    },

    clan_feud: {
        weight: 3, deadline: 2,
        setup: () => G.clans ? { a: pick(G.clans).name } : null,
        build: (g, c) => {
            const b = G.clans.find(x => x.name !== c.a).name;
            return {
                title: "Blood Feud", from: `Clan ${c.a}`, topic: "the clan feud",
                text: `Clan ${c.a} accuses Clan ${b} of dishonour after a duel ended in death. Both demand you take a side.`,
                choices: [
                    { label: `Side with Clan ${c.a}`, e: { clans: { [c.a]: 12, [b]: -15 } }, msg: `Clan ${b} leaves the council chamber.` },
                    { label: `Side with Clan ${b}`, e: { clans: { [b]: 12, [c.a]: -15 } }, msg: `Clan ${c.a} swears it will not forget.` },
                    { label: "Invoke ancient arbitration", ap: 3, e: { clans: 3, legitimacy: 4, i: { traditional: 4 } }, msg: "Custom resolves what politics could not." },
                    { label: "Stay out of it", e: { clans: -4, legitimacy: -4 }, msg: "A leader who won't lead is noticed." }
                ]
            };
        }
    },

    logging: {
        weight: 3, deadline: 3,
        setup: () => hasTrait("forest") ? { corp: pick(["Czerka Timber", "Outer Forest Holdings", "Grand Canopy Ventures"]) } : null,
        build: (g, c) => ({
            title: "The Forest Contract", from: c.corp, topic: "logging rights",
            text: `${c.corp} offers billions for rights to the ancient forests. The elders say the forest is not for sale.`,
            choices: [
                { label: "Sign the contract", e: { treasury: 6, p: { employment: 5, environment: -10 }, g: { business: 5, traditional: -12, environmentalists: -10 }, f: { corporatists: 8, traditionalists: -10 }, i: { traditional: -10 } }, msg: "The first trees fall within the month." },
                { label: "Refuse outright", e: { g: { traditional: 8, environmentalists: 6, business: -4 }, f: { traditionalists: 6, corporatists: -6 }, i: { traditional: 6 } }, msg: "The elders honour you. The company lobbies the Senate instead." },
                { label: "Allow limited, elder-supervised harvesting", e: { treasury: 2, p: { employment: 2, environment: -2 }, g: { traditional: -2, business: 2 }, i: { traditional: 2 } }, msg: "A careful compromise, carefully watched." }
            ]
        })
    },

    biotech: {
        weight: 3, deadline: 3,
        setup: () => hasTrait("biotech") ? {} : null,
        build: () => ({
            title: "The Laboratories' Secret", from: "An anonymous technician", topic: "biotech ethics",
            text: "A technician leaks evidence that a laboratory is engineering obedience into a new line of workers. The labs are the planet's biggest employer.",
            choices: [
                { label: "Launch a public inquiry", e: { g: { religious: 6, students: 4, business: -6, elites: -4 }, f: { reformers: 6, corporatists: -6, traditionalists: 3 }, rep: 5, i: { agencies: 6 } }, msg: "The inquiry will take years — and it will find things." },
                { label: "Quietly let the labs handle it", e: { g: { business: 4 }, f: { corporatists: 4 }, secret: "Buried evidence of unethical biotech research", secretHeat: 12 }, msg: "The technician is transferred. The files are 'lost'." },
                { label: "Shut the programme down", e: { p: { employment: -4 }, g: { religious: 8, business: -8, workers: -3 }, f: { traditionalists: 5, reformers: 4, corporatists: -8, militarists: -3 } }, msg: "Decisive — and expensive." }
            ]
        })
    },

    pilgrims: {
        weight: 3, deadline: 2,
        setup: () => hasTrait("religious") ? {} : null,
        build: () => ({
            title: "The Pilgrim Season", from: "Council of Orders", topic: "the holy city",
            text: "A record million pilgrims are coming. Two rival orders both claim the right to administer the great temple this year.",
            choices: [
                { label: "Grant it to the older order", e: { g: { religious: 4, traditional: 4, youth: -2 }, f: { traditionalists: 6 } }, msg: "Tradition is honoured; the reformist order seethes." },
                { label: "Grant it to the reformist order", e: { g: { religious: -2, youth: 4, students: 2 }, f: { reformers: 4, traditionalists: -6 } }, msg: "A new era, say some. Sacrilege, say others." },
                { label: "Share it between them", ap: 3, e: { g: { religious: 3 }, rep: 3, legitimacy: 3 }, msg: "Delicate diplomacy keeps the peace." }
            ]
        })
    },

    disaster: {
        weight: 1, deadline: 1, cooldown: 30,
        setup: () => ({ kind: pick(["superstorm", "earthquake", "reactor fire", "flood"]) }),
        build: (g, c) => ({
            title: `Disaster: a ${c.kind}`, from: "Emergency services", topic: `the ${c.kind}`,
            text: `A ${c.kind} devastates part of ${world().name}. Thousands are homeless tonight.`,
            choices: [
                { label: "Go there yourself and lead the relief effort", ap: 3, e: { p: { housing: -3, infrastructure: -3 }, g: { rural: 5, elders: 4, urban: 3 }, trust: 6, health: -3 }, msg: "The images of you in the rubble go everywhere." },
                { label: "Request Republic emergency aid", e: { p: { housing: -2, infrastructure: -2 }, influence: -5, f: { centralists: 3 } }, msg: "The aid comes, slowly, with forms." },
                { label: "Issue a statement", e: { p: { housing: -4, infrastructure: -4 }, trust: -5, g: { rural: -4, elders: -3 } }, msg: "The statement is noted. So is your absence." }
            ]
        })
    },

    epidemic: {
        weight: 1, deadline: 2, cooldown: 30,
        setup: () => ({}),
        build: () => ({
            title: "Outbreak", from: "Chief medical officer", topic: "the outbreak",
            text: "A respiratory virus is spreading fast through the dense districts. Closing the spaceports would contain it — and wreck the economy.",
            choices: [
                { label: "Close the spaceports", e: { p: { employment: -5, healthcare: 2 }, g: { business: -8, elders: 5, workers: -3 }, gal: { trade: -2 } }, msg: "The curve flattens. The economy does too." },
                { label: "Keep trade open; expand hospitals", e: { treasury: -3, p: { healthcare: -3 }, g: { elders: -5, business: 4 } }, msg: "Business continues. So does the virus." },
                { label: "Targeted quarantines", e: { p: { healthcare: -1, employment: -1 }, g: { youth: -2 }, i: { civil: 3 } }, msg: "The civil service rises to the occasion." }
            ]
        })
    },

    smear: {
        weight: 2, deadline: 2,
        setup: () => { const r = rivals(); return r.length ? { id: pick(r).id } : null; },
        build: (g, c) => {
            const n = npc(c.id);
            return {
                title: "A Smear Campaign", from: n.name, topic: "the smear campaign",
                text: `${n.name} (${n.title}) is spreading rumours that you're in the pocket of offworld corporations. The Galactic Herald is running the story.`,
                choices: [
                    { label: "Address it publicly", ap: 3, e: { trust: 3, media: { herald: 4 } }, msg: "A calm, detailed rebuttal. It mostly works." },
                    { label: "Counter-attack with dirt of your own", e: { trust: -3, heat: 4 }, run: () => { n.influence = clamp(n.influence - 10); changeRel(n, -20, "You dug up their past and published it."); }, msg: "Mutually assured destruction, HoloNet edition." },
                    { label: "Sue for defamation", e: { funds: -1, i: { courts: 2 }, rep: 1 }, msg: "The case will drag on for years. The story dies meanwhile." },
                    { label: "Ignore it", e: { trust: -4, g: { workers: -2, youth: -2 } }, msg: "Silence reads as guilt." }
                ]
            };
        }
    },

    ally_scandal: {
        weight: 2, deadline: 2,
        setup: () => { const a = allies(); return a.length ? { id: pick(a).id } : null; },
        build: (g, c) => {
            const n = npc(c.id);
            return {
                title: "An Ally in Trouble", from: n.name, topic: `the ${lastName(n.name)} affair`,
                text: `Your long-time ally ${n.name} is accused of taking bribes. They're asking — begging — for you to stand with them.`,
                choices: [
                    { label: "Defend them", e: { trust: -4, heat: 5 }, run: () => changeRel(n, 25, "Stood by them when everyone else ran."), msg: "Loyalty has a price. You just paid it." },
                    { label: "Distance yourself", e: { trust: 2 }, run: () => changeRel(n, -30, "Abandoned them the moment it got difficult."), msg: "You survive. They notice who didn't stand with them." },
                    { label: "Call for an independent investigation", e: { rep: 4, i: { agencies: 4 } }, run: () => changeRel(n, -10, "Called for an investigation into them."), msg: "Principled, say editorials. Cold, says your old friend." }
                ]
            };
        }
    },

    investigation: {
        weight: 2, deadline: 2,
        setup: () => G.heat > 15 ? { outlet: pick(OUTLETS).key } : null,
        build: (g, c) => {
            const o = OUTLETS.find(x => x.key === c.outlet);
            return {
                title: "A Journalist Is Asking Questions", from: o.name, topic: "the investigation",
                text: `A reporter from the ${o.name} has been interviewing your former staffers. They seem to know things.`,
                choices: [
                    { label: "Stonewall", e: { heat: 8, media: { [o.key]: -8 } }, msg: "No comment. The reporter keeps digging." },
                    { label: "Give them an exclusive on something else", ap: 3, e: { heat: -8, media: { [o.key]: 6 } }, msg: "A bigger story buys you time." },
                    { label: "Pressure the outlet's owners", e: { heat: -12, media: { [o.key]: -15 }, secret: "Pressured a news outlet to kill a story", secretHeat: 10, i: { agencies: -3 } }, msg: "The story is spiked. For now." }
                ]
            };
        }
    },

    education_initiative: {
        weight: 1, deadline: 4, cooldown: 40,
        setup: () => ({}),
        build: () => ({
            title: "A Twenty-Year Idea", from: "Education advisers", topic: "education",
            text: "Your advisers propose a twenty-year education initiative. It will cost now and pay off long after you've left office — perhaps for your successor.",
            choices: [
                { label: "Launch the full initiative", e: { treasury: governing() ? -4 : 0, influence: governing() ? 0 : -8, g: { students: 6, youth: 4, elites: -2 }, f: { reformers: 4 }, program: { name: `${world().name} Education Initiative`, p: { education: 1.5, employment: 0.3 }, years: 20 } }, msg: "The schools will be built. You may not live to see the graduates." },
                { label: "Fund a small pilot", e: { treasury: governing() ? -1 : 0, g: { students: 2 }, program: { name: "Education Pilot", p: { education: 0.8 }, years: 5 } }, msg: "A modest start." },
                { label: "Not now", e: { g: { students: -2 } }, msg: "The proposal goes in a drawer." }
            ]
        })
    },

    youth_climate: {
        weight: 2, deadline: 2,
        setup: () => G.planet.environment < 50 ? {} : null,
        build: () => ({
            title: "The Young Strike for the Planet", from: "Student organisers", topic: "the environment",
            text: "Millions of students skip school to demand action on pollution. Their banners carry your name.",
            choices: [
                { label: "March with them", e: { g: { youth: 8, students: 6, environmentalists: 5, business: -4 }, f: { reformers: 4, corporatists: -3 } }, msg: "You look good in the photos. Industry looks at you differently." },
                { label: "Promise an emissions plan", e: { g: { youth: 4, environmentalists: 4 }, trust: -1 }, run: g => { g.promisedEmissions = monthsNow(); }, msg: "They'll hold you to it." },
                { label: "Tell them to go back to school", e: { g: { youth: -8, students: -6, elders: 3 } }, msg: "Their parents vote too, you remind yourself." }
            ]
        })
    },

    union_endorsement: {
        weight: 3, deadline: 2, cooldown: 30,
        setup: () => elected() && G.office.termLeft != null && G.office.termLeft <= 14 ? {} : null,
        build: () => ({
            title: "The Unions Offer an Endorsement", from: "Federation of Labour", topic: "the union endorsement",
            text: "The unions will endorse you — and turn out their members — if you commit to backing labour protections.",
            choices: [
                { label: "Accept the deal", e: { g: { unions: 10, workers: 5, business: -5 }, f: { reformers: 5, corporatists: -5 } }, run: g => { g.endorsements = (g.endorsements || 0) + 1; G.obligations.push({ donor: "Federation of Labour", billKey: arena() === "senate" ? "labor_rights" : "min_wage", due: monthsNow() + ri(4, 8) }); G.donors["Federation of Labour"] = G.donors["Federation of Labour"] || { given: 0, rel: 20, source: "unions" }; }, msg: "An army of canvassers is yours. So is a debt." },
                { label: "Decline politely", e: { g: { unions: -4, business: 2 } }, msg: "They'll sit this one out." }
            ]
        })
    },

    debate: {
        weight: 4, deadline: 1, cooldown: 20,
        setup: () => elected() && G.office.termLeft != null && G.office.termLeft <= 4 && G.office.termLeft > 0 ? {} : null,
        build: () => ({
            title: "The Debate", from: "HoloNet broadcast committee", topic: "the debate",
            text: `Billions will watch you debate ${G.opponent ? G.opponent.name : "your opponent"}. How do you play it?`,
            choices: [
                { label: "Policy detail", run: () => { const ok = chance(40 + G.rep / 3); applyEffects(ok ? { opp: -4, g: { elders: 2, students: 2 } } : { opp: 1 }); return ok ? "Precise and commanding. Fact-checkers love you." : "Accurate — and deadly dull."; } },
                { label: "Go on the attack", run: () => { const ok = chance(50); applyEffects(ok ? { opp: -5, trust: -2 } : { opp: 2, trust: -4 }); return ok ? "Your opponent flounders." : "It comes across as bullying."; } },
                { label: "Humour and warmth", run: () => { const ok = chance(35 + G.trust / 3); applyEffects(ok ? { opp: -4, g: { youth: 3 } } : { opp: 1 }); return ok ? "The clip of your joke goes galaxy-wide." : "The joke falls flat."; } }
            ],
            def: 0
        })
    },

    family_child: {
        weight: 1, deadline: 3, cooldown: 40,
        setup: () => { const c = G.family.children.find(x => x.alive && x.age >= 18 && x.age <= 30 && !x.inPolitics); return c ? { name: c.name } : null; },
        build: (g, c) => ({
            title: "Your Child's Future", from: c.name, topic: "the family",
            text: `${c.name} wants to join your staff and learn politics. Your rivals will cry nepotism; your dynasty needs an heir.`,
            choices: [
                { label: "Bring them into politics", e: { trust: -2 }, run: () => { const ch = G.family.children.find(x => x.name === c.name); if (ch) ch.inPolitics = true; }, msg: `${c.name} starts on your staff. The family business continues.` },
                { label: "Encourage them to find their own path", e: { rep: 2 }, msg: "They're disappointed. They'll understand later." }
            ]
        })
    },

    assassination: {
        weight: g => (g.threatened ? 3 : 1), deadline: 1, cooldown: 36,
        setup: g => (g.planet.crime > 60 || g.gal.war > 65 || g.autocrat || g.threatened) ? {} : null,
        build: () => ({
            title: "A Plot Uncovered", from: "Your security chief", topic: "the assassination plot",
            text: "Security has intercepted plans for an attack on you at next week's rally.",
            choices: [
                { label: "Cancel all public appearances", e: { g: { youth: -2, urban: -2 }, trust: -2 }, msg: "You are safe. You are also invisible." },
                { label: "Go anyway — with extra security", run: () => { if (chance(20)) { applyEffects({ health: -30, trust: 10, g: { elders: 5, military: 4 } }); return "Shots are fired. You are wounded — and a wave of sympathy follows."; } applyEffects({ trust: 4 }); return "The rally passes without incident. Your courage is noted."; } },
                { label: "Use it to justify a security crackdown", e: { p: { crime: -4 }, g: { elders: 3, youth: -5 }, f: { militarists: 6, reformers: -6 }, i: { courts: -4 } }, msg: "Hundreds are detained. Some were even involved." }
            ],
            def: 0
        })
    },

    civil_corruption: {
        weight: 1, deadline: 3,
        setup: () => ({}),
        build: () => ({
            title: "Rot in the Ministries", from: "Auditor-General", topic: "civil service corruption",
            text: "Auditors find senior civil servants embezzling from public contracts. Some are close to people close to you.",
            choices: [
                { label: "Prosecute everyone involved", e: { trust: 5, rep: 4, i: { civil: -8, agencies: 6 } }, run: () => { const a = allies()[0]; if (a && chance(50)) changeRel(a, -15, "Their cousin was prosecuted in your corruption purge."); }, msg: "Heads roll. The civil service is shaken." },
                { label: "Quiet reforms, no prosecutions", e: { i: { civil: 4 }, heat: 3 }, msg: "Efficient, discreet, and somewhat suspicious." },
                { label: "Bury the report", e: { secret: "Buried an audit of civil service corruption", secretHeat: 10, i: { civil: 3, agencies: -5 } }, msg: "The report is classified. For now." }
            ]
        })
    },

    traditional_consult: {
        weight: 2, deadline: 3,
        setup: () => hasTrait("indigenous") ? {} : null,
        build: () => ({
            title: "The Elders Demand to Be Heard", from: "Council of Elders", topic: "traditional sovereignty",
            text: "The elders say offworld agencies keep making decisions about their lands without asking. They want a veto over development.",
            choices: [
                { label: "Grant them a formal veto", e: { g: { traditional: 10, business: -6 }, f: { traditionalists: 8, corporatists: -6, independence: 3 }, i: { traditional: 10 }, legitimacy: 5, p: { environment: 2, employment: -1 } }, msg: "A historic recognition. Developers are furious." },
                { label: "Promise consultation, not a veto", e: { g: { traditional: 2 }, i: { traditional: 2 } }, msg: "They have heard promises before." },
                { label: "Decline", e: { g: { traditional: -8 }, i: { traditional: -8 }, indep: 3 }, msg: "Support for full independence grows in the villages." }
            ]
        })
    },

    galactic_crisis: {
        weight: 4, deadline: 2, cooldown: 6,
        setup: g => {
            const keys = shuffle(Object.keys(g.galaxy).filter(k => k !== g.worldKey && !g.galaxy[k].independent)).slice(0, 5).sort((a, b) => g.galaxy[a].stability - g.galaxy[b].stability);
            const key = keys[0];
            if (!key) return null;
            const traits = (WORLDS[key] || BACKGROUND_WORLDS[key]).traits || [];
            const fits = CRISIS_TYPES.filter(c => c.fits.some(t => traits.includes(t)));
            const ct = fits.length && chance(75) ? pick(fits) : pick(CRISIS_TYPES);
            return { key, type: ct.type };
        },
        build: (g, c) => {
            const name = worldName(c.key);
            const ct = CRISIS_TYPES.find(x => x.type === c.type);
            const sen = worldSenator(c.key);
            const inSenate = arena() === "senate";
            const choices = [
                { label: "Fund the request", e: { influence: -4, world: { key: c.key, stability: 12, prosperity: 3 }, f: { reformers: 4, centralists: 2, corporatists: -3 } }, run: () => sen && changeRel(sen, 15, `You backed aid for ${name}.`), msg: `${name} gets its money. Fiscal hawks grumble.` },
                { label: "Reject it", e: { world: { key: c.key, stability: -8 }, f: { corporatists: 4, reformers: -4, federalists: 1 } }, run: () => sen && changeRel(sen, -15, `You voted against aid for ${name}.`), msg: `${name}'s delegation remembers who said no.` },
                { label: "Require private-sector investment", e: { world: { key: c.key, stability: 4, prosperity: 5 }, f: { corporatists: 6, reformers: -4 } }, msg: `Investors move in. So do their terms.` },
                { label: "Send humanitarian assistance", ap: 3, e: { world: { key: c.key, stability: 7 }, rep: 3, gal: { diplomacy: 2 }, f: { reformers: 3 } }, run: () => sen && changeRel(sen, 10, `You sent help to ${name}.`), msg: "Relief ships leave within the day." },
                { label: "Investigate allegations of corruption", e: { f: { centralists: 3 }, i: { agencies: 2 } }, run: () => {
                    if (chance(45)) { if (sen) { sen.influence = clamp(sen.influence - 15); changeRel(sen, -20, "You exposed corruption in their government."); } applyEffects({ world: { key: c.key, stability: -3 }, rep: 3 }); return `Investigators find that aid to ${name} has been skimmed for years.`; }
                    if (sen) changeRel(sen, -12, "You insinuated they were corrupt. They weren't.");
                    return "The investigation finds nothing. It looks like an excuse to do nothing.";
                } }
            ];
            if (inSenate) choices.splice(2, 0, { label: "Introduce a Senate aid bill", ap: 3, run: () => {
                const b = createBill(`aid_${c.key}`, "player", { arena: "senate", title: `${name} ${c.type} Relief Act`, desc: `Emergency Republic relief for ${name}.`, stance: { reformers: 3, federalists: 1, centralists: 1, corporatists: -2, militarists: -1, independence: 1, traditionalists: 0 }, g: { religious: 2, elites: -1 }, worldAid: c.key });
                if (sen) changeRel(sen, 12, `You introduced a relief bill for ${name}.`);
                return `You table Bill ${b.num}. The vote is in three months — whip it through the Senate.`;
            } });
            return { title: `CRISIS — ${name} ${c.type}`, from: sen ? `Senator ${sen.name}` : `${name} government`, topic: `the ${name} crisis`, text: `${ct.text(name)} Suddenly ${name} matters to your ${world().name} career.`, choices, def: 1 };
        }
    },

    secession_elsewhere: {
        weight: 2, deadline: 3, cooldown: 18,
        setup: g => { const k = Object.keys(g.galaxy).find(k => k !== g.worldKey && !g.galaxy[k].independent && g.galaxy[k].indep > 50); return k ? { key: k } : null; },
        build: (g, c) => ({
            title: `${worldName(c.key)} Wants Out`, from: "Senate Planetary Affairs Committee", topic: `${worldName(c.key)}'s independence`,
            text: `${worldName(c.key)} is preparing an independence referendum. The Senate must decide how to respond.`,
            choices: [
                { label: "Support self-determination", e: { world: { key: c.key, indep: 8 }, f: { independence: 10, federalists: 5, centralists: -10 }, indep: 2 }, msg: "Separatists across the galaxy take heart." },
                { label: "Oppose secession", e: { world: { key: c.key, indep: -6, stability: -3 }, f: { centralists: 8, militarists: 3, independence: -10 } }, msg: "The Republic is one and indivisible, you declare." },
                { label: "Offer autonomy instead", ap: 3, e: { world: { key: c.key, indep: -4, stability: 5 }, f: { federalists: 6 }, rep: 2 }, msg: "A middle path that might just hold." }
            ]
        })
    },

    border_skirmish: {
        weight: 2, deadline: 1,
        setup: g => g.gal.war > 55 ? {} : null,
        build: () => ({
            title: "Shots on the Border", from: "Fleet command", topic: "the border crisis",
            text: "Separatist warships have fired on a Republic patrol. Hawks demand retaliation; doves demand talks.",
            choices: [
                { label: "Demand retaliation", e: { gal: { war: 8, military: 5 }, g: { military: 6, veterans: 4, youth: -4, elders: -3 }, f: { militarists: 10, reformers: -8 } }, msg: "The fleet moves. So does the war." },
                { label: "Demand talks", e: { gal: { war: -4, diplomacy: 5 }, g: { youth: 3, military: -5 }, f: { reformers: 6, militarists: -8 } }, msg: "Weak, say the hawks. Wise, say the doves." },
                { label: "Say nothing yet", e: {}, msg: "You wait to see which way the wind blows." }
            ],
            def: 2
        })
    },

    corporate_board: {
        weight: 3, deadline: 2,
        setup: () => hasTrait("corporate") ? {} : null,
        build: () => ({
            title: "The Board Wants Seats", from: "Chair of the corporate board", topic: "corporate power",
            text: "The planet's largest corporation proposes that its board appoint a third of the legislature — 'to ensure economic competence'.",
            choices: [
                { label: "Agree", e: { g: { business: 8, elites: 8, workers: -8, unions: -10 }, f: { corporatists: 12, reformers: -12 }, funds: 2, i: { legislature: -8 } }, msg: "The board's candidates take their seats." },
                { label: "Refuse", e: { g: { workers: 5, unions: 6, business: -6 }, f: { corporatists: -10, reformers: 6 }, opp: 2 }, msg: "The board begins looking for a more agreeable leader." },
                { label: "Counter-offer: an advisory council", ap: 3, e: { g: { business: 3 }, f: { corporatists: 3 }, influence: 2 }, msg: "Advice, not power. They accept — for now." }
            ]
        })
    },

    endorsement_request: {
        weight: 2, deadline: 2,
        setup: () => { const a = livingNpcs().filter(n => n.rel >= 20 && n.arena === "senate"); return a.length ? { id: pick(a).id } : null; },
        build: (g, c) => {
            const n = npc(c.id);
            return {
                title: "A Friend Asks for Help", from: n.name, topic: `${lastName(n.name)}'s re-election`,
                text: `${n.name} faces a hard re-election on ${worldName(n.world)} and asks you to campaign for them.`,
                choices: [
                    { label: "Campaign for them", ap: 3, e: { funds: -0.5 }, run: () => { changeRel(n, 18, "You campaigned for them when they needed it."); n.influence = clamp(n.influence + 6); }, msg: "They owe you now." },
                    { label: "Send a warm statement", run: () => changeRel(n, 4), msg: "It's something." },
                    { label: "Decline", run: () => changeRel(n, -8, "You wouldn't lift a finger for them."), msg: "They take it badly." }
                ]
            };
        }
    },

    // ── Triggered dossiers (weight 0: never random) ─────────────────

    ministry_offer: {
        weight: 0, deadline: 3,
        build: (g, c) => {
            const n = npc(c.npcId);
            const m = MINISTRIES.find(x => x.faction === G.ideology) || pick(MINISTRIES);
            return {
                title: "An Offer from the Chancellery", from: n ? n.name : "The Chancellor",
                text: `The Supreme Chancellor offers you the post of ${m.name}. You would give up your Senate seat — and serve at the Chancellor's pleasure.`,
                choices: [
                    { label: `Accept: become ${m.name}`, run: () => { setOffice(makeOffice({ title: m.name, kind: "minister", ministry: m.key })); if (n) changeRel(n, 10, "Accepted a place in their government."); applyEffects({ influence: 12 }); }, msg: "You clear your Senate office and move into the ministry." },
                    { label: "Decline — stay in the Senate", run: () => n && changeRel(n, -5), msg: "The Chancellor is surprised. Some think you're waiting for something bigger." }
                ],
                def: 1
            };
        }
    },

    favor_called: {
        weight: 0, deadline: 2,
        build: (g, c) => {
            const n = npc(c.npcId);
            return {
                title: "A Favour Is Called In", from: n ? n.name : "An old colleague",
                text: `${n ? n.name : "They"} backed you when you needed a vote. Now they need something: your public endorsement of a controversial ${FACTIONS[n ? n.faction : "centralists"].name} position.`,
                choices: [
                    { label: "Pay the debt", e: n ? { f: { [n.faction]: 6, [G.ideology === n.faction ? "reformers" : G.ideology]: -4 } } : {}, run: () => n && changeRel(n, 15, "Paid back the favour they were owed."), msg: "Debt settled. Some of your own side are puzzled." },
                    { label: "Refuse", e: { rep: -4 }, run: () => n && changeRel(n, -40, "Refused to honour the favour you owed them."), msg: "They will tell everyone your word is worthless." }
                ],
                def: 1
            };
        }
    },

    lobbyist: {
        weight: 0, deadline: 2,
        build: (g, c) => ({
            title: "A Visit from the Lobbyist", from: c.donor, topic: "lobbying",
            text: `“Senator, we've been proud supporters of your campaign. We'd appreciate your support for the ${billTitle(c.billKey)}.”`,
            choices: [
                { label: "Promise your vote", run: () => { const b = G.bills.find(x => x.key === c.billKey); if (b) b.playerVote = "for"; }, msg: "You'll vote FOR it. They smile the smile of people who expected nothing less." },
                { label: "Stay noncommittal", msg: "They'll be watching how you vote." },
                { label: "Refuse — and say so publicly", e: { rep: 4, trust: 3, opp: 2 }, run: () => { const d = G.donors[c.donor]; if (d) d.rel -= 30; G.obligations.forEach(o => { if (o.donor === c.donor) o.done = true; }); }, msg: "The Galactic Herald loves it. The donor's money will find your opponent." }
            ],
            def: 1
        })
    },

    scandal: {
        weight: 0, deadline: 1,
        build: (g, c) => ({
            title: "SCANDAL", from: "Every news outlet at once", topic: "the scandal",
            text: `It's out: “${c.text}.” Your phone will not stop ringing.`,
            choices: [
                { label: "Come clean and apologise", e: { trust: -8, rep: -4, heat: -20 }, run: () => exposeSecret(c.text, 0.6), msg: "The apology is raw and, some say, sincere." },
                { label: "Deny everything", run: () => { if (chance(45)) { applyEffects({ heat: -10 }); return "The story fades for lack of proof."; } exposeSecret(c.text, 1.3); applyEffects({ trust: -10, rep: -8 }); return "Then the documents surface. The denial makes it worse."; } },
                { label: "Blame a staffer", e: { rep: -6, heat: -10 }, run: () => { exposeSecret(c.text, 0.8); G.chiefOfStaff = randomName(G.worldKey); }, msg: "Your chief of staff resigns 'to spend time with family'." }
            ],
            def: 1
        })
    },

    final_term: {
        weight: 0, deadline: 3,
        build: () => ({
            title: "One Year Left", from: `Chief of staff ${G.chiefOfStaff}`,
            text: `“Your final term ends in a year. The constitution bars another run as ${G.office.title} — unless it's changed. Or we start preparing what comes next.”`,
            choices: [
                { label: "Begin a campaign to change the term limit", run: () => { if (!G.amendment) G.amendment = { key: "remove_limit", leg: 0, pub: 0, court: 0, started: monthsNow() }; }, msg: "Constitutional campaign opened (see the Charter). It will be a fight." },
                { label: "Accept it — start grooming a successor", e: { rep: 4 }, run: () => { const c = G.family.children.find(x => x.age >= 18); if (c) c.inPolitics = true; }, msg: "You'll leave on your own terms." },
                { label: "Nothing yet", msg: "A problem for later." }
            ],
            def: 2
        })
    }
};

function exposeSecret(text, mult) {
    const s = G.secrets.find(x => x.text === text);
    if (s) s.exposed = true;
    applyEffects({ trust: -6, rep: -5, g: { elders: -3, religious: -3, youth: -2 } }, mult);
    publish("the scandal", { reformers: -5, traditionalists: -5, [G.ideology]: -3 }, true);
    rivals().forEach(n => { n.influence = clamp(n.influence + 3); });
    log(`📰 Scandal: ${text}.`, "scandal");
}
