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
import {Client, DMChannel, Message} from "discord.js"
import {Command} from "./Command";
import {Big} from "./Big";

const Melo = require("./Melo");
const Food = require("./Food");
const FoodSpecials = require("./FoodSpecials");
const Mod = require("./Mod");
const EmojiRole = require("./EmojiRole");
const Courses = require("./Courses");
const Bus = require("./Bus");
const EmojiTop = require("./EmojiTop");
const Pin = require("./Pin");
const StringUtil = require("../utils/StringUtil");
const PREFIX = "-";

class CommandRegistry {
    private registry: Command[] = [];
    constructor(init: boolean = true) {
        if (init) {
            this.registry.push(new Melo());
            this.registry.push(new Food());
            this.registry.push(new FoodSpecials());
            this.registry.push(new Mod());
            this.registry.push(new EmojiRole());
            this.registry.push(new Courses());
            this.registry.push(new Bus());
            this.registry.push(new Big());
            this.registry.push(new EmojiTop());
            this.registry.push(new Pin());
        }
    }

    runCommands(client: Client, messageEvent: Message) {
        if (messageEvent.author.bot) {
            return;
        }
        this.registry.forEach(async (command: Command) => {
            // TODO: Make string of IFs less hideous
            if (!(messageEvent.channel instanceof DMChannel)) {
                const prohibitedChannels = await command.getProhibitedChannels(messageEvent.channel.guild.id);
                if (!prohibitedChannels.includes(messageEvent.channel.id)) {
                    if (messageEvent.content.toLowerCase().startsWith(`${PREFIX}${command.getCommand()}`)) {
                        if (messageEvent.member && messageEvent.member.hasPermission(command.getRequiredPermission())) {
                            const args = messageEvent.content.trim().split(" ").slice(1);
                            command.useCommand(client, messageEvent, StringUtil.removeEmptyArgs(args));
                        }
                    }
                }
            }
        });
    }
}

module.exports = CommandRegistry;