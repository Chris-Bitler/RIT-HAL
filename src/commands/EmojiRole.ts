import {Command} from "./Command";
import {Client, Guild, GuildChannel, GuildEmoji, Message, Permissions, Role, TextChannel} from "discord.js";
import {getErrorEmbed} from "../utils/EmbedUtil";
import {addEmojiRole} from "../processors/EmojiRoleProcessor";
import {UnicodeEmoji} from "../types/Emoji";

const emojiRegex = /:(.+):/;
export class EmojiRole extends Command {
    async useCommand(client: Client, evt: Message, args: string[]): Promise<void> {
        // This might seem hacky but instanceof always fails for jest mocks
        if (evt.channel.constructor.name !== TextChannel.name) {
            return;
        }
        const initialChannel = evt.channel as TextChannel;

        if (args.length < 3) {
            await initialChannel.send(
                getErrorEmbed("Incorrect syntax. Try -emojirole [emoji] [role] [channel]")
            );
        } else {
            const emojiMatch = args[0].match(emojiRegex);
            let emoji: GuildEmoji | UnicodeEmoji | null = null;
            if (emojiMatch && emojiMatch.length === 2) {
                emoji = this.getEmoji(initialChannel.guild, emojiMatch[1]);
            } else if (args[0].length === 2) {
                //Unicode characters
                emoji = {
                    id: args[0],
                    toString: () => args[0]
                };
            }

            const role = this.getRole(evt, args[1].replace("@", ""));
            const channel = this.getChannel(evt, args[2].replace("#", ""));
            if (channel && channel.constructor.name !== TextChannel.name) {
                await initialChannel.send(
                    getErrorEmbed("Invalid channel. Try again.")
                );
                return;
            }
            const textChannel = channel as TextChannel;

            if (emoji && role && channel) {
                await addEmojiRole(initialChannel, emoji, role, textChannel);
            } else if (!emoji) {
                await initialChannel.send(
                    getErrorEmbed("No valid emoji found. Try again.")
                );
            } else if (!role) {
                await initialChannel.send(
                    getErrorEmbed("Invalid role. Try again.")
                );
            } else if (!channel) {
                await initialChannel.send(
                    getErrorEmbed("Invalid channel. Try again.")
                );
            }
        }
    }

    getEmoji(guild: Guild, emojiText: string): GuildEmoji | null {
        return guild.emojis.cache.find((emoji) => emoji.name === emojiText) || null;
    }

    getRole(evt: Message, roleText: string): Role | null {
        if (evt.guild) {
            return evt.guild.roles.cache.find(role => role.name.toLowerCase() === roleText.toLowerCase()) || null;
        } else {
            return null;
        }
    }

    getChannel(evt: Message, channelText: string): GuildChannel | null {
        channelText = channelText.replace("<", "").replace(">", "");
        if (evt.guild) {
            return evt.guild.channels.cache.find(channel => channel.id === channelText) || null;
        } else {
            return null;
        }
    }

    getCommand(): string {
        return "emojirole";
    }

    getRequiredPermission(): number {
        return Permissions.FLAGS.KICK_MEMBERS;
    }
}