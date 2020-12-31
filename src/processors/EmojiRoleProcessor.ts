import {
    GuildMember,
    TextChannel,
    MessageReaction,
    Role,
    GuildEmoji, ReactionEmoji, Message, GuildChannel
} from "discord.js";
import { EmojiToRole } from "../models/EmojiToRole";
import { getErrorEmbed, getInformationalEmbed } from "../utils/EmbedUtil";
import { UnicodeEmoji } from "../types/Emoji";
import {LogProcessor} from "./LogProcessor";

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
    if (emojiToRole) {
        const { roleId } = emojiToRole;
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
}

export function getRole(evt: Message, roleId: string): Role | undefined {
    return evt.guild?.roles.cache.find((role) => role.id === roleId);
}

export function getChannel(evt: Message, channelText: string): GuildChannel | undefined {
    return evt.guild?.channels.cache.find(
        (channel) => channel.id === channelText
    );
}