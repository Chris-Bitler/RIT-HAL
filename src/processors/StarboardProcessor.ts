import {StarboardedMessage} from "../models/StarboardedMessage";
import {Message, MessageEmbed, MessageReaction, PartialMessage, TextChannel, User} from "discord.js";
import {ConfigProperty} from "../models/ConfigProperty";
import {safelyFetchMessage} from "../utils/messageUtils";

export class StarboardProcessor {
    messages: StarboardedMessage[] = [];
    deletedViaUnstar: StarboardedMessage[] = [];

    /**
     * Load the starred messages from the DB
     */
    async loadStarredMessages() {
        this.messages = await StarboardedMessage.findAll();
    }

    /**
     * Handle a removed message. If it was automatically removed, don't do anything.
     * If it was not automatically removed, check if
     * - the message the starboard was for was deleted, if so, delete the starboard
     * - the starboard message was deleted, if so, mark it removed so it doesn't re-appear
     * @param message The message being deleted
     */
    async handleRemovedMessage(message: Message|PartialMessage) {
        const channel = message.channel;
        const wasDeletedViaUnstar = this.deletedViaUnstar.some((deletedMsg) => {
            return message.id === deletedMsg.starboardMessageId
        });
        // We don't want to mark ones that were automatically removed as 'removed'
        if (wasDeletedViaUnstar) {
            this.deletedViaUnstar = this.deletedViaUnstar.filter((deletedMsg) => {
                return deletedMsg.starboardMessageId != message.id;
            })
        }
        if (channel instanceof TextChannel) {
            const starboardChannelId = await this.fetchStarboardChannel(channel.guild.id);
            if (starboardChannelId) {
                const starboardChannel = channel.guild.channels.resolve(starboardChannelId);
                if (starboardChannel instanceof TextChannel) {
                    const starboardedMessage = this.messages.find((msg) => msg.originalMessageId === message.id);
                    const starboardMesssage = this.messages.find((msg) => msg.starboardMessageId === message.id);
                    if (starboardedMessage) {
                        const messageToRemove = await safelyFetchMessage(starboardChannel, starboardedMessage.starboardMessageId);
                        if (messageToRemove) {
                            await messageToRemove.delete();
                        }
                    } else if (starboardMesssage) {
                        starboardMesssage.update({
                            removed: 1
                        });
                        const message = await safelyFetchMessage(starboardChannel, starboardMesssage.starboardMessageId);
                        if (message) {
                            await message.delete();
                        }
                    }
                }
            }
        }
    }

    /**
     * Respond to a user reacting with a star - check if it should be starboarded, if we should update existing starboard
     * or if we should remove an existing starboard for falling below the threshold
     * @param user The user doing the reaction
     * @param messageReaction The reaction the user did
     */
    async respondToStarReaction(user: User, messageReaction: MessageReaction) {
        let reaction = messageReaction;
        if (reaction.count === null) {
            reaction = await messageReaction.fetch();
        }
        if (!messageReaction.message || messageReaction.message?.content.trim().length == 0) {
            // Don't try to starboard blank messages or embeds
            return;
        }
        const channel = reaction.message.channel;
        if (channel instanceof TextChannel && reaction.emoji.name === '⭐') {
            const requiredAmount = await this.fetchStarboardRequiredCount(channel.guild.id);
            const starboardChannelId = await this.fetchStarboardChannel(channel.guild.id);
            if (requiredAmount && starboardChannelId) {
                const starboardChannel = channel.guild.channels.resolve(starboardChannelId);
                const existingStarboard = this.messages.find((message) => message.originalMessageId === reaction.message.id);

                // Short circuit if message was removed
                if (existingStarboard && existingStarboard.removed) {
                    return;
                }

                if (starboardChannel instanceof TextChannel) {
                    if (reaction.count && reaction.count >= Number(requiredAmount)) {
                        if (existingStarboard) {
                            await this.updateInStarboard(reaction, starboardChannel, channel, existingStarboard);
                        } else {
                            await this.addToStarboard(reaction, starboardChannel, channel);
                        }
                    } else if (existingStarboard) {
                        // Delete due to too few reactions
                        const starboardMessage = await safelyFetchMessage(starboardChannel, existingStarboard.starboardMessageId);
                        if (starboardMessage) {
                            this.deletedViaUnstar.push(existingStarboard);
                            this.messages = this.messages.filter((message) => message.starboardMessageId !== starboardMessage.id);
                            await starboardMessage.delete();
                            await existingStarboard.destroy();
                        }
                    }
                }
            }
        }
    }

    /**
     * Add a message to the starboard
     * @param reaction The MessageReaction that triggered the add
     * @param starboardChannel The starboard channel
     * @param originalChannel The message's original channel
     */
    async addToStarboard(reaction: MessageReaction, starboardChannel: TextChannel, originalChannel: TextChannel) {
        const message = reaction.message;
        const author = originalChannel.guild.member(message.author);
        if (author) {
            const embed = new MessageEmbed();
            embed.addField("Stars", `${reaction.count} ⭐ <#${originalChannel.id}>`);
            embed.setAuthor(author.displayName, author.user.displayAvatarURL());
            embed.setDescription(message.content);
            embed.addField("Source", `[Link](${message.url})`);
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
            embed.setTimestamp(Date.now());
            const starboardMessage = await starboardChannel.send(embed);
            const newStarboardMessage = await StarboardedMessage.create({
                originalMessageId: reaction.message.id,
                starboardMessageId: starboardMessage.id,
                removed: 0
            });
            this.messages.push(newStarboardMessage);
        }
    }

    /**
     * Update a starboard post
     * @param reaction The MessageReaction that triggered the update
     * @param starboardChannel The starboard channel
     * @param originalChannel The channel the message reacted to was from
     * @param starboardedMessage The existing starboard message entry
     */
    async updateInStarboard(reaction: MessageReaction, starboardChannel: TextChannel, originalChannel: TextChannel, starboardedMessage: StarboardedMessage) {
        const starboardMessage = await safelyFetchMessage(starboardChannel, starboardedMessage.starboardMessageId);
        if (starboardMessage) {
            const embed = starboardMessage.embeds[0] as MessageEmbed;
            const field = embed.fields?.[0];
            if (field) {
                field.value = `${reaction.count} ⭐ <#${originalChannel.id}>`;
                await starboardMessage.edit(embed);
            }
        }
    }

    /**
     * Fetch the channel id for the starboard channel
     * @param serverId The guild id to fetch the starboard channel for
     */
    async fetchStarboardChannel(serverId: string): Promise<string | null> {
        const starboardChannel  = await ConfigProperty.getServerProperty(
            "starboard.channel",
            serverId
        );
        if (starboardChannel?.value) {
            return starboardChannel.value;
        } else {
            return null;
        }
    }

    /**
     * Fetch the required number of stars for the starboard
     * @param serverId The guild id to fetch the number of stars required for the starboard
     */
    async fetchStarboardRequiredCount(serverId: string): Promise<string | null> {
        const starboardRequiredCount  = await ConfigProperty.getServerProperty(
            "starboard.required.count",
            serverId
        );
        if (starboardRequiredCount?.value) {
            return starboardRequiredCount.value;
        } else {
            return null;
        }
    }

    /**
     * Get if a filename is an image
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
}