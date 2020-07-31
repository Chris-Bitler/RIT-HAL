import {Command} from "./Command";
import {getTopEmojis} from "../processors/EmojiProcessor";
import { ConfigProperty } from "../models/ConfigProperty";
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

    async getProhibitedChannels(guildId: string): Promise<string[]> {
        const prohibitedChannelsJSON = await ConfigProperty.getServerProperty("bus.prohibited", guildId);
        if (prohibitedChannelsJSON?.value) {
            return (JSON.parse(prohibitedChannelsJSON?.value) as string[])
        } else {
            return []
        }
    }
}