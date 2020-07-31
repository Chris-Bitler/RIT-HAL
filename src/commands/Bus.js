const Command = require("./Command");
const BusProcessor = require("../processors/BusProcessor");
const StringUtil = require("../utils/StringUtil");
const Discord = require("discord.js");

const PROHIBITED_CHANNELS = ["401908664018927628"];
const incorrectSyntaxMessage = "`Incorrect Syntax. Try -bus routes or -bus arrivals [route]`";

class Bus extends Command {
    useCommand(client, evt, args) {
        const sender = evt.channel.guild.members.resolve(evt.author.id);
        if(
            !PROHIBITED_CHANNELS.includes(evt.channel.id) || (sender.permissions.has(Discord.Permissions.FLAGS.KICK_MEMBERS))
        ) {
            if (args.length < 1) {
                evt.channel.send(incorrectSyntaxMessage);
                return;
            }

            switch(args[0].toLowerCase()) {
                case "routes":
                    this.showRoutes(client, evt, args);
                    break;
                case "arrivals":
                    this.showStops(client, evt, args);
                    break;
                case "forcerefresh":
                    this.forceRefresh(evt.channel, sender.permissions.has(Discord.Permissions.FLAGS.KICK_MEMBERS));
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

    forceRefresh(channel, hasPerm) {
        if (hasPerm) {
            BusProcessor.refreshInformation();
            channel.send("Forced refresh of bus information");
        }
    }

    showRoutes(client, evt, args) {
        const routes = BusProcessor.getActiveRoutes();
        evt.channel.send(this.getRoutesEmbed(routes));
    }

    showStops(client, evt, args) {
        if (args.length < 2) {
            evt.channel.send("`Incorrect Syntax. Try -bus arrivals [route]`");
            return;
        }
        const routeName = StringUtil.mergeArgs(1, args);
        let route;
        if (!isNaN(routeName)) {
            route = BusProcessor.getRouteByNumber(parseInt(routeName));
        } else {
            route = BusProcessor.getRouteByName(routeName);
        }
        if (route) {
            BusProcessor.getArrivalTimes(route).then(arrivals => {
                evt.channel.send(this.getArrivalsEmbed(route.long_name, arrivals));
            }).catch(console.log);
        } else {
            evt.channel.send("Invalid Route. Note: These must match the names of the routes as per -bus routes, or you must use the number of the route.");
        }
    }

    getRoutesEmbed(routes) {
        let embed = new Discord.MessageEmbed()
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

    getArrivalsEmbed(routeName, arrivals) {
        let embed = new Discord.MessageEmbed()
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
}

module.exports = Bus;