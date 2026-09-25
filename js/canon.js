// ── CANON CHARACTERS ────────────────────────────────────────────────
//
// Star Wars characters are political actors, not quest-givers. Each has an
// ideology, objectives, fears, a loyalty and a career — and they remember
// how you treated them. The player never replaces the story; they live
// alongside it. If the player takes a canon character's office, that
// character is still in the galaxy under an alternate title.
//
// from/to: BBY years during which they are active in politics (negative = ABY).

const A = (species, skin, o = {}) => Object.assign({ species, skin, eyes: "#3b2a1a", hair: "none", hairColor: "#3b2416", feature: 0, marks: "none", accessory: "none", attire: "robes", attireColor: "#2b2b4a", age: "prime" }, o);

const CANON = {
    palpatine: { name: "Sheev Palpatine", world: "naboo", arena: "senate", seat: true, title: "Senator of Naboo", alt: "Former Senator of Naboo", faction: "centralists", influence: 72, from: 32, to: -4,
        app: A("human", "#eac1a0", { hair: "short", hairColor: "#9a9a9a", age: "elder", attireColor: "#3a1a2a", eyes: "#5a7fa8" }),
        ideology: "Order, security and a stronger central government", objectives: ["Become Supreme Chancellor", "Accumulate emergency powers"], fears: ["A Senate that can say no"], loyalty: "republic",
        voice: { ally: "My friend — the Republic needs leaders who understand that sometimes order must come first.", rival: "We have had our differences, Senator. I would so like to put them behind us.", neutral: "I have followed your career with great interest.", sep: "I am saddened that your world has chosen this path. The Republic's door is always open." } },
    valorum: { name: "Finis Valorum", world: "coruscant", arena: "senate", title: "Supreme Chancellor", faction: "centralists", influence: 60, from: 32, to: 32, chancellor: true,
        app: A("human", "#eac1a0", { hair: "short", hairColor: "#d8d8d8", age: "elder", attireColor: "#6a2a2a" }),
        ideology: "Procedure and reform", objectives: ["Survive the corruption allegations", "Tax the trade routes"], fears: ["A vote of no confidence"], loyalty: "republic",
        voice: { ally: "Thank you for standing with me. Few do these days.", rival: "I know what they say about me in the corridors.", neutral: "The Senate is paralysed, Senator. I am doing what I can." } },
    amedda: { name: "Mas Amedda", world: "coruscant", arena: "senate", title: "Vice Chair of the Senate", faction: "centralists", influence: 60, from: 32, to: 0,
        app: A("chagrian", "#4b86c7", { attireColor: "#4a3a1a", age: "prime" }),
        ideology: "Loyalty to the Chancellor", objectives: ["Keep the Senate orderly", "Serve Palpatine"], fears: ["Disorder"], loyalty: "republic",
        voice: { ally: "The Chair recognises you, Senator. Promptly.", rival: "Order! The Senator will yield.", neutral: "The Chair has noted your request." } },
    amidala: { name: "Padmé Amidala", world: "naboo", arena: "local", title: "Queen of Naboo", alt: "Padmé Naberrie, royal advisor", faction: "reformers", influence: 55, from: 32, to: 19,
        app: A("human", "#eac1a0", { hair: "royal", hairColor: "#3b2416", marks: "royal", accessory: "headdress", attire: "royal", attireColor: "#8a1a2a", age: "young" }),
        ideology: "Democracy, diplomacy and the rule of law", objectives: ["Free Naboo", "Keep the Republic democratic", "Avoid war"], fears: ["War", "The Senate losing its power"], loyalty: "republic",
        voice: { ally: "Senator, I need your help.", rival: "I remember how you voted during the Naboo emergency.", neutral: "Your neutrality may be understandable, but the Republic needs worlds willing to stand with us.", sep: "I don't know if I can trust you anymore." } },
    bibble: { name: "Sio Bibble", world: "naboo", arena: "local", title: "Governor of Naboo", alt: "Royal Advisory Council member", faction: "federalists", influence: 40, from: 32, to: 19,
        app: A("human", "#eac1a0", { hair: "short", hairColor: "#dcdcdc", accessory: "beard", age: "elder", attireColor: "#3a2a5a" }),
        ideology: "Naboo first", objectives: ["Protect Naboo's people"], fears: ["Occupation"], loyalty: "republic",
        voice: { ally: "Naboo remembers its friends.", rival: "Your ambitions are showing.", neutral: "The Queen is very busy." } },
    nass: { name: "Boss Nass", world: "naboo", arena: "local", title: "Boss of the Gungan High Council", alt: "Gungan elder", faction: "traditionalists", influence: 45, from: 32, to: 0,
        app: A("gungan", "#c98b52", { attire: "royal", attireColor: "#6b5a2b", age: "elder" }),
        ideology: "Gungan pride and autonomy", objectives: ["Respect for the Gungans"], fears: ["Being ignored by the Naboo"], loyalty: "republic",
        voice: { ally: "Yousa good friend to da Gungans!", rival: "Wesa no like yous.", neutral: "Wesa watching yous." } },
    jarjar: { name: "Jar Jar Binks", world: "naboo", arena: "senate", title: "Representative of Naboo", faction: "centralists", influence: 20, from: 22, to: 0,
        app: A("gungan", "#e3a45d", { attire: "civilian", attireColor: "#5a3a6a", age: "young" }),
        ideology: "Friendship with everyone", objectives: ["Do right by the Senator"], fears: ["Letting Padmé down"], loyalty: "republic",
        voice: { ally: "Mesa so happy to see yousa!", rival: "Oh, mooie-mooie, yousa angry at mesa?", neutral: "Hello, Senator!" } },
    bail: { name: "Bail Organa", world: "alderaan", arena: "senate", seat: true, title: "Senator of Alderaan", alt: "Viceroy of Alderaan", faction: "reformers", influence: 62, from: 32, to: 0,
        app: A("human", "#c28a60", { hair: "short", hairColor: "#1b1410", accessory: "beard", attireColor: "#1f3a5b" }),
        ideology: "Principled institutionalism", objectives: ["Protect the Senate", "Humanitarian relief"], fears: ["Tyranny"], loyalty: "republic",
        voice: { ally: "We need more senators like you.", rival: "I expected better of you.", neutral: "The Senate needs people of conscience. Are you one?", sep: "I hope one day your world will come home." } },
    breha: { name: "Breha Organa", world: "alderaan", arena: "local", title: "Queen of Alderaan", alt: "Princess of House Organa", faction: "reformers", influence: 50, from: 32, to: 0,
        app: A("human", "#d9a57e", { hair: "royal", hairColor: "#3b2416", accessory: "circlet", attire: "royal", attireColor: "#e8e0d0" }),
        ideology: "Duty and compassion", objectives: ["Alderaan's peace"], fears: ["War reaching Alderaan"], loyalty: "republic",
        voice: { ally: "Alderaan is grateful.", rival: "The Crown has noted your conduct.", neutral: "Welcome to Aldera." } },
    mothma: { name: "Mon Mothma", world: "chandrila", arena: "senate", seat: true, title: "Senator of Chandrila", alt: "Former Senator of Chandrila", faction: "reformers", influence: 58, from: 32, to: -5,
        app: A("human", "#f6d7c3", { hair: "short", hairColor: "#a0662f", attireColor: "#e8e4dc" }),
        ideology: "Democracy above all", objectives: ["Limit the Chancellor's emergency powers", "Peace"], fears: ["Emergency powers that never end"], loyalty: "republic",
        voice: { ally: "We must not let fear hollow out this Senate.", rival: "Every vote you cast for emergency powers is a vote against democracy.", neutral: "Where do you stand, Senator — truly?" } },
    belIblis: { name: "Garm Bel Iblis", world: "corellia", arena: "senate", seat: true, title: "Senator of Corellia", alt: "Corellian statesman", faction: "federalists", influence: 55, from: 32, to: 0,
        app: A("human", "#d9a57e", { hair: "short", hairColor: "#9a9a9a", accessory: "beard", age: "elder", attireColor: "#2d4a3a" }),
        ideology: "Corellian independence and liberty", objectives: ["Keep Corellia free", "Check the Chancellor"], fears: ["Centralisation"], loyalty: "republic",
        voice: { ally: "Corellia stands with those who stand for liberty.", rival: "Don't mistake me for a man who forgets.", neutral: "Corellians judge by deeds." } },
    onara: { name: "Onara Kuat", world: "kuat", arena: "local", title: "Head of Kuat Drive Yards", faction: "corporatists", influence: 65, from: 32, to: 0,
        app: A("human", "#f6d7c3", { hair: "bun", hairColor: "#1b1410", accessory: "earrings", attireColor: "#3a3a3a" }),
        ideology: "The yards come first", objectives: ["Republic warship contracts"], fears: ["Losing the Navy's business"], loyalty: "republic",
        voice: { ally: "Kuat values reliable partners.", rival: "The board has long memories.", neutral: "What can Kuat do for you — and you for Kuat?" } },
    tills: { name: "Meena Tills", world: "moncala", arena: "senate", seat: true, title: "Senator of Mon Cala", alt: "Mon Calamari envoy", faction: "reformers", influence: 45, from: 32, to: 0,
        app: A("moncal", "#b56b8a", { attireColor: "#2b4a6a" }),
        ideology: "Mon Cala unity within the Republic", objectives: ["Keep Mon Cala whole"], fears: ["Civil war at home"], loyalty: "republic",
        voice: { ally: "Mon Cala's people will not forget your friendship.", rival: "You have made my work much harder.", neutral: "Our oceans are deep, Senator — so are our memories." } },
    tikkes: { name: "Tikkes", world: "moncala", arena: "senate", title: "Quarren delegate", faction: "independence", influence: 35, from: 32, to: 22,
        app: A("quarren", "#7fae8c", { attireColor: "#3a4a2a" }),
        ideology: "Quarren self-rule", objectives: ["Quarren independence"], fears: ["Mon Calamari dominance"], loyalty: "separatist",
        voice: { ally: "The Quarren remember friends.", rival: "Your kind always takes the Mon Calamari side.", neutral: "Hmph." } },
    kolina: { name: "Yos Kolina", world: "moncala", arena: "local", title: "King of Mon Cala", alt: "Mon Calamari royal elder", faction: "traditionalists", influence: 60, from: 32, to: 21,
        app: A("moncal", "#e08a5c", { attire: "royal", attireColor: "#1f3a5b", age: "elder", feature: 1 }),
        ideology: "Unity of the two peoples", objectives: ["Peace between Mon Calamari and Quarren"], fears: ["The Quarren question"], loyalty: "republic",
        voice: { ally: "You honour the Crown.", rival: "The Crown is disappointed.", neutral: "Welcome to Dac." } },
    leechar: { name: "Lee-Char", world: "moncala", arena: "local", title: "Prince of Mon Cala", faction: "reformers", influence: 30, from: 32, to: 0,
        app: A("moncal", "#d9a066", { attire: "royal", attireColor: "#2b4a6a", age: "young" }),
        ideology: "Reconciliation", objectives: ["Prove himself worthy of the crown"], fears: ["Failing his people"], loyalty: "republic",
        voice: { ally: "I will need friends like you when I am king.", rival: "My father warned me about people like you.", neutral: "I am still learning, Senator." } },
    nossor: { name: "Nossor Ri", world: "moncala", arena: "local", title: "Quarren Chieftain", alt: "Quarren elder", faction: "independence", influence: 45, from: 32, to: 0,
        app: A("quarren", "#a4a07a", { attire: "royal", attireColor: "#4a3a2a", age: "elder" }),
        ideology: "Quarren rule for Quarren", objectives: ["End Mon Calamari dominance"], fears: ["Permanent subordination"], loyalty: "separatist",
        voice: { ally: "Perhaps not every surface-dweller is an enemy.", rival: "You will regret choosing their side.", neutral: "State your business." } },
    satine: { name: "Satine Kryze", world: "mandalore", arena: "local", title: "Duchess of Mandalore", alt: "Leader of the New Mandalorians", faction: "reformers", influence: 60, from: 32, to: 19,
        app: A("human", "#f6d7c3", { hair: "royal", hairColor: "#e8d890", accessory: "headdress", attire: "royal", attireColor: "#4a6a8a" }),
        ideology: "Pacifism and neutrality", objectives: ["Keep Mandalore out of the war", "Lead the Council of Neutral Systems"], fears: ["Death Watch", "Mandalore's violent past"], loyalty: "neutral",
        voice: { ally: "Neutrality is not weakness, and you understand that.", rival: "You would drag us all back into war.", neutral: "The Council of Neutral Systems welcomes those who choose peace." } },
    almec: { name: "Almec", world: "mandalore", arena: "local", title: "Prime Minister of Mandalore", faction: "corporatists", influence: 40, from: 32, to: 19,
        app: A("human", "#eac1a0", { hair: "none", attireColor: "#2b3a4a" }),
        ideology: "Pragmatism (and profit)", objectives: ["Stay in power"], fears: ["Exposure"], loyalty: "neutral",
        voice: { ally: "We understand each other.", rival: "Careful.", neutral: "The Duchess is occupied." } },
    vizsla: { name: "Pre Vizsla", world: "mandalore", arena: "local", title: "Governor of Concordia (Death Watch)", alt: "Death Watch warlord", faction: "militarists", influence: 50, from: 32, to: 20,
        app: A("human", "#c28a60", { accessory: "helmet", attire: "armor", attireColor: "#1f3a5b" }),
        ideology: "The warrior way", objectives: ["Overthrow the New Mandalorians"], fears: ["A Mandalore that forgets itself"], loyalty: "separatist",
        voice: { ally: "You have a warrior's spine.", rival: "Weakling.", neutral: "Mandalore will be strong again." } },
    bokatan: { name: "Bo-Katan Kryze", world: "mandalore", arena: "local", title: "Death Watch lieutenant", faction: "militarists", influence: 35, from: 32, to: -9,
        app: A("human", "#f6d7c3", { hair: "short", hairColor: "#b03a2e", attire: "armor", attireColor: "#2b4a8a" }),
        ideology: "Mandalore's honour", objectives: ["A strong Mandalore"], fears: ["Her sister's pacifism"], loyalty: "neutral",
        voice: { ally: "You fight for your people. I respect that.", rival: "Stay out of my way.", neutral: "What do you want?" } },
    yarua: { name: "Yarua", world: "kashyyyk", arena: "senate", seat: true, title: "Senator of Kashyyyk", alt: "Wookiee elder statesman", faction: "federalists", influence: 45, from: 32, to: 19,
        app: A("wookiee", "#8a6a45", { age: "elder" }),
        ideology: "Wookiee sovereignty", objectives: ["Protect Kashyyyk"], fears: ["Slavers", "Outsiders taking the forests"], loyalty: "republic",
        voice: { ally: "[a warm, approving roar]", rival: "[a low growl]", neutral: "[a questioning rumble]" } },
    tarfful: { name: "Tarfful", world: "kashyyyk", arena: "local", title: "Chieftain of Kachirho", alt: "Wookiee war leader", faction: "traditionalists", influence: 50, from: 32, to: 0,
        app: A("wookiee", "#6b4a2b"),
        ideology: "Clan and forest", objectives: ["Defend Kachirho"], fears: ["Enslavement of his people"], loyalty: "republic",
        voice: { ally: "[a thunderous roar of friendship]", rival: "[bared teeth]", neutral: "[a guarded rumble]" } },
    freeTaa: { name: "Orn Free Taa", world: "ryloth", arena: "senate", seat: true, title: "Senator of Ryloth", alt: "Twi'lek magnate", faction: "corporatists", influence: 55, from: 32, to: 0,
        app: A("twilek", "#5aa0d8", { attire: "royal", attireColor: "#6b2b5a", age: "elder" }),
        ideology: "Whatever keeps him in office", objectives: ["Appropriations for Ryloth (and himself)"], fears: ["Losing his seat"], loyalty: "republic",
        voice: { ally: "You scratch my back, Senator…", rival: "Ryloth has a long memory — and so do I.", neutral: "Everything is negotiable." } },
    syndulla: { name: "Cham Syndulla", world: "ryloth", arena: "local", title: "Twi'lek freedom fighter", alt: "Clan leader", faction: "independence", influence: 45, from: 32, to: 0,
        app: A("twilek", "#4fb37a", { attire: "rebel", attireColor: "#6b4a2b", accessory: "beard", hairColor: "#1b1410" }),
        ideology: "Ryloth for the Twi'leks", objectives: ["A free Ryloth"], fears: ["Trading one master for another"], loyalty: "neutral",
        voice: { ally: "Ryloth will remember who stood with us.", rival: "You are no better than the occupiers.", neutral: "Words are cheap, politician." } },
    jabba: { name: "Jabba the Hutt", world: "tatooine", arena: "local", title: "Crime lord of Tatooine", faction: "corporatists", influence: 80, from: 32, to: -4,
        app: A("hutt", "#9a8a5a"),
        ideology: "Profit", objectives: ["Control Tatooine's trade"], fears: ["Rivals", "Order"], loyalty: "neutral",
        voice: { ally: "Ho ho ho… a useful friend.", rival: "Bargon wa tu goola.", neutral: "What does the little politician want?" } },
    poggle: { name: "Poggle the Lesser", world: "geonosis", arena: "local", title: "Archduke of Geonosis", alt: "Hive aristocrat", faction: "corporatists", influence: 60, from: 32, to: 19,
        app: A("geonosian", "#b3713a", { feature: 1, attire: "royal", attireColor: "#6b5a2b" }),
        ideology: "The hives' prosperity", objectives: ["Foundry contracts"], fears: ["The drones rising"], loyalty: "separatist",
        voice: { ally: "[clicking approval]", rival: "[hostile clicking]", neutral: "[a buzzing greeting]" } },
    lamaSu: { name: "Lama Su", world: "kamino", arena: "local", title: "Prime Minister of Kamino", alt: "Chief scientist", faction: "corporatists", influence: 50, from: 32, to: 19,
        app: A("kaminoan", "#e8ecef", { attire: "clerical", attireColor: "#d8d0c0" }),
        ideology: "Kaminoan excellence", objectives: ["Fulfil the contract"], fears: ["Losing the Republic's business"], loyalty: "republic",
        voice: { ally: "Your cooperation is most appreciated.", rival: "We find your interference… regrettable.", neutral: "Welcome to Tipoca City." } },
    burtoni: { name: "Halle Burtoni", world: "kamino", arena: "senate", seat: true, title: "Senator of Kamino", faction: "centralists", influence: 40, from: 32, to: 19,
        app: A("kaminoan", "#d5dde2", { attireColor: "#3a3a4a" }),
        ideology: "Protect Kamino's contracts", objectives: ["More clone orders"], fears: ["Budget cuts"], loyalty: "republic",
        voice: { ally: "Kamino supports its friends' bills.", rival: "Kamino will not forget this.", neutral: "Kamino is listening." } },
    dendup: { name: "Ramsis Dendup", world: "onderon", arena: "local", title: "King of Onderon", alt: "Deposed royal", faction: "traditionalists", influence: 45, from: 32, to: 20,
        app: A("human", "#c28a60", { hair: "short", hairColor: "#9a9a9a", accessory: "beard", attire: "royal", attireColor: "#2d5b3a", age: "elder" }),
        ideology: "A free Onderon", objectives: ["Keep his throne"], fears: ["Separatist coup"], loyalty: "republic",
        voice: { ally: "Onderon's true king thanks you.", rival: "You side with usurpers.", neutral: "Onderon is not for sale." } },
    rash: { name: "Sanjay Rash", world: "onderon", arena: "local", title: "Onderonian noble", faction: "militarists", influence: 40, from: 32, to: 20,
        app: A("human", "#eac1a0", { hair: "short", hairColor: "#3b2416", attire: "royal", attireColor: "#5b1f3a" }),
        ideology: "Power with Separatist backing", objectives: ["The throne"], fears: ["The partisans"], loyalty: "separatist",
        voice: { ally: "The future belongs to the Confederacy.", rival: "Enemies of Onderon are dealt with.", neutral: "Choose wisely." } },
    bonteri: { name: "Mina Bonteri", world: "onderon", arena: "senate", seat: true, title: "Senator of Onderon", alt: "Separatist politician", faction: "independence", influence: 50, from: 32, to: 21,
        app: A("human", "#f6d7c3", { hair: "bun", hairColor: "#a0662f", attireColor: "#6b2b3a" }),
        ideology: "Peace through Separatist self-determination", objectives: ["End the war through negotiation"], fears: ["Endless war"], loyalty: "separatist",
        voice: { ally: "Peace is still possible, if people like us insist on it.", rival: "You have chosen the side of war.", neutral: "The Republic has not earned our loyalty." } },
    steela: { name: "Steela Gerrera", world: "onderon", arena: "local", title: "Onderon partisan", faction: "independence", influence: 30, from: 21, to: 20,
        app: A("human", "#a0694a", { hair: "long", hairColor: "#e8d890", attire: "rebel", attireColor: "#4a5a2a", age: "young" }),
        ideology: "Free Onderon", objectives: ["Restore the rightful king"], fears: ["Losing her brother to rage"], loyalty: "republic",
        voice: { ally: "Onderon fights. Will you?", rival: "Collaborator.", neutral: "Prove yourself." } },
    saw: { name: "Saw Gerrera", world: "onderon", arena: "local", title: "Onderon partisan", faction: "militarists", influence: 30, from: 21, to: -1,
        app: A("human", "#7d4f35", { hair: "short", hairColor: "#1b1410", attire: "rebel", attireColor: "#4a5a2a", age: "young" }),
        ideology: "Fight — by any means", objectives: ["Destroy the occupiers"], fears: ["Politicians who compromise"], loyalty: "neutral",
        voice: { ally: "You're not like the other politicians.", rival: "Talk, talk, talk.", neutral: "Whose side are you on?" } },
    tevv: { name: "Sian Tevv", world: "sullust", arena: "senate", seat: true, title: "Senator of Sullust", alt: "SoroSuub executive", faction: "corporatists", influence: 40, from: 32, to: 19,
        app: A("sullustan", "#b9a79a", { attireColor: "#3a3a2a" }),
        ideology: "SoroSuub's interests are Sullust's interests", objectives: ["Protect SoroSuub"], fears: ["Nationalisation"], loyalty: "separatist",
        voice: { ally: "Sullust does business with friends.", rival: "SoroSuub has been informed.", neutral: "What is your offer?" } },
    talzin: { name: "Mother Talzin", world: "dathomir", arena: "local", title: "Clan Mother of the Nightsisters", alt: "Nightsister elder", faction: "traditionalists", influence: 70, from: 32, to: 20,
        app: A("dathomirian", "#ece8ee", { marks: "tattoo", accessory: "headdress", attire: "clerical", attireColor: "#6a2a2a", age: "elder" }),
        ideology: "The Nightsisters endure", objectives: ["Revenge on Dooku"], fears: ["Extinction of her clan"], loyalty: "neutral",
        voice: { ally: "The spirits favour you… for now.", rival: "You have made a dangerous enemy.", neutral: "You come to Dathomir uninvited." } },
    farr: { name: "Onaconda Farr", world: "rodia", arena: "senate", seat: true, title: "Senator of Rodia", faction: "federalists", influence: 45, from: 32, to: 21,
        app: A("rodian", "#4f9a5a", { attireColor: "#6b5a2b", age: "elder" }),
        ideology: "Feed his people", objectives: ["Food for Rodia"], fears: ["His people starving"], loyalty: "republic",
        voice: { ally: "Rodia will not forget your help.", rival: "You left my people to starve.", neutral: "Rodia is hungry, Senator." } },
    dod: { name: "Lott Dod", world: "neimoidia", arena: "senate", seat: true, title: "Senator (Trade Federation)", faction: "corporatists", influence: 55, from: 32, to: 22,
        app: A("neimoidian", "#8fa08a", { attireColor: "#4a2a5a" }),
        ideology: "The Trade Federation's profit", objectives: ["No taxation of trade routes"], fears: ["Regulation"], loyalty: "separatist",
        voice: { ally: "The Trade Federation rewards its friends.", rival: "This is an outrage!", neutral: "We should discuss… arrangements." } },
    chuchi: { name: "Riyo Chuchi", world: "pantora", arena: "senate", seat: true, title: "Senator of Pantora", faction: "reformers", influence: 25, from: 22, to: 0,
        app: A("human", "#8fb3d9", { hair: "bun", hairColor: "#1b1410", marks: "pantoran", attireColor: "#2b2b4a", age: "young" }),
        ideology: "Idealism", objectives: ["Learn the Senate", "Protect Pantora"], fears: ["Being ignored"], loyalty: "republic",
        voice: { ally: "Thank you for taking me seriously.", rival: "I thought you were different.", neutral: "I'm new here — could you advise me?" } },
    clovis: { name: "Rush Clovis", world: "scipio", arena: "senate", seat: true, title: "Senator of Scipio", faction: "corporatists", influence: 40, from: 22, to: 20,
        app: A("human", "#d9a57e", { hair: "short", hairColor: "#1b1410", attireColor: "#3a2a1a", age: "young" }),
        ideology: "Banking stability", objectives: ["Reform the Banking Clan"], fears: ["Collapse"], loyalty: "neutral",
        voice: { ally: "The banks need people who understand them.", rival: "You'll regret crossing the Clan.", neutral: "Money makes the galaxy turn, Senator." } },
    gunray: { name: "Nute Gunray", world: "neimoidia", arena: "galactic", title: "Viceroy of the Trade Federation", faction: "corporatists", influence: 70, from: 32, to: 19,
        app: A("neimoidian", "#7a8f78", { attireColor: "#2b2b4a", age: "prime" }),
        ideology: "Profit and survival", objectives: ["Escape justice", "Defeat trade taxes"], fears: ["Prison", "Lord Sidious"], loyalty: "separatist",
        voice: { ally: "Senator… we are so pleased.", rival: "You will pay for this.", neutral: "The Federation is always open to… discussion." } },
    dooku: { name: "Count Dooku", world: "serenno", arena: "galactic", title: "Count of Serenno", faction: "independence", influence: 80, from: 24, to: 19,
        app: A("human", "#eac1a0", { hair: "short", hairColor: "#f4f4f4", accessory: "beard", attire: "royal", attireColor: "#2a1a1a", age: "elder" }),
        ideology: "The Republic is rotten beyond repair", objectives: ["Lead the Separatist secession"], fears: ["Nothing he admits"], loyalty: "separatist",
        voice: { ally: "You see what they refuse to see.", rival: "You chose the dying order. How sad.", neutral: "The Republic has forgotten the Outer Rim. Has it forgotten you?" } },
    sanHill: { name: "San Hill", world: "muunilinst", arena: "galactic", title: "Chairman of the InterGalactic Banking Clan", faction: "corporatists", influence: 70, from: 32, to: 19,
        app: A("muun", "#e5e1da", { attireColor: "#2a2a2a" }),
        ideology: "Returns", objectives: ["Profit from both sides"], fears: ["Default"], loyalty: "separatist",
        voice: { ally: "Your credit is good with us.", rival: "Your loans will be called.", neutral: "Everything has a rate of interest." } },
    kenobi: { name: "Obi-Wan Kenobi", world: "coruscant", arena: "jedi", title: "Jedi Knight (later General)", faction: "reformers", influence: 50, from: 32, to: 19,
        app: A("human", "#eac1a0", { hair: "short", hairColor: "#a0662f", accessory: "beard", attire: "clerical", attireColor: "#b8a58a" }),
        ideology: "The Jedi serve the Republic — and peace", objectives: ["Protect the innocent"], fears: ["The dark side"], loyalty: "republic",
        voice: { ally: "Hello there.", rival: "I have a bad feeling about this.", neutral: "Senator." } },
    anakin: { name: "Anakin Skywalker", world: "tatooine", arena: "jedi", title: "Jedi Knight", faction: "militarists", influence: 40, from: 22, to: 19,
        app: A("human", "#d9a57e", { hair: "curly", hairColor: "#6a4127", attire: "clerical", attireColor: "#3a2a1a", marks: "scar", age: "young" }),
        ideology: "Get it done", objectives: ["Win the war"], fears: ["Losing the people he loves"], loyalty: "republic",
        voice: { ally: "Politicians like you are rare.", rival: "Politicians.", neutral: "Let's get this over with." } },
    ahsoka: { name: "Ahsoka Tano", world: "coruscant", arena: "jedi", title: "Jedi Padawan", faction: "reformers", influence: 25, from: 22, to: 19,
        app: A("togruta", "#d9542b", { attire: "civilian", attireColor: "#8a2b2b", age: "young" }),
        ideology: "Protect people, not institutions", objectives: ["Help the civilians"], fears: ["The Order losing its way"], loyalty: "republic",
        voice: { ally: "Snips — er, sorry. Senator! Good to see you.", rival: "Hm.", neutral: "What do you need?" } },
    tarkin: { name: "Wilhuff Tarkin", world: "coruscant", arena: "galactic", title: "Regional Governor (Moff)", faction: "militarists", influence: 75, from: 19, to: 0,
        app: A("human", "#eac1a0", { hair: "short", hairColor: "#9a9a9a", attire: "uniform", attireColor: "#6b6b5a", age: "elder" }),
        ideology: "Rule through fear of force", objectives: ["Order in the Outer Rim"], fears: ["Disorder"], loyalty: "empire",
        voice: { ally: "Useful. You may yet have a future.", rival: "You are a liability, Governor.", neutral: "I expect results." } }
};

// Where canon characters in a Senate seat hold that seat from the start.
function canonSeatFor(worldKey) {
    return Object.entries(CANON).find(([, c]) => c.seat && c.world === worldKey && c.from >= 32 && (c.to == null || c.to < 32));
}

function canonActive(c, bby = currentBBY()) {
    return bby <= c.from && bby >= (c.to ?? -99);
}

function canonNpc(key) {
    return G.npcs.find(n => n.canon === key && n.alive);
}

// What a canon character says to you, given your history and your world's allegiance.
function canonLine(n) {
    const c = CANON[n.canon];
    if (!c || !c.voice) return "";
    const v = c.voice;
    const al = G.allegiance;
    if (al === "separatist" && c.loyalty === "republic" && v.sep) return v.sep;
    if (al === "republic" && c.loyalty === "separatist" && v.rival) return n.rel >= 35 ? v.ally : v.neutral;
    if (al === "neutral" && v.neutral && c.loyalty === "republic" && n.rel < 35) return v.neutral;
    if (n.rel >= 35) return v.ally;
    if (n.rel <= -25) return v.rival;
    return v.neutral;
}

function makeCanonNpc(key, extra = {}) {
    const c = CANON[key];
    const displaced = extra.displaced;
    return Object.assign(makeNpc({
        world: c.world, arena: c.arena, faction: c.faction, influence: c.influence,
        title: displaced ? (c.alt || `Former ${c.title}`) : c.title,
        votes: c.arena === "senate" ? 4 : c.arena === "local" ? 5 : 0,
        rel: displaced ? ri(-25, -5) : ri(-8, 12)
    }), { name: c.name, canon: key, app: c.app }, extra);
}
