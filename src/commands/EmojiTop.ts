import { Command } from "./Command";
import { EmojiProcessor } from "../processors/EmojiProcessor";
import { Message, Client } from "discord.js";

/**
 * Command to list an embed of the top 10 most used emojis in the server
 */
export class EmojiTop extends Command {
    emojiProcessor: EmojiProcessor = EmojiProcessor.getInstance();

    async useCommand(client: Client, evt: Message): Promise<void> {
        await this.emojiProcessor.getTopEmojis(evt);
    }

    getCommand(): string {
        return "emojitop";
    }

    getConfigBase(): string {
        return "emojitop";
    }
}
