import {
    GuildMember,
    TextChannel,
    MessageReaction,
    Role,
    GuildEmoji, ReactionEmoji, Message, GuildChannel, MessageEmbed
} from "discord.js";
import { EmojiToRole } from "../models/EmojiToRole";
import { getErrorEmbed, getInformationalEmbed } from "../utils/EmbedUtil";
import { UnicodeEmoji } from "../types/Emoji";
import {LogProcessor} from "./LogProcessor";
import {isNumeric} from "../utils/StringUtil";

export async function addEmojiRole(
    initialChannel: TextChannel,
    emote: GuildEmoji | UnicodeEmoji,
    role: Role,
    channel: TextChannel
): Promise<void> {
    try {
        await EmojiToRole.create({
            emojiId: emote.id,
            roleId: role.id,
            channelId: channel.id,
            serverId: channel.guild.id
        });
        await initialChannel.send(
            getInformationalEmbed(
                "Emoji->Role added",
                `${emote} was added for ${role} in ${channel}`
            )
        );
    } catch (err) {
        await initialChannel.send(
            getErrorEmbed("An error occurred adding that emoji->role")
        );
    }
}

export async function removeEmojiRole(
    initialChannel: TextChannel,
    emote: GuildEmoji | UnicodeEmoji | null,
    channel: TextChannel
): Promise<void> {
    if (!emote) {
        await initialChannel.send(
            getErrorEmbed(
                "Cannot remove non-existent emoji to role"
            )
        );
        return;
    }
    const emojiToRole = await EmojiToRole.findOne({
        where: {
            emojiId: emote.id ? emote.id : emote.id,
            channelId: channel.id,
            serverId: channel.guild.id
        },
        order: [["id", "DESC"]]
    });

    if (emojiToRole) {
        const role = channel.guild.roles.resolve(emojiToRole.roleId);
        LogProcessor.getLogger().info(`Emoji ${emote} had the role ${role ? role : emojiToRole.roleId} removed.`);
        await emojiToRole.destroy();
        await initialChannel.send(
            getInformationalEmbed(
                "Role reaction removed",
                `The role reaction of ${role} for ${emote} was removed`
            )
        );
    } else {
        await initialChannel.send(
            getErrorEmbed(
                `Cannot find role reaction of ${emote}`
            )
        );
    }
}

export async function listEmojiRoles(
    channel: TextChannel,
    emote?: GuildEmoji | UnicodeEmoji
): Promise<void> {
    let whereClause: any = {
        serverId: channel.guild.id,
        channelId: channel.id,
    };

    if (emote) {
        whereClause = {
            ...whereClause,
            emojiId: emote.id
        }
    }

    LogProcessor.getLogger().info(`Listing emoji role for g:${channel.guild.id} c: ${channel.id} e: ${emote}`);

    const emojiToRoles = await EmojiToRole.findAll({
        where: whereClause,
        order: [["id", "DESC"]]
    });
    LogProcessor.getLogger().info(`Found emoji roles: ${emojiToRoles.length}`);
    const embed = new MessageEmbed();
    embed.setTitle(`Emoji roles for ${channel.name} ${emote ? ` and emote ${emote}` : ''}`);
    let embedText = '';
    emojiToRoles.forEach((emojiToRole) => {
        try {
            const guildEmote = channel.guild.emojis.resolve(emojiToRole.emojiId);
            const role = channel.guild.roles.resolve(emojiToRole.roleId);
            embedText += `${guildEmote ? guildEmote : emojiToRole.emojiId}: ${role ? role : emojiToRole.roleId}\n`;
        } catch (err) {
            embedText += `Can't resolve emote or role for ${emojiToRole.emojiId}: ${emojiToRole.roleId}`;
        }
    });
    embed.setDescription(embedText);
    await channel.send(embed);
}

export async function checkReactionToDB(
    emote: GuildEmoji | ReactionEmoji,
    member: GuildMember,
    channel: TextChannel,
    reaction: MessageReaction
): Promise<void> {
    const emojiId = emote.id ? emote.id : emote.name;
    const logger = LogProcessor.getLogger();
    const emojiToRole = await EmojiToRole.findOne({
        where: {
            emojiId,
            channelId: channel.id,
            serverId: channel.guild.id
        },
        order: [["id", "DESC"]]
    });

    logger.info(`Searching for emoji to role for emoji id ${emojiId} for ${member} in channel ${channel.id}`);
    try {
        if (emojiToRole) {
            const {roleId} = emojiToRole;
            logger.info(`Found role id ${roleId} for ${emojiId}`);
            const role = channel.guild.roles.resolve(roleId);
            if (role) {
                logger.info(`Found role ${role} for ${roleId}`);
                if (member.roles.cache.get(roleId)) {
                    logger.info(`${member} has role, attempting to remove`);
                    await member.roles.remove(role);
                    await member.send(
                        getInformationalEmbed(
                            "Removed role",
                            `Your role **${role.name}** was removed in ${channel.guild.name}`
                        )
                    );
                    logger.info(`${member} had role ${role} removed`);
                } else {
                    logger.info(`${member} does not have role, attempting to add`);
                    await member.roles.add(role);
                    await member.send(
                        getInformationalEmbed(
                            "Added role",
                            `You were given the role **${role.name}** in ${channel.guild.name}`
                        )
                    );
                    logger.info(`${member} had role ${role} added`);
                }
            }
        }
    } catch (err) {
        logger.error(`Error ${err} trying to add ${emojiId} to ${member.displayName}`);
    }
}

export function getRole(evt: Message, roleId: string): Role | undefined {
    const replacedId = roleId.replace(/[!@#&<>]+/g, "");
    if (isNumeric(replacedId)) {
        return evt.guild?.roles.cache.find((role) => role.id === replacedId);
    } else {
        const replacedName = roleId.replace(/^@/g, "");
        return evt.guild?.roles.cache.find((role) => role.name === replacedName);
    }
}

export function getChannel(evt: Message, channelText: string): GuildChannel | undefined {
    const replacedId = channelText.replace(/[<>#]+/g, "");
    if (isNumeric(replacedId)) {
        return evt.guild?.channels.resolve(replacedId) ?? undefined;
    } else {
        const replacedName = channelText.replace(/^#/g, "");
        return evt.guild?.channels.cache.find(
            (channel) => channel.name === replacedName
        )
    }
}