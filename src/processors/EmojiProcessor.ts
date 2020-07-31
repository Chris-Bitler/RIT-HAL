import {Message, MessageEmbed, TextChannel} from "discord.js";
import {Emoji} from "../models/Emoji";
import * as memoize from "memoizee";
import {ConfigProperty} from "../models/ConfigProperty";

// Cache lasts 30 minutes
// This is called on every message
const allowedMemoized = memoize(allowedChannels, {maxAge: 1000*60*30, promise: true, preFetch: true});

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

export const logEmojis = async (message: Message): Promise<void> => {
    if (!(message.channel instanceof TextChannel)) {
        return;
    }

    const allowedChannels = await allowedMemoized(message.channel.guild.id);
    if (!allowedChannels.includes(message.channel.id)) {
        return;
    }

    const text = message.content.toLowerCase();
    const emojis = countEmojis(text);
    const emojisArray = Object.getOwnPropertyNames(emojis);
    const serverId = message.channel.guild.id;
    for (const emoji of emojisArray) {
        try {
            // Can't upsert because upsert doesn't let us work with existing value
            const [emojiInstance, created] = await Emoji.findOrCreate({
                where: {emoji, serverId},
                defaults: {
                    num: 1
                }
            });
            if (emojiInstance && !created) {
                await emojiInstance.update({
                    num: emojiInstance.num + 1
                }, {
                    where: {
                        emoji: emojiInstance.emoji,
                        serverId
                    }
                })
            }
        } catch (error) {
            console.log(error);
        }
    }
};

export const getTopEmojis = async (evt: Message): Promise<void> => {
    const channel = evt.channel;
    if (!(channel instanceof TextChannel)) {
        return;
    }
    const emojis = await Emoji.findAll({
        where: {
            serverId: channel.guild.id
        },
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

async function allowedChannels(serverId: string): Promise<string[]> {
    const allowedChannelsJSON = await ConfigProperty.getServerProperty("emojiCount.allowed", serverId);
    if (allowedChannelsJSON?.value) {
        return (JSON.parse(allowedChannelsJSON?.value) as string[])
    } else {
        return []
    }
}