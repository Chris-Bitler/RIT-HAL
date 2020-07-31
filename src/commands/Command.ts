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
import { Client, Message, Permissions } from "discord.js"

export class Command {
    /**
     * The function called when a command is used
     * @param {Client} client The discord.js client
     * @param {Message} evt The message event from discord.js
     * @param {string[]} args Arguments given with the command
     */
    async useCommand(client: Client, evt: Message, args: string[]) {
        throw new Error("You need to implement useCommand");
    }

    /**
     * Get the textual version of the command minus prefix
     */
    getCommand(): string {
        throw new Error("You need to implement getCommand");
    }

    /**
     * Get the permission required to use the command
     */
    getRequiredPermission(): number {
        // TODO: Is this the correct default permission?
        // Should be since they need to view the channel to use the command..
        return Permissions.FLAGS.VIEW_CHANNEL;
    }

    /**
     * Get the list of channel IDs that this command can't be used in
     */
    async getProhibitedChannels(guildId: string): Promise<string[]> {
        return [];
    }
}