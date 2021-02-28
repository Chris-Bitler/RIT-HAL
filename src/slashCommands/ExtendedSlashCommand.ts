import {ConvertedOption, SlashCommand, SlashCommandOptions} from "slash-create";
import CommandContext from "slash-create/lib/context";
import { Client, Guild, TextChannel } from "discord.js";
import SlashCreator from "slash-create/lib/creator";

export class ExtendedSlashCommand extends SlashCommand {
    constructor(creator: SlashCreator, opts: SlashCommandOptions) {
        super(creator, opts);
    }

    getGuildChannel(client: Client, context: CommandContext): {guild: Guild | null, channel: TextChannel | null} {
        const guildId = context.guildID ?? '';
        const guild = client.guilds.resolve(guildId);
        if (guild) {
            const channel = guild.channels.resolve(context.channelID);
            if (channel && channel instanceof TextChannel) {
                return {guild, channel};
            }

            return {guild, channel: null};
        }

        return {guild: null, channel: null};
    }
}