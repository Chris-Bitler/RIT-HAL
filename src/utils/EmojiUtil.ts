import axios from "axios";

export function getEmojiExtension(id: string): Promise<String> {
    const gifUrl: string = `https://cdn.discordapp.com/emojis/${id}.gif`;
    const pngUrl: string = `https://cdn.discordapp.com/emojis/${id}.png`;
    return new Promise((resolve, reject) => {
        axios
            .get(gifUrl)
            .then(() => resolve(gifUrl))
            .catch(() => axios.get(pngUrl))
            .then(() => resolve(pngUrl))
            .catch(() => reject)
    });
}