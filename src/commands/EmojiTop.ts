import {Command} from "./Command";
import {getTopEmojis} from "../processors/EmojiProcessor";
import {Message, Client} from "discord.js";

// TODO: Configurable
const PROHIBITED_CHANNELS = ["401908664018927628"];

export class EmojiTop extends Command {
    async useCommand(client: Client, evt: Message) {
        await getTopEmojis(evt);
    }

    getCommand() {
        return "emojitop";
    }

    getConfigBase(): string {
        return "emojitop"
    }
}