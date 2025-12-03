export const adjectives = [
    "Happy", "Lucky", "Sunny", "Funny", "Clever", "Brave", "Calm", "Wild", "Cool", "Kind",
    "Swift", "Bright", "Eager", "Fancy", "Jolly", "Lively", "Nice", "Proud", "Silly", "Wise",
    "Zany", "Bold", "Chill", "Dandy", "Epic", "Fair", "Grand", "Hasty", "Icy", "Jump",
    "Keen", "Loud", "Merry", "Neat", "Odd", "Pure", "Quick", "Rare", "Safe", "Tall",
    "Vast", "Warm", "Young", "Zesty", "Alert", "Busy", "Crisp", "Deep", "Easy", "Fast"
];

export const nouns = [
    "Panda", "Tiger", "Eagle", "Lion", "Bear", "Wolf", "Fox", "Hawk", "Owl", "Cat",
    "Dog", "Fish", "Bird", "Frog", "Duck", "Goat", "Lamb", "Deer", "Seal", "Swan",
    "Crab", "Bee", "Ant", "Bat", "Cow", "Pig", "Rat", "Yak", "Ape", "Elk",
    "Emu", "Jay", "Koi", "Lynx", "Mole", "Newt", "Orca", "Pug", "Ray", "Toad",
    "Vole", "Wasp", "Wren", "Yeti", "Zebra", "Bot", "Elf", "Imp", "Orc", "Ent"
];

export const generateAnonymousName = (uid) => {
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const seedString = uid + dateStr;

    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
        const char = seedString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    const absHash = Math.abs(hash);
    const adjIndex = absHash % adjectives.length;
    const nounIndex = (absHash >> 5) % nouns.length; // Shift to get a different index

    return `${adjectives[adjIndex]} ${nouns[nounIndex]}`;
};

export const getAvatarColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};
