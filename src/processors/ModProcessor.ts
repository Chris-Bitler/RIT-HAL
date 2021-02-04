import {Ban, Mute} from "../types/Punishment";
import {Client, Guild, GuildMember, TextChannel, User} from "discord.js";
import {Punishment} from "../models/Punishment";
import {ConfigProperty} from "../models/ConfigProperty";
import * as moment from "moment-timezone";
import {getErrorEmbed, getInformationalEmbed} from "../utils/EmbedUtil";
import * as sentry from "@sentry/node";
import {LogProcessor} from "./LogProcessor";

export enum PunishmentType {
    warn = "warn",
    mute = "mute",
    kick = "kick",
    ban = "ban"
}

/**
 * Class for processing and tracking moderation actions
 */
export class ModProcessor {
    static instance: ModProcessor;
    mutes: Mute[] = [];
    bans: Ban[] = [];

    /**
     * Get the instance of the processor
     */
    static getInstance(): ModProcessor {
        if (!this.instance) {
            this.instance = new ModProcessor();
        }

        return this.instance;
    }

    /**
     *
     * @param memberToMute The member who is being muted
     * @param muter The member who is doing the muting
     * @param channel The channel the mute command was sent in
     * @param reason The reason the member was muted
     * @param expiration The amount of milliseconds- to add to the current epoch for expiration
     */
    async muteUser(
        memberToMute: GuildMember,
        channel: TextChannel,
        muter: GuildMember,
        reason: string,
        expiration: number
    ): Promise<void> {
        const mutedRoleId = await this.fetchMutedRoleId(memberToMute.guild.id);
        if (mutedRoleId) {
            if (memberToMute && !memberToMute.roles.cache.get(mutedRoleId)) {
                await memberToMute.roles.add(mutedRoleId);
            }

            const expirationDateTime = Date.now() + expiration;

            this.mutes = this.mutes.filter(
                (mute) => mute.memberId !== memberToMute.id
            );

            this.mutes.push({
                memberId: memberToMute.id,
                muterId: muter.id,
                serverId: memberToMute.guild.id,
                reason,
                expiration: expirationDateTime
            });

            await Punishment.create({
                userId: memberToMute.id,
                userName: memberToMute.user.username,
                punisherId: muter.id,
                punisherName: muter.user.username,
                type: "mute",
                reason,
                active: true,
                expiration: expirationDateTime,
                serverId: memberToMute.guild.id
            });

            const expirationDate = moment(expirationDateTime);
            const expirationDateString = moment
                .tz(expirationDate, "America/New_York")
                .format("MMMM Do YYYY, h:mm:ss a");
            await channel.send(
                getInformationalEmbed(
                    "User muted",
                    `${memberToMute} has been muted for ${reason} until ${expirationDateString}`
                )
            );
            await this.logPunishmentToChannel(
                memberToMute.guild,
                PunishmentType.mute,
                muter,
                memberToMute,
                reason,
                expirationDateString
            );
            await memberToMute.send(
                getInformationalEmbed(
                    "You have been muted",
                    `You have been muted for _${reason}_ until ${expirationDateString} EST by **${
                        muter.displayName || muter.user.username
                    }**`
                )
            );
        } else {
            await muter.send(
                getErrorEmbed(
                    "Your server admin needs to set the ID of the muted role before you can use this command."
                )
            );
        }
    }

    /**
     * Attempt to ban a user
     * @param memberToBan The member to ban
     * @param banner The member doing the banning
     * @param reason The reason the user is being banned
     * @param expiration The milliseconds to add to the epoch for the expiration time
     */
    async banUser(
        memberToBan: GuildMember,
        banner: GuildMember,
        reason: string,
        expiration: number
    ): Promise<void> {
        const expirationDateTime = Date.now() + expiration;

        this.bans = this.bans.filter(
            (ban) => ban.memberId !== memberToBan.id
        );

        this.bans.push({
            memberId: memberToBan.id,
            bannerId: banner.id,
            reason,
            expiration: expirationDateTime,
            serverId: memberToBan.guild.id
        });

        const expirationDateString = moment
            .tz(expirationDateTime, "America/New_York")
            .format("MMMM Do YYYY, h:mm:ss a");

        try {
            await memberToBan.ban({ reason: reason });
            await this.logPunishmentToChannel(
                memberToBan.guild,
                PunishmentType.ban,
                banner,
                memberToBan,
                reason,
                expirationDateString
            );
            await memberToBan.send(
                getInformationalEmbed(
                    "You have been banned",
                    `You have been banned from the RIT discord for _${reason.trim()}_ by **${
                        banner.user.username
                    }** until ${expirationDateString}`
                )
            );
        } catch (err) {
            await banner.send(
                getErrorEmbed("An error occurred when trying to ban that user.")
            );
            await memberToBan.ban({ reason: reason });
        }
        await Punishment.create({
            userId: memberToBan.id,
            userName: memberToBan.user.username,
            punisherId: banner.id,
            punisherName: banner.user.username,
            type: "ban",
            reason,
            expiration: expirationDateTime,
            active: true,
            serverId: memberToBan.guild.id
        });
    }

    /**
     *  Attempt to unban a user from the server
     * @param guild The server to unban the user from
     * @param user The user to be unbanned, either snowflake or user object
     * @param automatic Whether or not it was from a ban expiring
     */
    async unbanUser(
        guild: Guild,
        user: User | string,
        automatic = false
    ): Promise<void> {
        let userBanned = false;
        const idToUnban = typeof user === "string" ? user : user.id;
        this.bans = this.bans.filter((ban) => {
            if (ban.memberId === idToUnban && ban.serverId === guild.id) {
                userBanned = true;
                return false;
            }

            return true;
        });

        if (automatic) {
            await guild.members.unban(user);
        }

        if (userBanned) {
            await Punishment.update(
                {
                    active: false
                },
                {
                    where: {
                        userId: idToUnban,
                        serverId: guild.id,
                        type: "ban"
                    }
                }
            );
        }
    }

    /**
     * Attempt to unmute a user
     * @param guild The guild to unmute the user in
     * @param user The user to unmute, either snowflake or user object
     */
    async unmuteUser(guild: Guild, user: User | string): Promise<void> {
        const memberToUnmute: GuildMember | null = guild.members.resolve(user);
        LogProcessor.getLogger().info(`Attempting to unmute ${user}`);
        if (memberToUnmute) {
            let userMuted = false;
            this.mutes = this.mutes.filter((mute) => {
                if (mute.memberId === memberToUnmute.id) {
                    userMuted = true;
                    return false;
                }
                return true;
            });

            const mutedRoleId = await this.fetchMutedRoleId(guild.id);
            LogProcessor.getLogger().info(`Muted role found: ${mutedRoleId}`);
            if (mutedRoleId) {
                LogProcessor.getLogger().info(`Attempting to unmute ${user}`);
                await memberToUnmute.roles.remove(mutedRoleId);
            }

            LogProcessor.getLogger().info(`Mute found for user ${user}: ${userMuted}`);

            if (userMuted) {
                await Punishment.update(
                    {
                        active: false
                    },
                    {
                        where: {
                            userId: memberToUnmute.id,
                            serverId: memberToUnmute.guild.id,
                            type: "mute"
                        }
                    }
                );
                LogProcessor.getLogger().info(`DB punishment updated for ${user}`);
            }
        }
    }

    /**
     * Attempt to kick a user
     * @param memberToKick The member to kick
     * @param kicker The member doing the kicking
     * @param reason The reason for the kick
     */
    async kickUser(
        memberToKick: GuildMember,
        kicker: GuildMember,
        reason: string
    ): Promise<void> {
        // Note: This messaging has to be handled here because it can't be sent after the user is kicked
        try {
            await memberToKick.send(
                getInformationalEmbed(
                    "You have been kicked",
                    `You have been kicked from the RIT discord for _${reason.trim()}_ by **${
                        kicker.user.username
                    }**`
                )
            );
            await Punishment.create({
                userId: memberToKick.id,
                userName: memberToKick.user.username,
                punisherId: kicker.id,
                punisherName: kicker.user.username,
                type: "kick",
                reason,
                serverId: memberToKick.guild.id,
                expiration: 0
            });
            await memberToKick.kick(reason.trim());
            await this.logPunishmentToChannel(
                memberToKick.guild,
                PunishmentType.kick,
                kicker,
                memberToKick,
                reason
            );
        } catch (err) {
            await kicker.send(
                getErrorEmbed(
                    "An error occurred when trying to kick that user."
                )
            );
            await Punishment.create({
                userId: memberToKick.id,
                userName: memberToKick.user.username,
                punisherId: kicker.id,
                punisherName: kicker.user.username,
                type: "kick",
                reason,
                serverId: memberToKick.guild.id,
                expiration: 0
            });
            await memberToKick.kick(reason.trim());
        }
    }

    /**
     * Attempt to warn a user
     * @param memberToWarn The user to warn
     * @param warner The member doing the warning
     * @param reason The reason for the warning
     */
    async warnUser(
        memberToWarn: GuildMember,
        warner: GuildMember,
        reason: string
    ): Promise<void> {
        try {
            await memberToWarn.send(
                getInformationalEmbed(
                    "You have been warned",
                    `You have been warned by **${
                        warner.user.username
                    }** in the RIT discord for _${reason.trim()}_.`
                )
            );
            await Punishment.create({
                userId: memberToWarn.id,
                userName: memberToWarn.user.username,
                punisherId: warner.id,
                punisherName: warner.user.username,
                type: "warn",
                reason,
                serverId: memberToWarn.guild.id,
                expiration: 0
            });
            await this.logPunishmentToChannel(
                memberToWarn.guild,
                PunishmentType.warn,
                warner,
                memberToWarn,
                reason
            );
        } catch (err) {
            await warner.send(
                getErrorEmbed(
                    "An error occurred when trying to warn that user."
                )
            );
            await Punishment.create({
                userId: memberToWarn.id,
                userName: memberToWarn.user.username,
                punisherId: warner.id,
                punisherName: warner.user.username,
                type: "warn",
                reason,
                serverId: memberToWarn.guild.id,
                expiration: 0
            });
        }
    }

    /**
     * Get whether or not a user is muted
     * @param member The guild member to check for mutes
     */
    isUserMuted(member: GuildMember): boolean {
        return this.mutes.some((mute) => mute.memberId === member.id);
    }

    /**
     * Reassign the mute role to a user
     * @param member the member to reassign the role to
     */
    async reassignUserMutedRole(member: GuildMember): Promise<void> {
        const mutedRoleId = await this.fetchMutedRoleId(member.guild.id);
        if (mutedRoleId) {
            await member.roles.add(mutedRoleId);
        }
    }

    /**
     * Load active punishments from the DB into the instance storage
     */
    async loadPunishmentsFromDB(): Promise<void> {
        const punishments: Punishment[] = await Punishment.findAll({
            where: {
                active: true
            }
        });
        punishments.forEach((punishment) => {
            switch (punishment.type) {
                case "mute":
                    // Get rid of any existing loaded mutes
                    // This prevents issues with having two conflicting mutes
                    this.mutes = this.mutes.filter((mute) => {
                        return mute.memberId !== punishment.userId;
                    });
                    this.mutes.push({
                        memberId: punishment.userId,
                        muterId: punishment.punisherId,
                        reason: punishment.reason,
                        expiration: punishment.expiration,
                        serverId: punishment.serverId
                    });
                    break;
                case "ban":
                    this.bans = this.bans.filter((ban) => {
                        return ban.memberId !== punishment.userId;
                    });
                    this.bans.push({
                        memberId: punishment.userId,
                        bannerId: punishment.punisherId,
                        reason: punishment.reason,
                        expiration: punishment.expiration,
                        serverId: punishment.serverId
                    });
                    break;
                default:
                    break;
            }
        });
    }

    /**
     * Tick punishments, unmuting users and unbanning users if their mutes/bans have expired.
     * @param client The discord.js client
     */
    async tickPunishments(client: Client): Promise<void> {
        const expiredMutes = this.mutes.filter(
            (mute) => Date.now() > mute.expiration
        );
        const expiredBans = this.bans.filter(
            (ban) => Date.now() > ban.expiration
        );
        expiredMutes.forEach((mute) => {
            const guild = client.guilds.resolve(mute.serverId);
            LogProcessor.getLogger().info(`Attempting to unmute ${mute.memberId} - expired`);
            if (guild) {
                LogProcessor.getLogger().info(`Unmuting ${mute.memberId} in ${guild.name}`);
                try {
                    this.unmuteUser(guild, mute.memberId);
                } catch (err) {
                    LogProcessor.getLogger().info(`Error unmuting user: ${err}`);
                    sentry.captureException(err);
                }
            }
        });
        expiredBans.forEach((ban) => {
            const guild = client.guilds.resolve(ban.serverId);
            LogProcessor.getLogger().info(`Attempting to unban ${ban.memberId} - expired`);
            if (guild) {
                LogProcessor.getLogger().info(`Unbanning ${ban.memberId} in ${guild.name}`);
                try {
                    this.unbanUser(guild, ban.memberId, true);
                } catch (err) {
                    LogProcessor.getLogger().info(`Error unbanning user: ${err}`);
                    sentry.captureException(err);
                }
            }
        });
    }

    /**
     * Fetch the list of punishments for a user
     * @param serverId The id of the guild the user is in
     * @param memberId The id of the user to check for punishments
     */
    async fetchPunishments(
        serverId: string,
        memberId: string
    ): Promise<Punishment[]> {
        return Punishment.findAll({
            where: {
                serverId,
                userId: memberId
            }
        });
    }

    /**
     * Get the channel for a punishment logging
     * @param serverId The guild's id
     * @param punishmentType The punishment type
     */
    async getChannelForPunishment(
        serverId: string,
        punishmentType: PunishmentType
    ): Promise<string | null> {
        let channelId = null;
        switch (punishmentType) {
            case PunishmentType.warn:
                channelId = this.fetchWarnLogChannel(serverId);
                break;
                case PunishmentType.mute:
                    channelId = this.fetchMuteLogChannel(serverId);
                    break;
                case PunishmentType.kick:
                    channelId = this.fetchKickLogChannel(serverId);
                    break;
                case PunishmentType.ban:
                    channelId = this.fetchBanLogChannel(serverId);
                    break;
                default:
                    break;
        }
        return channelId;
    }

    /**
     * Log punishments to a specific channel for review purposes
     * @param guild The guild the punishment took place in
     * @param punishmentType The type of punishment
     * @param punisher The person doing the punishing
     * @param punishee The person being punished
     * @param reason The reason they were punished
     * @param expirationTime The expiration time for punishing
     */
    async logPunishmentToChannel(
        guild: Guild,
        punishmentType: PunishmentType,
        punisher: GuildMember,
        punishee: GuildMember,
        reason: string,
        expirationTime?: string
    ): Promise<void> {
        const channelId = await this.getChannelForPunishment(guild.id, punishmentType);
        if (channelId != null) {
            const channel = guild.channels.resolve(channelId);
            if (channel && channel instanceof TextChannel) {
                switch (punishmentType) {
                    case PunishmentType.warn:
                        await channel.send(
                            getInformationalEmbed(
                                "User warned",
                                `${punisher} has warned ${punishee} for ${reason}`
                            )
                        );
                        break;
                    case PunishmentType.mute:
                        await channel.send(
                            getInformationalEmbed(
                                "User muted",
                                `${punisher} has muted ${punishee} for ${reason} until ${expirationTime}`
                            )
                        );
                        break;
                    case PunishmentType.kick:
                        await channel.send(
                            getInformationalEmbed(
                                "User kicked",
                                `${punisher} has kicked ${punishee} for ${reason}`
                            )
                        );
                        break;
                    case PunishmentType.ban:
                        await channel.send(
                            getInformationalEmbed(
                                "User banned",
                                `${punisher} has banned ${punishee} for ${reason} until ${expirationTime}`
                            )
                        );
                        break;
                }
            }
        }
    }

    /**
     * Attempt to fetch the muted role id for a specific server
     * @param serverId The guild id to fetch the muted role id for
     */
    async fetchMutedRoleId(serverId: string): Promise<string | null> {
        const mutedRoleId = await ConfigProperty.getServerProperty(
            "muted.role",
            serverId
        );
        if (mutedRoleId?.value) {
            return mutedRoleId.value;
        } else {
            return null;
        }
    }

    /**
     * Fetch the channel ids that the warn actions will be logged to
     * @param serverId The guild id to fetch the log channels for
     */
    async fetchWarnLogChannel(serverId: string): Promise<string | null> {
        const modWarnLogChannels = await ConfigProperty.getServerProperty(
            "mod.action.logs.warn",
            serverId
        );
        if (modWarnLogChannels?.value) {
            return modWarnLogChannels.value;
        } else {
            return null;
        }
    }

    /**
     * Fetch the channel ids that the kick actions will be logged to
     * @param serverId The guild id to fetch the log channels for
     */
    async fetchKickLogChannel(serverId: string): Promise<string | null> {
        const modKickLogChannels = await ConfigProperty.getServerProperty(
            "mod.action.logs.kick",
            serverId
        );
        if (modKickLogChannels?.value) {
            return modKickLogChannels.value;
        } else {
            return null;
        }
    }

    /**
     * Fetch the channel ids that the mute actions will be logged to
     * @param serverId The guild id to fetch the log channels for
     */
    async fetchMuteLogChannel(serverId: string): Promise<string | null> {
        const modMuteLogChannels = await ConfigProperty.getServerProperty(
            "mod.action.logs.mute",
            serverId
        );
        if (modMuteLogChannels?.value) {
            return modMuteLogChannels.value;
        } else {
            return null;
        }
    }

    /**
     * Fetch the channel ids that the ban actions will be logged to
     * @param serverId The guild id to fetch the log channels for
     */
    async fetchBanLogChannel(serverId: string): Promise<string | null> {
        const modBanLogChannels = await ConfigProperty.getServerProperty(
            "mod.action.logs.ban",
            serverId
        );
        if (modBanLogChannels?.value) {
            return modBanLogChannels.value;
        } else {
            return null;
        }
    }
}
