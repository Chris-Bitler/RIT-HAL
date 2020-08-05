import { Command } from "./Command";
import { Client, Message, MessageAttachment } from "discord.js";
import { getEmojiExtension } from "../utils/EmojiUtil";
import { getErrorEmbed } from "../utils/EmbedUtil";

/**
 * Used to show a larger version of an emoji in the channel
 */
export class Big extends Command {
  async useCommand(
    client: Client,
    evt: Message,
    args: string[]
  ): Promise<void> {
    if (args.length >= 1) {
      const trimmed = args[0].replace("<", "").replace(">", "");
      const split = trimmed.split(":");
      if (split.length === 3) {
        const emojiID = split[2];
        try {
          const url = await getEmojiExtension(emojiID);
          const attachment = new MessageAttachment(url);
          evt.channel.send(attachment);
        } catch (error) {
          evt.channel.send(getErrorEmbed("No valid emoji detected"));
        }
      } else {
        evt.channel.send(getErrorEmbed("No valid emoji detected"));
      }
    } else {
      evt.channel.send(getErrorEmbed("Please use an emoji to embiggen"));
    }
  }

  getCommand(): string {
    return "big";
  }
}
