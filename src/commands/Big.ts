import {Command} from "./Command";
import {Client, Message, MessageAttachment} from "discord.js";
import {getEmojiExtension} from "../utils/EmojiUtil";

export class Big extends Command {
    async useCommand(client: Client, evt: Message, args: string[]) {
        if (args.length >= 1) {
            console.log(args[0]);
            const trimmed = args[0].replace("<", "").replace(">", "");
            const split = trimmed.split(":");
            if (split.length === 3) {
                const emojiID = split[2];
                try {
                    const url = await getEmojiExtension(emojiID);
                    const attachment = new MessageAttachment(url);
                    evt.channel.send(attachment);
                } catch (error) {
                    evt.channel.send("No valid emoji detected");
                }
            } else {
                evt.channel.send("No valid emoji detected");
            }
        } else {
            evt.channel.send("Please use an emoji to embiggen");
        }
    }

    getCommand() {
        return "big";
    }
}