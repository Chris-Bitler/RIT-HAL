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
import {Client, Message, TextChannel, Permissions, MessageEmbed} from "discord.js";
import {ArrivalTimes, BusRoute} from "../types/Bus";
import {ConfigProperty} from "../models/ConfigProperty";
import {Command} from "./Command";
import {
    getActiveRoutes,
    getArrivalTimes,
    getRouteByName,
    getRouteByNumber,
    refreshInformation
} from "../processors/BusProcessor";
import {mergeArgs} from "../utils/StringUtil";

const incorrectSyntaxMessage = "`Incorrect Syntax. Try -bus routes or -bus arrivals [route]`";

export class Bus extends Command {
    async useCommand(client: Client, evt: Message, args: string[]) {
        const sender = (evt.channel as TextChannel).guild.members.resolve(evt.author.id);
        if (sender) {
            if (args.length < 1) {
                evt.channel.send(incorrectSyntaxMessage);
                return;
            }

            switch (args[0].toLowerCase()) {
                case "routes":
                    this.showRoutes(client, evt);
                    break;
                case "arrivals":
                    this.showStops(client, evt, args);
                    break;
                case "forcerefresh":
                    this.forceRefresh(
                        (evt.channel as TextChannel),
                        sender.hasPermission(Permissions.FLAGS.KICK_MEMBERS)
                    );
                    break;
                default:
                    evt.channel.send(incorrectSyntaxMessage);
                    break;
            }
        }
    }

    getCommand() {
        return "bus";
    }

    async forceRefresh(channel: TextChannel, hasPerm: boolean) {
        if (hasPerm) {
            await refreshInformation();
            await channel.send("Forced refresh of bus information");
        }
    }

    showRoutes(client: Client, evt: Message) {
        const routes = getActiveRoutes();
        evt.channel.send(this.getRoutesEmbed(routes));
    }

    async showStops(client: Client, evt: Message, args: string[]) {
        if (args.length < 2) {
            evt.channel.send("`Incorrect Syntax. Try -bus arrivals [route]`");
            return;
        }

        const routeName = mergeArgs(1, args);
        let route: BusRoute|null;
        if (!isNaN(parseInt(routeName))) {
            route = getRouteByNumber(parseInt(routeName));
        } else {
            route = getRouteByName(routeName);
        }

        if (route) {
            try {
                const arrivals: ArrivalTimes = await getArrivalTimes(route);
                evt.channel.send(this.getArrivalsEmbed(route.long_name, arrivals));
            } catch (error) {
                console.log(error);
            }
        } else {
            evt.channel.send("Invalid Route. Note: These must match the names of the routes as per -bus routes, or you must use the number of the route.");
        }
    }

    getRoutesEmbed(routes: BusRoute[]) {
        let embed = new MessageEmbed()
            .setTitle("Active RIT Bus Routes");

        let routesString = "";
        let i = 1;
        routes.forEach(route => {
            routesString += `${i}. ${route.long_name}\n`;
            i++;
        });

        embed.addField("Routes", routesString);

        return embed;
    }

    getArrivalsEmbed(routeName: string, arrivals: ArrivalTimes) {
        let embed = new MessageEmbed()
            .setTitle(`${routeName} upcoming stops`);
        if (Object.keys(arrivals).length > 0) {
            Object.keys(arrivals).forEach(arrival => {
                embed.addField(arrival, arrivals[arrival][0].time);
            });
        } else {
            embed.addField("No results", "No arrival times retrieved. The bus may be stopped. Try again in a few minutes.");
        }

        return embed;
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