import {Client, Message, TextChannel, Permissions, MessageEmbed} from "discord.js";
import {ArrivalTimes, BusRoute} from "../types/Bus";
import {ConfigProperty} from "../models/ConfigProperty";
import {Command} from "./Command";
import {mergeArgs} from "../utils/StringUtil";
import {BusProcessor} from "../processors/BusProcessor";

const incorrectSyntaxMessage = "`Incorrect Syntax. Try -bus routes or -bus arrivals [route]`";

export class Bus extends Command {
    busProcessor: BusProcessor = BusProcessor.getInstance();
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
                    await this.showStops(client, evt, args);
                    break;
                case "forcerefresh":
                    await this.forceRefresh(
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
            await this.busProcessor.refreshInformation();
            await channel.send("Forced refresh of bus information");
        }
    }

    showRoutes(client: Client, evt: Message) {
        const routes = this.busProcessor.getActiveRoutes();
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
            route = this.busProcessor.getRouteByNumber(parseInt(routeName));
        } else {
            route = this.busProcessor.getRouteByName(routeName);
        }

        if (route) {
            try {
                const arrivals: ArrivalTimes = await this.busProcessor.getArrivalTimes(route);
                evt.channel.send(this.getArrivalsEmbed(route.long_name, arrivals));
            } catch (error) {
                console.log(error);
            }
        } else {
            evt.channel.send("Invalid Route. Note: These must match the names of the routes as per -bus routes, or you must use the number of the route.");
        }
    }

    getRoutesEmbed(routes: BusRoute[]) {
        const embed = new MessageEmbed()
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
        const embed = new MessageEmbed()
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

    getConfigBase(): string {
        return "bus";
    }
}