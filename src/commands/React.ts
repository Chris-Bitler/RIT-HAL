import {Command} from "./Command";
import {Client, GuildEmoji, Message, Permissions, TextChannel} from "discord.js";
import {getErrorEmbed, getInformationalEmbed} from "../utils/EmbedUtil";
import {getEmoji} from "../utils/EmojiUtil";

/**
 * Make the bot react to a message with an emoji
 */
export class React extends Command {
    emojiRegex = /:(.+):/;

    async useCommand(client: Client, evt: Message, args: string[]): Promise<void> {
        if (args.length >= 2) {
            if (evt.channel.type === "text") {
                const textChannel = evt.channel as TextChannel;
                const emojiMatch = args[0]
                    .replace("<", "")
                    .replace(">","")
                    .match(this.emojiRegex);

                let emoji: GuildEmoji|string = args[0];
                if (emojiMatch && emojiMatch.length == 2) {
                    const customEmoji = getEmoji(textChannel.guild, emojiMatch[1]);
                    if (customEmoji) {
                        emoji = customEmoji;
                    }
                }

                const channel = textChannel.guild.channels.resolve(
                    args[1]
                        .replace("#", "")
                        .replace("<", "")
                        .replace(">", "")
                );
                const messageId = args[2];

                if (channel && channel.type === "text") {
                    try {
                        const message = await ((channel as TextChannel).messages.fetch(messageId));
                        if (message) {
                            await message.react(emoji);
                            await textChannel.send(
                                getInformationalEmbed(
                                    "Reaction added",
                                    `HAL reacted with ${emoji} in ${channel}`
                                )
                            )
                            return;
                        }
                    } catch (exception) {
                        await textChannel.send(getErrorEmbed("Cannot react with emoji - make sure the message id and emoji are valid"));
                    }
                } else {
                    await textChannel.send(getErrorEmbed("Cannot find channel to search for message in"));
                }
            }
        } else {
            await evt.channel.send(getErrorEmbed("Incorrect syntax. Try -react [reaction] [message id]"));
        }
    }

    getConfigBase(): string {
        return "react"
    }

    getCommand(): string {
        return "react"
    }

    getRequiredPermission(): number {
        return Permissions.FLAGS.ADMINISTRATOR;
    }
}