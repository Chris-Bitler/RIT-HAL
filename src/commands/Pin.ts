import {
    Client,
    Guild,
    Message,
    MessageEmbed,
    Permissions,
    TextChannel
} from "discord.js";
import { Command } from "./Command";
import { getErrorEmbed, getInformationalEmbed } from "../utils/EmbedUtil";
import { ConfigProperty } from "../models/ConfigProperty";

/**
 * Command to pin a message to a starboard channel
 */
export class Pin extends Command {
    async useCommand(
        client: Client,
        evt: Message,
        args: string[]
    ): Promise<void> {
        if (
            args &&
            args[0] !== undefined &&
            evt.channel instanceof TextChannel
        ) {
            const urlParts = args[0].split("/");
            if (urlParts.length >= 2) {
                const messageId = urlParts[urlParts.length - 1];
                const channelId = urlParts[urlParts.length - 2];
                try {
                    const guild = evt.channel.guild;
                    const starboardChannelId = await this.fetchStarboardChannelId(
                        guild.id
                    );
                    if (starboardChannelId) {
                        const messageChannel = guild.channels.resolve(
                            channelId
                        );
                        const starChannel = guild.channels.resolve(
                            starboardChannelId
                        );
                        if (
                            messageChannel &&
                            messageChannel instanceof TextChannel &&
                            starChannel &&
                            starChannel instanceof TextChannel
                        ) {
                            await this.getAndSendEmbed(
                                guild,
                                evt,
                                messageChannel,
                                starChannel,
                                messageId,
                                args[0]
                            );
                        } else {
                            await evt.channel.send(
                                getErrorEmbed(
                                    "Please make sure to set the starboard channel id before using this command"
                                )
                            );
                        }
                    }
                } catch (exception) {
                    // TODO: Log to sentry
                    await evt.channel.send(
                        getErrorEmbed(
                            "Error sending embed to starboard channel"
                        )
                    );
                }
            } else {
                await evt.channel.send(
                    getErrorEmbed("Please use a valid discord message url")
                );
            }
        }
    }

    /**
     * Generate the embed for a pinned message
     * @param guild The guild the pin is being done in
     * @param evt The command message that is doing the pinning
     * @param channel The channel the pinned message was in
     * @param starboardChannel The channel to pin the message in
     * @param messageId The id of the message to pin
     * @param url The full url of the link to the pinned message
     */
    async getAndSendEmbed(
        guild: Guild,
        evt: Message,
        channel: TextChannel,
        starboardChannel: TextChannel,
        messageId: string,
        url: string
    ): Promise<void> {
        const message = await channel.messages.fetch(messageId);
        if (message) {
            const embed = new MessageEmbed();
            const messageMember = guild.members.resolve(message.author.id);
            const pinningMember = guild.members.resolve(evt.author.id);
            if (messageMember && pinningMember) {
                embed.setAuthor(
                    messageMember.displayName,
                    message.author.displayAvatarURL()
                );
                embed.setDescription(message.content);
                embed.addField("Source", "[Link](" + url + ")");
                embed.addField("Pinned by", pinningMember.displayName);
                if (message.attachments.size > 0) {
                    message.attachments.forEach((attachment) => {
                        if (!this.isImage(attachment.url)) {
                            embed.addField(
                                "Attachment",
                                "[" +
                                    attachment.name +
                                    "](" +
                                    attachment.url +
                                    ")"
                            );
                        } else {
                            embed.setImage(attachment.url);
                        }
                    });
                }
                await starboardChannel.send(embed);
                await evt.channel.send(
                    getInformationalEmbed(
                        "Pinned",
                        "Message from " +
                            messageMember.displayName +
                            " pinned in starboard."
                    )
                );
            } else {
                await evt.channel.send(
                    getErrorEmbed(
                        "Cannot resolve member who posted the message to pin"
                    )
                );
            }
        } else {
            await evt.channel.send(
                getErrorEmbed("Cannot resolve message to pin")
            );
        }
    }

    getCommand(): string {
        return "starboard";
    }

    getRequiredPermission(): number {
        return Permissions.FLAGS.KICK_MEMBERS;
    }

    /**
     *
     * @param filename
     */
    isImage(filename: string): boolean {
        return (
            filename.endsWith(".png") ||
            filename.endsWith(".jpg") ||
            filename.endsWith(".jpeg") ||
            filename.endsWith("gif")
        );
    }

    /**
     * Attempt to fetch the starboard channel id for a server
     * @param serverId The guild id to fetch the starboard channel id for
     */
    async fetchStarboardChannelId(serverId: string): Promise<string | null> {
        const starboardId = await ConfigProperty.getServerProperty(
            "starboard.channel",
            serverId
        );
        if (starboardId?.value) {
            return starboardId.value;
        } else {
            return null;
        }
    }
}
