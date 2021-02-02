import {
    Client,
    GuildMember,
    Message,
    MessageEmbed,
    Permissions,
    TextChannel
} from "discord.js";
import {CommandArgs, CommandArgsTime, ListArgs} from "../types/Mod";
import { Command } from "./Command";
import * as moment from "moment-timezone";
import { parseModDateString } from "../utils/DateUtil";
import {ModProcessor, PunishmentType} from "../processors/ModProcessor";
import { Punishment } from "../models/Punishment";
import { getErrorEmbed, getInformationalEmbed } from "../utils/EmbedUtil";

const modProcessor = ModProcessor.getInstance();

export class Mod extends Command {
    /**
     * Use the various mod commands
     * @param client The discord.js client
     * @param evt The message for this command
     * @param args The list of arguments for this command
     */
    async useCommand(client: Client, evt: Message, args: string[]) {
        // This might seem hacky but instanceof always fails for jest mocks
        if (evt.channel.constructor.name !== TextChannel.name) {
            return;
        }
        if (args && args[0] !== undefined && evt.member) {
            let cmdArgs;
            const channel: TextChannel = evt.channel as TextChannel;
            const sender: GuildMember = evt.member;
            switch (args[0].toLowerCase()) {
                case "mute":
                    cmdArgs = this.parseArgsTime(evt, args, "mute");
                    await this.muteUser(channel, sender, cmdArgs);
                    break;
                case "unmute":
                    cmdArgs = this.parseArgsTime(evt, args, "mute");
                    await this.unmuteUser(channel, sender, cmdArgs);
                    break;
                case "ban":
                    cmdArgs = this.parseArgsTime(evt, args, "ban");
                    await this.banUser(channel, sender, cmdArgs);
                    break;
                case "warn":
                    cmdArgs = this.parseArgs(evt, args);
                    await this.warnUser(channel, sender, cmdArgs);
                    break;
                case "kick":
                    cmdArgs = this.parseArgs(evt, args);
                    await this.kickUser(channel, sender, cmdArgs);
                    break;
                case "actions":
                    cmdArgs = this.parseListArgs(evt, args);
                    if (cmdArgs && cmdArgs.name) {
                        await this.listActions(
                            channel,
                            sender,
                            cmdArgs.name,
                            cmdArgs?.type
                        );
                    }
                    break;
                default:
                    break;
            }
        }
    }

    getCommand(): string[] {
        return ["mod"];
    }

    getRequiredPermission(): number {
        return Permissions.FLAGS.KICK_MEMBERS;
    }

    /**
     * Parse the arguments of the command out to a target, time, and reason
     * @param evt The message from the command
     * @param args The arguments of the command
     * @param type The type of the command [ban|mute]
     */
    parseArgsTime(evt: Message, args: string[], type: string): CommandArgsTime {
        const cmdArgs: CommandArgsTime = {
            target: null,
            time: null,
            reason: null
        };

        if (args.length >= 2) {
            const firstMention:
                | GuildMember
                | undefined = evt.mentions.members?.first();
            if (firstMention) {
                cmdArgs.target = firstMention;
            }
        }

        if (args.length >= 3) {
            const remainder = args.slice(2).join(" ").split("|");
            cmdArgs.time = parseModDateString(remainder[0].trim());
            cmdArgs.reason = remainder.length > 1 ? remainder[1].trim() : null;
        } else {
            cmdArgs.time = this.getDefaultLength(type);
            cmdArgs.reason = type;
        }

        return cmdArgs;
    }

    /**
     * Get the default length of a punishment based on type
     * @param type The type of the punishment [mute|ban]
     */
    getDefaultLength(type: string): number {
        if (type === "mute") {
            return 60 * 60 * 1000;
        } else if (type === "ban") {
            return parseModDateString("9999 years");
        } else {
            return 60 * 1000;
        }
    }

    /**
     * Parse arguments out to a target and a reason
     * @param evt The message event from the command
     * @param args The arguments for the command
     */
    parseArgs(evt: Message, args: string[]): CommandArgs {
        const cmdArgs: CommandArgs = {
            target: null,
            reason: null
        };

        if (args.length >= 2) {
            const firstMention:
                | GuildMember
                | undefined = evt.mentions.members?.first();
            if (firstMention) {
                cmdArgs.target = firstMention;
            }
        }

        if (args.length >= 3) {
            cmdArgs.reason = args.slice(2).join(" ");
        }

        return cmdArgs;
    }

    /**
     * Parse args for the list command
     * @param evt The message from discord
     * @param args The message arguments
     */
    parseListArgs(evt: Message, args: string[]): ListArgs | null {
        let type: PunishmentType|undefined = undefined;
        // If 3 or more arghs, try to parse type
        if (args.length >= 3) {
            type = PunishmentType[args[2] as keyof typeof PunishmentType];
            if (!type) {
                evt.channel.send(
                    getErrorEmbed("-mod actions [user] [type] requires a valid type (warn/mute/kick/ban)")
                );
                return null;
            }
        }
        if (args.length >= 2) {
            // Try to use mention for name if it exists
            let name = args[1];
            const firstMention:
                | GuildMember
                | undefined = evt.mentions.members?.first();
            if (firstMention) {
                name = firstMention.user.username;
            }

            return {
                type: type,
                name: name
            }
        } else {
            evt.channel.send(
                getErrorEmbed("-mod actions [user] requires a valid user display name or ping")
            );
            return null;
        }
    }

    /**
     * Attempt to mute a user, provided there is a target, time, and reason.
     * @param channel The channel the user is being muted in
     * @param sender The person doing the muting
     * @param cmdArgs The parsed out args for target/time/reason
     */
    async muteUser(
        channel: TextChannel,
        sender: GuildMember,
        cmdArgs: CommandArgsTime
    ): Promise<void> {
        if (cmdArgs.target && cmdArgs.time && cmdArgs.reason) {
            await modProcessor.muteUser(
                cmdArgs.target,
                channel,
                sender,
                cmdArgs.reason,
                cmdArgs.time
            );
        } else {
            await channel.send(
                getErrorEmbed(
                    `${sender} - You need to use the command in the correct format: -mod mute [user ping] [time] | [reason]`
                )
            );
        }
    }

    /**
     * Attempt to unmute a user provided a target is specified
     * @param channel The channel the user is being unmuted in
     * @param sender The member doing the unmuting
     * @param cmdArgs The parsed out command args (target/reason)
     */
    async unmuteUser(
        channel: TextChannel,
        sender: GuildMember,
        cmdArgs: CommandArgs
    ): Promise<void> {
        if (cmdArgs.target) {
            await modProcessor.unmuteUser(
                cmdArgs.target.guild,
                cmdArgs.target.user
            );
            await channel.send(
                getInformationalEmbed(
                    "User has been unmuted",
                    `${cmdArgs.target} has been unmuted.`
                )
            );
        } else {
            await channel.send(
                getErrorEmbed(
                    `${sender} - You need to use the command in the correct format: -mod unmute [user ping]`
                )
            );
        }
    }

    /**
     * Attempt to a kick a user given a target and reason
     * @param channel The channel the user is being kicked in
     * @param sender The member doing the kicking
     * @param cmdArgs The parsed out args (target/reason)
     */
    async kickUser(
        channel: TextChannel,
        sender: GuildMember,
        cmdArgs: CommandArgs
    ): Promise<void> {
        if (cmdArgs.target && cmdArgs.reason) {
            await modProcessor.kickUser(cmdArgs.target, sender, cmdArgs.reason);
            await channel.send(
                getInformationalEmbed(
                    "User kicked",
                    `${cmdArgs.target} has been kicked.`
                )
            );
        } else {
            await channel.send(
                getErrorEmbed(
                    `${sender} - You need to use the command in the correct format: -mod kick [user ping] [reason]`
                )
            );
        }
    }

    /**
     * Attempt to ban a user given a target, time, and reason
     * @param channel The channel the user is being banned in
     * @param sender The member doing the banning
     * @param cmdArgs The parsed out command args (target/time/reason)
     */
    async banUser(
        channel: TextChannel,
        sender: GuildMember,
        cmdArgs: CommandArgsTime
    ): Promise<void> {
        if (cmdArgs.target && cmdArgs.time && cmdArgs.reason) {
            const expirationDate = moment(Date.now() + cmdArgs.time);
            const expirationDateString = moment
                .tz(expirationDate, "America/New_York")
                .format("MMMM Do YYYY, h:mm:ss a");

            await modProcessor.banUser(
                cmdArgs.target,
                sender,
                cmdArgs.reason,
                cmdArgs.time
            );
            await channel.send(
                getInformationalEmbed(
                    "User banned",
                    `${cmdArgs.target} has been banned for _${cmdArgs.reason}_ until ${expirationDateString}.`
                )
            );
        } else {
            await channel.send(
                getErrorEmbed(
                    `${sender} - You need to use the command in the correct format: -mod ban [user ping] [time] | [reason]`
                )
            );
        }
    }

    /**
     * Attempt to warn a user given a target and reason
     * @param channel The channel the user is being warned in
     * @param sender The member doing the warning
     * @param cmdArgs The parsed out command args (target/reason)
     */
    async warnUser(
        channel: TextChannel,
        sender: GuildMember,
        cmdArgs: CommandArgs
    ): Promise<void> {
        if (cmdArgs.target && cmdArgs.reason) {
            await modProcessor.warnUser(cmdArgs.target, sender, cmdArgs.reason);
            await channel.send(
                getInformationalEmbed(
                    "User warned",
                    `${cmdArgs.target} has been warned for _${cmdArgs.reason}_.`
                )
            );
        } else {
            await channel.send(
                getErrorEmbed(
                    `${sender} - You need to use the command in the correct format: -mod warn [user ping] [reason]`
                )
            );
        }
    }

    /**
     * Create and send an embed listing the moderation actions against a user
     * @param channel The channel to place the embed in
     * @param sender The person querying for the embed
     * @param name The name of the person whose actions are being checked-
     * @param punishmentType The type of punishment, if specified
     */
    async listActions(
        channel: TextChannel,
        sender: GuildMember,
        name: string,
        punishmentType?: PunishmentType
    ): Promise<void> {
        const members = channel.guild.members.cache.filter((member) =>
            member.user.username.toLowerCase().includes(name.toLowerCase())
        );
        const member = members.first();
        if (member) {
            const id = member.id;
            const punishments: Punishment[] = await modProcessor.fetchPunishments(
                channel.guild.id,
                id
            );
            const titleAddition = punishmentType ? ` - ${punishmentType}s` : '';
            const embed = new MessageEmbed().setTitle(
                `Found punishments - ${member.nickname || member.displayName}${titleAddition}`
            );
            punishments.forEach((punishment) => {
                if (punishmentType && punishmentType !== punishment.type)
                    return;
                const expirationDateString = moment
                    .tz(punishment.expiration, "America/New_York")
                    .format("MMMM Do YYYY, h:mm:ss a");
                embed.addField(
                    `Punishment`,
                    `Name: ${punishment.userName}\n` +
                        `Type: ${punishment.type}\n` +
                        `Reason: ${punishment.reason}\n` +
                        `Expiration: ${
                            punishment.expiration !== 0
                                ? expirationDateString
                                : "N/A"
                        }\n` +
                        `Active: ${punishment.active ? "True" : "False"}\n` +
                        `By: ${punishment.punisherName}\n\n`
                );
            });
            await channel.send(embed);
        } else {
            await channel.send("User not found.");
        }
    }
}
