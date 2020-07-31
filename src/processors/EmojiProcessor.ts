import {Message, MessageEmbed} from "discord.js";
import {Emoji} from "../models/Emoji";

// TODO: Configurable
const ALLOWED_CHANNELS = [
    "401908664018927628",
    "404792701457006602"
];

const regex = /<.?(:.+?:)[0-9]+?>/g
const countEmojis = (message: string) => {
    const matches = message.matchAll(regex);
    const emojis = new Map<string,number>();
    let match = matches.next();
    while (!match.done) {
        const emoji = match.value[1];
        if (emoji) {
            const emojiCount = emojis.get(emoji);
            if (emojiCount) {
                emojis.set(emoji, emojiCount + 1)
            } else {
                emojis.set(emoji, 1);
            }
        }
        match = matches.next();
    }

    return emojis;
};

const logEmojis = (message: Message) => {
    if (!ALLOWED_CHANNELS.includes(message.channel.id)) {
        return;
    }
    const text = message.content.toLowerCase();
    const emojis = countEmojis(text);
    const emojisArray = Object.getOwnPropertyNames(emojis);
    emojisArray.forEach(async (emoji) => {
        try {
            // Can't upsert because upsert doesn't let us work with existing value
            const [emojiInstance, created] = await Emoji.findOrCreate({
                where: {emoji},
                defaults: {
                    num: 1
                }
            });
            if (emojiInstance && !created) {
                await emojiInstance.update({
                    num: emojiInstance.num + 1
                }, {
                    where: {
                        emoji: emojiInstance.emoji
                    }
                })
            }
        } catch (error) {
            console.log(error);
        }
    });
};

export const getTopEmojis = async (evt: Message) => {
    const emojis = await Emoji.findAll({
        limit: 10,
        order: ["num", "DESC"]
    });
    const embed = new MessageEmbed();
    embed.setTitle("Top 10 emojis by usage in the server");
    emojis.forEach((emoji) => {
        embed.addField(emoji.emoji, `Used ${emoji.num} times`);
    });
    evt.channel.send(embed);
}

module.exports = {
    logEmojis,
    getTopEmojis
}