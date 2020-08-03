import {Client, Message, TextChannel, Permissions, MessageEmbed} from "discord.js";
import {ArrivalTimes, BusRoute} from "../types/Bus";
import {Command} from "./Command";
import {mergeArgs} from "../utils/StringUtil";
import {BusProcessor} from "../processors/BusProcessor";

const incorrectSyntaxMessage = "`Incorrect Syntax. Try -bus routes or -bus arrivals [route]`";

/**
 * Command used to display various RIT bus related information
 */
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
                    this.showRoutes(evt);
                    break;
                case "arrivals":
                    await this.showStops(evt, args);
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

    getCommand(): string {
        return "bus";
    }

    /**
     * Force a refresh of the bus information and send a message
     * saying so
     * @param channel The channel the message was used in
     * @param hasPerm Whether or not the user had permission
     */
    async forceRefresh(channel: TextChannel, hasPerm: boolean): Promise<void> {
        if (hasPerm) {
            await this.busProcessor.refreshInformation();
            await channel.send("Forced refresh of bus information");
        }
    }

    /**
     * Get the active routes and show an embed in the channel
     * @param evt The message the command was sent in, used to get channel
     */
    showRoutes(evt: Message): void {
        const routes = this.busProcessor.getActiveRoutes();
        evt.channel.send(this.getRoutesEmbed(routes));
    }

    /**
     * Show the list of stops in the channel the command was used in
     *
     * @param evt The message from Discord.js
     * @param args The arguments provided with the command
     */
    async showStops(evt: Message, args: string[]): Promise<void> {
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

    /**
     * Get an embed showing the list of routes retrieved
     * @param routes The list of bus routes retrieved from the API
     */
    getRoutesEmbed(routes: BusRoute[]): MessageEmbed {
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

    /**
     * Get an embed to display the bus arrival times in the channel
     * @param routeName The name of the route to show the arrival times for
     * @param arrivals The list of arrival objects, containing stop names and times
     */
    getArrivalsEmbed(routeName: string, arrivals: ArrivalTimes): MessageEmbed {
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