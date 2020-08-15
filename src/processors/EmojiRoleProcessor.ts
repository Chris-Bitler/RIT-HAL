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
    const emojiToRole = await EmojiToRole.findOne({
        where: {
            emojiId,
            channelId: channel.id,
            serverId: channel.guild.id
        },
        order: [["id", "DESC"]]
    });
    if (emojiToRole) {
        const { roleId } = emojiToRole;
        const role = channel.guild.roles.resolve(roleId);
        if (role) {
            if (member.roles.cache.get(roleId)) {
                await member.roles.remove(role);
                await member.send(
                    getInformationalEmbed(
                        "Removed role",
                        `Your role **${role.name}** was removed in ${channel.guild.name}`
                    )
                );
            } else {
                await member.roles.add(role);
                await member.send(
                    getInformationalEmbed(
                        "Added role",
                        `You were given the role **${role.name}** in ${channel.guild.name}`
                    )
                );
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