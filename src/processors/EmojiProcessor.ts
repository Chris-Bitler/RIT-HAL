import { Message, MessageEmbed, TextChannel } from "discord.js";
import { Emoji } from "../models/Emoji";
import * as memoize from "memoizee";
import { ConfigProperty } from "../models/ConfigProperty";

/**
 * Class for processing emojis from text events and tracking them to DB
 * for tracking purposes
 */
export class EmojiProcessor {
    static instance: EmojiProcessor;

    /**
     * Get instance of the EmojiProcessor singleton
     */
    public static getInstance(): EmojiProcessor {
        if (!this.instance) {
            this.instance = new EmojiProcessor();
        }

        return this.instance;
    }
    // Cache lasts 30 minutes
    // This is called on every message
    allowedMemoized = memoize(this.allowedChannels, {
        maxAge: 1000 * 60 * 30,
        promise: true,
        preFetch: true
    });
    regex = /<.?(:.+?:)[0-9]+?>/g;

    /**
     * Count the number of emojis appearing in a message using regex
     * @param message The discord.js message
     */
    countEmojis = (message: string): Map<string, number> => {
        const matches: IterableIterator<RegExpMatchArray> = message.matchAll(
            this.regex
        );
        const emojis = new Map<string, number>();
        let match = matches.next();
        while (!match.done) {
            const emoji = match.value[1];
            if (emoji) {
                const emojiCount = emojis.get(emoji);
                if (emojiCount) {
                    emojis.set(emoji, emojiCount + 1);
                } else {
                    emojis.set(emoji, 1);
                }
            }
            match = matches.next();
        }

        return emojis;
    };

    /**
     * Log detected emojis to the database
     * Only from TextChannels
     * Checks the list of allowed channels to see if it should log
     *
     * @param message The discord.js message
     */
    async logEmojis(message: Message): Promise<void> {
        // This might seem hacky but instanceof always fails for jest mocks
        if (message.channel.constructor.name !== TextChannel.name) {
            return;
        }
        const channel: TextChannel = message.channel as TextChannel;

        const allowedChannels = await this.allowedMemoized(channel.guild.id);
        if (!allowedChannels.includes(channel.id)) {
            return;
        }

        const text = message.content.toLowerCase();
        const emojis = this.countEmojis(text);
        const emojisArray = emojis.keys();
        const serverId = channel.guild.id;
        for (const emoji of emojisArray) {
            try {
                // Can't upsert because upsert doesn't let us work with existing value
                const [emojiInstance, created] = await Emoji.findOrCreate({
                    where: { emoji, serverId },
                    defaults: {
                        num: 1
                    }
                });
                if (emojiInstance && !created) {
                    await emojiInstance.update(
                        {
                            num: emojiInstance.num + 1
                        },
                        {
                            where: {
                                emoji: emojiInstance.emoji,
                                serverId
                            }
                        }
                    );
                }
            } catch (error) {
                console.log(error);
            }
        }
    }

    /**
     * Send an embed to the channel attached to the message
     * with the top 10 most used emojis per the database
     * @param evt The discord.js message
     */
    async getTopEmojis(evt: Message): Promise<void> {
        // This might seem hacky but instanceof always fails for jest mocks
        if (evt.channel.constructor.name !== TextChannel.name) {
            return;
        }
        const channel: TextChannel = evt.channel as TextChannel;

        const emojis = await Emoji.findAll({
            where: {
                serverId: channel.guild.id
            },
            limit: 10,
            order: [["num", "DESC"]]
        });
        const embed = new MessageEmbed();
        embed.setTitle("Top 10 emojis by usage in the server");
        emojis.forEach((emoji) => {
            embed.addField(emoji.emoji, `Used ${emoji.num} times`);
        });
        evt.channel.send(embed);
    }

    /**
     * Get the channels that the bot should actually log emojis from.
     * @param serverId Discord guild snowflake
     */
    async allowedChannels(serverId: string): Promise<string[]> {
        const allowedChannelsJSON = await ConfigProperty.getServerProperty(
            "emojiCount.allowed",
            serverId
        );
        if (allowedChannelsJSON?.value) {
            return JSON.parse(allowedChannelsJSON.value) as string[];
        } else {
            return [];
        }
    }
}
