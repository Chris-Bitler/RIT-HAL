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