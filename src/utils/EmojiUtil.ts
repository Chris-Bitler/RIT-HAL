import axios from "axios";
import {Guild, GuildEmoji} from "discord.js";

/**
 * Attempt to resolve the larger url for an emoji
 * First tries gif then png
 * @param id The id of the emoji
 */
export function getEmojiExtension(id: string): Promise<string> {
    const gifUrl = `https://cdn.discordapp.com/emojis/${id}.gif`;
    const pngUrl = `https://cdn.discordapp.com/emojis/${id}.png`;
    return new Promise((resolve, reject) => {
        axios
            .get(gifUrl)
            .then(() => resolve(gifUrl))
            .catch(() => axios.get(pngUrl))
            .then(() => resolve(pngUrl))
            .catch(() => reject("no Valid emoji"));
    });
}

/**
 * Attempt to get an emoji from a guild using the emoji's name
 * @param {Guild} guild - The guild to get the emoji from
 * @param {string} emojiText - The emoji name
 */
export function getEmoji(guild: Guild, emojiText: string): GuildEmoji | null {
    return (
        guild.emojis.cache.find((emoji) => emoji.name === emojiText) || null
    );
}