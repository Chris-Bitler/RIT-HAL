import { Command } from "./Command";
import {
    Client,
    Guild,
    GuildChannel,
    GuildEmoji,
    Message,
    Permissions,
    Role,
    TextChannel
} from "discord.js";
import { getErrorEmbed } from "../utils/EmbedUtil";
import {addEmojiRole, getChannel, getRole, listEmojiRoles, removeEmojiRole} from "../processors/EmojiRoleProcessor";
import { UnicodeEmoji } from "../types/Emoji";
import {getEmoji} from "../utils/EmojiUtil";
import {containsNonLatinCodepoints} from "../utils/StringUtil";

const emojiRegex = /:(.+):/;
const errorText = "Incorrect syntax. Try one of the following:\n" +
    "`-emojirole add [emoji] [role id or name] [channel id or name]`\n" +
    "`-emojirole remove [channel]  [emoji]`\n" +
    "`-emojirole list [channel] (emoji)`";
export class EmojiRole extends Command {
    async useCommand(
        client: Client,
        evt: Message,
        args: string[]
    ): Promise<void> {
        const initialChannel = evt.channel as TextChannel;
        if (args.length < 1) {
            await initialChannel.send(
                getErrorEmbed(
                    errorText
                )
            );
            return;
        }
        const commandSubtype = args[0];
        switch (commandSubtype) {
            case 'add':
                await this.addEmojiRole(evt, initialChannel, args);
                break;
            case 'remove':
                await this.removeEmojiRole(evt, initialChannel, args);
                break;
            case 'list':
                await this.listEmojiRole(evt, initialChannel, args);
                break;
            default:
                await initialChannel.send(
                    getErrorEmbed(
                        errorText
                    )
                );
                break;
        }
    }

    async addEmojiRole(evt: Message, initialChannel: TextChannel, args: string[]): Promise<void> {
        if (args.length < 4) {
            await initialChannel.send(
                getErrorEmbed("Invalid arguments. Try `-emojirole add [emoji] [role id or name] [channel id or name]`")
            );
            return;
        }
        const emoji = this.getEmojiFromString(initialChannel, args[1]);

        const role = getRole(evt, args[2]);
        const channel = getChannel(evt, args[3]);
        if (channel?.type !== "text") {
            await initialChannel.send(
                getErrorEmbed("Invalid channel. Try again.")
            );
            return;
        }

        const textChannel = channel as TextChannel;

        if (emoji && role) {
            await addEmojiRole(initialChannel, emoji, role, textChannel);
        } else if (!emoji) {
            await initialChannel.send(
                getErrorEmbed("No valid emoji found. Try again.")
            );
        } else if (!role) {
            await initialChannel.send(
                getErrorEmbed("Invalid role. Try again.")
            );
        }
    }

    async removeEmojiRole(evt: Message, initialChannel: TextChannel, args: string[]): Promise<void> {
        if (args.length < 3) {
            await initialChannel.send(
                getErrorEmbed("Invalid arguments. Try `-emojirole remove [channel id or name] [emoji]`")
            );
            return;
        }

        const emoji = this.getEmojiFromString(initialChannel, args[2]);

        const channel = getChannel(evt, args[1]);

        if (channel instanceof TextChannel) {
            await removeEmojiRole(initialChannel, emoji, channel);
        } else {
            await initialChannel.send(
                getErrorEmbed(
                    "Cannot remove emoji to role from non-existent channel"
                )
            );
        }
    }

    async listEmojiRole(evt: Message, initialChannel: TextChannel, args: string[]): Promise<void> {
        let emote = undefined;
        if (args.length < 2) {
            await initialChannel.send(
                getErrorEmbed(
                    'Invalid arguments. Try `-emojirole list [channel] (emoji)`\n' +
                    'Note: the emoji argument is optional'
                )
            );
            return;
        }

        const channel = getChannel(evt, args[1]);

        if (args.length >= 3) {
            emote = this.getEmojiFromString(initialChannel, args[2]) ?? undefined;
        }

        if (channel instanceof TextChannel) {
            await listEmojiRoles(initialChannel, channel, emote);
        } else {
            await initialChannel.send(
                getErrorEmbed(
                    "Cannot list emoji to role from non-existent channel"
                )
            );
        }
    }

    getEmojiFromString(channel: TextChannel, emojiText: string): GuildEmoji | UnicodeEmoji | null {
        const emojiMatch = emojiText.match(emojiRegex);
        let emoji: GuildEmoji | UnicodeEmoji | null = null;
        if (emojiMatch?.[1]) {
            emoji = getEmoji(channel.guild, emojiMatch[1]);
        } else if (containsNonLatinCodepoints(emojiText)) {
            //Unicode characters
            emoji = {
                id: emojiText,
                toString: () => emojiText
            };
        }

        return emoji;
    }

    getCommand(): string[] {
        return ["emojirole"];
    }

    getRequiredPermission(): number {
        return Permissions.FLAGS.ADMINISTRATOR;
    }
}
