# Galactic Senate

A political simulation set in a galactic republic. You're a politician, not a
warrior. You work through institutions, elections, legislation, factions, the
press, constitutional crises and personal relationships across a galaxy where
every decision touches something else.

It takes inspiration from **Democracy 3** (a policy web with delayed effects,
voter groups and situations) and **The Political Process** (district-by-district
campaigning and whipping individual legislators).

## Running it

Open `index.html` in a browser. It needs no build step and no server. The game
autosaves to your browser every month.

## What's in it

**24 playable worlds, 55 roles.** Every world ships with its own constitution:
government type, term lengths and limits, how hard it is to amend, judicial
independence, and who controls the military. The same planet plays very
differently depending on the role:

- On Naboo you can be the Senator, the elected Queen, the appointed Governor or
  the Opposition Leader.
- On Mandalore you can be the Duchess, a Clan Leader, the Senator or the
  independence movement's leader.
- On Tatooine you start as the representative of one settlement, with no
  planetary government at all, and can found one.

**The public is not one number.** 15 constituencies (workers, farmers, youth,
veterans, traditional communities and others) each judge you on the conditions
they care about. Six election districts each have their own demographic mix.

**Policy web.** 26 planetary policies are set with sliders. Their effects build
up over months, and they have budget costs. When conditions cross a threshold
(a housing crisis, a crime wave, a debt crisis, an economic boom), a situation
switches on and pushes back on the system. An executive can enact policy by
decree with political capital, which risks court injunctions. Other roles can
send a change to the legislature as a bill. The Supreme Chancellor sets
galactic policy.

**The legislature.** The Senate has 433 seats; planetary legislatures have 100.
Seats belong to faction blocs plus named delegations who remember you. You can
persuade, promise favours, trade votes, give speeches, amend, leak or send a
bill to committee. If you break a promise, that person becomes a rival.

**Money and the press.** Every donor source comes with strings attached;
corporations and unions come back later wanting votes. Seven outlets with their
own politics each spin your decisions their own way.

**Constitutional change.** You can remove term limits, reform the courts,
grant emergency powers, replace clan rule with democracy (or the reverse), or
hold an independence referendum. Each change must pass the legislature, then a
referendum, then judicial review. If you lose an election, you choose between
conceding, challenging the result, or trying to stay in power. The military may
decide how that turns out.

**Careers and dynasty.** You can climb from Local Council Member to Senator,
Minister and Supreme Chancellor, or fall to lobbyist, journalist, exile or
prisoner. When your character dies, retires or is removed, a successor
inherits a galaxy shaped by your programmes, laws, amendments and grudges.

**A living galaxy.** Worlds you don't play still have stability, crises and
independence movements, and their problems end up on your desk.

## Code layout

| File | Contents |
|---|---|
| `js/data.js` | Constituencies, factions, institutions, media, donors, the 24 worlds and their constitutions |
| `js/engine.js` | Game state, derived values, `applyEffects()` (how one decision ripples through every system), NPCs, save/load |
| `js/policy.js` | Policy web, situations, budget, districts |
| `js/legislature.js` | Bills, seat blocs, tallies, lobbying tactics, vote resolution |
| `js/politics.js` | Monthly simulation, elections, legitimacy, Chancellor, constitutional amendments, careers, succession |
| `js/events.js` | Dossiers: decisions with deadlines |
| `js/scenes.js` | Full-screen moments: votes, election night, defeat, referendums, revolution, succession |
| `js/actions.js` | Fundraising, press, relationships, diplomacy |
| `js/ui.js`, `js/main.js` | Views, rendering and input |
