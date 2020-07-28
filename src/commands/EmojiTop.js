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
const EmojiProcessor = require("../processors/EmojiProcessor");
const PROHIBITED_CHANNELS = ["401908664018927628"];

class EmojiTop extends Command {
    useCommand(client, evt, args) {
        if (!PROHIBITED_CHANNELS.includes(evt.channel.id)) {
            EmojiProcessor.getTopEmojis(evt);
        }
    }

    getCommand() {
        return "emojitop";
    }
}

module.exports = EmojiTop;