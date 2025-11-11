import axios from "axios";

const BASE_URL = "https://api.scryfall.com";

// Get a card by name (fuzzy match)
export async function getCardByName(name) {
    try {
        const response = await axios.get(`${BASE_URL}/cards/named`, {
            params: { fuzzy: name },
        });
        return response.data;
    } catch (error) {
        console.error(`Card not found: ${name}, error: ${error}`);
        return null;
    }
}

// Get all sets
export async function getAllSets() {
    try {
        const response = await axios.get(`${BASE_URL}/sets`);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching sets:", error);
        return [];
    }
}

const boosterImageCache = {};

async function getSetBoosterImage(setCode) {
    if (boosterImageCache[setCode]) return boosterImageCache[setCode];
    try {
        const response = await axios.get(`${BASE_URL}/cards/search`, {
            params: { q: `e:${setCode}`, order: "released", dir: "asc", unique: "prints" },
        });
        const card = response.data.data.find((c) => c.image_uris?.art_crop);
        const image = card?.image_uris?.art_crop || null;
        boosterImageCache[setCode] = image;
        return image;
    } catch (error) {
        console.warn(`No booster art for set ${setCode}`);
        boosterImageCache[setCode] = null;
        return null;
    }
}

// Find which boosters contain cards from the deck
export async function getDeckBoosterMatches(deckCardNames) {
    console.log("Fetching all sets...");
    const sets = await getAllSets();
    const boosterScores = {};

    for (const name of deckCardNames) {
        const card = await getCardByName(name);
        if (!card) continue;
        console.log(`Fetched card: ${card.name}, set: ${card.set}`);
        const set =
            sets.find((s) => s.code === card.set) ||
            sets.find((s) => s.code === card.parent_set_code);
        if (set) boosterScores[set.code] = (boosterScores[set.code] || 0) + 1;
    }

    const results = await Promise.all(
        Object.entries(boosterScores).map(async ([code, count]) => {
            const set = sets.find((s) => s.code === code);
            const boosterImage = await getSetBoosterImage(code);
            return {
                code,
                name: set?.name || code,
                count,
                released_at: set?.released_at,
                icon_svg_uri: set?.icon_svg_uri,
                card_count: set?.card_count || 0,
                booster_uri: set?.booster_uri || set?.search_uri,
                booster_image: boosterImage,
            };
        })
    );

    const sorted = results.sort((a, b) => b.count - a.count);
    console.log("Booster match results:", sorted);
    return sorted;
}
