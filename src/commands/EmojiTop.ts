/**
 * This file is part of RIT-HAL.
 *
 * RIT-HAL is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * RIT-HAL is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with RIT-HAL.  If not, see <https://www.gnu.org/licenses/>.
 */

import {Command} from "./Command";
import {getTopEmojis} from "../processors/EmojiProcessor";
import { ConfigProperty } from "../models/ConfigProperty";
import {Message, Client} from "discord.js";

// TODO: Configurable
const PROHIBITED_CHANNELS = ["401908664018927628"];

class EmojiTop extends Command {
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

module.exports = EmojiTop;