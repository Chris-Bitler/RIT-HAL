import {Message, TextChannel} from "discord.js";

export const safelyFetchMessage = async (channel: TextChannel, messageId: string): Promise<Message | null> => {
    try {
        return await channel.messages.fetch(messageId)
    } catch (err) {
        return null;
    }
}