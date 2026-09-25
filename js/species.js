// ── SPECIES & PORTRAITS ─────────────────────────────────────────────
//
// Every playable world lists the species that actually live there. The
// player builds a look from that species' options; canon characters use the
// same renderer. Portraits are procedural SVG (viewBox 120 × 140).

const HUMAN_SKINS = ["#f6d7c3", "#eac1a0", "#d9a57e", "#c28a60", "#a0694a", "#7d4f35", "#5a3825", "#3f271a"];
const HAIR_COLORS = ["#1b1410", "#3b2416", "#6a4127", "#a0662f", "#d8b26a", "#ece2c6", "#8b8b8b", "#b03a2e", "#f4f4f4", "#3a4a8a"];
const EYE_COLORS = ["#3b2a1a", "#5a7fa8", "#4f7a4a", "#8a6a3a", "#6b6b6b", "#d4a017", "#b22222", "#7a3fa8"];
const ATTIRE_COLORS = ["#5b1f3a", "#1f3a5b", "#2d5b3a", "#6b5a2b", "#3a3a3a", "#8a2b2b", "#d8d0c0", "#2b2b4a", "#8a6ab8", "#b86a2b"];

const SPECIES = {
    human:       { name: "Human",        skins: HUMAN_SKINS, hair: true, face: "human", names: "human" },
    zabrak:      { name: "Zabrak",       skins: [...HUMAN_SKINS.slice(1, 6), "#c9a24a", "#b8322a", "#d9c38a"], hair: true, face: "human", features: ["Crown of horns", "Sparse horns", "Ridge horns"], names: "zabrak" },
    twilek:      { name: "Twi'lek",      skins: ["#5aa0d8", "#4fb37a", "#d85a5a", "#e39a3b", "#9b6bc9", "#e8e0d0", "#7fc2c2", "#3a6a9a"], face: "human", features: ["Plain lekku", "Striped lekku", "Spotted lekku"], names: "twilek" },
    togruta:     { name: "Togruta",      skins: ["#d9542b", "#e0783a", "#c23b3b", "#5d8fd4"], face: "human", features: ["Short montrals", "Tall montrals"], names: "togruta" },
    chagrian:    { name: "Chagrian",     skins: ["#4b86c7", "#3a6fae", "#6aa2d9"], face: "human", names: "chagrian" },
    gungan:      { name: "Gungan",       skins: ["#e3a45d", "#c98b52", "#b3a28a", "#8e9ba3"], names: "gungan" },
    moncal:      { name: "Mon Calamari", skins: ["#e08a5c", "#c9705a", "#b56b8a", "#7a9ac2", "#d9a066"], features: ["Smooth", "Mottled"], names: "moncal" },
    quarren:     { name: "Quarren",      skins: ["#7fae8c", "#a4a07a", "#c09a7a", "#8ba3b0"], names: "quarren" },
    wookiee:     { name: "Wookiee",      skins: ["#6b4a2b", "#4a3322", "#2c2019", "#8a6a45", "#a5a09a", "#9a5a2e"], skinLabel: "Fur", names: "wookiee" },
    jawa:        { name: "Jawa",         skins: ["#6b4a2b", "#7a5a3a", "#5a4632"], skinLabel: "Robe", eyesLabel: "Eye glow", eyes: ["#ffd23f", "#ff9f1c", "#fff27a"], names: "jawa" },
    rodian:      { name: "Rodian",       skins: ["#4f9a5a", "#3f7fa0", "#7fae4a"], names: "rodian" },
    ugnaught:    { name: "Ugnaught",     skins: ["#e6b3a0", "#d99c8a", "#c98f7a"], hair: true, names: "ugnaught" },
    geonosian:   { name: "Geonosian",    skins: ["#b3713a", "#8a5a2e", "#c9893d", "#6f5a3a"], features: ["Drone caste", "Aristocrat (winged)"], names: "geonosian" },
    kaminoan:    { name: "Kaminoan",     skins: ["#e8ecef", "#d5dde2", "#c7d3da"], names: "kaminoan" },
    mustafarian: { name: "Mustafarian",  skins: ["#7a4a3a", "#5a3a2a", "#9a5a3a"], names: "mustafarian" },
    sullustan:   { name: "Sullustan",    skins: ["#b9a79a", "#a39284", "#c9b8a8"], names: "sullustan" },
    dathomirian: { name: "Dathomirian",  skins: ["#ece8ee", "#d8d2dc", "#cfc4d4"], hair: true, face: "human", names: "dathomirian" },
    selkath:     { name: "Selkath",      skins: ["#6f8fa8", "#5a7a92", "#8aa6b8"], names: "selkath" },
    // Canon-only species (not offered in character creation).
    neimoidian:  { name: "Neimoidian",   skins: ["#8fa08a", "#7a8f78"], face: "human", npc: true },
    muun:        { name: "Muun",         skins: ["#e5e1da", "#d8d2c8"], face: "human", npc: true },
    hutt:        { name: "Hutt",         skins: ["#9a8a5a", "#7f7448"], npc: true }
};

const HAIR_STYLES = { none: "Bald / none", short: "Short", long: "Long", bun: "Bun", royal: "Royal updo", curly: "Curly", braids: "Braids", mohawk: "Crest" };
const MARKS = { none: "None", tattoo: "Facial tattoos", royal: "Royal face paint", pantoran: "Gold markings", scar: "Scar", freckles: "Freckles" };
const ACCESSORIES = { none: "None", circlet: "Circlet", headdress: "Royal headdress", hood: "Hood", earrings: "Earrings", helmet: "Mandalorian helmet", beard: "Beard", headwrap: "Headwrap" };
const ATTIRES = { robes: "Senatorial robes", royal: "Royal regalia", uniform: "Military uniform", civilian: "Civilian clothes", worker: "Work clothes", armor: "Beskar armour", rebel: "Rebel gear", clerical: "Clerical robes" };
const AGES = { young: "Young", prime: "Prime", elder: "Elder" };

const NAME_POOLS = {
    human: { first: ["Varo", "Mira", "Tessa", "Kael", "Sira", "Dorn", "Jessa", "Talon", "Ileen", "Ryn", "Voss", "Amara", "Cato", "Nell", "Pell", "Quin", "Rhea", "Teo", "Wen", "Yara", "Halle", "Fenn", "Lira", "Neva", "Pax", "Soren", "Tamsin", "Juno", "Ansel", "Brisa", "Corin", "Faye", "Gideon", "Isolde", "Jaron", "Kira", "Lucan", "Sabé", "Dormé", "Jobal", "Ruwee", "Winama", "Tal", "Arven", "Cassia"],
             last: ["Denn", "Ossary", "Kell", "Thorne", "Maddox", "Vantis", "Rhyce", "Salo", "Drenn", "Farr", "Garrow", "Hallis", "Jorrin", "Loor", "Merro", "Nabrun", "Orrin", "Palo", "Quell", "Rostek", "Sarn", "Vell", "Wyse", "Aster", "Brannis", "Coldry", "Dravic", "Estemar", "Fallow", "Holloway", "Ivane", "Korvane", "Naberrie", "Tarpals", "Antilles", "Bel", "Teem", "Organa", "Crane"] },
    zabrak: { first: ["Sugi", "Eeth", "Agen", "Mak", "Kora", "Zal", "Dex", "Rhen"], last: ["Tor", "Koth", "Vas", "Dral", "Iridonia", "Zev", "Kaan"] },
    twilek: { first: ["Hera", "Numa", "Cham", "Isval", "Aayla", "Bib", "Orra", "Tawl", "Gobi", "Lyn", "Seela", "Mazo"], last: ["Syndulla", "Tavi", "Seln", "Bey", "Doro", "Taa", "Fortuna", "Kenn", "Ril", "Vora"] },
    togruta: { first: ["Shaak", "Ahsa", "Kaeden", "Tesri", "Rava", "Kiro"], last: ["Ti", "Tano", "Vey", "Mahl", "Oru"] },
    chagrian: { first: ["Mas", "Yarua", "Sly", "Kavan", "Omas"], last: ["Amedda", "Moore", "Tessh", "Karaan"] },
    gungan: { first: ["Roos", "Rugor", "Lyntin", "Peppi", "Toba", "Jerben", "Gashi"], last: ["Tarpals", "Nass", "Bow", "Binks", "Guulo", "Mottu"] },
    moncal: { first: ["Meena", "Raddus", "Tundra", "Yos", "Ackbar", "Lee", "Oonai", "Terrec", "Amila", "Kellsa"], last: ["Tills", "Kolina", "Dowmeia", "Char", "Vorr", "Lass", "Qor", "Tundo"] },
    quarren: { first: ["Nossor", "Tikkes", "Riff", "Vlat", "Ossus", "Kerr"], last: ["Ri", "Tamaran", "Sokk", "Lunna", "Varr"] },
    wookiee: { single: ["Tarfful", "Yarua", "Rrowkarr", "Tarrwyk", "Kallorr", "Grraaw", "Wookarra", "Chalyyk", "Rarrkyn", "Lowwokk", "Attichitcuk", "Mallatobuck", "Krykna"] },
    jawa: { single: ["Utinni", "Tteel Kkak", "Het Nkik", "Wimateeka", "Aninkin", "Jek Nu"] },
    rodian: { first: ["Onaconda", "Greedo", "Navik", "Wald", "Kelko", "Beed"], last: ["Farr", "Tetsu", "Poolo", "Rhoe", "Zuna"] },
    ugnaught: { first: ["Pollo", "Vargo", "Kuiil", "Bim", "Chuff"], last: ["Grub", "Pek", "Swoad", "Hoort"] },
    geonosian: { single: ["Poggle", "Sun Fac", "Gizor Dellso", "Karina", "Tuk'aar", "Ssi'kran", "Vok Zeen", "Kli'tar"] },
    kaminoan: { first: ["Lama", "Taun", "Ko", "Nala", "Halle", "Ti", "Kwa"], last: ["Su", "We", "Sai", "Se", "Burtoni", "Wen", "Vee"] },
    mustafarian: { single: ["Ahkt", "Nokk-Tor", "Vuuk", "Gral Morr", "Tchak", "Oonek"] },
    sullustan: { first: ["Sian", "Nien", "Dar", "Aven", "Syub", "Tolh"], last: ["Tevv", "Nunb", "Barr", "Tuur", "Sulo"] },
    dathomirian: { first: ["Talzin", "Merrin", "Asajj", "Karis", "Naa'leth", "Luce", "Daka", "Savage", "Feral"], last: ["of the Nightsisters", "Ventress", "Opress", "of the Red Mist"] },
    selkath: { single: ["Shasa", "Ahtoba", "Sulas", "Kolt Varo", "Ahlan", "Tweel"] }
};

function randomName(worldKey, species) {
    const w = WORLDS[worldKey];
    const sp = species || (w ? pick(w.species) : "human");
    const pool = NAME_POOLS[SPECIES[sp] && SPECIES[sp].names] || NAME_POOLS.human;
    if (pool.single) return pick(pool.single);
    return `${pick(pool.first)} ${pick(pool.last)}`;
}

function randomAppearance(species) {
    const sp = SPECIES[species];
    return {
        species,
        skin: pick(sp.skins),
        eyes: pick(sp.eyes || EYE_COLORS),
        hair: sp.hair ? pick(["short", "long", "bun", "curly", "braids", "none"]) : "none",
        hairColor: pick(HAIR_COLORS.slice(0, 8)),
        feature: sp.features ? 0 : null,
        marks: species === "dathomirian" ? "tattoo" : "none",
        accessory: "none",
        attire: "robes",
        attireColor: pick(ATTIRE_COLORS),
        age: "prime"
    };
}


// ── Rendering ─────────────────────────────────────────────────────

function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = c => clamp(Math.round(c + amt), 0, 255);
    const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

let portraitSeq = 0;

function renderPortrait(a, size = 120, bg = null) {
    if (!a) return "";
    const id = `pt${portraitSeq++}`;
    const sp = a.species;
    const skin = a.skin || "#d9a57e";
    const dark = shade(skin, -40);
    const light = shade(skin, 30);
    const hair = a.hairColor || "#3b2416";
    const eye = a.eyes || "#3b2a1a";
    const cloth = a.attireColor || "#1f3a5b";
    const elder = a.age === "elder";
    const young = a.age === "young";
    const back = [], mid = [], head = [], front = [];

    const bgc = bg || shade(cloth, 25);
    back.push(`<rect width="120" height="140" fill="url(#${id}bg)"/>`);

    // ── Attire / shoulders
    const body = `<path d="M10 140 Q12 106 38 99 Q60 93 82 99 Q108 106 110 140Z" fill="${cloth}"/>`;
    const trim = "#d8ad4f";
    let attire = body;
    switch (a.attire) {
        case "royal":
            attire += `<path d="M30 102 Q60 126 90 102 L94 112 Q60 136 26 112Z" fill="${shade(cloth, 25)}" stroke="${trim}" stroke-width="1.5"/>`
                + `<circle cx="60" cy="122" r="3.5" fill="${trim}"/><circle cx="44" cy="116" r="2" fill="${trim}"/><circle cx="76" cy="116" r="2" fill="${trim}"/>`;
            break;
        case "uniform":
            attire += `<rect x="18" y="101" width="18" height="6" rx="2" fill="${shade(cloth, 35)}"/><rect x="84" y="101" width="18" height="6" rx="2" fill="${shade(cloth, 35)}"/>`
                + `<path d="M60 100 L60 140" stroke="${shade(cloth, -30)}" stroke-width="2"/><rect x="66" y="112" width="10" height="4" fill="${trim}"/><rect x="66" y="118" width="10" height="3" fill="#b8324a"/>`;
            break;
        case "armor":
            attire = `<path d="M10 140 Q12 106 38 99 Q60 93 82 99 Q108 106 110 140Z" fill="#8a929c"/>`
                + `<ellipse cx="24" cy="110" rx="16" ry="10" fill="${cloth}"/><ellipse cx="96" cy="110" rx="16" ry="10" fill="${cloth}"/>`
                + `<path d="M40 108 L80 108 L76 134 L44 134Z" fill="#a9b1ba" stroke="#5f666e"/>`;
            break;
        case "rebel":
            attire = `<path d="M10 140 Q12 106 38 99 Q60 93 82 99 Q108 106 110 140Z" fill="#d8d0c0"/>`
                + `<path d="M14 140 Q16 108 40 100 L50 140Z M106 140 Q104 108 80 100 L70 140Z" fill="${cloth}"/>`;
            break;
        case "worker":
            attire += `<path d="M36 100 L46 140 M84 100 L74 140" stroke="${shade(cloth, -35)}" stroke-width="5"/>`;
            break;
        case "clerical":
            attire += `<path d="M44 99 Q60 120 76 99" fill="none" stroke="${trim}" stroke-width="2"/><path d="M60 110 L60 140" stroke="${trim}" stroke-width="2"/>`;
            break;
        case "civilian":
            attire += `<path d="M48 98 L60 112 L72 98" fill="${shade(cloth, 30)}"/>`;
            break;
        default: // senatorial robes
            attire += `<path d="M42 99 L60 124 L78 99" fill="${shade(cloth, 30)}" stroke="${trim}" stroke-width="1"/>`
                + `<path d="M26 112 Q34 122 32 140 M94 112 Q86 122 88 140" stroke="${shade(cloth, -25)}" stroke-width="2" fill="none"/>`;
    }

    const neck = `<rect x="52" y="76" width="16" height="26" fill="${dark}"/>`;
    const eyesHuman = (y = 57, dx = 8, r = 2) => `
        <ellipse cx="${60 - dx}" cy="${y}" rx="3.8" ry="2.4" fill="#fff"/><ellipse cx="${60 + dx}" cy="${y}" rx="3.8" ry="2.4" fill="#fff"/>
        <circle cx="${60 - dx}" cy="${y}" r="${r}" fill="${eye}"/><circle cx="${60 + dx}" cy="${y}" r="${r}" fill="${eye}"/>
        <circle cx="${60 - dx}" cy="${y}" r="0.9" fill="#111"/><circle cx="${60 + dx}" cy="${y}" r="0.9" fill="#111"/>
        <path d="M${60 - dx - 5} ${y - 5} Q${60 - dx} ${y - 7.5} ${60 - dx + 5} ${y - 5.5} M${60 + dx - 5} ${y - 5.5} Q${60 + dx} ${y - 7.5} ${60 + dx + 5} ${y - 5}" stroke="${sp === "human" || SPECIES[sp].hair ? shade(hair, 10) : dark}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    const noseMouth = (lip = shade(skin, -55)) => `
        <path d="M60 60 Q57.5 67 59.5 69 Q61.5 69.5 63 68" stroke="${dark}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M53 75.5 Q60 ${young ? 79 : 78.5} 67 75.5" stroke="${lip}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
    const humanHead = (rx = 21, ry = 26) => `
        <ellipse cx="39" cy="60" rx="3.5" ry="6" fill="${skin}"/><ellipse cx="81" cy="60" rx="3.5" ry="6" fill="${skin}"/>
        <ellipse cx="60" cy="58" rx="${rx}" ry="${ry}" fill="${skin}"/>
        <path d="M${60 - rx + 3} 66 Q60 ${58 + ry + 4} ${60 + rx - 3} 66" fill="none" stroke="${dark}" stroke-opacity=".25" stroke-width="3"/>`;

    // ── Species heads
    let face = true;
    const f = a.feature || 0;
    switch (sp) {
        case "gungan": {
            mid.push(`<path d="M46 30 Q24 72 32 124 Q40 128 44 120 Q40 72 54 38Z" fill="${dark}"/><path d="M74 30 Q96 72 88 124 Q80 128 76 120 Q80 72 66 38Z" fill="${dark}"/>`);
            head.push(`<rect x="52" y="76" width="16" height="26" fill="${dark}"/><ellipse cx="60" cy="52" rx="17" ry="28" fill="${skin}"/>
                <ellipse cx="60" cy="78" rx="13" ry="9" fill="${light}"/>
                <path d="M53 30 L50 18 M67 30 L70 18" stroke="${skin}" stroke-width="4"/><circle cx="50" cy="17" r="5" fill="${skin}"/><circle cx="70" cy="17" r="5" fill="${skin}"/>
                <circle cx="50" cy="16" r="2.6" fill="${eye}"/><circle cx="70" cy="16" r="2.6" fill="${eye}"/>
                <path d="M50 82 Q60 86 70 82" stroke="${dark}" stroke-width="1.5" fill="none"/>`);
            face = false; break;
        }
        case "moncal": {
            head.push(`${neck}<path d="M36 70 Q34 26 60 22 Q86 26 84 70 Q74 88 60 88 Q46 88 36 70Z" fill="${skin}"/>
                ${f === 1 ? [[50, 36], [66, 32], [72, 46], [46, 50], [58, 44], [76, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${dark}" opacity=".45"/>`).join("") : ""}
                <circle cx="39" cy="56" r="7.5" fill="${shade(eye, -20)}"/><circle cx="81" cy="56" r="7.5" fill="${shade(eye, -20)}"/>
                <circle cx="37" cy="54" r="2" fill="#fff" opacity=".8"/><circle cx="79" cy="54" r="2" fill="#fff" opacity=".8"/>
                <path d="M54 80 Q60 82 66 80" stroke="${dark}" stroke-width="1.5" fill="none"/>`);
            face = false; break;
        }
        case "quarren": {
            head.push(`${neck}<path d="M38 64 Q38 22 60 22 Q82 22 82 64 Z" fill="${skin}"/>
                <circle cx="50" cy="50" r="3.2" fill="${eye}"/><circle cx="70" cy="50" r="3.2" fill="${eye}"/>
                ${[44, 52, 60, 68, 76].map((x, i) => `<path d="M${x} 60 Q${x + (i % 2 ? 4 : -4)} 78 ${x + (i - 2) * 2} 96" stroke="${shade(skin, -15)}" stroke-width="5" fill="none" stroke-linecap="round"/>`).join("")}`);
            face = false; break;
        }
        case "wookiee": {
            const pts = [];
            for (let i = 0; i < 28; i++) { const t = i / 28 * Math.PI * 2; const r = (i % 2 ? 30 : 25); pts.push(`${(60 + r * Math.cos(t)).toFixed(1)},${(60 + r * 1.12 * Math.sin(t)).toFixed(1)}`); }
            mid.push(`<path d="M28 60 Q20 110 36 130 L84 130 Q100 110 92 60Z" fill="${skin}"/>`);
            head.push(`<polygon points="${pts.join(" ")}" fill="${skin}"/>
                <ellipse cx="60" cy="66" rx="13" ry="15" fill="${dark}"/>
                <circle cx="53" cy="56" r="2.4" fill="${eye}"/><circle cx="67" cy="56" r="2.4" fill="${eye}"/>
                <path d="M56 66 L64 66 L60 71Z" fill="#1a120c"/><path d="M53 76 Q60 80 67 76" stroke="#1a120c" stroke-width="1.6" fill="none"/>
                ${elder ? `<path d="M40 44 Q60 38 80 44" stroke="#bbb" stroke-width="3" fill="none" opacity=".6"/>` : ""}`);
            if (a.attire !== "armor") front.push(`<path d="M30 104 L92 140" stroke="#5a3a1a" stroke-width="7"/><rect x="56" y="114" width="8" height="6" fill="#aaa" transform="rotate(30 60 117)"/>`);
            face = false; break;
        }
        case "jawa": {
            head.push(`<path d="M28 122 Q32 40 60 26 Q88 40 92 122Z" fill="${skin}"/><ellipse cx="60" cy="64" rx="16" ry="18" fill="#0a0806"/>
                <circle cx="53" cy="62" r="4" fill="${eye}" opacity=".35"/><circle cx="67" cy="62" r="4" fill="${eye}" opacity=".35"/>
                <circle cx="53" cy="62" r="2.4" fill="${eye}"/><circle cx="67" cy="62" r="2.4" fill="${eye}"/>
                <path d="M30 90 Q60 100 90 90" stroke="${shade(skin, -25)}" stroke-width="3" fill="none"/>`);
            face = false; attire = ""; break;
        }
        case "rodian": {
            head.push(`${neck}<path d="M40 62 Q34 28 60 26 Q86 28 80 62 Q70 88 60 90 Q50 88 40 62Z" fill="${skin}"/>
                <ellipse cx="48" cy="54" rx="8" ry="10" fill="#0c1a2a"/><ellipse cx="72" cy="54" rx="8" ry="10" fill="#0c1a2a"/>
                <ellipse cx="46" cy="50" rx="2.5" ry="3" fill="#fff" opacity=".6"/><ellipse cx="70" cy="50" rx="2.5" ry="3" fill="#fff" opacity=".6"/>
                <ellipse cx="60" cy="78" rx="4.5" ry="6" fill="${dark}"/>
                <path d="M50 28 Q46 18 50 14 M70 28 Q74 18 70 14" stroke="${skin}" stroke-width="2.5" fill="none"/>`);
            face = false; break;
        }
        case "ugnaught": {
            head.push(`${neck}${humanHead(24, 24)}<ellipse cx="60" cy="68" rx="8" ry="5.5" fill="${dark}"/><circle cx="57" cy="68" r="1.4" fill="#2a1a12"/><circle cx="63" cy="68" r="1.4" fill="#2a1a12"/>
                <circle cx="52" cy="56" r="2" fill="${eye}"/><circle cx="68" cy="56" r="2" fill="${eye}"/>
                <path d="M44 78 Q52 90 60 80 Q68 90 76 78 Q70 98 60 96 Q50 98 44 78Z" fill="${a.hairColor || "#f4f4f4"}"/>`);
            face = false; break;
        }
        case "geonosian": {
            if (f === 1) back.push(`<path d="M60 90 Q10 60 8 120 Q40 110 60 100Z M60 90 Q110 60 112 120 Q80 110 60 100Z" fill="#c9e0e0" opacity=".35" stroke="#9ab" stroke-width=".7"/>`);
            head.push(`<rect x="53" y="74" width="14" height="28" fill="${dark}"/><path d="M42 72 Q34 34 54 24 Q72 18 84 34 Q88 60 74 80 Q62 90 50 86Z" fill="${skin}"/>
                <path d="M54 26 Q66 30 80 26 M50 34 Q66 38 84 34 M48 42 Q66 46 86 42" stroke="${dark}" stroke-width="1.2" fill="none"/>
                <ellipse cx="46" cy="56" rx="6.5" ry="8.5" fill="#2a120a"/><ellipse cx="76" cy="56" rx="6.5" ry="8.5" fill="#2a120a"/>
                <ellipse cx="45" cy="53" rx="2" ry="2.5" fill="#e0b070" opacity=".6"/><ellipse cx="75" cy="53" rx="2" ry="2.5" fill="#e0b070" opacity=".6"/>
                <path d="M54 80 L58 88 L62 80 M62 80 L66 88" stroke="${dark}" stroke-width="2" fill="none"/>`);
            face = false; break;
        }
        case "kaminoan": {
            head.push(`<path d="M55 50 Q54 90 50 104 L70 104 Q66 90 65 50Z" fill="${skin}"/><ellipse cx="60" cy="38" rx="15" ry="21" fill="${skin}"/>
                <path d="M60 17 Q74 18 74 30" stroke="${shade(skin, -20)}" stroke-width="1.5" fill="none"/>
                <ellipse cx="53" cy="40" rx="4" ry="6.5" fill="#101418"/><ellipse cx="67" cy="40" rx="4" ry="6.5" fill="#101418"/>
                <circle cx="52" cy="37" r="1.3" fill="#fff" opacity=".7"/><circle cx="66" cy="37" r="1.3" fill="#fff" opacity=".7"/>
                <path d="M57 54 Q60 55 63 54" stroke="${shade(skin, -40)}" stroke-width="1.2" fill="none"/>`);
            face = false; break;
        }
        case "mustafarian": {
            head.push(`<rect x="52" y="80" width="16" height="22" fill="${dark}"/><path d="M44 92 Q38 40 60 12 Q82 40 76 92Z" fill="${skin}"/>
                ${[30, 44, 58, 72].map(y => `<path d="M${46 - (y - 30) / 10} ${y} Q60 ${y + 4} ${74 + (y - 30) / 10} ${y}" stroke="${dark}" stroke-width="1.5" fill="none"/>`).join("")}
                <rect x="49" y="62" width="8" height="2.5" rx="1" fill="#ff8a3a"/><rect x="63" y="62" width="8" height="2.5" rx="1" fill="#ff8a3a"/>`);
            face = false; break;
        }
        case "sullustan": {
            head.push(`${neck}<circle cx="35" cy="50" r="9" fill="${skin}"/><circle cx="85" cy="50" r="9" fill="${skin}"/><circle cx="35" cy="50" r="5" fill="${dark}"/><circle cx="85" cy="50" r="5" fill="${dark}"/>
                <ellipse cx="60" cy="58" rx="23" ry="24" fill="${skin}"/>
                <ellipse cx="46" cy="76" rx="9" ry="8" fill="${shade(skin, -12)}"/><ellipse cx="74" cy="76" rx="9" ry="8" fill="${shade(skin, -12)}"/>
                <ellipse cx="50" cy="56" rx="6" ry="7" fill="#0a0a0a"/><ellipse cx="70" cy="56" rx="6" ry="7" fill="#0a0a0a"/>
                <circle cx="48" cy="53" r="1.6" fill="#fff" opacity=".7"/><circle cx="68" cy="53" r="1.6" fill="#fff" opacity=".7"/>
                <path d="M56 78 Q60 80 64 78" stroke="${dark}" stroke-width="1.4" fill="none"/>`);
            face = false; break;
        }
        case "selkath": {
            head.push(`${neck}<path d="M60 22 Q58 30 60 36" stroke="${dark}" stroke-width="5"/>
                <path d="M32 64 Q34 34 60 32 Q86 34 88 64 Q82 86 60 88 Q38 86 32 64Z" fill="${skin}"/>
                <circle cx="42" cy="46" r="4" fill="${eye}"/><circle cx="78" cy="46" r="4" fill="${eye}"/>
                <path d="M36 62 L40 66 M36 68 L40 72 M84 62 L80 66 M84 68 L80 72" stroke="${dark}" stroke-width="1.5"/>
                <path d="M44 76 Q60 82 76 76" stroke="${dark}" stroke-width="2" fill="none"/><path d="M50 80 L48 92 M60 82 L60 94 M70 80 L72 92" stroke="${skin}" stroke-width="2.5"/>`);
            face = false; break;
        }
        case "hutt": {
            attire = `<ellipse cx="60" cy="130" rx="58" ry="30" fill="${skin}"/>`;
            head.push(`<ellipse cx="60" cy="72" rx="42" ry="32" fill="${skin}"/><ellipse cx="60" cy="80" rx="30" ry="18" fill="${light}" opacity=".4"/>
                <ellipse cx="44" cy="62" rx="6" ry="4" fill="#e0a020"/><ellipse cx="76" cy="62" rx="6" ry="4" fill="#e0a020"/><rect x="43" y="60" width="2" height="4" fill="#111"/><rect x="75" y="60" width="2" height="4" fill="#111"/>
                <path d="M30 84 Q60 96 90 84" stroke="${dark}" stroke-width="2.5" fill="none"/>`);
            face = false; break;
        }
    }

    // ── Human-type faces (human, zabrak, twi'lek, togruta, chagrian, dathomirian, neimoidian, muun)
    if (face) {
        const long = a.hair === "long" || a.hair === "braids";
        if (long && SPECIES[sp].hair) back.push(`<path d="M34 56 Q34 24 60 24 Q86 24 86 56 L88 106 Q60 114 32 106Z" fill="${hair}"/>`);
        if (sp === "twilek" || sp === "togruta") {
            const lek = sp === "togruta" ? shade(skin, 5) : skin;
            const len = sp === "togruta" ? 104 : 124;
            mid.push(`<path d="M47 40 Q26 62 34 ${len} Q42 ${len + 4} 46 ${len - 6} Q42 72 56 44Z" fill="${lek}"/><path d="M73 40 Q94 62 86 ${len} Q78 ${len + 4} 74 ${len - 6} Q78 72 64 44Z" fill="${lek}"/>`);
            if ((sp === "twilek" && f === 1) || sp === "togruta") mid.push(`<path d="M38 70 Q42 72 44 68 M36 86 Q40 88 44 84 M37 102 Q41 104 44 100 M82 70 Q78 72 76 68 M84 86 Q80 88 76 84 M83 102 Q79 104 76 100" stroke="${sp === "togruta" ? "#f4f4f4" : dark}" stroke-width="3" fill="none"/>`);
            if (sp === "twilek" && f === 2) mid.push([[38, 74], [40, 92], [42, 108], [82, 74], [80, 92], [78, 108]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${dark}"/>`).join(""));
        }
        if (sp === "chagrian") mid.push(`<path d="M42 60 Q28 92 38 124 Q46 120 46 86Z" fill="${skin}"/><path d="M78 60 Q92 92 82 124 Q74 120 74 86Z" fill="${skin}"/>`);
        head.push(neck);
        if (sp === "muun") head.push(`<ellipse cx="60" cy="50" rx="15" ry="32" fill="${skin}"/>`);
        else if (sp === "neimoidian") head.push(`<ellipse cx="60" cy="60" rx="21" ry="24" fill="${skin}"/>`);
        else head.push(humanHead(sp === "twilek" || sp === "togruta" ? 19 : 21, 26));
        if (sp === "togruta") {
            const tall = f === 1 ? 0 : 10;
            head.push(`<path d="M45 40 Q30 ${16 + tall} 38 ${2 + tall} Q46 ${14 + tall} 54 36Z" fill="#f4f4f4"/><path d="M75 40 Q90 ${16 + tall} 82 ${2 + tall} Q74 ${14 + tall} 66 36Z" fill="#f4f4f4"/>
                <path d="M41 ${22 + tall} Q44 ${24 + tall} 46 ${20 + tall} M79 ${22 + tall} Q76 ${24 + tall} 74 ${20 + tall}" stroke="${skin}" stroke-width="3" fill="none"/>
                <path d="M48 46 Q52 52 50 58 M72 46 Q68 52 70 58 M56 70 Q60 74 64 70" stroke="#f4f4f4" stroke-width="3" fill="none" opacity=".9"/>`);
        }
        if (sp === "chagrian") head.push(`<path d="M48 36 L44 26 L52 34Z M72 36 L76 26 L68 34Z" fill="${light}"/>`);
        if (sp === "neimoidian") {
            head.push(`<ellipse cx="52" cy="58" rx="3.8" ry="2.8" fill="#e05a2a"/><ellipse cx="68" cy="58" rx="3.8" ry="2.8" fill="#e05a2a"/><circle cx="52" cy="58" r="1.2" fill="#111"/><circle cx="68" cy="58" r="1.2" fill="#111"/>
                <path d="M57 68 L58 66 M63 68 L62 66" stroke="${dark}" stroke-width="1.5"/><path d="M52 76 Q60 74 68 76" stroke="${dark}" stroke-width="1.8" fill="none"/>`);
        } else if (sp === "muun") {
            head.push(`<ellipse cx="54" cy="56" rx="2.5" ry="1.8" fill="#333"/><ellipse cx="66" cy="56" rx="2.5" ry="1.8" fill="#333"/><path d="M56 72 Q60 73 64 72" stroke="${dark}" stroke-width="1.2" fill="none"/>`);
        } else {
            head.push(eyesHuman(), noseMouth(a.marks === "royal" ? "#c0182a" : undefined));
        }
        if (elder) head.push(`<path d="M44 52 Q47 50 49 52 M71 52 Q73 50 76 52 M48 70 Q46 74 48 78 M72 70 Q74 74 72 78 M50 42 Q60 40 70 42" stroke="${dark}" stroke-width="1" fill="none" opacity=".6"/>`);
        if (sp === "zabrak") {
            const horns = f === 1 ? [[50, 33], [70, 33], [60, 30]] : f === 2 ? [[52, 32], [57, 30], [63, 30], [68, 32]] : [[46, 38], [52, 33], [60, 31], [68, 33], [74, 38]];
            head.push(horns.map(([x, y]) => `<path d="M${x - 3} ${y + 3} L${x} ${y - (f === 2 ? 3 : 7)} L${x + 3} ${y + 3}Z" fill="${shade(skin, 50)}" stroke="${dark}" stroke-width=".6"/>`).join(""));
        }
        // Hair (top)
        if (SPECIES[sp].hair && a.hair && a.hair !== "none") {
            const hs = {
                short: `<path d="M38 56 Q38 28 60 28 Q82 28 82 56 Q78 40 60 38 Q42 40 38 56Z" fill="${hair}"/>`,
                long: `<path d="M38 60 Q36 28 60 28 Q84 28 82 60 Q78 40 60 38 Q42 40 38 60Z" fill="${hair}"/>`,
                braids: `<path d="M38 56 Q38 28 60 28 Q82 28 82 56 Q78 40 60 38 Q42 40 38 56Z" fill="${hair}"/><path d="M38 60 Q34 84 38 104 M82 60 Q86 84 82 104" stroke="${shade(hair, 15)}" stroke-width="5" stroke-dasharray="4 2" fill="none"/>`,
                bun: `<path d="M38 56 Q38 28 60 28 Q82 28 82 56 Q78 40 60 38 Q42 40 38 56Z" fill="${hair}"/><circle cx="60" cy="24" r="10" fill="${hair}"/>`,
                royal: `<path d="M26 44 Q24 6 60 8 Q96 6 94 44 Q80 30 60 34 Q40 30 26 44Z" fill="${hair}"/><path d="M38 56 Q38 32 60 32 Q82 32 82 56 Q78 42 60 40 Q42 42 38 56Z" fill="${hair}"/>`,
                curly: [[42, 42], [48, 34], [56, 30], [64, 30], [72, 34], [78, 42], [40, 50], [80, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${hair}"/>`).join(""),
                mohawk: `<path d="M54 44 Q56 18 60 16 Q64 18 66 44Z" fill="${hair}"/>`
            };
            head.push(hs[a.hair] || "");
        }
        // Marks
        if (a.marks === "royal") head.push(`<ellipse cx="60" cy="58" rx="20" ry="25" fill="#fbf7f2" opacity=".82"/>${eyesHuman()}<path d="M56 76 Q60 78.5 64 76" stroke="#c0182a" stroke-width="2.4" fill="none"/><path d="M60 72 L60 81" stroke="#c0182a" stroke-width="1.2"/><circle cx="46" cy="66" r="1.6" fill="#c0182a"/><circle cx="74" cy="66" r="1.6" fill="#c0182a"/>`);
        if (a.marks === "tattoo") head.push(`<path d="M50 36 L54 46 L50 52 M70 36 L66 46 L70 52 M60 34 L60 46 M46 66 L52 70 M74 66 L68 70 M60 80 L60 86" stroke="${sp === "dathomirian" ? "#6a2a7a" : "#1a1a1a"}" stroke-width="2" fill="none" opacity=".85"/>`);
        if (a.marks === "pantoran") head.push(`<path d="M46 64 L54 64 M66 64 L74 64 M56 84 L64 84 M47 68 L53 68 M67 68 L73 68" stroke="#e0b030" stroke-width="1.8"/>`);
        if (a.marks === "scar") head.push(`<path d="M66 46 L74 66" stroke="${shade(skin, -60)}" stroke-width="1.6"/>`);
        if (a.marks === "freckles") head.push([[48, 64], [51, 66], [46, 67], [72, 64], [69, 66], [74, 67]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="${dark}"/>`).join(""));
        if (a.accessory === "beard") head.push(`<path d="M40 64 Q42 90 60 94 Q78 90 80 64 Q76 80 66 80 L54 80 Q44 80 40 64Z" fill="${hair}"/>`);
    }

    // ── Accessories (most apply to any head)
    const acc = a.accessory;
    if (acc === "hood") back.push(`<path d="M24 120 Q22 30 60 20 Q98 30 96 120Z" fill="${shade(cloth, -15)}"/>`);
    if (acc === "circlet") front.push(`<path d="M40 42 Q60 36 80 42" stroke="#d8ad4f" stroke-width="2.4" fill="none"/><circle cx="60" cy="38.5" r="2.6" fill="#6ad0e0"/>`);
    if (acc === "headdress") front.push(`<path d="M30 34 Q30 4 60 2 Q90 4 90 34 Q76 22 60 24 Q44 22 30 34Z" fill="${shade(cloth, 10)}" stroke="#d8ad4f" stroke-width="1.5"/><circle cx="60" cy="14" r="4" fill="#d8ad4f"/><path d="M36 30 L36 44 M84 30 L84 44" stroke="#d8ad4f" stroke-width="1.5"/><circle cx="36" cy="46" r="2" fill="#d8ad4f"/><circle cx="84" cy="46" r="2" fill="#d8ad4f"/>`);
    if (acc === "earrings") front.push(`<circle cx="38" cy="68" r="2.2" fill="#d8ad4f"/><circle cx="82" cy="68" r="2.2" fill="#d8ad4f"/>`);
    if (acc === "headwrap") front.push(`<path d="M40 44 Q60 32 80 44 L80 48 Q60 38 40 48Z" fill="${shade(cloth, 20)}"/>`);
    if (acc === "helmet") front.push(`<path d="M36 64 Q34 26 60 24 Q86 26 84 64 L84 84 Q60 92 36 84Z" fill="#8a929c" stroke="#5f666e"/><path d="M42 50 L78 50 L78 57 L64 57 L64 78 L56 78 L56 57 L42 57Z" fill="#101418"/><path d="M42 36 Q60 30 78 36" stroke="${cloth}" stroke-width="4" fill="none"/>`);
    if (sp === "neimoidian") front.push(`<path d="M42 44 Q40 10 60 4 Q80 10 78 44 Q60 36 42 44Z" fill="${cloth}" stroke="#d8ad4f"/>`);

    return `<svg class="portrait" viewBox="0 0 120 140" width="${size}" height="${Math.round(size * 140 / 120)}" role="img" aria-label="${esc(SPECIES[sp] ? SPECIES[sp].name : "")} portrait">
        <defs><linearGradient id="${id}bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(bgc, -10)}"/><stop offset="1" stroke-opacity="0" stop-color="${shade(bgc, -55)}"/></linearGradient></defs>
        ${back.join("")}${attire}${mid.join("")}${head.join("")}${front.join("")}</svg>`;
}
