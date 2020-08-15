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
import {addEmojiRole, getChannel, getRole} from "../processors/EmojiRoleProcessor";
import { UnicodeEmoji } from "../types/Emoji";
import {getEmoji} from "../utils/EmojiUtil";

const emojiRegex = /:(.+):/;
export class EmojiRole extends Command {
    async useCommand(
        client: Client,
        evt: Message,
        args: string[]
    ): Promise<void> {
        const initialChannel = evt.channel as TextChannel;

        if (args.length < 3) {
            await initialChannel.send(
                getErrorEmbed(
                    "Incorrect syntax. Try -emojirole [emoji] [role] [channel]"
                )
            );
            return;
        }
        const emojiMatch = args[0].match(emojiRegex);
        let emoji: GuildEmoji | UnicodeEmoji | null = null;
        if (emojiMatch?.[1]) {
            emoji = getEmoji(initialChannel.guild, emojiMatch[1]);
        } else if (args[0].length === 2) {
            //Unicode characters
            emoji = {
                id: args[0],
                toString: () => args[0]
            };
        }

        const role = getRole(evt, args[1].replace(/[!@#&<>]+/g, ""));
        const channel = getChannel(evt, args[2].replace("#", "").replace("<", "").replace(">", ""));
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



    getCommand(): string[] {
        return ["emojirole"];
    }

    getRequiredPermission(): number {
        return Permissions.FLAGS.ADMINISTRATOR;
    }
}
