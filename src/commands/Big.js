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

const Command = require("./Command");
const { MessageAttachment } = require("discord.js");
const EmojiUtil = require("../utils/EmojiUtil");

class Big extends Command {
    useCommand(client, evt, args) {
        if (args.length >= 1) {
            console.log(args[0]);
            const trimmed = args[0].replace("<", "").replace(">", "");
            const split = trimmed.split(":");
            if (split.length === 3) {
                const emojiID = split[2];
                EmojiUtil.getEmojiExtension(emojiID).then((url) => {
                    const attachment = new MessageAttachment(url);
                    evt.channel.send(attachment);
                }).catch(() => evt.channel.send("No valid emoji found"));
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

module.exports = Big;