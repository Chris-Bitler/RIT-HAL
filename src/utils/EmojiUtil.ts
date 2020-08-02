import axios from "axios";

export function getEmojiExtension(id: string): Promise<string> {
    const gifUrl = `https://cdn.discordapp.com/emojis/${id}.gif`;
    const pngUrl = `https://cdn.discordapp.com/emojis/${id}.png`;
    return new Promise((resolve, reject) => {
        axios
            .get(gifUrl)
            .then(() => resolve(gifUrl))
            .catch(() => axios.get(pngUrl))
            .then(() => resolve(pngUrl))
            .catch(() => reject)
    });
}