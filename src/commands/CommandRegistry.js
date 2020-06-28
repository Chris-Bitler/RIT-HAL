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

const Melo = require("./Melo");
const Food = require("./Food");
const FoodSpecials = require("./FoodSpecials");
const Mod = require("./Mod");
const EmojiRole = require("./EmojiRole");
const Courses = require("./Courses");
const Bus = require("./Bus");
const Big = require("./Big");
const EmojiTop = require("./EmojiTop");
const StringUtil = require("../utils/StringUtil");
const PREFIX = "-";

class CommandRegistry {
    constructor(init = true) {
        this._registry = [];
        if (init) {
            this._registry.push(new Melo());
            this._registry.push(new Food());
            this._registry.push(new FoodSpecials());
            this._registry.push(new Mod());
            this._registry.push(new EmojiRole());
            this._registry.push(new Courses());
            this._registry.push(new Bus());
            this._registry.push(new Big());
            this._registry.push(new EmojiTop());
        }
    }

    runCommands(client, messageEvent) {
        if (messageEvent.author.bot) {
            return;
        }
        this._registry.forEach((command) => {
            if(messageEvent.content.toLowerCase().startsWith(`${PREFIX}${command.getCommand()}`)) {
                if(
                    (command.getRequiredPermission()
                        && (messageEvent.member && messageEvent.member.permissions.has(command.getRequiredPermission()))
                    ) || !command.getRequiredPermission()
                ) {
                    const args = messageEvent.content.trim().split(" ").slice(1);
                    command.useCommand(client, messageEvent, StringUtil.removeEmptyArgs(args));
                }
            }
        });
    }
}

module.exports = CommandRegistry;